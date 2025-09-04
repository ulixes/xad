import { Hono } from "hono";
import { users, taskAssignments, tasks, brands } from "../db/schema";
import type { Env } from "../types";
import {
  eq,
  and,
  desc,
  count,
  sql,
  notExists,
  lt,
  gt,
  isNull,
  or,
} from "drizzle-orm";
import { verifyPrivyTokenJWKS } from "../middleware/jwks-auth";

const userRoutes = new Hono<{ Bindings: Env }>();

// Helper function to provide human-readable status descriptions
function getStatusDescription(status: string): string {
  const descriptions = {
    assigned: "Task claimed but not yet submitted",
    submitted: "Evidence submitted, awaiting review",
    awaiting: "On 7-day hold before payout processing",
    approved: "Evidence approved, transitioning to payout hold",
    paid: "Payout completed, funds available",
    rejected: "Evidence invalid, may retry if allowed",
    expired: "Task expired before completion or review",
  };
  return (
    descriptions[status as keyof typeof descriptions] ||
    `Unknown status: ${status}`
  );
}

// Get user by ID - creates user if doesn't exist
userRoutes.get("/:id", verifyPrivyTokenJWKS, async (c) => {
  try {
    const privyUser = c.get("user");
    const requestedUserId = c.req.param("id");

    // Only allow users to access their own data
    if (privyUser.privyId !== requestedUserId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    const db = c.get('db');
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, privyUser.privyId))
      .limit(1);

    // If user doesn't exist, create them with initial state
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          privyUserId: privyUser.privyId,
        })
        .returning();
    }

    return c.json({
      id: user!.privyUserId,
      email: privyUser.email,
      phone: privyUser.phone,
      wallets: privyUser.wallets.map((w) => ({
        address: w.address,
        type: w.type,
        verified: w.verified,
      })),
      isActive: user!.isActive,
      createdAt: user!.createdAt,
      updatedAt: user!.updatedAt,
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's active task assignment
userRoutes.get("/:userId/active-task", verifyPrivyTokenJWKS, async (c) => {
  try {
    const privyUser = c.get("user");
    const requestedUserId = c.req.param("userId");

    // Only allow users to access their own data
    if (privyUser.privyId !== requestedUserId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Find active task assignment with full task and brand details
    const db = c.get('db');
    const [activeAssignment] = await db
      .select({
        taskAssignmentId: taskAssignments.taskAssignmentId,
        taskId: taskAssignments.taskId,
        status: taskAssignments.status,
        rewardAmount: taskAssignments.rewardAmount,
        currency: taskAssignments.currency,
        createdAt: taskAssignments.createdAt,
        // Task details
        platform: tasks.platform,
        type: tasks.type,
        targets: tasks.targets,
        instructions: tasks.instructions,
        // Brand details
        brandName: brands.name,
      })
      .from(taskAssignments)
      .leftJoin(tasks, eq(taskAssignments.taskId, tasks.taskId))
      .leftJoin(brands, eq(tasks.brandId, brands.brandId))
      .where(
        and(
          eq(taskAssignments.userId, requestedUserId),
          eq(taskAssignments.status, "assigned"),
        ),
      )
      .limit(1);

    if (!activeAssignment) {
      return c.json({ error: "NoActiveTask" }, 404);
    }

    return c.json({
      taskAssignmentId: activeAssignment.taskAssignmentId,
      taskId: activeAssignment.taskId,
      status: activeAssignment.status,
      rewardAmount: activeAssignment.rewardAmount,
      currency: activeAssignment.currency,
      createdAt: activeAssignment.createdAt,
      task: {
        platform: activeAssignment.platform,
        type: activeAssignment.type,
        targets: activeAssignment.targets,
        instructions: activeAssignment.instructions,
        brand: {
          name: activeAssignment.brandName,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching active task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get claimable tasks for user
userRoutes.get("/:userId/claimable-tasks", verifyPrivyTokenJWKS, async (c) => {
  try {
    const privyUser = c.get("user");
    const requestedUserId = c.req.param("userId");

    // Only allow users to access their own data
    if (privyUser.privyId !== requestedUserId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Parse pagination parameters
    const page = parseInt(c.req.query("page") || "1");
    const limit = Math.min(parseInt(c.req.query("limit") || "20"), 50); // Max 50 items per page
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return c.json({ error: "Invalid pagination parameters" }, 400);
    }

    // Check if user has active assignment (blocks claiming new tasks)
    const db = c.get('db');
    const [activeAssignment] = await db
      .select({ taskAssignmentId: taskAssignments.taskAssignmentId })
      .from(taskAssignments)
      .where(
        and(
          eq(taskAssignments.userId, requestedUserId),
          eq(taskAssignments.status, "assigned"),
        ),
      )
      .limit(1);

    const hasActiveTask = !!activeAssignment;

    // Get tasks that user can claim
    const now = new Date();
    const claimableTasks = await db
      .select({
        task_id: tasks.taskId,
        platform: tasks.platform,
        type: tasks.type,
        targets: tasks.targets,
        volume: tasks.volume,
        budget: tasks.budget,
        currency: tasks.currency,
        reward_per_action: tasks.rewardPerAction,
        expiration_date: tasks.expirationDate,
        instructions: tasks.instructions,
        verification: tasks.verification,
        max_actions_per_user: tasks.maxActionsPerUser,
        created_at: tasks.createdAt,
        brand_name: brands.name,
        // Add assignment counts
        total_assignments: sql<number>`(
          SELECT COUNT(*)
          FROM ${taskAssignments}
          WHERE ${taskAssignments.taskId} = ${tasks.taskId}
        )`,
        user_assignments: sql<number>`(
          SELECT COUNT(*)
          FROM ${taskAssignments}
          WHERE ${taskAssignments.taskId} = ${tasks.taskId}
          AND ${taskAssignments.userId} = ${requestedUserId}
        )`,
      })
      .from(tasks)
      .leftJoin(brands, eq(tasks.brandId, brands.brandId))
      .where(
        and(
          // Task must be active
          eq(tasks.active, true),
          // Task must not be expired
          or(isNull(tasks.expirationDate), gt(tasks.expirationDate, now)),
          // Task must not be full (volume not reached)
          sql`(
          SELECT COUNT(*)
          FROM ${taskAssignments}
          WHERE ${taskAssignments.taskId} = ${tasks.taskId}
        ) < ${tasks.volume}`,
          // User must not have reached max actions for this task
          sql`(
          SELECT COUNT(*)
          FROM ${taskAssignments}
          WHERE ${taskAssignments.taskId} = ${tasks.taskId}
          AND ${taskAssignments.userId} = ${requestedUserId}
        ) < ${tasks.maxActionsPerUser}`,
        ),
      )
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          eq(tasks.active, true),
          or(isNull(tasks.expirationDate), gt(tasks.expirationDate, now)),
          sql`(
          SELECT COUNT(*)
          FROM ${taskAssignments}
          WHERE ${taskAssignments.taskId} = ${tasks.taskId}
        ) < ${tasks.volume}`,
          sql`(
          SELECT COUNT(*)
          FROM ${taskAssignments}
          WHERE ${taskAssignments.taskId} = ${tasks.taskId}
          AND ${taskAssignments.userId} = ${requestedUserId}
        ) < ${tasks.maxActionsPerUser}`,
        ),
      );

    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    // Transform tasks to include claimability info
    const tasksWithClaimability = claimableTasks.map((task) => ({
      task_id: task.task_id,
      platform: task.platform,
      type: task.type,
      targets: task.targets,
      volume: task.volume,
      budget: task.budget,
      currency: task.currency,
      reward_per_action: task.reward_per_action,
      expiration_date: task.expiration_date,
      instructions: task.instructions,
      verification: task.verification,
      max_actions_per_user: task.max_actions_per_user,
      created_at: task.created_at,
      brand_name: task.brand_name,

      // Claimability information
      claimability: {
        can_claim: !hasActiveTask, // User can only claim if no active task
        blocking_reason: hasActiveTask
          ? "You have an active task assignment. Complete it before claiming new tasks."
          : null,
        spots_remaining: task.volume - task.total_assignments,
        user_actions_remaining:
          task.max_actions_per_user - task.user_assignments,
        is_eligible: task.user_assignments < task.max_actions_per_user,
        has_active_assignment: hasActiveTask,
      },
    }));

    return c.json({
      tasks: tasksWithClaimability,
      user_status: {
        has_active_task: hasActiveTask,
        can_claim_new_tasks: !hasActiveTask,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching claimable tasks:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// TEST ENDPOINT - Get user's cashout progress data without auth (for testing only)
userRoutes.get("/:userId/cashout-progress-test", async (c) => {
  try {
    const requestedUserId = c.req.param("userId");

    // Get user data
    const db = c.get('db');
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, requestedUserId))
      .limit(1);

    // If user doesn't exist, create them with initial state
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          privyUserId: requestedUserId,
        })
        .returning();
    }

    // Calculate balance per assignment status
    const balanceByStatus = await db
      .select({
        status: taskAssignments.status,
        totalBalance: sql<number>`COALESCE(SUM(CAST(${taskAssignments.rewardAmount} AS DECIMAL)), 0)`,
        count: count(),
      })
      .from(taskAssignments)
      .where(eq(taskAssignments.userId, requestedUserId))
      .groupBy(taskAssignments.status);

    // Get awaiting tasks with submission dates for countdown calculation
    const awaitingTasksList = await db
      .select({
        taskId: taskAssignments.taskId,
        taskAssignmentId: taskAssignments.taskAssignmentId,
        rewardAmount: taskAssignments.rewardAmount,
        submittedAt: taskAssignments.submittedAt,
      })
      .from(taskAssignments)
      .where(
        and(
          eq(taskAssignments.userId, requestedUserId),
          eq(taskAssignments.status, "awaiting"),
        ),
      );

    // Initialize balance breakdown
    const balanceBreakdown = {
      assigned: 0,
      submitted: 0,
      awaiting: 0,
      approved: 0,
      paid: 0,
      rejected: 0,
      expired: 0,
    };

    // Populate balance breakdown from database results
    balanceByStatus.forEach((stat) => {
      balanceBreakdown[stat.status as keyof typeof balanceBreakdown] = Math.round(
        Number(stat.totalBalance) * 100
      ) / 100;
    });

    // Calculate key metrics
    const approvedBalance = balanceBreakdown.approved;
    const potentialBalance = Math.round(
      (balanceBreakdown.submitted + balanceBreakdown.awaiting) * 100
    ) / 100;
    const cashOutLimit = user!.cashOutLimit;
    const progressPercentage = Math.min(
      (approvedBalance / cashOutLimit) * 100,
      100,
    );
    const potentialProgressPercentage = Math.min(
      ((approvedBalance + potentialBalance) / cashOutLimit) * 100,
      100,
    );
    const isCashOutEligible = approvedBalance >= cashOutLimit && user!.isActive;
    const remainingToCashOut = Math.max(cashOutLimit - approvedBalance, 0);

    // Process awaiting tasks for countdown and progress
    const now = new Date();
    const awaitingTasks = awaitingTasksList.map((task) => {
      const submittedDate = new Date(task.submittedAt!);
      const daysSinceSubmission = Math.floor(
        (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysUntilApproval = Math.max(7 - daysSinceSubmission, 0);
      const approvalProgressPercentage = ((7 - daysUntilApproval) / 7) * 100;

      return {
        taskId: task.taskAssignmentId,
        amount: Math.round(Number(task.rewardAmount) * 100) / 100,
        daysUntilApproval,
        approvalProgressPercentage,
      };
    });

    // Build response according to schema
    const response = {
      userId: requestedUserId,
      isActive: user!.isActive,
      cashOutProgress: {
        approvedBalance,
        potentialBalance,
        cashOutLimit,
        progressPercentage,
        potentialProgressPercentage,
        isCashOutEligible,
        remainingToCashOut,
        balanceBreakdown,
        awaitingTasks,
      },
      lastUpdated: new Date().toISOString(),
    };

    console.log("TEST: Cashout progress response:", JSON.stringify(response, null, 2));
    return c.json(response);
  } catch (error) {
    console.error("Error fetching cashout progress test:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user's cashout progress data
userRoutes.get("/:userId/cashout-progress", verifyPrivyTokenJWKS, async (c) => {
  try {
    const privyUser = c.get("user");
    const requestedUserId = c.req.param("userId");

    // Only allow users to access their own data
    if (privyUser.privyId !== requestedUserId) {
      return c.json({ error: "Unauthorized" }, 403);
    }

    // Get user data
    const db = c.get('db');
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, requestedUserId))
      .limit(1);

    // If user doesn't exist, create them with initial state
    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          privyUserId: requestedUserId,
        })
        .returning();
    }

    // Calculate balance per assignment status
    const balanceByStatus = await db
      .select({
        status: taskAssignments.status,
        totalBalance: sql<number>`COALESCE(SUM(CAST(${taskAssignments.rewardAmount} AS DECIMAL)), 0)`,
        count: count(),
      })
      .from(taskAssignments)
      .where(eq(taskAssignments.userId, requestedUserId))
      .groupBy(taskAssignments.status);

    // Get awaiting tasks with submission dates for countdown calculation
    const awaitingTasksList = await db
      .select({
        taskId: taskAssignments.taskId,
        taskAssignmentId: taskAssignments.taskAssignmentId,
        rewardAmount: taskAssignments.rewardAmount,
        submittedAt: taskAssignments.submittedAt,
      })
      .from(taskAssignments)
      .where(
        and(
          eq(taskAssignments.userId, requestedUserId),
          eq(taskAssignments.status, "awaiting"),
        ),
      );

    // Initialize balance breakdown
    const balanceBreakdown = {
      assigned: 0,
      submitted: 0,
      awaiting: 0,
      approved: 0,
      paid: 0,
      rejected: 0,
      expired: 0,
    };

    // Populate balance breakdown from database results
    balanceByStatus.forEach((stat) => {
      balanceBreakdown[stat.status as keyof typeof balanceBreakdown] = Math.round(
        Number(stat.totalBalance) * 100
      ) / 100;
    });

    // Calculate key metrics
    const approvedBalance = balanceBreakdown.approved;
    const potentialBalance = Math.round(
      (balanceBreakdown.submitted + balanceBreakdown.awaiting) * 100
    ) / 100;
    const cashOutLimit = user!.cashOutLimit;
    const progressPercentage = Math.min(
      (approvedBalance / cashOutLimit) * 100,
      100,
    );
    const potentialProgressPercentage = Math.min(
      ((approvedBalance + potentialBalance) / cashOutLimit) * 100,
      100,
    );
    const isCashOutEligible = approvedBalance >= cashOutLimit && user!.isActive;
    const remainingToCashOut = Math.max(cashOutLimit - approvedBalance, 0);

    // Process awaiting tasks for countdown and progress
    const now = new Date();
    const awaitingTasks = awaitingTasksList.map((task) => {
      const submittedDate = new Date(task.submittedAt!);
      const daysSinceSubmission = Math.floor(
        (now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysUntilApproval = Math.max(7 - daysSinceSubmission, 0);
      const approvalProgressPercentage = ((7 - daysUntilApproval) / 7) * 100;

      return {
        taskId: task.taskAssignmentId,
        amount: Math.round(Number(task.rewardAmount) * 100) / 100,
        daysUntilApproval,
        approvalProgressPercentage,
      };
    });

    // Build response according to schema
    const response = {
      userId: requestedUserId,
      isActive: user!.isActive,
      cashOutProgress: {
        approvedBalance,
        potentialBalance,
        cashOutLimit,
        progressPercentage,
        potentialProgressPercentage,
        isCashOutEligible,
        remainingToCashOut,
        balanceBreakdown,
        awaitingTasks,
      },
      lastUpdated: new Date().toISOString(),
    };

    return c.json(response);
  } catch (error) {
    console.error("Error fetching cashout progress:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export default userRoutes;
