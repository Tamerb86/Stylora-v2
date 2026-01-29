// Product data interface
export interface ExtractedProduct {
  source: string;
  sourceUrl: string;
  title: string;
  description: string;
  images: string[];
  price: string;
  currency: string;
  features?: string[];
  rating?: string;
  reviews?: string;
}

// Base extractor interface
interface ProductExtractor {
  canExtract(url: string): boolean;
  extract(): ExtractedProduct | null;
}

// AliExpress Extractor
class AliExpressExtractor implements ProductExtractor {
  canExtract(url: string): boolean {
    return url.includes('aliexpress.com');
  }

  extract(): ExtractedProduct | null {
    try {
      // Title
      const titleEl = document.querySelector('h1[data-pl="product-title"]') ||
                      document.querySelector('.product-title-text') ||
                      document.querySelector('h1');
      const title = titleEl?.textContent?.trim() || '';

      // Description
      const descEl = document.querySelector('.product-description') ||
                     document.querySelector('[class*="description"]');
      const description = descEl?.textContent?.trim() || '';

      // Images
      const images: string[] = [];
      const imageEls = document.querySelectorAll('.images-view-item img, [class*="slider"] img');
      imageEls.forEach(img => {
        const src = (img as HTMLImageElement).src || img.getAttribute('data-src');
        if (src && !images.includes(src)) {
          images.push(src.replace(/_\d+x\d+/, '_800x800'));
        }
      });

      // Price
      const priceEl = document.querySelector('[class*="price-current"]') ||
                      document.querySelector('.product-price-value') ||
                      document.querySelector('[class*="uniform-banner-box-price"]');
      const priceText = priceEl?.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      const price = priceMatch ? priceMatch[0] : '';
      const currency = priceText.match(/[A-Z]{3}|\$|€|£|¥/)?.[0] || 'USD';

      // Features/Specs
      const features: string[] = [];
      const specEls = document.querySelectorAll('.specification-item, [class*="spec"] li');
      specEls.forEach(el => {
        const text = el.textContent?.trim();
        if (text) features.push(text);
      });

      // Rating
      const ratingEl = document.querySelector('[class*="rating"] span, .overview-rating-average');
      const rating = ratingEl?.textContent?.trim() || '';

      // Reviews count
      const reviewsEl = document.querySelector('[class*="review"] span, .product-reviewer-reviews');
      const reviews = reviewsEl?.textContent?.trim() || '';

      if (!title) return null;

      return {
        source: 'aliexpress',
        sourceUrl: window.location.href,
        title,
        description,
        images,
        price,
        currency,
        features,
        rating,
        reviews,
      };
    } catch (error) {
      console.error('AliExpress extraction error:', error);
      return null;
    }
  }
}

// Amazon Extractor
class AmazonExtractor implements ProductExtractor {
  canExtract(url: string): boolean {
    return url.includes('amazon.');
  }

  extract(): ExtractedProduct | null {
    try {
      // Title
      const titleEl = document.querySelector('#productTitle') ||
                      document.querySelector('#title');
      const title = titleEl?.textContent?.trim() || '';

      // Description
      const descEl = document.querySelector('#productDescription') ||
                     document.querySelector('#feature-bullets');
      const description = descEl?.textContent?.trim() || '';

      // Images
      const images: string[] = [];
      const imageEls = document.querySelectorAll('#altImages img, #imgTagWrapperId img, #landingImage');
      imageEls.forEach(img => {
        let src = (img as HTMLImageElement).src || 
                  img.getAttribute('data-old-hires') ||
                  img.getAttribute('data-a-dynamic-image');
        
        if (src) {
          // Try to get high-res version
          if (src.includes('data-a-dynamic-image')) {
            try {
              const parsed = JSON.parse(src);
              src = Object.keys(parsed)[0];
            } catch {}
          }
          // Remove size constraints from URL
          src = src.replace(/\._[A-Z]+\d+_\./, '.');
          if (!images.includes(src)) {
            images.push(src);
          }
        }
      });

      // Price
      const priceEl = document.querySelector('.a-price .a-offscreen') ||
                      document.querySelector('#priceblock_ourprice') ||
                      document.querySelector('#priceblock_dealprice') ||
                      document.querySelector('.a-price-whole');
      const priceText = priceEl?.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      const price = priceMatch ? priceMatch[0] : '';
      
      // Detect currency from page
      const currencyEl = document.querySelector('.a-price-symbol');
      const currencySymbol = currencyEl?.textContent?.trim() || '$';
      const currencyMap: Record<string, string> = {
        '$': 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY',
        'AED': 'AED', 'SAR': 'SAR', 'EGP': 'EGP'
      };
      const currency = currencyMap[currencySymbol] || 'USD';

      // Features
      const features: string[] = [];
      const featureEls = document.querySelectorAll('#feature-bullets li, .a-unordered-list.a-vertical li');
      featureEls.forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length < 500) features.push(text);
      });

      // Rating
      const ratingEl = document.querySelector('#acrPopover, .a-icon-star span');
      const rating = ratingEl?.textContent?.trim().match(/[\d.]+/)?.[0] || '';

      // Reviews
      const reviewsEl = document.querySelector('#acrCustomerReviewText');
      const reviews = reviewsEl?.textContent?.trim().match(/[\d,]+/)?.[0] || '';

      if (!title) return null;

      return {
        source: 'amazon',
        sourceUrl: window.location.href,
        title,
        description,
        images,
        price,
        currency,
        features,
        rating,
        reviews,
      };
    } catch (error) {
      console.error('Amazon extraction error:', error);
      return null;
    }
  }
}

// eBay Extractor
class EbayExtractor implements ProductExtractor {
  canExtract(url: string): boolean {
    return url.includes('ebay.com');
  }

  extract(): ExtractedProduct | null {
    try {
      const titleEl = document.querySelector('h1.x-item-title__mainTitle');
      const title = titleEl?.textContent?.trim() || '';

      const descEl = document.querySelector('#desc_wrapper_ctr iframe');
      let description = '';
      if (descEl) {
        const iframe = descEl as HTMLIFrameElement;
        description = iframe.contentDocument?.body?.textContent?.trim() || '';
      }

      const images: string[] = [];
      const imageEls = document.querySelectorAll('.ux-image-carousel-item img');
      imageEls.forEach(img => {
        const src = (img as HTMLImageElement).src;
        if (src && !images.includes(src)) {
          images.push(src.replace(/s-l\d+/, 's-l1600'));
        }
      });

      const priceEl = document.querySelector('.x-price-primary span');
      const priceText = priceEl?.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      const price = priceMatch ? priceMatch[0] : '';
      const currency = priceText.match(/[A-Z]{3}|\$|€|£/)?.[0] || 'USD';

      if (!title) return null;

      return {
        source: 'ebay',
        sourceUrl: window.location.href,
        title,
        description,
        images,
        price,
        currency,
      };
    } catch (error) {
      console.error('eBay extraction error:', error);
      return null;
    }
  }
}

// Generic Extractor (fallback)
class GenericExtractor implements ProductExtractor {
  canExtract(): boolean {
    return true;
  }

  extract(): ExtractedProduct | null {
    try {
      // Try Open Graph tags first
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      const ogDesc = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');

      // Fallback to standard elements
      const title = ogTitle || 
                    document.querySelector('h1')?.textContent?.trim() ||
                    document.title;

      const description = ogDesc ||
                          document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                          '';

      const images: string[] = [];
      if (ogImage) images.push(ogImage);

      // Try to find product images
      const imageEls = document.querySelectorAll('img[src*="product"], img[class*="product"], img[class*="gallery"]');
      imageEls.forEach(img => {
        const src = (img as HTMLImageElement).src;
        if (src && !images.includes(src)) {
          images.push(src);
        }
      });

      // Try to find price
      const priceEl = document.querySelector('[class*="price"], [itemprop="price"]');
      const priceText = priceEl?.textContent?.trim() || '';
      const priceMatch = priceText.match(/[\d,.]+/);
      const price = priceMatch ? priceMatch[0] : '';

      if (!title) return null;

      return {
        source: 'other',
        sourceUrl: window.location.href,
        title,
        description,
        images,
        price,
        currency: 'USD',
      };
    } catch (error) {
      console.error('Generic extraction error:', error);
      return null;
    }
  }
}

// Main extractor function
export function extractProductData(): ExtractedProduct | null {
  const url = window.location.href;
  
  const extractors: ProductExtractor[] = [
    new AliExpressExtractor(),
    new AmazonExtractor(),
    new EbayExtractor(),
    new GenericExtractor(),
  ];

  for (const extractor of extractors) {
    if (extractor.canExtract(url)) {
      const data = extractor.extract();
      if (data) return data;
    }
  }

  return null;
}

// Detect current site
export function detectSite(): string {
  const url = window.location.href;
  
  if (url.includes('aliexpress.com')) return 'AliExpress';
  if (url.includes('amazon.')) return 'Amazon';
  if (url.includes('ebay.com')) return 'eBay';
  if (url.includes('etsy.com')) return 'Etsy';
  if (url.includes('walmart.com')) return 'Walmart';
  if (url.includes('temu.com')) return 'Temu';
  if (url.includes('shein.com')) return 'SHEIN';
  
  return 'Unknown';
}
