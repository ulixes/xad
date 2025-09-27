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
      address: process.env.CAMPAIGN_PAYMENTS_CONTRACT_ADDRESS || '0x7ADb15928831C4591e2B629CBd87aa1EC09fc38C',
      network: 'base',
      chainId: 8453,
      usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      blockExplorer: 'https://basescan.org',
      rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org'
    };
  } else {
    return {
      address: process.env.CAMPAIGN_PAYMENTS_CONTRACT_ADDRESS || '0x7ADb15928831C4591e2B629CBd87aa1EC09fc38C',
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
      { "name": "campaignId", "type": "string" },
      { 
        "name": "params", 
        "type": "tuple",
        "components": [
          { "name": "country", "type": "string" },
          { "name": "targetGender", "type": "bool" },
          { "name": "targetAge", "type": "bool" },
          { "name": "verifiedOnly", "type": "bool" }
        ]
      },
      { "name": "targets", "type": "string" },
      { "name": "deadline", "type": "uint256" },
      { "name": "v", "type": "uint8" },
      { "name": "r", "type": "bytes32" },
      { "name": "s", "type": "bytes32" }
    ],
    "name": "depositForCampaignWithPermit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "name": "campaignId", "type": "string" },
      { "indexed": true, "name": "sender", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" },
      { "indexed": false, "name": "targets", "type": "string" }
    ],
    "name": "CampaignPaymentReceived",
    "type": "event"
  },
  {
    "inputs": [
      { "name": "country", "type": "string" },
      { "name": "targetGender", "type": "bool" },
      { "name": "targetAge", "type": "bool" },
      { "name": "verifiedOnly", "type": "bool" }
    ],
    "name": "calculatePrice",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;