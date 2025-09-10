import { setup, assign, sendTo, fromPromise, ActorRefFrom, enqueueActions, assertEvent } from 'xstate';
import { accountMachine } from './accountMachine';

// Types
export interface UserProfile {
  walletAddress: string;
  pendingEarnings: number;
  availableEarnings: number;
  dailyActionsCompleted: number;
  dailyActionsRequired: number;
}

interface VerificationRequest {
  id: string;
  platform: string;
  handle: string;
  retryCount: number;
}

interface UserContext {
  profile: UserProfile | null;
  accounts: ActorRefFrom<typeof accountMachine>[];
  // Account addition flow
  selectedPlatform: string | null;
  handleInput: string;
  validationError: string | null;
  // Verification queue for serializing requests
  verificationQueue: VerificationRequest[];
  currentVerification: VerificationRequest | null;
  // System
  error: string | null;
}

type UserEvent =
  | { type: 'START_ADD_ACCOUNT'; platform: string }
  | { type: 'UPDATE_HANDLE'; handle: string }
  | { type: 'SUBMIT_HANDLE' }
  | { type: 'CANCEL_ADD_ACCOUNT' }
  | { type: 'REMOVE_ACCOUNT'; accountId: string }
  | { type: 'CASH_OUT' }
  | { type: 'CLICK_WALLET' }
  | { type: 'RETRY_LOAD' }
  // Verification queue events
  | { type: 'QUEUE_VERIFICATION'; platform: string; handle: string }
  | { type: 'PROCESS_NEXT_VERIFICATION' }
  | { type: 'VERIFICATION_COMPLETED'; accountId: string }
  | { type: 'VERIFICATION_FAILED'; accountId: string; error: string; canRetry: boolean }
  | { type: 'RETRY_VERIFICATION'; accountId: string }
  // Events from child actors
  | { type: 'ACCOUNT_VERIFIED'; accountId: string }
  | { type: 'ACCOUNT_FAILED'; accountId: string; error: string }
  | { type: 'ACCOUNT_ACTION_CONSUMED'; accountId: string }
  | { type: 'ACCOUNT_CLICKED'; accountId: string; platform: string; handle: string };

// Services
const loadUserDataService = fromPromise(async () => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    profile: {
      walletAddress: '0x1234...5678',
      pendingEarnings: 25.75,
      availableEarnings: 89.50,
      dailyActionsCompleted: 2,
      dailyActionsRequired: 5,
    },
    // Start with no accounts - they'll be added through the flow
    accounts: []
  };
});

const validateAccountService = fromPromise(async ({ input }: { 
  input: { platform: string; handle: string; existingAccounts: string[] } 
}) => {
  // Simulate validation delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const { platform, handle, existingAccounts } = input;
  const accountId = `${platform}-${handle}`;
  
  // Check for duplicates
  if (existingAccounts.includes(accountId)) {
    throw new Error(`Account @${handle} already added for ${platform}`);
  }
  
  // Platform-specific validation - relaxed for Instagram to allow dots
  if (platform === 'x' && handle.length > 15) {
    throw new Error('X handles must be 15 characters or less');
  }
  
  // Allow dots for Instagram usernames, underscores for all platforms
  const validPattern = platform === 'instagram' 
    ? /^[a-zA-Z0-9_.]+$/
    : /^[a-zA-Z0-9_]+$/;
    
  if (!validPattern.test(handle)) {
    const allowedChars = platform === 'instagram' 
      ? 'letters, numbers, dots, and underscores'
      : 'letters, numbers, and underscores';
    throw new Error(`Handle can only contain ${allowedChars}`);
  }
  
  if (handle.length < 3) {
    throw new Error('Handle must be at least 3 characters');
  }
  
  if (handle.length > 30) {
    throw new Error('Handle must be 30 characters or less');
  }
  
  return { valid: true };
});

const cashOutService = fromPromise(async ({ input }: { input: { amount: number } }) => {
  // Simulate withdrawal API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  return { success: true, transactionId: `tx_${Date.now()}` };
});

// Machine definition
export const userMachine = setup({
  types: {
    context: {} as UserContext,
    events: {} as UserEvent,
  },
  actors: {
    loadUserData: loadUserDataService,
    validateAccount: validateAccountService,
    cashOut: cashOutService,
    account: accountMachine,
  },
  guards: {
    hasValidHandleInput: ({ context }) => {
      const handle = context.handleInput?.trim();
      return handle !== '' && handle.length >= 3;
    },
    
    canAddMoreAccounts: ({ context }) => {
      return context.accounts.length < 10; // Business limit
    },
    
    hasAvailableEarnings: ({ context }) => {
      return (context.profile?.availableEarnings ?? 0) > 0;
    },
    
    hasQueuedVerifications: ({ context }) => {
      return context.verificationQueue.length > 0;
    },
    
    isVerificationQueueEmpty: ({ context }) => {
      return context.verificationQueue.length === 0;
    },
    
    noActiveVerification: ({ context }) => {
      return context.currentVerification === null;
    },
  },
  actions: {
    setUserData: assign({
      profile: ({ event }) => {
        // Don't use assertEvent here as the event type includes the actor ID
        if (event.type.includes('xstate.done.actor')) {
          return (event as any).output.profile;
        }
        return null;
      },
      error: null,
    }),
    
    setLoadError: assign({
      error: ({ event }) => {
        // Don't use assertEvent here as the event type includes the actor ID
        if (event.type.includes('xstate.error.actor')) {
          return (event as any).error?.message || 'Failed to load user data';
        }
        return 'Failed to load user data';
      },
    }),
    
    setPlatform: assign({
      selectedPlatform: ({ event }) => {
        assertEvent(event, 'START_ADD_ACCOUNT');
        return event.platform;
      },
      handleInput: '',
      validationError: null,
    }),
    
    updateHandleInput: assign({
      handleInput: ({ event }) => {
        assertEvent(event, 'UPDATE_HANDLE');
        // Strip @ symbol and trim
        return event.handle.replace('@', '').trim();
      },
      validationError: null,
    }),
    
    setValidationError: assign({
      validationError: ({ event }) => {
        // Don't use assertEvent here as the event type includes the actor ID
        if (event.type.includes('xstate.error.actor')) {
          return (event as any).error?.message || 'Invalid handle';
        }
        return 'Invalid handle';
      },
    }),
    
    queueVerificationRequest: assign({
      verificationQueue: ({ context }) => {
        const accountId = `${context.selectedPlatform}-${context.handleInput}`;
        const request: VerificationRequest = {
          id: accountId,
          platform: context.selectedPlatform!,
          handle: context.handleInput,
          retryCount: 0,
        };
        return [...context.verificationQueue, request];
      },
    }),
    
    processNextVerification: assign({
      currentVerification: ({ context }) => {
        return context.verificationQueue[0] || null;
      },
      verificationQueue: ({ context }) => {
        return context.verificationQueue.slice(1);
      },
    }),
    
    spawnAccountActor: enqueueActions(({ context, enqueue }) => {
      if (!context.currentVerification) return;
      
      const { id, platform, handle } = context.currentVerification;
      
      enqueue.assign({
        accounts: ({ context, spawn }) => {
          const newAccount = spawn('account', {
            id,
            input: { id, platform, handle },
            syncSnapshot: true,
          });
          return [...context.accounts, newAccount];
        },
      });
    }),
    
    clearCurrentVerification: assign({
      currentVerification: null,
    }),
    
    requeueFailedVerification: assign({
      verificationQueue: ({ context, event }) => {
        if (context.currentVerification && 'canRetry' in event && event.canRetry) {
          const retryRequest = {
            ...context.currentVerification,
            retryCount: context.currentVerification.retryCount + 1,
          };
          return [...context.verificationQueue, retryRequest];
        }
        return context.verificationQueue;
      },
      currentVerification: null,
    }),
    
    clearAddAccountState: assign({
      selectedPlatform: null,
      handleInput: '',
      validationError: null,
    }),
    
    removeAccountActor: assign({
      accounts: ({ context, event }) => {
        assertEvent(event, 'REMOVE_ACCOUNT');
        // Stop the actor before removing
        const actor = context.accounts.find(acc => acc.id === event.accountId);
        if (actor) {
          actor.stop();
        }
        return context.accounts.filter(acc => acc.id !== event.accountId);
      },
    }),
    
    zeroCashOut: assign({
      profile: ({ context }) => {
        if (!context.profile) return null;
        return {
          ...context.profile,
          availableEarnings: 0,
        };
      },
    }),
  },
}).createMachine({
  id: 'user',
  initial: 'initializing',
  context: {
    profile: null,
    accounts: [],
    selectedPlatform: null,
    handleInput: '',
    validationError: null,
    verificationQueue: [],
    currentVerification: null,
    error: null,
  },
  
  states: {
    initializing: {
      invoke: {
        src: 'loadUserData',
        onDone: {
          target: 'ready',
          actions: 'setUserData',
        },
        onError: {
          target: 'error',
          actions: 'setLoadError',
        },
      },
    },
    
    error: {
      on: {
        RETRY_LOAD: 'initializing',
      },
    },
    
    ready: {
      type: 'parallel',
      
      states: {
        // Account management region
        accountManagement: {
          initial: 'idle',
          
          states: {
            idle: {
              on: {
                START_ADD_ACCOUNT: {
                  target: 'addingAccount',
                  guard: 'canAddMoreAccounts',
                  actions: 'setPlatform',
                },
                REMOVE_ACCOUNT: {
                  actions: 'removeAccountActor',
                },
                RETRY_VERIFICATION: {
                  target: 'processingQueue',
                },
              },
            },
            
            addingAccount: {
              initial: 'enteringHandle',
              
              states: {
                enteringHandle: {
                  on: {
                    UPDATE_HANDLE: {
                      actions: 'updateHandleInput',
                    },
                    SUBMIT_HANDLE: {
                      target: 'validating',
                      guard: 'hasValidHandleInput',
                    },
                    CANCEL_ADD_ACCOUNT: {
                      target: '#user.ready.accountManagement.idle',
                      actions: 'clearAddAccountState',
                    },
                  },
                },
                
                validating: {
                  invoke: {
                    src: 'validateAccount',
                    input: ({ context }) => ({
                      platform: context.selectedPlatform!,
                      handle: context.handleInput,
                      existingAccounts: context.accounts.map(acc => acc.id),
                    }),
                    onDone: {
                      target: 'queuing',
                    },
                    onError: {
                      target: 'enteringHandle',
                      actions: 'setValidationError',
                    },
                  },
                },
                
                queuing: {
                  entry: ['queueVerificationRequest', 'clearAddAccountState'],
                  always: {
                    target: '#user.ready.accountManagement.processingQueue',
                  },
                },
              },
            },
            
            processingQueue: {
              always: [
                {
                  target: 'idle',
                  guard: 'isVerificationQueueEmpty',
                },
                {
                  target: 'verifying',
                  guard: { type: 'hasQueuedVerifications', params: {} },
                  actions: 'processNextVerification',
                },
              ],
            },
            
            verifying: {
              entry: 'spawnAccountActor',
              on: {
                VERIFICATION_COMPLETED: {
                  target: 'processingQueue',
                  actions: 'clearCurrentVerification',
                },
                VERIFICATION_FAILED: [
                  {
                    target: 'processingQueue',
                    guard: ({ event }) => !('canRetry' in event) || !event.canRetry,
                    actions: 'clearCurrentVerification',
                  },
                  {
                    target: 'processingQueue',
                    actions: 'requeueFailedVerification',
                  },
                ],
              },
            },
          },
        },
        
        // Wallet management region
        walletManagement: {
          initial: 'idle',
          
          states: {
            idle: {
              on: {
                CASH_OUT: {
                  target: 'withdrawing',
                  guard: 'hasAvailableEarnings',
                },
                CLICK_WALLET: {
                  // Could open wallet modal, for now just log
                  actions: () => console.log('Wallet clicked'),
                },
              },
            },
            
            withdrawing: {
              invoke: {
                src: 'cashOut',
                input: ({ context }) => ({
                  amount: context.profile?.availableEarnings ?? 0,
                }),
                onDone: {
                  target: 'idle',
                  actions: 'zeroCashOut',
                },
                onError: {
                  target: 'idle',
                  actions: ({ event }) => {
                    console.error('Cash out failed:', event.error);
                  },
                },
              },
            },
          },
        },
      },
      
      // Global events that can happen in any parallel state
      on: {
        ACCOUNT_VERIFIED: {
          actions: ({ event }) => {
            console.log(`Account ${event.accountId} verified`);
          },
        },
        ACCOUNT_FAILED: {
          actions: ({ event }) => {
            console.log(`Account ${event.accountId} failed:`, event.error);
          },
        },
        ACCOUNT_ACTION_CONSUMED: {
          actions: ({ event }) => {
            console.log(`Action consumed on account ${event.accountId}`);
          },
        },
        ACCOUNT_CLICKED: {
          actions: ({ event }) => {
            console.log(`Account clicked: ${event.accountId}`);
            // Could navigate to account details
          },
        },
      },
    },
  },
});