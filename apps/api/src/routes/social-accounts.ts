import { Hono } from "hono";
import { z } from "zod";
import { eq, and, sql, gte, or, inArray } from "drizzle-orm";
import { 
  socialAccounts, 
  instagramAccounts, 
  instagramAudienceDemographics, 
  instagramContentPerformance, 
  tiktokAccounts,
  tiktokViewerDemographics,
  tiktokViewerGeography,
  tiktokViewerMetrics,
  tiktokFollowerDemographics,
  tiktokFollowerGeography,
  campaigns,
  campaignActions, 
  actionRuns 
} from "../db/schema";
import type { AppContext } from "../types";
import { userAuthMiddleware } from "../middleware/userAuth";

const socialAccountsRouter = new Hono<AppContext>();

// Apply authentication to all routes - social accounts are for extension users
socialAccountsRouter.use('*', userAuthMiddleware);

// Validation schemas
const createSocialAccountSchema = z.object({
  userId: z.string().uuid(),
  platform: z.enum(["instagram", "twitter", "tiktok", "youtube"]),
  handle: z.string().min(1),
  platformUserId: z.string().optional(),
});

const createTikTokDataSchema = z.object({
  socialAccountId: z.string().uuid(),
  // Essential fields only
  uniqueId: z.string(), // @username (handle)
  bio: z.string().optional(), // Profile description
  isVerified: z.boolean().default(false), // Blue checkmark status
  isPrivate: z.boolean().default(false), // Private account flag
  analyticsOn: z.boolean().default(false), // Analytics enabled
  region: z.string().optional(), // Account region
  language: z.string().optional(), // Primary language
  createTime: z.union([z.string(), z.number()]).optional(), // Account creation date
  followers: z.number().default(0), // Follower count
  following: z.number().default(0), // Following count
  // Optional VIEWER demographics data (people who WATCH content)
  viewerDemographics: z.object({
    genderFemale: z.number().default(0),
    genderMale: z.number().default(0),
    genderOther: z.number().default(0),
    age18to24: z.number().default(0),
    age25to34: z.number().default(0),
    age35to44: z.number().default(0),
    age45to54: z.number().default(0),
    age55plus: z.number().default(0),
    uniqueViewers: z.number().default(0),
    newViewers: z.number().default(0),
    returningViewers: z.number().default(0),
    geography: z.array(z.object({
      rank: z.number(),
      countryName: z.string(),
      countryCode: z.string(),
      countryPct: z.number(),
      cities: z.array(z.object({
        name: z.string(),
        pct: z.number()
      })).default([])
    })).default([])
  }).optional(),
  // Optional viewer metrics time-series data (28-day history)
  viewerMetrics: z.object({
    rangeDays: z.number().default(28),
    totalUniqueViewers: z.number().default(0),
    totalNewViewers: z.number().default(0),
    totalReturningViewers: z.number().default(0),
    newViewersSeries: z.array(z.any()).optional(),
    returningViewersSeries: z.array(z.any()).optional(),
    uniqueViewersSeries: z.array(z.any()).optional(),
    viewerActiveHours: z.array(z.any()).optional(),
    viewerActiveDays: z.array(z.any()).optional(),
  }).optional(),
  // Optional FOLLOWER demographics data (people who FOLLOW the account)
  followerDemographics: z.object({
    followerCount: z.number().default(0),
    genderFemale: z.number().default(0),
    genderMale: z.number().default(0),
    genderOther: z.number().default(0),
    age18to24: z.number().default(0),
    age25to34: z.number().default(0),
    age35to44: z.number().default(0),
    age45to54: z.number().default(0),
    age55plus: z.number().default(0),
    activeFollowers: z.number().default(0),
    inactiveFollowers: z.number().default(0),
    geography: z.array(z.object({
      rank: z.number(),
      countryName: z.string(),
      countryCode: z.string(),
      countryPct: z.number(),
      cities: z.array(z.object({
        name: z.string(),
        pct: z.number()
      })).default([])
    })).default([])
  }).optional()
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

    // TikTok data is now simplified - no separate demographics/performance tables

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

    // Map fields to database column names (simplified)
    const dbData = {
      socialAccountId: validatedData.socialAccountId,
      uniqueId: validatedData.uniqueId,
      bio: validatedData.bio,
      isVerified: validatedData.isVerified,
      isPrivate: validatedData.isPrivate,
      analyticsOn: validatedData.analyticsOn,
      region: validatedData.region,
      language: validatedData.language,
      createTime: validatedData.createTime ? String(validatedData.createTime) : null,
      followers: validatedData.followers,
      following: validatedData.following,
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

    // Update social account verification status
    await db
      .update(socialAccounts)
      .set({
        isVerified: true,
        lastVerifiedAt: new Date(),
        platformUserId: validatedData.uniqueId || account[0].platformUserId,
        updatedAt: new Date(),
      })
      .where(eq(socialAccounts.id, accountId));

    // Handle VIEWER demographics data if provided
    let viewerDemographicsResult = null;
    if (validatedData.viewerDemographics) {
      try {
        console.log("Processing TikTok VIEWER demographics data...");
        
        // Get the TikTok account ID
        const tiktokAccountId = tiktokAccountData[0].id;
        
        // Insert viewer demographics record
        const [demographicsRecord] = await db
          .insert(tiktokViewerDemographics)
          .values({
            tiktokAccountId,
            rangeDays: 28, // Use 28 days to match analytics URL
            genderFemale: validatedData.viewerDemographics.genderFemale?.toString() || '0',
            genderMale: validatedData.viewerDemographics.genderMale?.toString() || '0',
            genderOther: validatedData.viewerDemographics.genderOther?.toString() || '0',
            age18to24: validatedData.viewerDemographics.age18to24?.toString() || '0',
            age25to34: validatedData.viewerDemographics.age25to34?.toString() || '0',
            age35to44: validatedData.viewerDemographics.age35to44?.toString() || '0',
            age45to54: validatedData.viewerDemographics.age45to54?.toString() || '0',
            age55plus: validatedData.viewerDemographics.age55plus?.toString() || '0',
            uniqueViewers: validatedData.viewerDemographics.uniqueViewers || 0,
            newViewers: validatedData.viewerDemographics.newViewers || 0,
            returningViewers: validatedData.viewerDemographics.returningViewers || 0,
          })
          .returning();

        // Insert geography records if provided
        if (validatedData.viewerDemographics.geography && Array.isArray(validatedData.viewerDemographics.geography)) {
          const geographyRecords = [];
          
          for (const country of validatedData.viewerDemographics.geography) {
            if (!country.cities || country.cities.length === 0) {
              // Country without cities
              geographyRecords.push({
                demographicsId: demographicsRecord.id,
                countryCode: country.countryCode,
                countryName: country.countryName,
                countryPct: country.countryPct?.toString() || '0',
                cityName: null,
                cityPct: null,
                rank: country.rank,
              });
            } else {
              // Country with cities - insert one record per city
              for (const city of country.cities) {
                geographyRecords.push({
                  demographicsId: demographicsRecord.id,
                  countryCode: country.countryCode,
                  countryName: country.countryName,
                  countryPct: country.countryPct?.toString() || '0',
                  cityName: city.name,
                  cityPct: city.pct?.toString() || '0',
                  rank: country.rank,
                });
              }
            }
          }
          
          if (geographyRecords.length > 0) {
            await db.insert(tiktokViewerGeography).values(geographyRecords);
          }
        }
        
        viewerDemographicsResult = {
          demographicsId: demographicsRecord.id,
          message: 'Viewer demographics data saved successfully'
        };
        
        console.log("TikTok VIEWER demographics saved successfully:", viewerDemographicsResult);
      } catch (demographicsError) {
        console.error("Error saving TikTok VIEWER demographics:", demographicsError);
        // Don't fail the whole request if demographics saving fails
        viewerDemographicsResult = {
          error: 'Failed to save viewer demographics data',
          details: demographicsError.message
        };
      }
    }

    // Handle FOLLOWER demographics data if provided
    let followerDemographicsResult = null;
    if (validatedData.followerDemographics) {
      try {
        console.log("Processing TikTok FOLLOWER demographics data...");
        
        // Get the TikTok account ID
        const tiktokAccountId = tiktokAccountData[0].id;
        
        // Insert follower demographics record
        const [demographicsRecord] = await db
          .insert(tiktokFollowerDemographics)
          .values({
            tiktokAccountId,
            rangeDays: 28, // Use 28 days to match analytics URL
            followerCount: validatedData.followerDemographics.followerCount || 0,
            genderFemale: validatedData.followerDemographics.genderFemale?.toString() || '0',
            genderMale: validatedData.followerDemographics.genderMale?.toString() || '0',
            genderOther: validatedData.followerDemographics.genderOther?.toString() || '0',
            age18to24: validatedData.followerDemographics.age18to24?.toString() || '0',
            age25to34: validatedData.followerDemographics.age25to34?.toString() || '0',
            age35to44: validatedData.followerDemographics.age35to44?.toString() || '0',
            age45to54: validatedData.followerDemographics.age45to54?.toString() || '0',
            age55plus: validatedData.followerDemographics.age55plus?.toString() || '0',
            activeFollowers: validatedData.followerDemographics.activeFollowers || 0,
            inactiveFollowers: validatedData.followerDemographics.inactiveFollowers || 0,
          })
          .returning();

        // Insert geography records if provided
        if (validatedData.followerDemographics.geography && Array.isArray(validatedData.followerDemographics.geography)) {
          const geographyRecords = [];
          
          for (const country of validatedData.followerDemographics.geography) {
            if (!country.cities || country.cities.length === 0) {
              // Country without cities
              geographyRecords.push({
                demographicsId: demographicsRecord.id,
                countryCode: country.countryCode,
                countryName: country.countryName,
                countryPct: country.countryPct?.toString() || '0',
                cityName: null,
                cityPct: null,
                rank: country.rank,
              });
            } else {
              // Country with cities - insert one record per city
              for (const city of country.cities) {
                geographyRecords.push({
                  demographicsId: demographicsRecord.id,
                  countryCode: country.countryCode,
                  countryName: country.countryName,
                  countryPct: country.countryPct?.toString() || '0',
                  cityName: city.name,
                  cityPct: city.pct?.toString() || '0',
                  rank: country.rank,
                });
              }
            }
          }
          
          if (geographyRecords.length > 0) {
            await db.insert(tiktokFollowerGeography).values(geographyRecords);
          }
        }
        
        followerDemographicsResult = {
          demographicsId: demographicsRecord.id,
          message: 'Follower demographics data saved successfully'
        };
        
        console.log("TikTok FOLLOWER demographics saved successfully:", followerDemographicsResult);
      } catch (demographicsError) {
        console.error("Error saving TikTok FOLLOWER demographics:", demographicsError);
        // Don't fail the whole request if demographics saving fails
        followerDemographicsResult = {
          error: 'Failed to save follower demographics data',
          details: demographicsError.message
        };
      }
    }

    // Handle viewer metrics time-series data if provided
    let viewerMetricsResult = null;
    if (validatedData.viewerMetrics) {
      try {
        console.log("Processing TikTok viewer metrics time-series data...", {
          totalUniqueViewers: validatedData.viewerMetrics.totalUniqueViewers,
          rangeDays: validatedData.viewerMetrics.rangeDays
        });
        
        // Get the TikTok account ID
        const tiktokAccountId = tiktokAccountData[0].id;
        
        // Insert viewer metrics record
        const [metricsRecord] = await db
          .insert(tiktokViewerMetrics)
          .values({
            tiktokAccountId,
            rangeDays: validatedData.viewerMetrics.rangeDays || 28,
            totalUniqueViewers: validatedData.viewerMetrics.totalUniqueViewers || 0,
            totalNewViewers: validatedData.viewerMetrics.totalNewViewers || 0,
            totalReturningViewers: validatedData.viewerMetrics.totalReturningViewers || 0,
            newViewersSeries: validatedData.viewerMetrics.newViewersSeries || null,
            returningViewersSeries: validatedData.viewerMetrics.returningViewersSeries || null,
            uniqueViewersSeries: validatedData.viewerMetrics.uniqueViewersSeries || null,
            viewerActiveHours: validatedData.viewerMetrics.viewerActiveHours || null,
            viewerActiveDays: validatedData.viewerMetrics.viewerActiveDays || null,
          })
          .returning();
        
        viewerMetricsResult = {
          metricsId: metricsRecord.id,
          message: 'Viewer metrics time-series data saved successfully'
        };
        
        console.log("TikTok viewer metrics saved successfully:", viewerMetricsResult);
      } catch (metricsError) {
        console.error("Error saving TikTok viewer metrics:", metricsError);
        // Don't fail the whole request if metrics saving fails
        viewerMetricsResult = {
          error: 'Failed to save viewer metrics data',
          details: metricsError.message
        };
      }
    }

    return c.json({
      ...tiktokAccountData[0],
      viewerDemographics: viewerDemographicsResult,
      followerDemographics: followerDemographicsResult,
      viewerMetrics: viewerMetricsResult
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return c.json({ error: "Invalid input", details: error.errors }, 400);
    }
    console.error("Error updating TikTok data:", error);
    return c.json({ error: "Failed to update TikTok data", details: error.message }, 500);
  }
});

// Save TikTok VIEWER demographics data (from /analytics/viewers page)
socialAccountsRouter.post("/:id/tiktok-demographics", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    const body = await c.req.json();
    console.log("Received TikTok demographics for account:", accountId);
    
    // Verify the social account exists and get TikTok account
    const tiktokAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.socialAccountId, accountId))
      .limit(1);

    if (!tiktokAccount.length) {
      return c.json({ error: "TikTok account not found" }, 404);
    }

    const tiktokAccountId = tiktokAccount[0].id;
    
    // Insert demographics record
    const [demographicsRecord] = await db
      .insert(tiktokViewerDemographics)
      .values({
        tiktokAccountId,
        rangeDays: body.rangeDays || 7,
        genderFemale: body.genderFemale?.toString() || '0',
        genderMale: body.genderMale?.toString() || '0',
        genderOther: body.genderOther?.toString() || '0',
        age18to24: body.age18to24?.toString() || '0',
        age25to34: body.age25to34?.toString() || '0',
        age35to44: body.age35to44?.toString() || '0',
        age45to54: body.age45to54?.toString() || '0',
        age55plus: body.age55plus?.toString() || '0',
        uniqueViewers: body.uniqueViewers || 0,
        newViewers: body.newViewers || 0,
        returningViewers: body.returningViewers || 0,
      })
      .returning();

    // Insert geography records if provided
    if (body.geography && Array.isArray(body.geography)) {
      const geographyRecords = [];
      
      for (const country of body.geography) {
        // Insert country-level record
        if (!country.cities || country.cities.length === 0) {
          // Country without cities
          geographyRecords.push({
            demographicsId: demographicsRecord.id,
            countryCode: country.countryCode,
            countryName: country.countryName,
            countryPct: country.countryPct?.toString() || '0',
            cityName: null,
            cityPct: null,
            rank: country.rank,
          });
        } else {
          // Country with cities - insert one record per city
          for (const city of country.cities) {
            geographyRecords.push({
              demographicsId: demographicsRecord.id,
              countryCode: country.countryCode,
              countryName: country.countryName,
              countryPct: country.countryPct?.toString() || '0',
              cityName: city.name,
              cityPct: city.pct?.toString() || '0',
              rank: country.rank,
            });
          }
        }
      }
      
      if (geographyRecords.length > 0) {
        await db.insert(tiktokViewerGeography).values(geographyRecords);
      }
    }

    return c.json({ 
      success: true, 
      demographicsId: demographicsRecord.id,
      message: 'Demographics collected successfully' 
    });
  } catch (error) {
    console.error("Error saving TikTok demographics:", error);
    return c.json({ error: "Failed to save TikTok demographics", details: error.message }, 500);
  }
});

// Save TikTok FOLLOWER demographics data (from /analytics/followers page)
socialAccountsRouter.post("/:id/tiktok-follower-demographics", async (c) => {
  const accountId = c.req.param("id");
  const db = c.get("db");

  try {
    const body = await c.req.json();
    console.log("Received TikTok follower demographics for account:", accountId);
    
    // Verify the social account exists and get TikTok account
    const tiktokAccount = await db
      .select()
      .from(tiktokAccounts)
      .where(eq(tiktokAccounts.socialAccountId, accountId))
      .limit(1);

    if (!tiktokAccount.length) {
      return c.json({ error: "TikTok account not found" }, 404);
    }

    const tiktokAccountId = tiktokAccount[0].id;
    
    // Insert follower demographics record
    const [demographicsRecord] = await db
      .insert(tiktokFollowerDemographics)
      .values({
        tiktokAccountId,
        rangeDays: body.rangeDays || 7,
        followerCount: body.followerCount || 0,
        genderFemale: body.genderFemale?.toString() || '0',
        genderMale: body.genderMale?.toString() || '0',
        genderOther: body.genderOther?.toString() || '0',
        age18to24: body.age18to24?.toString() || '0',
        age25to34: body.age25to34?.toString() || '0',
        age35to44: body.age35to44?.toString() || '0',
        age45to54: body.age45to54?.toString() || '0',
        age55plus: body.age55plus?.toString() || '0',
        activeFollowers: body.activeFollowers || 0,
        inactiveFollowers: body.inactiveFollowers || 0,
      })
      .returning();

    // Insert geography records if provided
    if (body.geography && Array.isArray(body.geography)) {
      const geographyRecords = [];
      
      for (const country of body.geography) {
        if (!country.cities || country.cities.length === 0) {
          // Country without cities
          geographyRecords.push({
            demographicsId: demographicsRecord.id,
            countryCode: country.countryCode,
            countryName: country.countryName,
            countryPct: country.countryPct?.toString() || '0',
            cityName: null,
            cityPct: null,
            rank: country.rank,
          });
        } else {
          // Country with cities - insert one record per city
          for (const city of country.cities) {
            geographyRecords.push({
              demographicsId: demographicsRecord.id,
              countryCode: country.countryCode,
              countryName: country.countryName,
              countryPct: country.countryPct?.toString() || '0',
              cityName: city.name,
              cityPct: city.pct?.toString() || '0',
              rank: country.rank,
            });
          }
        }
      }
      
      if (geographyRecords.length > 0) {
        await db.insert(tiktokFollowerGeography).values(geographyRecords);
      }
    }

    return c.json({ 
      success: true, 
      demographicsId: demographicsRecord.id,
      message: 'Follower demographics collected successfully' 
    });
  } catch (error) {
    console.error("Error saving TikTok follower demographics:", error);
    return c.json({ error: "Failed to save TikTok follower demographics", details: error.message }, 500);
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
    // First, get the social account with Instagram and TikTok data if available
    const accountData = await db
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
      .leftJoin(
        tiktokViewerMetrics,
        and(
          eq(tiktokAccounts.id, tiktokViewerMetrics.tiktokAccountId),
          sql`${tiktokViewerMetrics.rangeDays} IN (7, 28)` // Accept both 7-day and 28-day metrics
        )
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
    const tiktokData = account.tiktok_accounts;
    const tiktokMetrics = account.tiktok_viewer_metrics;
    
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
      ...(tiktokData && {
        followerCount: tiktokData.followers,
        followingCount: tiktokData.following,
        isVerified: tiktokData.isVerified,
        region: tiktokData.region,
        language: tiktokData.language,
        analyticsOn: tiktokData.analyticsOn,
      }),
    };

    // Get all active campaign actions with campaigns for the platform with user's action runs
    console.log('Fetching campaign actions for platform:', platform, 'userId:', userId);
    
    // Fetch campaign actions with campaigns and user's action runs
    const actionsWithRuns = await db
      .select({
        // Campaign action fields
        actionId: campaignActions.id,
        actionType: campaignActions.actionType,
        target: campaignActions.target,
        price: campaignActions.pricePerAction,
        maxVolume: campaignActions.maxVolume,
        currentVolume: campaignActions.currentVolume,
        isActive: campaignActions.isActive,
        metadata: campaignActions.metadata,
        // Campaign fields for eligibility
        campaignId: campaigns.id,
        campaignPlatform: campaigns.platform,
        campaignStatus: campaigns.status,
        campaignTargetingRules: campaigns.targetingRules,
        campaignExpiresAt: campaigns.expiresAt,
        // Action run fields (null if not started)
        actionRunId: actionRuns.id,
        actionRunStatus: actionRuns.status,
        actionRunStartedAt: actionRuns.createdAt,
        actionRunCompletedAt: actionRuns.completedAt,
        actionRunRewardAmount: actionRuns.rewardAmount,
      })
      .from(campaignActions)
      .innerJoin(
        campaigns,
        eq(campaignActions.campaignId, campaigns.id)
      )
      .leftJoin(
        actionRuns,
        and(
          eq(campaignActions.id, actionRuns.actionId),
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
          eq(campaigns.platform, platform),
          eq(campaigns.status, 'active'),
          eq(campaigns.isActive, true),
          eq(campaignActions.isActive, true),
          sql`${campaignActions.currentVolume} < ${campaignActions.maxVolume}`,
          sql`${campaigns.expiresAt} IS NULL OR ${campaigns.expiresAt} > NOW()`
        )
      );
    console.log('Campaign actions with runs found:', actionsWithRuns.length);
    console.log('TikTok metrics for eligibility check:', {
      hasTiktokMetrics: !!tiktokMetrics,
      rangeDays: tiktokMetrics?.rangeDays,
      totalUniqueViewers: tiktokMetrics?.totalUniqueViewers
    });

    // Filter actions based on campaign targeting rules and completion status
    const eligibleActions = actionsWithRuns.filter(action => {
      // Skip if already completed or paid
      if (action.actionRunStatus === 'completed' || action.actionRunStatus === 'paid') {
        return false;
      }
      
      // Use campaign targeting rules as eligibility criteria
      const criteria = action.campaignTargetingRules as any;
      
      // If no criteria specified, action is available to all
      if (!criteria || Object.keys(criteria).length === 0) {
        return true;
      }

      // Check minimum followers (works for both Instagram and TikTok)
      if (criteria.minFollowers && criteria.minFollowers > 0) {
        const followerCount = instagramData?.followerCount || tiktokData?.followers || 0;
        if (followerCount < criteria.minFollowers) {
          return false;
        }
      }

      // Check maximum followers (works for both Instagram and TikTok)
      if (criteria.maxFollowers && criteria.maxFollowers > 0) {
        const followerCount = instagramData?.followerCount || tiktokData?.followers || 0;
        if (followerCount > criteria.maxFollowers) {
          return false;
        }
      }
      
      // Check minimum views (TikTok specific)
      if (criteria.minUniqueViews28Days && criteria.minUniqueViews28Days > 0) {
        // Check if we have TikTok view metrics data
        if (!tiktokMetrics || !tiktokMetrics.totalUniqueViewers) {
          console.log(`Action ${action.actionId} excluded: No TikTok viewer metrics data (required: ${criteria.minUniqueViews28Days} unique views)`);
          return false; // No metrics = can't verify views = not eligible
        }
        
        // Check if unique viewers meet the requirement
        if (tiktokMetrics.totalUniqueViewers < criteria.minUniqueViews28Days) {
          console.log(`Action ${action.actionId} excluded: Insufficient unique viewers (has: ${tiktokMetrics.totalUniqueViewers}, required: ${criteria.minUniqueViews28Days})`);
          return false;
        }
        
        console.log(`Action ${action.actionId} passed view requirement (has: ${tiktokMetrics.totalUniqueViewers}, required: ${criteria.minUniqueViews28Days}, rangeDays: ${tiktokMetrics.rangeDays})`);
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

      // Check location (accountLocation from campaign)
      if (criteria.accountLocation && criteria.accountLocation !== 'all') {
        const location = instagramData?.locationCountry || tiktokData?.region;
        if (location && location !== criteria.accountLocation) {
          return false;
        }
      }
      
      // Check language (accountLanguage from campaign)
      if (criteria.accountLanguage && criteria.accountLanguage !== 'all') {
        const language = tiktokData?.language;
        if (language && language !== criteria.accountLanguage) {
          return false;
        }
      }

      // Check if account is verified (if required)
      if (criteria.verifiedOnly === true) {
        const isVerified = instagramData?.isVerified || tiktokData?.isVerified || false;
        if (!isVerified) {
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

    // Transform campaign actions with user run data
    const transformedActions = eligibleActions.map(action => {
      // Parse target URL and comment content for comment actions
      let targetUrl = action.target;
      let commentContent = null;
      
      if (action.actionType === 'comment') {
        // For comments, target contains "url|emojis"
        const parts = action.target.split('|');
        targetUrl = parts[0];
        commentContent = parts[1] || null;
        
        // Also check metadata for comment content
        if (!commentContent && action.metadata && typeof action.metadata === 'object') {
          const metadata = action.metadata as any;
          commentContent = metadata.commentContent || null;
        }
      }
      
      return {
        id: action.actionId,
        campaignId: action.campaignId,
        platform: action.campaignPlatform, // From campaign
        type: action.actionType,  // Use 'type' to match UI expectations
        actionType: action.actionType,  // Keep for backward compatibility
        target: action.target,
        targetUrl,  // Clean URL without comment content
        title: `${action.campaignPlatform} ${action.actionType}`,
        description: `${action.actionType} on ${action.campaignPlatform}`,
        price: action.price,
        availableVolume: action.maxVolume - action.currentVolume,
        percentageComplete: Math.round((action.currentVolume / action.maxVolume) * 100),
        metadata: {
          ...(action.metadata && typeof action.metadata === 'object' ? action.metadata : {}),
          commentContent,  // Add comment content to metadata
          url: targetUrl
        },
        // Include user's action run data if exists
        userActionRun: action.actionRunId ? {
          id: action.actionRunId,
          status: action.actionRunStatus,
          startedAt: action.actionRunStartedAt,
          completedAt: action.actionRunCompletedAt,
          rewardAmount: action.actionRunRewardAmount
        } : null
      };
    });

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
      actions: transformedActions.map(action => ({
        id: action.id,
        campaignId: action.campaignId,
        platform: action.platform,
        type: action.type,
        actionType: action.actionType,
        target: action.target,
        targetUrl: action.targetUrl,
        title: action.title,
        description: action.description,
        price: action.price,
        availableVolume: action.availableVolume,
        percentageComplete: action.percentageComplete,
        metadata: action.metadata,
        userActionRun: action.userActionRun
      })),
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