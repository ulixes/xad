import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { campaigns, payments, campaignActions, actions, actionRuns, socialAccounts, brands } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware, requireWalletOwnership } from '../middleware/auth';
import { getContractConfig } from '../config/contracts';

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

// Create draft campaign (Step 1: Before smart contract payment)
campaignRoutes.post('/draft', authMiddleware, zValidator('json', createCampaignSchema), async (c) => {
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

    // Create campaign in pending_payment status
    const [campaign] = await db.insert(campaigns).values({
      id: crypto.randomUUID(),
      brandId: brand.id,
      brandWalletAddress: data.brandWalletAddress.toLowerCase(),
      platform: data.platform,
      targetingRules: data.targetingRules,
      totalBudget: totalBudgetCents,
      remainingBudget: totalBudgetCents,
      status: 'pending_payment'
    }).returning();

    // Create campaign actions
    const validActionTypes = ['like', 'comment', 'share', 'follow', 'retweet', 'upvote', 'award'] as const;
    const campaignActionsData = data.actions.map(action => ({
      campaignId: campaign.id,
      actionType: validActionTypes.includes(action.type as any) 
        ? action.type as typeof validActionTypes[number]
        : 'like',
      target: action.target,
      pricePerAction: action.price,
      maxVolume: action.maxVolume
    }));

    await db.insert(campaignActions).values(campaignActionsData);

    // Get contract configuration
    const contractConfig = getContractConfig();
    
    console.log('Draft campaign created:', campaign.id);
    console.log('Brand ID being returned:', brand.id);
    
    return c.json({ 
      success: true, 
      campaign: campaign,
      brandId: brand.id,
      paymentDetails: {
        campaignId: campaign.id,
        amount: data.totalAmount,
        currency: 'USDC',
        contractAddress: contractConfig.address,
        network: contractConfig.network,
        chainId: contractConfig.chainId
      },
      message: 'Campaign created. Please send USDC payment to smart contract.' 
    });

  } catch (error) {
    console.error('Campaign creation error:', error);
    
    return c.json({ 
      success: false, 
      error: 'Failed to create campaign',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});

// Get campaign status (for polling after payment)
campaignRoutes.get('/:id/status', async (c) => {
  const db = c.get('db');
  const campaignId = c.req.param('id');

  try {
    const [campaign] = await db.select().from(campaigns)
      .where(eq(campaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      return c.json({ success: false, error: 'Campaign not found' }, 404);
    }

    // Get payment if exists
    const [payment] = await db.select().from(payments)
      .where(eq(payments.campaignId, campaignId))
      .orderBy(desc(payments.createdAt))
      .limit(1);

    return c.json({ 
      success: true, 
      campaign: {
        id: campaign.id,
        status: campaign.status,
        isActive: campaign.isActive,
        totalBudget: campaign.totalBudget,
        payment: payment ? {
          transactionHash: payment.transactionHash,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        } : null
      }
    });

  } catch (error) {
    console.error('Campaign status fetch error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch campaign status' 
    }, 500);
  }
});

// Activate campaign (called internally by webhook listener after payment)
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

    // Create trackable actions for the extension
    const campaignActionsData = await db.select().from(campaignActions)
      .where(eq(campaignActions.campaignId, campaignId));

    for (const campaignAction of campaignActionsData) {
      await db.insert(actions).values({
        id: campaignAction.id, // Use same ID to maintain relationship
        platform: updatedCampaign.platform,
        actionType: campaignAction.actionType,
        target: campaignAction.target,
        title: `${updatedCampaign.platform} ${campaignAction.actionType}`,
        description: `${campaignAction.actionType} on ${updatedCampaign.platform}`,
        price: campaignAction.pricePerAction,
        maxVolume: campaignAction.maxVolume,
        currentVolume: 0,
        eligibilityCriteria: updatedCampaign.targetingRules,
        isActive: true,
        expiresAt: updatedCampaign.expiresAt
      });
    }

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

// Get available actions for extension users
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
      .where(eq(actions.isActive, true))
      .orderBy(desc(actions.price));

    let availableActions;
    if (platform) {
      availableActions = await baseQuery.where(eq(actions.platform, platform as any));
    } else {
      availableActions = await baseQuery;
    }

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
campaignRoutes.get('/brand/:walletAddress', authMiddleware, async (c) => {
  const db = c.get('db');
  const walletAddress = c.req.param('walletAddress');
  const session = c.get('authSession');

  try {
    // Verify the wallet address matches the authenticated user
    if (walletAddress.toLowerCase() !== session.address.toLowerCase()) {
      return c.json({ 
        success: false, 
        error: 'Unauthorized - wallet address mismatch' 
      }, 403);
    }

    // Get campaigns for the brand by wallet address (case-insensitive)
    const brandCampaigns = await db.select()
      .from(campaigns)
      .where(eq(campaigns.brandWalletAddress, walletAddress.toLowerCase()))
      .orderBy(desc(campaigns.createdAt));

    // Get campaign actions and payments for each campaign
    const campaignsWithDetails = await Promise.all(
      brandCampaigns.map(async (campaign) => {
        const actions = await db.select()
          .from(campaignActions)
          .where(eq(campaignActions.campaignId, campaign.id));
        
        const [payment] = await db.select()
          .from(payments)
          .where(eq(payments.campaignId, campaign.id))
          .orderBy(desc(payments.createdAt))
          .limit(1);
        
        // Get completion count for each action
        const actionsWithVolume = await Promise.all(
          actions.map(async (action) => {
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
          actions: actionsWithVolume,
          payment: payment ? {
            transactionHash: payment.transactionHash,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt
          } : null
        };
      })
    );

    return c.json({ 
      success: true, 
      campaigns: campaignsWithDetails 
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
      userId: body.userId || 'anonymous',
      socialAccountId: body.socialAccountId || 'anonymous',
      status: 'dom_verified',
      completedAt: new Date(),
    }).returning();

    // Update action volume and deactivate if fully completed
    const newVolume = action.currentVolume + 1;
    await db.update(actions)
      .set({ 
        currentVolume: newVolume,
        isActive: newVolume < action.maxVolume,
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