import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { stripeService, StripeServiceError } from '../services/stripe.service.js';
import { verifyWebhookSignature, handleWebhookEvent } from '../services/stripe.webhook.js';
import { usageService } from '../services/usage.service.js';
import { success, error, validationError } from '../utils/response.js';

const router = Router();

// Validation schemas
const createCheckoutSessionSchema = z.object({
  plan_code: z.enum(['pro', 'business'], {
    errorMap: () => ({ message: 'plan_code must be "pro" or "business"' }),
  }),
});

/**
 * POST /api/v1/billing/webhook
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
 * POST /api/v1/billing/create-checkout-session
 * Create Stripe Checkout Session for subscription upgrade
 */
router.post('/create-checkout-session', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validation = createCheckoutSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(
        validationError(validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })))
      );
    }

    const { plan_code } = validation.data;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create checkout session
    const checkoutUrl = await stripeService.createCheckoutSession({
      userId: req.user!.id,
      planCode: plan_code,
      successUrl: `${frontendUrl}/dashboard/billing?success=true`,
      cancelUrl: `${frontendUrl}/dashboard/billing?canceled=true`,
    });

    return res.status(200).json(success({
      checkout_url: checkoutUrl,
    }, 'Checkout session created successfully'));

  } catch (err) {
    console.error('Create checkout session error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to create checkout session', 'CHECKOUT_ERROR'));
  }
});

/**
 * POST /api/v1/billing/create-portal-session
 * Create Stripe Customer Portal Session for managing subscription
 */
router.post('/create-portal-session', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Create portal session
    const portalUrl = await stripeService.createPortalSession({
      userId: req.user!.id,
      returnUrl: `${frontendUrl}/dashboard/billing`,
    });

    return res.status(200).json(success({
      portal_url: portalUrl,
    }, 'Portal session created successfully'));

  } catch (err) {
    console.error('Create portal session error:', err);

    if (err instanceof StripeServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to create portal session', 'PORTAL_ERROR'));
  }
});

/**
 * GET /api/v1/billing/subscription
 * Get current subscription status
 */
router.get('/subscription', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const subscriptionInfo = await stripeService.getSubscriptionInfo(req.user!.id);
    const usageStats = await usageService.getUsageStats(req.user!.id);

    if (!subscriptionInfo) {
      return res.status(200).json(success({
        has_subscription: false,
        plan_code: 'free',
        usage: {
          current_month_usage: usageStats.currentMonthUsage,
          monthly_limit: usageStats.monthlyLimit,
          remaining_requests: usageStats.remainingRequests,
        },
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
      usage: {
        current_month_usage: usageStats.currentMonthUsage,
        monthly_limit: usageStats.monthlyLimit,
        remaining_requests: usageStats.remainingRequests,
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
 * POST /api/v1/billing/cancel
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
 * POST /api/v1/billing/resume
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
 * GET /api/v1/billing/usage
 * Get detailed usage statistics
 */
router.get('/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await usageService.getUsageStats(req.user!.id);
    const history = await usageService.getUsageHistory(req.user!.id, 10);

    return res.status(200).json(success({
      current_month_usage: stats.currentMonthUsage,
      monthly_limit: stats.monthlyLimit,
      remaining_requests: stats.remainingRequests,
      is_within_limit: stats.isWithinLimit,
      plan_code: stats.planCode,
      period: {
        start: stats.periodStart.toISOString(),
        end: stats.periodEnd.toISOString(),
      },
      recent_usage: history.map(log => ({
        id: log.id,
        tokens_used: log.tokensUsed,
        request_time_ms: log.requestTimeMs,
        created_at: log.createdAt,
      })),
    }));

  } catch (err) {
    console.error('Get usage error:', err);
    return res.status(500).json(error('Failed to get usage statistics', 'USAGE_ERROR'));
  }
});

export default router;
