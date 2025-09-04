import React from 'react'
import { LogOut } from 'lucide-react'

interface LogoutButtonProps {
  onClick: () => void
  className?: string
  variant?: 'text' | 'contained' | 'outline'
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({ 
  onClick,
  className = '',
  variant = 'text'
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'contained':
        return 'px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg'
      case 'outline':
        return 'px-4 py-2 border-2 border-red-600 text-red-600 hover:bg-red-50 rounded-lg'
      default:
        return 'text-red-600 hover:text-red-700'
    }
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex items-center font-medium transition-colors
        ${getVariantStyles()}
        ${className}
      `}
    >
      <LogOut className="w-4 h-4 mr-1" />
      Sign Out
    </button>
  )
}