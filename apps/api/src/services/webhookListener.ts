import { Hono } from 'hono'
import { z } from 'zod'
import { createHmac } from 'crypto'
import { campaigns, payments, campaignActions, actions, brands } from '../db/schema'
import { eq } from 'drizzle-orm'
import { createPublicClient, http, parseAbiItem, decodeEventLog, decodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import type { Env } from '../types'

const USDC_DECIMALS = 6

// CampaignPaymentReceived event ABI
const CAMPAIGN_PAYMENT_EVENT_ABI = parseAbiItem(
  'event CampaignPaymentReceived(string indexed campaignId, address indexed sender, uint256 amount, uint256 timestamp)'
)

// PriceCalculated event ABI
const PRICE_CALCULATED_EVENT_ABI = parseAbiItem(
  'event PriceCalculated(string indexed campaignId, uint256 totalPrice, string country, bool targetGender, bool targetAge, bool verifiedOnly)'
)

// Contract ABI for depositForCampaignWithPermit function (to decode campaign ID from input)
const DEPOSIT_FOR_CAMPAIGN_ABI = [
  {
    name: 'depositForCampaignWithPermit',
    type: 'function',
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
          const country = decoded.args[1] as string
          const targetGender = decoded.args[2] as boolean
          const targetAge = decoded.args[3] as boolean
          const verifiedOnly = decoded.args[4] as boolean
          
          console.log('[WEBHOOK] Decoded campaign payment:', {
            campaignId,
            country,
            targetGender,
            targetAge,
            verifiedOnly,
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
            targetingParams: {
              country,
              targetGender,
              targetAge,
              verifiedOnly
            }
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
    targetingParams: {
      country: string,
      targetGender: boolean,
      targetAge: boolean,
      verifiedOnly: boolean
    }
  }, db: any) {
    const { campaignId, amount, senderAddress, transactionHash, blockNumber, timestamp, targetingParams } = data
    
    console.log('[WEBHOOK] Processing campaign payment for:', campaignId)
    
    try {
      // Fetch campaign
      let [campaign] = await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, campaignId))
        .limit(1)

      if (!campaign) {
        console.log(`[WEBHOOK] Campaign not found, creating new campaign: ${campaignId}`)
        campaign = await this.createCampaignFromPayment({
          campaignId,
          amount,
          senderAddress,
          targetingParams
        }, db)
        
        if (!campaign) {
          console.error(`[WEBHOOK] Failed to create campaign: ${campaignId}`)
          return
        }
      }

      if (campaign.status !== 'pending_payment') {
        console.warn(`[WEBHOOK] WARNING: Campaign ${campaignId} is not pending payment, status: ${campaign.status}`)
        return
      }

      // Convert USDC (6 decimals) to cents for database storage
      const amountInCents = Math.round(Number(amount) / Math.pow(10, USDC_DECIMALS - 2))
      
      if (amountInCents < campaign.totalBudget) {
        console.error(`[WEBHOOK] ERROR: Insufficient payment. Expected: ${campaign.totalBudget} cents, Received: ${amountInCents} cents`)
        return
      }

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
        createdAt: timestamp,
        updatedAt: timestamp
      })

      // Activate campaign
      await db
        .update(campaigns)
        .set({ 
          status: 'active',
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, campaignId))

      // Activate all campaign actions
      await db
        .update(campaignActions)
        .set({ isActive: true })
        .where(eq(campaignActions.campaignId, campaignId))

      // Get campaign actions to create trackable actions for extension users
      const campaignActionsData = await db.select()
        .from(campaignActions)
        .where(eq(campaignActions.campaignId, campaignId))

      console.log(`[WEBHOOK] Creating ${campaignActionsData.length} actions for extension users...`)

      // Create trackable actions for extension users
      // IMPORTANT: We use the campaignAction.id as the action.id to maintain the relationship
      for (const campaignAction of campaignActionsData) {
        await db.insert(actions).values({
          id: campaignAction.id, // Use the same ID to maintain relationship!
          platform: campaign.platform,
          actionType: campaignAction.actionType,
          target: campaignAction.target,
          title: `${campaign.platform} ${campaignAction.actionType}`,
          description: `${campaignAction.actionType} on ${campaign.platform}`,
          price: campaignAction.pricePerAction,
          maxVolume: campaignAction.maxVolume,
          currentVolume: 0,
          isActive: true,
          metadata: {
            campaignId: campaign.id,
            campaignActionId: campaignAction.id
          },
          createdAt: timestamp,
          updatedAt: timestamp
        })
      }

      console.log(`[WEBHOOK] SUCCESS: Campaign ${campaignId} activated`)
      console.log(`[WEBHOOK] - Status: pending_payment -> active`)
      console.log(`[WEBHOOK] - Payment: ${amountInCents} cents`)
      console.log(`[WEBHOOK] - Transaction: ${transactionHash}`)
      console.log(`[WEBHOOK] - Created ${campaignActionsData.length} trackable actions`)
    } catch (error) {
      console.error(`[WEBHOOK] ERROR: Failed to process payment for campaign ${campaignId}:`, error)
    }
  }

  private async createCampaignFromPayment(data: {
    campaignId: string,
    amount: bigint,
    senderAddress: string,
    targetingParams: {
      country: string,
      targetGender: boolean,
      targetAge: boolean,
      verifiedOnly: boolean
    }
  }, db: any) {
    const { campaignId, amount, senderAddress, targetingParams } = data
    
    console.log('[WEBHOOK] Creating new campaign from payment:', {
      campaignId,
      amount: amount.toString(),
      sender: senderAddress,
      targetingParams
    })
    
    try {
      // Convert USDC (6 decimals) to cents for database storage
      const amountInCents = Math.round(Number(amount) / Math.pow(10, USDC_DECIMALS - 2))
      
      // Find or create brand for this wallet address
      let [brand] = await db
        .select()
        .from(brands)
        .where(eq(brands.walletAddress, senderAddress.toLowerCase()))
        .limit(1)
      
      if (!brand) {
        console.log('[WEBHOOK] Creating new brand for wallet:', senderAddress)
        [brand] = await db.insert(brands).values({
          name: `Brand ${senderAddress.substring(0, 8)}`,
          walletAddress: senderAddress.toLowerCase(),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning()
      }
      
      // Create campaign with default values
      const [campaign] = await db.insert(campaigns).values({
        id: campaignId,
        brandId: brand.id,
        brandWalletAddress: senderAddress.toLowerCase(),
        platform: 'tiktok', // Default platform
        totalBudget: amountInCents,
        remainingBudget: amountInCents,
        targetingRules: {
          country: targetingParams.country,
          gender: targetingParams.targetGender ? 'specific' : 'all',
          ageRange: targetingParams.targetAge ? 'specific' : 'all',
          verifiedOnly: targetingParams.verifiedOnly
        },
        status: 'pending_payment',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()
      
      console.log('[WEBHOOK] Campaign created:', campaign.id)
      
      // Create default campaign actions based on the fixed package
      // 20 likes + 10 follows as per the contract
      const defaultActions = [
        {
          campaignId: campaign.id,
          actionType: 'like',
          target: 'pending',
          pricePerAction: 20, // $0.20 in cents
          maxVolume: 20,
          currentVolume: 0,
          isActive: false
        },
        {
          campaignId: campaign.id,
          actionType: 'follow',
          target: 'pending',
          pricePerAction: 40, // $0.40 in cents
          maxVolume: 10,
          currentVolume: 0,
          isActive: false
        }
      ]
      
      await db.insert(campaignActions).values(defaultActions)
      
      console.log('[WEBHOOK] Campaign actions created')
      
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