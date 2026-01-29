import { db } from '../db/index.js';
import { generatedContents, products } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { generateProductContent, type GenerationOptions, type GeneratedContent, type GenerationResult } from './openai.service.js';
import { usageService } from './usage.service.js';
import { productService } from './product.service.js';

// Content types enum matching schema
export type ContentType = 'script' | 'creative_angle' | 'hook' | 'caption' | 'hashtags' | 'thumbnail_text' | 'full_package';

export interface GenerateFullPackageInput {
  productId: number;
  language: GenerationOptions['language'];
  platform: GenerationOptions['platform'];
  tone: GenerationOptions['tone'];
  niche?: GenerationOptions['niche'];
  targetAudience?: string;
  model?: GenerationOptions['model'];
}

export interface FullPackageResult {
  success: boolean;
  data: {
    content: GeneratedContent;
    metadata: GenerationResult['metadata'];
    savedContentId: number;
    usage: {
      currentMonthUsage: number;
      remainingRequests: number | null;
      monthlyLimit: number | null;
    };
  };
}

class ContentService {
  /**
   * Generate full content package for a product
   */
  async generateFullPackage(
    userId: number,
    input: GenerateFullPackageInput
  ): Promise<FullPackageResult> {
    const startTime = Date.now();

    // 1. Check usage limits
    const limitCheck = await usageService.canMakeRequest(userId);
    if (!limitCheck.allowed) {
      throw new ContentServiceError(
        limitCheck.reason || 'Usage limit exceeded',
        'LIMIT_EXCEEDED',
        429
      );
    }

    // 2. Get product details
    const product = await productService.getById(input.productId, userId);
    if (!product) {
      throw new ContentServiceError(
        'Product not found',
        'PRODUCT_NOT_FOUND',
        404
      );
    }

    // 3. Prepare product input for AI
    const productInput = {
      title: product.title,
      rawDescription: product.rawDescription,
      priceRaw: product.priceRaw,
      currency: product.currency,
      source: product.source,
      images: product.images as string[] | undefined,
    };

    // 4. Generate content using OpenAI
    const generationOptions: GenerationOptions = {
      language: input.language,
      platform: input.platform,
      tone: input.tone,
      niche: input.niche,
      targetAudience: input.targetAudience,
      model: input.model,
    };

    const result = await generateProductContent(productInput, generationOptions);

    // 5. Save generated content to database
    const [savedContent] = await db
      .insert(generatedContents)
      .values({
        userId,
        productId: input.productId,
        type: 'full_package',
        language: input.language,
        inputParams: JSON.stringify({
          platform: input.platform,
          tone: input.tone,
          niche: input.niche,
          targetAudience: input.targetAudience,
          model: input.model,
        }),
        output: JSON.stringify(result.content),
      })
      .$returningId();

    // 6. Log usage
    const requestTimeMs = Date.now() - startTime;
    await usageService.logUsage({
      userId,
      productId: input.productId,
      generatedContentId: savedContent.id,
      tokensUsed: result.metadata.tokensUsed,
      requestTimeMs,
    });

    // 7. Get updated usage stats
    const updatedStats = await usageService.getUsageStats(userId);

    return {
      success: true,
      data: {
        content: result.content,
        metadata: result.metadata,
        savedContentId: savedContent.id,
        usage: {
          currentMonthUsage: updatedStats.currentMonthUsage,
          remainingRequests: updatedStats.remainingRequests,
          monthlyLimit: updatedStats.monthlyLimit,
        },
      },
    };
  }

  /**
   * Get generated content by ID
   */
  async getContentById(contentId: number, userId: number) {
    const [content] = await db
      .select()
      .from(generatedContents)
      .where(
        and(
          eq(generatedContents.id, contentId),
          eq(generatedContents.userId, userId)
        )
      )
      .limit(1);

    if (!content) {
      return null;
    }

    return {
      ...content,
      inputParams: content.inputParams ? JSON.parse(content.inputParams as string) : null,
      output: content.output ? JSON.parse(content.output as string) : null,
    };
  }

  /**
   * Get all generated contents for a product
   */
  async getContentsByProduct(productId: number, userId: number) {
    const contents = await db
      .select()
      .from(generatedContents)
      .where(
        and(
          eq(generatedContents.productId, productId),
          eq(generatedContents.userId, userId)
        )
      )
      .orderBy(sql`${generatedContents.createdAt} DESC`);

    return contents.map(content => ({
      ...content,
      inputParams: content.inputParams ? JSON.parse(content.inputParams as string) : null,
      output: content.output ? JSON.parse(content.output as string) : null,
    }));
  }

  /**
   * Get user's content history
   */
  async getContentHistory(userId: number, limit: number = 20, offset: number = 0) {
    const contents = await db
      .select({
        id: generatedContents.id,
        productId: generatedContents.productId,
        type: generatedContents.type,
        language: generatedContents.language,
        createdAt: generatedContents.createdAt,
        productTitle: products.title,
      })
      .from(generatedContents)
      .leftJoin(products, eq(generatedContents.productId, products.id))
      .where(eq(generatedContents.userId, userId))
      .orderBy(sql`${generatedContents.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return contents;
  }

  /**
   * Delete generated content
   */
  async deleteContent(contentId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(generatedContents)
      .where(
        and(
          eq(generatedContents.id, contentId),
          eq(generatedContents.userId, userId)
        )
      );

    return (result as any).rowsAffected > 0;
  }
}

// Custom error class
export class ContentServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ContentServiceError';
  }
}

export const contentService = new ContentService();
