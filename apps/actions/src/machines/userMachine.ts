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

interface UserContext {
  profile: UserProfile | null;
  accounts: ActorRefFrom<typeof accountMachine>[];
  // Account addition flow
  selectedPlatform: string | null;
  handleInput: string;
  validationError: string | null;
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
  
  // Platform-specific validation
  if (platform === 'x' && handle.length > 15) {
    throw new Error('X handles must be 15 characters or less');
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
    throw new Error('Handle can only contain letters, numbers, and underscores');
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
    
    spawnAccountActor: enqueueActions(({ context, enqueue }) => {
      const accountId = `${context.selectedPlatform}-${context.handleInput}`;
      
      enqueue.assign({
        accounts: ({ context, spawn }) => {
          const newAccount = spawn('account', {
            id: accountId,
            input: {
              id: accountId,
              platform: context.selectedPlatform!,
              handle: context.handleInput,
            },
            syncSnapshot: true,
          });
          
          return [...context.accounts, newAccount];
        },
      });
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
                      target: 'spawning',
                    },
                    onError: {
                      target: 'enteringHandle',
                      actions: 'setValidationError',
                    },
                  },
                },
                
                spawning: {
                  entry: 'spawnAccountActor',
                  always: {
                    target: '#user.ready.accountManagement.idle',
                    actions: 'clearAddAccountState',
                  },
                },
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