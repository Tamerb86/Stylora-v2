import Stripe from 'stripe';
import { db } from '../db/index.js';
import { users, plans, subscriptions } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

// Initialize Stripe
function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

// Subscription status mapping
type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    'active': 'active',
    'canceled': 'canceled',
    'past_due': 'past_due',
    'trialing': 'trialing',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
    'unpaid': 'past_due',
    'paused': 'canceled',
  };
  return statusMap[status] || 'incomplete';
}

/**
 * Verify Stripe webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<void> {
  console.log(`📨 Stripe webhook received: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.log(`⚠️ Unhandled webhook event: ${event.type}`);
  }
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  console.log('✅ Checkout completed:', session.id);

  const userId = session.metadata?.userId;
  const planCode = session.metadata?.planCode;

  if (!userId || !planCode) {
    console.error('❌ Missing metadata in checkout session');
    return;
  }

  // Get plan from database
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    console.error(`❌ Plan not found: ${planCode}`);
    return;
  }

  // Check if subscription already exists
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, parseInt(userId)))
    .limit(1);

  if (existingSubscription) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set({
        planId: plan.id,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .where(eq(subscriptions.userId, parseInt(userId)));
  } else {
    // Create new subscription
    await db.insert(subscriptions).values({
      userId: parseInt(userId),
      planId: plan.id,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  console.log(`✅ Subscription created/updated for user ${userId} with plan ${planCode}`);
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  console.log('✅ Subscription created:', subscription.id);

  const userId = subscription.metadata?.userId;
  const planCode = subscription.metadata?.planCode;

  if (!userId || !planCode) {
    console.log('⚠️ Missing metadata, skipping subscription creation');
    return;
  }

  // Get plan
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.code, planCode))
    .limit(1);

  if (!plan) {
    console.error(`❌ Plan not found: ${planCode}`);
    return;
  }

  // Upsert subscription
  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, parseInt(userId)))
    .limit(1);

  if (existing) {
    await db
      .update(subscriptions)
      .set({
        planId: plan.id,
        stripeCustomerId: subscription.customer as string,
        stripeSubscriptionId: subscription.id,
        status: mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      })
      .where(eq(subscriptions.userId, parseInt(userId)));
  } else {
    await db.insert(subscriptions).values({
      userId: parseInt(userId),
      planId: plan.id,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    });
  }
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  console.log('🔄 Subscription updated:', subscription.id);

  // Find subscription by Stripe subscription ID
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!existingSubscription) {
    console.log('⚠️ Subscription not found in database');
    return;
  }

  // Get new plan if changed
  let newPlanId = existingSubscription.planId;
  const planCode = subscription.metadata?.planCode;
  
  if (planCode) {
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.code, planCode))
      .limit(1);
    
    if (plan) {
      newPlanId = plan.id;
    }
  }

  // Update subscription
  await db
    .update(subscriptions)
    .set({
      planId: newPlanId,
      status: mapStripeStatus(subscription.status),
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  console.log(`✅ Subscription ${subscription.id} updated to status: ${subscription.status}`);
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  console.log('❌ Subscription deleted:', subscription.id);

  // Find subscription
  const [existingSubscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1);

  if (!existingSubscription) {
    console.log('⚠️ Subscription not found in database');
    return;
  }

  // Get free plan
  const [freePlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.code, 'free'))
    .limit(1);

  if (!freePlan) {
    console.error('❌ Free plan not found');
    return;
  }

  // Downgrade to free plan
  await db
    .update(subscriptions)
    .set({
      planId: freePlan.id,
      status: 'canceled',
      stripeSubscriptionId: null,
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  console.log(`✅ User downgraded to free plan after subscription cancellation`);
}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  console.log('💰 Payment succeeded:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  // Update subscription period
  await db
    .update(subscriptions)
    .set({
      status: 'active',
      currentPeriodStart: invoice.period_start 
        ? new Date(invoice.period_start * 1000) 
        : new Date(),
      currentPeriodEnd: invoice.period_end 
        ? new Date(invoice.period_end * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  console.log('❌ Payment failed:', invoice.id);

  if (!invoice.subscription) {
    return;
  }

  // Update subscription status
  await db
    .update(subscriptions)
    .set({
      status: 'past_due',
    })
    .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));

  // TODO: Send email notification to user about failed payment
}
