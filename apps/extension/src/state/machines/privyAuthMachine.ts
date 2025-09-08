import { assign, createMachine } from 'xstate';
import { AuthState, type AuthContext, type AuthEvent } from '../../types/auth';

export const privyAuthMachine = createMachine({
  id: 'privyAuth',
  types: {
    context: {} as AuthContext,
    events: {} as AuthEvent,
  },
  initial: AuthState.IDLE,
  context: {
    user: null,
    wallets: [],
    error: null,
  },
  states: {
    [AuthState.IDLE]: {
      on: {
        LOGIN: {
          target: AuthState.AUTHENTICATING,
        },
      },
    },
    [AuthState.AUTHENTICATING]: {
      entry: assign({
        error: null,
      }),
      on: {
        AUTH_SUCCESS: {
          target: AuthState.AUTHENTICATED,
          actions: assign({
            user: ({ event }) => event.user,
            error: null,
          }),
        },
        AUTH_ERROR: {
          target: AuthState.ERROR,
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    [AuthState.AUTHENTICATED]: {
      on: {
        LOGOUT: {
          target: AuthState.IDLE,
          actions: assign({
            user: null,
            wallets: [],
          }),
        },
        CREATE_WALLET: {
          target: AuthState.CREATING_WALLET,
        },
      },
    },
    [AuthState.CREATING_WALLET]: {
      on: {
        WALLET_CREATED: {
          target: AuthState.AUTHENTICATED,
          actions: assign({
            wallets: ({ context, event }) => [...context.wallets, event.wallet],
          }),
        },
        AUTH_ERROR: {
          target: AuthState.ERROR,
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
      },
    },
    [AuthState.ERROR]: {
      on: {
        RETRY: {
          target: AuthState.IDLE,
        },
        LOGIN: {
          target: AuthState.AUTHENTICATING,
        },
      },
    },
  },
});