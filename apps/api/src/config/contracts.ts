export interface ContractConfig {
  address: string;
  network: 'base' | 'base-sepolia';
  chainId: number;
  usdcAddress: string;
  blockExplorer: string;
  rpcUrl: string;
}

export function getContractConfig(): ContractConfig {
  const environment = process.env.ENVIRONMENT || 'development';
  
  if (environment === 'production') {
    return {
      address: process.env.CAMPAIGN_PAYMENTS_CONTRACT_ADDRESS || '',
      network: 'base',
      chainId: 8453,
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      blockExplorer: 'https://basescan.org',
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    };
  } else {
    return {
      address: process.env.CAMPAIGN_PAYMENTS_CONTRACT_ADDRESS || '',
      network: 'base-sepolia',
      chainId: 84532,
      usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      blockExplorer: 'https://sepolia.basescan.org',
      rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org'
    };
  }
}

export const CAMPAIGN_PAYMENTS_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "campaignId", "type": "string" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "depositForCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "string", "name": "campaignId", "type": "string" },
      { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
      { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "CampaignPaymentReceived",
    "type": "event"
  }
] as const;