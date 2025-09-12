import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users, socialAccounts, instagramAccounts } from "../db/schema";
import type { AppContext } from "../types";

const usersRouter = new Hono<AppContext>();

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  status: z.enum(["pending_verification", "verified", "suspended"]).optional(),
  metadata: z.record(z.any()).optional(),
});

// Get user by ID with social accounts
usersRouter.get("/:id", async (c) => {
  const userId = c.req.param("id");
  const db = c.get("db");

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user.length) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get social accounts with Instagram data
    const userSocialAccounts = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        handle: socialAccounts.handle,
        platformUserId: socialAccounts.platformUserId,
        isVerified: socialAccounts.isVerified,
        lastVerifiedAt: socialAccounts.lastVerifiedAt,
        createdAt: socialAccounts.createdAt,
        updatedAt: socialAccounts.updatedAt,
        instagramData: instagramAccounts,
      })
      .from(socialAccounts)
      .leftJoin(
        instagramAccounts,
        eq(socialAccounts.id, instagramAccounts.socialAccountId)
      )
      .where(eq(socialAccounts.userId, userId));

    return c.json({
      ...user[0],
      socialAccounts: userSocialAccounts,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Get user by wallet address
usersRouter.get("/wallet/:address", async (c) => {
  const walletAddress = c.req.param("address");
  const db = c.get("db");

  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress.toLowerCase()))
      .limit(1);

    if (!user.length) {
      return c.json({ error: "User not found" }, 404);
    }

    // Get social accounts with Instagram data
    const userSocialAccounts = await db
      .select({
        id: socialAccounts.id,
        platform: socialAccounts.platform,
        handle: socialAccounts.handle,
        platformUserId: socialAccounts.platformUserId,
        isVerified: socialAccounts.isVerified,
        lastVerifiedAt: socialAccounts.lastVerifiedAt,
        createdAt: socialAccounts.createdAt,
        updatedAt: socialAccounts.updatedAt,
        instagramData: instagramAccounts,
      })
      .from(socialAccounts)
      .leftJoin(
        instagramAccounts,
        eq(socialAccounts.id, instagramAccounts.socialAccountId)
      )
      .where(eq(socialAccounts.userId, user[0].id));

    return c.json({
      ...user[0],
      socialAccounts: userSocialAccounts,
    });
  } catch (error) {
    console.error("Error fetching user by wallet:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Create new user
usersRouter.post("/", async (c) => {
  const db = c.get("db");
  
  try {
    const body = await c.req.json();
    const validatedData = createUserSchema.parse(body);

    // Check if user already exists
    if (validatedData.email) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existing.length) {
        return c.json({ error: "User with this email already exists" }, 409);
      }
    }

    if (validatedData.walletAddress) {
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, validatedData.walletAddress.toLowerCase()))
        .limit(1);

      if (existing.length) {
        return c.json({ error: "User with this wallet already exists" }, 409);
      }
    }

    const newUser = await db
      .insert(users)
      .values({
        email: validatedData.email,
        walletAddress: validatedData.walletAddress?.toLowerCase(),
        status: "pending_verification",
        metadata: {},
        totalEarned: 0,
        availableBalance: 0,
      })
      .returning();

    return c.json(newUser[0], 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    console.error("Error creating user:", error);
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// Update user
usersRouter.put("/:id", async (c) => {
  const userId = c.req.param("id");
  const db = c.get("db");

  try {
    const body = await c.req.json();
    const validatedData = updateUserSchema.parse(body);

    const updatedUser = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser.length) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(updatedUser[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

export default usersRouter;