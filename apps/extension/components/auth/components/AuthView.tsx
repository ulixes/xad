import React from 'react'
import { Wallet } from '@privy-io/react-auth'
import { AuthUser, AuthenticationState } from '../types/auth.types'
import { LoginButton } from './LoginButton'
import { LogoutButton } from './LogoutButton'
import { UserProfile } from './UserProfile'
import { WalletDisplay } from './WalletDisplay'
import { AuthStatusIndicator } from './AuthStatusIndicator'

interface AuthViewProps {
  user: AuthUser | null
  state: AuthenticationState
  isReady: boolean
  wallets: Wallet[]
  onLogin: () => void
  onLogout: () => void
  onCopyWallet: (address: string) => void
  onCopyEmail: (email: string) => void
  copiedWalletAddress: string | null
  copiedAddress: string | null
  className?: string
}

export const AuthView: React.FC<AuthViewProps> = ({
  user,
  state,
  isReady,
  wallets,
  onLogin,
  onLogout,
  onCopyWallet,
  copiedWalletAddress,
  className = ''
}) => {
  if (!isReady) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={`space-y-4 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Authentication</h2>
        <AuthStatusIndicator state={state} />
      </div>

      {state === 'authenticated' && user ? (
        <div className="space-y-3">
          <UserProfile user={user} />
          
          {wallets.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Connected Wallets</h3>
              {wallets.map(wallet => (
                <WalletDisplay
                  key={wallet.address}
                  wallet={wallet}
                  onCopy={onCopyWallet}
                  isCopied={copiedWalletAddress === wallet.address}
                />
              ))}
            </div>
          )}

          <div className="pt-2">
            <LogoutButton onClick={onLogout} variant="outline" />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Sign in to access your account and connected wallets
          </p>
          <LoginButton 
            onClick={onLogin} 
            isLoading={state === 'authenticating'}
          />
        </div>
      )}
    </div>
  )
}