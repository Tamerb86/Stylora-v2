import { extractProductData, detectSite, type ExtractedProduct } from '../utils/extractors';

// State
let extractedProduct: ExtractedProduct | null = null;
let floatingButton: HTMLElement | null = null;

// Initialize content script
function init() {
  // Wait for page to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
}

function onReady() {
  // Detect if we're on a supported product page
  const site = detectSite();
  if (site === 'Unknown') return;

  // Try to extract product data
  extractedProduct = extractProductData();
  
  if (extractedProduct) {
    // Create floating button
    createFloatingButton();
    
    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(handleMessage);
  }
}

// Handle messages from popup/background
function handleMessage(
  message: { type: string; payload?: unknown },
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: unknown) => void
) {
  switch (message.type) {
    case 'GET_EXTRACTED_PRODUCT':
      // Re-extract to get fresh data
      extractedProduct = extractProductData();
      sendResponse({ success: true, data: extractedProduct });
      break;
    
    case 'EXTRACT_PRODUCT':
      extractedProduct = extractProductData();
      sendResponse({ success: !!extractedProduct, data: extractedProduct });
      break;
    
    case 'GET_SITE_INFO':
      sendResponse({
        success: true,
        data: {
          site: detectSite(),
          url: window.location.href,
          hasProduct: !!extractedProduct,
        },
      });
      break;
    
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true;
}

// Create floating action button
function createFloatingButton() {
  if (floatingButton) return;

  floatingButton = document.createElement('div');
  floatingButton.id = 'tiktok-generator-fab';
  floatingButton.innerHTML = `
    <div class="tiktok-generator-fab-inner">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
      </svg>
      <span>Generate TikTok Content</span>
    </div>
  `;

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #tiktok-generator-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .tiktok-generator-fab-inner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border-radius: 50px;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
      transition: all 0.3s ease;
      font-size: 14px;
      font-weight: 600;
    }

    .tiktok-generator-fab-inner:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
    }

    .tiktok-generator-fab-inner:active {
      transform: translateY(0);
    }

    .tiktok-generator-fab-inner svg {
      width: 20px;
      height: 20px;
    }

    @media (max-width: 768px) {
      .tiktok-generator-fab-inner span {
        display: none;
      }
      
      .tiktok-generator-fab-inner {
        padding: 14px;
        border-radius: 50%;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(floatingButton);

  // Handle click
  floatingButton.addEventListener('click', handleFabClick);
}

// Handle floating button click
async function handleFabClick() {
  // Re-extract product data
  extractedProduct = extractProductData();

  if (!extractedProduct) {
    showNotification('Could not extract product data from this page', 'error');
    return;
  }

  // Check if user is logged in
  const authStatus = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
  
  if (!authStatus.data?.isLoggedIn) {
    // Open popup for login
    showNotification('Please login to generate content', 'info');
    return;
  }

  // Show quick generate modal
  showQuickGenerateModal();
}

// Show quick generate modal
function showQuickGenerateModal() {
  // Remove existing modal if any
  const existingModal = document.getElementById('tiktok-generator-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.id = 'tiktok-generator-modal';
  modal.innerHTML = `
    <div class="tiktok-modal-overlay">
      <div class="tiktok-modal-content">
        <div class="tiktok-modal-header">
          <h2>Generate TikTok Content</h2>
          <button class="tiktok-modal-close">&times;</button>
        </div>
        
        <div class="tiktok-modal-body">
          <div class="tiktok-product-preview">
            <img src="${extractedProduct?.images?.[0] || ''}" alt="Product" />
            <div class="tiktok-product-info">
              <h3>${extractedProduct?.title?.substring(0, 60) || 'Product'}...</h3>
              <p>${extractedProduct?.price || ''} ${extractedProduct?.currency || ''}</p>
            </div>
          </div>

          <div class="tiktok-form-group">
            <label>Language</label>
            <select id="tiktok-language">
              <option value="ar">العربية (Arabic)</option>
              <option value="ar_eg">مصري (Egyptian)</option>
              <option value="ar_sa">سعودي (Saudi)</option>
              <option value="en">English</option>
            </select>
          </div>

          <div class="tiktok-form-group">
            <label>Platform</label>
            <select id="tiktok-platform">
              <option value="tiktok">TikTok</option>
              <option value="instagram_reels">Instagram Reels</option>
              <option value="youtube_shorts">YouTube Shorts</option>
              <option value="facebook_reels">Facebook Reels</option>
            </select>
          </div>

          <div class="tiktok-form-group">
            <label>Tone</label>
            <select id="tiktok-tone">
              <option value="friendly">Friendly</option>
              <option value="professional">Professional</option>
              <option value="urgent">Urgent</option>
              <option value="humorous">Humorous</option>
              <option value="persuasive">Persuasive</option>
            </select>
          </div>
        </div>

        <div class="tiktok-modal-footer">
          <button class="tiktok-btn-secondary tiktok-modal-cancel">Cancel</button>
          <button class="tiktok-btn-primary tiktok-modal-generate">
            <span class="tiktok-btn-text">Generate Content</span>
            <span class="tiktok-btn-loading" style="display: none;">
              <svg class="tiktok-spinner" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="60" stroke-dashoffset="20"/>
              </svg>
              Generating...
            </span>
          </button>
        </div>
      </div>
    </div>
  `;

  // Add modal styles
  const style = document.createElement('style');
  style.id = 'tiktok-generator-modal-styles';
  style.textContent = `
    #tiktok-generator-modal {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .tiktok-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999999;
    }

    .tiktok-modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 480px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    }

    .tiktok-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .tiktok-modal-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    }

    .tiktok-modal-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .tiktok-modal-body {
      padding: 24px;
      overflow-y: auto;
      max-height: 60vh;
    }

    .tiktok-product-preview {
      display: flex;
      gap: 16px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 24px;
    }

    .tiktok-product-preview img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }

    .tiktok-product-info h3 {
      margin: 0 0 8px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
    }

    .tiktok-product-info p {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #6366f1;
    }

    .tiktok-form-group {
      margin-bottom: 16px;
    }

    .tiktok-form-group label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .tiktok-form-group select {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: #111827;
      background: white;
      cursor: pointer;
    }

    .tiktok-form-group select:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .tiktok-modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
      background: #f9fafb;
    }

    .tiktok-btn-secondary {
      padding: 10px 20px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: white;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tiktok-btn-secondary:hover {
      background: #f3f4f6;
    }

    .tiktok-btn-primary {
      padding: 10px 24px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .tiktok-btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .tiktok-btn-primary:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      transform: none;
    }

    .tiktok-spinner {
      width: 16px;
      height: 16px;
      animation: tiktok-spin 1s linear infinite;
    }

    @keyframes tiktok-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  // Event listeners
  modal.querySelector('.tiktok-modal-close')?.addEventListener('click', () => modal.remove());
  modal.querySelector('.tiktok-modal-cancel')?.addEventListener('click', () => modal.remove());
  modal.querySelector('.tiktok-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) modal.remove();
  });
  modal.querySelector('.tiktok-modal-generate')?.addEventListener('click', handleGenerate);
}

// Handle generate button click
async function handleGenerate() {
  const modal = document.getElementById('tiktok-generator-modal');
  if (!modal || !extractedProduct) return;

  const language = (modal.querySelector('#tiktok-language') as HTMLSelectElement).value;
  const platform = (modal.querySelector('#tiktok-platform') as HTMLSelectElement).value;
  const tone = (modal.querySelector('#tiktok-tone') as HTMLSelectElement).value;

  const generateBtn = modal.querySelector('.tiktok-modal-generate') as HTMLButtonElement;
  const btnText = generateBtn.querySelector('.tiktok-btn-text') as HTMLElement;
  const btnLoading = generateBtn.querySelector('.tiktok-btn-loading') as HTMLElement;

  // Show loading state
  generateBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoading.style.display = 'flex';

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'QUICK_GENERATE',
      payload: {
        product: extractedProduct,
        options: { language, platform, tone },
      },
    });

    if (result.success) {
      modal.remove();
      showNotification('Content generated successfully! Check the web app for results.', 'success');
      
      // Open web app to view results
      await chrome.runtime.sendMessage({
        type: 'OPEN_WEBAPP',
        payload: { path: `/app/product/${result.data.product.id}` },
      });
    } else {
      showNotification(result.error || 'Failed to generate content', 'error');
    }
  } catch (error) {
    showNotification('An error occurred. Please try again.', 'error');
  } finally {
    generateBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
}

// Show notification
function showNotification(message: string, type: 'success' | 'error' | 'info') {
  const existing = document.getElementById('tiktok-generator-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.id = 'tiktok-generator-notification';
  
  const colors = {
    success: { bg: '#10b981', icon: '✓' },
    error: { bg: '#ef4444', icon: '✕' },
    info: { bg: '#6366f1', icon: 'ℹ' },
  };

  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999999;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      background: ${colors[type].bg};
      color: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      animation: tiktok-slide-in 0.3s ease;
    ">
      <span style="font-size: 18px;">${colors[type].icon}</span>
      <span>${message}</span>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes tiktok-slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => notification.remove(), 5000);
}

// Initialize
init();
