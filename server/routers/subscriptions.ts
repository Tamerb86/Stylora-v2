import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getAvailablePlans,
  getSubscriptionStatus,
  createCheckoutSession,
  createBillingPortalSession,
  cancelSubscription,
  changePlan,
} from "../services/subscriptionService";

/**
 * Subscriptions Router
 * Handles subscription management endpoints
 */

// Middleware to ensure user has tenant access
const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user.tenantId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No tenant access",
      data: { messageKey: "errors.noTenantAccess" },
    });
  }

  return next({
    ctx: {
      ...ctx,
      tenantId: ctx.user.tenantId,
    },
  });
});

export const subscriptionsRouter = router({
  /**
   * Get all available subscription plans
   * Public endpoint for pricing page
   */
  getPlans: publicProcedure.query(async () => {
    return await getAvailablePlans();
  }),

  /**
   * Get current subscription for tenant
   */
  getCurrentSubscription: tenantProcedure.query(async ({ ctx }) => {
    return await getSubscriptionStatus(ctx.tenantId);
  }),

  /**
   * Create Stripe Checkout session to start subscription
   */
  createCheckoutSession: tenantProcedure
    .input(
      z.object({
        planId: z.number().int().positive(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createCheckoutSession({
        tenantId: ctx.tenantId,
        planId: input.planId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });
    }),

  /**
   * Create Stripe Billing Portal session for managing subscription
   */
  createPortalSession: tenantProcedure
    .input(
      z.object({
        returnUrl: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await createBillingPortalSession(ctx.tenantId, input.returnUrl);
    }),

  /**
   * Cancel subscription at end of billing period
   */
  cancelSubscription: tenantProcedure.mutation(async ({ ctx }) => {
    // Only allow admins/owners to cancel subscription
    if (ctx.user.role !== "owner" && ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only admins can cancel subscriptions",
        data: { messageKey: "errors.adminOnly" },
      });
    }

    await cancelSubscription(ctx.tenantId);

    return { success: true };
  }),

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  changePlan: tenantProcedure
    .input(
      z.object({
        newPlanId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow admins/owners to change plans
      if (ctx.user.role !== "owner" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can change subscription plans",
          data: { messageKey: "errors.adminOnly" },
        });
      }

      await changePlan(ctx.tenantId, input.newPlanId);

      return { success: true };
    }),
});
