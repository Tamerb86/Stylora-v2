import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { users, subscriptions, plans } from '../db/schema.js';
import type { User, PlanCode } from '../db/types.js';

export interface UserWithPlan extends User {
  planCode: PlanCode;
  planName: string;
  monthlyLimitRequests: number;
}

export interface CreateUserInput {
  supabaseUid: string;
  email: string;
  name?: string;
}

class UserService {
  /**
   * Get user by Supabase UID
   */
  async getUserBySupabaseUid(supabaseUid: string): Promise<UserWithPlan | null> {
    const result = await db
      .select({
        id: users.id,
        supabaseUid: users.supabaseUid,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        planCode: plans.code,
        planName: plans.name,
        monthlyLimitRequests: plans.monthlyLimitRequests,
      })
      .from(users)
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .leftJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(users.supabaseUid, supabaseUid))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    
    return {
      id: user.id,
      supabaseUid: user.supabaseUid,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      planCode: user.planCode ?? 'free',
      planName: user.planName ?? 'Free',
      monthlyLimitRequests: user.monthlyLimitRequests ?? 10,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<UserWithPlan | null> {
    const result = await db
      .select({
        id: users.id,
        supabaseUid: users.supabaseUid,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        planCode: plans.code,
        planName: plans.name,
        monthlyLimitRequests: plans.monthlyLimitRequests,
      })
      .from(users)
      .leftJoin(subscriptions, eq(subscriptions.userId, users.id))
      .leftJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(users.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const user = result[0];
    
    return {
      id: user.id,
      supabaseUid: user.supabaseUid,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      planCode: user.planCode ?? 'free',
      planName: user.planName ?? 'Free',
      monthlyLimitRequests: user.monthlyLimitRequests ?? 10,
    };
  }

  /**
   * Create a new user with free plan subscription
   */
  async createUser(input: CreateUserInput): Promise<UserWithPlan> {
    const userId = uuidv4();

    // Get free plan
    const freePlan = await db
      .select()
      .from(plans)
      .where(eq(plans.code, 'free'))
      .limit(1);

    if (freePlan.length === 0) {
      throw new Error('Free plan not found. Please run db:seed first.');
    }

    // Create user
    await db.insert(users).values({
      id: userId,
      supabaseUid: input.supabaseUid,
      email: input.email,
      name: input.name ?? null,
    });

    // Create free subscription
    const subscriptionId = uuidv4();
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await db.insert(subscriptions).values({
      id: subscriptionId,
      userId: userId,
      planId: freePlan[0].id,
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    return {
      id: userId,
      supabaseUid: input.supabaseUid,
      email: input.email,
      name: input.name ?? null,
      createdAt: now,
      updatedAt: now,
      planCode: 'free',
      planName: 'Free',
      monthlyLimitRequests: freePlan[0].monthlyLimitRequests,
    };
  }

  /**
   * Get or create user - used by auth middleware
   */
  async getOrCreateUser(input: CreateUserInput): Promise<UserWithPlan> {
    // Try to get existing user
    const existingUser = await this.getUserBySupabaseUid(input.supabaseUid);
    
    if (existingUser) {
      return existingUser;
    }

    // Create new user
    return this.createUser(input);
  }

  /**
   * Update user profile
   */
  async updateUser(
    id: string,
    data: { name?: string; email?: string }
  ): Promise<UserWithPlan | null> {
    await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return this.getUserById(id);
  }
}

export const userService = new UserService();
