import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { campaigns, payments, campaignActions, actions, actionRuns, socialAccounts, users, brands } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyPaymentTransaction } from '../services/paymentVerification';
import { authMiddleware, requireWalletOwnership } from '../middleware/auth';

const campaignRoutes = new Hono<{ Bindings: Env }>();

// Schema for campaign creation
const createCampaignSchema = z.object({
  platform: z.enum(['tiktok', 'x', 'instagram', 'reddit', 'facebook', 'farcaster']),
  targetingRules: z.any(),
  totalAmount: z.string(),
  actions: z.array(z.object({
    type: z.string(),
    target: z.string(),
    price: z.number(),
    maxVolume: z.number()
  })),
  brandWalletAddress: z.string()
});

// Schema for campaign creation with payment
const createCampaignWithPaymentSchema = z.object({
  platform: z.enum(['tiktok', 'x', 'instagram', 'reddit', 'facebook', 'farcaster']),
  targetingRules: z.any(),
  totalAmount: z.string(),
  actions: z.array(z.object({
    type: z.string(),
    target: z.string(),
    price: z.number(),
    maxVolume: z.number()
  })),
  brandWalletAddress: z.string(),
  payment: z.object({
    transactionHash: z.string(),
    amount: z.string(),
    currency: z.string(),
    network: z.string(),
    blockNumber: z.string().optional(),
    gasUsed: z.string().optional()
  })
});

// Create new campaign (requires authentication)
campaignRoutes.post('/', authMiddleware, zValidator('json', createCampaignSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    // Get authenticated user from session
    const session = c.get('authSession');
    
    // Verify the wallet address matches the authenticated user
    if (session.address.toLowerCase() !== data.brandWalletAddress.toLowerCase()) {
      return c.json({ 
        success: false, 
        error: 'Wallet address mismatch with authenticated session' 
      }, 403);
    }

    // Find or create brand by wallet address
    let [brand] = await db.select().from(brands)
      .where(eq(brands.walletAddress, data.brandWalletAddress.toLowerCase()))
      .limit(1);

    if (!brand) {
      // Create new brand
      [brand] = await db.insert(brands).values({
        walletAddress: data.brandWalletAddress.toLowerCase(),
      }).returning();
    }

    // Calculate total budget in cents
    const totalBudgetCents = Math.round(parseFloat(data.totalAmount) * 100);

    // Create campaign
    const [campaign] = await db.insert(campaigns).values({
      brandId: brand.id,
      brandWalletAddress: data.brandWalletAddress, // Keep for backward compatibility
      platform: data.platform,
      targetingRules: data.targetingRules,
      totalBudget: totalBudgetCents,
      remainingBudget: totalBudgetCents,
      status: 'draft'
    }).returning();

    // Create campaign actions
    const validActionTypes = ['like', 'comment', 'share', 'follow', 'retweet', 'upvote', 'award'] as const;
    const campaignActionsData = data.actions.map(action => ({
      campaignId: campaign.id,
      actionType: validActionTypes.includes(action.type as any) 
        ? action.type as typeof validActionTypes[number]
        : 'like', // Default fallback
      target: action.target,
      pricePerAction: action.price, // Already in cents from frontend
      maxVolume: action.maxVolume
    }));

    await db.insert(campaignActions).values(campaignActionsData);

    console.log('Campaign created successfully:', campaign);
    
    return c.json({ 
      success: true, 
      campaign: campaign,
      message: 'Campaign created successfully. Proceed with payment.' 
    });

  } catch (error) {
    console.error('=== CAMPAIGN CREATION ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return c.json({ 
      success: false, 
      error: 'Failed to create campaign',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Create campaign with payment (payment already confirmed on blockchain)
campaignRoutes.post('/create-with-payment', authMiddleware, zValidator('json', createCampaignWithPaymentSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');

  try {
    // Get authenticated user from session
    const session = c.get('authSession');
    
    // Verify the wallet address matches the authenticated user
    if (session.address.toLowerCase() !== data.brandWalletAddress.toLowerCase()) {
      return c.json({ 
        success: false, 
        error: 'Wallet address mismatch with authenticated session' 
      }, 403);
    }

    // Verify transaction on blockchain
    const verificationResult = await verifyPaymentTransaction({
      transactionHash: data.payment.transactionHash,
      expectedAmount: Math.round(parseFloat(data.totalAmount) * 100), // Convert to cents
      expectedFromAddress: data.brandWalletAddress,
      expectedToAddress: process.env.ESCROW_ADDRESS || '0x16a5274cCd454f90E99Ea013c89c38381b635f5b',
      network: process.env.ENVIRONMENT === 'production' ? 'base' : 'base-sepolia'
    });

    if (!verificationResult.valid) {
      return c.json({ 
        success: false, 
        error: `Payment verification failed: ${verificationResult.reason}` 
      }, 400);
    }

    // Check if transaction was already used
    const existingPayment = await db.select().from(payments)
      .where(eq(payments.transactionHash, data.payment.transactionHash))
      .limit(1);
    
    if (existingPayment.length > 0) {
      return c.json({ 
        success: false, 
        error: 'Transaction hash already used' 
      }, 400);
    }

    // Find or create brand
    let [brand] = await db.select().from(brands)
      .where(eq(brands.walletAddress, data.brandWalletAddress.toLowerCase()))
      .limit(1);

    if (!brand) {
      [brand] = await db.insert(brands).values({
        walletAddress: data.brandWalletAddress.toLowerCase(),
      }).returning();
    }

    // Calculate total budget in cents
    const totalBudgetCents = Math.round(parseFloat(data.totalAmount) * 100);

    // Create campaign (already paid, so status is active)
    const [campaign] = await db.insert(campaigns).values({
      brandId: brand.id,
      brandWalletAddress: data.brandWalletAddress,
      platform: data.platform,
      targetingRules: data.targetingRules,
      totalBudget: totalBudgetCents,
      remainingBudget: totalBudgetCents,
      status: 'active', // Active immediately since payment is confirmed
      isActive: true
    }).returning();

    // Record payment
    await db.insert(payments).values({
      campaignId: campaign.id,
      fromAddress: verificationResult.fromAddress!,
      toAddress: verificationResult.toAddress!,
      amount: verificationResult.actualAmount!,
      currency: data.payment.currency,
      transactionHash: data.payment.transactionHash,
      blockNumber: data.payment.blockNumber,
      gasUsed: data.payment.gasUsed,
      status: 'completed'
    });

    // Create campaign actions
    const validActionTypes = ['like', 'comment', 'share', 'follow', 'retweet', 'upvote', 'award'] as const;
    const campaignActionsData = data.actions.map(action => ({
      campaignId: campaign.id,
      actionType: validActionTypes.includes(action.type as any) 
        ? action.type as typeof validActionTypes[number]
        : 'like',
      target: action.target,
      pricePerAction: action.price,
      maxVolume: action.maxVolume,
      isActive: true
    }));

    await db.insert(campaignActions).values(campaignActionsData);

    // Create trackable actions for the extension
    for (const campaignAction of campaignActionsData) {
      await db.insert(actions).values({
        platform: campaign.platform,
        actionType: campaignAction.actionType,
        target: campaignAction.target,
        title: `${campaign.platform} ${campaignAction.actionType}`,
        description: `${campaignAction.actionType} on ${campaign.platform}`,
        price: campaignAction.pricePerAction,
        maxVolume: campaignAction.maxVolume,
        currentVolume: 0,
        eligibilityCriteria: campaign.targetingRules,
        isActive: true,
        expiresAt: campaign.expiresAt
      });
    }

    console.log('Campaign created with payment:', campaign);
    
    return c.json({ 
      success: true, 
      campaign: campaign,
      message: 'Campaign created and activated successfully' 
    });

  } catch (error) {
    console.error('=== CAMPAIGN WITH PAYMENT ERROR ===');
    console.error('Error details:', error);
    
    return c.json({ 
      success: false, 
      error: 'Failed to create campaign',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Confirm payment with blockchain verification (OLD ENDPOINT - keeping for compatibility)
campaignRoutes.post('/:id/payment', async (c) => {
  const db = c.get('db');
  const campaignId = c.req.param('id');
  const body = await c.req.json();

  try {
    // Get campaign
    const [campaign] = await db.select().from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return c.json({ success: false, error: 'Campaign not found' }, 404);
    }

    // Verify transaction on blockchain using RPC
    const verificationResult = await verifyPaymentTransaction({
      transactionHash: body.transactionHash,
      expectedAmount: campaign.totalBudget, // Amount in cents
      expectedFromAddress: campaign.brandWalletAddress,
      expectedToAddress: process.env.ESCROW_CONTRACT_ADDRESS || process.env.ESCROW_WALLET_ADDRESS || '0x1234567890123456789012345678901234567890', // Our escrow address
      network: process.env.ENVIRONMENT === 'production' ? 'base' : 'base-sepolia'
    });

    if (!verificationResult.valid) {
      return c.json({ 
        success: false, 
        error: `Payment verification failed: ${verificationResult.reason}` 
      }, 400);
    }

    // Check if transaction was already used
    const existingPayment = await db.select().from(payments)
      .where(eq(payments.transactionHash, body.transactionHash))
      .limit(1);
    
    if (existingPayment.length > 0) {
      return c.json({ 
        success: false, 
        error: 'Transaction hash already used' 
      }, 400);
    }

    // Record verified payment
    await db.insert(payments).values({
      campaignId: campaignId,
      fromAddress: verificationResult.fromAddress!,
      toAddress: verificationResult.toAddress!,
      amount: verificationResult.actualAmount!,
      currency: verificationResult.currency!,
      transactionHash: body.transactionHash,
      blockNumber: verificationResult.blockNumber?.toString(),
      gasUsed: verificationResult.gasUsed?.toString(),
      status: 'completed'
    });

    // Update campaign status
    await db.update(campaigns)
      .set({ 
        status: 'active',
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId));

    // Get campaign actions to create trackable actions
    const campaignActionsData = await db.select().from(campaignActions)
      .where(eq(campaignActions.campaignId, campaignId));

    // Create ONE action per campaign action with the full maxVolume
    for (const campaignAction of campaignActionsData) {
      await db.insert(actions).values({
        platform: campaign.platform,
        actionType: campaignAction.actionType,
        target: campaignAction.target,
        title: `${campaign.platform} ${campaignAction.actionType}`,
        description: `${campaignAction.actionType} on ${campaign.platform}`,
        price: campaignAction.pricePerAction,
        maxVolume: campaignAction.maxVolume, // Use the full volume from campaign action
        currentVolume: 0,
        eligibilityCriteria: campaign.targetingRules,
        isActive: true,
        expiresAt: campaign.expiresAt
      });
    }

    return c.json({ 
      success: true, 
      message: 'Payment recorded and actions created successfully' 
    });

  } catch (error) {
    console.error('Payment confirmation error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to confirm payment' 
    }, 500);
  }
});

// Activate campaign
campaignRoutes.post('/:id/activate', async (c) => {
  const db = c.get('db');
  const campaignId = c.req.param('id');

  try {
    // Update campaign status to active
    const [updatedCampaign] = await db.update(campaigns)
      .set({ 
        status: 'active',
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(campaigns.id, campaignId))
      .returning();

    // Activate all campaign actions
    await db.update(campaignActions)
      .set({ isActive: true })
      .where(eq(campaignActions.campaignId, campaignId));

    return c.json({ 
      success: true, 
      campaign: updatedCampaign,
      message: 'Campaign activated successfully' 
    });

  } catch (error) {
    console.error('Campaign activation error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to activate campaign' 
    }, 500);
  }
});

// Get available actions for extension users (what users see in extension)
campaignRoutes.get('/actions/available', async (c) => {
  const db = c.get('db');
  const userId = c.req.query('userId');
  const platform = c.req.query('platform');

  try {
    // Get user's social accounts for eligibility checking
    let userSocialAccounts: any[] = [];
    if (userId) {
      userSocialAccounts = await db.select().from(socialAccounts)
        .where(eq(socialAccounts.userId, userId));
    }

    // Get available actions that still have remaining volume
    const baseQuery = db.select().from(actions)
      .where(and(
        eq(actions.isActive, true)
        // Remove the currentVolume check - we want to show actions that have remaining capacity
      ))
      .orderBy(desc(actions.price));

    let availableActions;
    if (platform) {
      availableActions = await baseQuery.where(eq(actions.platform, platform as any));
    } else {
      availableActions = await baseQuery;
    }

    // TODO: Filter by eligibility criteria based on user's social accounts
    // This would check actions.eligibilityCriteria against userSocialAccounts data

    return c.json({ 
      success: true, 
      actions: availableActions,
      userAccounts: userSocialAccounts 
    });

  } catch (error) {
    console.error('Available actions fetch error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch available actions' 
    }, 500);
  }
});

// Get campaigns for brand dashboard (requires authentication and wallet ownership)
campaignRoutes.get('/brand/:walletAddress', authMiddleware, requireWalletOwnership('walletAddress'), async (c) => {
  const db = c.get('db');
  const walletAddress = c.req.param('walletAddress');

  try {
    // Get campaigns for the brand
    const brandCampaigns = await db.select()
    .from(campaigns)
    .where(eq(campaigns.brandWalletAddress, walletAddress))
    .orderBy(desc(campaigns.createdAt));

    // Get campaign actions for each campaign
    const campaignsWithActions = await Promise.all(
      brandCampaigns.map(async (campaign) => {
        const actions = await db.select()
          .from(campaignActions)
          .where(eq(campaignActions.campaignId, campaign.id));
        
        // Get completion count for each action
        const actionsWithVolume = await Promise.all(
          actions.map(async (action) => {
            // Count completed actions for this campaign action
            const completedCount = await db.select()
              .from(actionRuns)
              .innerJoin(
                campaignActions,
                and(
                  eq(actionRuns.actionId, campaignActions.id),
                  eq(campaignActions.id, action.id)
                )
              )
              .where(eq(actionRuns.status, 'dom_verified'));
            
            return {
              id: action.id,
              actionType: action.actionType,
              target: action.target,
              pricePerAction: action.pricePerAction,
              maxVolume: action.maxVolume,
              currentVolume: completedCount.length,
              isActive: action.isActive
            };
          })
        );
        
        return {
          ...campaign,
          actions: actionsWithVolume
        };
      })
    );

    return c.json({ 
      success: true, 
      campaigns: campaignsWithActions 
    });

  } catch (error) {
    console.error('Brand campaigns fetch error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch campaigns' 
    }, 500);
  }
});

// Complete an action (for extension users)
campaignRoutes.post('/actions/:id/complete', async (c) => {
  const db = c.get('db');
  const actionId = c.req.param('id');
  const body = await c.req.json();

  try {
    // Get action
    const [action] = await db.select().from(actions)
      .where(eq(actions.id, actionId))
      .limit(1);

    if (!action) {
      return c.json({ success: false, error: 'Action not found' }, 404);
    }

    if (action.currentVolume >= action.maxVolume) {
      return c.json({ success: false, error: 'Action volume limit reached' }, 400);
    }

    // Create action run (completion record)
    const [actionRun] = await db.insert(actionRuns).values({
      actionId: actionId,
      userId: body.userId || 'anonymous', // Will be real user ID when auth is implemented
      socialAccountId: body.socialAccountId || 'anonymous',
      status: 'dom_verified',
      completedAt: new Date(),
    }).returning();

    // Update action volume and deactivate if fully completed
    const newVolume = action.currentVolume + 1;
    await db.update(actions)
      .set({ 
        currentVolume: newVolume,
        isActive: newVolume < action.maxVolume, // Keep active if there's still volume left
        updatedAt: new Date()
      })
      .where(eq(actions.id, actionId));

    return c.json({ 
      success: true, 
      actionRun,
      message: 'Action completed successfully' 
    });

  } catch (error) {
    console.error('Action completion error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to complete action' 
    }, 500);
  }
});

export default campaignRoutes;