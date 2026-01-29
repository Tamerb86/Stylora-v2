import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { plans } from '../db/schema.js';
import { success, error } from '../utils/response.js';

const router = Router();

/**
 * GET /api/v1/plans
 * Get all available plans with limits (public endpoint)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Get all plans from database
    const allPlans = await db.select().from(plans);

    // Format response
    const formattedPlans = allPlans.map(plan => ({
      code: plan.code,
      name: plan.name,
      monthly_limit_requests: plan.monthlyLimitRequests,
      is_unlimited: plan.monthlyLimitRequests === null || plan.monthlyLimitRequests === -1,
      features: getPlanFeatures(plan.code),
      recommended: plan.code === 'pro',
    }));

    return res.status(200).json(success({
      plans: formattedPlans,
    }));

  } catch (err) {
    console.error('Get plans error:', err);
    return res.status(500).json(error('Failed to get plans', 'PLANS_ERROR'));
  }
});

/**
 * GET /api/v1/plans/:code
 * Get specific plan details
 */
router.get('/:code', async (req: Request, res: Response) => {
  try {
    const planCode = req.params.code;

    // Get all plans and find the requested one
    const allPlans = await db.select().from(plans);
    const plan = allPlans.find(p => p.code === planCode);

    if (!plan) {
      return res.status(404).json(error('Plan not found', 'NOT_FOUND'));
    }

    return res.status(200).json(success({
      code: plan.code,
      name: plan.name,
      monthly_limit_requests: plan.monthlyLimitRequests,
      is_unlimited: plan.monthlyLimitRequests === null || plan.monthlyLimitRequests === -1,
      features: getPlanFeatures(plan.code),
      stripe_price_id: plan.stripePriceId,
    }));

  } catch (err) {
    console.error('Get plan error:', err);
    return res.status(500).json(error('Failed to get plan', 'PLAN_ERROR'));
  }
});

/**
 * Helper function to get plan features
 */
function getPlanFeatures(planCode: string): string[] {
  const features: Record<string, string[]> = {
    free: [
      '10 content generations per month',
      'Basic TikTok scripts',
      'Standard hooks & captions',
      '20 hashtags per generation',
      'Email support',
    ],
    pro: [
      '100 content generations per month',
      'Advanced TikTok scripts',
      'Multiple creative angles',
      'Platform-specific optimization',
      'All languages supported',
      'Priority support',
      'Content history',
    ],
    business: [
      'Unlimited content generations',
      'Premium TikTok scripts',
      'All creative angles & hooks',
      'Multi-platform support',
      'All languages & tones',
      'API access',
      'Dedicated support',
      'Team collaboration (coming soon)',
    ],
  };

  return features[planCode] || [];
}

export default router;
