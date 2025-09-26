import { ParaWeb } from '@getpara/react-sdk'
import { chromeStorageOverrides } from './chromeStorage'

export class ParaWallet {
  private para: ParaWeb | null = null
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const apiKey = import.meta.env.VITE_PARA_API_KEY || ''
      if (!apiKey) {
        throw new Error('Para API key not configured')
      }

      // Create Para instance with Chrome storage overrides
      this.para = new ParaWeb(apiKey, {
        ...chromeStorageOverrides,
        useStorageOverrides: true,
      })

      // Initialize Para SDK
      await this.para.init()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize Para:', error)
      throw error
    }
  }

  async connect(): Promise<string | null> {
    if (!this.para) {
      await this.initialize()
    }

    if (!this.para) {
      console.error('Para not initialized')
      return null
    }

    try {
      // Check if already logged in
      const isActive = await this.para.isSessionActive()
      
      if (!isActive) {
        // Need to authenticate - this would typically open a modal or redirect
        // For extension, we might want to open in a new tab or popup
        console.log('User needs to authenticate with Para')
        // You'll need to implement the actual authentication flow
        // This might involve opening Para's auth UI in a new tab
        return null
      }

      // Get wallet info
      const wallets = await this.para.fetchWallets()
      
      if (wallets && wallets.length > 0) {
        // Return the first EVM wallet address
        const evmWallet = wallets.find(w => w.type === 'EVM') || wallets[0]
        return evmWallet.address
      }
      
      // If no wallet exists, create one
      const newWallet = await this.para.createWallet({ type: 'EVM' })
      return newWallet?.address || null
    } catch (error) {
      console.error('Failed to connect with Para:', error)
      return null
    }
  }

  async disconnect() {
    if (!this.para) return

    try {
      await this.para.logout()
    } catch (error) {
      console.error('Failed to disconnect Para:', error)
    }
  }

  async getAccount(): Promise<{ address: string; isConnected: boolean } | null> {
    if (!this.para) {
      await this.initialize()
    }

    if (!this.para) {
      return { address: '', isConnected: false }
    }

    try {
      const isActive = await this.para.isSessionActive()
      
      if (!isActive) {
        return {
          address: '',
          isConnected: false
        }
      }

      const wallets = await this.para.fetchWallets()
      
      if (wallets && wallets.length > 0) {
        const evmWallet = wallets.find(w => w.type === 'EVM') || wallets[0]
        return {
          address: evmWallet.address,
          isConnected: true
        }
      }

      return {
        address: '',
        isConnected: false
      }
    } catch (error) {
      console.error('Failed to get Para account:', error)
      return null
    }
  }

  async signMessage(message: string): Promise<string | null> {
    if (!this.para) {
      await this.initialize()
    }

    if (!this.para) return null

    try {
      const wallets = await this.para.fetchWallets()
      
      if (!wallets || wallets.length === 0) {
        console.error('No wallet available for signing')
        return null
      }

      const evmWallet = wallets.find(w => w.type === 'EVM') || wallets[0]
      
      // Sign message with Para
      const signature = await this.para.signMessage({
        walletId: evmWallet.id,
        message
      })
      
      return signature
    } catch (error) {
      console.error('Failed to sign message with Para:', error)
      return null
    }
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.para) {
      await this.initialize()
    }

    if (!this.para) return null

    try {
      const isActive = await this.para.isSessionActive()
      
      if (!isActive) {
        console.error('No active Para session')
        return null
      }

      // Issue JWT token for API authentication
      const { token } = await this.para.issueJwt()
      return token
    } catch (error) {
      console.error('Failed to get Para JWT token:', error)
      return null
    }
  }
}

// Singleton instance
export const paraWallet = new ParaWallet()