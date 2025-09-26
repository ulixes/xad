/**
 * Chrome Extension Storage Overrides for Para SDK
 * Provides persistent storage using Chrome extension APIs
 */

// Chrome local storage overrides
export const localStorageGetItemOverride = async (key: string): Promise<string | null> => {
  try {
    // Handle special cases
    if (key === "guestWalletIds" || key === "pregenIds") {
      return JSON.stringify({});
    }
    
    const result = await chrome.storage.local.get([key]);
    return result[key] || null;
  } catch (error) {
    console.error("Local storage get error:", error);
    return null;
  }
};

export const localStorageSetItemOverride = async (key: string, value: string): Promise<void> => {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error("Local storage set error:", error);
  }
};

export const localStorageRemoveItemOverride = async (key: string): Promise<void> => {
  try {
    await chrome.storage.local.remove([key]);
  } catch (error) {
    console.error("Local storage remove error:", error);
  }
};

// Chrome session storage overrides
export const sessionStorageGetItemOverride = async (key: string): Promise<string | null> => {
  try {
    if (key === "guestWalletIds" || key === "pregenIds") {
      return JSON.stringify({});
    }
    
    // Use session storage if available (Chrome 102+)
    if (chrome.storage.session) {
      const result = await chrome.storage.session.get([key]);
      return result[key] || null;
    }
    // Fallback to local storage with session prefix
    const result = await chrome.storage.local.get(`session_${key}`);
    return result[`session_${key}`] || null;
  } catch (error) {
    console.error("Session storage get error:", error);
    return null;
  }
};

export const sessionStorageSetItemOverride = async (key: string, value: string): Promise<void> => {
  try {
    if (chrome.storage.session) {
      await chrome.storage.session.set({ [key]: value });
    } else {
      // Fallback to local storage with session prefix
      await chrome.storage.local.set({ [`session_${key}`]: value });
    }
  } catch (error) {
    console.error("Session storage set error:", error);
  }
};

export const sessionStorageRemoveItemOverride = async (key: string): Promise<void> => {
  try {
    if (chrome.storage.session) {
      await chrome.storage.session.remove([key]);
    } else {
      await chrome.storage.local.remove(`session_${key}`);
    }
  } catch (error) {
    console.error("Session storage remove error:", error);
  }
};

// Clear storage with Para prefix
export const clearStorageOverride = async (): Promise<void> => {
  try {
    // Get all keys from both storages
    const localKeys = await chrome.storage.local.get();
    const sessionKeys = chrome.storage.session ? await chrome.storage.session.get() : {};
    
    // Filter keys with Para prefix (@CAPSULE/ is Para's internal prefix)
    const paraLocalKeys = Object.keys(localKeys).filter(key => key.startsWith("@CAPSULE/"));
    const paraSessionKeys = Object.keys(sessionKeys).filter(key => key.startsWith("@CAPSULE/"));
    
    // Remove Para keys
    await Promise.all([
      paraLocalKeys.length > 0 ? chrome.storage.local.remove(paraLocalKeys) : Promise.resolve(),
      paraSessionKeys.length > 0 && chrome.storage.session ? chrome.storage.session.remove(paraSessionKeys) : Promise.resolve()
    ]);
  } catch (error) {
    console.error("Clear storage error:", error);
  }
};

// Export all overrides as a single object
export const chromeStorageOverrides = {
  localStorageGetItemOverride,
  localStorageSetItemOverride,
  localStorageRemoveItemOverride,
  sessionStorageGetItemOverride,
  sessionStorageSetItemOverride,
  sessionStorageRemoveItemOverride,
  clearStorageOverride
};