// SIWX (Sign In With X) Configuration using proper DefaultSIWX architecture
import { DefaultSIWX } from '@reown/appkit-siwx'
import { InformalMessenger, SIWXVerifier } from '@reown/appkit-siwx'
import type { SIWXSession } from '@reown/appkit-controllers'
import type { ChainNamespace } from '@reown/appkit-common'
import { API_BASE_URL } from './api'

// Custom verifier that integrates with our backend
class XADBackendVerifier extends SIWXVerifier {
  // Required property for SIWXVerifier interface
  readonly chainNamespace: ChainNamespace = 'eip155'

  shouldVerify(_session: SIWXSession): boolean {
    // Always verify with our backend
    return true
  }

  async verify(session: SIWXSession): Promise<boolean> {
    // Access message and signature from the session at the root level
    const message = (session as any).message
    let signature = (session as any).signature
    
    if (!message || !signature) {
      return false
    }
    
    // Ensure signature is properly formatted as hex string
    if (signature && !signature.startsWith('0x')) {
      signature = '0x' + signature
    }
    
    
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
        return false
      }

      const result = await response.json()
      const { success, token } = result
      
      if (success && token) {
        // Store JWT token for API requests
        localStorage.setItem('auth_token', token)
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
  // Make signature optional - only required for protected routes
  required: (() => {
    if (typeof window === 'undefined') return false
    
    // Check if we're on a protected route
    const path = window.location.hash.replace('#', '') || '/'
    const protectedRoutes = ['/dashboard']
    return protectedRoutes.some(route => path.startsWith(route))
  })()
})