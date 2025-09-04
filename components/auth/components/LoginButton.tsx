import React from 'react'
import { LogIn } from 'lucide-react'

interface LoginButtonProps {
  onClick: () => void
  isLoading?: boolean
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
}

export const LoginButton: React.FC<LoginButtonProps> = ({ 
  onClick, 
  isLoading = false,
  className = '',
  variant = 'primary'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white'
      case 'outline':
        return 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      data-testid="login-button"
      className={`
        flex items-center justify-center px-4 py-2 rounded-lg font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantStyles()}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
          Signing in...
        </>
      ) : (
        <>
          <LogIn className="w-4 h-4 mr-2" />
          Sign In
        </>
      )}
    </button>
  )
}