export interface User {
  id: string;
  email?: string;
  wallet?: {
    address: string;
  };
}

export interface Wallet {
  id: string;
  address: string;
  type: 'embedded' | 'external';
}

export interface AuthContext {
  user: User | null;
  wallets: Wallet[];
  error: string | null;
}

export enum AuthState {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating',
  AUTHENTICATED = 'authenticated',
  CREATING_WALLET = 'creatingWallet',
  ERROR = 'error'
}

export type AuthEvent = 
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'AUTH_SUCCESS'; user: User }
  | { type: 'AUTH_ERROR'; error: string }
  | { type: 'CREATE_WALLET' }
  | { type: 'WALLET_CREATED'; wallet: Wallet }
  | { type: 'RETRY' };