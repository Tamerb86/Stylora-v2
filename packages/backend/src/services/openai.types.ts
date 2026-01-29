// ============================================
// LLM MODEL OPTIONS
// ============================================
export type LLMModel =
  // OpenAI Models
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-4'
  | 'gpt-3.5-turbo'
  // Anthropic Models (via OpenAI-compatible API)
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  // Google Models (via OpenAI-compatible API)
  | 'gemini-pro'
  | 'gemini-pro-vision'
  // Open Source Models (via OpenRouter/Together)
  | 'llama-3-70b'
  | 'llama-3-8b'
  | 'mixtral-8x7b'
  | 'mistral-7b';

export const LLM_MODELS: Record<LLMModel, { name: string; provider: string; maxTokens: number }> = {
  // OpenAI
  'gpt-4o': { name: 'GPT-4o', provider: 'openai', maxTokens: 128000 },
  'gpt-4o-mini': { name: 'GPT-4o Mini', provider: 'openai', maxTokens: 128000 },
  'gpt-4-turbo': { name: 'GPT-4 Turbo', provider: 'openai', maxTokens: 128000 },
  'gpt-4': { name: 'GPT-4', provider: 'openai', maxTokens: 8192 },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', provider: 'openai', maxTokens: 16385 },
  // Anthropic
  'claude-3-opus': { name: 'Claude 3 Opus', provider: 'anthropic', maxTokens: 200000 },
  'claude-3-sonnet': { name: 'Claude 3 Sonnet', provider: 'anthropic', maxTokens: 200000 },
  'claude-3-haiku': { name: 'Claude 3 Haiku', provider: 'anthropic', maxTokens: 200000 },
  // Google
  'gemini-pro': { name: 'Gemini Pro', provider: 'google', maxTokens: 32000 },
  'gemini-pro-vision': { name: 'Gemini Pro Vision', provider: 'google', maxTokens: 32000 },
  // Open Source
  'llama-3-70b': { name: 'Llama 3 70B', provider: 'meta', maxTokens: 8192 },
  'llama-3-8b': { name: 'Llama 3 8B', provider: 'meta', maxTokens: 8192 },
  'mixtral-8x7b': { name: 'Mixtral 8x7B', provider: 'mistral', maxTokens: 32000 },
  'mistral-7b': { name: 'Mistral 7B', provider: 'mistral', maxTokens: 32000 },
};

// ============================================
// LANGUAGE OPTIONS
// ============================================
export type Language =
  | 'ar'        // Arabic (Standard)
  | 'ar-eg'     // Arabic (Egyptian)
  | 'ar-sa'     // Arabic (Saudi)
  | 'ar-ae'     // Arabic (UAE)
  | 'ar-ma'     // Arabic (Moroccan)
  | 'ar-lv'     // Arabic (Levantine)
  | 'en'        // English (US)
  | 'en-gb'     // English (UK)
  | 'fr'        // French
  | 'es'        // Spanish
  | 'de'        // German
  | 'tr'        // Turkish
  | 'ur'        // Urdu
  | 'hi'        // Hindi
  | 'id'        // Indonesian
  | 'ms';       // Malay

export const LANGUAGES: Record<Language, { name: string; nativeName: string; rtl: boolean }> = {
  'ar': { name: 'Arabic (Standard)', nativeName: 'العربية الفصحى', rtl: true },
  'ar-eg': { name: 'Arabic (Egyptian)', nativeName: 'مصري', rtl: true },
  'ar-sa': { name: 'Arabic (Saudi)', nativeName: 'سعودي', rtl: true },
  'ar-ae': { name: 'Arabic (UAE)', nativeName: 'إماراتي', rtl: true },
  'ar-ma': { name: 'Arabic (Moroccan)', nativeName: 'دارجة مغربية', rtl: true },
  'ar-lv': { name: 'Arabic (Levantine)', nativeName: 'شامي', rtl: true },
  'en': { name: 'English (US)', nativeName: 'English', rtl: false },
  'en-gb': { name: 'English (UK)', nativeName: 'British English', rtl: false },
  'fr': { name: 'French', nativeName: 'Français', rtl: false },
  'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
  'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
  'tr': { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  'ur': { name: 'Urdu', nativeName: 'اردو', rtl: true },
  'hi': { name: 'Hindi', nativeName: 'हिंदी', rtl: false },
  'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false },
  'ms': { name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false },
};

// ============================================
// PLATFORM OPTIONS
// ============================================
export type Platform =
  | 'tiktok'
  | 'instagram-reels'
  | 'instagram-stories'
  | 'instagram-feed'
  | 'youtube-shorts'
  | 'youtube-long'
  | 'facebook-reels'
  | 'facebook-ads'
  | 'snapchat'
  | 'twitter-x'
  | 'linkedin'
  | 'pinterest'
  | 'google-ads'
  | 'meta-ads';

export const PLATFORMS: Record<Platform, { name: string; maxDuration?: number; aspectRatio: string }> = {
  'tiktok': { name: 'TikTok', maxDuration: 180, aspectRatio: '9:16' },
  'instagram-reels': { name: 'Instagram Reels', maxDuration: 90, aspectRatio: '9:16' },
  'instagram-stories': { name: 'Instagram Stories', maxDuration: 60, aspectRatio: '9:16' },
  'instagram-feed': { name: 'Instagram Feed', aspectRatio: '1:1' },
  'youtube-shorts': { name: 'YouTube Shorts', maxDuration: 60, aspectRatio: '9:16' },
  'youtube-long': { name: 'YouTube Long-form', aspectRatio: '16:9' },
  'facebook-reels': { name: 'Facebook Reels', maxDuration: 90, aspectRatio: '9:16' },
  'facebook-ads': { name: 'Facebook Ads', aspectRatio: '1:1' },
  'snapchat': { name: 'Snapchat', maxDuration: 60, aspectRatio: '9:16' },
  'twitter-x': { name: 'Twitter/X', maxDuration: 140, aspectRatio: '16:9' },
  'linkedin': { name: 'LinkedIn', aspectRatio: '1:1' },
  'pinterest': { name: 'Pinterest', aspectRatio: '2:3' },
  'google-ads': { name: 'Google Ads', aspectRatio: '16:9' },
  'meta-ads': { name: 'Meta Ads', aspectRatio: '1:1' },
};

// ============================================
// TONE OPTIONS
// ============================================
export type Tone =
  // Sales & Marketing
  | 'aggressive'
  | 'urgent'
  | 'persuasive'
  | 'scarcity'
  | 'fomo'
  // Friendly & Casual
  | 'friendly'
  | 'casual'
  | 'conversational'
  | 'relatable'
  | 'humorous'
  | 'playful'
  // Professional & Formal
  | 'professional'
  | 'formal'
  | 'authoritative'
  | 'educational'
  | 'informative'
  // Emotional
  | 'emotional'
  | 'inspirational'
  | 'motivational'
  | 'empathetic'
  | 'storytelling'
  // Trust & Credibility
  | 'trustworthy'
  | 'authentic'
  | 'testimonial'
  | 'expert';

export const TONES: Record<Tone, { name: string; nameAr: string; description: string }> = {
  // Sales & Marketing
  'aggressive': { name: 'Aggressive', nameAr: 'عدواني', description: 'Direct, bold, and action-oriented' },
  'urgent': { name: 'Urgent', nameAr: 'عاجل', description: 'Creates sense of urgency and time pressure' },
  'persuasive': { name: 'Persuasive', nameAr: 'مقنع', description: 'Convincing and compelling arguments' },
  'scarcity': { name: 'Scarcity', nameAr: 'ندرة', description: 'Limited availability emphasis' },
  'fomo': { name: 'FOMO', nameAr: 'خوف الفوات', description: 'Fear of missing out' },
  // Friendly & Casual
  'friendly': { name: 'Friendly', nameAr: 'ودود', description: 'Warm and approachable' },
  'casual': { name: 'Casual', nameAr: 'عفوي', description: 'Relaxed and informal' },
  'conversational': { name: 'Conversational', nameAr: 'حواري', description: 'Like talking to a friend' },
  'relatable': { name: 'Relatable', nameAr: 'قريب', description: 'Easy to relate to' },
  'humorous': { name: 'Humorous', nameAr: 'فكاهي', description: 'Funny and entertaining' },
  'playful': { name: 'Playful', nameAr: 'مرح', description: 'Light-hearted and fun' },
  // Professional & Formal
  'professional': { name: 'Professional', nameAr: 'احترافي', description: 'Business-like and polished' },
  'formal': { name: 'Formal', nameAr: 'رسمي', description: 'Proper and structured' },
  'authoritative': { name: 'Authoritative', nameAr: 'موثوق', description: 'Expert and commanding' },
  'educational': { name: 'Educational', nameAr: 'تعليمي', description: 'Teaching and explaining' },
  'informative': { name: 'Informative', nameAr: 'معلوماتي', description: 'Fact-based and detailed' },
  // Emotional
  'emotional': { name: 'Emotional', nameAr: 'عاطفي', description: 'Appeals to feelings' },
  'inspirational': { name: 'Inspirational', nameAr: 'ملهم', description: 'Uplifting and encouraging' },
  'motivational': { name: 'Motivational', nameAr: 'تحفيزي', description: 'Drives action and change' },
  'empathetic': { name: 'Empathetic', nameAr: 'متعاطف', description: 'Understanding and caring' },
  'storytelling': { name: 'Storytelling', nameAr: 'قصصي', description: 'Narrative-driven' },
  // Trust & Credibility
  'trustworthy': { name: 'Trustworthy', nameAr: 'جدير بالثقة', description: 'Reliable and honest' },
  'authentic': { name: 'Authentic', nameAr: 'أصيل', description: 'Genuine and real' },
  'testimonial': { name: 'Testimonial', nameAr: 'شهادة', description: 'Social proof focused' },
  'expert': { name: 'Expert', nameAr: 'خبير', description: 'Specialist knowledge' },
};

// ============================================
// NICHE / CATEGORY OPTIONS
// ============================================
export type Niche =
  | 'fashion'
  | 'beauty'
  | 'electronics'
  | 'home-decor'
  | 'fitness'
  | 'health'
  | 'food'
  | 'pets'
  | 'baby'
  | 'automotive'
  | 'jewelry'
  | 'sports'
  | 'gaming'
  | 'books'
  | 'art'
  | 'music'
  | 'travel'
  | 'office'
  | 'garden'
  | 'toys'
  | 'general';

export const NICHES: Record<Niche, { name: string; nameAr: string; emoji: string }> = {
  'fashion': { name: 'Fashion & Clothing', nameAr: 'أزياء وملابس', emoji: '👗' },
  'beauty': { name: 'Beauty & Skincare', nameAr: 'جمال وعناية', emoji: '💄' },
  'electronics': { name: 'Electronics & Gadgets', nameAr: 'إلكترونيات', emoji: '📱' },
  'home-decor': { name: 'Home & Decor', nameAr: 'منزل وديكور', emoji: '🏠' },
  'fitness': { name: 'Fitness & Gym', nameAr: 'لياقة ورياضة', emoji: '💪' },
  'health': { name: 'Health & Wellness', nameAr: 'صحة وعافية', emoji: '🏥' },
  'food': { name: 'Food & Kitchen', nameAr: 'طعام ومطبخ', emoji: '🍳' },
  'pets': { name: 'Pets & Animals', nameAr: 'حيوانات أليفة', emoji: '🐕' },
  'baby': { name: 'Baby & Kids', nameAr: 'أطفال ورضع', emoji: '👶' },
  'automotive': { name: 'Automotive & Cars', nameAr: 'سيارات', emoji: '🚗' },
  'jewelry': { name: 'Jewelry & Accessories', nameAr: 'مجوهرات وإكسسوارات', emoji: '💎' },
  'sports': { name: 'Sports & Outdoors', nameAr: 'رياضة وخارجية', emoji: '⚽' },
  'gaming': { name: 'Gaming', nameAr: 'ألعاب', emoji: '🎮' },
  'books': { name: 'Books & Education', nameAr: 'كتب وتعليم', emoji: '📚' },
  'art': { name: 'Art & Crafts', nameAr: 'فن وحرف', emoji: '🎨' },
  'music': { name: 'Music & Audio', nameAr: 'موسيقى وصوتيات', emoji: '🎵' },
  'travel': { name: 'Travel & Luggage', nameAr: 'سفر وحقائب', emoji: '✈️' },
  'office': { name: 'Office & Stationery', nameAr: 'مكتب وقرطاسية', emoji: '📎' },
  'garden': { name: 'Garden & Plants', nameAr: 'حديقة ونباتات', emoji: '🌱' },
  'toys': { name: 'Toys & Games', nameAr: 'ألعاب أطفال', emoji: '🧸' },
  'general': { name: 'General', nameAr: 'عام', emoji: '📦' },
};

// ============================================
// CONTENT STYLE OPTIONS
// ============================================
export type ContentStyle =
  | 'problem-solution'
  | 'before-after'
  | 'unboxing'
  | 'tutorial'
  | 'review'
  | 'comparison'
  | 'lifestyle'
  | 'behind-scenes'
  | 'user-generated'
  | 'trending'
  | 'challenge'
  | 'duet'
  | 'reaction';

export const CONTENT_STYLES: Record<ContentStyle, { name: string; nameAr: string; description: string }> = {
  'problem-solution': { name: 'Problem-Solution', nameAr: 'مشكلة-حل', description: 'Show problem then solution' },
  'before-after': { name: 'Before-After', nameAr: 'قبل-بعد', description: 'Transformation showcase' },
  'unboxing': { name: 'Unboxing', nameAr: 'فتح العلبة', description: 'Product reveal' },
  'tutorial': { name: 'Tutorial/How-to', nameAr: 'شرح/كيفية', description: 'Step-by-step guide' },
  'review': { name: 'Review', nameAr: 'مراجعة', description: 'Product review' },
  'comparison': { name: 'Comparison', nameAr: 'مقارنة', description: 'Compare products' },
  'lifestyle': { name: 'Lifestyle', nameAr: 'نمط حياة', description: 'Product in daily life' },
  'behind-scenes': { name: 'Behind the Scenes', nameAr: 'خلف الكواليس', description: 'Show the process' },
  'user-generated': { name: 'User Generated', nameAr: 'محتوى المستخدم', description: 'Customer content style' },
  'trending': { name: 'Trending', nameAr: 'ترند', description: 'Follow current trends' },
  'challenge': { name: 'Challenge', nameAr: 'تحدي', description: 'Challenge format' },
  'duet': { name: 'Duet/Stitch', nameAr: 'ديو/ستيتش', description: 'React to other content' },
  'reaction': { name: 'Reaction', nameAr: 'ردة فعل', description: 'React to product' },
};

// ============================================
// PRODUCT INPUT
// ============================================
export interface ProductInput {
  title?: string | null;
  rawDescription?: string | null;
  priceRaw?: string | null;
  currency?: string | null;
  source?: string | null;
  images?: string[];
}

// ============================================
// GENERATION OPTIONS
// ============================================
export interface GenerationOptions {
  // Required
  language: Language;
  platform: Platform;
  tone: Tone;
  
  // Optional
  model?: LLMModel;
  niche?: Niche;
  contentStyle?: ContentStyle;
  targetAudience?: string;
  
  // Advanced options
  scriptDuration?: '15s' | '30s' | '60s' | '90s' | '180s';
  numberOfAngles?: number;
  numberOfHooks?: number;
  numberOfCaptions?: number;
  numberOfHashtags?: number;
  includeEmojis?: boolean;
  includeCTA?: boolean;
}

// ============================================
// GENERATED CONTENT OUTPUT
// ============================================
export interface GeneratedContent {
  script: string;
  angles: string[];
  hooks: string[];
  captions: string[];
  hashtags: string[];
  thumbnailText: string[];
}

// ============================================
// API RESPONSE WITH METADATA
// ============================================
export interface GenerationResult {
  content: GeneratedContent;
  metadata: {
    model: LLMModel;
    tokensUsed: number;
    language: Language;
    platform: Platform;
    tone: Tone;
    niche?: Niche;
    contentStyle?: ContentStyle;
    generatedAt: string;
    processingTimeMs: number;
  };
}

// ============================================
// ERROR TYPES
// ============================================
export class OpenAIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}
