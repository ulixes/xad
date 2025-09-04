import { useCallback } from 'react'
import { usePrivy, useLogin, useWallets } from '@privy-io/react-auth'
import { 
  AuthenticationStatus
} from '../types/auth.types'

export const useAuth = () => {
  const privy = usePrivy()
  const { login } = useLogin()
  const { wallets } = useWallets()
  
  // Derive authentication status directly from Privy
  const status: AuthenticationStatus = {
    state: !privy.ready ? 'unauthenticated' : 
           privy.authenticated ? 'authenticated' : 'unauthenticated',
    user: privy.user || null,
    isReady: privy.ready,
    error: null
  }

  const handleLogin = useCallback(async () => {
    await login()
  }, [login])

  const handleLogout = useCallback(async () => {
    await privy.logout()
  }, [privy])

  return {
    ...status,
    login: handleLogin,
    logout: handleLogout,
    wallets: wallets || []
  }
}