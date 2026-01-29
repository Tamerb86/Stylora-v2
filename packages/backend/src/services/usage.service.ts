import { db } from '../db/index.js';
import { usageLogs, subscriptions, plans } from '../db/schema.js';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface UsageStats {
  currentMonthUsage: number;
  monthlyLimit: number | null; // null = unlimited
  remainingRequests: number | null; // null = unlimited
  isWithinLimit: boolean;
  planCode: string;
  periodStart: Date;
  periodEnd: Date;
}

export interface LogUsageInput {
  userId: number;
  productId?: number;
  generatedContentId?: number;
  tokensUsed: number;
  requestTimeMs: number;
}

class UsageService {
  /**
   * Get current month's usage statistics for a user
   */
  async getUsageStats(userId: number): Promise<UsageStats> {
    // Get user's subscription with plan details
    const [subscription] = await db
      .select({
        planCode: plans.code,
        monthlyLimit: plans.monthlyLimitRequests,
        periodStart: subscriptions.currentPeriodStart,
        periodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1);

    // Default to free plan limits if no subscription found
    const periodStart = subscription?.periodStart || this.getMonthStart();
    const periodEnd = subscription?.periodEnd || this.getMonthEnd();
    const monthlyLimit = subscription?.monthlyLimit ?? 10; // Free plan default
    const planCode = subscription?.planCode || 'free';

    // Count usage for current period
    const [usageResult] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, userId),
          gte(usageLogs.createdAt, periodStart)
        )
      );

    const currentMonthUsage = usageResult?.count || 0;

    // Calculate remaining (null for unlimited)
    const isUnlimited = monthlyLimit === null || monthlyLimit === -1;
    const remainingRequests = isUnlimited ? null : Math.max(0, monthlyLimit - currentMonthUsage);
    const isWithinLimit = isUnlimited || currentMonthUsage < monthlyLimit;

    return {
      currentMonthUsage,
      monthlyLimit: isUnlimited ? null : monthlyLimit,
      remainingRequests,
      isWithinLimit,
      planCode,
      periodStart,
      periodEnd,
    };
  }

  /**
   * Check if user can make a request (within limits)
   */
  async canMakeRequest(userId: number): Promise<{ allowed: boolean; reason?: string; stats: UsageStats }> {
    const stats = await this.getUsageStats(userId);

    if (!stats.isWithinLimit) {
      return {
        allowed: false,
        reason: `Monthly limit reached. You've used ${stats.currentMonthUsage}/${stats.monthlyLimit} requests. Upgrade your plan for more.`,
        stats,
      };
    }

    return {
      allowed: true,
      stats,
    };
  }

  /**
   * Log a usage entry
   */
  async logUsage(input: LogUsageInput): Promise<void> {
    await db.insert(usageLogs).values({
      userId: input.userId,
      productId: input.productId || null,
      generatedContentId: input.generatedContentId || null,
      tokensUsed: input.tokensUsed,
      requestTimeMs: input.requestTimeMs,
    });
  }

  /**
   * Get usage history for a user
   */
  async getUsageHistory(userId: number, limit: number = 50): Promise<typeof usageLogs.$inferSelect[]> {
    return db
      .select()
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(sql`${usageLogs.createdAt} DESC`)
      .limit(limit);
  }

  /**
   * Get total tokens used by a user
   */
  async getTotalTokensUsed(userId: number): Promise<number> {
    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${usageLogs.tokensUsed}), 0)`,
      })
      .from(usageLogs)
      .where(eq(usageLogs.userId, userId));

    return result?.total || 0;
  }

  // Helper methods
  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private getMonthEnd(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }
}

export const usageService = new UsageService();
