# XAD Actions - XState Architecture

This document describes the XState-based state management architecture implemented for the Home UI component.

## Architecture Overview

The architecture follows XState best practices by modeling the domain entities as separate state machines with clear relationships:

### Core Entities

1. **User** - The central actor that manages earnings, wallet, and spawns Account actors
2. **Account** - Individual social media account actors that handle their verification lifecycle

## Entity State Machines

### User Machine (`userMachine.ts`)

The User is the parent actor that manages:

- **Context:**
  - `walletAddress`: User's wallet address
  - `pendingEarnings`: Earnings pending verification
  - `availableEarnings`: Earnings available for withdrawal
  - `dailyActionsCompleted/Required`: Daily progress tracking
  - `accounts`: References to spawned Account actors
  - `accountsData`: Account data for UI rendering
  - `addingAccountPlatform`: Current platform being added (if any)
  - `handleInput`: Current handle input value

- **States:**
  - `idle`: Normal operating state
  - `addingAccount`: User is in the process of adding a new account
  - `withdrawing`: User is withdrawing earnings

- **Key Events:**
  - `START_ADD_ACCOUNT`: Begin adding account for a platform
  - `CONFIRM_ADD_ACCOUNT`: Spawn new Account actor and start verification
  - `CASH_OUT`: Initiate earnings withdrawal
  - Account-related events from child actors (verification results, clicks)

### Account Machine (`accountMachine.ts`)

Each Account is a child actor that manages its own lifecycle:

- **Context:**
  - `id`: Unique account identifier
  - `platform`: Social media platform (tiktok, instagram, x, reddit)
  - `handle`: User handle on the platform
  - `availableActions`: Number of available actions
  - `verificationError`: Error message if verification fails

- **States:**
  - `connecting`: Initial state when account is being added
  - `verifying`: Account verification in progress
  - `verified`: Account successfully verified and active
  - `failed`: Account verification failed

- **Key Events:**
  - `START_VERIFICATION`: Begin the verification process
  - `VERIFICATION_SUCCESS`: Verification completed successfully
  - `VERIFICATION_FAILED`: Verification failed
  - `CLICK`: User clicked on the account

## Actor Communication

The architecture implements proper parent-child communication:

### Parent → Child Communication
- User machine uses `sendTo(accountId, event)` to send events to specific Account actors
- Automatic verification start when Account is spawned

### Child → Parent Communication  
- Account actors use `sendParent(event)` to notify User of state changes
- Events include verification results, clicks, and status updates

## React Integration

### `useUserMachine` Hook

The `useUserMachine` hook provides a clean React interface:

```typescript
const {
  // State information
  isAddingAccount,
  isWithdrawing,
  addingAccountPlatform,
  handleInput,

  // Data
  connectedAccounts,
  walletAddress,
  pendingEarnings,
  availableEarnings,

  // Actions
  handleStartAddingAccount,
  handleConfirmAddAccount,
  handleCashOut,
  
  // External API
  updateEarnings,
  handleAccountVerified,
} = useUserMachine(props);
```

## Key Benefits of This Architecture

1. **Entity-Centric Design**: Each entity (User, Account) is modeled as a separate state machine with clear responsibilities

2. **Actor Model**: Follows XState's actor model with proper parent-child relationships and communication

3. **Predictable State Transitions**: All state changes are explicit and predictable through the state machine definitions

4. **Scalable**: Easy to add new account types or extend functionality by modifying the appropriate state machine

5. **Testable**: Each state machine can be tested independently with clear input/output contracts

6. **Type-Safe**: Full TypeScript support with strongly typed events, context, and states

## Usage Example

```tsx
function MyHomeComponent() {
  const userMachine = useUserMachine({
    walletAddress: '0x123...',
    pendingEarnings: 45.50,
    availableEarnings: 125.00,
    onAddAccount: (platform, handle) => {
      // Handle account addition in backend
    },
    onAccountClick: (account) => {
      // Navigate to account details
    },
  });

  // Component renders based on userMachine state and data
  return <HomeWithStateMachine {...userMachine} />;
}
```

## State Machine Visualization

The state machines can be visualized and tested using Stately Studio:
- User Machine: Manages overall application state and spawns Account actors
- Account Machines: Handle individual account verification lifecycles

## Future Extensions

This architecture makes it easy to extend functionality:

- Add new account platforms by updating the platforms list
- Implement additional user states (e.g., `onboarding`, `suspended`)
- Add more complex account states (e.g., `rate_limited`, `needs_reauth`)
- Integrate with backend APIs through actor services
- Add persistence for state hydration/rehydration