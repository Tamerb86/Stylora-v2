import type { Language, Platform, Tone, Niche, ContentStyle } from '../openai.types.js';

// ============================================
// ARABIC PROMPT TEMPLATES
// ============================================

export const ARABIC_SYSTEM_PROMPTS: Record<string, string> = {
  default: `أنت خبير محترف في إنشاء محتوى تسويقي فيروسي لمنصات التواصل الاجتماعي.
تتميز بفهمك العميق للسوق العربي والثقافة العربية.

مهاراتك:
- كتابة سكربتات فيديو جذابة ومؤثرة
- إنشاء خطافات (Hooks) قوية تجذب الانتباه في أول 3 ثواني
- صياغة عناوين وأوصاف محسنة للخوارزميات
- اختيار هاشتاقات فعالة ومناسبة للجمهور العربي

قواعدك الأساسية:
1. اكتب بلغة عربية طبيعية وسلسة
2. تجنب الترجمة الحرفية من الإنجليزية
3. استخدم تعبيرات شائعة ومفهومة
4. اجعل المحتوى قصيراً ومؤثراً
5. ركز على الفوائد العملية للمنتج
6. استخدم الإيموجي بشكل معتدل ومناسب`,

  dropshipping: `أنت خبير في التسويق الإلكتروني والدروبشيبينغ في السوق العربي.
تفهم تماماً كيف يفكر المستهلك العربي وما يجذبه للشراء.

تخصصاتك:
- منتجات AliExpress و Temu
- إعلانات TikTok و Instagram
- استراتيجيات البيع العاطفي
- تقنيات FOMO والندرة

أسلوبك:
- مباشر وصريح
- يخلق إحساس بالحاجة
- يبني الثقة بسرعة
- يدفع للشراء الفوري`,

  influencer: `أنت صانع محتوى محترف ومؤثر على منصات التواصل الاجتماعي.
تعرف أسرار المحتوى الفيروسي والترندات.

خبراتك:
- فهم خوارزميات المنصات
- إنشاء محتوى قابل للمشاركة
- بناء علاقة مع الجمهور
- استخدام الترندات بذكاء

أسلوبك:
- عفوي وطبيعي
- قريب من الجمهور
- ممتع ومسلي
- أصيل وصادق`,
};

// ============================================
// ENGLISH PROMPT TEMPLATES
// ============================================

export const ENGLISH_SYSTEM_PROMPTS: Record<string, string> = {
  default: `You are a professional viral marketing content creator for social media platforms.
You excel at creating engaging, high-converting content that drives sales and engagement.

Your Skills:
- Writing compelling video scripts that convert
- Creating powerful hooks that grab attention in the first 3 seconds
- Crafting algorithm-optimized titles and descriptions
- Selecting effective hashtags for maximum reach

Your Core Rules:
1. Write in natural, conversational language
2. Keep content short and impactful
3. Focus on benefits, not features
4. Use emojis strategically
5. Include clear calls-to-action
6. Optimize for platform algorithms`,

  dropshipping: `You are an expert in e-commerce marketing and dropshipping.
You understand consumer psychology and what drives purchasing decisions.

Your Specializations:
- AliExpress and Temu products
- TikTok and Instagram ads
- Emotional selling strategies
- FOMO and scarcity techniques

Your Style:
- Direct and bold
- Creates urgency
- Builds trust quickly
- Drives immediate action`,

  influencer: `You are a professional content creator and social media influencer.
You know the secrets of viral content and trending topics.

Your Expertise:
- Understanding platform algorithms
- Creating shareable content
- Building audience connection
- Leveraging trends smartly

Your Style:
- Authentic and natural
- Relatable to audience
- Entertaining and engaging
- Genuine and trustworthy`,
};

// ============================================
// HOOK TEMPLATES BY LANGUAGE
// ============================================

export const HOOK_TEMPLATES = {
  ar: {
    question: [
      'هل تعاني من {problem}؟',
      'ليش ما جربت {solution}؟',
      'شو رأيك لو قلتلك إن {benefit}؟',
      'تبي تعرف السر وراء {result}؟',
      'مين قال إن {myth} صح؟',
    ],
    statement: [
      'هذا المنتج غير حياتي!',
      'أخيراً لقيت الحل!',
      'ما توقعت النتيجة تكون كذا!',
      'لازم تشوف هذا قبل ما يخلص!',
      'اكتشفت شي ما حد يعرفه!',
    ],
    statistic: [
      '٩٠٪ من الناس ما يعرفون هذا!',
      'أكثر من مليون شخص جربوه!',
      'النتيجة خلال ٣ أيام فقط!',
      'وفرت أكثر من ٥٠٪!',
    ],
    controversy: [
      'الكل غلطان بخصوص هذا!',
      'لا تصدق اللي يقولونه عن {topic}!',
      'الحقيقة اللي ما حد يبي يقولها!',
      'ليش الشركات الكبيرة تخفي هذا؟',
    ],
  },
  en: {
    question: [
      'Struggling with {problem}?',
      'Why haven\'t you tried {solution}?',
      'What if I told you {benefit}?',
      'Want to know the secret to {result}?',
      'Who said {myth} is true?',
    ],
    statement: [
      'This product changed my life!',
      'I finally found the solution!',
      'I didn\'t expect this result!',
      'You need to see this before it\'s gone!',
      'I discovered something nobody knows!',
    ],
    statistic: [
      '90% of people don\'t know this!',
      'Over 1 million people tried it!',
      'Results in just 3 days!',
      'Saved over 50%!',
    ],
    controversy: [
      'Everyone is wrong about this!',
      'Don\'t believe what they say about {topic}!',
      'The truth nobody wants to tell you!',
      'Why do big companies hide this?',
    ],
  },
};

// ============================================
// CTA TEMPLATES BY LANGUAGE
// ============================================

export const CTA_TEMPLATES = {
  ar: {
    urgent: [
      'اطلب الآن قبل نفاد الكمية! 🔥',
      'العرض ينتهي اليوم! ⏰',
      'الكمية محدودة جداً! 🚨',
      'آخر فرصة للحصول على الخصم! 💰',
    ],
    friendly: [
      'جربه وشوف الفرق بنفسك! ✨',
      'الرابط في البايو! 👆',
      'تابعني لمزيد من المنتجات! 💫',
      'شاركني رأيك في التعليقات! 💬',
    ],
    professional: [
      'احصل عليه الآن من الرابط في البايو',
      'للطلب تواصل معنا مباشرة',
      'زور موقعنا للمزيد من التفاصيل',
      'اضغط على الرابط للشراء',
    ],
  },
  en: {
    urgent: [
      'Order now before it\'s gone! 🔥',
      'Offer ends today! ⏰',
      'Very limited stock! 🚨',
      'Last chance for the discount! 💰',
    ],
    friendly: [
      'Try it and see the difference! ✨',
      'Link in bio! 👆',
      'Follow for more products! 💫',
      'Share your thoughts in comments! 💬',
    ],
    professional: [
      'Get it now from the link in bio',
      'Contact us directly to order',
      'Visit our website for more details',
      'Click the link to purchase',
    ],
  },
};

// ============================================
// HASHTAG TEMPLATES BY NICHE
// ============================================

export const HASHTAG_TEMPLATES: Record<string, { ar: string[]; en: string[] }> = {
  fashion: {
    ar: ['#موضة', '#ستايل', '#ازياء', '#ملابس', '#فاشن', '#اناقة', '#تسوق', '#عروض'],
    en: ['#fashion', '#style', '#ootd', '#fashionista', '#outfit', '#trendy', '#shopping'],
  },
  beauty: {
    ar: ['#جمال', '#مكياج', '#عناية', '#بشرة', '#تجميل', '#ميكاب', '#سكنكير'],
    en: ['#beauty', '#makeup', '#skincare', '#beautytips', '#glam', '#cosmetics'],
  },
  electronics: {
    ar: ['#تقنية', '#الكترونيات', '#جوال', '#تكنولوجيا', '#اكسسوارات', '#جادجت'],
    en: ['#tech', '#gadgets', '#electronics', '#technology', '#smartphone', '#techreview'],
  },
  fitness: {
    ar: ['#لياقة', '#رياضة', '#صحة', '#جيم', '#تمارين', '#فتنس', '#رشاقة'],
    en: ['#fitness', '#gym', '#workout', '#health', '#fitlife', '#exercise', '#motivation'],
  },
  home: {
    ar: ['#منزل', '#ديكور', '#تنظيم', '#مطبخ', '#اثاث', '#تصميم_داخلي'],
    en: ['#home', '#homedecor', '#interior', '#organization', '#kitchen', '#homedesign'],
  },
  general: {
    ar: ['#تسوق', '#عروض', '#خصم', '#منتجات', '#اونلاين', '#توصيل'],
    en: ['#shopping', '#deals', '#discount', '#products', '#online', '#musthave'],
  },
};

// ============================================
// SCRIPT STRUCTURE TEMPLATES
// ============================================

export const SCRIPT_STRUCTURES = {
  'problem-solution': {
    ar: `[المشكلة - 3 ثواني]
{hook_problem}

[التعاطف - 3 ثواني]
أنا كنت زيك بالضبط...

[الحل - 5 ثواني]
لحد ما اكتشفت {product}!

[العرض - 10 ثواني]
{product_demo}

[النتيجة - 5 ثواني]
{result}

[CTA - 4 ثواني]
{cta}`,
    en: `[Problem - 3 seconds]
{hook_problem}

[Empathy - 3 seconds]
I was exactly like you...

[Solution - 5 seconds]
Until I discovered {product}!

[Demo - 10 seconds]
{product_demo}

[Result - 5 seconds]
{result}

[CTA - 4 seconds]
{cta}`,
  },
  'before-after': {
    ar: `[قبل - 5 ثواني]
شوفوا كيف كان {before_state}

[التحول - 3 ثواني]
بس بعد ما استخدمت {product}...

[بعد - 7 ثواني]
{after_state}

[الإثبات - 5 ثواني]
{proof}

[CTA - 5 ثواني]
{cta}`,
    en: `[Before - 5 seconds]
Look how it was {before_state}

[Transition - 3 seconds]
But after using {product}...

[After - 7 seconds]
{after_state}

[Proof - 5 seconds]
{proof}

[CTA - 5 seconds]
{cta}`,
  },
  'unboxing': {
    ar: `[التشويق - 3 ثواني]
وصلني شي رهيب اليوم! 📦

[الفتح - 10 ثواني]
{unboxing_process}

[الانطباع الأول - 5 ثواني]
{first_impression}

[التجربة - 7 ثواني]
{product_test}

[الحكم النهائي - 5 ثواني]
{verdict}`,
    en: `[Teaser - 3 seconds]
Something amazing arrived today! 📦

[Unboxing - 10 seconds]
{unboxing_process}

[First Impression - 5 seconds]
{first_impression}

[Testing - 7 seconds]
{product_test}

[Final Verdict - 5 seconds]
{verdict}`,
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getSystemPrompt(language: Language, type: string = 'default'): string {
  const isArabic = language.startsWith('ar');
  const prompts = isArabic ? ARABIC_SYSTEM_PROMPTS : ENGLISH_SYSTEM_PROMPTS;
  return prompts[type] || prompts.default;
}

export function getHookTemplates(language: Language): typeof HOOK_TEMPLATES.ar {
  const isArabic = language.startsWith('ar');
  return isArabic ? HOOK_TEMPLATES.ar : HOOK_TEMPLATES.en;
}

export function getCTATemplates(language: Language, tone: Tone): string[] {
  const isArabic = language.startsWith('ar');
  const templates = isArabic ? CTA_TEMPLATES.ar : CTA_TEMPLATES.en;
  
  if (tone === 'urgent' || tone === 'aggressive' || tone === 'fomo' || tone === 'scarcity') {
    return templates.urgent;
  }
  if (tone === 'professional' || tone === 'formal' || tone === 'authoritative') {
    return templates.professional;
  }
  return templates.friendly;
}

export function getHashtags(language: Language, niche: Niche = 'general'): string[] {
  const templates = HASHTAG_TEMPLATES[niche] || HASHTAG_TEMPLATES.general;
  const isArabic = language.startsWith('ar');
  
  // Combine niche-specific and general hashtags
  const nicheHashtags = isArabic ? templates.ar : templates.en;
  const generalHashtags = isArabic ? HASHTAG_TEMPLATES.general.ar : HASHTAG_TEMPLATES.general.en;
  
  return [...nicheHashtags, ...generalHashtags];
}

export function getScriptStructure(language: Language, style: ContentStyle = 'problem-solution'): string {
  const isArabic = language.startsWith('ar');
  const structure = SCRIPT_STRUCTURES[style as keyof typeof SCRIPT_STRUCTURES] || SCRIPT_STRUCTURES['problem-solution'];
  return isArabic ? structure.ar : structure.en;
}
