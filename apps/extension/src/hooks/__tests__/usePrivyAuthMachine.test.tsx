import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrivyAuthMachine } from '../usePrivyAuthMachine';
import { PrivyService } from '../../services/privyService';
import { StateStorage } from '../../services/stateStorage';
import type { User, Wallet } from '../../types/auth';

// Mock the services
vi.mock('../../services/privyService');
vi.mock('../../services/stateStorage');

const mockPrivyService = vi.mocked(PrivyService);
const mockStateStorage = vi.mocked(StateStorage);

describe('usePrivyAuthMachine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateStorage.loadState.mockResolvedValue(null);
    mockStateStorage.saveState.mockResolvedValue(undefined);
  });

  describe('Initialization', () => {
    it('should start in idle state', () => {
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      expect(result.current.state.matches('idle')).toBe(true);
      expect(result.current.state.context.user).toBeNull();
    });

    it('should load persisted state on mount', async () => {
      const persistedState = {
        user: { id: 'user123', email: 'test@example.com' },
        wallets: [],
        error: null,
        signedMessage: null,
      };
      
      mockStateStorage.loadState.mockResolvedValue(persistedState);
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      await vi.waitFor(() => {
        expect(mockStateStorage.loadState).toHaveBeenCalled();
      });
    });
  });

  describe('Authentication Flow', () => {
    it('should handle successful login', async () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
      };
      
      mockPrivyService.login.mockResolvedValue(mockUser);
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      await act(async () => {
        await result.current.login();
      });
      
      expect(result.current.state.matches('authenticated')).toBe(true);
      expect(result.current.state.context.user).toEqual(mockUser);
      expect(mockStateStorage.saveState).toHaveBeenCalled();
    });

    it('should handle login failure', async () => {
      mockPrivyService.login.mockRejectedValue(new Error('Login failed'));
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      await act(async () => {
        await result.current.login();
      });
      
      expect(result.current.state.matches('error')).toBe(true);
      expect(result.current.state.context.error).toBe('Login failed');
    });

    it('should handle logout', async () => {
      mockPrivyService.logout.mockResolvedValue(undefined);
      mockStateStorage.clearState.mockResolvedValue(undefined);
      
      // First login
      const mockUser: User = { id: 'user123', email: 'test@example.com' };
      mockPrivyService.login.mockResolvedValue(mockUser);
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      await act(async () => {
        await result.current.login();
      });
      
      // Then logout
      await act(async () => {
        await result.current.logout();
      });
      
      expect(result.current.state.matches('idle')).toBe(true);
      expect(result.current.state.context.user).toBeNull();
      expect(mockStateStorage.clearState).toHaveBeenCalled();
    });
  });

  describe('Wallet Management', () => {
    beforeEach(async () => {
      // Setup authenticated state
      const mockUser: User = { id: 'user123', email: 'test@example.com' };
      mockPrivyService.login.mockResolvedValue(mockUser);
    });

    it('should create a wallet', async () => {
      const mockUser: User = { id: 'user123', email: 'test@example.com' };
      const mockWallet: Wallet = {
        id: 'wallet123',
        address: '0x123456789',
        type: 'embedded',
      };
      
      mockPrivyService.login.mockResolvedValue(mockUser);
      mockPrivyService.createWallet.mockResolvedValue(mockWallet);
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      // Login first
      await act(async () => {
        await result.current.login();
      });
      
      // Create wallet
      await act(async () => {
        await result.current.createWallet();
      });
      
      expect(result.current.state.matches('authenticated')).toBe(true);
      expect(result.current.state.context.wallets).toContain(mockWallet);
    });
  });


  describe('State Persistence', () => {
    it('should persist state after successful operations', async () => {
      const mockUser: User = { id: 'user123', email: 'test@example.com' };
      mockPrivyService.login.mockResolvedValue(mockUser);
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      await act(async () => {
        await result.current.login();
      });
      
      expect(mockStateStorage.saveState).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          wallets: [],
          error: null,
        })
      );
    });

    it('should clear persisted state on logout', async () => {
      mockPrivyService.logout.mockResolvedValue(undefined);
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(mockStateStorage.clearState).toHaveBeenCalled();
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after error', async () => {
      mockPrivyService.login
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ id: 'user123', email: 'test@example.com' });
      
      const { result } = renderHook(() => usePrivyAuthMachine());
      
      // First attempt fails
      await act(async () => {
        await result.current.login();
      });
      
      expect(result.current.state.matches('error')).toBe(true);
      
      // Retry succeeds
      await act(async () => {
        result.current.retry();
      });
      
      expect(result.current.state.matches('idle')).toBe(true);
    });
  });
});