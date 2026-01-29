import { useState, useEffect } from 'react';
import { useLocation, useOutletContext, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import type { Product, FullPackageResult, Language, Platform, Tone, Niche } from '../types';
import {
  Plus,
  Package,
  Sparkles,
  Loader2,
  X,
  ExternalLink,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

// Generation Options
const LANGUAGES: { code: Language; name: string }[] = [
  { code: 'ar', name: 'Arabic (Modern Standard)' },
  { code: 'ar_eg', name: 'Arabic (Egyptian)' },
  { code: 'ar_sa', name: 'Arabic (Saudi)' },
  { code: 'ar_ae', name: 'Arabic (UAE)' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'tr', name: 'Turkish' },
];

const PLATFORMS: { code: Platform; name: string }[] = [
  { code: 'tiktok', name: 'TikTok' },
  { code: 'instagram_reels', name: 'Instagram Reels' },
  { code: 'instagram_stories', name: 'Instagram Stories' },
  { code: 'youtube_shorts', name: 'YouTube Shorts' },
  { code: 'facebook_reels', name: 'Facebook Reels' },
  { code: 'snapchat', name: 'Snapchat' },
];

const TONES: { code: Tone; name: string; category: string }[] = [
  { code: 'friendly', name: 'Friendly', category: 'Casual' },
  { code: 'casual', name: 'Casual', category: 'Casual' },
  { code: 'professional', name: 'Professional', category: 'Formal' },
  { code: 'humorous', name: 'Humorous', category: 'Fun' },
  { code: 'urgent', name: 'Urgent', category: 'Sales' },
  { code: 'persuasive', name: 'Persuasive', category: 'Sales' },
  { code: 'inspirational', name: 'Inspirational', category: 'Emotional' },
  { code: 'storytelling', name: 'Storytelling', category: 'Emotional' },
];

const NICHES: { code: Niche; name: string }[] = [
  { code: 'fashion', name: 'Fashion' },
  { code: 'beauty', name: 'Beauty' },
  { code: 'electronics', name: 'Electronics' },
  { code: 'home', name: 'Home & Living' },
  { code: 'fitness', name: 'Fitness' },
  { code: 'health', name: 'Health' },
  { code: 'food', name: 'Food' },
  { code: 'pets', name: 'Pets' },
  { code: 'general', name: 'General' },
];

interface DashboardContext {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  loadingProducts: boolean;
}

export default function DashboardPage() {
  const location = useLocation();
  const { profile } = useAuthStore();
  const { products, setProducts, loadingProducts } = useOutletContext<DashboardContext>();

  // State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [generationResult, setGenerationResult] = useState<FullPackageResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Form state
  const [newProduct, setNewProduct] = useState({
    title: '',
    rawDescription: '',
    source: 'manual',
    sourceUrl: '',
    priceRaw: '',
    currency: 'USD',
  });

  const [generationSettings, setGenerationSettings] = useState({
    language: 'ar' as Language,
    platform: 'tiktok' as Platform,
    tone: 'friendly' as Tone,
    niche: 'general' as Niche,
  });

  // Check if we should open add product modal
  useEffect(() => {
    if (location.state?.openAddProduct) {
      setShowAddProduct(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Create product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.title) {
      toast.error('Please enter a product title');
      return;
    }

    setCreatingProduct(true);
    try {
      const response = await api.createProduct({
        title: newProduct.title,
        rawDescription: newProduct.rawDescription,
        source: newProduct.source,
        sourceUrl: newProduct.sourceUrl || undefined,
        priceRaw: newProduct.priceRaw || undefined,
        currency: newProduct.currency || undefined,
      });

      if (response.success && response.data) {
        setProducts((prev) => [response.data!, ...prev]);
        setSelectedProduct(response.data);
        setShowAddProduct(false);
        setNewProduct({
          title: '',
          rawDescription: '',
          source: 'manual',
          sourceUrl: '',
          priceRaw: '',
          currency: 'USD',
        });
        toast.success('Product created successfully!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setCreatingProduct(false);
    }
  };

  // Generate content
  const handleGenerate = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }

    setGenerating(true);
    setGenerationResult(null);

    try {
      const response = await api.generateFullPackage({
        productId: selectedProduct.id,
        language: generationSettings.language,
        platform: generationSettings.platform,
        tone: generationSettings.tone,
        niche: generationSettings.niche,
      });

      if (response.success && response.data) {
        setGenerationResult(response.data);
        toast.success('Content generated successfully!');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.name || 'Creator'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Generate viral content for your products
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Product Selection */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Products</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </button>
            </div>

            {loadingProducts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No products yet</p>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="btn-outline btn-sm"
                >
                  Add your first product
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className={clsx(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedProduct?.id === product.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 truncate">
                        {product.title}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                    {product.priceRaw && (
                      <span className="text-sm text-gray-500">
                        {product.priceRaw} {product.currency}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Generation Settings */}
          {selectedProduct && (
            <div className="card p-6 mt-6">
              <h2 className="font-semibold text-gray-900 mb-4">Generation Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="label">Language</label>
                  <select
                    value={generationSettings.language}
                    onChange={(e) =>
                      setGenerationSettings((s) => ({ ...s, language: e.target.value as Language }))
                    }
                    className="input"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Platform</label>
                  <select
                    value={generationSettings.platform}
                    onChange={(e) =>
                      setGenerationSettings((s) => ({ ...s, platform: e.target.value as Platform }))
                    }
                    className="input"
                  >
                    {PLATFORMS.map((platform) => (
                      <option key={platform.code} value={platform.code}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Tone</label>
                  <select
                    value={generationSettings.tone}
                    onChange={(e) =>
                      setGenerationSettings((s) => ({ ...s, tone: e.target.value as Tone }))
                    }
                    className="input"
                  >
                    {TONES.map((tone) => (
                      <option key={tone.code} value={tone.code}>
                        {tone.name} ({tone.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Niche</label>
                  <select
                    value={generationSettings.niche}
                    onChange={(e) =>
                      setGenerationSettings((s) => ({ ...s, niche: e.target.value as Niche }))
                    }
                    className="input"
                  >
                    {NICHES.map((niche) => (
                      <option key={niche.code} value={niche.code}>
                        {niche.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn-primary w-full"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Package
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {!selectedProduct ? (
            <div className="card p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Product to Get Started
              </h3>
              <p className="text-gray-500 mb-6">
                Choose a product from the list or add a new one to generate viral content
              </p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Product
              </button>
            </div>
          ) : generationResult ? (
            <GenerationResults result={generationResult} />
          ) : (
            <div className="card p-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ready to Generate
              </h3>
              <p className="text-gray-500 mb-2">
                Product: <span className="font-medium">{selectedProduct.title}</span>
              </p>
              <p className="text-gray-500">
                Configure your settings and click "Generate Package" to create viral content
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Add New Product</h2>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="label">Product Title *</label>
                <input
                  type="text"
                  value={newProduct.title}
                  onChange={(e) => setNewProduct((p) => ({ ...p, title: e.target.value }))}
                  className="input"
                  placeholder="e.g., Wireless Bluetooth Earbuds"
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  value={newProduct.rawDescription}
                  onChange={(e) => setNewProduct((p) => ({ ...p, rawDescription: e.target.value }))}
                  className="input min-h-[100px]"
                  placeholder="Enter product description, features, benefits..."
                />
              </div>

              <div>
                <label className="label">Source URL (optional)</label>
                <input
                  type="url"
                  value={newProduct.sourceUrl}
                  onChange={(e) => setNewProduct((p) => ({ ...p, sourceUrl: e.target.value }))}
                  className="input"
                  placeholder="https://aliexpress.com/item/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Price</label>
                  <input
                    type="text"
                    value={newProduct.priceRaw}
                    onChange={(e) => setNewProduct((p) => ({ ...p, priceRaw: e.target.value }))}
                    className="input"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="label">Currency</label>
                  <select
                    value={newProduct.currency}
                    onChange={(e) => setNewProduct((p) => ({ ...p, currency: e.target.value }))}
                    className="input"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="SAR">SAR</option>
                    <option value="AED">AED</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="btn-primary flex-1"
                >
                  {creatingProduct ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Generation Results Component
function GenerationResults({ result }: { result: FullPackageResult }) {
  const [activeTab, setActiveTab] = useState<'script' | 'hooks' | 'captions' | 'hashtags' | 'thumbnails' | 'angles'>('script');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const tabs = [
    { id: 'script', label: 'Script' },
    { id: 'hooks', label: `Hooks (${result.content.hooks.length})` },
    { id: 'captions', label: `Captions (${result.content.captions.length})` },
    { id: 'hashtags', label: `Hashtags (${result.content.hashtags.length})` },
    { id: 'thumbnails', label: `Thumbnails (${result.content.thumbnailText.length})` },
    { id: 'angles', label: `Angles (${result.content.angles.length})` },
  ];

  return (
    <div className="card">
      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={clsx(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'script' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Video Script</h3>
              <button
                onClick={() => copyToClipboard(result.content.script, 'script')}
                className="btn-ghost btn-sm"
              >
                {copiedIndex === 'script' ? (
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                Copy
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-gray-700">
              {result.content.script}
            </div>
          </div>
        )}

        {activeTab === 'hooks' && (
          <div className="space-y-3">
            {result.content.hooks.map((hook, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-xs font-medium text-primary-600 mb-1 block">
                    Hook #{index + 1}
                  </span>
                  <p className="text-gray-700">{hook}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(hook, `hook-${index}`)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {copiedIndex === `hook-${index}` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'captions' && (
          <div className="space-y-3">
            {result.content.captions.map((caption, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-xs font-medium text-primary-600 mb-1 block">
                    Caption #{index + 1}
                  </span>
                  <p className="text-gray-700">{caption}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(caption, `caption-${index}`)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {copiedIndex === `caption-${index}` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'hashtags' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Hashtags</h3>
              <button
                onClick={() => copyToClipboard(result.content.hashtags.join(' '), 'hashtags')}
                className="btn-ghost btn-sm"
              >
                {copiedIndex === 'hashtags' ? (
                  <Check className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                Copy All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.content.hashtags.map((hashtag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm cursor-pointer hover:bg-primary-100"
                  onClick={() => copyToClipboard(hashtag, `hashtag-${index}`)}
                >
                  {hashtag}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'thumbnails' && (
          <div className="space-y-3">
            {result.content.thumbnailText.map((text, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-xs font-medium text-primary-600 mb-1 block">
                    Thumbnail Text #{index + 1}
                  </span>
                  <p className="text-gray-700 text-lg font-medium">{text}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(text, `thumbnail-${index}`)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {copiedIndex === `thumbnail-${index}` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'angles' && (
          <div className="space-y-3">
            {result.content.angles.map((angle, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-xs font-medium text-primary-600 mb-1 block">
                    Creative Angle #{index + 1}
                  </span>
                  <p className="text-gray-700">{angle}</p>
                </div>
                <button
                  onClick={() => copyToClipboard(angle, `angle-${index}`)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  {copiedIndex === `angle-${index}` ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-sm text-gray-500">
        <div className="flex flex-wrap gap-4">
          <span>Model: {result.metadata.model}</span>
          <span>Tokens: {result.metadata.tokensUsed}</span>
          <span>Time: {result.metadata.processingTimeMs}ms</span>
          <span>
            Remaining: {result.usage.remainingRequests ?? 'Unlimited'} / {result.usage.monthlyLimit ?? '∞'}
          </span>
        </div>
      </div>
    </div>
  );
}
