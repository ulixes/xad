import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../types';
import { campaigns, payments, walletUsers, campaignActions, actions, actionRuns, socialAccounts, users } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

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

  try {
    // Create or get wallet user
    let walletUser = await db.select().from(walletUsers)
      .where(eq(walletUsers.walletAddress, data.brandWalletAddress))
      .limit(1);

    if (walletUser.length === 0) {
      [walletUser[0]] = await db.insert(walletUsers).values({
        walletAddress: data.brandWalletAddress,
        isBrand: true,
        status: 'active'
      }).returning();
    }

    // Calculate total budget in cents
    const totalBudgetCents = Math.round(parseFloat(data.totalAmount) * 100);

    // Create campaign
    const [campaign] = await db.insert(campaigns).values({
      brandWalletAddress: data.brandWalletAddress,
      name: data.name,
      description: data.description,
      platform: data.platform,
      targetingRules: data.targetingRules,
      totalBudget: totalBudgetCents,
      remainingBudget: totalBudgetCents,
      status: 'draft'
    }).returning();

    // Create campaign actions
    const campaignActionsData = data.actions.map(action => ({
      campaignId: campaign.id,
      actionType: action.type,
      target: action.target,
      pricePerAction: Math.round(action.price * 100), // Convert to cents
      maxVolume: action.maxVolume
    }));

    await db.insert(campaignActions).values(campaignActionsData);

    return c.json({ 
      success: true, 
      campaign,
      message: 'Campaign created successfully. Proceed with payment.' 
    });

  } catch (error) {
    console.error('Campaign creation error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create campaign' 
    }, 500);
  }
});

// Confirm payment
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

    // Record payment
    await db.insert(payments).values({
      campaignId: campaignId,
      fromAddress: campaign.brandWalletAddress,
      amount: (parseFloat(body.amount) * 1e18).toString(), // Convert to wei
      currency: 'ETH',
      transactionHash: body.transactionHash,
      blockNumber: body.blockNumber,
      gasUsed: body.gasUsed,
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