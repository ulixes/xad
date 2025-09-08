# Usage Examples

## Basic React Component Integration

### Simple Authentication Component

```typescript
import React from 'react';
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';

function AuthButton() {
  const { state, login, logout } = usePrivyAuthMachine();

  const isAuthenticated = state.matches('authenticated');
  const isLoading = state.matches('authenticating');
  const user = state.context.user;

  if (isLoading) {
    return <button disabled>Authenticating...</button>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.email || user?.wallet?.address}!</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  return <button onClick={login}>Login with Privy</button>;
}
```

### Full Featured Auth Component

```typescript
import React from 'react';
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';

function AuthDashboard() {
  const {
    state,
    login,
    logout,
    createWallet,
    signMessage,
    retry
  } = usePrivyAuthMachine();

  const isAuthenticated = state.matches('authenticated');
  const isLoading = state.matches('authenticating') || 
                   state.matches('creatingWallet') || 
                   state.matches('signingMessage');
  const hasError = state.matches('error');
  
  const { user, wallets, error, signedMessage } = state.context;

  const handleSignMessage = async () => {
    await signMessage('Hello from my extension!');
  };

  if (hasError) {
    return (
      <div className="error-state">
        <h3>Something went wrong</h3>
        <p>{error}</p>
        <button onClick={retry}>Try Again</button>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="login-state">
        <h2>Connect Your Wallet</h2>
        <button onClick={login} disabled={isLoading}>
          {isLoading ? 'Connecting...' : 'Login with Privy'}
        </button>
      </div>
    );
  }

  return (
    <div className="authenticated-state">
      <header>
        <h2>Wallet Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="user-info">
        <h3>Account</h3>
        <p>ID: {user?.id}</p>
        {user?.email && <p>Email: {user.email}</p>}
        {user?.wallet && <p>Address: {user.wallet.address}</p>}
      </section>

      <section className="wallets">
        <h3>Wallets ({wallets.length})</h3>
        {wallets.length === 0 ? (
          <div>
            <p>No wallets yet</p>
            <button onClick={createWallet} disabled={isLoading}>
              {state.matches('creatingWallet') ? 'Creating...' : 'Create Wallet'}
            </button>
          </div>
        ) : (
          <ul>
            {wallets.map(wallet => (
              <li key={wallet.id}>
                <strong>{wallet.type}</strong>: {wallet.address}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="message-signing">
        <h3>Message Signing</h3>
        <button onClick={handleSignMessage} disabled={isLoading}>
          {state.matches('signingMessage') ? 'Signing...' : 'Sign Test Message'}
        </button>
        {signedMessage && (
          <div>
            <p><strong>Last Signature:</strong></p>
            <code>{signedMessage}</code>
          </div>
        )}
      </section>
    </div>
  );
}
```

## WXT Extension Integration

### Sidepanel Entry Point

**`entrypoints/sidepanel.tsx`**
```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthDashboard } from '../src/components/AuthDashboard';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<AuthDashboard />);
```

**`entrypoints/sidepanel.html`**
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wallet Extension</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./sidepanel.tsx"></script>
  </body>
</html>
```

### Background Script Integration

**`entrypoints/background.ts`**
```typescript
import { StateStorage } from '../src/services/stateStorage';

export default defineBackground(() => {
  // Listen for extension installation
  chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed');
    
    // Clear any existing state on fresh install
    if (chrome.runtime.OnInstalledReason?.INSTALL) {
      await StateStorage.clearState();
    }
  });

  // Handle extension updates
  chrome.runtime.onStartup.addListener(async () => {
    // Validate stored state on startup
    try {
      const state = await StateStorage.loadState();
      if (state) {
        console.log('Previous session state found');
      }
    } catch (error) {
      console.error('Failed to load state:', error);
      await StateStorage.clearState();
    }
  });
});
```

## Advanced State Machine Usage

### Direct State Machine Usage (Without React)

```typescript
import { createActor } from 'xstate';
import { privyAuthMachine } from '../state/machines/privyAuthMachine';
import { PrivyService } from '../services/privyService';

// Create and start the actor
const authActor = createActor(privyAuthMachine);
authActor.start();

// Subscribe to state changes
const subscription = authActor.subscribe((state) => {
  console.log('State changed:', state.value);
  console.log('Context:', state.context);
});

// Perform authentication flow
async function authenticateUser() {
  // Start login process
  authActor.send({ type: 'LOGIN' });
  
  try {
    const user = await PrivyService.login();
    authActor.send({ type: 'AUTH_SUCCESS', user });
  } catch (error) {
    authActor.send({ 
      type: 'AUTH_ERROR', 
      error: error instanceof Error ? error.message : 'Authentication failed' 
    });
  }
}

// Cleanup
function cleanup() {
  subscription.unsubscribe();
  authActor.stop();
}
```

### State Machine Inspector (Development)

```typescript
import { createActor } from 'xstate';
import { privyAuthMachine } from '../state/machines/privyAuthMachine';

const actor = createActor(privyAuthMachine, {
  inspect: {
    // Log all events and state changes
    next: (event) => {
      console.log('Event:', event);
    },
    // XState DevTools integration (browser only)
    ...(typeof window !== 'undefined' && {
      iframe: () => {
        const iframe = document.createElement('iframe');
        iframe.src = 'https://stately.ai/registry/editor/embed?machineId=...';
        document.body.appendChild(iframe);
        return iframe;
      }
    })
  }
});

actor.start();
```

## Service Layer Usage

### Direct Service Usage

```typescript
import { PrivyService } from '../services/privyService';
import { StateStorage } from '../services/stateStorage';

// Authentication
async function handleAuth() {
  try {
    const user = await PrivyService.login();
    console.log('User authenticated:', user);
    
    // Save to storage
    await StateStorage.saveState({
      user,
      wallets: [],
      error: null,
      signedMessage: null
    });
  } catch (error) {
    console.error('Authentication failed:', error);
  }
}

// Wallet creation
async function handleWalletCreation() {
  try {
    const wallet = await PrivyService.createWallet();
    console.log('Wallet created:', wallet);
    
    // Update stored state
    const currentState = await StateStorage.loadState();
    if (currentState) {
      await StateStorage.saveState({
        ...currentState,
        wallets: [...currentState.wallets, wallet]
      });
    }
  } catch (error) {
    console.error('Wallet creation failed:', error);
  }
}

// Message signing
async function handleMessageSigning(message: string) {
  try {
    const signature = await PrivyService.signMessage(message);
    console.log('Message signed:', signature);
    
    // Update stored state
    const currentState = await StateStorage.loadState();
    if (currentState) {
      await StateStorage.saveState({
        ...currentState,
        signedMessage: signature
      });
    }
  } catch (error) {
    console.error('Message signing failed:', error);
  }
}
```

## Custom Hook Patterns

### Simplified Authentication Hook

```typescript
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';

function useAuth() {
  const { state, login, logout } = usePrivyAuthMachine();
  
  return {
    user: state.context.user,
    isAuthenticated: state.matches('authenticated'),
    isLoading: state.matches('authenticating'),
    hasError: state.matches('error'),
    error: state.context.error,
    login,
    logout
  };
}

// Usage
function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Hello, {user?.email}! <button onClick={logout}>Logout</button></p>
      ) : (
        <button onClick={login}>Login</button>
      )}
    </div>
  );
}
```

### Wallet Management Hook

```typescript
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';

function useWallets() {
  const { state, createWallet } = usePrivyAuthMachine();
  
  return {
    wallets: state.context.wallets,
    hasWallets: state.context.wallets.length > 0,
    isCreating: state.matches('creatingWallet'),
    createWallet
  };
}

// Usage
function WalletManager() {
  const { wallets, hasWallets, isCreating, createWallet } = useWallets();
  
  return (
    <div>
      <h3>Wallets ({wallets.length})</h3>
      {!hasWallets && (
        <button onClick={createWallet} disabled={isCreating}>
          {isCreating ? 'Creating...' : 'Create First Wallet'}
        </button>
      )}
      {wallets.map(wallet => (
        <div key={wallet.id}>
          {wallet.type}: {wallet.address}
        </div>
      ))}
    </div>
  );
}
```

## Error Handling Patterns

### Comprehensive Error Display

```typescript
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';

function ErrorBoundary() {
  const { state, retry, login } = usePrivyAuthMachine();
  
  if (!state.matches('error')) return null;
  
  const error = state.context.error;
  
  // Categorize errors for better UX
  const getErrorInfo = (errorMessage: string) => {
    if (errorMessage.includes('Network')) {
      return {
        type: 'network',
        title: 'Connection Error',
        suggestion: 'Check your internet connection and try again.'
      };
    }
    if (errorMessage.includes('permissions')) {
      return {
        type: 'permissions',
        title: 'Permission Denied',
        suggestion: 'Please ensure you have granted necessary permissions.'
      };
    }
    if (errorMessage.includes('quota')) {
      return {
        type: 'storage',
        title: 'Storage Full',
        suggestion: 'Clear some extension data and try again.'
      };
    }
    return {
      type: 'general',
      title: 'Something went wrong',
      suggestion: 'Please try again or contact support.'
    };
  };
  
  const errorInfo = getErrorInfo(error || '');
  
  return (
    <div className={`error-display error-${errorInfo.type}`}>
      <h3>{errorInfo.title}</h3>
      <p>{errorInfo.suggestion}</p>
      <details>
        <summary>Technical Details</summary>
        <code>{error}</code>
      </details>
      <div className="error-actions">
        <button onClick={retry}>Try Again</button>
        <button onClick={login}>Restart Login</button>
      </div>
    </div>
  );
}
```

## State Persistence Examples

### Manual State Management

```typescript
import { StateStorage } from '../services/stateStorage';
import type { AuthContext } from '../types/auth';

// Save custom state
async function saveCustomState(updates: Partial<AuthContext>) {
  const currentState = await StateStorage.loadState();
  const newState = { ...currentState, ...updates };
  await StateStorage.saveState(newState);
}

// Load and validate state
async function loadValidatedState(): Promise<AuthContext | null> {
  try {
    const state = await StateStorage.loadState();
    
    // Validate state structure
    if (!state || typeof state !== 'object') {
      return null;
    }
    
    // Check required properties
    const hasValidStructure = (
      'user' in state &&
      'wallets' in state &&
      'error' in state &&
      'signedMessage' in state
    );
    
    return hasValidStructure ? state : null;
  } catch (error) {
    console.error('State validation failed:', error);
    return null;
  }
}

// Migration example
async function migrateState() {
  const state = await StateStorage.loadState();
  if (!state) return;
  
  // Example: Migrate old state format
  if ('legacyField' in state) {
    const migratedState = {
      user: state.user,
      wallets: state.wallets || [],
      error: null,
      signedMessage: null
    };
    
    await StateStorage.saveState(migratedState);
  }
}
```

## Testing Examples

### Component Testing with State Machine

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AuthButton } from '../components/AuthButton';
import { PrivyService } from '../services/privyService';

vi.mock('../services/privyService');
const mockPrivyService = vi.mocked(PrivyService);

test('should handle authentication flow', async () => {
  const mockUser = { id: 'user123', email: 'test@example.com' };
  mockPrivyService.login.mockResolvedValue(mockUser);
  
  render(<AuthButton />);
  
  // Initial state
  expect(screen.getByText('Login with Privy')).toBeInTheDocument();
  
  // Click login
  fireEvent.click(screen.getByText('Login with Privy'));
  
  // Loading state
  expect(screen.getByText('Authenticating...')).toBeInTheDocument();
  
  // Authenticated state
  await waitFor(() => {
    expect(screen.getByText(`Welcome, ${mockUser.email}!`)).toBeInTheDocument();
  });
});
```

This comprehensive set of examples demonstrates how to integrate and use the TDD-built state layer across different scenarios in your WXT extension.