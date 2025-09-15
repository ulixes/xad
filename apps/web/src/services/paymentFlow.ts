// Payment Flow Service - handles the complete payment process

import { parseEther, formatUnits } from 'viem'
import { useWalletClient, usePublicClient } from 'wagmi'
import { getNetworkConfig, USDC_ABI, formatPaymentAmount, validateNetwork, getNetworkSwitchMessage } from '../config/networks'
import { API_BASE_URL } from '../config/api'

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
   * Create campaign in database (called after payment confirmation)
   */
  static async createCampaign(formData: any, walletAddress: string, _paymentData: any) {
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
    
    const response = await fetch(`${API_BASE_URL}/campaigns`, {
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
   * Process blockchain payment (ETH for testnet, USDC for mainnet)
   */
  static async processPayment(formData: any, _walletAddress: string, walletClient: any, publicClient: any) {
    const config = getNetworkConfig()
    
    // Validate network
    const chainId = await walletClient.getChainId()
    if (!validateNetwork(chainId)) {
      throw new Error(getNetworkSwitchMessage())
    }
    
    const dollarAmount = parseFloat(formData.totalAmount)
    const usdcAmount = formatPaymentAmount(dollarAmount, 6) // USDC has 6 decimals
    
    try {
      // Environment-based payment method selection
      // Test environment (Base Sepolia): Use ETH
      // Production environment (Base Mainnet): Use USDC
      const USE_USDC = config.isProduction
      
      console.log('Payment method configuration:', {
        environment: config.isProduction ? 'production' : 'test',
        network: config.networkName,
        paymentMethod: USE_USDC ? 'USDC' : 'ETH',
        chainId: chainId
      })
      
      if (USE_USDC && config.escrowContract && config.paymentToken) {
        
        // First check USDC balance
        const balance = await publicClient.readContract({
          address: config.paymentToken,
          abi: USDC_ABI,
          functionName: 'balanceOf',
          args: [walletClient.account.address]
        })
        
        // Log balance details for debugging
        console.log('USDC Payment validation:', {
          network: config.networkName,
          chainId: chainId,
          userAddress: walletClient.account.address,
          usdcContract: config.paymentToken,
          userBalance: {
            raw: balance.toString(),
            formatted: formatUnits(balance, 6),
            inUSD: `$${formatUnits(balance, 6)}`
          },
          required: {
            raw: usdcAmount.toString(),
            formatted: formatUnits(usdcAmount, 6),
            inUSD: `$${dollarAmount}`
          },
          sufficient: balance >= usdcAmount
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
          amount: formData.totalAmount,
          currency: 'USDC',
          network: config.networkName
        }
      } else {
        // Option B: ETH payment for testnet (Base Sepolia)
        console.log('Using ETH payment for testnet')
        
        // Simple conversion: $1 = 0.0002 ETH (so $10 = 0.002 ETH, $100 = 0.02 ETH)
        const ETH_PER_DOLLAR = 0.0002
        const ethAmount = parseEther((dollarAmount * ETH_PER_DOLLAR).toString())
        
        // Get ETH balance
        const ethBalance = await publicClient.getBalance({
          address: walletClient.account.address
        })
        
        // Log ETH payment details (testnet only)
        console.log('ETH Payment validation (Testnet):', {
          environment: 'TEST',
          network: config.networkName,
          chainId: chainId,
          conversionRate: `$1 = ${ETH_PER_DOLLAR} ETH`,
          userAddress: walletClient.account.address,
          userBalance: {
            raw: ethBalance.toString(),
            formatted: formatUnits(ethBalance, 18),
            inETH: `${formatUnits(ethBalance, 18)} ETH`
          },
          required: {
            raw: ethAmount.toString(),
            formatted: formatUnits(ethAmount, 18),
            inETH: `${formatUnits(ethAmount, 18)} ETH`,
            inUSD: `$${dollarAmount}`
          },
          sufficient: ethBalance >= ethAmount
        })
        
        if (ethBalance < ethAmount) {
          throw new Error(`Insufficient ETH balance. Need ${formatUnits(ethAmount, 18)} ETH for testnet payment, have ${formatUnits(ethBalance, 18)} ETH`)
        }
        
        // Simple ETH transfer - use the escrow contract from config
        const escrowAddress = config.escrowContract || '0x16a5274cCd454f90E99Ea013c89c38381b635f5b'
        console.log('Sending ETH to escrow:', escrowAddress)
        
        const hash = await walletClient.sendTransaction({
          to: escrowAddress,
          value: ethAmount
        })
        
        return { 
          transactionHash: hash, 
          amount: formatUnits(ethAmount, 18),
          currency: 'ETH (testnet)',
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
   * Create campaign and record payment in one step (after blockchain confirmation)
   */
  static async createCampaignWithPayment(formData: any, walletAddress: string, paymentData: any) {
    // Get JWT token for authentication
    let token = localStorage.getItem('auth_token')
    
    if (!token && walletAddress) {
      // Try to get or create token
      try {
        const response = await fetch(`${API_BASE_URL}/auth/bypass`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address: walletAddress })
        })
        
        if (response.ok) {
          const { token: bypassToken } = await response.json()
          localStorage.setItem('auth_token', bypassToken)
          token = bypassToken
        }
      } catch (error) {
        console.error('Auth failed:', error)
      }
    }
    
    if (!token) {
      throw new Error('Please sign in with your wallet first')
    }
    
    // Create campaign with payment data
    const response = await fetch(`${API_BASE_URL}/campaigns/create-with-payment`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        ...formData, 
        brandWalletAddress: walletAddress,
        payment: {
          transactionHash: paymentData.transactionHash,
          amount: paymentData.amount,
          currency: paymentData.currency,
          network: paymentData.network,
          blockNumber: paymentData.blockNumber,
          gasUsed: paymentData.gasUsed
        }
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
      throw new Error(errorData.error || 'Failed to create campaign')
    }
    
    let result
    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${responseText}`)
    }
    
    return result.campaign
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
      // Step 1: Process blockchain payment FIRST
      const paymentResult = await PaymentFlowService.processPayment(
        formData,
        walletAddress,
        walletClient,
        publicClient
      )
      
      // Step 2: Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: paymentResult.transactionHash,
        timeout: 60_000 // 60 second timeout
      })
      
      if (receipt.status === 'success') {
        
        // Step 3: Create campaign with payment data (only after payment is confirmed)
        const campaign = await PaymentFlowService.createCampaignWithPayment(
          formData, 
          walletAddress,
          {
            ...paymentResult,
            blockNumber: receipt.blockNumber.toString(),
            gasUsed: receipt.gasUsed.toString()
          }
        )
        
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