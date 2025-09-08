# Privy Authentication State Layer for WXT Extension

## State Machine Architecture

### Core States
```typescript
enum AuthState {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating', 
  AUTHENTICATED = 'authenticated',
  CREATING_WALLET = 'creatingWallet',
  ERROR = 'error'
}
```

### Events
```typescript
type AuthEvent = 
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'CREATE_WALLET' }
  | { type: 'WALLET_CREATED'; wallet: Wallet }
  | { type: 'RETRY' }
```

### State Machine Definition
```typescript
const privyAuthMachine = createMachine({
  id: 'privyAuth',
  initial: 'idle',
  context: {
    user: null,
    wallets: [],
    error: null
  },
  states: {
    idle: {
      on: {
        LOGIN: 'authenticating'
      }
    },
    authenticating: {
      entry: 'clearError',
      on: {
        AUTH_SUCCESS: {
          target: 'authenticated',
          actions: 'setUser'
        },
        AUTH_ERROR: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    authenticated: {
      on: {
        LOGOUT: {
          target: 'idle',
          actions: 'clearUser'
        },
        CREATE_WALLET: 'creatingWallet'
      }
    },
    creatingWallet: {
      on: {
        WALLET_CREATED: {
          target: 'authenticated',
          actions: 'addWallet'
        },
        AUTH_ERROR: {
          target: 'error',
          actions: 'setError'
        }
      }
    },
    error: {
      on: {
        RETRY: 'idle',
        LOGIN: 'authenticating'
      }
    }
  }
});
```

## Implementation

### 1. State Machine Hook
```typescript
// hooks/usePrivyAuthMachine.ts
import { useMachine } from '@xstate/react';

export function usePrivyAuthMachine() {
  const [state, send] = useMachine(privyAuthMachine, {
    actions: {
      setUser: assign({
        user: (_, event) => event.user,
        error: null
      }),
      clearUser: assign({
        user: null,
        wallets: []
      }),
      addWallet: assign({
        wallets: ({ context }, event) => [...context.wallets, event.wallet]
      }),
      setError: assign({
        error: (_, event) => event.error
      }),
      clearError: assign({
        error: null
      })
    }
  });

  return { state, send };
}
```

### 2. Privy Integration Layer
```typescript
// services/privyService.ts
export class PrivyService {
  static async login(): Promise<User> {
    // Privy login implementation
  }

  static async logout(): Promise<void> {
    // Privy logout implementation  
  }

  static async createWallet(): Promise<Wallet> {
    // Privy wallet creation
  }

}
```

### 3. Component Integration
```typescript
// components/AuthComponent.tsx
export function AuthComponent() {
  const { state, send } = usePrivyAuthMachine();
  
  const handleLogin = async () => {
    send({ type: 'LOGIN' });
    try {
      const user = await PrivyService.login();
      send({ type: 'AUTH_SUCCESS', user });
    } catch (error) {
      send({ type: 'AUTH_ERROR', error: error.message });
    }
  };

  return (
    <div>
      {state.matches('idle') && (
        <button onClick={handleLogin}>Login</button>
      )}
      
      {state.matches('authenticating') && (
        <div>Authenticating...</div>
      )}
      
      {state.matches('authenticated') && (
        <AuthenticatedView 
          user={state.context.user}
          onCreateWallet={() => send({ type: 'CREATE_WALLET' })}
        />
      )}
      
      {state.matches('error') && (
        <ErrorView 
          error={state.context.error}
          onRetry={() => send({ type: 'RETRY' })}
        />
      )}
    </div>
  );
}
```

## State Persistence

### Chrome Storage Integration
```typescript
// services/stateStorage.ts
export class StateStorage {
  static async saveState(state: AuthContext): Promise<void> {
    await chrome.storage.local.set({ authState: state });
  }

  static async loadState(): Promise<AuthContext | null> {
    const result = await chrome.storage.local.get('authState');
    return result.authState || null;
  }

  static async clearState(): Promise<void> {
    await chrome.storage.local.remove('authState');
  }
}
```

## Dependencies
```bash
bun add xstate @xstate/react
```

## Key Benefits
- **Predictable State**: All auth states explicitly defined
- **Error Handling**: Built-in error states and transitions  
- **Persistence**: Chrome storage integration for state recovery
- **Testing**: Easy to test state transitions in isolation
- **Visualization**: XState visualizer for debugging state flow