// SIWX (Sign In With X) Configuration using proper DefaultSIWX architecture
import { DefaultSIWX } from '@reown/appkit-siwx'
import { InformalMessenger, SIWXVerifier } from '@reown/appkit-siwx'
import type { SIWXSession } from '@reown/appkit-controllers'
import type { ChainNamespace } from '@reown/appkit-common'
import { API_BASE_URL } from './api'

// Custom verifier that integrates with our backend
export class XADBackendVerifier extends SIWXVerifier {
  // Required property for SIWXVerifier interface
  readonly chainNamespace: ChainNamespace = 'eip155'
  
  // Cache JWT validation result to avoid multiple API calls
  private jwtValidCache: { valid: boolean; timestamp: number } | null = null
  private readonly CACHE_DURATION = 5000 // 5 seconds cache
  
  private async isJWTValid(): Promise<boolean> {
    const token = localStorage.getItem('auth_token')
    if (!token) return false
    
    // Check cache
    if (this.jwtValidCache && (Date.now() - this.jwtValidCache.timestamp) < this.CACHE_DURATION) {
      return this.jwtValidCache.valid
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const isValid = response.ok
      
      // Update cache
      this.jwtValidCache = { valid: isValid, timestamp: Date.now() }
      
      if (!isValid) {
        localStorage.removeItem('auth_token')
      }
      
      return isValid
    } catch (error) {
      console.error('JWT validation error:', error)
      localStorage.removeItem('auth_token')
      this.jwtValidCache = { valid: false, timestamp: Date.now() }
      return false
    }
  }

  shouldVerify(session: SIWXSession): boolean {
    // Check if session has the required data
    const message = (session as any)?.message
    const signature = (session as any)?.signature
    
    // If no message or signature, don't attempt to verify
    if (!message || !signature) {
      console.log('No message or signature in session, skipping verification')
      return false
    }
    
    // Check if this looks like a stale session (old timestamp)
    try {
      if (message.includes('Issued At:')) {
        const issuedAtMatch = message.match(/Issued At: (.+)/)
        if (issuedAtMatch) {
          const issuedAt = new Date(issuedAtMatch[1])
          const now = new Date()
          const hoursSinceIssued = (now.getTime() - issuedAt.getTime()) / (1000 * 60 * 60)
          
          // If the message is older than 1 hour, consider it stale
          if (hoursSinceIssued > 1) {
            console.log('Session message is stale (>1 hour old), skipping verification')
            return false
          }
        }
      }
    } catch (e) {
      console.error('Error checking session staleness:', e)
    }
    
    // Note: We can't use async here, so we'll check JWT in verify()
    // Default to verify unless we know it's stale
    return true
  }

  async verify(session: SIWXSession): Promise<boolean> {
    // Access message and signature from the session
    const message = (session as any)?.message
    let signature = (session as any)?.signature
    
    if (!message || !signature) {
      console.log('No message or signature in session')
      return false
    }
    
    // Ensure signature is properly formatted as hex string
    if (signature && !signature.startsWith('0x')) {
      signature = '0x' + signature
    }
    
    console.log('Verifying signature with backend...')
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: message, 
          signature: signature 
        })
      })

      if (!response.ok) {
        console.log('Signature verification failed on backend')
        return false
      }

      const result = await response.json()
      const { success, token, brandId } = result
      
      if (success && token) {
        // Store JWT token for API requests
        localStorage.setItem('auth_token', token)
        
        // Store brandId for dashboard use
        if (brandId) {
          console.log('Storing brandId from auth:', brandId)
          localStorage.setItem('brandId', brandId)
        }
        
        console.log('New JWT token stored successfully')
        // Clear cache to force revalidation next time
        this.jwtValidCache = null
        return true
      }
      
      return false
    } catch (error) {
      console.error('SIWX verification error:', error)
      return false
    }
  }
}

// Create the SIWX configuration using DefaultSIWX with custom messenger and verifier
export const siwxConfig = new DefaultSIWX({
  messenger: new InformalMessenger({
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost:5173',
    uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
    statement: 'Sign in to XAD with your wallet',
    // This is the key fix - provide the getNonce function to the messenger
    getNonce: async (_input: any) => {
      try {
        // Use relative URL to work in all environments
        const response = await fetch(`${API_BASE_URL}/auth/nonce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`Failed to get nonce: ${response.status} ${errorText}`)
        }
        
        const result = await response.json()
        
        if (!result.nonce) {
          throw new Error('No nonce in response')
        }
        
        return result.nonce
      } catch (error) {
        console.error('SIWX getNonce error:', error)
        throw error
      }
    }
  }),
  // Add our custom verifier to handle backend authentication
  verifiers: [new XADBackendVerifier()],
  // Make SIWX optional - users can connect wallet without signing
  required: false
})