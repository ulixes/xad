/**
 * Authentication utility functions for Privy
 */

/**
 * Logout utility that clears auth tokens
 */
export async function logout(): Promise<void> {
  try {
    // Remove JWT token from localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('brandId')
    console.log('Auth tokens removed')
    
    // Dispatch storage event to notify other components
    window.dispatchEvent(new Event('storage'))
    
  } catch (error) {
    console.error('Error during logout:', error)
    // Ensure tokens are removed even if error occurs
    localStorage.removeItem('auth_token')
    localStorage.removeItem('brandId')
  }
}

/**
 * Check if user has valid JWT token from our backend
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
 * Get the brand ID
 */
export function getBrandId(): string | null {
  return localStorage.getItem('brandId')
}

/**
 * Validate JWT token with backend
 */
export async function validateToken(): Promise<boolean> {
  const token = getAuthToken()
  if (!token) return false
  
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8787'}/api/auth/session`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (response.ok) {
      return true
    } else {
      // Token is invalid, remove it
      localStorage.removeItem('auth_token')
      localStorage.removeItem('brandId')
      return false
    }
  } catch (error) {
    console.error('Token validation error:', error)
    return false
  }
}

/**
 * Clear all authentication data
 */
export async function clearAllAuthData(): Promise<void> {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('brandId')
  console.log('All auth data cleared')
}