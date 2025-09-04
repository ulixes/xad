import { PrivyInterface } from '@privy-io/react-auth'
import { 
  AuthServiceInterface, 
  AuthUser, 
  AuthenticationError, 
  AuthErrorCode 
} from '../types/auth.types'

export class AuthenticationService implements AuthServiceInterface {
  constructor(private privy: PrivyInterface) {}

  async login(): Promise<void> {
    try {
      await this.privy.login()
    } catch (error) {
      throw new AuthenticationError(
        'Failed to authenticate user',
        AuthErrorCode.AUTHENTICATION_FAILED,
        'Unable to sign in. Please try again.'
      )
    }
  }

  async logout(): Promise<void> {
    try {
      await this.privy.logout()
    } catch (error) {
      throw new AuthenticationError(
        'Failed to logout user',
        AuthErrorCode.AUTHENTICATION_FAILED,
        'Unable to sign out. Please try again.'
      )
    }
  }

  getUser(): AuthUser | null {
    const user = this.privy.user
    if (!user) return null

    // Note: wallets should be accessed through the usePrivy hook
    const wallet = null
    
    return {
      ...user,
      wallet: wallet ? {
        ...wallet,
        formattedAddress: this.formatWalletAddress(wallet.address)
      } : undefined
    }
  }

  isAuthenticated(): boolean {
    return this.privy.authenticated && this.privy.user !== null
  }

  getWallets() {
    // Note: wallets property may not be available on PrivyInterface
    // This needs to be accessed through the hook in the actual implementation
    return []
  }

  private formatWalletAddress(address: string): string {
    if (!address || address.length < 10) return address
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }
}