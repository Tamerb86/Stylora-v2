import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, supabase } from './supabase';
import type {
  ApiResponse,
  UserWithPlan,
  Product,
  ProductWithContent,
  Plan,
  SubscriptionInfo,
  FullPackageResult,
  GenerateFormData,
  CreateProductFormData,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private tokenRefreshPromise: Promise<string | null> | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    // Add auth token to requests
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        try {
          // Get current access token
          const token = await this.getValidToken();
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse<unknown>>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // If 401 and we haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Refresh the session
            const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !session) {
              // Refresh failed, user needs to re-login
              throw new Error('Session expired. Please log in again.');
            }

            // Retry the original request with new token
            originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed
            return Promise.reject(new Error('Session expired. Please log in again.'));
          }
        }

        // Extract error message
        const message = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(message));
      }
    );
  }

  // Get valid token, refreshing if necessary
  private async getValidToken(): Promise<string | null> {
    // If there's already a refresh in progress, wait for it
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return null;
      }

      // Check if token is about to expire (within 60 seconds)
      const expiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      if (expiresAt && expiresAt - now < 60) {
        // Token is about to expire, refresh it
        this.tokenRefreshPromise = this.refreshToken();
        const newToken = await this.tokenRefreshPromise;
        this.tokenRefreshPromise = null;
        return newToken;
      }

      return session.access_token;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  // Refresh the token
  private async refreshToken(): Promise<string | null> {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        return null;
      }

      return session.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  }

  // Health check
  async health(): Promise<ApiResponse<{ status: string }>> {
    const { data } = await this.client.get('/health');
    return data;
  }

  // User endpoints
  async getMe(): Promise<ApiResponse<UserWithPlan>> {
    const { data } = await this.client.get('/me');
    return data;
  }

  async updateProfile(updates: { name?: string }): Promise<ApiResponse<UserWithPlan>> {
    const { data } = await this.client.patch('/me', updates);
    return data;
  }

  // Product endpoints
  async getProducts(page = 1, limit = 20): Promise<ApiResponse<{ products: Product[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>> {
    const { data } = await this.client.get('/products', { params: { page, limit } });
    return data;
  }

  async getProduct(id: number): Promise<ApiResponse<ProductWithContent>> {
    const { data } = await this.client.get(`/products/${id}`);
    return data;
  }

  async createProduct(product: CreateProductFormData): Promise<ApiResponse<Product>> {
    const { data } = await this.client.post('/products', {
      source: product.source,
      source_url: product.sourceUrl,
      title: product.title,
      raw_description: product.rawDescription,
      images: product.images,
      price_raw: product.priceRaw,
      currency: product.currency,
    });
    return data;
  }

  async updateProduct(id: number, updates: Partial<CreateProductFormData>): Promise<ApiResponse<Product>> {
    const { data } = await this.client.patch(`/products/${id}`, {
      title: updates.title,
      raw_description: updates.rawDescription,
      images: updates.images,
      price_raw: updates.priceRaw,
      currency: updates.currency,
    });
    return data;
  }

  async deleteProduct(id: number): Promise<ApiResponse<null>> {
    const { data } = await this.client.delete(`/products/${id}`);
    return data;
  }

  // Generation endpoints
  async generateFullPackage(input: GenerateFormData): Promise<ApiResponse<FullPackageResult>> {
    const { data } = await this.client.post('/generate/full-package', {
      product_id: input.productId,
      language: input.language,
      platform: input.platform,
      tone: input.tone,
      niche: input.niche,
      target_audience: input.targetAudience,
    });
    return data;
  }

  async getUsage(): Promise<ApiResponse<{
    currentMonthUsage: number;
    monthlyLimit: number | null;
    remainingRequests: number | null;
    isWithinLimit: boolean;
    planCode: string;
  }>> {
    const { data } = await this.client.get('/generate/usage');
    return data;
  }

  async getGenerationOptions(): Promise<ApiResponse<{
    languages: { code: string; name: string }[];
    platforms: { code: string; name: string }[];
    tones: { code: string; name: string; category: string }[];
    niches: { code: string; name: string }[];
  }>> {
    const { data } = await this.client.get('/generate/options');
    return data;
  }

  // Plans endpoints
  async getPlans(): Promise<ApiResponse<{ plans: Plan[] }>> {
    const { data } = await this.client.get('/plans');
    return data;
  }

  // Billing endpoints
  async getSubscription(): Promise<ApiResponse<SubscriptionInfo>> {
    const { data } = await this.client.get('/billing/subscription');
    return data;
  }

  async createCheckoutSession(planCode: 'pro' | 'business'): Promise<ApiResponse<{ checkout_url: string }>> {
    const { data } = await this.client.post('/billing/create-checkout-session', {
      plan_code: planCode,
    });
    return data;
  }

  async createPortalSession(): Promise<ApiResponse<{ portal_url: string }>> {
    const { data } = await this.client.post('/billing/create-portal-session');
    return data;
  }

  async cancelSubscription(): Promise<ApiResponse<null>> {
    const { data } = await this.client.post('/billing/cancel');
    return data;
  }

  async resumeSubscription(): Promise<ApiResponse<null>> {
    const { data } = await this.client.post('/billing/resume');
    return data;
  }
}

export const api = new ApiClient();
