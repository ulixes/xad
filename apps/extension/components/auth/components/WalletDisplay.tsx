import React from 'react'
import { Wallet } from '@privy-io/react-auth'
import { formatWalletAddress } from '../utils/formatters'
import { CheckCircle, Copy } from 'lucide-react'

interface WalletDisplayProps {
  wallet: Wallet
  onCopy: (address: string) => void
  isCopied: boolean
  className?: string
}

export const WalletDisplay: React.FC<WalletDisplayProps> = ({ 
  wallet, 
  onCopy, 
  isCopied,
  className = '' 
}) => {
  const formattedAddress = formatWalletAddress(wallet.address)

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg ${className}`}>
      <div className="flex flex-col">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {wallet.walletClientType || 'Wallet'}
        </span>
        <span className="text-sm font-mono text-gray-800">
          {formattedAddress}
        </span>
      </div>
      
      <button
        onClick={() => onCopy(wallet.address)}
        className="p-1.5 rounded hover:bg-gray-200 transition-colors"
        aria-label="Copy wallet address"
      >
        {isCopied ? (
          <CheckCircle className="w-4 h-4 text-green-600" />
        ) : (
          <Copy className="w-4 h-4 text-gray-600" />
        )}
      </button>
    </div>
  )
}