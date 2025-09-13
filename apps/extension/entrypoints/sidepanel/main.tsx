import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Home, ActionListPage, WithdrawPage, ActionHistory } from '@xad/ui';
import './style.css';
import { Platform, SocialAccount, User, UserStatus, EligibleAction, ActionType } from '@/src/types';
import { adaptSocialAccountsForUI } from '@/src/utils/adapters';
import { portoWallet } from '@/src/services/PortoWallet';
import { apiClient } from '@/src/services/api';
import { ActionRunStatus } from '@/src/types/actionRun';

type ViewState = 'home' | 'actions' | 'withdraw';
type ActionStatus = 'pending' | 'loading' | 'completed' | 'error';

const App = () => {
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
  const [actionRunIds, setActionRunIds] = useState<Record<string, string>>({});  // Map action ID to action run ID
  
  // Withdraw page state
  const [actionHistory, setActionHistory] = useState<ActionHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Check wallet connection and load user data on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const account = await portoWallet.getAccount();
        if (account?.isConnected) {
          setWalletAddress(account.address);
          
          // Get or create user in API
          const userData = await apiClient.getOrCreateUserByWallet(account.address);
          setUser(userData);
          setSocialAccounts(userData.socialAccounts || []);
          
          // Fetch eligible actions for each account
          if (userData.socialAccounts) {
            await fetchActionsForAccounts(userData.socialAccounts);
          }
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  // Function to fetch eligible actions for accounts
  const fetchActionsForAccounts = async (accounts: SocialAccount[]) => {
    const actionsMap: Record<string, number> = {};
    
    for (const account of accounts) {
      // Skip accounts with undefined or invalid IDs
      if (!account?.id) {
        console.warn('Skipping account with undefined ID:', account);
        continue;
      }
      
      try {
        const response = await apiClient.getEligibleActions(account.id);
        // Use the summary for total available actions (not completed)
        actionsMap[account.id] = response.summary?.available || 0;
      } catch (error) {
        console.error(`Failed to fetch actions for account ${account.id}:`, error);
        actionsMap[account.id] = 0;
      }
    }
    
    setAccountActions(actionsMap);
  };

  // Listen for messages from background script
  useEffect(() => {
    const messageListener = async (message: any) => {
      if (message.type === 'actionCompleted') {
        const { actionId, success, error, details } = message.payload;
        console.log('[Sidepanel] Action completed:', { actionId, success, details });
        
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
        const actionRunId = actionRunIds[actionId];
        if (actionRunId) {
          try {
            if (success) {
              // Step 3: Update to dom_verified when DOM tracking confirms action
              console.log('Updating action run to DOM_VERIFIED:', actionRunId);
              const updateResult = await apiClient.updateActionRun(actionRunId, {
                status: ActionRunStatus.DOM_VERIFIED,
                proof: {
                  actionType: details?.actionType || 'unknown',
                  platform: details?.platform || 'unknown',
                  timestamp: Date.now(),
                  domState: details?.domState || {},
                  userAgent: navigator.userAgent
                },
                verificationData: details
              });
              console.log('Action run updated to DOM_VERIFIED:', updateResult);
              
              // TODO: Step 4: Backend will verify via CDP and update to cdp_verified/completed
              // TODO: Step 5: Payment processing will update to paid
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
            console.error('Failed to update action run:', updateError);
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
      } else if (message.type === 'igDataCollected') {
        const metadata = message.payload;
        const accountId = message.accountId;
        console.log('Instagram data collected:', metadata, 'for account:', accountId);
        
        // Find the account by ID
        const account = socialAccounts.find(acc => acc.id === accountId);
        console.log('Found account:', account, 'User:', user);
        
        if (account && user) {
          try {
            console.log('Updating Instagram data for account:', account.id, 'handle:', account.handle);
            // Save Instagram data to API with handle validation
            const result = await apiClient.updateInstagramData(account.id, metadata, account.handle);
            console.log('Instagram data update result:', result);
            
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
          } catch (error) {
            console.error('Failed to save Instagram data:', error);
            // Remove from verifying state and remove account
            setVerifyingAccounts(prev => {
              const newSet = new Set(prev);
              newSet.delete(accountId);
              return newSet;
            });
            setSocialAccounts(prev => prev.filter(acc => acc.id !== account.id));
          }
        } else {
          console.log('Cannot save: account or user missing', { account, user });
        }
      } else if (message.type === 'tiktokDataCollected') {
        const { payload, accountId, handle } = message;
        console.log('TikTok data collected:', payload, 'for account:', accountId);
        
        // Find the account by ID
        const account = socialAccounts.find(acc => acc.id === accountId);
        console.log('Found TikTok account:', account, 'User:', user);
        
        if (account && user) {
          try {
            console.log('Updating TikTok data for account:', account.id, 'handle:', account.handle);
            
            // Save TikTok data to API with handle validation
            const result = await apiClient.updateTikTokData(account.id, payload, account.handle);
            console.log('TikTok data update result:', result);
            
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
            
            console.log('✅ TikTok account successfully added and verified!');
            
          } catch (error) {
            console.error('Failed to save TikTok data:', error);
            // Remove from verifying state and remove account
            setVerifyingAccounts(prev => {
              const newSet = new Set(prev);
              newSet.delete(accountId);
              return newSet;
            });
            setSocialAccounts(prev => prev.filter(acc => acc.id !== account.id));
          }
        } else {
          console.log('Cannot save TikTok data: account or user missing', { account, user });
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

    browser.runtime.onMessage.addListener(messageListener);
    
    return () => {
      browser.runtime.onMessage.removeListener(messageListener);
    };
  }, [socialAccounts, user, actionStatuses]);

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

  // Transform eligible actions to ActionListPage format
  const transformActionsForUI = (actions: EligibleAction[]) => {
    return actions.map(action => ({
      id: action.id,
      type: action.actionType as any, // Map ActionType enum to UI action types
      status: (actionStatuses[action.id] || 'pending') as ActionStatus,
      url: action.target,
      payment: action.price / 100, // Convert cents to dollars
      platform: (action.platform || selectedAccount?.platform || 'instagram').toLowerCase() as any,
      errorMessage: actionErrors[action.id], // Include error message if exists
      actionRunId: action.userActionRun?.id,
      isResumable: ['pending_verification', 'dom_verified', 'cdp_verified'].includes(action.userActionRun?.status || '')
    }));
  };

  // Fetch and transform action runs for withdraw page
  const fetchActionHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const actionRuns = await apiClient.getUserActionRuns(user.id);
      
      // Transform action runs to ActionHistory format
      const history: ActionHistory[] = actionRuns.map(run => {
        // Calculate days/hours remaining for pending actions
        const now = new Date();
        const completedAt = run.completedAt ? new Date(run.completedAt) : new Date(run.createdAt);
        const verificationEndDate = new Date(completedAt.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
        const timeRemaining = verificationEndDate.getTime() - now.getTime();
        const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
        const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));
        
        // Map database status to UI status
        let uiStatus: 'pending' | 'verified' | 'failed';
        if (run.status === ActionRunStatus.FAILED) {
          uiStatus = 'failed';
        } else if (
          run.status === ActionRunStatus.DOM_VERIFIED || 
          run.status === ActionRunStatus.CDP_VERIFIED || 
          run.status === ActionRunStatus.COMPLETED ||
          run.status === ActionRunStatus.PAID
        ) {
          // If more than 7 days have passed, it's verified
          if (timeRemaining <= 0) {
            uiStatus = 'verified';
          } else {
            uiStatus = 'pending';
          }
        } else {
          uiStatus = 'pending';
        }
        
        return {
          id: run.id,
          type: (run.action?.actionType?.toLowerCase() || 'like') as any,
          status: uiStatus,
          url: run.action?.target || '',
          payment: (run.rewardAmount || 0) / 100, // Convert cents to dollars
          platform: (run.action?.platform?.toLowerCase() || 'instagram') as any,
          completedAt: completedAt,
          daysRemaining: uiStatus === 'pending' && daysRemaining > 0 ? daysRemaining : undefined,
          hoursRemaining: uiStatus === 'pending' && hoursRemaining < 24 && hoursRemaining > 0 ? hoursRemaining : undefined,
        };
      });
      
      setActionHistory(history);
    } catch (error) {
      console.error('Failed to fetch action history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Calculate pending and available earnings from action runs
  const [pendingEarnings, setPendingEarnings] = useState(0);
  const [availableEarnings, setAvailableEarnings] = useState(0);

  useEffect(() => {
    const calculateEarnings = async () => {
      if (!user) return;
      
      try {
        const actionRuns = await apiClient.getUserActionRuns(user.id);
        
        let pending = 0;
        let available = 0;
        const now = new Date();
        
        actionRuns.forEach(run => {
          // Skip failed runs
          if (run.status === ActionRunStatus.FAILED) return;
          
          // Skip already paid runs
          if (run.status === ActionRunStatus.PAID) return;
          
          const amount = (run.rewardAmount || 0) / 100; // Convert cents to dollars
          const completedAt = run.completedAt ? new Date(run.completedAt) : new Date(run.createdAt);
          const daysSinceCompletion = (now.getTime() - completedAt.getTime()) / (24 * 60 * 60 * 1000);
          
          // Check if action is verified (any of these statuses means action was completed successfully)
          const isVerified = (
            run.status === ActionRunStatus.DOM_VERIFIED || 
            run.status === ActionRunStatus.CDP_VERIFIED || 
            run.status === ActionRunStatus.COMPLETED
          );
          
          if (isVerified) {
            // If more than 7 days have passed, it's available for cashout
            if (daysSinceCompletion >= 7) {
              available += amount;
            } else {
              // Still in 7-day verification period
              pending += amount;
            }
          }
          // PENDING_VERIFICATION actions are not counted as they haven't been completed yet
        });
        
        setPendingEarnings(pending);
        setAvailableEarnings(available);
      } catch (error) {
        console.error('Failed to calculate earnings:', error);
      }
    };
    
    if (user) {
      calculateEarnings();
    }
  }, [user]);

  // Render withdraw page
  if (currentView === 'withdraw') {
    return (
      <WithdrawPage
        availableEarnings={availableEarnings}
        actionHistory={actionHistory}
        onBack={() => {
          setCurrentView('home');
          setActionHistory([]);
        }}
        onCashOut={async () => {
          console.log('Processing withdrawal...');
          
          // Calculate total verified amount
          const totalVerified = actionHistory
            .filter(a => a.status === 'verified')
            .reduce((sum, a) => sum + a.payment, 0);
          
          if (totalVerified >= 5 && user) {
            try {
              // Process the withdrawal through the API
              const result = await apiClient.processWithdrawal(user.id, totalVerified);
              
              console.log('Withdrawal result:', result);
              
              if (result.success) {
                alert(`Withdrawal of $${result.amount.toFixed(2)} successfully initiated!`);
                
                // Navigate back to home
                setCurrentView('home');
                setActionHistory([]);
                
                // Refresh user data to update balance
                const updatedUser = await apiClient.getUserByWallet(walletAddress!);
                if (updatedUser) {
                  setUser(updatedUser);
                  
                  // Refresh social accounts and eligible actions
                  if (updatedUser.socialAccounts) {
                    setSocialAccounts(updatedUser.socialAccounts);
                    await fetchActionsForAccounts(updatedUser.socialAccounts);
                  }
                }
              } else {
                alert('Withdrawal failed. Please try again.');
              }
            } catch (error: any) {
              console.error('Withdrawal failed:', error);
              alert(error.message || 'Withdrawal failed. Please try again.');
            }
          } else if (totalVerified < 5) {
            alert('Minimum withdrawal amount is $5.00');
          }
        }}
      />
    );
  }

  if (currentView === 'actions' && selectedAccount) {
    return (
      <ActionListPage
        accountHandle={selectedAccount.handle}
        platform={selectedAccount.platform.toLowerCase() as any}
        actions={transformActionsForUI(eligibleActions)}
        availableActionsCount={eligibleActions.length}
        isLoading={loadingActions}
        onBack={() => {
          setCurrentView('home');
          setSelectedAccount(null);
          setEligibleActions([]);
          setActionStatuses({});
          setActionErrors({});
        }}
        onActionClick={async (actionId: string) => {
          console.log('Action clicked:', actionId);
          
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
            await browser.runtime.sendMessage({
              type: 'executeAction',
              payload: {
                actionId: selectedAction.id,
                actionRunId: selectedAction.userActionRun.id,
                url: selectedAction.target,
                actionType: selectedAction.actionType.toLowerCase(),
                platform: (selectedAction.platform || selectedAccount.platform).toLowerCase(),
                accountHandle: selectedAccount.handle,
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
          
          // Update status to loading
          setActionStatuses(prev => ({
            ...prev,
            [actionId]: 'loading'
          }));
          
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
            setActionRunIds(prev => ({
              ...prev,
              [selectedAction.id]: actionRun.id
            }));
            
            // Send message to background script to open tab and start tracking
            await browser.runtime.sendMessage({
              type: 'executeAction',
              payload: {
                actionId: selectedAction.id,
                actionRunId: actionRun.id,
                url: selectedAction.target,
                actionType: selectedAction.actionType.toLowerCase(),
                platform: (selectedAction.platform || selectedAccount.platform).toLowerCase(),
                accountHandle: selectedAccount.handle
              }
            });
          } catch (error) {
            console.error('Failed to start action:', error);
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

  return (
    <Home
      // Earnings data
      pendingEarnings={pendingEarnings}
      availableEarnings={availableEarnings}
      dailyActionsCompleted={0} // TODO: Calculate from today's action runs
      dailyActionsRequired={10} // TODO: Get from campaign requirements

      // Wallet
      walletAddress={walletAddress}

      // Connected accounts with eligible actions count and verification state
      connectedAccounts={socialAccounts.map(account => ({
        platform: account.platform,
        handle: account.handle,
        availableActions: accountActions[account.id] || 0,
        isVerifying: verifyingAccounts.has(account.id)
      }))}

      // Handlers
      onAddAccount={async (platform: string, handle: string) => {
        if (!user) {
          console.error('No user connected');
          return;
        }

        try {
          // Create social account in API
          const newAccount = await apiClient.createSocialAccount({
            userId: user.id,
            platform: platform.toLowerCase() as any,
            handle: handle,
          });

          // Add to accounts list and mark as verifying
          setSocialAccounts(prev => [...prev, newAccount]);
          setVerifyingAccounts(prev => new Set(prev).add(newAccount.id));

          // Send message to background script to collect data based on platform
          const messageType = platform.toLowerCase() === 'tiktok' ? 'addTikTokAccount' : 'addIgAccount';
          browser.runtime.sendMessage({
            type: messageType,
            handle: handle,
            accountId: newAccount.id,
          }).catch(async (error) => {
            console.error('Failed to send add account message:', error);
            // Remove account from API and UI on error
            await apiClient.deleteSocialAccount(newAccount.id);
            setSocialAccounts(prev => prev.filter(acc => acc.id !== newAccount.id));
          });
        } catch (error) {
          console.error('Failed to create social account:', error);
        }
      }}

      onAccountClick={async (account: any) => {
        console.log('Account clicked:', account);
        
        // Find the full social account data
        const fullAccount = socialAccounts.find(
          acc => acc.handle === account.handle && acc.platform === account.platform
        );
        
        if (!fullAccount) {
          console.error('Account not found');
          return;
        }
        
        // Navigate immediately for better UX
        setSelectedAccount(fullAccount);
        setCurrentView('actions');
        setLoadingActions(true);
        
        // Clear previous actions while loading new ones
        setEligibleActions([]);
        setActionStatuses({});
        
        // Fetch actions in background
        try {
          const response = await apiClient.getEligibleActions(fullAccount.id);
          
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
      }}

      onWalletClick={async () => {
        if (walletAddress) {
          // Disconnect
          await portoWallet.disconnect();
          setWalletAddress(null);
          setUser(null);
          setSocialAccounts([]);
        } else {
          // Connect
          setIsConnecting(true);
          try {
            const address = await portoWallet.connect();
            if (address) {
              setWalletAddress(address);
              
              // Get or create user in API
              const userData = await apiClient.getOrCreateUserByWallet(address);
              setUser(userData);
              setSocialAccounts(userData.socialAccounts || []);
              
              // Fetch eligible actions for each account
              if (userData.socialAccounts) {
                await fetchActionsForAccounts(userData.socialAccounts);
              }
            }
          } catch (error) {
            console.error('Failed to connect wallet:', error);
          } finally {
            setIsConnecting(false);
          }
        }
      }}

      onJackpotClick={() => {
        console.log('Mock jackpot clicked');
      }}

      onCashOut={async () => {
        // Navigate to withdraw page and fetch action history
        setCurrentView('withdraw');
        await fetchActionHistory();
      }}
    />
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
