// User Types
export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

export interface UserWithPlan extends User {
  planCode: string;
  planName: string;
  monthlyLimit: number | null;
}

// Product Types
export interface Product {
  id: number;
  userId: number;
  source: string;
  sourceUrl: string | null;
  title: string;
  rawDescription: string | null;
  images: string[];
  priceRaw: string | null;
  currency: string | null;
  languageDetected: string | null;
  createdAt: string;
}

export interface ProductWithContent extends Product {
  latestContent?: GeneratedContent;
}

// Generated Content Types
export type ContentType = 'script' | 'creative_angle' | 'hook' | 'caption' | 'hashtags' | 'thumbnail_text';

export interface GeneratedContent {
  id: number;
  userId: number;
  productId: number;
  type: ContentType;
  language: string;
  inputParams: Record<string, unknown>;
  output: string;
  createdAt: string;
}

export interface FullPackageContent {
  script: string;
  angles: string[];
  hooks: string[];
  captions: string[];
  hashtags: string[];
  thumbnailText: string[];
}

export interface GenerationMetadata {
  model: string;
  tokensUsed: number;
  language: string;
  platform: string;
  tone: string;
  niche?: string;
  generatedAt: string;
  processingTimeMs: number;
}

export interface FullPackageResult {
  content: FullPackageContent;
  metadata: GenerationMetadata;
  savedContentId: number;
  usage: {
    currentMonthUsage: number;
    remainingRequests: number;
    monthlyLimit: number | null;
  };
}

// Plan Types
export interface Plan {
  code: string;
  name: string;
  monthlyLimitRequests: number | null;
  isUnlimited: boolean;
  features: string[];
  recommended: boolean;
}

// Subscription Types
export interface Subscription {
  id: number;
  status: string;
  planCode: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriptionInfo {
  hasSubscription: boolean;
  subscription?: Subscription;
  planCode: string;
  usage: {
    currentMonthUsage: number;
    monthlyLimit: number | null;
    remainingRequests: number | null;
  };
}

// Generation Options
export type Language = 'ar' | 'ar_eg' | 'ar_sa' | 'ar_ae' | 'ar_ma' | 'ar_levant' | 'en' | 'fr' | 'es' | 'de' | 'tr' | 'ur' | 'hi' | 'id' | 'ms';

export type Platform = 'tiktok' | 'instagram_reels' | 'instagram_stories' | 'instagram_feed' | 'youtube_shorts' | 'youtube_long' | 'facebook_reels' | 'facebook_ads' | 'snapchat' | 'twitter' | 'linkedin' | 'pinterest' | 'google_ads' | 'meta_ads';

export type Tone = 'aggressive' | 'urgent' | 'persuasive' | 'scarcity' | 'fomo' | 'friendly' | 'casual' | 'conversational' | 'relatable' | 'humorous' | 'playful' | 'professional' | 'formal' | 'authoritative' | 'educational' | 'informative' | 'emotional' | 'inspirational' | 'motivational' | 'empathetic' | 'storytelling' | 'trustworthy' | 'authentic' | 'testimonial' | 'expert';

export type Niche = 'fashion' | 'beauty' | 'electronics' | 'home' | 'fitness' | 'health' | 'food' | 'pets' | 'baby' | 'automotive' | 'jewelry' | 'sports' | 'gaming' | 'books' | 'art' | 'music' | 'travel' | 'office' | 'garden' | 'toys' | 'general';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface GenerateFormData {
  productId: number;
  language: Language;
  platform: Platform;
  tone: Tone;
  niche?: Niche;
  targetAudience?: string;
}

export interface CreateProductFormData {
  source: string;
  sourceUrl?: string;
  title: string;
  rawDescription?: string;
  images?: string[];
  priceRaw?: string;
  currency?: string;
}
