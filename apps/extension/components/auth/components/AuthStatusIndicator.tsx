import React from 'react'
import { AuthenticationState } from '../types/auth.types'

interface AuthStatusIndicatorProps {
  state: AuthenticationState
  className?: string
}

export const AuthStatusIndicator: React.FC<AuthStatusIndicatorProps> = ({ 
  state,
  className = ''
}) => {
  const getStatusColor = () => {
    switch (state) {
      case 'authenticated':
        return 'bg-green-500'
      case 'authenticating':
        return 'bg-yellow-500 animate-pulse'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-400'
    }
  }

  const getStatusText = () => {
    switch (state) {
      case 'authenticated':
        return 'Connected'
      case 'authenticating':
        return 'Connecting...'
      case 'error':
        return 'Error'
      default:
        return 'Not connected'
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-xs text-gray-600">
        {getStatusText()}
      </span>
    </div>
  )
}