/**
 * Logout utility that properly clears JWT and SIWX sessions
 * Based on Reown documentation recommendations
 */
export async function logout(): Promise<void> {
  try {
    // 1. Remove JWT token from localStorage
    localStorage.removeItem('auth_token')
    console.log('JWT token removed')
    
    // 2. Clear SIWX sessions manually
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        // Remove SIWX session data
        if (key.includes('@appkit/siwx') || 
            key.includes('appkit-siwx') ||
            key.includes('@reown/appkit-siwx')) {
          keysToRemove.push(key)
        }
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
    console.log('SIWX sessions cleared')
    
    // 3. Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'))
    
    // 4. Optional: Clear any app-specific auth cache
    // This helps ensure all auth-related state is reset
    const authRelatedKeys = ['user_profile', 'auth_cache']
    authRelatedKeys.forEach(key => {
      localStorage.removeItem(key)
    })
    
  } catch (error) {
    console.error('Error during logout:', error)
    // Even if SIWX clearing fails, ensure JWT is removed
    localStorage.removeItem('auth_token')
  }
}

/**
 * Check if user has valid JWT token
 */
export function hasAuthToken(): boolean {
  return !!localStorage.getItem('auth_token')
}

/**
 * Get the auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

/**
 * Validate JWT token with backend
 */
export async function validateToken(): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/auth/session`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.ok) {
      return true
    } else {
      // Token is invalid, remove it
      localStorage.removeItem('auth_token')
      return false
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

/**
 * Clear all authentication data (called on critical errors)
 */
export async function clearAllAuthData(): Promise<void> {
  // Clear JWT
  localStorage.removeItem('auth_token')
  
  // Clear any wallet-related cache that might cause issues
  // But keep wallet connection data (wc@2:* keys) intact
  const keysToRemove: string[] = []
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      // Remove only SIWX/auth related data, not wallet connection
      if (key.includes('@appkit/siwx') || 
          key.includes('appkit-siwx') ||
          key.includes('@reown/appkit-siwx') ||
          key.includes('auth_token') ||
          (key.includes('appkit') && key.includes('session'))) {
        keysToRemove.push(key)
      }
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    console.log('Cleared auth data:', key)
  })
}