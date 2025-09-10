// Payment Flow Service - handles the complete payment process

import { parseEther, formatUnits } from 'viem'
import { useWalletClient, usePublicClient } from 'wagmi'
import { getNetworkConfig, USDC_ABI, formatPaymentAmount, validateNetwork, getNetworkSwitchMessage } from '../config/networks'

export interface CampaignPaymentData {
  campaignId: string
  totalAmount: string // in USD
  actions: Array<{
    type: string
    target: string
    price: number
    maxVolume: number
  }>
  targetingRules: any
  platform: string
}

export class PaymentFlowService {
  
  /**
   * Step 1: Create draft campaign in database
   */
  static async createDraftCampaign(formData: any, walletAddress: string) {
    console.log('Creating campaign:', { ...formData, brandWalletAddress: walletAddress })
    
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, brandWalletAddress: walletAddress })
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create campaign')
    }
    
    const result = await response.json()
    return result.campaign
  }

  /**
   * Step 2: Process blockchain payment using USDC
   */
  static async processPayment(campaignData: CampaignPaymentData, walletClient: any, publicClient: any) {
    const config = getNetworkConfig()
    
    // Validate network
    const chainId = await walletClient.getChainId()
    if (!validateNetwork(chainId)) {
      throw new Error(getNetworkSwitchMessage())
    }
    
    const dollarAmount = parseFloat(campaignData.totalAmount)
    const usdcAmount = formatPaymentAmount(dollarAmount, 6) // USDC has 6 decimals
    
    try {
      // Option A: Simple USDC transfer to escrow contract
      if (config.escrowContract && config.paymentToken) {
        console.log(`Transferring ${dollarAmount} USDC to escrow contract...`)
        
        // First check USDC balance
        const balance = await publicClient.readContract({
          address: config.paymentToken,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [walletClient.account.address]
        })
        
        if (balance < usdcAmount) {
          throw new Error(`Insufficient USDC balance. Need $${dollarAmount}, have $${formatUnits(balance, 6)}`)
        }
        
        // Transfer USDC to escrow
        const hash = await walletClient.writeContract({
          address: config.paymentToken,
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [config.escrowContract, usdcAmount]
        })
        
        return { 
          transactionHash: hash, 
          amount: campaignData.totalAmount,
          currency: 'USDC',
          network: config.networkName
        }
      } else {
        // Option B: Fallback to ETH transfer (for demo purposes)
        console.log(`Transferring ${campaignData.totalAmount} ETH equivalent...`)
        
        // Convert USD to ETH (rough estimate: $2000/ETH for demo)
        const ethAmount = parseEther((dollarAmount / 2000).toString())
        
        // Simple ETH transfer
        const hash = await walletClient.sendTransaction({
          to: '0x1234567890123456789012345678901234567890', // Demo address
          value: ethAmount,
          data: `0x${Buffer.from(campaignData.campaignId).toString('hex')}`
        })
        
        return { 
          transactionHash: hash, 
          amount: (dollarAmount / 2000).toString(),
          currency: 'ETH',
          network: config.networkName
        }
      }
    } catch (error) {
      console.error('Payment failed:', error)
      
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      // Handle specific wallet errors
      if (errorMessage.includes('User rejected')) {
        throw new Error('Transaction cancelled by user')
      } else if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient funds in wallet')
      } else if (errorMessage.includes('network')) {
        throw new Error(getNetworkSwitchMessage())
      }
      
      throw new Error(`Payment failed: ${errorMessage || 'Unknown error'}`)
    }
  }

  /**
   * Step 3: Update campaign with payment details
   */
  static async confirmPayment(campaignId: string, paymentData: any) {
    const response = await fetch(`/api/campaigns/${campaignId}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionHash: paymentData.transactionHash,
        amount: paymentData.amount,
        blockNumber: paymentData.blockNumber,
        gasUsed: paymentData.gasUsed,
        status: 'completed'
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to confirm payment: ${errorText}`)
    }
    
    // Safely parse JSON response
    const text = await response.text()
    if (!text) {
      throw new Error('Empty response from payment confirmation')
    }
    
    try {
      return JSON.parse(text)
    } catch (parseError) {
      console.error('Failed to parse payment response:', text)
      throw new Error('Invalid response format from server')
    }
  }

  /**
   * Step 4: Activate campaign after payment confirmation
   */
  static async activateCampaign(campaignId: string) {
    const response = await fetch(`/api/campaigns/${campaignId}/activate`, {
      method: 'POST'
    })
    
    if (!response.ok) {
      throw new Error('Failed to activate campaign')
    }
    
    return response.json()
  }
}

/**
 * Complete payment flow hook for React components
 */
export function usePaymentFlow() {
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  
  const processFullPayment = async (formData: any, walletAddress: string) => {
    if (!walletClient) {
      throw new Error('Wallet not connected')
    }

    if (!publicClient) {
      throw new Error('Network connection failed')
    }

    try {
      // Step 1: Create draft campaign
      console.log('Step 1: Creating draft campaign...')
      const campaign = await PaymentFlowService.createDraftCampaign(formData, walletAddress)
      
      // Step 2: Process blockchain payment
      console.log('Step 2: Processing blockchain payment...')
      const paymentResult = await PaymentFlowService.processPayment(
        {
          campaignId: campaign.id,
          totalAmount: formData.totalAmount,
          actions: formData.actions,
          targetingRules: formData.targetingRules,
          platform: formData.platform
        },
        walletClient,
        publicClient
      )
      
      console.log('Payment transaction submitted:', paymentResult.transactionHash)
      
      // Step 3: Wait for transaction confirmation
      console.log('Step 3: Waiting for transaction confirmation...')
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: paymentResult.transactionHash,
        timeout: 60_000 // 60 second timeout
      })
      
      if (receipt.status === 'success') {
        console.log('Transaction confirmed!', {
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed
        })
        
        // Step 4: Confirm payment in backend and create individual actions
        console.log('Step 4: Confirming payment and creating actions...')
        await PaymentFlowService.confirmPayment(campaign.id, {
          ...paymentResult,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString()
        })
        
        return {
          success: true,
          campaign: campaign,
          transactionHash: paymentResult.transactionHash,
          blockNumber: receipt.blockNumber.toString(),
          gasUsed: receipt.gasUsed.toString(),
          currency: paymentResult.currency,
          network: paymentResult.network
        }
      } else {
        throw new Error('Transaction failed on blockchain')
      }
      
    } catch (error) {
      console.error('Payment flow failed:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage || 'Payment failed'
      }
    }
  }
  
  return { processFullPayment }
}