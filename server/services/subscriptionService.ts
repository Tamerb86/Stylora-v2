import { stripe } from "../stripe";
import { getDb } from "../db";
import { subscriptionPlans, tenantSubscriptions, tenants } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";

/**
 * Subscription Service
 * Manages Stripe Billing integration for tenant subscriptions
 */

interface CreateCheckoutSessionParams {
  tenantId: string;
  planId: number;
  successUrl: string;
  cancelUrl: string;
}

interface SubscriptionStatus {
  subscription: typeof tenantSubscriptions.$inferSelect | null;
  plan: typeof subscriptionPlans.$inferSelect | null;
  isActive: boolean;
  daysUntilRenewal: number | null;
}

/**
 * Create or get Stripe customer for tenant
 */
export async function createStripeCustomer(
  tenantId: string,
  email: string
): Promise<string> {
  if (!stripe) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Check if customer already exists
  const [existingSub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (existingSub?.stripeCustomerId) {
    return existingSub.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      tenantId,
    },
  });

  return customer.id;
}

/**
 * Create Stripe Checkout Session for subscription
 */
export async function createCheckoutSession({
  tenantId,
  planId,
  successUrl,
  cancelUrl,
}: CreateCheckoutSessionParams): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Get plan details
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.id, planId), eq(subscriptionPlans.isActive, true)))
    .limit(1);

  if (!plan) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Plan not found or inactive",
    });
  }

  if (!plan.stripePriceId) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Plan does not have a Stripe Price ID configured",
    });
  }

  // Get tenant details for email
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  if (!tenant) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Tenant not found",
    });
  }

  // Get or create customer
  const customerId = await createStripeCustomer(tenantId, tenant.email || "");

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId,
      planId: planId.toString(),
    },
    subscription_data: {
      metadata: {
        tenantId,
        planId: planId.toString(),
      },
    },
  });

  if (!session.url) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create checkout session",
    });
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

/**
 * Create Stripe Billing Portal session for managing subscription
 */
export async function createBillingPortalSession(
  tenantId: string,
  returnUrl: string
): Promise<{ url: string }> {
  if (!stripe) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Get subscription with customer ID
  const [subscription] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (!subscription?.stripeCustomerId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active subscription found",
    });
  }

  // Create portal session
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: returnUrl,
  });

  return {
    url: session.url,
  };
}

/**
 * Get subscription status for tenant
 */
export async function getSubscriptionStatus(
  tenantId: string
): Promise<SubscriptionStatus> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Get subscription
  const [subscription] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (!subscription) {
    return {
      subscription: null,
      plan: null,
      isActive: false,
      daysUntilRenewal: null,
    };
  }

  // Get plan details
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);

  // Calculate days until renewal
  const currentPeriodEnd = new Date(subscription.currentPeriodEnd);
  const now = new Date();
  const daysUntilRenewal = Math.ceil(
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    subscription,
    plan: plan || null,
    isActive: subscription.status === "active",
    daysUntilRenewal,
  };
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(tenantId: string): Promise<void> {
  if (!stripe) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Get subscription
  const [subscription] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (!subscription?.stripeSubscriptionId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active subscription found",
    });
  }

  // Cancel at period end in Stripe
  await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  // Update database
  await db
    .update(tenantSubscriptions)
    .set({
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
    })
    .where(eq(tenantSubscriptions.tenantId, tenantId));
}

/**
 * Upgrade or downgrade subscription plan
 */
export async function changePlan(
  tenantId: string,
  newPlanId: number
): Promise<void> {
  if (!stripe) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Stripe is not configured",
    });
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Get current subscription
  const [currentSub] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (!currentSub?.stripeSubscriptionId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "No active subscription found",
    });
  }

  // Get new plan details
  const [newPlan] = await db
    .select()
    .from(subscriptionPlans)
    .where(and(eq(subscriptionPlans.id, newPlanId), eq(subscriptionPlans.isActive, true)))
    .limit(1);

  if (!newPlan?.stripePriceId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "New plan not found or inactive",
    });
  }

  // Get Stripe subscription
  const stripeSubscription = await stripe.subscriptions.retrieve(
    currentSub.stripeSubscriptionId
  );

  // Update subscription in Stripe
  await stripe.subscriptions.update(currentSub.stripeSubscriptionId, {
    items: [
      {
        id: stripeSubscription.items.data[0].id,
        price: newPlan.stripePriceId,
      },
    ],
    proration_behavior: "create_prorations", // Prorate the difference
  });

  // Update database
  await db
    .update(tenantSubscriptions)
    .set({
      planId: newPlanId,
    })
    .where(eq(tenantSubscriptions.tenantId, tenantId));
}

/**
 * Get all available subscription plans
 */
export async function getAvailablePlans(): Promise<
  (typeof subscriptionPlans.$inferSelect)[]
> {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  const plans = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.isActive, true));

  return plans;
}

/**
 * Handle subscription update from webhook
 */
export async function handleSubscriptionUpdate(
  subscription: Stripe.Subscription
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tenantId = subscription.metadata.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID not found in subscription metadata");
  }

  const planId = parseInt(subscription.metadata.planId || "0");
  if (!planId) {
    throw new Error("Plan ID not found in subscription metadata");
  }

  // Map Stripe status to our status
  let status: "active" | "past_due" | "canceled" | "paused" = "active";
  if (subscription.status === "past_due") {
    status = "past_due";
  } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
    status = "canceled";
  } else if (subscription.status === "paused") {
    status = "paused";
  }

  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Check if subscription exists
  const [existing] = await db
    .select()
    .from(tenantSubscriptions)
    .where(eq(tenantSubscriptions.tenantId, tenantId))
    .limit(1);

  if (existing) {
    // Update existing subscription
    await db
      .update(tenantSubscriptions)
      .set({
        planId,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        canceledAt: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000)
          : null,
      })
      .where(eq(tenantSubscriptions.tenantId, tenantId));
  } else {
    // Create new subscription
    await db.insert(tenantSubscriptions).values({
      tenantId,
      planId,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: subscription.customer as string,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
    });
  }

  // Update tenant status
  await db
    .update(tenants)
    .set({
      status: status === "active" ? "active" : status === "canceled" ? "canceled" : "suspended",
    })
    .where(eq(tenants.id, tenantId));
}

/**
 * Handle subscription deletion from webhook
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const tenantId = subscription.metadata.tenantId;
  if (!tenantId) {
    throw new Error("Tenant ID not found in subscription metadata");
  }

  // Update subscription status
  await db
    .update(tenantSubscriptions)
    .set({
      status: "canceled",
      canceledAt: new Date(),
    })
    .where(eq(tenantSubscriptions.tenantId, tenantId));

  // Update tenant status
  await db
    .update(tenants)
    .set({
      status: "canceled",
    })
    .where(eq(tenants.id, tenantId));
}
