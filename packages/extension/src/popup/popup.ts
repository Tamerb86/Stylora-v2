// State
interface State {
  isLoggedIn: boolean;
  user: {
    id: number;
    email: string;
    name?: string;
    planCode: string;
  } | null;
  usage: {
    current: number;
    limit: number;
    isUnlimited: boolean;
  };
  site: {
    name: string;
    hasProduct: boolean;
  };
  product: {
    title: string;
    price: string;
    image: string;
  } | null;
}

const state: State = {
  isLoggedIn: false,
  user: null,
  usage: { current: 0, limit: 10, isUnlimited: false },
  site: { name: 'Unknown', hasProduct: false },
  product: null,
};

// DOM Elements
const elements = {
  loadingState: document.getElementById('loading-state')!,
  loginState: document.getElementById('login-state')!,
  mainState: document.getElementById('main-state')!,
  
  // Login
  apiUrlInput: document.getElementById('api-url') as HTMLInputElement,
  authTokenInput: document.getElementById('auth-token') as HTMLInputElement,
  loginBtn: document.getElementById('login-btn')!,
  openWebappLogin: document.getElementById('open-webapp-login')!,
  
  // Main
  userAvatar: document.getElementById('user-avatar')!,
  userName: document.getElementById('user-name')!,
  userPlan: document.getElementById('user-plan')!,
  logoutBtn: document.getElementById('logout-btn')!,
  
  usageText: document.getElementById('usage-text')!,
  usageProgress: document.getElementById('usage-progress')!,
  
  siteBadge: document.getElementById('site-badge')!,
  siteName: document.getElementById('site-name')!,
  productStatus: document.getElementById('product-status')!,
  
  productPreview: document.getElementById('product-preview')!,
  productImage: document.getElementById('product-image') as HTMLImageElement,
  productTitle: document.getElementById('product-title')!,
  productPrice: document.getElementById('product-price')!,
  
  generationForm: document.getElementById('generation-form')!,
  languageSelect: document.getElementById('language-select') as HTMLSelectElement,
  platformSelect: document.getElementById('platform-select') as HTMLSelectElement,
  toneSelect: document.getElementById('tone-select') as HTMLSelectElement,
  generateBtn: document.getElementById('generate-btn')!,
  
  noProduct: document.getElementById('no-product')!,
  
  openWebapp: document.getElementById('open-webapp')!,
  openSettings: document.getElementById('open-settings')!,
};

// Initialize
async function init() {
  showState('loading');
  
  // Check auth status
  const authResult = await sendMessage({ type: 'GET_AUTH_STATUS' });
  
  if (authResult.success && authResult.data?.isLoggedIn) {
    state.isLoggedIn = true;
    state.user = authResult.data.user;
    
    // Get fresh profile and usage
    await refreshProfile();
    await refreshUsage();
    
    // Check current tab for product
    await checkCurrentTab();
    
    showState('main');
    updateUI();
  } else {
    showState('login');
  }
  
  // Setup event listeners
  setupEventListeners();
}

// Show state
function showState(stateName: 'loading' | 'login' | 'main') {
  elements.loadingState.classList.add('hidden');
  elements.loginState.classList.add('hidden');
  elements.mainState.classList.add('hidden');
  
  switch (stateName) {
    case 'loading':
      elements.loadingState.classList.remove('hidden');
      break;
    case 'login':
      elements.loginState.classList.remove('hidden');
      break;
    case 'main':
      elements.mainState.classList.remove('hidden');
      break;
  }
}

// Update UI
function updateUI() {
  if (!state.user) return;
  
  // User info
  elements.userAvatar.textContent = (state.user.name || state.user.email)[0].toUpperCase();
  elements.userName.textContent = state.user.name || state.user.email.split('@')[0];
  elements.userPlan.textContent = `${state.user.planCode.charAt(0).toUpperCase() + state.user.planCode.slice(1)} Plan`;
  
  // Usage
  if (state.usage.isUnlimited) {
    elements.usageText.textContent = `${state.usage.current} / Unlimited`;
    elements.usageProgress.style.width = '100%';
    elements.usageProgress.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
  } else {
    elements.usageText.textContent = `${state.usage.current} / ${state.usage.limit}`;
    const percentage = Math.min((state.usage.current / state.usage.limit) * 100, 100);
    elements.usageProgress.style.width = `${percentage}%`;
    
    if (percentage >= 90) {
      elements.usageProgress.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
    } else if (percentage >= 70) {
      elements.usageProgress.style.background = 'linear-gradient(90deg, #f59e0b, #fbbf24)';
    } else {
      elements.usageProgress.style.background = 'linear-gradient(90deg, #6366f1, #8b5cf6)';
    }
  }
  
  // Site info
  const siteIcons: Record<string, string> = {
    'AliExpress': '🛒',
    'Amazon': '📦',
    'eBay': '🏷️',
    'Etsy': '🎨',
    'Walmart': '🏪',
    'Temu': '🛍️',
    'SHEIN': '👗',
    'Unknown': '🌐',
  };
  
  elements.siteName.textContent = state.site.name;
  const siteIcon = elements.siteBadge.querySelector('.site-icon');
  if (siteIcon) siteIcon.textContent = siteIcons[state.site.name] || '🌐';
  
  // Product status
  if (state.site.hasProduct && state.product) {
    elements.productStatus.textContent = 'Product detected';
    elements.productStatus.classList.add('detected');
    
    elements.productPreview.classList.remove('hidden');
    elements.productImage.src = state.product.image || '';
    elements.productTitle.textContent = state.product.title.substring(0, 60) + (state.product.title.length > 60 ? '...' : '');
    elements.productPrice.textContent = state.product.price;
    
    elements.generationForm.classList.remove('hidden');
    elements.noProduct.classList.add('hidden');
  } else {
    elements.productStatus.textContent = 'No product detected';
    elements.productStatus.classList.remove('detected');
    
    elements.productPreview.classList.add('hidden');
    elements.generationForm.classList.add('hidden');
    elements.noProduct.classList.remove('hidden');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Login
  elements.loginBtn.addEventListener('click', handleLogin);
  elements.openWebappLogin.addEventListener('click', (e) => {
    e.preventDefault();
    openWebApp();
  });
  
  // Main
  elements.logoutBtn.addEventListener('click', handleLogout);
  elements.generateBtn.addEventListener('click', handleGenerate);
  elements.openWebapp.addEventListener('click', (e) => {
    e.preventDefault();
    openWebApp();
  });
  elements.openSettings.addEventListener('click', (e) => {
    e.preventDefault();
    openWebApp('/app/settings');
  });
}

// Handle login
async function handleLogin() {
  const apiUrl = elements.apiUrlInput.value.trim();
  const token = elements.authTokenInput.value.trim();
  
  if (!apiUrl || !token) {
    alert('Please enter API URL and auth token');
    return;
  }
  
  elements.loginBtn.textContent = 'Logging in...';
  (elements.loginBtn as HTMLButtonElement).disabled = true;
  
  try {
    // Save API URL
    await sendMessage({ type: 'UPDATE_SETTINGS', payload: { apiUrl } });
    
    // Login
    const result = await sendMessage({ type: 'LOGIN', payload: { token } });
    
    if (result.success) {
      state.isLoggedIn = true;
      state.user = {
        id: result.data.id,
        email: result.data.email,
        name: result.data.name,
        planCode: result.data.plan.code,
      };
      
      await refreshUsage();
      await checkCurrentTab();
      
      showState('main');
      updateUI();
    } else {
      alert(result.error || 'Login failed');
    }
  } catch (error) {
    alert('Login failed. Please check your credentials.');
  } finally {
    elements.loginBtn.textContent = 'Login';
    (elements.loginBtn as HTMLButtonElement).disabled = false;
  }
}

// Handle logout
async function handleLogout() {
  await sendMessage({ type: 'LOGOUT' });
  state.isLoggedIn = false;
  state.user = null;
  showState('login');
}

// Handle generate
async function handleGenerate() {
  if (!state.product) return;
  
  const btnText = elements.generateBtn.querySelector('.btn-text')!;
  const btnLoading = elements.generateBtn.querySelector('.btn-loading')!;
  
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  (elements.generateBtn as HTMLButtonElement).disabled = true;
  
  try {
    // Get extracted product from content script
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) throw new Error('No active tab');
    
    const extractResult = await chrome.tabs.sendMessage(tab.id, { type: 'GET_EXTRACTED_PRODUCT' });
    
    if (!extractResult.success || !extractResult.data) {
      throw new Error('Could not extract product data');
    }
    
    // Generate content
    const result = await sendMessage({
      type: 'QUICK_GENERATE',
      payload: {
        product: extractResult.data,
        options: {
          language: elements.languageSelect.value,
          platform: elements.platformSelect.value,
          tone: elements.toneSelect.value,
        },
      },
    });
    
    if (result.success) {
      // Refresh usage
      await refreshUsage();
      updateUI();
      
      // Open web app to view results
      openWebApp(`/app/product/${result.data.product.id}`);
    } else {
      alert(result.error || 'Generation failed');
    }
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Generation failed');
  } finally {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    (elements.generateBtn as HTMLButtonElement).disabled = false;
  }
}

// Refresh profile
async function refreshProfile() {
  const result = await sendMessage({ type: 'GET_PROFILE' });
  if (result.success && result.data) {
    state.user = {
      id: result.data.id,
      email: result.data.email,
      name: result.data.name,
      planCode: result.data.plan.code,
    };
  }
}

// Refresh usage
async function refreshUsage() {
  const result = await sendMessage({ type: 'GET_USAGE' });
  if (result.success && result.data) {
    state.usage = {
      current: result.data.currentMonthUsage,
      limit: result.data.monthlyLimit,
      isUnlimited: result.data.isUnlimited,
    };
  }
}

// Check current tab for product
async function checkCurrentTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id || !tab.url) return;
    
    // Get site info from content script
    const siteResult = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SITE_INFO' });
    
    if (siteResult.success) {
      state.site = {
        name: siteResult.data.site,
        hasProduct: siteResult.data.hasProduct,
      };
      
      // Get product data if available
      if (siteResult.data.hasProduct) {
        const productResult = await chrome.tabs.sendMessage(tab.id, { type: 'GET_EXTRACTED_PRODUCT' });
        if (productResult.success && productResult.data) {
          state.product = {
            title: productResult.data.title,
            price: `${productResult.data.price} ${productResult.data.currency}`,
            image: productResult.data.images?.[0] || '',
          };
        }
      }
    }
  } catch (error) {
    // Content script not loaded or error
    console.log('Could not communicate with content script');
  }
}

// Send message to background
function sendMessage(message: { type: string; payload?: unknown }): Promise<{
  success: boolean;
  data?: unknown;
  error?: string;
}> {
  return chrome.runtime.sendMessage(message);
}

// Open web app
async function openWebApp(path?: string) {
  await sendMessage({ type: 'OPEN_WEBAPP', payload: { path } });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
