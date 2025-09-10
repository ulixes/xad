import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { campaigns, payments, campaignActions, actions, actionRuns, socialAccounts, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { verifyPaymentTransaction } from '../services/paymentVerification';

const campaignRoutes = new Hono<{ Bindings: Env }>();

// Schema for campaign creation
const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
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

// Create new campaign
campaignRoutes.post('/', zValidator('json', createCampaignSchema), async (c) => {
  const db = c.get('db');
  const data = c.req.valid('json');
  
  console.log('=== CAMPAIGN CREATION REQUEST ===');
  console.log('Request data:', JSON.stringify(data, null, 2));

  try {
    // Create or get user by wallet address
    let user = await db.select().from(users)
      .where(eq(users.walletAddress, data.brandWalletAddress))
      .limit(1);

    if (user.length === 0) {
      const newUser = await db.insert(users).values({
        walletAddress: data.brandWalletAddress,
        status: 'active',
        metadata: {}
      }).returning();
      user = newUser;
    }

    // Calculate total budget in cents
    const totalBudgetCents = Math.round(parseFloat(data.totalAmount) * 100);

    // Create campaign
    const [campaign] = await db.insert(campaigns).values({
      userId: user[0].id,
      brandWalletAddress: data.brandWalletAddress, // Keep for backward compatibility
      name: data.name,
      description: data.description,
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
      pricePerAction: Math.round(action.price * 100), // Convert to cents
      maxVolume: action.maxVolume
    }));

    await db.insert(campaignActions).values(campaignActionsData);

    console.log('Campaign created successfully:', campaign);
    
    return c.json({ 
      success: true, 
      campaign,
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

// Confirm payment with blockchain verification
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

    // Get campaign actions to create individual trackable actions
    const campaignActionsData = await db.select().from(campaignActions)
      .where(eq(campaignActions.campaignId, campaignId));

    // Create individual actions that the extension can query
    for (const campaignAction of campaignActionsData) {
      for (let i = 0; i < campaignAction.maxVolume; i++) {
        await db.insert(actions).values({
          platform: campaign.platform,
          actionType: campaignAction.actionType,
          target: campaignAction.target,
          title: `${campaign.name} - ${campaignAction.actionType}`,
          description: campaign.description,
          price: campaignAction.pricePerAction,
          maxVolume: 1, // Each action is for 1 completion
          eligibilityCriteria: campaign.targetingRules,
          isActive: true,
          expiresAt: campaign.expiresAt
        });
      }
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
    let userSocialAccounts = [];
    if (userId) {
      userSocialAccounts = await db.select().from(socialAccounts)
        .where(eq(socialAccounts.userId, userId));
    }

    // Get available actions
    let query = db.select().from(actions)
      .where(and(
        eq(actions.isActive, true),
        eq(actions.currentVolume, 0) // Not yet completed
      ))
      .orderBy(desc(actions.price));

    if (platform) {
      query = query.where(eq(actions.platform, platform));
    }

    const availableActions = await query;

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

// Get campaigns for brand dashboard
campaignRoutes.get('/brand/:walletAddress', async (c) => {
  const db = c.get('db');
  const walletAddress = c.req.param('walletAddress');

  try {
    const brandCampaigns = await db.select({
      campaign: campaigns,
      totalActions: 'COUNT(campaign_actions.id)',
      totalCompletions: 'COUNT(action_runs.id)',
      totalSpent: 'SUM(payments.amount)'
    })
    .from(campaigns)
    .leftJoin(campaignActions, eq(campaigns.id, campaignActions.campaignId))
    .leftJoin(payments, eq(campaigns.id, payments.campaignId))
    .where(eq(campaigns.brandWalletAddress, walletAddress))
    .groupBy(campaigns.id)
    .orderBy(desc(campaigns.createdAt));

    return c.json({ 
      success: true, 
      campaigns: brandCampaigns 
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
      return c.json({ success: false, error: 'Action already completed' }, 400);
    }

    // Create action run (completion record)
    const [actionRun] = await db.insert(actionRuns).values({
      actionId: actionId,
      userId: body.userId || 'anonymous', // Will be real user ID when auth is implemented
      socialAccountId: body.socialAccountId || 'anonymous',
      status: 'dom_verified',
      completedAt: new Date(),
    }).returning();

    // Update action volume
    await db.update(actions)
      .set({ 
        currentVolume: action.currentVolume + 1,
        isActive: action.currentVolume + 1 < action.maxVolume,
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