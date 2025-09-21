import { Hono } from 'hono'
import { z } from 'zod'
import { createHmac } from 'crypto'
import { campaigns, payments, campaignActions, brands } from '../db/schema'
import { eq, sql, inArray } from 'drizzle-orm'
import { createPublicClient, http, parseAbiItem, decodeEventLog, decodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import type { Env } from '../types'
import { parseTargetsFromBlockchain } from '../utils/targetEncoder'

const USDC_DECIMALS = 6

// CampaignPaymentReceived event ABI - updated with new structure including follow/like counts
const CAMPAIGN_PAYMENT_EVENT_ABI = parseAbiItem(
  'event CampaignPaymentReceived(string indexed campaignId, address indexed sender, uint256 amount, uint256 timestamp, uint256 totalFollows, uint256 totalLikes)'
)

// Contract ABI for depositForCampaignWithPermit function - NEW STRUCTURE
const DEPOSIT_FOR_CAMPAIGN_ABI = [
  {
    name: 'depositForCampaignWithPermit',
    type: 'function',
    inputs: [
      { name: 'campaignId', type: 'string' },
      { 
        name: 'requirements', 
        type: 'tuple',
        components: [
          { name: 'verifiedOnly', type: 'bool' },
          { name: 'minFollowers', type: 'uint256' },
          { name: 'minUniqueViews28Days', type: 'uint256' },
          { name: 'accountLocation', type: 'string' },
          { name: 'accountLanguage', type: 'string' }
        ]
      },
      {
        name: 'actions',
        type: 'tuple',
        components: [
          { name: 'followTarget', type: 'string' },  // Encoded URL
          { name: 'followCount', type: 'uint256' },
          { name: 'likeTargets', type: 'string[]' },  // Array of encoded URLs
          { name: 'likeCountPerPost', type: 'uint256' }
        ]
      },
      { name: 'deadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' }
    ],
    outputs: []
  }
] as const

export class WebhookListenerService {
  private app: Hono<{ Bindings: Env }>
  private viemClient: ReturnType<typeof createPublicClient>

  constructor() {
    this.app = new Hono<{ Bindings: Env }>()
    this.viemClient = createPublicClient({
      chain: baseSepolia,
      transport: http(process.env.BASE_SEPOLIA_RPC_URL)
    })
    this.setupRoutes()
  }

  private setupRoutes() {
    this.app.post('/webhooks/campaign-payments', async (c) => {
      console.log('[WEBHOOK] ----------------------------------------')
      console.log('[WEBHOOK] Received POST /webhooks/campaign-payments')
      
      try {
        // Check for Tenderly signature
        const tenderlySignature = c.req.header('x-tenderly-signature')
        const dateHeader = c.req.header('date')
        
        if (!tenderlySignature || !dateHeader) {
          console.error('[WEBHOOK] ERROR: Missing Tenderly signature headers')
          return c.json({ error: 'Missing signature' }, 401)
        }
        
        const body = await c.req.text()
        console.log('[WEBHOOK] Body size:', body.length, 'bytes')
        
        const isValid = this.verifyTenderlySignature(body, tenderlySignature, dateHeader)
        
        console.log(`[WEBHOOK] Tenderly signature verification:`, isValid ? 'VALID' : 'INVALID')
        
        if (!isValid) {
          console.error('[WEBHOOK] ERROR: Invalid signature')
          return c.json({ error: 'Invalid signature' }, 401)
        }

        const payload = JSON.parse(body)
        const db = c.get('db')
        
        console.log('[WEBHOOK] Processing Tenderly webhook:', {
          event_type: payload.event_type,
          id: payload.id
        })
        
        await this.processTenderlyWebhook(payload, db)
        
        console.log('[WEBHOOK] Processing complete')
        console.log('[WEBHOOK] ----------------------------------------')
        return c.json({ success: true })
      } catch (error) {
        console.error('[WEBHOOK] ERROR:', error)
        return c.json({ error: 'Internal server error' }, 500)
      }
    })

    // GET endpoint for webhook verification (required by Tenderly)
    this.app.get('/webhooks/campaign-payments', (c) => {
      console.log('[WEBHOOK] GET request received - webhook verification')
      // Tenderly expects a simple 200 OK response for verification
      return c.text('OK', 200)
    })
    
    this.app.get('/webhooks/health', (c) => {
      return c.json({ status: 'healthy', timestamp: new Date().toISOString() })
    })
  }
  
  private verifyTenderlySignature(body: string, signature: string, timestamp: string): boolean {
    const signingKey = process.env.TENDERLY_WEBHOOK_SIGNING_KEY || ''
    const hmac = createHmac('sha256', signingKey)
    hmac.update(body, 'utf8')
    hmac.update(timestamp)
    const expectedSignature = hmac.digest('hex')
    return signature === expectedSignature
  }

  private async processTenderlyWebhook(event: any, db: any) {
    // Tenderly webhook format for Event Emitted alerts
    if (event.event_type === 'ALERT' && event.transaction) {
      console.log('[WEBHOOK] Tenderly alert event detected')
      console.log('[WEBHOOK] Transaction hash:', event.transaction.hash)
      
      const tx = event.transaction
      const campaignContractAddress = process.env.CAMPAIGN_PAYMENTS_CONTRACT_ADDRESS?.toLowerCase()
      
      // Check if transaction is to our campaign contract
      if (tx.to?.toLowerCase() !== campaignContractAddress) {
        console.log('[WEBHOOK] Transaction not to campaign contract, skipping')
        return
      }
      
      try {
        // Decode the transaction input to get campaign ID and amount
        console.log('[WEBHOOK] Decoding transaction input...')
        const decoded = decodeFunctionData({
          abi: DEPOSIT_FOR_CAMPAIGN_ABI,
          data: tx.input as `0x${string}`
        })
        
        if (decoded.functionName === 'depositForCampaignWithPermit') {
          const campaignId = decoded.args[0] as string
          const requirements = decoded.args[1] as {
            verifiedOnly: boolean
            minFollowers: bigint
            minUniqueViews28Days: bigint
            accountLocation: string
            accountLanguage: string
          }
          const actions = decoded.args[2] as {
            followTarget: string  // Encoded URL
            followCount: bigint
            likeTargets: string[]  // Array of encoded URLs
            likeCountPerPost: bigint
          }
          
          console.log('[WEBHOOK] Decoded campaign payment:', {
            campaignId,
            requirements: {
              verifiedOnly: requirements.verifiedOnly,
              minFollowers: requirements.minFollowers.toString(),
              minViews: requirements.minUniqueViews28Days.toString(),
              location: requirements.accountLocation,
              language: requirements.accountLanguage
            },
            actions: {
              followCount: actions.followCount.toString(),
              likeCount: actions.likeCountPerPost.toString(),
              likeTargetsCount: actions.likeTargets.length
            },
            from: tx.from,
            hash: tx.hash
          })
          
          // Find the CampaignPaymentReceived event in logs to get amount and timestamp
          let timestamp = new Date()
          let amount: bigint | null = null
          
          if (tx.logs && tx.logs.length > 0) {
            // The last log is usually the CampaignPaymentReceived event
            for (const log of tx.logs) {
              if (log.address?.toLowerCase() === campaignContractAddress) {
                try {
                  const eventDecoded = decodeEventLog({
                    abi: [CAMPAIGN_PAYMENT_EVENT_ABI],
                    data: log.data,
                    topics: log.topics
                  })
                  
                  if (eventDecoded.eventName === 'CampaignPaymentReceived') {
                    console.log('[WEBHOOK] Found CampaignPaymentReceived event')
                    amount = eventDecoded.args.amount as bigint
                    timestamp = new Date(Number(eventDecoded.args.timestamp) * 1000)
                    break
                  }
                } catch (e) {
                  // Not the event we're looking for, continue
                }
              }
            }
          }
          
          if (!amount) {
            console.error('[WEBHOOK] No CampaignPaymentReceived event found with amount')
            return
          }
          
          // Process the campaign payment
          await this.processCampaignPayment({
            campaignId,
            amount,
            senderAddress: tx.from,
            transactionHash: tx.hash,
            blockNumber: tx.block_number,
            timestamp,
            requirements,
            actions
          }, db)
          
          console.log('[WEBHOOK] Campaign payment processed successfully')
        }
      } catch (error) {
        console.error('[WEBHOOK] Failed to decode transaction input:', error)
      }
    } else {
      console.log('[WEBHOOK] Not an ALERT event or missing transaction data')
    }
  }

  private async processCampaignPayment(data: {
    campaignId: string,
    amount: bigint,
    senderAddress: string,
    transactionHash: string,
    blockNumber: number,
    timestamp: Date,
    requirements: {
      verifiedOnly: boolean,
      minFollowers: bigint,
      minUniqueViews28Days: bigint,
      accountLocation: string,
      accountLanguage: string
    },
    actions: {
      followTarget: string,  // Encoded URL
      followCount: bigint,
      likeTargets: string[],  // Array of encoded URLs
      likeCountPerPost: bigint
    }
  }, db: any) {
    const { campaignId, amount, senderAddress, transactionHash, blockNumber, timestamp, requirements, actions } = data
    
    console.log('[WEBHOOK] Processing campaign payment for:', campaignId)
    
    try {
      // Decode the encoded URLs from contract (they use our xad_ encoding)
      const decodeUrl = (encoded: string): string => {
        if (!encoded || encoded === '') return ''
        try {
          // Remove xad_ prefix and _v1 suffix
          if (!encoded.startsWith('xad_') || !encoded.endsWith('_v1')) {
            return encoded // Return as-is if not encoded
          }
          const withoutMarkers = encoded.slice(4, -3)
          const reversed = withoutMarkers.split('').reverse().join('')
          const decoded = Buffer.from(reversed, 'base64').toString('utf-8')
          // Remove salt (xad2024campaign)
          return decoded.slice(15) // Length of 'xad2024campaign'
        } catch (e) {
          console.error('[WEBHOOK] Failed to decode URL:', e)
          return encoded
        }
      }
      
      // Decode URLs
      const followUrl = decodeUrl(actions.followTarget)
      const likeUrls = actions.likeTargets.map(url => decodeUrl(url))
      
      console.log('[WEBHOOK] Decoded URLs from contract:', {
        followUrl: followUrl ? 'Found' : 'None',
        likeUrlsCount: likeUrls.filter(u => u).length,
        followCount: actions.followCount.toString(),
        likeCountPerPost: actions.likeCountPerPost.toString()
      })
      
      // Create new campaign from payment data
      console.log(`[WEBHOOK] Creating new campaign: ${campaignId}`)
      const campaign = await this.createCampaignFromPayment({
        campaignId,
        amount,
        senderAddress,
        requirements,
        actions,
        followUrl,
        likeUrls
      }, db)
      
      if (!campaign) {
        console.error(`[WEBHOOK] Failed to create campaign: ${campaignId}`)
        return
      }

      // Convert USDC (6 decimals) to cents for database storage
      const amountInCents = Math.round(Number(amount) / Math.pow(10, USDC_DECIMALS - 2))

      // Record payment
      await db.insert(payments).values({
        campaignId: campaign.id,
        brandId: campaign.brandId,
        fromAddress: senderAddress.toLowerCase(),
        toAddress: process.env.CAMPAIGN_PAYMENTS_CONTRACT_ADDRESS?.toLowerCase(),
        amount: amountInCents,
        currency: 'USDC',
        status: 'completed',
        transactionHash,
        blockNumber: blockNumber,
        gasUsed: null,
        metadata: {
          network: 'base-sepolia',
          timestamp: timestamp.toISOString()
        },
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString()
      })

      // Activate campaign
      await db
        .update(campaigns)
        .set({ 
          status: 'active',
          isActive: true,
          updatedAt: new Date().toISOString()
        })
        .where(eq(campaigns.id, campaignId))

      // Activate all campaign actions
      await db
        .update(campaignActions)
        .set({ isActive: true })
        .where(eq(campaignActions.campaignId, campaignId))

      console.log(`[WEBHOOK] SUCCESS: Campaign ${campaignId} activated`)
      console.log(`[WEBHOOK] - Status: pending_payment -> active`)
      console.log(`[WEBHOOK] - Payment: ${amountInCents} cents`)
      console.log(`[WEBHOOK] - Transaction: ${transactionHash}`)
      console.log(`[WEBHOOK] - Campaign actions activated and ready for extension users`)
    } catch (error) {
      console.error(`[WEBHOOK] ERROR: Failed to process payment for campaign ${campaignId}:`, error)
      // Re-throw to ensure webhook returns error status
      throw error
    }
  }

  private async createCampaignFromPayment(data: {
    campaignId: string,
    amount: bigint,
    senderAddress: string,
    requirements: {
      verifiedOnly: boolean,
      minFollowers: bigint,
      minUniqueViews28Days: bigint,
      accountLocation: string,
      accountLanguage: string
    },
    actions: {
      followTarget: string,
      followCount: bigint,
      likeTargets: string[],
      likeCountPerPost: bigint
    },
    followUrl: string,
    likeUrls: string[]
  }, db: any) {
    const { campaignId, amount, senderAddress, requirements, actions, followUrl, likeUrls } = data
    
    console.log('[WEBHOOK] Creating new campaign from payment:', {
      campaignId,
      amount: amount.toString(),
      sender: senderAddress,
      requirements: {
        verifiedOnly: requirements.verifiedOnly,
        minFollowers: requirements.minFollowers.toString(),
        location: requirements.accountLocation,
        language: requirements.accountLanguage
      }
    })
    
    try {
      // Convert USDC (6 decimals) to cents for database storage
      const amountInCents = Math.round(Number(amount) / Math.pow(10, USDC_DECIMALS - 2))
      
      // Find brand that owns this wallet address
      const senderLower = senderAddress.toLowerCase()
      console.log('[WEBHOOK] Looking for brand with wallet (lowercase):', senderLower)
      
      const brandsResult = await db.select()
        .from(brands)
        .where(sql`${brands.walletAddresses}::jsonb @> ${JSON.stringify([senderLower])}::jsonb`)
        .limit(1)
      
      const brand = brandsResult[0]
      
      if (!brand) {
        // Also try to debug what brands exist
        const allBrands = await db.select().from(brands).limit(5)
        console.log('[WEBHOOK] Sample brands in DB:', allBrands.map(b => ({ 
          id: b.id, 
          wallets: b.walletAddresses 
        })))
        console.log('[WEBHOOK] No brand found for wallet:', senderLower)
        console.log('[WEBHOOK] Payment received but brand not registered - user must login first')
        throw new Error(`No brand found for wallet ${senderLower}. User must authenticate first.`)
      }
      
      console.log('[WEBHOOK] Found brand', brand.id, 'for wallet', senderAddress)
      
      // Create campaign with the brand we found
      const [campaign] = await db.insert(campaigns).values({
        id: campaignId,
        brandId: brand.id,
        brandWalletAddress: senderAddress.toLowerCase(),
        platform: 'tiktok', // Default platform
        totalBudget: amountInCents,
        remainingBudget: amountInCents,
        targetingRules: {
          verifiedOnly: requirements.verifiedOnly,
          minFollowers: Number(requirements.minFollowers),
          minUniqueViews28Days: Number(requirements.minUniqueViews28Days),
          accountLocation: requirements.accountLocation,
          accountLanguage: requirements.accountLanguage
        },
        status: 'pending_payment',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).returning()
      
      console.log('[WEBHOOK] Campaign created:', campaign.id)
      
      // Create campaign actions based on what was actually requested
      const campaignActionsList = []
      
      // Add follow action if requested
      if (followUrl && Number(actions.followCount) > 0) {
        campaignActionsList.push({
          campaignId: campaign.id,
          actionType: 'follow',
          target: followUrl,
          pricePerAction: 60, // $0.60 in cents (updated price)
          maxVolume: Number(actions.followCount),
          currentVolume: 0,
          isActive: false
        })
      }
      
      // Add like actions if requested (one action per URL)
      if (likeUrls.length > 0 && Number(actions.likeCountPerPost) > 0) {
        for (const likeUrl of likeUrls) {
          if (likeUrl) {
            campaignActionsList.push({
              campaignId: campaign.id,
              actionType: 'like',
              target: likeUrl,
              pricePerAction: 30, // $0.30 in cents (updated price)
              maxVolume: Number(actions.likeCountPerPost),
              currentVolume: 0,
              isActive: false
            })
          }
        }
      }
      
      const defaultActions = campaignActionsList
      
      if (defaultActions.length > 0) {
        // Insert campaign_actions and get the created records with IDs
        const createdCampaignActions = await db.insert(campaignActions)
          .values(defaultActions)
          .returning()
        
        console.log('[WEBHOOK] Campaign actions created:', createdCampaignActions.length)
      } else {
        console.warn('[WEBHOOK] No campaign actions to create')
      }
      
      return campaign
    } catch (error) {
      console.error('[WEBHOOK] Failed to create campaign:', error)
      return null
    }
  }

  getApp() {
    return this.app
  }
}

// Export a singleton instance
export const webhookListener = new WebhookListenerService()