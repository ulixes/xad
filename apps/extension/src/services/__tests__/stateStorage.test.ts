import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateStorage } from '../stateStorage';
import type { AuthContext } from '../../types/auth';

describe('StateStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset Chrome mocks to default behavior
    chrome.storage.local.set = vi.fn().mockResolvedValue(undefined);
    chrome.storage.local.get = vi.fn().mockResolvedValue({});
    chrome.storage.local.remove = vi.fn().mockResolvedValue(undefined);
  });

  describe('saveState', () => {
    it('should save state to Chrome storage', async () => {
      const mockState: AuthContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
        wallets: [],
        error: null,
      };

      await StateStorage.saveState(mockState);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        authState: mockState,
      });
      expect(chrome.storage.local.set).toHaveBeenCalledOnce();
    });

    it('should handle complex state with wallets', async () => {
      const mockState: AuthContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
          wallet: { address: '0x123' },
        },
        wallets: [
          {
            id: 'wallet123',
            address: '0x123456789',
            type: 'embedded',
          },
        ],
        error: null,
      };

      await StateStorage.saveState(mockState);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        authState: mockState,
      });
    });

    it('should handle Chrome storage errors', async () => {
      const mockState: AuthContext = {
        user: null,
        wallets: [],
        error: null,
      };

      chrome.storage.local.set = vi.fn().mockRejectedValue(new Error('Storage quota exceeded'));

      await expect(StateStorage.saveState(mockState)).rejects.toThrow('Storage quota exceeded');
    });

    it('should handle null state', async () => {
      await StateStorage.saveState(null as any);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        authState: null,
      });
    });
  });

  describe('loadState', () => {
    it('should load state from Chrome storage', async () => {
      const mockState: AuthContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
        wallets: [],
        error: null,
      };

      chrome.storage.local.get = vi.fn().mockResolvedValue({
        authState: mockState,
      });

      const result = await StateStorage.loadState();

      expect(chrome.storage.local.get).toHaveBeenCalledWith('authState');
      expect(result).toEqual(mockState);
    });

    it('should return null when no state exists', async () => {
      chrome.storage.local.get = vi.fn().mockResolvedValue({});

      const result = await StateStorage.loadState();

      expect(result).toBeNull();
    });

    it('should return null when authState is undefined', async () => {
      chrome.storage.local.get = vi.fn().mockResolvedValue({
        authState: undefined,
      });

      const result = await StateStorage.loadState();

      expect(result).toBeNull();
    });

    it('should handle Chrome storage errors', async () => {
      chrome.storage.local.get = vi.fn().mockRejectedValue(new Error('Storage access denied'));

      await expect(StateStorage.loadState()).rejects.toThrow('Storage access denied');
    });

    it('should handle corrupted state data', async () => {
      chrome.storage.local.get = vi.fn().mockResolvedValue({
        authState: 'invalid_json_string',
      });

      const result = await StateStorage.loadState();

      // Should still return the corrupted data as-is, letting the consumer handle validation
      expect(result).toBe('invalid_json_string');
    });
  });

  describe('clearState', () => {
    it('should remove state from Chrome storage', async () => {
      await StateStorage.clearState();

      expect(chrome.storage.local.remove).toHaveBeenCalledWith('authState');
      expect(chrome.storage.local.remove).toHaveBeenCalledOnce();
    });

    it('should handle Chrome storage errors during clear', async () => {
      chrome.storage.local.remove = vi.fn().mockRejectedValue(new Error('Storage access denied'));

      await expect(StateStorage.clearState()).rejects.toThrow('Storage access denied');
    });

    it('should succeed even if key does not exist', async () => {
      chrome.storage.local.remove = vi.fn().mockResolvedValue(undefined);

      await expect(StateStorage.clearState()).resolves.toBeUndefined();
    });
  });

  describe('error scenarios', () => {
    it('should handle undefined Chrome API', async () => {
      const originalChrome = globalThis.chrome;
      // @ts-ignore
      globalThis.chrome = undefined;

      await expect(StateStorage.saveState({} as AuthContext)).rejects.toThrow();

      globalThis.chrome = originalChrome;
    });

    it('should handle missing storage API', async () => {
      const originalStorage = globalThis.chrome.storage;
      // @ts-ignore
      globalThis.chrome.storage = undefined;

      await expect(StateStorage.saveState({} as AuthContext)).rejects.toThrow();

      globalThis.chrome.storage = originalStorage;
    });
  });

  describe('state validation', () => {
    it('should save and load state preserving data types', async () => {
      const originalState: AuthContext = {
        user: {
          id: 'user123',
          email: 'test@example.com',
        },
        wallets: [
          {
            id: 'wallet123',
            address: '0x123456789',
            type: 'embedded',
          },
        ],
        error: 'Some error message',
      };

      // Save the state
      await StateStorage.saveState(originalState);
      
      // Mock the get to return what was saved
      chrome.storage.local.get = vi.fn().mockResolvedValue({
        authState: originalState,
      });

      // Load the state
      const loadedState = await StateStorage.loadState();

      expect(loadedState).toEqual(originalState);
      expect(typeof loadedState?.user?.id).toBe('string');
      expect(Array.isArray(loadedState?.wallets)).toBe(true);
    });
  });
});