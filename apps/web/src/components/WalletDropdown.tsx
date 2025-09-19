import { useState } from 'react'
import { Copy, Check, Wallet, ExternalLink, Plus, LogOut } from 'lucide-react'
import { useFundWallet } from '@privy-io/react-auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Button } from './ui/button'

interface WalletDropdownProps {
  address: string
  onSignOut?: () => void
  // For Storybook
  mockFundWallet?: boolean
}

export function WalletDropdown({ 
  address, 
  onSignOut,
  mockFundWallet = false 
}: WalletDropdownProps) {
  const [copied, setCopied] = useState(false)
  
  // Only use the hook if not in Storybook
  const { fundWallet } = mockFundWallet ? { fundWallet: async () => {} } : useFundWallet()

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // Handle copy address
  const handleCopy = async () => {
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Handle add funds
  const handleAddFunds = async () => {
    if (!mockFundWallet) {
      await fundWallet(address)
    } else {
      console.log('Mock: Opening fund wallet modal for', address)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline"
          className="flex items-center gap-2 border-gray-800 bg-gray-900 hover:bg-gray-800 text-gray-100"
        >
          <Wallet className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-medium">{formatAddress(address)}</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64 bg-gray-900 border-gray-800" align="end">
        {/* Wallet Address Section */}
        <div className="p-3 mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">Wallet Address</span>
            {copied && (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Copied!
              </span>
            )}
          </div>
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-2">
            <span className="text-sm font-mono text-gray-200">
              {formatAddress(address)}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded hover:bg-gray-700 transition-colors"
              title="Copy full address"
            >
              <Copy className="w-3 h-3 text-gray-400 hover:text-gray-200" />
            </button>
          </div>
        </div>

        {/* Add Funds */}
        <DropdownMenuItem 
          onClick={handleAddFunds}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
        >
          <Plus className="w-4 h-4 text-indigo-400" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-100">Add Funds</div>
            <div className="text-xs text-gray-400">Buy ETH & USDC with card</div>
          </div>
          <ExternalLink className="w-4 h-4 text-gray-500" />
        </DropdownMenuItem>

        {/* View on Explorer */}
        <DropdownMenuItem asChild>
          <a
            href={`https://sepolia.basescan.org/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-100">View on Explorer</div>
              <div className="text-xs text-gray-400">Base Sepolia</div>
            </div>
          </a>
        </DropdownMenuItem>

        {/* Sign Out */}
        {onSignOut && (
          <>
            <DropdownMenuSeparator className="bg-gray-800" />
            <DropdownMenuItem
              onClick={onSignOut}
              className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-red-900/20 focus:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                Sign Out
              </span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}