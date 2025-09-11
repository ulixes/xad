import { Porto } from 'porto'

export class PortoWallet {
  private porto: Porto | null = null
  private isInitialized = false

  async initialize() {
    if (this.isInitialized) return

    try {
      // Porto.create() will automatically use popup mode for chrome-extension protocol
      // which is supported since WebAuthn doesn't work in iframes on insecure origins
      this.porto = Porto.create()
      this.isInitialized = true
      console.log('Porto wallet initialized (popup mode for extension)')
    } catch (error) {
      console.error('Failed to initialize Porto wallet:', error)
      throw error
    }
  }

  async connect(): Promise<string | null> {
    if (!this.porto) {
      await this.initialize()
    }

    try {
      const result = await this.porto!.provider.request({ 
        method: 'wallet_connect'
      })
      
      console.log('Porto connect result:', result)
      
      // Handle different response formats
      let address = null
      if (typeof result === 'string') {
        address = result
      } else if (result?.accounts && Array.isArray(result.accounts)) {
        address = result.accounts[0]
      } else if (result?.address) {
        address = result.address
      } else if (Array.isArray(result)) {
        address = result[0]
      }
      
      // If address is still an object, extract the address property
      if (address && typeof address === 'object' && address.address) {
        address = address.address
      }
      
      return address || null
    } catch (error) {
      console.error('Failed to connect Porto wallet:', error)
      return null
    }
  }

  async disconnect() {
    if (!this.porto) return

    try {
      await this.porto.provider.request({
        method: 'wallet_disconnect'
      })
    } catch (error) {
      console.error('Failed to disconnect Porto wallet:', error)
    }
  }

  async getAccount(): Promise<{ address: string; isConnected: boolean } | null> {
    if (!this.porto) return null

    try {
      const result = await this.porto.provider.request({
        method: 'eth_accounts'
      })
      
      let accounts = []
      if (Array.isArray(result)) {
        accounts = result
      } else if (result?.accounts && Array.isArray(result.accounts)) {
        accounts = result.accounts
      }
      
      // Extract address strings from any objects
      const addresses = accounts.map(account => {
        if (typeof account === 'string') return account
        if (account && typeof account === 'object' && account.address) return account.address
        return null
      }).filter(Boolean)
      
      return {
        address: addresses[0] || '',
        isConnected: addresses.length > 0
      }
    } catch (error) {
      console.error('Failed to get Porto account:', error)
      return null
    }
  }

  async signMessage(message: string): Promise<string | null> {
    if (!this.porto) return null

    try {
      const accounts = await this.porto.provider.request({
        method: 'eth_accounts'
      })
      
      if (!accounts?.[0]) {
        throw new Error('No account connected')
      }

      const signature = await this.porto.provider.request({
        method: 'personal_sign',
        params: [message, accounts[0]]
      })
      
      return signature
    } catch (error) {
      console.error('Failed to sign message with Porto:', error)
      return null
    }
  }
}

// Singleton instance
export const portoWallet = new PortoWallet()