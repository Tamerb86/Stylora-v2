import { z } from 'zod';

// Product validation schemas
export const createProductSchema = z.object({
  source: z.string().min(1, 'Source is required').max(50),
  sourceUrl: z.string().url('Invalid URL').optional().nullable(),
  title: z.string().max(500).optional().nullable(),
  rawDescription: z.string().optional().nullable(),
  images: z.array(z.string().url('Invalid image URL')).optional().default([]),
  priceRaw: z.string().max(50).optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
});

export const updateProductSchema = z.object({
  source: z.string().min(1).max(50).optional(),
  sourceUrl: z.string().url('Invalid URL').optional().nullable(),
  title: z.string().max(500).optional().nullable(),
  rawDescription: z.string().optional().nullable(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  priceRaw: z.string().max(50).optional().nullable(),
  currency: z.string().max(10).optional().nullable(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Type exports
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
