import { storage } from '../utils/storage';
import { api } from '../utils/api';

// Message types
interface Message {
  type: string;
  payload?: unknown;
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('Background message error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // Return true to indicate async response
  return true;
});

async function handleMessage(message: Message, _sender: chrome.runtime.MessageSender) {
  switch (message.type) {
    case 'GET_AUTH_STATUS':
      return getAuthStatus();
    
    case 'LOGIN':
      return handleLogin(message.payload as { token: string });
    
    case 'LOGOUT':
      return handleLogout();
    
    case 'GET_PROFILE':
      return getProfile();
    
    case 'CREATE_PRODUCT':
      return createProduct(message.payload);
    
    case 'GENERATE_CONTENT':
      return generateContent(message.payload);
    
    case 'QUICK_GENERATE':
      return quickGenerate(message.payload);
    
    case 'GET_USAGE':
      return getUsage();
    
    case 'GET_SETTINGS':
      return getSettings();
    
    case 'UPDATE_SETTINGS':
      return updateSettings(message.payload);
    
    case 'OPEN_WEBAPP':
      return openWebApp(message.payload as { path?: string });
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// Auth handlers
async function getAuthStatus() {
  const isLoggedIn = await storage.isLoggedIn();
  const userData = await storage.getUserData();
  return { success: true, data: { isLoggedIn, user: userData } };
}

async function handleLogin(payload: { token: string }) {
  const { token } = payload;
  
  // Save token
  await storage.setAuthToken(token);
  
  // Verify and get user data
  const result = await api.verifyToken();
  
  if (result.success && result.data) {
    await storage.setUserData({
      id: result.data.id,
      email: result.data.email,
      name: result.data.name,
      planCode: result.data.plan.code,
    });
    return { success: true, data: result.data };
  } else {
    // Clear invalid token
    await storage.clearAuthToken();
    return { success: false, error: result.error || 'Invalid token' };
  }
}

async function handleLogout() {
  await storage.clearAll();
  return { success: true };
}

async function getProfile() {
  const result = await api.getProfile();
  if (result.success && result.data) {
    // Update cached user data
    await storage.setUserData({
      id: result.data.id,
      email: result.data.email,
      name: result.data.name,
      planCode: result.data.plan.code,
    });
  }
  return result;
}

// Product handlers
async function createProduct(payload: unknown) {
  const result = await api.createProduct(payload as Parameters<typeof api.createProduct>[0]);
  
  if (result.success && result.data) {
    // Add to recent products
    await storage.addRecentProduct({
      id: result.data.id,
      title: result.data.title,
      source: result.data.source,
      createdAt: result.data.createdAt,
    });
  }
  
  return result;
}

// Generation handlers
async function generateContent(payload: unknown) {
  return api.generateContent(payload as Parameters<typeof api.generateContent>[0]);
}

async function quickGenerate(payload: unknown) {
  const { product, options } = payload as {
    product: Parameters<typeof api.quickGenerate>[0];
    options: Parameters<typeof api.quickGenerate>[1];
  };
  
  const result = await api.quickGenerate(product, options);
  
  if (result.success && result.data) {
    // Add to recent products
    await storage.addRecentProduct({
      id: result.data.product.id,
      title: result.data.product.title,
      source: result.data.product.source,
      createdAt: result.data.product.createdAt,
    });
  }
  
  return result;
}

async function getUsage() {
  return api.getUsage();
}

// Settings handlers
async function getSettings() {
  const settings = await storage.getSettings();
  return { success: true, data: settings };
}

async function updateSettings(payload: unknown) {
  await storage.setSettings(payload as Parameters<typeof storage.setSettings>[0]);
  const settings = await storage.getSettings();
  return { success: true, data: settings };
}

// Open web app
async function openWebApp(payload: { path?: string }) {
  const apiUrl = await storage.getApiUrl();
  const baseUrl = apiUrl.replace('/api/v1', '');
  const url = payload.path ? `${baseUrl}${payload.path}` : baseUrl;
  
  await chrome.tabs.create({ url });
  return { success: true };
}

// Handle extension install/update
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Set default API URL
    await storage.setApiUrl('http://localhost:3000/api/v1');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Handle browser action click (when popup is not defined)
chrome.action.onClicked.addListener(async (tab) => {
  // This won't fire if popup is defined, but keeping for reference
  if (tab.id) {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });
  }
});

console.log('TikTok Content Generator background service worker started');
