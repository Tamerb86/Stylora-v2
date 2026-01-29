// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  API_URL: 'api_url',
  SETTINGS: 'settings',
  RECENT_PRODUCTS: 'recent_products',
} as const;

// Types
export interface UserData {
  id: number;
  email: string;
  name?: string;
  planCode: string;
}

export interface Settings {
  defaultLanguage: 'ar' | 'en';
  defaultPlatform: string;
  defaultTone: string;
  autoExtract: boolean;
  showNotifications: boolean;
}

export interface RecentProduct {
  id: number;
  title: string;
  source: string;
  createdAt: string;
}

// Default settings
const DEFAULT_SETTINGS: Settings = {
  defaultLanguage: 'ar',
  defaultPlatform: 'tiktok',
  defaultTone: 'friendly',
  autoExtract: true,
  showNotifications: true,
};

// Storage class
class ExtensionStorage {
  // Auth Token
  async getAuthToken(): Promise<string | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
    return result[STORAGE_KEYS.AUTH_TOKEN] || null;
  }

  async setAuthToken(token: string): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.AUTH_TOKEN]: token });
  }

  async clearAuthToken(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.AUTH_TOKEN);
  }

  // User Data
  async getUserData(): Promise<UserData | null> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.USER_DATA);
    return result[STORAGE_KEYS.USER_DATA] || null;
  }

  async setUserData(data: UserData): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.USER_DATA]: data });
  }

  async clearUserData(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEYS.USER_DATA);
  }

  // API URL
  async getApiUrl(): Promise<string> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.API_URL);
    return result[STORAGE_KEYS.API_URL] || 'http://localhost:3000/api/v1';
  }

  async setApiUrl(url: string): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEYS.API_URL]: url });
  }

  // Settings
  async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
  }

  async setSettings(settings: Partial<Settings>): Promise<void> {
    const current = await this.getSettings();
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: { ...current, ...settings },
    });
  }

  // Recent Products
  async getRecentProducts(): Promise<RecentProduct[]> {
    const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT_PRODUCTS);
    return result[STORAGE_KEYS.RECENT_PRODUCTS] || [];
  }

  async addRecentProduct(product: RecentProduct): Promise<void> {
    const products = await this.getRecentProducts();
    const filtered = products.filter(p => p.id !== product.id);
    const updated = [product, ...filtered].slice(0, 10); // Keep last 10
    await chrome.storage.local.set({ [STORAGE_KEYS.RECENT_PRODUCTS]: updated });
  }

  // Check if logged in
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getAuthToken();
    return !!token;
  }

  // Clear all data (logout)
  async clearAll(): Promise<void> {
    await chrome.storage.local.clear();
  }
}

export const storage = new ExtensionStorage();
