import OpenAI from 'openai';
import {
  type ProductInput,
  type GenerationOptions,
  type GeneratedContent,
  type GenerationResult,
  type LLMModel,
  type Language,
  LANGUAGES,
  PLATFORMS,
  TONES,
  NICHES,
  OpenAIServiceError,
} from './openai.types.js';

// Default model
const DEFAULT_MODEL: LLMModel = 'gpt-4o-mini';

// Initialize OpenAI client
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new OpenAIServiceError(
      'OPENAI_API_KEY is not configured',
      'MISSING_API_KEY',
      500
    );
  }

  // Support for custom base URL (OpenRouter, Together, etc.)
  const baseURL = process.env.OPENAI_BASE_URL || undefined;

  return new OpenAI({
    apiKey,
    baseURL,
  });
}

/**
 * Build the system prompt based on language
 */
function buildSystemPrompt(language: Language): string {
  const isArabic = language.startsWith('ar');

  if (isArabic) {
    return `أنت خبير محترف في إنشاء محتوى تسويقي فيروسي لمنصات التواصل الاجتماعي.

دورك:
- إنشاء محتوى تسويقي احترافي وجذاب
- كتابة سكربتات فيديو قصيرة ومؤثرة
- صياغة خطافات (Hooks) قوية تجذب الانتباه
- إنشاء أوصاف وهاشتاقات محسنة للخوارزميات

قواعد صارمة:
1. أرجع JSON فقط - بدون أي نص قبله أو بعده
2. اكتب بلغة عربية طبيعية وسلسة
3. تجنب الترجمة الحرفية من الإنجليزية
4. اجعل المحتوى قصيراً ومؤثراً
5. ركز على الفوائد وليس الميزات
6. استخدم الإيموجي بشكل معتدل`;
  }

  return `You are a professional viral marketing content creator for social media platforms.

Your Role:
- Create professional and engaging marketing content
- Write short, impactful video scripts
- Craft powerful hooks that grab attention
- Create algorithm-optimized descriptions and hashtags

Strict Rules:
1. Return JSON only - no text before or after
2. Write in natural, engaging language
3. Keep content short and impactful
4. Focus on benefits, not features
5. Use emojis moderately
6. Optimize for platform algorithms`;
}

/**
 * Build the user prompt with product details - CLEAR AND ORGANIZED
 */
function buildUserPrompt(product: ProductInput, options: GenerationOptions): string {
  const isArabic = options.language.startsWith('ar');
  const lang = LANGUAGES[options.language];
  const platform = PLATFORMS[options.platform];
  const tone = TONES[options.tone];
  const niche = options.niche ? NICHES[options.niche] : null;

  // Extract key features from description
  const features = product.rawDescription 
    ? product.rawDescription.split(/[.،,\n]/).filter(f => f.trim().length > 5).slice(0, 5)
    : [];

  if (isArabic) {
    return `═══════════════════════════════════════════════════════════
                    مدخلات المنتج
═══════════════════════════════════════════════════════════

📦 عنوان المنتج:
${product.title || 'غير محدد'}

📝 وصف المنتج:
${product.rawDescription || 'غير محدد'}

⭐ الميزات الرئيسية:
${features.length > 0 ? features.map((f, i) => `${i + 1}. ${f.trim()}`).join('\n') : 'غير محددة'}

💰 السعر:
${product.priceRaw || 'غير محدد'} ${product.currency || ''}

🔗 المصدر:
${product.source || 'غير محدد'}

═══════════════════════════════════════════════════════════
                    إعدادات التوليد
═══════════════════════════════════════════════════════════

🌐 لغة الإخراج: ${lang.nativeName}
📱 المنصة المستهدفة: ${platform.name}
🎭 النبرة: ${tone.nameAr}
${niche ? `📂 المجال: ${niche.nameAr}` : ''}
${options.targetAudience ? `👥 الجمهور المستهدف: ${options.targetAudience}` : ''}

═══════════════════════════════════════════════════════════
                    المطلوب توليده
═══════════════════════════════════════════════════════════

أنشئ محتوى تسويقي كامل بالتنسيق التالي:

{
  "script": "سكربت فيديو كامل (20-30 ثانية) يتضمن:
    - Hook قوي في أول 3 ثواني
    - عرض المشكلة والحل
    - إبراز الفوائد الرئيسية
    - Call to Action واضح
    - تعليمات التصوير بين [أقواس]",
    
  "angles": [
    "5 زوايا إبداعية مختلفة لعرض المنتج",
    "كل زاوية تركز على جانب مختلف",
    "مثال: زاوية المشكلة، زاوية الفائدة، زاوية المقارنة..."
  ],
  
  "hooks": [
    "10 خطافات قوية لجذب الانتباه في أول 3 ثواني",
    "متنوعة: سؤال، تصريح صادم، إحصائية، قصة...",
    "كل hook يجب أن يثير الفضول ويوقف التمرير"
  ],
  
  "captions": [
    "5 نصوص وصفية للفيديو",
    "تتضمن emoji مناسب",
    "تنتهي بـ CTA"
  ],
  
  "hashtags": [
    "20 هاشتاق مناسب",
    "مزيج من: هاشتاقات النيش + ترندات + عامة",
    "بالعربي والإنجليزي"
  ],
  
  "thumbnailText": [
    "3 نصوص قصيرة للصور المصغرة",
    "كلمات قوية ومؤثرة",
    "تثير الفضول للنقر"
  ]
}

⚠️ مهم جداً: أرجع JSON فقط بدون أي نص إضافي قبله أو بعده.`;
  }

  // English prompt
  return `═══════════════════════════════════════════════════════════
                    PRODUCT INPUT
═══════════════════════════════════════════════════════════

📦 Product Title:
${product.title || 'Not specified'}

📝 Product Description:
${product.rawDescription || 'Not specified'}

⭐ Key Features:
${features.length > 0 ? features.map((f, i) => `${i + 1}. ${f.trim()}`).join('\n') : 'Not specified'}

💰 Price:
${product.priceRaw || 'Not specified'} ${product.currency || ''}

🔗 Source:
${product.source || 'Not specified'}

═══════════════════════════════════════════════════════════
                    GENERATION SETTINGS
═══════════════════════════════════════════════════════════

🌐 Output Language: ${lang.name}
📱 Target Platform: ${platform.name}
🎭 Tone: ${tone.name}
${niche ? `📂 Niche: ${niche.name}` : ''}
${options.targetAudience ? `👥 Target Audience: ${options.targetAudience}` : ''}

═══════════════════════════════════════════════════════════
                    REQUIRED OUTPUT
═══════════════════════════════════════════════════════════

Create complete marketing content in the following format:

{
  "script": "Complete video script (20-30 seconds) including:
    - Powerful hook in first 3 seconds
    - Problem and solution presentation
    - Highlight key benefits
    - Clear Call to Action
    - Filming directions in [brackets]",
    
  "angles": [
    "5 different creative angles to showcase the product",
    "Each angle focuses on a different aspect",
    "Example: problem angle, benefit angle, comparison angle..."
  ],
  
  "hooks": [
    "10 powerful hooks to grab attention in first 3 seconds",
    "Varied: question, shocking statement, statistic, story...",
    "Each hook must spark curiosity and stop scrolling"
  ],
  
  "captions": [
    "5 engaging video captions",
    "Include appropriate emojis",
    "End with CTA"
  ],
  
  "hashtags": [
    "20 relevant hashtags",
    "Mix of: niche hashtags + trending + general",
    "Optimized for discoverability"
  ],
  
  "thumbnailText": [
    "3 short thumbnail text options",
    "Powerful, impactful words",
    "Spark curiosity to click"
  ]
}

⚠️ IMPORTANT: Return JSON only without any additional text before or after.`;
}

/**
 * Parse the AI response into structured content
 */
function parseResponse(response: string): GeneratedContent {
  try {
    // Clean the response
    let jsonStr = response.trim();
    
    // Remove markdown code blocks if present
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to find JSON object
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response with exact counts
    const content: GeneratedContent = {
      script: typeof parsed.script === 'string' ? parsed.script : '',
      angles: [],
      hooks: [],
      captions: [],
      hashtags: [],
      thumbnailText: [],
    };

    // Ensure arrays and correct counts
    if (Array.isArray(parsed.angles)) {
      content.angles = parsed.angles.filter((a: unknown) => typeof a === 'string').slice(0, 5);
    }
    
    if (Array.isArray(parsed.hooks)) {
      content.hooks = parsed.hooks.filter((h: unknown) => typeof h === 'string').slice(0, 10);
    }
    
    if (Array.isArray(parsed.captions)) {
      content.captions = parsed.captions.filter((c: unknown) => typeof c === 'string').slice(0, 5);
    }
    
    if (Array.isArray(parsed.hashtags)) {
      content.hashtags = parsed.hashtags
        .filter((h: unknown) => typeof h === 'string')
        .map((h: string) => h.startsWith('#') ? h : `#${h}`)
        .slice(0, 20);
    }
    
    if (Array.isArray(parsed.thumbnailText)) {
      content.thumbnailText = parsed.thumbnailText.filter((t: unknown) => typeof t === 'string').slice(0, 3);
    }

    return content;
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    console.error('Raw response:', response);
    throw new OpenAIServiceError(
      'Failed to parse AI response',
      'PARSE_ERROR',
      500
    );
  }
}

/**
 * Main function to generate product content
 */
export async function generateProductContent(
  product: ProductInput,
  options: GenerationOptions
): Promise<GenerationResult> {
  const startTime = Date.now();
  const model = options.model || DEFAULT_MODEL;

  // Validate required inputs
  if (!product.title && !product.rawDescription) {
    throw new OpenAIServiceError(
      'Product title or description is required',
      'INVALID_INPUT',
      400
    );
  }

  try {
    const client = getOpenAIClient();

    const systemPrompt = buildSystemPrompt(options.language);
    const userPrompt = buildUserPrompt(product, options);

    console.log('🤖 Generating content with model:', model);
    console.log('📝 Language:', options.language);
    console.log('📱 Platform:', options.platform);

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const responseContent = completion.choices[0]?.message?.content;
    
    if (!responseContent) {
      throw new OpenAIServiceError(
        'Empty response from AI',
        'EMPTY_RESPONSE',
        500
      );
    }

    console.log('✅ Response received, parsing...');

    const content = parseResponse(responseContent);
    const processingTimeMs = Date.now() - startTime;

    console.log('✅ Content generated successfully in', processingTimeMs, 'ms');
    console.log('📊 Stats:', {
      scriptLength: content.script.length,
      angles: content.angles.length,
      hooks: content.hooks.length,
      captions: content.captions.length,
      hashtags: content.hashtags.length,
      thumbnailText: content.thumbnailText.length,
    });

    return {
      content,
      metadata: {
        model,
        tokensUsed: completion.usage?.total_tokens || 0,
        language: options.language,
        platform: options.platform,
        tone: options.tone,
        niche: options.niche,
        contentStyle: options.contentStyle,
        generatedAt: new Date().toISOString(),
        processingTimeMs,
      },
    };
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }

    if (error instanceof OpenAI.APIError) {
      console.error('OpenAI API Error:', error.message);
      throw new OpenAIServiceError(
        error.message,
        error.code || 'API_ERROR',
        error.status || 500
      );
    }

    console.error('Unexpected error:', error);
    throw new OpenAIServiceError(
      'Failed to generate content',
      'GENERATION_ERROR',
      500
    );
  }
}

/**
 * Generate content for a specific type only
 */
export async function generateSingleContent(
  product: ProductInput,
  options: GenerationOptions,
  contentType: keyof GeneratedContent
): Promise<string | string[]> {
  const result = await generateProductContent(product, options);
  return result.content[contentType];
}

/**
 * Validate API key
 */
export async function validateApiKey(): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    await client.models.list();
    return true;
  } catch {
    return false;
  }
}

// Export types
export * from './openai.types.js';
