import { useEffect, useState } from 'react'
import { usePrivyAuth } from './usePrivyAuth'
import { apiClient } from '../lib/api'

export function useBrandRegistration() {
  const { isPrivyAuthenticated, authToken } = usePrivyAuth()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationStatus, setRegistrationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  
  useEffect(() => {
    if (!isPrivyAuthenticated || !authToken || registrationStatus === 'success') {
      return
    }
    
    const ensureBrandExists = async () => {
      setIsRegistering(true)
      
      try {
        console.log('[useBrandRegistration] Ensuring brand exists...')
        
        // Call the ensure endpoint - this is idempotent
        const response = await apiClient.post('/api/brands/ensure', {}, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
        
        if (response.data.success) {
          console.log('[useBrandRegistration] Brand ready:', response.data.brand)
          setRegistrationStatus('success')
        }
      } catch (error) {
        console.error('[useBrandRegistration] Failed to ensure brand:', error)
        setRegistrationStatus('error')
      } finally {
        setIsRegistering(false)
      }
    }
    
    ensureBrandExists()
  }, [isPrivyAuthenticated, authToken, registrationStatus])
  
  return {
    isRegistering,
    registrationStatus,
    isBrandReady: registrationStatus === 'success'
  }
}