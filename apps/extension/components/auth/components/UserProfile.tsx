import React from 'react'
import { AuthUser } from '../types/auth.types'
import { formatEmail, formatPhoneNumber } from '../utils/formatters'

interface UserProfileProps {
  user: AuthUser
  className?: string
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, className = '' }) => {
  const displayName = user.email?.address || user.phone?.number || 'User'
  
  const formatDisplayName = () => {
    if (user.email?.address) {
      return user.email.address
    }
    if (user.phone?.number) {
      return formatPhoneNumber(user.phone.number)
    }
    return displayName
  }

  return (
    <div data-testid="user-profile" className={`flex items-center space-x-2 ${className}`}>
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
        {displayName[0].toUpperCase()}
      </div>
      <span className="text-sm font-medium text-gray-700">
        {formatDisplayName()}
      </span>
    </div>
  )
}