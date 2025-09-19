// Payment Flow Service - Using Privy's embedded wallets for seamless payments

import { CAMPAIGN_PAYMENTS_ABI, getNetworkConfig, USDC_ABI } from "@/config/networks"
import { encodeFunctionData } from 'viem'

const networkConfig = getNetworkConfig()

export interface PaymentDetails {
  campaignId: string
  amount: string
  currency: 'USDC'
  contractAddress: string
  network: 'base' | 'base-sepolia'
  chainId: number
}

export class PaymentFlowEmbeddedService {
  static async generateCampaignId(): Promise<string> {
    return crypto.randomUUID()
  }

  static async createCampaignPaymentData(
    campaignId: string,
    contractAddress: string,
    targetingParams: {
      country: string,
      targetGender: boolean,
      targetAge: boolean,
      verifiedOnly: boolean
    },
    walletAddress: string,
    publicClient: any
  ) {
    // Get USDC contract address
    const usdcAddress = networkConfig.usdcAddress
    
    // Get calculated price from contract
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

    console.log('Campaign payment amount:', calculatedAmount.toString(), 'USDC (6 decimals)')

    // Check USDC balance
    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletAddress]
    })
    
    if (balance < calculatedAmount) {
      const requiredUSDC = Number(calculatedAmount) / 1e6
      const currentUSDC = Number(balance) / 1e6
      throw new Error(`Insufficient USDC balance. Have: ${currentUSDC} USDC, Need: ${requiredUSDC} USDC`)
    }

    // Get nonce for permit
    const nonce = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'nonces',
      args: [walletAddress]
    })

    // Create permit deadline (10 minutes from now)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)

    // Prepare permit data - convert BigInts to strings for JSON serialization
    const permitData = {
      owner: walletAddress,
      spender: contractAddress,
      value: calculatedAmount.toString(), // Convert BigInt to string
      nonce: nonce.toString(), // Convert BigInt to string
      deadline: deadline.toString() // Convert BigInt to string
    }

    // EIP-712 domain for USDC
    const domain = {
      name: 'USDC',
      version: '2',
      chainId: networkConfig.chainId,
      verifyingContract: usdcAddress as `0x${string}`
    }

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    }

    return {
      calculatedAmount,
      permitData,
      domain,
      types,
      deadline,
      usdcAddress
    }
  }

  static async createCampaignWithPayment(
    formData: any,
    embeddedWallet: any, // The embedded wallet from Privy
    signTypedData: any,  // Privy's signTypedData function (works seamlessly with embedded)
    sendTransaction: any, // Privy's sendTransaction function (works seamlessly with embedded)
    publicClient: any
  ) {
    try {
      // Step 1: Generate campaign ID
      const campaignId = await this.generateCampaignId()
      console.log('Generated campaign ID:', campaignId)
      
      // Step 2: Get contract address and wallet address
      const contractAddress = networkConfig.campaignPaymentsContract
      const walletAddress = embeddedWallet.address
      
      console.log('[PaymentFlowEmbedded] Using embedded wallet:', walletAddress)
      
      // Step 3: Prepare targeting parameters
      const targetingParams = {
        country: formData.country || 'all',
        targetGender: formData.gender !== 'all',
        targetAge: formData.ageRange !== 'all',
        verifiedOnly: formData.verifiedOnly || false
      }
      
      // Step 4: Get payment data and check balance
      const {
        calculatedAmount,
        permitData,
        domain,
        types,
        deadline
      } = await this.createCampaignPaymentData(
        campaignId,
        contractAddress,
        targetingParams,
        walletAddress,
        publicClient
      )
      
      console.log('Requesting permit signature from embedded wallet...')
      
      // Step 5: Sign permit with embedded wallet
      const signResult = await signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message: permitData
      })
      
      console.log('Permit signature obtained seamlessly')
      const signature = signResult.signature
      
      // Split signature
      const r = `0x${signature.slice(2, 66)}`
      const s = `0x${signature.slice(66, 130)}`
      const v = parseInt(signature.slice(130, 132), 16)
      
      // Step 6: Encode the contract call
      const txData = encodeFunctionData({
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
      
      // Step 7: Send transaction with embedded wallet (seamless)
      console.log('Sending transaction with embedded wallet...')
      const txResult = await sendTransaction({
        to: contractAddress,
        data: txData,
        chainId: networkConfig.chainId
      })
      
      const hash = txResult.hash
      console.log('Transaction sent! Hash:', hash)
      
      return {
        success: true,
        campaignId: campaignId,
        transactionHash: hash,
        message: 'Payment submitted successfully! Campaign will be created when payment is confirmed.'
      }
      
    } catch (error) {
      console.error('Campaign payment failed:', error)
      
      // Provide more specific error messages
      if (error?.message?.includes('Insufficient USDC')) {
        throw error
      } else if (error?.message?.includes('User rejected')) {
        throw new Error('Transaction was cancelled')
      }
      
      throw new Error(`Payment failed: ${error?.message || 'Unknown error'}`)
    }
  }
}