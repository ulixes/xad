// Payment Flow Service - Two-phase campaign creation with proper state tracking

import { parseEther, formatUnits, toHex } from 'viem'
import { useWalletClient, usePublicClient } from 'wagmi'
import { getNetworkConfig, USDC_ABI, formatPaymentAmount, validateNetwork, getNetworkSwitchMessage } from '../config/networks'
import { API_BASE_URL } from '../config/api'

export interface PaymentDetails {
  campaignId: string
  amount: string
  currency: string
  toAddress: string
  reference: string
  network: string
}

export class PaymentFlowService {
  
  /**
   * Step 1: Create draft campaign (before payment)
   */
  static async createDraftCampaign(formData: any, walletAddress: string) {
    console.log('Creating draft campaign:', { ...formData, brandWalletAddress: walletAddress })
    
    // Get JWT token for authentication
    let token = localStorage.getItem('auth_token')
    
    // Fallback: check for SIWX session if no token
    if (!token) {
      const siwxSessionKeys = Object.keys(localStorage).filter(k => k.startsWith('siwx-session'))
      if (siwxSessionKeys.length > 0) {
        const sessionData = JSON.parse(localStorage.getItem(siwxSessionKeys[0]) || '{}')
        if (sessionData.message && sessionData.signature) {
          try {
            const response = await fetch(`${API_BASE_URL}/auth/verify`, {
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
        const bypassResponse = await fetch(`${API_BASE_URL}/auth/bypass`, {
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
    
    const response = await fetch(`${API_BASE_URL}/campaigns/draft`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ...formData, brandWalletAddress: walletAddress })
    })
    
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
    
    return result
  }
  
  /**
   * Step 2: Process blockchain payment with reference
   */
  static async processPaymentWithReference(paymentDetails: PaymentDetails, walletClient: any, publicClient: any) {
    console.log('processPaymentWithReference called with:', paymentDetails)
    
    const config = getNetworkConfig()
    
    // Validate network
    const chainId = await walletClient.getChainId()
    if (!validateNetwork(chainId)) {
      throw new Error(getNetworkSwitchMessage())
    }
    
    try {
      if (paymentDetails.currency === 'USDC') {
        // USDC Payment - amount is in dollars
        const dollarAmount = parseFloat(paymentDetails.amount)
        const usdcAmount = formatPaymentAmount(dollarAmount, 6)
        
        // Check USDC balance
        const balance = await publicClient.readContract({
          address: config.paymentToken,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [walletClient.account.address]
        })
        
        console.log('USDC Payment validation:', {
          network: config.networkName,
          userBalance: formatUnits(balance, 6),
          required: formatUnits(usdcAmount, 6),
          sufficient: balance >= usdcAmount
        })
        
        if (balance < usdcAmount) {
          throw new Error(`Insufficient USDC balance. Need $${dollarAmount}, have $${formatUnits(balance, 6)}`)
        }
        
        // Transfer USDC (Note: can't include reference in standard ERC20 transfer)
        const hash = await walletClient.writeContract({
          address: config.paymentToken,
          abi: USDC_ABI,
          functionName: 'transfer',
          args: [paymentDetails.toAddress, usdcAmount]
        })
        
        return { 
          transactionHash: hash, 
          amount: paymentDetails.amount,
          currency: 'USDC',
          network: paymentDetails.network
        }
      } else {
        // ETH Payment - amount from API is already in ETH
        const ethAmountFromApi = paymentDetails.amount
        
        console.log('ETH Payment Debug:', {
          ethAmountFromApi,
          ethToUsdRate: config.ethToUsdRate,
        })
        
        // Parse the ETH amount directly - it's already in ETH from the API
        const ethAmount = parseEther(ethAmountFromApi)
        
        console.log('ETH Amount Debug:', {
          ethAmountBigInt: ethAmount.toString(),
          ethAmountFormatted: formatUnits(ethAmount, 18)
        })
        
        // Get ETH balance
        const ethBalance = await publicClient.getBalance({
          address: walletClient.account.address
        })
        
        console.log('ETH Payment validation:', {
          network: config.networkName,
          ethToUsdRate: config.ethToUsdRate,
          userBalance: formatUnits(ethBalance, 18),
          required: formatUnits(ethAmount, 18),
          sufficient: ethBalance >= ethAmount
        })
        
        if (ethBalance < ethAmount) {
          throw new Error(`Insufficient ETH balance. Need ${formatUnits(ethAmount, 18)} ETH, have ${formatUnits(ethBalance, 18)} ETH`)
        }
        
        // ETH transfer with campaign reference in data field
        console.log('Sending ETH payment:', {
          to: paymentDetails.toAddress,
          amount: formatUnits(ethAmount, 18),
          reference: paymentDetails.reference
        })
        
        // Include campaign reference in transaction data
        const data = toHex(paymentDetails.reference)
        
        const hash = await walletClient.sendTransaction({
          to: paymentDetails.toAddress,
          value: ethAmount,
          data: data as `0x${string}`
        })
        
        return { 
          transactionHash: hash, 
          amount: paymentDetails.amount,
          currency: 'ETH',
          network: paymentDetails.network
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
   * Step 3: Confirm payment with API
   */
  static async confirmCampaignPayment(campaignId: string, transactionHash: string, currency: string) {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      throw new Error('Authentication required')
    }
    
    const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        transactionHash,
        currency
      })
    })
    
    const responseText = await response.text()
    
    if (!response.ok) {
      let errorData
      try {
        errorData = responseText ? JSON.parse(responseText) : { error: 'Unknown error' }
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} - ${responseText}`)
      }
      throw new Error(errorData.error || 'Failed to confirm payment')
    }
    
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`)
    }
    
    return result.campaign
  }

  /**
   * Complete two-phase payment flow
   */
  static async createCampaignWithPayment(formData: any, walletAddress: string, walletClient: any, publicClient: any) {
    try {
      console.log('=== PAYMENT FLOW START ===')
      
      // Step 1: Create draft campaign
      console.log('Step 1: Creating draft campaign...')
      const draftResult = await this.createDraftCampaign(formData, walletAddress)
      
      if (!draftResult.success || !draftResult.paymentDetails) {
        throw new Error('Failed to create draft campaign')
      }
      
      const campaign = draftResult.campaign
      const paymentDetails = draftResult.paymentDetails as PaymentDetails
      
      console.log('Draft campaign created:', campaign.id)
      
      // Step 2: Process payment
      console.log('Step 2: Processing payment...')
      const paymentResult = await this.processPaymentWithReference(
        paymentDetails,
        walletClient,
        publicClient
      )
      
      console.log('Payment submitted:', paymentResult.transactionHash)
      
      // Step 3: Wait for confirmation
      console.log('Step 3: Waiting for confirmation...')
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: paymentResult.transactionHash,
        timeout: 60_000
      })
      
      if (receipt.status !== 'success') {
        throw new Error('Transaction failed on blockchain')
      }
      
      console.log('Transaction confirmed')
      
      // Step 4: Confirm payment with API
      console.log('Step 4: Confirming payment with API...')
      const confirmedCampaign = await this.confirmCampaignPayment(
        campaign.id,
        paymentResult.transactionHash,
        paymentDetails.currency
      )
      
      console.log('Campaign activated successfully!')
      
      return {
        success: true,
        campaign: confirmedCampaign,
        transactionHash: paymentResult.transactionHash,
        blockNumber: receipt.blockNumber.toString(),
        gasUsed: receipt.gasUsed.toString(),
        currency: paymentDetails.currency,
        network: paymentDetails.network
      }
      
    } catch (error) {
      console.error('Payment flow error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        success: false,
        error: errorMessage
      }
    }
  }
}

/**
 * React hook for the payment flow
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

    return PaymentFlowService.createCampaignWithPayment(
      formData,
      walletAddress,
      walletClient,
      publicClient
    )
  }
  
  return { processFullPayment }
}