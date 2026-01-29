import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  json,
  bigint,
  index,
  longtext,
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = mysqlTable('users', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  supabaseUid: varchar('supabase_uid', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supabaseUidIdx: index('supabase_uid_idx').on(table.supabaseUid),
  emailIdx: index('email_idx').on(table.email),
}));

// User TypeScript type
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// ============================================
// PLANS TABLE
// ============================================
export const plans = mysqlTable('plans', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  code: mysqlEnum('code', ['free', 'pro', 'business']).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }),
  monthlyLimitRequests: int('monthly_limit_requests').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  codeIdx: index('code_idx').on(table.code),
}));

// Plan TypeScript type
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

// ============================================
// SUBSCRIPTIONS TABLE
// ============================================
export const subscriptions = mysqlTable('subscriptions', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar('plan_id', { length: 36 }).notNull().references(() => plans.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  status: mysqlEnum('status', [
    'active',
    'canceled',
    'past_due',
    'trialing',
    'incomplete',
    'incomplete_expired',
    'unpaid',
  ]).default('active').notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
}, (table) => ({
  userIdIdx: index('user_id_idx').on(table.userId),
  stripeCustomerIdIdx: index('stripe_customer_id_idx').on(table.stripeCustomerId),
  stripeSubscriptionIdIdx: index('stripe_subscription_id_idx').on(table.stripeSubscriptionId),
  statusIdx: index('status_idx').on(table.status),
}));

// Subscription TypeScript type
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ============================================
// PRODUCTS TABLE
// ============================================
export const products = mysqlTable('products', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  source: varchar('source', { length: 50 }).notNull(), // aliexpress, amazon, manual, etc.
  sourceUrl: text('source_url'),
  title: varchar('title', { length: 500 }),
  rawDescription: text('raw_description'),
  images: json('images').$type<string[]>().default([]),
  priceRaw: varchar('price_raw', { length: 50 }),
  currency: varchar('currency', { length: 10 }),
  languageDetected: varchar('language_detected', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('products_user_id_idx').on(table.userId),
  sourceIdx: index('source_idx').on(table.source),
  createdAtIdx: index('products_created_at_idx').on(table.createdAt),
}));

// Product TypeScript type
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ============================================
// GENERATED CONTENTS TABLE
// ============================================
export const generatedContents = mysqlTable('generated_contents', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 36 }).references(() => products.id, { onDelete: 'set null' }),
  type: mysqlEnum('type', [
    'script',
    'creative_angle',
    'hook',
    'caption',
    'hashtags',
    'thumbnail_text',
  ]).notNull(),
  language: mysqlEnum('language', ['ar', 'en']).notNull(),
  inputParams: json('input_params').$type<Record<string, unknown>>().default({}),
  output: longtext('output').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('generated_user_id_idx').on(table.userId),
  productIdIdx: index('product_id_idx').on(table.productId),
  typeIdx: index('type_idx').on(table.type),
  languageIdx: index('language_idx').on(table.language),
  createdAtIdx: index('generated_created_at_idx').on(table.createdAt),
}));

// Generated Content TypeScript type
export type GeneratedContent = typeof generatedContents.$inferSelect;
export type NewGeneratedContent = typeof generatedContents.$inferInsert;

// ============================================
// API KEYS TABLE
// ============================================
export const apiKeys = mysqlTable('api_keys', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 64 }).notNull().unique(),
  label: varchar('label', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsedAt: timestamp('last_used_at'),
}, (table) => ({
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
  keyIdx: index('key_idx').on(table.key),
  isActiveIdx: index('is_active_idx').on(table.isActive),
}));

// API Key TypeScript type
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;

// ============================================
// USAGE LOGS TABLE
// ============================================
export const usageLogs = mysqlTable('usage_logs', {
  id: varchar('id', { length: 36 }).primaryKey(), // UUID
  userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: varchar('product_id', { length: 36 }).references(() => products.id, { onDelete: 'set null' }),
  generatedContentId: varchar('generated_content_id', { length: 36 }).references(() => generatedContents.id, { onDelete: 'set null' }),
  tokensUsed: int('tokens_used').default(0),
  requestTimeMs: int('request_time_ms').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('usage_user_id_idx').on(table.userId),
  productIdIdx: index('usage_product_id_idx').on(table.productId),
  generatedContentIdIdx: index('generated_content_id_idx').on(table.generatedContentId),
  createdAtIdx: index('usage_created_at_idx').on(table.createdAt),
}));

// Usage Log TypeScript type
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

// ============================================
// RELATIONS
// ============================================
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(subscriptions),
  products: many(products),
  generatedContents: many(generatedContents),
  apiKeys: many(apiKeys),
  usageLogs: many(usageLogs),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [subscriptions.planId],
    references: [plans.id],
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.id],
  }),
  generatedContents: many(generatedContents),
  usageLogs: many(usageLogs),
}));

export const generatedContentsRelations = relations(generatedContents, ({ one, many }) => ({
  user: one(users, {
    fields: [generatedContents.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [generatedContents.productId],
    references: [products.id],
  }),
  usageLogs: many(usageLogs),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [usageLogs.productId],
    references: [products.id],
  }),
  generatedContent: one(generatedContents, {
    fields: [usageLogs.generatedContentId],
    references: [generatedContents.id],
  }),
}));
