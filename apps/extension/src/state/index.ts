// State Layer Exports
// Built with Test-Driven Development (TDD) following Red-Green-Refactor methodology

// Types
export type { User, Wallet, AuthContext, AuthEvent } from '../types/auth';
export { AuthState } from '../types/auth';

// State Machine
export { privyAuthMachine } from './machines/privyAuthMachine';

// Services
export { PrivyService } from '../services/privyService';
export { StateStorage } from '../services/stateStorage';

// React Integration
export { usePrivyAuthMachine } from '../hooks/usePrivyAuthMachine';

// Re-export XState utilities for convenience
export { createActor } from 'xstate';
export { useMachine } from '@xstate/react';