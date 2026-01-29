import Stripe from 'stripe';
import { db } from '../db/index.js';
import { users, plans, subscriptions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Initialize Stripe
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new StripeServiceError(
      'STRIPE_SECRET_KEY is not configured',
      'MISSING_API_KEY',
      500
    );
  }

  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

// Plan code to Stripe Price ID mapping
function getPriceIdForPlan(planCode: string): string | null {
  const priceMapping: Record<string, string | undefined> = {
    'pro': process.env.STRIPE_PRICE_ID_PRO,
    'business': process.env.STRIPE_PRICE_ID_BUSINESS,
  };

  return priceMapping[planCode] || null;
}

// Custom error class
export class StripeServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'StripeServiceError';
  }
}

// Types
export interface CreateCheckoutSessionInput {
  userId: number;
  planCode: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CreatePortalSessionInput {
  userId: number;
  returnUrl: string;
}

export interface SubscriptionInfo {
  id: string;
  status: string;
  planCode: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

class StripeService {
  /**
   * Create or get Stripe customer for a user
   */
  async getOrCreateCustomer(userId: number): Promise<string> {
    const stripe = getStripeClient();

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new StripeServiceError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Check if user already has a Stripe customer ID
    const [existingSubscription] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existingSubscription?.stripeCustomerId) {
      return existingSubscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name || undefined,
      metadata: {
        userId: userId.toString(),
        supabaseUid: user.supabaseUid,
      },
    });

    return customer.id;
  }

  /**
   * Create Stripe Checkout Session for subscription
   */
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<string> {
    const stripe = getStripeClient();

    // Get price ID for the plan
    const priceId = getPriceIdForPlan(input.planCode);
    if (!priceId) {
      throw new StripeServiceError(
        `No Stripe price configured for plan: ${input.planCode}`,
        'INVALID_PLAN',
        400
      );
    }

    // Get or create customer
    const customerId = await this.getOrCreateCustomer(input.userId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${input.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl,
      metadata: {
        userId: input.userId.toString(),
        planCode: input.planCode,
      },
      subscription_data: {
        metadata: {
          userId: input.userId.toString(),
          planCode: input.planCode,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    if (!session.url) {
      throw new StripeServiceError(
        'Failed to create checkout session',
        'CHECKOUT_ERROR',
        500
      );
    }

    return session.url;
  }

  /**
   * Create Stripe Customer Portal Session
   */
  async createPortalSession(input: CreatePortalSessionInput): Promise<string> {
    const stripe = getStripeClient();

    // Get customer ID
    const [subscription] = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, input.userId))
      .limit(1);

    if (!subscription?.stripeCustomerId) {
      throw new StripeServiceError(
        'No subscription found for user',
        'NO_SUBSCRIPTION',
        404
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: input.returnUrl,
    });

    return session.url;
  }

  /**
   * Get subscription info for a user
   */
  async getSubscriptionInfo(userId: number): Promise<SubscriptionInfo | null> {
    const stripe = getStripeClient();

    // Get subscription from database
    const [subscription] = await db
      .select({
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        status: subscriptions.status,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        planCode: plans.code,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeSubscriptionId) {
      return null;
    }

    // Get fresh data from Stripe
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      return {
        id: stripeSubscription.id,
        status: stripeSubscription.status,
        planCode: subscription.planCode,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      };
    } catch {
      // Return database data if Stripe call fails
      return {
        id: subscription.stripeSubscriptionId,
        status: subscription.status,
        planCode: subscription.planCode,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: false,
      };
    }
  }

  /**
   * Cancel subscription at period end
   */
  async cancelSubscription(userId: number): Promise<void> {
    const stripe = getStripeClient();

    // Get subscription
    const [subscription] = await db
      .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1);

    if (!subscription?.stripeSubscriptionId) {
      throw new StripeServiceError(
        'No active subscription found',
        'NO_SUBSCRIPTION',
        404
      );
    }

    // Cancel at period end
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Resume cancelled subscription
   */
  async resumeSubscription(userId: number): Promise<void> {
    const stripe = getStripeClient();

    // Get subscription
    const [subscription] = await db
      .select({ stripeSubscriptionId: subscriptions.stripeSubscriptionId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (!subscription?.stripeSubscriptionId) {
      throw new StripeServiceError(
        'No subscription found',
        'NO_SUBSCRIPTION',
        404
      );
    }

    // Resume subscription
    await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });
  }

  /**
   * Get available plans with Stripe prices
   */
  async getPlansWithPrices(): Promise<Array<{
    code: string;
    name: string;
    monthlyLimit: number | null;
    priceId: string | null;
    price: number | null;
    currency: string | null;
  }>> {
    const stripe = getStripeClient();

    // Get plans from database
    const dbPlans = await db.select().from(plans);

    // Enrich with Stripe price info
    const enrichedPlans = await Promise.all(
      dbPlans.map(async (plan) => {
        const priceId = getPriceIdForPlan(plan.code);
        let price: number | null = null;
        let currency: string | null = null;

        if (priceId) {
          try {
            const stripePrice = await stripe.prices.retrieve(priceId);
            price = stripePrice.unit_amount ? stripePrice.unit_amount / 100 : null;
            currency = stripePrice.currency;
          } catch {
            // Price not found in Stripe
          }
        }

        return {
          code: plan.code,
          name: plan.name,
          monthlyLimit: plan.monthlyLimitRequests,
          priceId,
          price,
          currency,
        };
      })
    );

    return enrichedPlans;
  }
}

export const stripeService = new StripeService();
