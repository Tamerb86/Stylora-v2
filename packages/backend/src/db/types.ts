import type {
  User,
  NewUser,
  Plan,
  NewPlan,
  Subscription,
  NewSubscription,
  Product,
  NewProduct,
  GeneratedContent,
  NewGeneratedContent,
  ApiKey,
  NewApiKey,
  UsageLog,
  NewUsageLog,
} from './schema.js';

// Re-export schema types
export type {
  User,
  NewUser,
  Plan,
  NewPlan,
  Subscription,
  NewSubscription,
  Product,
  NewProduct,
  GeneratedContent,
  NewGeneratedContent,
  ApiKey,
  NewApiKey,
  UsageLog,
  NewUsageLog,
};

// ============================================
// EXTENDED TYPES WITH RELATIONS
// ============================================

export interface UserWithSubscription extends User {
  subscription?: SubscriptionWithPlan | null;
}

export interface UserWithFullData extends User {
  subscription?: SubscriptionWithPlan | null;
  products?: Product[];
  generatedContents?: GeneratedContent[];
  apiKeys?: ApiKey[];
}

export interface SubscriptionWithPlan extends Subscription {
  plan: Plan;
}

export interface ProductWithContents extends Product {
  generatedContents?: GeneratedContent[];
}

export interface GeneratedContentWithProduct extends GeneratedContent {
  product?: Product | null;
}

export interface UsageLogWithDetails extends UsageLog {
  product?: Product | null;
  generatedContent?: GeneratedContent | null;
}

// ============================================
// ENUM TYPES
// ============================================

export type PlanCode = 'free' | 'pro' | 'business';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid';

export type ContentType =
  | 'script'
  | 'creative_angle'
  | 'hook'
  | 'caption'
  | 'hashtags'
  | 'thumbnail_text';

export type Language = 'ar' | 'en';

export type ProductSource = 'aliexpress' | 'amazon' | 'manual' | 'temu' | 'other';

// ============================================
// INPUT PARAMS TYPES
// ============================================

export interface ScriptInputParams {
  tone?: 'professional' | 'casual' | 'funny' | 'urgent';
  duration?: '15s' | '30s' | '60s';
  style?: 'storytelling' | 'problem-solution' | 'testimonial' | 'demo';
  targetAudience?: string;
  callToAction?: string;
}

export interface CreativeAngleInputParams {
  niche?: string;
  targetEmotion?: 'curiosity' | 'fomo' | 'desire' | 'trust';
  competitorDifferentiation?: boolean;
}

export interface HookInputParams {
  hookType?: 'question' | 'statement' | 'statistic' | 'story' | 'controversy';
  urgency?: boolean;
  personalization?: boolean;
}

export interface CaptionInputParams {
  includeEmojis?: boolean;
  maxLength?: number;
  includeCallToAction?: boolean;
}

export interface HashtagsInputParams {
  count?: number;
  includeNiche?: boolean;
  includeTrending?: boolean;
  region?: string;
}

export interface ThumbnailTextInputParams {
  maxWords?: number;
  style?: 'bold' | 'minimal' | 'colorful';
  includeEmoji?: boolean;
}

export type InputParams =
  | ScriptInputParams
  | CreativeAngleInputParams
  | HookInputParams
  | CaptionInputParams
  | HashtagsInputParams
  | ThumbnailTextInputParams;

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateUserRequest {
  supabaseUid: string;
  email: string;
  name?: string;
}

export interface CreateProductRequest {
  source: ProductSource;
  sourceUrl?: string;
  title?: string;
  rawDescription?: string;
  images?: string[];
  priceRaw?: string;
  currency?: string;
}

export interface GenerateContentRequest {
  productId?: string;
  type: ContentType;
  language: Language;
  inputParams?: InputParams;
}

export interface CreateApiKeyRequest {
  label?: string;
}

// ============================================
// USAGE & LIMITS TYPES
// ============================================

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  requestsThisMonth: number;
  remainingRequests: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface PlanLimits {
  monthlyLimitRequests: number;
  currentUsage: number;
  remaining: number;
  resetDate: Date;
}
