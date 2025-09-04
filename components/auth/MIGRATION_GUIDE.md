# Authentication Module Migration Guide

## Overview

The authentication module has been completely refactored following Clean Code principles and the architecture guidelines defined in `/ARCHITECTURE_GUIDELINES.md`. This guide will help you migrate from the legacy authentication components to the new architecture.

## Key Changes

### 1. Architecture Restructure

**Old Structure:**
```
/components/auth/
  AuthButton.tsx       (199 lines - mixed concerns)
  AuthContainer.tsx    (hardcoded config)
  AuthView.tsx        (256 lines - complex)
  AuthButtonContainer.tsx
  AuthButtonView.tsx
```

**New Structure:**
```
/components/auth/
  /components/       # Pure UI components (30-50 lines each)
  /containers/       # Smart components with state
  /services/         # Business logic (authentication, window, clipboard)
  /hooks/           # Reusable hooks (useAuth, useClipboard)
  /types/           # TypeScript definitions
  /utils/           # Pure utility functions
  /errors/          # Error boundary and error classes
  /legacy/          # Old components (will be removed)
  index.ts          # Public API
```

### 2. Single Responsibility Principle

Each component/service now has a single, clear responsibility:

- **AuthenticationService**: Handles authentication logic only
- **WindowService**: Manages browser window operations
- **ClipboardService**: Handles clipboard operations
- **AuthView**: Pure UI rendering
- **AuthContainer**: State management and service orchestration

### 3. Dependency Injection

Services are now injected rather than imported directly:

**Old:**
```typescript
const AuthContainer = () => {
  const { login } = usePrivy() // Direct dependency
  // Hardcoded window config
}
```

**New:**
```typescript
const AuthContainer = ({ windowConfig }) => {
  const auth = useAuth(windowConfig) // Injected config
  // Services created internally with dependency injection
}
```

## Migration Steps

### Step 1: Update Imports

**Old:**
```typescript
import { AuthContainer } from '@/components/auth/AuthContainer'
import { AuthView } from '@/components/auth/AuthView'
```

**New:**
```typescript
import { AuthContainer, AuthView } from '@/components/auth'
```

### Step 2: Remove userData Prop

The new `AuthContainer` manages its own state and doesn't need external userData.

**Old:**
```typescript
<AuthContainer userData={userData} />
```

**New:**
```typescript
<AuthContainer />
```

### Step 3: Configure Window Settings

Window configuration is now passed as a prop instead of being hardcoded.

**Old (hardcoded in AuthContainer.tsx:47-52):**
```typescript
browser.windows.create({
  type: 'popup',
  width: 420,
  height: 640
})
```

**New:**
```typescript
<AuthContainer 
  windowConfig={{
    type: 'panel',
    width: 200,
    height: 600
  }}
/>
```

### Step 4: Use New Hooks

Replace direct Privy usage with our abstracted hooks:

**Old:**
```typescript
const { login, logout, user } = usePrivy()
```

**New:**
```typescript
const { login, logout, user, state, isReady } = useAuth()
```

### Step 5: Error Handling

Wrap your auth components with the error boundary:

```typescript
import { AuthErrorBoundary } from '@/components/auth'

<AuthErrorBoundary>
  <YourAuthComponent />
</AuthErrorBoundary>
```

## Component Mapping

| Old Component | New Component | Notes |
|--------------|---------------|-------|
| AuthButton.tsx | Split into multiple components | LoginButton, LogoutButton, UserProfile, WalletDisplay |
| AuthContainer.tsx | AuthContainer (refactored) | Now uses dependency injection |
| AuthView.tsx | AuthView (simplified) | Pure presentation component |
| Clipboard logic | ClipboardService + useClipboard | Extracted to service and hook |
| Window management | WindowService | Extracted to dedicated service |

## Benefits of the New Architecture

1. **Testability**: Each component/service can be tested in isolation
2. **Maintainability**: Clear separation of concerns makes changes easier
3. **Reusability**: Hooks and services can be reused across the application
4. **Type Safety**: Comprehensive TypeScript definitions
5. **Error Handling**: Centralized error handling with error boundaries
6. **Performance**: Smaller, focused components with proper memoization

## Breaking Changes

1. **AuthContainer no longer accepts userData prop**
   - The container manages its own state internally

2. **Window configuration must be passed explicitly**
   - No more hardcoded window settings

3. **Clipboard operations are now async**
   - Use the `useClipboard` hook for clipboard operations

4. **Error handling is now centralized**
   - Errors are caught by error boundaries and logged

## Temporary Backward Compatibility

For a smooth transition, the old components are available as:

```typescript
import { LegacyAuthContainer, LegacyAuthView } from '@/components/auth'
```

**Note:** These will be removed in the next major version.

## Examples

### Basic Authentication

```typescript
import { AuthContainer } from '@/components/auth'

function App() {
  return (
    <AuthContainer 
      windowConfig={{
        type: 'panel',
        width: 300,
        height: 600
      }}
    />
  )
}
```

### Custom Authentication View

```typescript
import { useAuth, LoginButton, UserProfile } from '@/components/auth'

function CustomAuth() {
  const { user, login, logout, state } = useAuth()
  
  if (state === 'authenticated' && user) {
    return (
      <div>
        <UserProfile user={user} />
        <button onClick={logout}>Logout</button>
      </div>
    )
  }
  
  return <LoginButton onClick={login} />
}
```

### Using Services Directly

```typescript
import { AuthenticationService, WindowService } from '@/components/auth'
import { usePrivy } from '@privy-io/react-auth'

function CustomComponent() {
  const privy = usePrivy()
  const authService = new AuthenticationService(privy)
  const windowService = new WindowService()
  
  const handleLogin = async () => {
    await windowService.openAuthWindow()
    await authService.login()
    await windowService.closeAuthWindow()
  }
}
```

## Support

If you encounter any issues during migration:

1. Check the `/ARCHITECTURE_GUIDELINES.md` for architectural principles
2. Review the new component documentation in the source files
3. Refer to the examples above
4. Check the legacy components in `/components/auth/legacy/` for reference

## Timeline

- **Current Release**: New architecture available, legacy components moved to `/legacy`
- **Next Minor Release**: Deprecation warnings added to legacy components
- **Next Major Release**: Legacy components will be removed

## Conclusion

This refactoring brings the authentication module in line with Clean Code principles, making it more maintainable, testable, and scalable. The migration should be straightforward, but the legacy components remain available for a smooth transition.