import { Hono } from "hono";
import { z } from "zod";
import { eq, and, sql, gte, or, inArray } from "drizzle-orm";
import { 
  socialAccounts, 
  instagramAccounts, 
  instagramAudienceDemographics, 
  instagramContentPerformance, 
  tiktokAccounts,
  tiktokAudienceDemographics,
  tiktokContentPerformance,
  actions, 
  actionRuns 
} from "../db/schema";
import type { AppContext } from "../types";

const socialAccountsRouter = new Hono<AppContext>();

// Validation schemas
const createSocialAccountSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(["instagram", "twitter", "tiktok", "youtube"]),
  handle: z.string().min(1),
  platformUserId: z.string().optional(),
});

const createTikTokDataSchema = z.object({
  socialAccountId: z.string().uuid(),
  tiktokUserId: z.string(),
  secUid: z.string().optional(),
  uniqueId: z.string(),
  nickname: z.string().optional(),
  avatarUrl: z.string().optional(), // Changed from avatar
  bio: z.string().optional(), // Changed from signature
  isVerified: z.boolean().default(false), // Changed from verified
  isPrivate: z.boolean().default(false),
  region: z.string().optional(),
  language: z.string().optional(),
  createTime: z.union([z.string(), z.number()]).optional(),
  analyticsOn: z.boolean().default(false),
  proAccountInfo: z.any().optional(),
  followerCount: z.number().default(0),
  followingCount: z.number().default(0),
  likeCount: z.number().default(0), // Changed from heartCount
  videoCount: z.number().default(0),
  profileViewCount: z.number().default(0), // Changed from profileViews
  friendCount: z.number().default(0),
  videoViews30d: z.number().optional(),
  profileViews30d: z.number().optional(),
  shares30d: z.number().optional(),
  comments30d: z.number().optional(),
  engagementRate: z.number().optional(), // Simplified from engagementRate30d
  avgWatchTime: z.number().optional(), // Simplified from avgWatchTime30d
  completionRate: z.number().optional(), // Simplified from completionRate30d
  audienceGenderSplit: z.any().optional(),
  audienceAgeDistribution: z.any().optional(),
  audienceTopCountries: z.any().optional(),
  rawApiData: z.any().optional(),
  collectionTimestamp: z.number().optional(),
  topContent: z.array(z.any()).optional(),
});

const createInstagramDataSchema = z.object({
  socialAccountId: z.string().uuid(),
  instagramUserId: z.string().optional(),
  username: z.string(),
  fullName: z.string().optional(),
  biography: z.string().optional(),
  profilePicUrl: z.string().optional(),
  followerCount: z.number().default(0),
  followingCount: z.number().default(0),
  postCount: z.number().default(0),
  isVerified: z.boolean().default(false),
  isPrivate: z.boolean().default(false),
  isBusinessAccount: z.boolean().default(false),
  isProfessional: z.boolean().default(false),
  accountType: z.enum(["personal", "business", "creator"]).optional(),
  category: z.string().optional(),
  externalUrl: z.string().optional(),
  locationCountry: z.string().optional(),
  locationCity: z.string().optional(),
  mediaCount: z.number().optional(),
  profileVisits7d: z.number().optional(),
  accountsReached7d: z.number().optional(),
  accountsEngaged7d: z.number().optional(),
  followerGrowth7d: z.number().optional(),
  profileVisits30d: z.number().optional(),
  accountsReached30d: z.number().optional(),
  accountsEngaged30d: z.number().optional(),
  followerGrowth30d: z.number().optional(),
  profileVisits90d: z.number().optional(),
  followerGrowth90d: z.number().optional(),
  engagementRate: z.number().optional(),
  videoContentRatio: z.number().optional(),
  lastCollectedAt: z.string().optional(),
  rawData: z.any().optional(),
});

// Get social account by ID with platform-specific data
socialAccountsRouter.get("/:id", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    const account = await db
      .select()
      .from(socialAccounts)
      .leftJoin(
        instagramAccounts,
        eq(socialAccounts.id, instagramAccounts.socialAccountId)
      )
      .leftJoin(
        tiktokAccounts,
        eq(socialAccounts.id, tiktokAccounts.socialAccountId)
      )
      .where(eq(socialAccounts.id, accountId))
      .limit(1);

    if (!account.length) {
      return c.json({ error: "Social account not found" }, 404);
    }

    let demographics = null;
    let contentPerformance = [];

    // If it's an Instagram account, get demographics and performance data
    if (account[0].instagram_accounts) {
      demographics = await db
        .select()
        .from(instagramAudienceDemographics)
        .where(eq(instagramAudienceDemographics.instagramAccountId, account[0].instagram_accounts.id))
        .orderBy(instagramAudienceDemographics.createdAt)
        .limit(1);

      contentPerformance = await db
        .select()
        .from(instagramContentPerformance)
        .where(eq(instagramContentPerformance.instagramAccountId, account[0].instagram_accounts.id))
        .orderBy(instagramContentPerformance.createdAt)
        .limit(10);
    }

    // If it's a TikTok account, get demographics and performance data
    if (account[0].tiktok_accounts) {
      demographics = await db
        .select()
        .from(tiktokAudienceDemographics)
        .where(eq(tiktokAudienceDemographics.tiktokAccountId, account[0].tiktok_accounts.id))
        .orderBy(tiktokAudienceDemographics.createdAt)
        .limit(1);

      contentPerformance = await db
        .select()
        .from(tiktokContentPerformance)
        .where(eq(tiktokContentPerformance.tiktokAccountId, account[0].tiktok_accounts.id))
        .orderBy(tiktokContentPerformance.createdAt)
        .limit(10);
    }

    return c.json({
      ...account[0].social_accounts,
      instagramData: account[0].instagram_accounts,
      tiktokData: account[0].tiktok_accounts,
      demographics: demographics?.[0] || null,
      contentPerformance,
    });
  } catch (error) {
    console.error("Error fetching social account:", error);
    return c.json({ error: "Failed to fetch social account" }, 500);
  }
});

// Get all social accounts for a user
socialAccountsRouter.get("/user/:userId", async (c) => {
  const userId = c.req.param("userId");
  const db = c.get("db");

  try {
    const accounts = await db
      .select({
        id: socialAccounts.id,
        userId: socialAccounts.userId,
        platform: socialAccounts.platform,
        handle: socialAccounts.handle,
        platformUserId: socialAccounts.platformUserId,
        isVerified: socialAccounts.isVerified,
        lastVerifiedAt: socialAccounts.lastVerifiedAt,
        metadata: socialAccounts.metadata,
        createdAt: socialAccounts.createdAt,
        updatedAt: socialAccounts.updatedAt,
        // Include Instagram data if available
        instagramData: instagramAccounts,
        // Include TikTok data if available
        tiktokData: tiktokAccounts,
      })
      .from(socialAccounts)
      .leftJoin(
        instagramAccounts,
        eq(socialAccounts.id, instagramAccounts.socialAccountId)
      )
      .leftJoin(
        tiktokAccounts,
        eq(socialAccounts.id, tiktokAccounts.socialAccountId)
      )
      .where(eq(socialAccounts.userId, userId));

    // Return the properly formatted accounts
    return c.json(accounts);
  } catch (error) {
    console.error("Error fetching user social accounts:", error);
    return c.json({ error: "Failed to fetch social accounts" }, 500);
  }
});

// Create social account
socialAccountsRouter.post("/", async (c) => {
  const db = c.get("db");

  try {
    const body = await c.req.json();
    const validatedData = createSocialAccountSchema.parse(body);

    // Check if account already exists for this user/platform/handle
    const existing = await db
      .select()
      .from(socialAccounts)
      .where(
        and(
          eq(socialAccounts.userId, validatedData.userId),
          eq(socialAccounts.platform, validatedData.platform),
          eq(socialAccounts.handle, validatedData.handle)
        )
      )
      .limit(1);

    if (existing.length) {
      return c.json({ error: "Social account already exists" }, 409);
    }

    const newAccount = await db
      .insert(socialAccounts)
      .values({
        userId: validatedData.userId,
        platform: validatedData.platform,
        handle: validatedData.handle,
        platformUserId: validatedData.platformUserId,
        isVerified: false,
        metadata: {},
      })
      .returning();

    return c.json(newAccount[0], 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    console.error("Error creating social account:", error);
    return c.json({ error: "Failed to create social account" }, 500);
  }
});

// Update TikTok account data
socialAccountsRouter.post("/:id/tiktok-data", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    const body = await c.req.json();
    console.log("Received TikTok data for account:", accountId, body);
    
    const validatedData = createTikTokDataSchema.parse({
      ...body,
      socialAccountId: accountId,
    });

    // Verify the social account exists and is TikTok
    const account = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, accountId))
      .limit(1);

    if (!account.length) {
      return c.json({ error: "Social account not found" }, 404);
    }

    if (account[0].platform !== "tiktok") {
      return c.json({ error: "Not a TikTok account" }, 400);
    }

    // Check if TikTok data already exists
    const existingTikTok = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.socialAccountId, accountId))
      .limit(1);

    // Extract content and audience data for separate tables, and remove fields not in DB
    const { 
      topContent, 
      audienceGenderSplit,
      audienceAgeDistribution,
      audienceTopCountries,
      collectionTimestamp,
      ...tiktokData 
    } = validatedData;

    // Map fields to database column names
    const dbData = {
      socialAccountId: tiktokData.socialAccountId,
      tiktokUserId: tiktokData.tiktokUserId,
      secUid: tiktokData.secUid,
      uniqueId: tiktokData.uniqueId,
      nickname: tiktokData.nickname,
      avatarUrl: tiktokData.avatarUrl,
      bio: tiktokData.bio,
      isVerified: tiktokData.isVerified,
      isPrivate: tiktokData.isPrivate,
      region: tiktokData.region,
      language: tiktokData.language,
      createTime: tiktokData.createTime ? String(tiktokData.createTime) : null,
      analyticsOn: tiktokData.analyticsOn,
      proAccountInfo: tiktokData.proAccountInfo,
      followerCount: tiktokData.followerCount,
      followingCount: tiktokData.followingCount,
      likeCount: tiktokData.likeCount,
      videoCount: tiktokData.videoCount,
      profileViewCount: tiktokData.profileViewCount,
      friendCount: tiktokData.friendCount,
      videoViews30d: tiktokData.videoViews30d,
      profileViews30d: tiktokData.profileViews30d,
      shares30d: tiktokData.shares30d,
      comments30d: tiktokData.comments30d,
      engagementRate: tiktokData.engagementRate,
      avgWatchTime: tiktokData.avgWatchTime,
      completionRate: tiktokData.completionRate,
      rawApiData: tiktokData.rawApiData,
    };

    let tiktokAccountData;
    if (existingTikTok.length) {
      // Update existing
      tiktokAccountData = await db
        .update(tiktokAccounts)
        .set({
          ...dbData,
          updatedAt: new Date(),
          lastCollectedAt: new Date(),
        })
        .where(eq(tiktokAccounts.socialAccountId, accountId))
        .returning();
    } else {
      // Insert new
      tiktokAccountData = await db
        .insert(tiktokAccounts)
        .values({
          ...dbData,
          lastCollectedAt: new Date(),
        })
        .returning();
    }

    // If we have content performance data, insert it
    if (topContent && topContent.length > 0) {
      const contentData = topContent.map((item: any) => ({
        tiktokAccountId: tiktokAccountData[0].id,
        contentId: item.itemId || item.id || '',
        contentType: item.itemType ? String(item.itemType) : null,
        description: item.description || item.desc,
        createdTime: item.createTime ? String(item.createTime) : null,
        duration: item.duration,
        coverUrl: item.coverUrl,
        playCount: String(item.playCount || 0),
        likeCount: item.likeCount || 0,
        commentCount: item.commentCount || 0,
        shareCount: item.shareCount || 0,
        favoriteCount: item.favoriteCount || 0,
        visibility: item.visibility,
        isPinned: item.isPinned || false,
      }));

      // Delete old content data and insert new
      await db
        .delete(tiktokContentPerformance)
        .where(eq(tiktokContentPerformance.tiktokAccountId, tiktokAccountData[0].id));
      
      if (contentData.length > 0) {
        await db.insert(tiktokContentPerformance).values(contentData);
      }
    }

    // If we have audience demographics, insert it
    if ((audienceGenderSplit || audienceAgeDistribution || audienceTopCountries) && 
        (audienceGenderSplit || audienceAgeDistribution || audienceTopCountries)) {
      const audienceData = {
        tiktokAccountId: tiktokAccountData[0].id,
        genderMalePct: audienceGenderSplit?.male || null,
        genderFemalePct: audienceGenderSplit?.female || null,
        genderOtherPct: audienceGenderSplit?.other || null,
        age13_17Pct: audienceAgeDistribution?.['13-17'] || null,
        age18_24Pct: audienceAgeDistribution?.['18-24'] || null,
        age25_34Pct: audienceAgeDistribution?.['25-34'] || null,
        age35_44Pct: audienceAgeDistribution?.['35-44'] || null,
        age45_54Pct: audienceAgeDistribution?.['45-54'] || null,
        age55PlusPct: audienceAgeDistribution?.['55+'] || null,
        topCountries: audienceTopCountries || null,
        topCities: null,
        activeTimes: null,
        devices: null,
      };

      // Delete old audience data and insert new
      await db
        .delete(tiktokAudienceDemographics)
        .where(eq(tiktokAudienceDemographics.tiktokAccountId, tiktokAccountData[0].id));
      
      await db.insert(tiktokAudienceDemographics).values(audienceData);
    }

    // Update social account verification status
    await db
      .update(socialAccounts)
      .set({
        isVerified: true,
        lastVerifiedAt: new Date(),
        platformUserId: validatedData.tiktokUserId || account[0].platformUserId,
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, accountId));

    return c.json(tiktokAccountData[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    console.error("Error updating TikTok data:", error);
    return c.json({ error: "Failed to update TikTok data", details: error.message }, 500);
  }
});

// Update Instagram account data
socialAccountsRouter.post("/:id/instagram-data", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    const body = await c.req.json();
    console.log("Received Instagram data for account:", accountId, body);
    
    const validatedData = createInstagramDataSchema.parse({
      ...body,
      socialAccountId: accountId,
    });

    // Verify the social account exists and is Instagram
    const account = await db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.id, accountId))
      .limit(1);

    if (!account.length) {
      return c.json({ error: "Social account not found" }, 404);
    }

    if (account[0].platform !== "instagram") {
      return c.json({ error: "Not an Instagram account" }, 400);
    }

    // Check if Instagram data already exists
    const existingInstagram = await db
      .select()
      .from(instagramAccounts)
      .where(eq(instagramAccounts.socialAccountId, accountId))
      .limit(1);

    // Prepare data for database, removing collectionErrors
    const { collectionErrors, ...dbData } = validatedData;

    let instagramData;
    if (existingInstagram.length) {
      // Update existing
      instagramData = await db
        .update(instagramAccounts)
        .set({
          ...dbData,
          updatedAt: new Date(),
          lastCollectedAt: new Date(),
        })
        .where(eq(instagramAccounts.socialAccountId, accountId))
        .returning();
    } else {
      // Insert new
      instagramData = await db
        .insert(instagramAccounts)
        .values({
          ...dbData,
          lastCollectedAt: new Date(),
        })
        .returning();
    }

    // Update social account verification status
    await db
      .update(socialAccounts)
      .set({
        isVerified: true,
        lastVerifiedAt: new Date(),
        platformUserId: validatedData.instagramUserId || account[0].platformUserId,
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, accountId));

    return c.json(instagramData[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    console.error("Error updating Instagram data:", error);
    return c.json({ error: "Failed to update Instagram data", details: error.message }, 500);
  }
});

// Get eligible actions for a social account
socialAccountsRouter.get("/:id/eligible-actions", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    // First, get the social account with Instagram data if available
    const accountData = await db
      .select()
      .from(socialAccounts)
      .leftJoin(
        instagramAccounts,
        eq(socialAccounts.id, instagramAccounts.socialAccountId)
      )
      .where(eq(socialAccounts.id, accountId))
      .limit(1);

    if (!accountData.length) {
      return c.json({ error: "Social account not found" }, 404);
    }

    const account = accountData[0];
    
    // Drizzle returns joined tables with table names as keys
    const socialAccount = account.social_accounts;
    const instagramData = account.instagram_accounts;
    
    if (!socialAccount) {
      return c.json({ error: "Social account data not found" }, 404);
    }
    
    const platform = socialAccount.platform as string;
    const userId = socialAccount.userId;

    // Build account metadata for eligibility checking
    const accountMetadata = {
      platform,
      handle: socialAccount.handle,
      isVerified: socialAccount.isVerified,
      ...(instagramData && {
        followerCount: instagramData.followerCount,
        followingCount: instagramData.followingCount,
        postCount: instagramData.postCount,
        engagementRate: instagramData.engagementRate ? parseFloat(instagramData.engagementRate) : null,
        isBusinessAccount: instagramData.isBusinessAccount,
        isProfessional: instagramData.isProfessional,
        accountType: instagramData.accountType,
        category: instagramData.category,
        locationCountry: instagramData.locationCountry,
        locationCity: instagramData.locationCity,
      }),
    };

    // Get all active actions for the platform with user's action runs
    console.log('Fetching actions for platform:', platform, 'userId:', userId);
    
    // Fetch actions with LEFT JOIN to get user's action runs
    const actionsWithRuns = await db
      .select({
        // Action fields
        actionId: actions.id,
        actionType: actions.actionType,
        target: actions.target,
        title: actions.title,
        description: actions.description,
        price: actions.price,
        maxVolume: actions.maxVolume,
        currentVolume: actions.currentVolume,
        eligibilityCriteria: actions.eligibilityCriteria,
        expiresAt: actions.expiresAt,
        isActive: actions.isActive,
        // Action run fields (null if not started)
        actionRunId: actionRuns.id,
        actionRunStatus: actionRuns.status,
        actionRunStartedAt: actionRuns.createdAt,
        actionRunCompletedAt: actionRuns.completedAt,
        actionRunRewardAmount: actionRuns.rewardAmount,
      })
      .from(actions)
      .leftJoin(
        actionRuns,
        and(
          eq(actions.id, actionRuns.actionId),
          eq(actionRuns.userId, userId),
          eq(actionRuns.socialAccountId, accountId),
          // Only include recent runs (last 48 hours) or active ones
          sql`(
            ${actionRuns.createdAt} > NOW() - INTERVAL '48 hours'
            OR ${actionRuns.status} IN ('pending_verification', 'dom_verified', 'cdp_verified')
          )`
        )
      )
      .where(
        and(
          eq(actions.platform, platform),
          eq(actions.isActive, true),
          sql`${actions.currentVolume} < ${actions.maxVolume}`,
          sql`${actions.expiresAt} IS NULL OR ${actions.expiresAt} > NOW()`
        )
      );
    console.log('Actions with runs found:', actionsWithRuns.length);

    // Filter actions based on eligibility criteria and completion status
    const eligibleActions = actionsWithRuns.filter(action => {
      // Skip if already completed or paid
      if (action.actionRunStatus === 'completed' || action.actionRunStatus === 'paid') {
        return false;
      }
      
      const criteria = action.eligibilityCriteria as any;
      
      // If no criteria specified, action is available to all
      if (!criteria || Object.keys(criteria).length === 0) {
        return true;
      }

      // Check minimum followers
      if (criteria.minFollowers && instagramData) {
        if (instagramData.followerCount < criteria.minFollowers) {
          return false;
        }
      }

      // Check maximum followers
      if (criteria.maxFollowers && instagramData) {
        if (instagramData.followerCount > criteria.maxFollowers) {
          return false;
        }
      }

      // Check minimum engagement rate
      if (criteria.minEngagementRate && instagramData?.engagementRate) {
        const engagementRate = parseFloat(instagramData.engagementRate);
        if (engagementRate < criteria.minEngagementRate) {
          return false;
        }
      }

      // Check account type
      if (criteria.accountTypes && Array.isArray(criteria.accountTypes) && instagramData) {
        if (!criteria.accountTypes.includes(instagramData.accountType)) {
          return false;
        }
      }

      // Check categories
      if (criteria.categories && Array.isArray(criteria.categories) && instagramData?.category) {
        if (!criteria.categories.includes(instagramData.category)) {
          return false;
        }
      }

      // Check location country
      if (criteria.countries && Array.isArray(criteria.countries) && instagramData?.locationCountry) {
        if (!criteria.countries.includes(instagramData.locationCountry)) {
          return false;
        }
      }

      // Check location city
      if (criteria.cities && Array.isArray(criteria.cities) && instagramData?.locationCity) {
        if (!criteria.cities.includes(instagramData.locationCity)) {
          return false;
        }
      }

      // Check if account is verified (if required)
      if (criteria.requireVerified === true) {
        if (!socialAccount.isVerified) {
          return false;
        }
      }

      // Check if business/professional account required
      if (criteria.requireBusinessAccount === true && instagramData) {
        if (!instagramData.isBusinessAccount && !instagramData.isProfessional) {
          return false;
        }
      }

      // Check minimum posts
      if (criteria.minPosts && instagramData) {
        if (instagramData.postCount < criteria.minPosts) {
          return false;
        }
      }

      return true;
    });

    // Transform actions with user run data
    const transformedActions = eligibleActions.map(action => ({
      id: action.actionId,
      platform, // Include platform from the account
      actionType: action.actionType,
      target: action.target,
      title: action.title,
      description: action.description,
      price: action.price,
      availableVolume: action.maxVolume - action.currentVolume,
      percentageComplete: Math.round((action.currentVolume / action.maxVolume) * 100),
      // Include user's action run data if exists
      userActionRun: action.actionRunId ? {
        id: action.actionRunId,
        status: action.actionRunStatus,
        startedAt: action.actionRunStartedAt,
        completedAt: action.actionRunCompletedAt,
        rewardAmount: action.actionRunRewardAmount
      } : null
    }));

    // Calculate summary statistics
    const summary = {
      // Available = never attempted OR failed (can be retried)
      available: transformedActions.filter(a => 
        !a.userActionRun || a.userActionRun.status === 'failed'
      ).length,
      inProgress: transformedActions.filter(a => 
        a.userActionRun && ['pending_verification', 'dom_verified', 'cdp_verified'].includes(a.userActionRun.status)
      ).length,
      completedToday: actionsWithRuns.filter(a => {
        if (a.actionRunStatus === 'completed' && a.actionRunCompletedAt) {
          const completedDate = new Date(a.actionRunCompletedAt);
          const today = new Date();
          return completedDate.toDateString() === today.toDateString();
        }
        return false;
      }).length,
      failed: transformedActions.filter(a => 
        a.userActionRun && a.userActionRun.status === 'failed'
      ).length
    };

    return c.json({
      accountId,
      platform,
      accountMetadata,
      actions: transformedActions,
      summary,
      totalEligibleActions: transformedActions.length,
    });
  } catch (error) {
    console.error("Error fetching eligible actions:", error);
    return c.json({ 
      error: "Failed to fetch eligible actions",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// Delete social account
socialAccountsRouter.delete("/:id", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    const deleted = await db
      .delete(socialAccounts)
      .where(eq(socialAccounts.id, accountId))
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Social account not found" }, 404);
    }

    return c.json({ message: "Social account deleted successfully" });
  } catch (error) {
    console.error("Error deleting social account:", error);
    return c.json({ error: "Failed to delete social account" }, 500);
  }
});

export default socialAccountsRouter;