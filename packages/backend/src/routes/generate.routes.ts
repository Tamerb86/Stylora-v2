import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { contentService, ContentServiceError } from '../services/content.service.js';
import { usageService } from '../services/usage.service.js';
import { success, error, validationError } from '../utils/response.js';
import {
  LANGUAGES,
  PLATFORMS,
  TONES,
  NICHES,
  LLM_MODELS,
  type Language,
  type Platform,
  type Tone,
  type Niche,
  type LLMModel,
} from '../services/openai.types.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Validation schemas
const generateFullPackageSchema = z.object({
  product_id: z.number().int().positive('Product ID must be a positive integer'),
  language: z.enum(Object.keys(LANGUAGES) as [Language, ...Language[]]),
  platform: z.enum(Object.keys(PLATFORMS) as [Platform, ...Platform[]]),
  tone: z.enum(Object.keys(TONES) as [Tone, ...Tone[]]),
  niche: z.enum(Object.keys(NICHES) as [Niche, ...Niche[]]).optional(),
  target_audience: z.string().max(200).optional(),
  model: z.enum(Object.keys(LLM_MODELS) as [LLMModel, ...LLMModel[]]).optional(),
});

/**
 * POST /api/v1/generate/full-package
 * Generate full content package for a product
 */
router.post('/full-package', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request body
    const validation = generateFullPackageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(
        validationError(validation.error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })))
      );
    }

    const { product_id, language, platform, tone, niche, target_audience, model } = validation.data;

    // Generate content
    const result = await contentService.generateFullPackage(req.user!.id, {
      productId: product_id,
      language,
      platform,
      tone,
      niche,
      targetAudience: target_audience,
      model,
    });

    return res.status(200).json(success(result.data, 'Content generated successfully'));

  } catch (err) {
    console.error('Generate full-package error:', err);

    if (err instanceof ContentServiceError) {
      return res.status(err.statusCode).json(error(err.message, err.code));
    }

    return res.status(500).json(error('Failed to generate content', 'GENERATION_ERROR'));
  }
});

/**
 * GET /api/v1/generate/usage
 * Get current usage statistics
 */
router.get('/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await usageService.getUsageStats(req.user!.id);

    return res.status(200).json(success({
      current_month_usage: stats.currentMonthUsage,
      monthly_limit: stats.monthlyLimit,
      remaining_requests: stats.remainingRequests,
      is_within_limit: stats.isWithinLimit,
      plan_code: stats.planCode,
      period_start: stats.periodStart.toISOString(),
      period_end: stats.periodEnd.toISOString(),
    }));

  } catch (err) {
    console.error('Get usage error:', err);
    return res.status(500).json(error('Failed to get usage statistics', 'USAGE_ERROR'));
  }
});

/**
 * GET /api/v1/generate/history
 * Get content generation history
 */
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    const history = await contentService.getContentHistory(req.user!.id, limit, offset);

    return res.status(200).json(success({
      items: history.map(item => ({
        id: item.id,
        product_id: item.productId,
        product_title: item.productTitle,
        type: item.type,
        language: item.language,
        created_at: item.createdAt,
      })),
      pagination: {
        limit,
        offset,
        has_more: history.length === limit,
      },
    }));

  } catch (err) {
    console.error('Get history error:', err);
    return res.status(500).json(error('Failed to get generation history', 'HISTORY_ERROR'));
  }
});

/**
 * GET /api/v1/generate/content/:id
 * Get specific generated content by ID
 */
router.get('/content/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contentId = parseInt(req.params.id);
    if (isNaN(contentId)) {
      return res.status(400).json(error('Invalid content ID', 'INVALID_ID'));
    }

    const content = await contentService.getContentById(contentId, req.user!.id);
    if (!content) {
      return res.status(404).json(error('Content not found', 'NOT_FOUND'));
    }

    return res.status(200).json(success({
      id: content.id,
      product_id: content.productId,
      type: content.type,
      language: content.language,
      input_params: content.inputParams,
      output: content.output,
      created_at: content.createdAt,
    }));

  } catch (err) {
    console.error('Get content error:', err);
    return res.status(500).json(error('Failed to get content', 'CONTENT_ERROR'));
  }
});

/**
 * GET /api/v1/generate/product/:productId
 * Get all generated contents for a product
 */
router.get('/product/:productId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId)) {
      return res.status(400).json(error('Invalid product ID', 'INVALID_ID'));
    }

    const contents = await contentService.getContentsByProduct(productId, req.user!.id);

    return res.status(200).json(success({
      items: contents.map(content => ({
        id: content.id,
        type: content.type,
        language: content.language,
        input_params: content.inputParams,
        output: content.output,
        created_at: content.createdAt,
      })),
      total: contents.length,
    }));

  } catch (err) {
    console.error('Get product contents error:', err);
    return res.status(500).json(error('Failed to get product contents', 'CONTENT_ERROR'));
  }
});

/**
 * DELETE /api/v1/generate/content/:id
 * Delete generated content
 */
router.delete('/content/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const contentId = parseInt(req.params.id);
    if (isNaN(contentId)) {
      return res.status(400).json(error('Invalid content ID', 'INVALID_ID'));
    }

    const deleted = await contentService.deleteContent(contentId, req.user!.id);
    if (!deleted) {
      return res.status(404).json(error('Content not found', 'NOT_FOUND'));
    }

    return res.status(200).json(success(null, 'Content deleted successfully'));

  } catch (err) {
    console.error('Delete content error:', err);
    return res.status(500).json(error('Failed to delete content', 'DELETE_ERROR'));
  }
});

/**
 * GET /api/v1/generate/options
 * Get all available generation options (languages, platforms, tones, etc.)
 */
router.get('/options', async (_req: Request, res: Response) => {
  try {
    return res.status(200).json(success({
      languages: Object.entries(LANGUAGES).map(([code, info]) => ({
        code,
        name: info.name,
        native_name: info.nativeName,
        rtl: info.rtl,
      })),
      platforms: Object.entries(PLATFORMS).map(([code, info]) => ({
        code,
        name: info.name,
        max_duration: info.maxDuration,
        aspect_ratio: info.aspectRatio,
      })),
      tones: Object.entries(TONES).map(([code, info]) => ({
        code,
        name: info.name,
        name_ar: info.nameAr,
        description: info.description,
      })),
      niches: Object.entries(NICHES).map(([code, info]) => ({
        code,
        name: info.name,
        name_ar: info.nameAr,
        emoji: info.emoji,
      })),
      models: Object.entries(LLM_MODELS).map(([code, info]) => ({
        code,
        name: info.name,
        provider: info.provider,
      })),
    }));

  } catch (err) {
    console.error('Get options error:', err);
    return res.status(500).json(error('Failed to get options', 'OPTIONS_ERROR'));
  }
});

export default router;
