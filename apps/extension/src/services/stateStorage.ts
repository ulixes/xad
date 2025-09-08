import type { AuthContext } from '../types/auth';

export class StateStorage {
  private static readonly STORAGE_KEY = 'authState';

  private static isExtensionContext(): boolean {
    return typeof globalThis.chrome !== 'undefined' && 
           globalThis.chrome.storage?.local !== undefined;
  }

  static async saveState(state: AuthContext): Promise<void> {
    try {
      if (StateStorage.isExtensionContext()) {
        // Use Chrome storage in extension context
        await chrome.storage.local.set({
          [StateStorage.STORAGE_KEY]: state,
        });
      } else {
        // Use localStorage as fallback in development/web context
        localStorage.setItem(StateStorage.STORAGE_KEY, JSON.stringify(state));
      }
    } catch (error) {
      console.warn('Failed to save state to storage:', error);
      // Don't throw error to prevent app crashes during development
    }
  }

  static async loadState(): Promise<AuthContext | null> {
    try {
      if (StateStorage.isExtensionContext()) {
        // Use Chrome storage in extension context
        const result = await chrome.storage.local.get(StateStorage.STORAGE_KEY);
        return result[StateStorage.STORAGE_KEY] || null;
      } else {
        // Use localStorage as fallback in development/web context
        const stored = localStorage.getItem(StateStorage.STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
      }
    } catch (error) {
      console.warn('Failed to load state from storage:', error);
      return null; // Return null instead of throwing to prevent crashes
    }
  }

  static async clearState(): Promise<void> {
    try {
      if (StateStorage.isExtensionContext()) {
        // Use Chrome storage in extension context
        await chrome.storage.local.remove(StateStorage.STORAGE_KEY);
      } else {
        // Use localStorage as fallback in development/web context
        localStorage.removeItem(StateStorage.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear state from storage:', error);
      // Don't throw error to prevent app crashes
    }
  }
}