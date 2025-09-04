import React from 'react'
import { AuthView } from '../components/AuthView'
import { AuthErrorBoundary } from '../errors/AuthErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import { useClipboard } from '../hooks/useClipboard'
import { AuthWindowConfig } from '../types/auth.types'

interface AuthContainerProps {
  windowConfig?: AuthWindowConfig
  className?: string
}

export const AuthContainer: React.FC<AuthContainerProps> = ({ 
  windowConfig,
  className 
}) => {
  const auth = useAuth()
  const clipboard = useClipboard()

  const handleCopyWallet = async (address: string) => {
    await clipboard.copyAddress(address, true)
  }

  const handleCopyEmail = async (email: string) => {
    await clipboard.copyAddress(email, false)
  }

  return (
    <AuthErrorBoundary>
      <AuthView
        user={auth.user}
        state={auth.state}
        isReady={auth.isReady}
        wallets={auth.wallets}
        onLogin={auth.login}
        onLogout={auth.logout}
        onCopyWallet={handleCopyWallet}
        onCopyEmail={handleCopyEmail}
        copiedWalletAddress={clipboard.copiedWalletAddress}
        copiedAddress={clipboard.copiedAddress}
        className={className}
      />
    </AuthErrorBoundary>
  )
}