import { describe, it, expect, beforeEach } from 'vitest';
import { createActor } from 'xstate';
import { privyAuthMachine } from '../privyAuthMachine';
import { AuthState, type User, type Wallet } from '../../../types/auth';

describe('PrivyAuthMachine', () => {
  let actor: ReturnType<typeof createActor>;

  beforeEach(() => {
    actor = createActor(privyAuthMachine);
    actor.start();
  });

  afterEach(() => {
    actor.stop();
  });

  describe('Initial State', () => {
    it('should start in idle state', () => {
      expect(actor.getSnapshot().value).toBe(AuthState.IDLE);
    });

    it('should have empty context initially', () => {
      const snapshot = actor.getSnapshot();
      expect(snapshot.context.user).toBeNull();
      expect(snapshot.context.wallets).toEqual([]);
      expect(snapshot.context.error).toBeNull();
    });
  });

  describe('Authentication Flow', () => {
    it('should transition to authenticating when LOGIN event is sent', () => {
      actor.send({ type: 'LOGIN' });
      expect(actor.getSnapshot().value).toBe(AuthState.AUTHENTICATING);
    });

    it('should transition to authenticated when AUTH_SUCCESS event is sent', () => {
      const mockUser: User = {
        id: 'user123',
        email: 'test@example.com'
      };

      actor.send({ type: 'LOGIN' });
      actor.send({ type: 'AUTH_SUCCESS', user: mockUser });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(AuthState.AUTHENTICATED);
      expect(snapshot.context.user).toEqual(mockUser);
      expect(snapshot.context.error).toBeNull();
    });

    it('should transition to error when AUTH_ERROR event is sent', () => {
      const errorMessage = 'Authentication failed';
      
      actor.send({ type: 'LOGIN' });
      actor.send({ type: 'AUTH_ERROR', error: errorMessage });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(AuthState.ERROR);
      expect(snapshot.context.error).toBe(errorMessage);
    });

    it('should clear user data when LOGOUT event is sent', () => {
      const mockUser: User = { id: 'user123', email: 'test@example.com' };
      const mockWallet: Wallet = { id: 'wallet123', address: '0x123', type: 'embedded' };
      
      // First authenticate
      actor.send({ type: 'LOGIN' });
      actor.send({ type: 'AUTH_SUCCESS', user: mockUser });
      actor.send({ type: 'CREATE_WALLET' });
      actor.send({ type: 'WALLET_CREATED', wallet: mockWallet });
      
      // Then logout
      actor.send({ type: 'LOGOUT' });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(AuthState.IDLE);
      expect(snapshot.context.user).toBeNull();
      expect(snapshot.context.wallets).toEqual([]);
    });
  });

  describe('Wallet Management', () => {
    beforeEach(() => {
      const mockUser: User = { id: 'user123', email: 'test@example.com' };
      actor.send({ type: 'LOGIN' });
      actor.send({ type: 'AUTH_SUCCESS', user: mockUser });
    });

    it('should transition to creatingWallet when CREATE_WALLET event is sent', () => {
      actor.send({ type: 'CREATE_WALLET' });
      expect(actor.getSnapshot().value).toBe(AuthState.CREATING_WALLET);
    });

    it('should add wallet to context when WALLET_CREATED event is sent', () => {
      const mockWallet: Wallet = {
        id: 'wallet123',
        address: '0x123456789',
        type: 'embedded'
      };

      actor.send({ type: 'CREATE_WALLET' });
      actor.send({ type: 'WALLET_CREATED', wallet: mockWallet });
      
      const snapshot = actor.getSnapshot();
      expect(snapshot.value).toBe(AuthState.AUTHENTICATED);
      expect(snapshot.context.wallets).toContain(mockWallet);
    });
  });


  describe('Error Recovery', () => {
    it('should allow retry from error state', () => {
      actor.send({ type: 'LOGIN' });
      actor.send({ type: 'AUTH_ERROR', error: 'Network error' });
      
      expect(actor.getSnapshot().value).toBe(AuthState.ERROR);
      
      actor.send({ type: 'RETRY' });
      expect(actor.getSnapshot().value).toBe(AuthState.IDLE);
    });

    it('should allow direct login from error state', () => {
      actor.send({ type: 'LOGIN' });
      actor.send({ type: 'AUTH_ERROR', error: 'Network error' });
      
      expect(actor.getSnapshot().value).toBe(AuthState.ERROR);
      
      actor.send({ type: 'LOGIN' });
      expect(actor.getSnapshot().value).toBe(AuthState.AUTHENTICATING);
    });
  });

  describe('State Constraints', () => {
    it('should not allow CREATE_WALLET from idle state', () => {
      actor.send({ type: 'CREATE_WALLET' });
      expect(actor.getSnapshot().value).toBe(AuthState.IDLE);
    });


    it('should not allow LOGOUT from idle state', () => {
      actor.send({ type: 'LOGOUT' });
      expect(actor.getSnapshot().value).toBe(AuthState.IDLE);
    });
  });
});