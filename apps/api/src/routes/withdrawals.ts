import { Hono } from "hono";
import { eq, and, gte, sql } from "drizzle-orm";
import { actionRuns, users, payments } from "../db/schema";
import type { Context } from "../types";
import { userAuthMiddleware } from "../middleware/userAuth";

const app = new Hono<Context>();

// Apply authentication to ALL routes
// Apply authentication to all routes - withdrawals are for extension users
app.use('*', userAuthMiddleware);

// Process a withdrawal request
app.post("/", async (c) => {
  try {
    const db = c.get("db");
    const body = await c.req.json();
    
    const { userId, amount } = body;

    // Validate required fields
    if (!userId || !amount) {
      return c.json({ error: "Missing required fields: userId, amount" }, 400);
    }

    // Minimum withdrawal amount is $5
    if (amount < 500) { // Amount in cents
      return c.json({ error: "Minimum withdrawal amount is $5.00" }, 400);
    }

    // Get user details
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    // Check if user has sufficient balance
    if (user.availableBalance < amount) {
      return c.json({ error: "Insufficient balance" }, 400);
    }

    // Create withdrawal payment record
    const [withdrawal] = await db
      .insert(payments)
      .values({
        userId,
        fromAddress: "escrow", // From escrow account
        toAddress: user.walletAddress || "",
        amount,
        currency: "USD",
        status: "pending",
        metadata: {
          type: "withdrawal",
          requestedAt: new Date().toISOString()
        }
      })
      .returning();

    // Update user's available balance
    await db
      .update(users)
      .set({
        availableBalance: sql`${users.availableBalance} - ${amount}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    // Mark eligible action runs as paid
    const eligibleActionRuns = await db
      .select()
      .from(actionRuns)
      .where(
        and(
          eq(actionRuns.userId, userId),
          eq(actionRuns.status, "completed"),
          // Only mark actions completed more than 7 days ago
          gte(sql`extract(epoch from now() - ${actionRuns.completedAt})`, 7 * 24 * 60 * 60)
        )
      );

    if (eligibleActionRuns.length > 0) {
      await db
        .update(actionRuns)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentData: { withdrawalId: withdrawal.id },
          updatedAt: new Date()
        })
        .where(
          and(
            eq(actionRuns.userId, userId),
            eq(actionRuns.status, "completed"),
            gte(sql`extract(epoch from now() - ${actionRuns.completedAt})`, 7 * 24 * 60 * 60)
          )
        );
    }

    return c.json({
      success: true,
      withdrawalId: withdrawal.id,
      amount: amount / 100, // Return amount in dollars
      status: withdrawal.status,
      message: "Withdrawal request processed successfully"
    }, 201);
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return c.json({ error: "Failed to process withdrawal" }, 500);
  }
});

// Get withdrawal history for a user
app.get("/user/:userId", async (c) => {
  try {
    const db = c.get("db");
    const userId = c.req.param("userId");

    const withdrawals = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.userId, userId),
          eq(sql`${payments.metadata}->>'type'`, "withdrawal")
        )
      )
      .orderBy(payments.createdAt);

    return c.json(withdrawals);
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return c.json({ error: "Failed to fetch withdrawals" }, 500);
  }
});

export default app;