import { storage } from './storage';
import type { ExtractedProduct } from './extractors';

// API Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserProfile {
  id: number;
  email: string;
  name?: string;
  plan: {
    code: string;
    name: string;
    monthlyLimitRequests: number;
  };
  subscription?: {
    status: string;
    currentPeriodEnd?: string;
  };
  usage: {
    currentMonthUsage: number;
    remainingRequests: number;
    monthlyLimit: number;
    isUnlimited: boolean;
  };
}

interface Product {
  id: number;
  title: string;
  source: string;
  sourceUrl: string;
  rawDescription?: string;
  images?: string[];
  priceRaw?: string;
  currency?: string;
  createdAt: string;
}

interface GenerationResult {
  content: {
    script: string;
    angles: string[];
    hooks: string[];
    captions: string[];
    hashtags: string[];
    thumbnailText: string[];
  };
  metadata: {
    model: string;
    tokensUsed: number;
    language: string;
    platform: string;
    tone: string;
    generatedAt: string;
    processingTimeMs: number;
  };
  savedContentId: number;
  usage: {
    currentMonthUsage: number;
    remainingRequests: number;
    monthlyLimit: number;
  };
}

// API Client class
class ApiClient {
  private async getBaseUrl(): Promise<string> {
    return await storage.getApiUrl();
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await storage.getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const baseUrl = await this.getBaseUrl();
    const headers = await this.getHeaders();

    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Request failed',
        };
      }

      return data;
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth
  async verifyToken(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/me');
  }

  // User
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/me');
  }

  // Products
  async createProduct(product: ExtractedProduct): Promise<ApiResponse<Product>> {
    return this.request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify({
        source: product.source,
        source_url: product.sourceUrl,
        title: product.title,
        raw_description: product.description,
        images: product.images,
        price_raw: product.price,
        currency: product.currency,
      }),
    });
  }

  async getProducts(): Promise<ApiResponse<{ products: Product[]; total: number }>> {
    return this.request('/products');
  }

  async getProduct(id: number): Promise<ApiResponse<Product>> {
    return this.request(`/products/${id}`);
  }

  // Generation
  async generateContent(params: {
    productId: number;
    language: string;
    platform: string;
    tone: string;
    niche?: string;
    targetAudience?: string;
  }): Promise<ApiResponse<GenerationResult>> {
    return this.request<GenerationResult>('/generate/full-package', {
      method: 'POST',
      body: JSON.stringify({
        product_id: params.productId,
        language: params.language,
        platform: params.platform,
        tone: params.tone,
        niche: params.niche,
        target_audience: params.targetAudience,
      }),
    });
  }

  async getUsage(): Promise<ApiResponse<{
    currentMonthUsage: number;
    remainingRequests: number;
    monthlyLimit: number;
    isUnlimited: boolean;
  }>> {
    return this.request('/generate/usage');
  }

  // Quick generate (extract + create + generate in one call)
  async quickGenerate(
    product: ExtractedProduct,
    options: {
      language: string;
      platform: string;
      tone: string;
      niche?: string;
    }
  ): Promise<ApiResponse<GenerationResult & { product: Product }>> {
    // First create the product
    const productResult = await this.createProduct(product);
    if (!productResult.success || !productResult.data) {
      return {
        success: false,
        error: productResult.error || 'Failed to create product',
      };
    }

    // Then generate content
    const generationResult = await this.generateContent({
      productId: productResult.data.id,
      ...options,
    });

    if (!generationResult.success || !generationResult.data) {
      return {
        success: false,
        error: generationResult.error || 'Failed to generate content',
      };
    }

    return {
      success: true,
      data: {
        ...generationResult.data,
        product: productResult.data,
      },
    };
  }
}

export const api = new ApiClient();
