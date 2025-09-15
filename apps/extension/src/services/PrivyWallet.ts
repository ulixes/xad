import { PrivyInterface } from '@privy-io/react-auth'

export class PrivyWallet {
  private privy: PrivyInterface | null = null

  setPrivy(privy: PrivyInterface) {
    this.privy = privy
  }

  async connect(): Promise<string | null> {
    if (!this.privy) {
      console.error('Privy not initialized')
      return null
    }

    try {
      await this.privy.login()
      const user = this.privy.user
      
      if (user?.wallet?.address) {
        return user.wallet.address
      }
      
      // If user doesn't have embedded wallet, return linked wallet
      const linkedWallet = user?.linkedAccounts?.find(
        account => account.type === 'wallet'
      )
      
      return linkedWallet?.address || null
    } catch (error) {
      console.error('Failed to connect with Privy:', error)
      return null
    }
  }

  async disconnect() {
    if (!this.privy) return

    try {
      await this.privy.logout()
    } catch (error) {
      console.error('Failed to disconnect Privy:', error)
    }
  }

  async getAccount(): Promise<{ address: string; isConnected: boolean } | null> {
    if (!this.privy) return null

    try {
      const user = this.privy.user
      
      if (!user) {
        return {
          address: '',
          isConnected: false
        }
      }

      // Check for embedded wallet first
      if (user.wallet?.address) {
        return {
          address: user.wallet.address,
          isConnected: true
        }
      }

      // Fall back to linked wallet
      const linkedWallet = user.linkedAccounts?.find(
        account => account.type === 'wallet'
      )
      
      if (linkedWallet?.address) {
        return {
          address: linkedWallet.address,
          isConnected: true
        }
      }

      return {
        address: '',
        isConnected: false
      }
    } catch (error) {
      console.error('Failed to get Privy account:', error)
      return null
    }
  }

  async signMessage(message: string): Promise<string | null> {
    if (!this.privy) return null

    try {
      // This would need to use the wallet's signMessage method
      // Privy provides this through their hooks in React components
      console.warn('signMessage needs to be called from React component using useSignMessage hook')
      return null
    } catch (error) {
      console.error('Failed to sign message with Privy:', error)
      return null
    }
  }
}

// Singleton instance
export const privyWallet = new PrivyWallet()