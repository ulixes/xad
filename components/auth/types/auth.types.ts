import { User as PrivyUser } from '@privy-io/react-auth'
import { Wallet } from '@privy-io/react-auth'

export interface AuthUser extends PrivyUser {
  wallet?: AuthWallet
}

export interface AuthWallet extends Wallet {
  formattedAddress?: string
}

export interface AuthCredentials {
  email?: string
  phone?: string
  wallet?: string
}

export type AuthenticationState = 
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'error'

export interface AuthenticationStatus {
  state: AuthenticationState
  user: AuthUser | null
  isReady: boolean
  error: AuthenticationError | null
}

export interface AuthWindowConfig {
  type: 'popup' | 'panel' | 'normal'
  width: number
  height: number
  left?: number
  top?: number
}

export interface ClipboardState {
  copiedAddress: string | null
  copiedWalletAddress: string | null
}

export enum AuthErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  WINDOW_BLOCKED = 'WINDOW_BLOCKED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_CANCELLED = 'USER_CANCELLED'
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export interface AuthServiceInterface {
  login(): Promise<void>
  logout(): Promise<void>
  getUser(): AuthUser | null
  isAuthenticated(): boolean
  getWallets(): Wallet[]
}

export interface WindowServiceInterface {
  openAuthWindow(config?: AuthWindowConfig): Promise<void>
  closeAuthWindow(): Promise<void>
}

export interface ClipboardServiceInterface {
  copyToClipboard(text: string): Promise<void>
  readFromClipboard(): Promise<string>
}