import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { stripeService, StripeServiceError } from '../services/stripe.service.js';
import { verifyWebhookSignature, handleWebhookEvent } from '../services/stripe.webhook.js';
import { success, error, validationError } from '../utils/response.js';

const router = Router();

// Validation schemas
const createCheckoutSchema = z.object({
  plan_code: z.enum(['pro', 'business']),
  success_url: z.string().url().optional(),
  cancel_url: z.string().url().optional(),
});

const createPortalSchema = z.object({
  return_url: z.string().url().optional(),
});

/**
 * POST /api/v1/stripe/webhook
 * Handle Stripe webhook events (no auth required, uses signature verification)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json(error('Missing Stripe signature', 'MISSING_SIGNATURE'));
  }

  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature);

    // Handle the event
    await handleWebhookEvent(event);

    return res.status(200).json({ received: true });

  } catch (err) {
    console.error('Webhook error:', err);
    
    if (err instanceof Error && err.message.includes('signature')) {
      return res.status(400).json(error('Invalid signature', 'INVALID_SIGNATURE'));
    }

    return res.status(500).json(error('Webhook processing failed', 'WEBHOOK_ERROR'));
  }
});

// All routes below require authentication
router.use(authMiddleware);

/**
 * POST /api/v1/stripe/checkout
 * Create Stripe Checkout Session for subscription
 */
router.post('/checkout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validation = createCheckoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(
        validationError(validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })))
      );
    }

    const { plan_code, success_url, cancel_url } = validation.data;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create checkout session
    const checkoutUrl = await stripeService.createCheckoutSession({
      userId: req.user!.id,
      planCode: plan_code,
      successUrl: success_url || `${frontendUrl}/dashboard/billing?success=true`,
      cancelUrl: cancel_url || `${frontendUrl}/dashboard/billing?canceled=true`,
    });

    return res.status(200).json(success({
      checkout_url: checkoutUrl,
    }, 'Checkout session created'));

  } catch (err) {
    console.error('Create checkout error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to create checkout session', 'CHECKOUT_ERROR'));
  }
});

/**
 * POST /api/v1/stripe/portal
 * Create Stripe Customer Portal Session
 */
router.post('/portal', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validation = createPortalSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(
        validationError(validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })))
      );
    }

    const { return_url } = validation.data;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create portal session
    const portalUrl = await stripeService.createPortalSession({
      userId: req.user!.id,
      returnUrl: return_url || `${frontendUrl}/dashboard/billing`,
    });

    return res.status(200).json(success({
      portal_url: portalUrl,
    }, 'Portal session created'));

  } catch (err) {
    console.error('Create portal error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to create portal session', 'PORTAL_ERROR'));
  }
});

/**
 * GET /api/v1/stripe/subscription
 * Get current subscription info
 */
router.get('/subscription', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriptionInfo = await stripeService.getSubscriptionInfo(req.user!.id);

    if (!subscriptionInfo) {
      return res.status(200).json(success({
        has_subscription: false,
        plan_code: 'free',
      }));
    }

    return res.status(200).json(success({
      has_subscription: true,
      subscription: {
        id: subscriptionInfo.id,
        status: subscriptionInfo.status,
        plan_code: subscriptionInfo.planCode,
        current_period_start: subscriptionInfo.currentPeriodStart.toISOString(),
        current_period_end: subscriptionInfo.currentPeriodEnd.toISOString(),
        cancel_at_period_end: subscriptionInfo.cancelAtPeriodEnd,
      },
    }));

  } catch (err) {
    console.error('Get subscription error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to get subscription', 'SUBSCRIPTION_ERROR'));
  }
});

/**
 * POST /api/v1/stripe/cancel
 * Cancel subscription at period end
 */
router.post('/cancel', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await stripeService.cancelSubscription(req.user!.id);

    return res.status(200).json(success(null, 'Subscription will be canceled at the end of the billing period'));

  } catch (err) {
    console.error('Cancel subscription error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to cancel subscription', 'CANCEL_ERROR'));
  }
});

/**
 * POST /api/v1/stripe/resume
 * Resume a canceled subscription
 */
router.post('/resume', async (req: AuthenticatedRequest, res: Response) => {
  try {
    await stripeService.resumeSubscription(req.user!.id);

    return res.status(200).json(success(null, 'Subscription resumed successfully'));

  } catch (err) {
    console.error('Resume subscription error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to resume subscription', 'RESUME_ERROR'));
  }
});

/**
 * GET /api/v1/stripe/plans
 * Get available plans with prices
 */
router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await stripeService.getPlansWithPrices();

    return res.status(200).json(success({
      plans: plans.map(plan => ({
        code: plan.code,
        name: plan.name,
        monthly_limit: plan.monthlyLimit,
        price: plan.price,
        currency: plan.currency,
        is_free: plan.code === 'free',
      })),
    }));

  } catch (err) {
    console.error('Get plans error:', err);
    return res.status(500).json(error('Failed to get plans', 'PLANS_ERROR'));
  }
});

export default router;
