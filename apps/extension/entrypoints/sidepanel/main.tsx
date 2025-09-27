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
  useLogout,
  AuthLayout,
  OAuthMethod
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

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = async (message: any) => {
      if (message.type === 'actionCompleted') {
        const { actionId, success, error, details } = message.payload;
        console.log('[Sidepanel] Action completed:', { actionId, success, details });
        
        // Clear active action when completed
        if (activeActionId === actionId) {
          setActiveActionId(null);
        }
        
        setActionStatuses(prev => ({
          ...prev,
          [actionId]: success ? 'completed' : 'error'
        }));
        
        // Store error message if action failed
        if (!success && error) {
          setActionErrors(prev => ({
            ...prev,
            [actionId]: error
          }));
        }
        
        // Update action run in database based on result
        const actionRunId = actionRunIdsRef.current[actionId] || actionRunIds[actionId];
        console.log('[DEBUG] Found actionRunId:', actionRunId);
        
        if (actionRunId) {
          try {
            if (success) {
              // Update to dom_verified when DOM tracking confirms action
              const updatePayload = {
                status: ActionRunStatus.DOM_VERIFIED,
                proof: {
                  actionType: details?.actionType || 'unknown',
                  platform: details?.platform || 'unknown',
                  timestamp: Date.now(),
                  domState: details?.domState || {},
                  userAgent: navigator.userAgent
                },
                verificationData: details
              };
              
              console.log('[DEBUG] Updating action run to DOM_VERIFIED');
              const updateResult = await apiClient.updateActionRun(actionRunId, updatePayload);
              console.log('[DEBUG] Update result:', updateResult);
            } else {
              // Update to failed if action failed
              await apiClient.updateActionRun(actionRunId, {
                status: ActionRunStatus.FAILED,
                verificationData: {
                  error: error || 'Action verification failed',
                  details
                }
              });
              console.log('Action run updated to FAILED');
            }
          } catch (updateError) {
            console.error('[DEBUG] Failed to update action run:', updateError);
          }
        }
        
        if (error) {
          console.error('Action failed:', actionId, error);
        } else if (success && details) {
          console.log('Action verified successfully:', details);
        }
      } else if (message.type === 'actionTracking') {
        // Handle real-time tracking updates from content script
        const { actionId, status } = message.payload;
        console.log('[Sidepanel] Action tracking update:', { actionId, status });
        
        if (status === 'tracking') {
          setActionStatuses(prev => ({
            ...prev,
            [actionId]: 'loading'
          }));
        }
      } else if (message.type === 'tiktokAccountComplete') {
        const { accountId, handle, profileData, hasViewerDemographics, hasFollowerDemographics } = message;
        console.log('TikTok account creation complete:', { 
          accountId, 
          handle, 
          hasViewerDemographics,
          hasFollowerDemographics,
          profileData 
        });
        
        // Find the account by ID
        const account = socialAccounts.find(acc => acc.id === accountId);
        
        if (account && user) {
          try {
            // Save profile data with all demographics in a single call
            console.log('Saving TikTok profile data with demographics:', {
              hasViewerDemographics,
              hasFollowerDemographics,
              hasProfileData: !!profileData,
              hasViewerDemographicsData: !!(profileData.viewerDemographics),
              hasFollowerDemographicsData: !!(profileData.followerDemographics)
            });
            
            const result = await apiClient.updateTikTokData(
              account.id, 
              profileData, 
              account.handle, 
              hasViewerDemographics,
              hasFollowerDemographics
            );
            
            console.log('TikTok data saved successfully:', result);
            
            if (result.viewerDemographics) {
              console.log('Viewer demographics saved:', result.viewerDemographics);
            }
            if (result.followerDemographics) {
              console.log('Follower demographics saved:', result.followerDemographics);
            }
            
            // Remove from verifying state
            setVerifyingAccounts(prev => {
              const newSet = new Set(prev);
              newSet.delete(accountId);
              return newSet;
            });
            
            // Reload social accounts from API
            const updatedAccounts = await apiClient.getUserSocialAccounts(user.id);
            setSocialAccounts(updatedAccounts);
            
            // Fetch eligible actions for the updated accounts
            await fetchActionsForAccounts(updatedAccounts);
            
            const demographicsStatus = [];
            if (hasViewerDemographics) demographicsStatus.push('viewer demographics');
            if (hasFollowerDemographics) demographicsStatus.push('follower demographics');
            
            console.log('✅ TikTok account successfully added' + 
                       (demographicsStatus.length > 0 ? ` with ${demographicsStatus.join(' and ')}!` : '!'));
          } catch (error) {
            console.error('❌ Failed to complete TikTok account creation:', error);
            setVerifyingAccounts(prev => {
              const newSet = new Set(prev);
              newSet.delete(accountId);
              return newSet;
            });
            setSocialAccounts(prev => prev.filter(acc => acc.id !== account.id));
          }
        } else {
          console.log('Cannot complete TikTok account: account or user missing', { account, user });
        }
      } else if (message.type === 'collectionError') {
        console.error('Collection error:', message.payload);
        const accountId = message.accountId;
        if (accountId) {
          // Remove from verifying state
          setVerifyingAccounts(prev => {
            const newSet = new Set(prev);
            newSet.delete(accountId);
            return newSet;
          });
          // Remove account if it was just added
          setSocialAccounts(prev => prev.filter(account => account.id !== accountId));
        }
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
    
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [socialAccounts, user, actionStatuses]);

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

  const handleAddSocialAccount = async (platform: Platform, username: string) => {
    console.log('Add social account:', { platform, username });
    
    if (!user) {
      console.error('No user connected');
      return;
    }

    try {
      // Create social account in API
      const newAccount = await apiClient.createSocialAccount({
        userId: user.id,
        platform: platform.toLowerCase() as any,
        handle: username,
      });

      // Add to accounts list and mark as verifying
      setSocialAccounts(prev => [...prev, newAccount]);
      setVerifyingAccounts(prev => new Set(prev).add(newAccount.id));

      // Send message to background script to collect data (TikTok only for now)
      if (platform.toLowerCase() !== 'tiktok') {
        console.error('Only TikTok platform is supported');
        // Remove account from API and UI on error
        await apiClient.deleteSocialAccount(newAccount.id);
        setSocialAccounts(prev => prev.filter(acc => acc.id !== newAccount.id));
        setVerifyingAccounts(prev => {
          const newSet = new Set(prev);
          newSet.delete(newAccount.id);
          return newSet;
        });
        return;
      }
      
      chrome.runtime.sendMessage({
        type: 'addTikTokAccount',
        handle: username,
        accountId: newAccount.id,
      });
      
      console.log('TikTok account created and verification started:', newAccount);
    } catch (error) {
      console.error('Failed to add social account:', error);
    }
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
    console.log('Account clicked:', account);
    
    // Navigate immediately for better UX
    setSelectedAccount(account);
    setCurrentView('actions');
    setLoadingActions(true);
    
    // Clear previous actions while loading new ones
    setEligibleActions([]);
    setActionStatuses({});
    
    try {
      const response = await apiClient.getEligibleActions(account.id);
      
      if (response && response.actions) {
        // Store the enhanced actions with user run data
        setEligibleActions(response.actions);
        
        // Update action statuses and run IDs based on user action runs
        const statuses: Record<string, ActionStatus> = {};
        const runIds: Record<string, string> = {};
        
        response.actions.forEach(action => {
          if (action.userActionRun) {
            console.log('Action run status from API:', {
              actionId: action.id,
              actionRunId: action.userActionRun.id,
              dbStatus: action.userActionRun.status,
              derivedUIStatus: deriveUIStatus(action.userActionRun.status)
            });
            statuses[action.id] = deriveUIStatus(action.userActionRun.status);
            // Store the action run ID for future updates
            runIds[action.id] = action.userActionRun.id;
          } else {
            statuses[action.id] = 'pending';
          }
        });
        
        setActionStatuses(statuses);
        setActionRunIds(runIds);
        // Also update ref for immediate access
        actionRunIdsRef.current = runIds;
      } else {
        console.error('Invalid response format:', response);
        setEligibleActions([]);
      }
    } catch (error) {
      console.error('Failed to fetch eligible actions:', error);
      // Show empty state on error
      setEligibleActions([]);
    } finally {
      setLoadingActions(false);
    }
  };

  // Derive UI status from action run status
  const deriveUIStatus = (actionRunStatus: string): ActionStatus => {
    switch (actionRunStatus) {
      case 'pending_verification':
        return 'loading';
      case 'dom_verified':
      case 'cdp_verified':
      case 'completed':
      case 'paid':
        return 'completed';
      case 'failed':
        return 'error';
      default:
        return 'pending';
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

  // Transform eligible actions to ActionListPage format
  const transformActionsForUI = (actions: EligibleAction[]) => {
    return actions.map(action => {
      // For comment actions, extract and randomize emoji content
      let commentContent = undefined;
      const actionType = action.type || action.actionType;
      
      if (actionType === 'comment') {
        // Check if metadata has comment content (emojis)
        if (action.metadata?.commentContent) {
          const selectedEmojis = action.metadata.commentContent.split(',');
          // Randomly pick ONE emoji from the selection
          const randomEmoji = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
          // Randomly repeat it 1-5 times
          const repeatCount = Math.floor(Math.random() * 5) + 1;
          commentContent = randomEmoji.repeat(repeatCount);
        } else if (action.target && action.target.includes('|')) {
          // Fallback: parse from target field
          const parts = action.target.split('|');
          if (parts[1]) {
            const selectedEmojis = parts[1].split(',');
            const randomEmoji = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
            const repeatCount = Math.floor(Math.random() * 5) + 1;
            commentContent = randomEmoji.repeat(repeatCount);
          }
        }
      }
      
      return {
        id: action.id,
        type: actionType as any,
        status: (actionStatuses[action.id] || 'pending') as ActionStatus,
        url: action.targetUrl || action.metadata?.url || action.target,
        target: action.target,
        payment: action.price / 100, // Convert cents to dollars
        platform: (action.platform || selectedAccount?.platform || 'instagram').toLowerCase() as any,
        errorMessage: actionErrors[action.id],
        actionRunId: action.userActionRun?.id,
        isResumable: ['pending_verification', 'dom_verified', 'cdp_verified'].includes(action.userActionRun?.status || ''),
        commentContent // Add the randomized comment content
      };
    });
  };

  // Render different views based on navigation state
  if (currentView === 'actions' && selectedAccount) {
    return (
      <ActionListPage
        accountHandle={selectedAccount.handle}
        platform={selectedAccount.platform.toLowerCase() as any}
        actions={transformActionsForUI(eligibleActions)}
        availableActionsCount={eligibleActions.length}
        isLoading={loadingActions}
        onBack={handleNavigateHome}
        onActionClick={async (actionId: string) => {
          console.log('Action clicked:', actionId);
          
          // Check if another action is currently in progress
          if (activeActionId && activeActionId !== actionId) {
            console.log('Another action is in progress:', activeActionId);
            alert('Please wait for the current action to complete before starting a new one.');
            return;
          }
          
          const selectedAction = eligibleActions.find(a => a.id === actionId);
          if (!selectedAction) {
            console.error('Selected action not found');
            return;
          }
          
          // Don't allow clicking if action is completed
          const status = actionStatuses[actionId];
          if (status === 'completed') {
            console.log('Action already completed');
            return;
          }
          
          // Check if resuming an existing action run (for loading or failed states)
          if (selectedAction.userActionRun && (status === 'loading' || status === 'error')) {
            console.log('Resuming/retrying action:', selectedAction.userActionRun.id, 'Status:', status);
            
            // Set as active action when resuming
            setActiveActionId(actionId);
            
            // If it's a failed action, reset it to pending_verification first
            if (status === 'error') {
              try {
                console.log('Resetting failed action to pending_verification');
                await apiClient.updateActionRun(selectedAction.userActionRun.id, {
                  status: ActionRunStatus.PENDING_VERIFICATION,
                  verificationData: { retryAttempt: true, previousFailure: true }
                });
                
                // Update UI to show loading and clear error
                setActionStatuses(prev => ({
                  ...prev,
                  [actionId]: 'loading'
                }));
                setActionErrors(prev => {
                  const newErrors = { ...prev };
                  delete newErrors[actionId];
                  return newErrors;
                });
              } catch (error) {
                console.error('Failed to reset action run status:', error);
              }
            }
            
            // Resume/retry the action by opening the tab again
            // Extract comment content if this is a comment action
            let commentContent = null;
            if ((selectedAction.type || selectedAction.actionType).toLowerCase() === 'comment') {
              if (selectedAction.commentContent) {
                commentContent = selectedAction.commentContent;
              } else if (selectedAction.metadata?.commentContent) {
                const selectedEmojis = selectedAction.metadata.commentContent.split(',');
                const randomEmoji = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
                const repeatCount = Math.floor(Math.random() * 5) + 1;
                commentContent = randomEmoji.repeat(repeatCount);
              }
            }
            
            await chrome.runtime.sendMessage({
              type: 'executeAction',
              payload: {
                actionId: selectedAction.id,
                actionRunId: selectedAction.userActionRun.id,
                url: selectedAction.targetUrl || selectedAction.url || selectedAction.target,
                actionType: (selectedAction.type || selectedAction.actionType).toLowerCase(),
                platform: (selectedAction.platform || selectedAccount.platform).toLowerCase(),
                accountHandle: selectedAccount.handle,
                commentContent,
                isResume: status === 'loading',
                isRetry: status === 'error'
              }
            });
            return;
          }
          
          if (!user || !selectedAccount) {
            console.error('Missing required data:', { user, selectedAccount });
            return;
          }
          
          console.log('Starting new action:', selectedAction);
          
          // Update status to loading and set as active action
          setActionStatuses(prev => ({
            ...prev,
            [actionId]: 'loading'
          }));
          setActiveActionId(actionId);
          
          try {
            // Use the new startActionRun method (handles duplicates)
            console.log('Starting action run...');
            const actionRun = await apiClient.startActionRun({
              actionId: selectedAction.id,
              userId: user.id,
              socialAccountId: selectedAccount.id
            });
            
            console.log('Action run started:', actionRun);
            
            // Store the action run ID for later updates
            actionRunIdsRef.current[selectedAction.id] = actionRun.id;
            console.log('[DEBUG] Updated actionRunIds ref:', actionRunIdsRef.current);
            
            // Also update state for React rendering
            setActionRunIds(prev => {
              const newMap = {
                ...prev,
                [selectedAction.id]: actionRun.id
              };
              console.log('[DEBUG] Updated actionRunIds state:', newMap);
              return newMap;
            });
            
            // Send message to background script to open tab and start tracking
            // Extract comment content if this is a comment action
            let commentContent = null;
            if ((selectedAction.type || selectedAction.actionType).toLowerCase() === 'comment') {
              if (selectedAction.commentContent) {
                commentContent = selectedAction.commentContent;
              } else if (selectedAction.metadata?.commentContent) {
                const selectedEmojis = selectedAction.metadata.commentContent.split(',');
                const randomEmoji = selectedEmojis[Math.floor(Math.random() * selectedEmojis.length)];
                const repeatCount = Math.floor(Math.random() * 5) + 1;
                commentContent = randomEmoji.repeat(repeatCount);
              }
            }
            
            await chrome.runtime.sendMessage({
              type: 'executeAction',
              payload: {
                actionId: selectedAction.id,
                actionRunId: actionRun.id,
                url: selectedAction.targetUrl || selectedAction.url || selectedAction.target,
                actionType: (selectedAction.type || selectedAction.actionType).toLowerCase(),
                platform: (selectedAction.platform || selectedAccount.platform).toLowerCase(),
                accountHandle: selectedAccount.handle,
                commentContent
              }
            });
          } catch (error) {
            console.error('Failed to start action:', error);
            // Clear active action on error
            setActiveActionId(null);
            setActionStatuses(prev => ({
              ...prev,
              [actionId]: 'error'
            }));
            setActionErrors(prev => ({
              ...prev,
              [actionId]: error instanceof Error ? error.message : 'Failed to start action'
            }));
            
            // If we created an action run but failed to start tracking, update it to failed
            const actionRunId = actionRunIds[actionId];
            if (actionRunId) {
              try {
                await apiClient.updateActionRun(actionRunId, {
                  status: ActionRunStatus.FAILED,
                  verificationData: {
                    error: error instanceof Error ? error.message : 'Failed to start action tracking'
                  }
                });
              } catch (updateError) {
                console.error('Failed to update action run status:', updateError);
              }
            }
          }
        }}
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
      // Earnings data
      pendingEarnings={user?.totalEarnings || 0}
      availableEarnings={user?.availableEarnings || 0}
      dailyActionsCompleted={0} // TODO: Calculate from today's action runs
      dailyActionsRequired={10} // TODO: Get from campaign requirements

      // Wallet
      walletAddress={walletAddress || undefined}

      // Connected accounts with eligible actions count and verification state
      connectedAccounts={socialAccounts.map(account => {
        console.log('Mapping account for UI:', account);
        const isCurrentlyVerifying = verifyingAccounts.has(account.id);
        const isVerified = account.isVerified || false;
        
        return {
          platform: account.platform,
          handle: account.handle,
          availableActions: accountActions[account.id] || 0,
          isVerifying: isCurrentlyVerifying,
          isVerified: isVerified
        };
      })}
      
      // Disable all platforms except TikTok
      disabledPlatforms={['instagram', 'x', 'reddit']}

      // Handlers
      onAddAccount={handleAddSocialAccount}
      onAccountClick={async (account: any) => {
        console.log('Account clicked from Home:', account);
        
        // Find the full social account data
        const fullAccount = socialAccounts.find(
          acc => acc.handle === account.handle && acc.platform === account.platform
        );
        
        if (!fullAccount) {
          console.error('Account not found');
          return;
        }
        
        await handleActionClick(fullAccount);
      }}
      onWalletClick={walletAddress ? handleDisconnect : handleConnectWallet}
      onJackpotClick={() => {
        console.log('Mock jackpot clicked');
      }}
      onCashOut={handleNavigateWithdraw}
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
          environment: import.meta.env.VITE_PARA_ENVIRONMENT || 'BETA',
          options: {
            ...chromeStorageOverrides,
            useStorageOverrides: true,
          }
        }}
        config={{
          appName: 'ZKAD Actions'
        }}
        callbacks={{
          onLogin: (event) => {
            console.log('Para login event:', event);
          },
          onLogout: (event) => {
            console.log('Para logout event:', event);
          },
          onAccountCreation: (event) => {
            console.log('Para account creation:', event);
          },
          onError: (error) => {
            console.error('Para error:', error);
          }
        }}
        paraModalConfig={{
          authLayout: [AuthLayout.AUTH_FULL],
          disableEmailLogin: false,
          disablePhoneLogin: false,
          oAuthMethods: [],
          theme: {
            mode: 'dark',
            foregroundColor: '#FFFFFF',
            backgroundColor: '#1A1A1A',
            accentColor: '#3B82F6'
          },
          logo: '/icon.svg',
          appName: 'ZKAD Actions',
          recoverySecretStepEnabled: true,
          onRampTestMode: false
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