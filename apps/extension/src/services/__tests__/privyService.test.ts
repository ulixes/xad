import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrivyService } from '../privyService';
import type { User, Wallet } from '../../types/auth';

// Mock Privy hooks
const mockLogin = vi.fn();
const mockLogout = vi.fn();
const mockCreateWallet = vi.fn();

vi.mock('@privy-io/react-auth', () => ({
  usePrivy: () => ({
    login: mockLogin,
    logout: mockLogout,
    authenticated: false,
    user: null,
  }),
  useCreateWallet: () => ({
    createWallet: mockCreateWallet,
  }),
}));

describe('PrivyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should call Privy login and return user data', async () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com',
      };

      mockLogin.mockResolvedValue(mockUser);

      const result = await PrivyService.login();

      expect(mockLogin).toHaveBeenCalledOnce();
      expect(result).toEqual(mockUser);
    });

    it('should throw error when login fails', async () => {
      const errorMessage = 'Login failed';
      mockLogin.mockRejectedValue(new Error(errorMessage));

      await expect(PrivyService.login()).rejects.toThrow(errorMessage);
    });

    it('should handle network errors gracefully', async () => {
      mockLogin.mockRejectedValue(new Error('Network error'));

      await expect(PrivyService.login()).rejects.toThrow('Network error');
    });
  });

  describe('logout', () => {
    it('should call Privy logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      await PrivyService.logout();

      expect(mockLogout).toHaveBeenCalledOnce();
    });

    it('should handle logout errors', async () => {
      mockLogout.mockRejectedValue(new Error('Logout failed'));

      await expect(PrivyService.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('createWallet', () => {
    it('should create a new wallet and return wallet data', async () => {
      const mockWallet: Wallet = {
        id: 'wallet123',
        address: '0x123456789',
        type: 'embedded',
      };

      mockCreateWallet.mockResolvedValue(mockWallet);

      const result = await PrivyService.createWallet();

      expect(mockCreateWallet).toHaveBeenCalledOnce();
      expect(result).toEqual(mockWallet);
    });

    it('should throw error when wallet creation fails', async () => {
      mockCreateWallet.mockRejectedValue(new Error('Wallet creation failed'));

      await expect(PrivyService.createWallet()).rejects.toThrow('Wallet creation failed');
    });

    it('should handle insufficient permissions error', async () => {
      mockCreateWallet.mockRejectedValue(new Error('Insufficient permissions'));

      await expect(PrivyService.createWallet()).rejects.toThrow('Insufficient permissions');
    });
  });


  describe('error handling', () => {
    it('should standardize error messages', async () => {
      mockLogin.mockRejectedValue({ message: 'Custom error' });

      await expect(PrivyService.login()).rejects.toThrow('Custom error');
    });

    it('should handle non-Error objects', async () => {
      mockLogin.mockRejectedValue('String error');

      await expect(PrivyService.login()).rejects.toThrow('Authentication failed');
    });
  });
});