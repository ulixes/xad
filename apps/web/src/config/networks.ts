import { base, baseSepolia } from '@reown/appkit/networks'

// Environment-based network configuration
export const getNetworkConfig = () => {
  const networkEnv = import.meta.env.VITE_NETWORK_ENV || 'development'
  const isProduction = networkEnv === 'production'
  
  return {
    // Network selection
    network: isProduction ? base : baseSepolia,
    networkName: isProduction ? 'Base' : 'Base Sepolia',
    chainId: isProduction ? 8453 : 84532,
    
    // Smart Contract (CampaignPayments)
    campaignPaymentsContract: import.meta.env.VITE_CONTRACT_ADDRESS || 
      '0xB32856642B5Ec5742ed979D31B82AB5CE30383FB', // Base Sepolia deployment
    
    // USDC Token Address (payment currency)
    usdcAddress: isProduction
      ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // Base Mainnet USDC
      : '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Base Sepolia USDC
    
    // RPC URLs
    rpcUrl: isProduction
      ? 'https://mainnet.base.org'
      : 'https://sepolia.base.org',
    
    // Block explorer
    blockExplorer: isProduction 
      ? 'https://basescan.org'
      : 'https://sepolia.basescan.org',
    
    // Faucet info for testnet
    faucetUrl: isProduction ? null : 'https://www.alchemy.com/faucets/base-sepolia',
    usdcFaucetUrl: isProduction ? null : 'https://faucet.circle.com/', // Circle's USDC faucet
      
    // Environment flags
    isProduction,
    isDevelopment: !isProduction
  }
}

// USDC has 6 decimals
export const USDC_DECIMALS = 6

// Export commonly used ABIs
export const USDC_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

export const CAMPAIGN_PAYMENTS_ABI = [
  {
    inputs: [
      { name: 'campaignId', type: 'string' },
      { name: 'country', type: 'string' },
      { name: 'targetGender', type: 'bool' },
      { name: 'targetAge', type: 'bool' },
      { name: 'verifiedOnly', type: 'bool' }
    ],
    name: 'depositForCampaign',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'country', type: 'string' },
      { name: 'targetGender', type: 'bool' },
      { name: 'targetAge', type: 'bool' },
      { name: 'verifiedOnly', type: 'bool' }
    ],
    name: 'calculatePrice',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const