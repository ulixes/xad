import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { Home, ActionListPage, WithdrawPage, ActionHistory } from '@xad/ui';
import './style.css';
import { Platform, SocialAccount, User, UserStatus, EligibleAction, ActionType } from '@/src/types';
import { adaptSocialAccountsForUI } from '@/src/utils/adapters';
import { 
  ParaProvider, 
  ParaModal,
  useModal,
  useAccount,
  useWallet,
  useIssueJwt,
  useLogout
} from '@getpara/react-sdk';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from '@/src/services/api';
import { ActionRunStatus } from '@/src/types/actionRun';
import { chromeStorageOverrides } from '@/src/services/chromeStorage';

// Ensure Buffer is available for SDKs that expect Node globals
(window as any).Buffer = (window as any).Buffer || Buffer;

type ViewState = 'home' | 'actions' | 'withdraw';
type ActionStatus = 'pending' | 'loading' | 'completed' | 'error';

// Create Query Client for React Query
const queryClient = new QueryClient();

const AppContent = () => {
  // Para hooks
  const { openModal } = useModal();
  const account = useAccount();
  const { data: wallet } = useWallet();
  const { issueJwtAsync } = useIssueJwt();
  const { logout } = useLogout();

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accountActions, setAccountActions] = useState<Record<string, number>>({});
  const [verifyingAccounts, setVerifyingAccounts] = useState<Set<string>>(new Set());
  
  // Navigation state
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [eligibleActions, setEligibleActions] = useState<EligibleAction[]>([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [actionStatuses, setActionStatuses] = useState<Record<string, ActionStatus>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [actionRunIds, setActionRunIds] = useState<Record<string, string>>({});
  const actionRunIdsRef = useRef<Record<string, string>>({});
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  
  // Withdraw page state
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Set up API client with Para JWT token getter
  useEffect(() => {
    apiClient.setAccessTokenGetter(async () => {
      try {
        if (account.isConnected) {
          const { token } = await issueJwtAsync();
          return token;
        }
      } catch (error) {
        console.error('Failed to get Para JWT token:', error);
      }
      return null;
    });
  }, [account.isConnected, issueJwtAsync]);

  // Check wallet connection and load user data when Para auth changes
  useEffect(() => {
    const initialize = async () => {
      try {
        if (account.isConnected && wallet) {
          const address = wallet.address;
          setWalletAddress(address);
          
          // Get or create user using Para authentication
          const userData = await apiClient.getOrCreateCurrentUser();
          if (userData) {
            setUser(userData);
            setSocialAccounts(userData.socialAccounts || []);
            
            // Fetch eligible actions for each account
            if (userData.socialAccounts) {
              await fetchActionsForAccounts(userData.socialAccounts);
            }
          }
        } else if (!account.isConnected) {
          setWalletAddress(null);
          setUser(null);
          setSocialAccounts([]);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [account.isConnected, wallet]);

  // Function to fetch eligible actions for accounts
  const fetchActionsForAccounts = async (accounts: SocialAccount[]) => {
    const actionsMap: Record<string, number> = {};
    
    for (const account of accounts) {
      if (!account?.id) {
        console.warn('Skipping account with undefined ID:', account);
        continue;
      }
      
      try {
        const response = await apiClient.getEligibleActions(account.id);
        if (response?.actions) {
          actionsMap[account.id] = response.actions.length;
        }
      } catch (error) {
        console.error(`Failed to fetch actions for account ${account.id}:`, error);
        actionsMap[account.id] = 0;
      }
    }
    
    setAccountActions(actionsMap);
  };

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    try {
      openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logout();
      setWalletAddress(null);
      setUser(null);
      setSocialAccounts([]);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const handleAddSocialAccount = (platform: Platform, username: string, userId: string) => {
    console.log('Add social account:', { platform, username, userId });
    // This would open the verification flow
  };

  const handleStartVerification = async (accountId: string) => {
    try {
      setVerifyingAccounts(prev => new Set(prev).add(accountId));
      await apiClient.startVerification(accountId);
      
      // Open new tab for manual verification
      chrome.tabs.create({
        url: 'chrome://extensions/?id=' + chrome.runtime.id,
        active: false
      }, (tab) => {
        setTimeout(() => {
          if (tab.id) chrome.tabs.remove(tab.id);
        }, 1000);
      });
      
      // Refresh user data after delay
      setTimeout(async () => {
        const userData = await apiClient.getOrCreateCurrentUser();
        if (userData) {
          setSocialAccounts(userData.socialAccounts || []);
          await fetchActionsForAccounts(userData.socialAccounts || []);
        }
        setVerifyingAccounts(prev => {
          const newSet = new Set(prev);
          newSet.delete(accountId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error('Failed to start verification:', error);
      setVerifyingAccounts(prev => {
        const newSet = new Set(prev);
        newSet.delete(accountId);
        return newSet;
      });
    }
  };

  const handleWithdrawRequest = async (amount: number, address: string) => {
    console.log('Processing withdrawal:', { amount, address });
    try {
      await apiClient.createWithdrawal({
        amount: Math.floor(amount),
        walletAddress: address,
      });
      
      const userData = await apiClient.getOrCreateCurrentUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to create withdrawal:', error);
      throw error;
    }
  };

  // Navigation handlers
  const handleActionClick = async (account: SocialAccount) => {
    setSelectedAccount(account);
    setCurrentView('actions');
    setLoadingActions(true);
    
    try {
      const response = await apiClient.getEligibleActions(account.id);
      setEligibleActions(response?.actions || []);
    } catch (error) {
      console.error('Failed to fetch eligible actions:', error);
      setEligibleActions([]);
    } finally {
      setLoadingActions(false);
    }
  };

  const handleActionRun = async (action: EligibleAction) => {
    if (activeActionId) {
      console.log('Another action is already running');
      return;
    }

    const actionId = action.id;
    console.log('Starting action:', action.title);
    
    setActiveActionId(actionId);
    setActionStatuses(prev => ({ ...prev, [actionId]: 'loading' }));
    setActionErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[actionId];
      return newErrors;
    });

    try {
      const actionRun = await apiClient.createActionRun({
        campaignId: action.campaignId,
        socialAccountId: selectedAccount!.id,
        actionType: action.type,
        metadata: {
          actionId,
          title: action.title,
          platform: action.platform,
          targetUrl: action.targetUrl || action.metadata?.url || ''
        }
      });

      if (actionRun) {
        setActionRunIds(prev => ({ ...prev, [actionId]: actionRun.id }));
        actionRunIdsRef.current[actionId] = actionRun.id;

        // Open action URL in new tab
        if (action.targetUrl || action.metadata?.url) {
          const targetUrl = action.targetUrl || action.metadata?.url;
          chrome.tabs.create({ url: targetUrl, active: true }, (tab) => {
            chrome.runtime.sendMessage({
              type: 'ACTION_STARTED',
              actionRunId: actionRun.id,
              tabId: tab.id,
              actionType: action.type,
              platform: action.platform,
              targetUrl
            });
          });
        }

        // Monitor action status
        const checkInterval = setInterval(async () => {
          try {
            const currentActionRunId = actionRunIdsRef.current[actionId];
            if (!currentActionRunId) {
              clearInterval(checkInterval);
              return;
            }

            const updatedRun = await apiClient.getActionRun(currentActionRunId);
            
            if (updatedRun?.status === ActionRunStatus.COMPLETED) {
              clearInterval(checkInterval);
              setActionStatuses(prev => ({ ...prev, [actionId]: 'completed' }));
              setActiveActionId(null);
              
              // Refresh actions
              const response = await apiClient.getEligibleActions(selectedAccount!.id);
              setEligibleActions(response?.actions || []);
              
              // Update user points
              const userData = await apiClient.getOrCreateCurrentUser();
              if (userData) {
                setUser(userData);
              }
            } else if (updatedRun?.status === ActionRunStatus.FAILED) {
              clearInterval(checkInterval);
              setActionStatuses(prev => ({ ...prev, [actionId]: 'error' }));
              setActionErrors(prev => ({ 
                ...prev, 
                [actionId]: updatedRun.error || 'Action failed' 
              }));
              setActiveActionId(null);
            }
          } catch (error) {
            console.error('Failed to check action status:', error);
          }
        }, 2000);

        // Timeout after 2 minutes
        setTimeout(() => {
          clearInterval(checkInterval);
          setActionStatuses(prev => {
            if (prev[actionId] === 'loading') {
              return { ...prev, [actionId]: 'error' };
            }
            return prev;
          });
          setActionErrors(prev => {
            if (!prev[actionId] && actionStatuses[actionId] === 'loading') {
              return { ...prev, [actionId]: 'Action timed out' };
            }
            return prev;
          });
          setActiveActionId(null);
        }, 120000);
      }
    } catch (error) {
      console.error('Failed to run action:', error);
      setActionStatuses(prev => ({ ...prev, [actionId]: 'error' }));
      setActionErrors(prev => ({ 
        ...prev, 
        [actionId]: error instanceof Error ? error.message : 'Failed to start action' 
      }));
      setActiveActionId(null);
    }
  };

  const handleNavigateHome = () => {
    setCurrentView('home');
    setSelectedAccount(null);
    setEligibleActions([]);
  };

  const handleNavigateWithdraw = async () => {
    setCurrentView('withdraw');
    setLoadingHistory(true);
    try {
      const withdrawals = await apiClient.getUserWithdrawals();
      const history = withdrawals.map(w => ({
        date: new Date(w.createdAt).toLocaleDateString(),
        amount: w.amount,
        status: w.status as 'pending' | 'completed' | 'failed',
        transactionHash: w.transactionHash
      }));
      setActionHistory(history);
    } catch (error) {
      console.error('Failed to fetch withdrawal history:', error);
      setActionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Render different views based on navigation state
  if (currentView === 'actions' && selectedAccount) {
    return (
      <ActionListPage
        accountInfo={{
          platform: selectedAccount.platform.toLowerCase() as 'instagram' | 'tiktok' | 'x',
          handle: selectedAccount.handle
        }}
        actions={eligibleActions}
        loading={loadingActions}
        actionStatuses={actionStatuses}
        actionErrors={actionErrors}
        onActionRun={handleActionRun}
        onBack={handleNavigateHome}
        disableActions={!!activeActionId}
      />
    );
  }

  if (currentView === 'withdraw') {
    return (
      <WithdrawPage
        points={user?.points || 0}
        history={actionHistory}
        loadingHistory={loadingHistory}
        onWithdrawRequest={handleWithdrawRequest}
        onBack={handleNavigateHome}
      />
    );
  }

  // Home view
  return (
    <Home
      walletAddress={walletAddress}
      isConnecting={isConnecting}
      points={user?.points || 0}
      accounts={adaptSocialAccountsForUI(socialAccounts, accountActions, verifyingAccounts)}
      isCheckingEligibility={false}
      onConnectWallet={handleConnectWallet}
      onDisconnect={handleDisconnect}
      onAddAccount={handleAddSocialAccount}
      onVerifyAccount={handleStartVerification}
      onActionClick={handleActionClick}
      onWithdrawClick={handleNavigateWithdraw}
    />
  );
};

// Main App Component with Providers
function App() {
  const apiKey = import.meta.env.VITE_PARA_API_KEY || '';

  return (
    <QueryClientProvider client={queryClient}>
      <ParaProvider
        paraClientConfig={{
          apiKey,
          options: {
            ...chromeStorageOverrides,
            useStorageOverrides: true,
          }
        }}
        paraModalConfig={{
          authLayout: ['AUTH_FULL', 'EXTERNAL_FULL'] as const,
          theme: {
            mode: 'light' as const,
            foregroundColor: '#000000',
            backgroundColor: '#FFFFFF',
            accentColor: '#007AFF'
          },
          logo: '/icon.svg'
        }}
      >
        <AppContent />
        <ParaModal />
      </ParaProvider>
    </QueryClientProvider>
  );
}

// Render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);