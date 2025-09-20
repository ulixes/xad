import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useEffect, useState, useCallback } from 'react'

export function usePrivyAuth() {
  const { 
    authenticated, 
    ready,
    login, 
    logout, 
    user: privyUser,
    getAccessToken 
  } = usePrivy()
  
  const { wallets } = useWallets()
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)

  // Get connected external wallet - users must connect their own wallet
  const connectedWallet = wallets?.[0] // Get the first (and usually only) connected wallet
  const walletAddress = connectedWallet?.address || null
  
  // Log wallet selection for debugging (only in development)
  useEffect(() => {
    if (connectedWallet && import.meta.env.DEV) {
      console.log('[usePrivyAuth] Connected wallet:', walletAddress, 
        'wallet type:', connectedWallet?.walletClientType,
        'total wallets:', wallets?.length)
    }
  }, [connectedWallet, walletAddress, wallets])

  // Check if user is authenticated with Privy
  const checkAuthStatus = useCallback(() => {
    return authenticated
  }, [authenticated])

  // No longer need token exchange - use Privy token directly
  const exchangeTokens = useCallback(async () => {
    // Just return the Privy token directly
    const privyToken = await getAccessToken()
    if (privyToken) {
      setAuthToken(privyToken)
    }
    return privyToken
  }, [getAccessToken])

  // Set auth token when Privy authenticates
  useEffect(() => {
    if (authenticated && walletAddress) {
      getAccessToken().then(token => {
        if (token) {
          setAuthToken(token)
        }
      })
    }
  }, [authenticated, walletAddress, getAccessToken])

  // Trigger sign-in flow
  const triggerSignIn = useCallback(async () => {
    setIsAuthenticating(true)
    
    try {
      // Debug log the Privy state
      console.log('[usePrivyAuth] triggerSignIn called:', {
        authenticated,
        ready,
        hasPrivyUser: !!privyUser,
        walletsCount: wallets?.length || 0
      })
      
      // If not authenticated with Privy, trigger wallet connection
      if (!authenticated) {
        console.log('Starting wallet connection...')
        await login() // This will now prompt for wallet connection
        // Login is async, the useEffect above will handle token exchange
        return false
      }

      // If authenticated with Privy but not our backend, exchange tokens
      if (authenticated && !authToken) {
        console.log('Exchanging Privy token for backend JWT...')
        const token = await exchangeTokens()
        return !!token
      }

      return authenticated
    } finally {
      setIsAuthenticating(false)
    }
  }, [authenticated, login, authToken, exchangeTokens])

  // Sign out from Privy
  const signOut = useCallback(async () => {
    setAuthToken(null)
    await logout()
  }, [logout])

  return {
    // Auth state
    isAuthenticated: authenticated && checkAuthStatus(),
    isPrivyAuthenticated: authenticated,
    isReady: ready,
    isAuthenticating,
    
    // User data
    walletAddress,
    privyUser,
    authToken,
    
    // Actions
    triggerSignIn,
    signOut,
    checkAuthStatus,
    exchangeTokens,
    
    // Privy helpers
    getAccessToken
  }
}