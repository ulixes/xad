import { Hono } from "hono";
import { eq, and, inArray, sql } from "drizzle-orm";
import { actionRuns, campaignActions, users, socialAccounts } from "../db/schema";
import type { Context } from "../types";
import { userAuthMiddleware } from "../middleware/userAuth";

const app = new Hono<Context>();

// Apply authentication to all routes
// Apply authentication to all routes - action runs are for extension users
app.use('*', userAuthMiddleware);

// Start a new action run (with duplicate check)
app.post("/start", async (c) => {
  try {
    const db = c.get("db");
    const { actionId, userId, socialAccountId } = await c.req.json();

    // Validate required fields
    if (!actionId || !userId || !socialAccountId) {
      return c.json({ error: "Missing required fields: actionId, userId, socialAccountId" }, 400);
    }

    // Check for existing run (including failed ones that can be retried)
    const existingRun = await db
      .select()
      .from(actionRuns)
      .where(
        and(
          eq(actionRuns.actionId, actionId),
          eq(actionRuns.userId, userId),
          eq(actionRuns.socialAccountId, socialAccountId),
          inArray(actionRuns.status, ['pending_verification', 'dom_verified', 'cdp_verified', 'failed'])
        )
      )
      .limit(1);

    if (existingRun.length > 0) {
      const run = existingRun[0];
      
      // If it's a failed run, reset it to pending_verification for retry
      if (run.status === 'failed') {
        console.log('Resetting failed action run for retry:', run.id);
        const [updatedRun] = await db
          .update(actionRuns)
          .set({
            status: 'pending_verification',
            verificationData: { 
              ...(run.verificationData as any || {}),
              retryAttempt: true,
              retriedAt: new Date().toISOString()
            },
            updatedAt: new Date()
          })
          .where(eq(actionRuns.id, run.id))
          .returning();
        
        return c.json(updatedRun);
      }
      
      console.log('Returning existing action run:', run.id);
      // Return existing run instead of creating duplicate
      return c.json(run);
    }

    // Get campaign action details for pricing
    const [campaignAction] = await db
      .select()
      .from(campaignActions)
      .where(eq(campaignActions.id, actionId));

    if (!campaignAction) {
      return c.json({ error: "Campaign action not found" }, 404);
    }

    // Create new action run
    const [newActionRun] = await db
      .insert(actionRuns)
      .values({
        actionId,
        userId,
        socialAccountId,
        rewardAmount: campaignAction.pricePerAction,
        status: "pending_verification", // Start with pending_verification
        proof: {
          sessionId: crypto.randomUUID(),
          device: 'extension',
          startedAt: new Date().toISOString()
        }
      })
      .returning();

    // Increment campaign action's current volume
    await db
      .update(campaignActions)
      .set({ 
        currentVolume: sql`${campaignActions.currentVolume} + 1`,
        updatedAt: new Date()
      })
      .where(eq(campaignActions.id, actionId));

    console.log('Created new action run:', newActionRun.id);
    return c.json(newActionRun, 201);
  } catch (error) {
    console.error("Error starting action run:", error);
    return c.json({ error: "Failed to start action run" }, 500);
  }
});

// Create a new action run (legacy endpoint)
app.post("/", async (c) => {
  try {
    const db = c.get("db");
    const body = await c.req.json();
    
    const {
      actionId,
      userId, 
      socialAccountId,
      brandId,
      rewardAmount,
      proof = {},
    } = body;

    // Validate required fields
    if (!actionId || !userId || !socialAccountId) {
      return c.json({ error: "Missing required fields: actionId, userId, socialAccountId" }, 400);
    }

    // Create the action run
    const [newActionRun] = await db
      .insert(actionRuns)
      .values({
        actionId,
        userId,
        socialAccountId,
        brandId,
        rewardAmount,
        status: "pending_verification",
        proof,
      })
      .returning();

    return c.json(newActionRun, 201);
  } catch (error) {
    console.error("Error creating action run:", error);
    return c.json({ error: "Failed to create action run" }, 500);
  }
});

// Get action runs for a user with action details
app.get("/user/:userId", async (c) => {
  try {
    const db = c.get("db");
    const userId = c.req.param("userId");

    const userActionRuns = await db
      .select({
        id: actionRuns.id,
        actionId: actionRuns.actionId,
        userId: actionRuns.userId,
        socialAccountId: actionRuns.socialAccountId,
        brandId: actionRuns.brandId,
        rewardAmount: actionRuns.rewardAmount,
        status: actionRuns.status,
        proof: actionRuns.proof,
        verificationData: actionRuns.verificationData,
        paymentData: actionRuns.paymentData,
        completedAt: actionRuns.completedAt,
        paidAt: actionRuns.paidAt,
        createdAt: actionRuns.createdAt,
        updatedAt: actionRuns.updatedAt,
        action: {
          id: campaignActions.id,
          platform: 'tiktok', // We'll need to join with campaigns for this
          actionType: campaignActions.actionType,
          target: campaignActions.target,
          title: sql`'TikTok ' || ${campaignActions.actionType}`,
          description: sql`${campaignActions.actionType} || ' on TikTok'`,
          price: campaignActions.pricePerAction,
        }
      })
      .from(actionRuns)
      .leftJoin(campaignActions, eq(actionRuns.actionId, campaignActions.id))
      .where(eq(actionRuns.userId, userId))
      .orderBy(actionRuns.createdAt);

    return c.json(userActionRuns);
  } catch (error) {
    console.error("Error fetching action runs:", error);
    return c.json({ error: "Failed to fetch action runs" }, 500);
  }
});

// Get a specific action run
app.get("/:id", async (c) => {
  try {
    const db = c.get("db");
    const id = c.req.param("id");

    const [actionRun] = await db
      .select()
      .from(actionRuns)
      .where(eq(actionRuns.id, id));

    if (!actionRun) {
      return c.json({ error: "Action run not found" }, 404);
    }

    return c.json(actionRun);
  } catch (error) {
    console.error("Error fetching action run:", error);
    return c.json({ error: "Failed to fetch action run" }, 500);
  }
});

// Update action run status
app.patch("/:id", async (c) => {
  try {
    const db = c.get("db");
    const id = c.req.param("id");
    const body = await c.req.json();

    const allowedUpdates = ["status", "proof", "verificationData", "paymentData", "completedAt", "paidAt"];
    const updates: any = {};

    for (const field of allowedUpdates) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }

    updates.updatedAt = new Date();

    const [updatedActionRun] = await db
      .update(actionRuns)
      .set(updates)
      .where(eq(actionRuns.id, id))
      .returning();

    if (!updatedActionRun) {
      return c.json({ error: "Action run not found" }, 404);
    }

    return c.json(updatedActionRun);
  } catch (error) {
    console.error("Error updating action run:", error);
    return c.json({ error: "Failed to update action run" }, 500);
  }
});

export default app;