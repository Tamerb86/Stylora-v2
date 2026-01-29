import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { products, generatedContents } from '../db/schema.js';
import type { Product, NewProduct, GeneratedContent } from '../db/types.js';

export interface ProductWithLatestContent extends Product {
  latestContent?: GeneratedContent | null;
}

export interface CreateProductInput {
  userId: string;
  source: string;
  sourceUrl?: string;
  title?: string;
  rawDescription?: string;
  images?: string[];
  priceRaw?: string;
  currency?: string;
}

class ProductService {
  /**
   * Get all products for a user
   */
  async getProductsByUserId(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Product[]> {
    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    const result = await db
      .select()
      .from(products)
      .where(eq(products.userId, userId))
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return result;
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get product by ID with ownership check
   */
  async getProductByIdForUser(
    id: string,
    userId: string
  ): Promise<Product | null> {
    const result = await db
      .select()
      .from(products)
      .where(and(eq(products.id, id), eq(products.userId, userId)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Get product with latest generated content
   */
  async getProductWithLatestContent(
    id: string,
    userId: string
  ): Promise<ProductWithLatestContent | null> {
    // Get product
    const product = await this.getProductByIdForUser(id, userId);
    
    if (!product) {
      return null;
    }

    // Get latest generated content for this product
    const latestContent = await db
      .select()
      .from(generatedContents)
      .where(eq(generatedContents.productId, id))
      .orderBy(desc(generatedContents.createdAt))
      .limit(1);

    return {
      ...product,
      latestContent: latestContent.length > 0 ? latestContent[0] : null,
    };
  }

  /**
   * Create a new product
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    const productId = uuidv4();

    const newProduct: NewProduct = {
      id: productId,
      userId: input.userId,
      source: input.source,
      sourceUrl: input.sourceUrl ?? null,
      title: input.title ?? null,
      rawDescription: input.rawDescription ?? null,
      images: input.images ?? [],
      priceRaw: input.priceRaw ?? null,
      currency: input.currency ?? null,
      languageDetected: null, // Will be detected later
    };

    await db.insert(products).values(newProduct);

    const created = await this.getProductById(productId);
    
    if (!created) {
      throw new Error('Failed to create product');
    }

    return created;
  }

  /**
   * Update a product
   */
  async updateProduct(
    id: string,
    userId: string,
    data: Partial<CreateProductInput>
  ): Promise<Product | null> {
    // Check ownership
    const existing = await this.getProductByIdForUser(id, userId);
    
    if (!existing) {
      return null;
    }

    const updateData: Partial<NewProduct> = {};
    
    if (data.source !== undefined) updateData.source = data.source;
    if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.rawDescription !== undefined) updateData.rawDescription = data.rawDescription;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.priceRaw !== undefined) updateData.priceRaw = data.priceRaw;
    if (data.currency !== undefined) updateData.currency = data.currency;

    await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id));

    return this.getProductById(id);
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: string, userId: string): Promise<boolean> {
    // Check ownership
    const existing = await this.getProductByIdForUser(id, userId);
    
    if (!existing) {
      return false;
    }

    await db.delete(products).where(eq(products.id, id));
    
    return true;
  }

  /**
   * Count products for a user
   */
  async countProductsByUserId(userId: string): Promise<number> {
    const result = await db
      .select()
      .from(products)
      .where(eq(products.userId, userId));

    return result.length;
  }
}

export const productService = new ProductService();
