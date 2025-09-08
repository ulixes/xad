import { useEffect, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { usePrivy, useCreateWallet } from '@privy-io/react-auth';
import { privyAuthMachine } from '../state/machines/privyAuthMachine';
import { StateStorage } from '../services/stateStorage';

export function usePrivyAuthMachine() {
  const [state, send] = useMachine(privyAuthMachine);
  const { login: privyLogin, logout: privyLogout, user: privyUser, authenticated } = usePrivy();
  const { createWallet: privyCreateWallet } = useCreateWallet();

  // React to Privy authentication state changes
  useEffect(() => {
    if (authenticated && privyUser && !state.matches('authenticated')) {
      send({ type: 'AUTH_SUCCESS', user: privyUser });
    } else if (!authenticated && state.matches('authenticated')) {
      send({ type: 'LOGOUT' });
    }
  }, [authenticated, privyUser, state, send]);

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedState = await StateStorage.loadState();
        if (persistedState?.user) {
          send({ type: 'AUTH_SUCCESS', user: persistedState.user });
          // Restore other state if needed
          if (persistedState.wallets?.length) {
            persistedState.wallets.forEach(wallet => {
              send({ type: 'WALLET_CREATED', wallet });
            });
          }
        }
      } catch (error) {
        console.error('Failed to load persisted state:', error);
      }
    };

    loadPersistedState();
  }, [send]);

  // Persist state changes
  useEffect(() => {
    const persistState = async () => {
      if (state.matches('authenticated') || state.matches('error')) {
        try {
          await StateStorage.saveState(state.context);
        } catch (error) {
          console.error('Failed to persist state:', error);
        }
      }
    };

    persistState();
  }, [state]);

  const login = useCallback(async () => {
    send({ type: 'LOGIN' });
    try {
      await privyLogin();
      // State update will be handled by the useEffect above when authenticated changes
    } catch (error) {
      send({ 
        type: 'AUTH_ERROR', 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      });
    }
  }, [send, privyLogin]);

  const logout = useCallback(async () => {
    try {
      await privyLogout();
      await StateStorage.clearState();
      send({ type: 'LOGOUT' });
    } catch (error) {
      send({ 
        type: 'AUTH_ERROR', 
        error: error instanceof Error ? error.message : 'Logout failed' 
      });
    }
  }, [send, privyLogout]);

  const createWallet = useCallback(async () => {
    send({ type: 'CREATE_WALLET' });
    try {
      const wallet = await privyCreateWallet();
      send({ type: 'WALLET_CREATED', wallet });
    } catch (error) {
      send({ 
        type: 'AUTH_ERROR', 
        error: error instanceof Error ? error.message : 'Wallet creation failed' 
      });
    }
  }, [send, privyCreateWallet]);


  const retry = useCallback(() => {
    send({ type: 'RETRY' });
  }, [send]);

  return {
    state,
    login,
    logout,
    createWallet,
    retry,
  };
}