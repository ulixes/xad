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
    
    // Get JWT token for authentication
    let token = localStorage.getItem('auth_token')
    
    // Fallback: check for SIWX session if no token
    if (!token) {
      const siwxSessionKeys = Object.keys(localStorage).filter(k => k.startsWith('siwx-session'))
      if (siwxSessionKeys.length > 0) {
        const sessionData = JSON.parse(localStorage.getItem(siwxSessionKeys[0]) || '{}')
        if (sessionData.message && sessionData.signature) {
          try {
            const response = await fetch('/api/auth/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                message: sessionData.data?.message, 
                signature: sessionData.signature 
              })
            })
            
            if (response.ok) {
              const { success, token: verifiedToken } = await response.json()
              if (success && verifiedToken) {
                localStorage.setItem('auth_token', verifiedToken)
                token = verifiedToken
              }
            }
          } catch (error) {
            console.error('SIWX verification error:', error)
          }
        }
      }
    }
    
    // Development bypass if still no token
    if (!token && walletAddress && process.env.NODE_ENV === 'development') {
      try {
        const bypassResponse = await fetch('/api/auth/bypass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: walletAddress })
        })
        
        if (bypassResponse.ok) {
          const { token: bypassToken } = await bypassResponse.json()
          localStorage.setItem('auth_token', bypassToken)
          token = bypassToken
        }
      } catch (error) {
        console.error('Development bypass failed:', error)
      }
    }
    
    if (!token) {
      throw new Error('Please sign in with your wallet first')
    }
    
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...formData, brandWalletAddress: walletAddress })
    })
    
    // Get response text first
    const responseText = await response.text()
    
    if (!response.ok) {
      let errorData
      try {
        errorData = responseText ? JSON.parse(responseText) : { error: 'Unknown error' }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError)
        throw new Error(`Server error: ${response.status} - ${responseText}`)
      }
      throw new Error(errorData.error || 'Failed to create campaign')
    }
    
    if (!responseText) {
      throw new Error('Empty response from server')
    }
    
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      console.error('Failed to parse success response:', parseError)
      throw new Error(`Invalid JSON response: ${responseText}`)
    }
    
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
        
        // Convert USD to ETH (rough estimate: $2000/ETH for demo)
        const ethAmount = parseEther((dollarAmount / 2000).toString())
        
        // Simple ETH transfer
        const hash = await walletClient.sendTransaction({
          to: config.escrowContract || '0x16a5274cCd454f90E99Ea013c89c38381b635f5b', // Use config or fallback
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
   * Step 3: Update campaign with payment details (async for better UX)
   */
  static async confirmPayment(campaignId: string, paymentData: any) {
    // Start confirmation in background but don't wait for it
    const confirmationPromise = this.confirmPaymentBackground(campaignId, paymentData)
    
    // Return immediately with transaction data - user doesn't need to wait
    return {
      success: true,
      transactionHash: paymentData.transactionHash,
      campaignId,
      confirmation: confirmationPromise // Background promise for monitoring
    }
  }

  /**
   * Background payment confirmation that happens async
   */
  private static async confirmPaymentBackground(campaignId: string, paymentData: any) {
    try {
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
        console.error(`Background payment confirmation failed: ${errorText}`)
        return { success: false, error: errorText }
      }
      
      // Safely parse JSON response
      const text = await response.text()
      if (!text) {
        console.error('Empty response from payment confirmation')
        return { success: false, error: 'Empty response' }
      }
      
      try {
        const result = JSON.parse(text)
        console.log('Payment confirmation completed in background:', result)
        return { success: true, data: result }
      } catch (parseError) {
        console.error('Failed to parse payment response:', text)
        return { success: false, error: 'Invalid response format' }
      }
    } catch (error) {
      console.error('Background payment confirmation error:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
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
      const campaign = await PaymentFlowService.createDraftCampaign(formData, walletAddress)
      
      // Step 2: Process blockchain payment
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
      
      // Step 3: Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: paymentResult.transactionHash,
        timeout: 60_000 // 60 second timeout
      })
      
      if (receipt.status === 'success') {
        
        // Step 4: Start payment confirmation in background (don't wait)
        const confirmationResult = await PaymentFlowService.confirmPayment(campaign.id, {
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
          network: paymentResult.network,
          backgroundConfirmation: confirmationResult.confirmation
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