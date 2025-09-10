import { base, baseSepolia } from '@reown/appkit/networks'

// Environment-based network configuration
export const getNetworkConfig = () => {
  const networkEnv = import.meta.env.VITE_NETWORK_ENV || 'development'
  const isProduction = networkEnv === 'production'
  
  return {
    // Network selection
    network: isProduction ? base : baseSepolia,
    networkName: isProduction ? 'Base' : 'Base Sepolia',
    
    // Contract addresses
    escrowContract: isProduction 
      ? import.meta.env.VITE_ESCROW_CONTRACT_MAINNET
      : import.meta.env.VITE_ESCROW_CONTRACT_SEPOLIA,
    
    // Payment token (USDC)
    paymentToken: isProduction
      ? import.meta.env.VITE_PAYMENT_TOKEN_MAINNET
      : import.meta.env.VITE_PAYMENT_TOKEN_SEPOLIA,
    
    // RPC URLs
    rpcUrl: isProduction
      ? import.meta.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org'
      : import.meta.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
      
    // Chain IDs  
    chainId: isProduction ? 8453 : 84532,
    
    // Faucet info for testnet
    faucetUrl: isProduction ? null : 'https://www.coinbase.com/faucets/base-sepolia-faucet',
    
    // Block explorer
    blockExplorer: isProduction 
      ? 'https://basescan.org'
      : 'https://sepolia.basescan.org',
      
    // Environment flags
    isProduction,
    isDevelopment: !isProduction
  }
}

// USDC Contract ABI (for token payments)
export const USDC_ABI = [
  {
    "inputs": [
      { "name": "to", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Simple Escrow Contract ABI (you'll need to deploy this)
export const ESCROW_ABI = [
  {
    "inputs": [
      { "name": "campaignId", "type": "bytes32" },
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "depositForCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

// Payment amount helpers
export const formatPaymentAmount = (dollarAmount: number, tokenDecimals: number = 6): bigint => {
  // For USDC: 6 decimals, so $100 = 100000000 (100 * 10^6)
  return BigInt(Math.round(dollarAmount * Math.pow(10, tokenDecimals)))
}

export const formatDisplayAmount = (tokenAmount: bigint, tokenDecimals: number = 6): string => {
  const divisor = Math.pow(10, tokenDecimals)
  const amount = Number(tokenAmount) / divisor
  return `$${amount.toFixed(2)}`
}

// Network validation
export const validateNetwork = (chainId: number): boolean => {
  const config = getNetworkConfig()
  return chainId === config.chainId
}

export const getNetworkSwitchMessage = (): string => {
  const config = getNetworkConfig()
  return `Please switch to ${config.networkName} network to continue`
}