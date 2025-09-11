import { useMachine, useSelector } from '@xstate/react';
import { userMachine } from '../machines/userMachine';
import { useMemo, useCallback, useEffect, useState } from 'react';

// Selectors for fine-grained updates
const selectIsInitializing = (snapshot: any) => snapshot.matches('initializing');
const selectIsError = (snapshot: any) => snapshot.matches('error');
const selectIsReady = (snapshot: any) => snapshot.matches('ready');

// Account management selectors
const selectIsAddingAccount = (snapshot: any) => 
  snapshot.matches('ready.accountManagement.addingAccount');
const selectIsEnteringHandle = (snapshot: any) => 
  snapshot.matches('ready.accountManagement.addingAccount.enteringHandle');
const selectIsValidating = (snapshot: any) => 
  snapshot.matches('ready.accountManagement.addingAccount.validating');

// Wallet management selectors
const selectIsWithdrawing = (snapshot: any) => 
  snapshot.matches('ready.walletManagement.withdrawing');

// Context selectors
const selectProfile = (snapshot: any) => snapshot.context.profile;
const selectSelectedPlatform = (snapshot: any) => snapshot.context.selectedPlatform;
const selectHandleInput = (snapshot: any) => snapshot.context.handleInput;
const selectValidationError = (snapshot: any) => snapshot.context.validationError;
const selectSystemError = (snapshot: any) => snapshot.context.error;

// Account data selector
const selectAccountsData = (snapshot: any) => {
  return snapshot.context.accounts.map((actor: any) => {
    const actorSnapshot = actor.getSnapshot();
    const accountData = {
      id: actorSnapshot.context.id,
      platform: actorSnapshot.context.platform,
      handle: actorSnapshot.context.handle,
      availableActions: actorSnapshot.context.availableActions,
      maxActions: actorSnapshot.context.maxActions,
      profileData: actorSnapshot.context.profileData,
      verificationError: actorSnapshot.context.verificationError,
      // State information
      isVerifying: actorSnapshot.matches('verifying'),
      isRetrying: actorSnapshot.matches('retrying'),
      isVerified: actorSnapshot.matches('verified'),
      isFailed: actorSnapshot.matches('failed'),
    };
    
    // Debug log the account state
    console.log(`🔍 Account ${accountData.id} state:`, {
      currentState: actorSnapshot.value,
      isVerifying: accountData.isVerifying,
      isRetrying: accountData.isRetrying,
      isVerified: accountData.isVerified,
      isFailed: accountData.isFailed,
      availableActions: accountData.availableActions
    });
    
    return accountData;
  });
};

export interface AccountData {
  id: string;
  platform: string;
  handle: string;
  availableActions: number;
  maxActions: number;
  profileData?: any;
  verificationError?: string;
  isVerifying: boolean;
  isRetrying: boolean;
  isVerified: boolean;
  isFailed: boolean;
}

export function useUserMachine() {
  const [state, send, actorRef] = useMachine(userMachine);
  const [accountsVersion, setAccountsVersion] = useState(0);
  
  // Subscribe to changes in child actors
  useEffect(() => {
    const subscriptions = state.context.accounts.map((actor: any) => {
      return actor.subscribe(() => {
        // Force re-render when any child actor changes
        setAccountsVersion(prev => prev + 1);
      });
    });

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [state.context.accounts]);
  
  // Use selectors for individual pieces of state
  const isInitializing = useSelector(actorRef, selectIsInitializing);
  const isError = useSelector(actorRef, selectIsError);
  const isReady = useSelector(actorRef, selectIsReady);
  
  // Account management states
  const isAddingAccount = useSelector(actorRef, selectIsAddingAccount);
  const isEnteringHandle = useSelector(actorRef, selectIsEnteringHandle);
  const isValidating = useSelector(actorRef, selectIsValidating);
  
  // Wallet state
  const isWithdrawing = useSelector(actorRef, selectIsWithdrawing);
  
  // Context data
  const profile = useSelector(actorRef, selectProfile);
  const selectedPlatform = useSelector(actorRef, selectSelectedPlatform);
  const handleInput = useSelector(actorRef, selectHandleInput);
  const validationError = useSelector(actorRef, selectValidationError);
  const systemError = useSelector(actorRef, selectSystemError);
  
  // Account data - now will re-compute when accountsVersion changes
  const accounts = useMemo(() => {
    return state.context.accounts.map((actor: any) => {
      const actorSnapshot = actor.getSnapshot();
      const accountData = {
        id: actorSnapshot.context.id,
        platform: actorSnapshot.context.platform,
        handle: actorSnapshot.context.handle,
        availableActions: actorSnapshot.context.availableActions,
        maxActions: actorSnapshot.context.maxActions,
        profileData: actorSnapshot.context.profileData,
        verificationError: actorSnapshot.context.verificationError,
        // State information
        isVerifying: actorSnapshot.matches('verifying'),
        isRetrying: actorSnapshot.matches('retrying'),
        isVerified: actorSnapshot.matches('verified'),
        isFailed: actorSnapshot.matches('failed'),
      };
      
      // Debug log the account state
      console.log(`🔍 Account ${accountData.id} state:`, {
        currentState: actorSnapshot.value,
        isVerifying: accountData.isVerifying,
        isRetrying: accountData.isRetrying,
        isVerified: accountData.isVerified,
        isFailed: accountData.isFailed,
        availableActions: accountData.availableActions
      });
      
      return accountData;
    });
  }, [state.context.accounts, accountsVersion]);
  
  // Memoized helper functions
  const getAccountsForPlatform = useCallback((platformId: string) => {
    return accounts.filter((acc: AccountData) => acc.platform === platformId);
  }, [accounts]);
  
  const getAccountById = useCallback((accountId: string) => {
    return accounts.find((acc: AccountData) => acc.id === accountId);
  }, [accounts]);
  
  const canAddMoreAccounts = useMemo(() => {
    return accounts.length < 10; // Match the guard in the machine
  }, [accounts]);
  
  // Action dispatchers
  const startAddAccount = useCallback((platform: string) => {
    send({ type: 'START_ADD_ACCOUNT', platform });
  }, [send]);
  
  const updateHandle = useCallback((handle: string) => {
    send({ type: 'UPDATE_HANDLE', handle });
  }, [send]);
  
  const submitHandle = useCallback(() => {
    send({ type: 'SUBMIT_HANDLE' });
  }, [send]);
  
  const cancelAddAccount = useCallback(() => {
    send({ type: 'CANCEL_ADD_ACCOUNT' });
  }, [send]);
  
  const removeAccount = useCallback((accountId: string) => {
    send({ type: 'REMOVE_ACCOUNT', accountId });
  }, [send]);
  
  const cashOut = useCallback(() => {
    send({ type: 'CASH_OUT' });
  }, [send]);
  
  const clickWallet = useCallback(() => {
    send({ type: 'CLICK_WALLET' });
  }, [send]);
  
  const retryLoad = useCallback(() => {
    send({ type: 'RETRY_LOAD' });
  }, [send]);

  const connectWallet = useCallback(() => {
    send({ type: 'CONNECT_WALLET' });
  }, [send]);

  const disconnectWallet = useCallback(() => {
    send({ type: 'DISCONNECT_WALLET' });
  }, [send]);
  
  // Account actions - send events to specific account actors
  const retryAccountVerification = useCallback((accountId: string) => {
    const account = state.context.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.send({ type: 'RETRY_VERIFICATION' });
    }
  }, [state.context.accounts]);
  
  const clickAccount = useCallback((accountId: string) => {
    const account = state.context.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.send({ type: 'CLICK' });
    }
  }, [state.context.accounts]);
  
  const consumeAccountAction = useCallback((accountId: string) => {
    const account = state.context.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.send({ type: 'CONSUME_ACTION' });
    }
  }, [state.context.accounts]);
  
  const refreshAccountActions = useCallback((accountId: string) => {
    const account = state.context.accounts.find(acc => acc.id === accountId);
    if (account) {
      account.send({ type: 'REFRESH_ACTIONS' });
    }
  }, [state.context.accounts]);
  
  return {
    // Machine states
    isInitializing,
    isError,
    isReady,
    isAddingAccount,
    isEnteringHandle,
    isValidating,
    isWithdrawing,
    
    // Profile data
    walletAddress: profile?.walletAddress,
    pendingEarnings: profile?.pendingEarnings ?? 0,
    availableEarnings: profile?.availableEarnings ?? 0,
    dailyActionsCompleted: profile?.dailyActionsCompleted ?? 0,
    dailyActionsRequired: profile?.dailyActionsRequired ?? 5,
    
    // Account management data
    selectedPlatform,
    handleInput,
    validationError,
    systemError,
    
    // Accounts
    accounts,
    accountCount: accounts.length,
    canAddMoreAccounts,
    getAccountsForPlatform,
    getAccountById,
    
    // User actions
    startAddAccount,
    updateHandle,
    submitHandle,
    cancelAddAccount,
    removeAccount,
    cashOut,
    clickWallet,
    connectWallet,
    disconnectWallet,
    retryLoad,
    
    // Account actions
    retryAccountVerification,
    clickAccount,
    consumeAccountAction,
    refreshAccountActions,
    
    // Raw access (for debugging)
    state,
    send,
    actorRef,
  };
}