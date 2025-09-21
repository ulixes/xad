// Payment Flow Service - Using connected external wallets for payments

import { CAMPAIGN_PAYMENTS_ABI, getNetworkConfig, USDC_ABI } from "@/config/networks"
import { encodeFunctionData } from 'viem'
import { encodeTargetsSimple } from '@/utils/targetEncoder'

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
    
    // Prepare account requirements for contract
    const accountRequirements = {
      verifiedOnly: targetingParams.verifiedOnly || false,
      minFollowers: BigInt(targetingParams.minFollowers || 0),
      minUniqueViews28Days: BigInt(targetingParams.minViews28Days || 0),
      accountLocation: targetingParams.accountLocation || 'all',
      accountLanguage: targetingParams.accountLanguage || 'all'
    }
    
    // Get calculated price from contract
    const calculatedAmount = await publicClient.readContract({
      address: contractAddress,
      abi: CAMPAIGN_PAYMENTS_ABI,
      functionName: 'calculatePrice',
      args: [accountRequirements]
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
    walletAddress: string, // The connected wallet address
    walletClient: any,     // Wagmi wallet client for signing
    publicClient: any
  ) {
    try {
      // Step 1: Generate campaign ID
      const campaignId = await this.generateCampaignId()
      console.log('Generated campaign ID:', campaignId)
      
      // Step 2: Get contract address
      const contractAddress = networkConfig.campaignPaymentsContract
      
      console.log('[PaymentFlow] Using connected wallet:', walletAddress)
      
      // Step 3: Prepare account requirements
      const targetingParams = {
        verifiedOnly: formData.verifiedOnly || false,
        minFollowers: formData.minFollowers || 0,
        minViews28Days: formData.minUniqueViews28Days || 0,
        accountLocation: formData.accountLocation || 'all',
        accountLanguage: formData.accountLanguage || 'all'
      }
      
      // Step 3.5: Prepare action targets (extract handle and videoId)
      // Get the SINGLE like URL and SINGLE follow URL from form
      const likeUrl = formData.likeUrl || 'https://www.tiktok.com/@defaultuser/video/1234567890'
      const followUrl = formData.followUrl || 'https://www.tiktok.com/@defaultuser'
      
      // Extract handle and videoId from URLs
      const extractFromTikTokUrl = (url: string) => {
        const match = url.match(/@([^\/]+)(?:\/video\/(\d+))?/)
        if (!match) throw new Error('Invalid TikTok URL')
        return { handle: match[1], videoId: match[2] }
      }
      
      const likeData = extractFromTikTokUrl(likeUrl)
      const followData = extractFromTikTokUrl(followUrl)
      
      // Encode targets for privacy (obfuscated before storing on-chain)
      const targets = encodeTargetsSimple(likeData.handle, likeData.videoId, followData.handle)
      console.log('Encoded targets for blockchain (obfuscated):', targets)
      
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
      
      console.log('Requesting permit signature from connected wallet...')
      
      // Step 5: Sign permit with wagmi wallet client
      const signature = await walletClient.signTypedData({
        account: walletAddress as `0x${string}`,
        domain,
        types,
        primaryType: 'Permit',
        message: permitData
      })
      
      console.log('Permit signature obtained from external wallet')
      
      // Split signature
      const r = `0x${signature.slice(2, 66)}` as `0x${string}`
      const s = `0x${signature.slice(66, 130)}` as `0x${string}`
      const v = parseInt(signature.slice(130, 132), 16)
      
      // Step 6: Encode the contract call with AccountRequirements struct
      const accountRequirements = {
        verifiedOnly: targetingParams.verifiedOnly,
        minFollowers: BigInt(targetingParams.minFollowers),
        minUniqueViews28Days: BigInt(targetingParams.minViews28Days),
        accountLocation: targetingParams.accountLocation,
        accountLanguage: targetingParams.accountLanguage
      }
      
      const txData = encodeFunctionData({
        abi: CAMPAIGN_PAYMENTS_ABI,
        functionName: 'depositForCampaignWithPermit',
        args: [
          campaignId,
          accountRequirements, // AccountRequirements struct
          targets, // Simple string "likeUrl|followUrl"
          deadline,
          v,
          r,
          s
        ]
      })
      
      // Step 7: Send transaction with wagmi wallet client
      console.log('Sending transaction with connected wallet...')
      const hash = await walletClient.sendTransaction({
        account: walletAddress as `0x${string}`,
        to: contractAddress as `0x${string}`,
        data: txData as `0x${string}`,
        chain: networkConfig.viemChain
      })
      
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