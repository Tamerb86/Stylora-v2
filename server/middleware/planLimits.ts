import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { tenantSubscriptions, subscriptionPlans, employees } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Plan Limits Middleware
 * Enforces subscription plan limits and feature gates
 */

export interface PlanLimits {
  maxEmployees: number | null;
  maxLocations: number | null;
  smsQuota: number | null;
  features: string[];
}

export interface SubscriptionInfo {
  planId: number;
  planName: string;
  limits: PlanLimits;
  isActive: boolean;
  isPastDue: boolean;
}

/**
 * Get subscription and plan limits for a tenant
 */
export async function getSubscriptionLimits(
  tenantId: string
): Promise<SubscriptionInfo | null> {
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
    return null;
  }

  // Get plan details
  const [plan] = await db
    .select()
    .from(subscriptionPlans)
    .where(eq(subscriptionPlans.id, subscription.planId))
    .limit(1);

  if (!plan) {
    return null;
  }

  return {
    planId: plan.id,
    planName: plan.name,
    limits: {
      maxEmployees: plan.maxEmployees,
      maxLocations: plan.maxLocations,
      smsQuota: plan.smsQuota,
      features: (plan.features as string[]) || [],
    },
    isActive: subscription.status === "active",
    isPastDue: subscription.status === "past_due",
  };
}

/**
 * Check if tenant can add more employees
 */
export async function canAddEmployee(tenantId: string): Promise<boolean> {
  const subscriptionInfo = await getSubscriptionLimits(tenantId);

  // No subscription or unlimited employees
  if (!subscriptionInfo || subscriptionInfo.limits.maxEmployees === null) {
    return true;
  }

  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  // Count current employees
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.tenantId, tenantId));

  const currentCount = result[0]?.count || 0;

  return currentCount < subscriptionInfo.limits.maxEmployees;
}

/**
 * Check if tenant has access to a specific feature
 */
export async function hasFeatureAccess(
  tenantId: string,
  featureName: string
): Promise<boolean> {
  const subscriptionInfo = await getSubscriptionLimits(tenantId);

  // No subscription = basic features only
  if (!subscriptionInfo) {
    // Define default free features
    const freeFeatures = ["appointments", "customers", "services"];
    return freeFeatures.includes(featureName);
  }

  // Check if feature is in plan
  return subscriptionInfo.limits.features.includes(featureName);
}

/**
 * Check if tenant's SMS quota is sufficient
 * TODO: Implement SMS usage tracking system
 */
export async function hasSmsQuota(
  tenantId: string,
  requiredCount: number = 1
): Promise<boolean> {
  const subscriptionInfo = await getSubscriptionLimits(tenantId);

  // No subscription or unlimited SMS
  if (!subscriptionInfo || subscriptionInfo.limits.smsQuota === null) {
    return true;
  }

  // TODO: Implement SMS usage tracking
  // For now, log a warning and allow the SMS
  console.warn(
    `[Plan Limits] SMS quota check not fully implemented for tenant ${tenantId}. Required: ${requiredCount}, Quota: ${subscriptionInfo.limits.smsQuota}`
  );
  
  // Return true to avoid blocking functionality until SMS tracking is implemented
  return true;
}

/**
 * Middleware to enforce employee limit
 */
export async function enforceEmployeeLimit(tenantId: string): Promise<void> {
  const canAdd = await canAddEmployee(tenantId);

  if (!canAdd) {
    const subscriptionInfo = await getSubscriptionLimits(tenantId);
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Employee limit reached (${subscriptionInfo?.limits.maxEmployees}). Please upgrade your plan.`,
      data: {
        messageKey: "errors.employeeLimitReached",
        limit: subscriptionInfo?.limits.maxEmployees,
      },
    });
  }
}

/**
 * Middleware to enforce feature access
 */
export async function enforceFeatureAccess(
  tenantId: string,
  featureName: string
): Promise<void> {
  const hasAccess = await hasFeatureAccess(tenantId, featureName);

  if (!hasAccess) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Feature "${featureName}" is not available in your plan. Please upgrade.`,
      data: {
        messageKey: "errors.featureNotAvailable",
        feature: featureName,
      },
    });
  }
}

/**
 * Middleware to check if subscription is active
 */
export async function enforceActiveSubscription(tenantId: string): Promise<void> {
  const subscriptionInfo = await getSubscriptionLimits(tenantId);

  if (!subscriptionInfo) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "No active subscription found. Please subscribe to a plan.",
      data: {
        messageKey: "errors.noActiveSubscription",
      },
    });
  }

  if (subscriptionInfo.isPastDue) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your subscription payment is past due. Please update your payment method.",
      data: {
        messageKey: "errors.subscriptionPastDue",
      },
    });
  }

  if (!subscriptionInfo.isActive) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your subscription is not active. Please contact support.",
      data: {
        messageKey: "errors.subscriptionInactive",
      },
    });
  }
}

/**
 * Get available features for tenant based on subscription
 */
export async function getAvailableFeatures(tenantId: string): Promise<string[]> {
  const subscriptionInfo = await getSubscriptionLimits(tenantId);

  if (!subscriptionInfo) {
    // Return basic free features
    return ["appointments", "customers", "services"];
  }

  return subscriptionInfo.limits.features;
}
