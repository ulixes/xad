# State Layer API Documentation

## Types

### Core Types (`../types/auth.ts`)

```typescript
interface User {
  id: string;
  email?: string;
  wallet?: {
    address: string;
  };
}

interface Wallet {
  id: string;
  address: string;
  type: 'embedded' | 'external';
}

interface AuthContext {
  user: User | null;
  wallets: Wallet[];
  error: string | null;
}

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

## State Machine API

### `privyAuthMachine`

XState machine configuration for Privy authentication flow.

**Import:**
```typescript
import { privyAuthMachine } from '../state/machines/privyAuthMachine';
```

**Usage:**
```typescript
import { createActor } from 'xstate';

const actor = createActor(privyAuthMachine);
actor.start();

// Send events
actor.send({ type: 'LOGIN' });
actor.send({ type: 'AUTH_SUCCESS', user: mockUser });

// Get state
const snapshot = actor.getSnapshot();
console.log(snapshot.value); // Current state
console.log(snapshot.context); // Current context
```

## Services API

### `PrivyService`

Static service class for Privy SDK integration.

**Methods:**

#### `login(): Promise<User>`
Authenticates user with Privy.

```typescript
try {
  const user = await PrivyService.login();
  console.log('Authenticated:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

**Throws:**
- `Error` - When authentication fails
- `Error` - On network errors

#### `logout(): Promise<void>`
Logs out current user.

```typescript
try {
  await PrivyService.logout();
  console.log('Logged out successfully');
} catch (error) {
  console.error('Logout failed:', error.message);
}
```

#### `createWallet(): Promise<Wallet>`
Creates a new embedded wallet.

```typescript
try {
  const wallet = await PrivyService.createWallet();
  console.log('Wallet created:', wallet.address);
} catch (error) {
  console.error('Wallet creation failed:', error.message);
}
```

**Throws:**
- `Error` - When wallet creation fails
- `Error` - On insufficient permissions

### `StateStorage`

Static service class for Chrome storage persistence.

**Methods:**

#### `saveState(state: AuthContext): Promise<void>`
Saves auth state to Chrome storage.

```typescript
const state = {
  user: { id: 'user123', email: 'test@example.com' },
  wallets: [],
  error: null
};

try {
  await StateStorage.saveState(state);
  console.log('State saved');
} catch (error) {
  console.error('Save failed:', error.message);
}
```

**Throws:**
- `Error` - When Chrome storage is unavailable
- `Error` - On storage quota exceeded

#### `loadState(): Promise<AuthContext | null>`
Loads auth state from Chrome storage.

```typescript
try {
  const state = await StateStorage.loadState();
  if (state) {
    console.log('State loaded:', state);
  } else {
    console.log('No saved state found');
  }
} catch (error) {
  console.error('Load failed:', error.message);
}
```

**Returns:**
- `AuthContext | null` - Saved state or null if none exists

#### `clearState(): Promise<void>`
Removes auth state from Chrome storage.

```typescript
try {
  await StateStorage.clearState();
  console.log('State cleared');
} catch (error) {
  console.error('Clear failed:', error.message);
}
```

## React Hook API

### `usePrivyAuthMachine()`

React hook that provides the complete auth state management interface.

**Import:**
```typescript
import { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';
```

**Usage:**
```typescript
function AuthComponent() {
  const {
    state,
    login,
    logout,
    createWallet,
    retry
  } = usePrivyAuthMachine();

  // Check current state
  const isAuthenticated = state.matches('authenticated');
  const isLoading = state.matches('authenticating');
  const hasError = state.matches('error');

  // Access context data
  const user = state.context.user;
  const wallets = state.context.wallets;
  const error = state.context.error;

  return (
    <div>
      {isAuthenticated && <p>Welcome, {user?.email}!</p>}
      {isLoading && <p>Authenticating...</p>}
      {hasError && <p>Error: {error}</p>}
    </div>
  );
}
```

**Returns:**

#### `state`
Current XState machine state and context.

**Properties:**
- `state.matches(stateName)` - Check if in specific state
- `state.context` - Current context data
- `state.value` - Current state name

#### `login(): Promise<void>`
Initiates login flow.

```typescript
const handleLogin = async () => {
  await login();
  // State will automatically update on success/failure
};
```

#### `logout(): Promise<void>`
Initiates logout flow and clears persisted state.

```typescript
const handleLogout = async () => {
  await logout();
  // State will automatically reset to idle
};
```

#### `createWallet(): Promise<void>`
Creates a new wallet for authenticated user.

```typescript
const handleCreateWallet = async () => {
  if (state.matches('authenticated')) {
    await createWallet();
    // New wallet will be added to state.context.wallets
  }
};
```

#### `retry(): void`
Resets from error state to idle for retry.

```typescript
const handleRetry = () => {
  retry();
  // State will transition from error to idle
};
```

## Error Handling

All services implement consistent error handling:

### Error Types
- **Authentication Errors:** Invalid credentials, network issues
- **Wallet Errors:** Creation failures, insufficient permissions
- **Storage Errors:** Quota exceeded, access denied
- **Validation Errors:** Invalid input parameters

### Error Format
```typescript
// All errors are instances of Error with descriptive messages
try {
  await PrivyService.login();
} catch (error) {
  console.error(error.message); // Human-readable error message
}
```

### State Machine Error Handling
Errors automatically transition the state machine to the `error` state:

```typescript
const { state, retry } = usePrivyAuthMachine();

if (state.matches('error')) {
  console.log('Error occurred:', state.context.error);
  // User can retry or attempt login again
  retry(); // Transitions to idle state
}
```

## State Persistence

The hook automatically persists state changes:

- **Save Triggers:** On successful authentication, wallet creation
- **Load Triggers:** On component mount
- **Clear Triggers:** On logout
- **Storage Key:** `'authState'`

### Manual State Management

```typescript
import { StateStorage } from '../services/stateStorage';

// Manual save
const currentState = {
  user: { id: 'user123', email: 'test@example.com' },
  wallets: [],
  error: null
};
await StateStorage.saveState(currentState);

// Manual load
const savedState = await StateStorage.loadState();

// Manual clear
await StateStorage.clearState();
```