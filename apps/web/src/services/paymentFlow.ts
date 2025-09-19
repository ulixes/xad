// Payment Flow Service - Smart contract based campaign creation

import { parseUnits } from 'viem'
import { API_BASE_URL } from '../config/api'

export interface PaymentDetails {
  campaignId: string
  amount: string
  currency: 'USDC'
  contractAddress: string
  network: 'base' | 'base-sepolia'
  chainId: number
}

export interface Campaign {
  id: string
  status: string
  isActive: boolean
  totalBudget: number
}

const USDC_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const CAMPAIGN_PAYMENTS_ABI = [
  {
    inputs: [
      { name: 'campaignId', type: 'string' },
      { name: 'country', type: 'string' },
      { name: 'targetGender', type: 'bool' },
      { name: 'targetAge', type: 'bool' },
      { name: 'verifiedOnly', type: 'bool' },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    name: 'depositForCampaignWithPermit',
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

const USDC_ADDRESSES = {
  'base': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  'base-sepolia': '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
} as const

export class PaymentFlowService {
  static async generateCampaignId(): Promise<string> {
    // Generate a UUID for the campaign
    return crypto.randomUUID()
  }

  static getContractAddress(network: 'base' | 'base-sepolia'): string {
    // Get contract address based on network
    if (network === 'base') {
      return '0x...' // TODO: Add mainnet address when deployed
    }
    return '0xB32856642B5Ec5742ed979D31B82AB5CE30383FB' // Base Sepolia
  }

  static async processSmartContractPayment(
    campaignId: string,
    contractAddress: string,
    network: 'base' | 'base-sepolia',
    targetingParams: {
      country: string,
      targetGender: boolean,
      targetAge: boolean,
      verifiedOnly: boolean
    },
    walletClient: any,
    publicClient: any
  ) {
    
    // Ensure walletClient has an account
    if (!walletClient?.account?.address) {
      throw new Error('No wallet account found. Please reconnect your wallet.')
    }
    
    // First, get the calculated price from the contract
    const calculatedAmount = await publicClient.readContract({
      address: contractAddress,
      abi: CAMPAIGN_PAYMENTS_ABI,
      functionName: 'calculatePrice',
      args: [
        targetingParams.country,
        targetingParams.targetGender,
        targetingParams.targetAge,
        targetingParams.verifiedOnly
      ]
    })

    console.log('Processing smart contract payment:', {
      campaignId,
      calculatedAmount: calculatedAmount.toString(),
      targetingParams,
      contractAddress,
      network,
      walletAddress: walletClient.account.address
    })

    // Get USDC contract address for the network
    const usdcAddress = USDC_ADDRESSES[network]
    
    // Step 1: Check USDC balance
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletClient.account.address]
    })
    
    if (balance < calculatedAmount) {
      const requiredUSDC = Number(calculatedAmount) / 1e6
      throw new Error(`Insufficient USDC balance. Required: ${requiredUSDC} USDC`)
    }
    
    console.log('USDC balance sufficient:', balance.toString())
    
    // Step 2: Get nonce for permit
    const nonce = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'nonces',
      args: [walletClient.account.address]
    })
    
    if (nonce === null || nonce === undefined) {
      throw new Error('USDC contract does not support permit. Please ensure you are using a permit-enabled USDC token.')
    }
    
    console.log('USDC supports permit, proceeding with single transaction flow...')
    
    // Get domain separator from the contract to verify our domain matches
    const contractDomainSeparator = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'DOMAIN_SEPARATOR'
    })
    
    console.log('Permit details:', { 
      nonce: nonce.toString(), 
      contractDomainSeparator,
      signingWallet: walletClient.account.address,
      usdcAddress
    })
    
    // Create permit deadline (10 minutes from now)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)
    
    // CRITICAL: Ensure the owner in permit matches the wallet that will send the transaction
    const owner = walletClient.account.address
    
    console.log('Creating permit for owner:', owner)
    
    // Create permit message for EIP-712 signature
    const permitMessage = {
      owner: owner,
      spender: contractAddress,
      value: calculatedAmount,
      nonce: nonce,
      deadline: deadline
    }
    
    // EIP-712 domain for USDC
    // IMPORTANT: The contract uses "USDC" not "USD Coin"
    const domain = {
      name: 'USDC',  // Base Sepolia USDC implementation uses "USDC"
      version: '2',
      chainId: 84532,  // Base Sepolia chain ID
      verifyingContract: usdcAddress as `0x${string}`
    }
    
    // Log domain for debugging
    console.log('Using EIP-712 domain:', domain)
    
    // EIP-712 types for permit
    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    }
    
    console.log('Requesting permit signature...')
    
    // Sign the permit message
    const signature = await walletClient.signTypedData({
      domain,
      types,
      primaryType: 'Permit',
      message: permitMessage
    })
    
    console.log('Permit signature obtained:', signature)
    
    // Split signature into r, s, v
    const r = `0x${signature.slice(2, 66)}`
    const s = `0x${signature.slice(66, 130)}`
    const v = parseInt(signature.slice(130, 132), 16)
    
    // Step 3: Call depositForCampaignWithPermit in a single transaction
    const paymentHash = await walletClient.writeContract({
      address: contractAddress,
      abi: CAMPAIGN_PAYMENTS_ABI,
      functionName: 'depositForCampaignWithPermit',
      args: [
        campaignId,
        targetingParams.country,
        targetingParams.targetGender,
        targetingParams.targetAge,
        targetingParams.verifiedOnly,
        deadline,
        v,
        r,
        s
      ]
    })
    
    console.log('Single transaction with permit successful:', paymentHash)
    
    return {
      transactionHash: paymentHash,
      approvalHash: null
    }
  }

  static async createCampaignWithPayment(
    formData: any,
    walletAddress: string,
    walletClient: any,
    publicClient: any
  ) {
    try {
      // Step 1: Generate campaign ID
      const campaignId = await this.generateCampaignId()
      console.log('Generated campaign ID:', campaignId)
      
      // Step 2: Get contract address for current network
      const network = 'base-sepolia' // TODO: Make this dynamic based on environment
      const contractAddress = this.getContractAddress(network)
      
      // Step 3: Prepare targeting parameters for contract
      const targetingParams = {
        country: formData.country || 'all',
        targetGender: formData.gender !== 'all',
        targetAge: formData.ageRange !== 'all',
        verifiedOnly: formData.verifiedOnly || false
      }
      
      console.log('Targeting parameters:', targetingParams)
      
      // Step 4: Process smart contract payment directly
      console.log('Processing payment through smart contract...')
      const paymentResult = await this.processSmartContractPayment(
        campaignId,
        contractAddress,
        network,
        targetingParams,
        walletClient,
        publicClient
      )
      
      // Step 5: Payment sent - webhook will create campaign in database
      console.log('Payment transaction submitted:', paymentResult.transactionHash)
      
      return {
        success: true,
        campaignId: campaignId,
        transactionHash: paymentResult.transactionHash,
        message: 'Payment submitted successfully! Campaign will be created when payment is confirmed.'
      }
      
    } catch (error) {
      console.error('Campaign payment failed:', error)
      throw error
    }
  }

}