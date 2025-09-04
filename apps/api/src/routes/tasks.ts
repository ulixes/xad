import { Hono } from 'hono';
import { tasks, brands, taskAssignments, users } from '../db/schema';
import type { Env } from '../types';
import { eq, and, sql, desc, count } from 'drizzle-orm';
import { verifyAdminToken } from '../middleware/admin-auth';
import { verifyPrivyTokenJWKS } from '../middleware/jwks-auth';

const taskRoutes = new Hono<{ Bindings: Env }>();

// Get all active tasks (public endpoint for users)
taskRoutes.get('/', async (c) => {
  try {
    // Parse pagination parameters
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return c.json({ error: 'Invalid pagination parameters' }, 400);
    }

    // Get active tasks that haven't expired
    const now = new Date();
    const whereCondition = and(
      eq(tasks.active, true),
      sql`${tasks.expirationDate} IS NULL OR ${tasks.expirationDate} > ${now}`
    );

    // Get total count
    const db = c.get('db');
    const [totalResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(whereCondition);
    
    const total = totalResult.count;
    const totalPages = Math.ceil(total / limit);

    // Get paginated tasks
    const activeTasks = await db
      .select({
        task_id: tasks.taskId,
        platform: tasks.platform,
        type: tasks.type,
        targets: tasks.targets,
        volume: tasks.volume,
        currency: tasks.currency,
        reward_per_action: tasks.rewardPerAction,
        expiration_date: tasks.expirationDate,
        created_at: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(brands, eq(tasks.brandId, brands.brandId))
      .where(whereCondition)
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      tasks: activeTasks,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});



// only admin can now create tasks
taskRoutes.post('/', verifyAdminToken, async (c) => {
  try {
    const body = await c.req.json();
    const {
      brand_id,
      platform,
      type,
      targets,
      volume,
      budget,
      currency = 'USD',
      reward_per_action,
      expiration_date,
      payout_release_after,
      active = true,
      instructions,
      verification = 'auto',
      max_actions_per_user = 1,
      reward_distribution = { mode: 'static', tiers: null },
    } = body;

    // Validate required fields
    if (!brand_id || !platform || !type || !targets || !volume || !budget || !instructions) {
      return c.json({ 
        error: 'Missing required fields: brand_id, platform, type, targets, volume, budget, instructions' 
      }, 400);
    }

    // Validate brand exists
    const db = c.get('db');
    const [brand] = await db
      .select()
      .from(brands)
      .where(eq(brands.brandId, brand_id))
      .limit(1);

    if (!brand) {
      return c.json({ error: 'Brand not found' }, 404);
    }

    // Auto-calculate reward if not provided
    let calculatedReward = reward_per_action;
    if (!calculatedReward && reward_distribution.mode === 'static') {
      calculatedReward = (parseFloat(budget) / volume).toFixed(2);
    }

    // Create task
    const [newTask] = await db
      .insert(tasks)
      .values({
        brandId: brand_id,
        platform,
        type,
        targets: Array.isArray(targets) ? targets : [targets],
        volume: parseInt(volume),
        budget: budget.toString(),
        currency,
        rewardPerAction: calculatedReward ? calculatedReward.toString() : null,
        expirationDate: expiration_date ? new Date(expiration_date) : null,
        payoutReleaseAfter: payout_release_after,
        active,
        instructions: Array.isArray(instructions) ? instructions : [instructions],
        verification,
        maxActionsPerUser: parseInt(max_actions_per_user),
        rewardDistribution: reward_distribution,
      })
      .returning();

    return c.json({
      task_id: newTask!.taskId,
      brand_id: newTask!.brandId,
      platform: newTask!.platform,
      type: newTask!.type,
      targets: newTask!.targets,
      volume: newTask!.volume,
      budget: newTask!.budget,
      currency: newTask!.currency,
      reward_per_action: newTask!.rewardPerAction,
      expiration_date: newTask!.expirationDate,
      payout_release_after: newTask!.payoutReleaseAfter,
      active: newTask!.active,
      instructions: newTask!.instructions,
      verification: newTask!.verification,
      max_actions_per_user: newTask!.maxActionsPerUser,
      reward_distribution: newTask!.rewardDistribution,
      created_at: newTask!.createdAt,
    }, 201);
  } catch (error) {
    console.error('Error creating task:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Claim task for user
taskRoutes.post('/:taskId/claim', verifyPrivyTokenJWKS, async (c) => {
  const taskId = c.req.param('taskId');
  const privyUser = c.get('user');
  const userId = privyUser.privyId;

  try {
    // Check if task exists, active, and not expired (first validation)
    const db = c.get('db');
    const [task] = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.taskId, taskId),
        eq(tasks.active, true),
        sql`(${tasks.expirationDate} IS NULL OR ${tasks.expirationDate} > NOW())`
      ))
      .limit(1);

    if (!task) {
      return c.json({ error: 'TaskNotFound' }, 404);
    }

    // Ensure user exists in database - create if they don't exist
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.privyUserId, userId))
      .limit(1);

    if (!user) {
      [user] = await db
        .insert(users)
        .values({
          privyUserId: userId,
        })
        .returning();
    }

    // Check if user already has an active assignment (one-active-task-per-user)
    const [existingAssignment] = await db
      .select()
      .from(taskAssignments)
      .where(and(
        eq(taskAssignments.userId, userId),
        eq(taskAssignments.status, 'assigned')
      ))
      .limit(1);

    if (existingAssignment) {
      return c.json({ error: 'AlreadyHasActiveTask' }, 400);
    }

    // Check unique users constraint
    const userTaskCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId)
      ));

    if (userTaskCount[0].count >= task.maxActionsPerUser) {
      return c.json({ error: 'MaxUserActionsReached' }, 400);
    }

    // Check current assignment count for volume limit
    const totalAssignments = await db
      .select({ count: sql<number>`count(*)` })
      .from(taskAssignments)
      .where(eq(taskAssignments.taskId, taskId));

    if (totalAssignments[0].count >= task.volume) {
      return c.json({ error: 'TaskFull' }, 400);
    }

    // Create task assignment (database unique constraint will prevent duplicates)
    const rewardAmount = task.rewardPerAction || '0.00';
    const [result] = await db
      .insert(taskAssignments)
      .values({
        taskId: taskId,
        userId: userId,
        status: 'assigned',
        rewardAmount: rewardAmount,
        currency: task.currency,
      })
      .returning();

    return c.json({
      taskAssignmentId: result!.taskAssignmentId,
      taskId: result!.taskId,
      userId: result!.userId,
      status: result!.status,
      rewardAmount: result!.rewardAmount,
      currency: result!.currency,
      createdAt: result!.createdAt
    }, 201);

  } catch (error) {
    console.error('Error claiming task:', error);
    
    // Handle database constraint violations with proper error extraction
    const actualError = (error as any).cause || (error as any).sourceError || error;
    
    // Handle PostgreSQL constraint violations (code 23505 = unique_violation)
    if (actualError.code === '23505') {
      if (actualError.constraint === 'unique_active_assignment_idx') {
        return c.json({ 
          error: 'AlreadyHasActiveTask',
          message: 'You already have an active task assignment. Complete your current task before claiming a new one.'
        }, 400);
      }
      if (actualError.constraint === 'task_assignments_task_id_user_id_unique') {
        return c.json({ 
          error: 'MaxUserActionsReached',
          message: 'You have already claimed this task and reached the maximum actions allowed per user.'
        }, 400);
      }
      // Generic unique constraint violation
      return c.json({ 
        error: 'ConstraintViolation',
        message: 'This action violates a database constraint. Please check your request.'
      }, 400);
    }
    
    // Handle foreign key constraint violations (code 23503 = foreign_key_violation)  
    if (actualError.code === '23503') {
      return c.json({ 
        error: 'InvalidReference',
        message: 'Referenced task or user does not exist.'
      }, 400);
    }
    
    // Handle invalid input syntax (code 22P02)
    if (actualError.code === '22P02') {
      return c.json({ 
        error: 'InvalidInput',
        message: 'Invalid task ID format provided.'
      }, 400);
    }
    
    // Handle database connection errors
    if (actualError.code === 'ECONNREFUSED' || actualError.code === 'ENOTFOUND') {
      return c.json({ 
        error: 'DatabaseError',
        message: 'Database connection failed. Please try again later.'
      }, 503);
    }
    
    // Handle application-level errors (these should not occur in normal flow now)
    const errorMessage = (error as Error).message;
    if (errorMessage === 'TaskNotFound') {
      return c.json({ 
        error: 'TaskNotFound',
        message: 'The requested task was not found or is not available.'
      }, 404);
    }
    if (errorMessage === 'TaskInactive') {
      return c.json({ 
        error: 'TaskInactive',
        message: 'This task is no longer active.'
      }, 400);
    }
    if (errorMessage === 'TaskFull') {
      return c.json({ 
        error: 'TaskFull',
        message: 'This task has reached its maximum capacity.'
      }, 400);
    }
    if (errorMessage === 'MaxUserActionsReached') {
      return c.json({ 
        error: 'MaxUserActionsReached',
        message: 'You have reached the maximum number of actions allowed for this task.'
      }, 400);
    }
    
    // Generic server error - log details but don't expose internals
    console.error('Unhandled error in task claim:', {
      message: actualError.message,
      code: actualError.code,
      constraint: actualError.constraint,
      detail: actualError.detail
    });
    
    return c.json({ 
      error: 'ServerError',
      message: 'An unexpected error occurred. Please try again later.'
    }, 500);
  }
});

// Get user's task assignments
taskRoutes.get('/assignments', verifyPrivyTokenJWKS, async (c) => {
  try {
    const privyUser = c.get('user');
    const userId = privyUser.privyId;

    const db = c.get('db');
    const assignments = await db
      .select({
        assignment_id: taskAssignments.taskAssignmentId,
        task_id: taskAssignments.taskId,
        status: taskAssignments.status,
        reward_amount: taskAssignments.rewardAmount,
        currency: taskAssignments.currency,
        evidence: taskAssignments.evidence,
        submitted_at: taskAssignments.submittedAt,
        approved_at: taskAssignments.approvedAt,
        paid_at: taskAssignments.paidAt,
        payout_status: taskAssignments.payoutStatus,
        created_at: taskAssignments.createdAt,
        // Task details
        task_platform: tasks.platform,
        task_type: tasks.type,
        task_targets: tasks.targets,
        task_instructions: tasks.instructions,
        task_verification: tasks.verification,
        brand_name: brands.name,
      })
      .from(taskAssignments)
      .leftJoin(tasks, eq(taskAssignments.taskId, tasks.taskId))
      .leftJoin(brands, eq(tasks.brandId, brands.brandId))
      .where(eq(taskAssignments.userId, userId))
      .orderBy(desc(taskAssignments.createdAt));

    return c.json({ assignments });

  } catch (error) {
    console.error('Error fetching user assignments:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Submit proof for task completion
taskRoutes.post('/:taskId/submit', verifyPrivyTokenJWKS, async (c) => {
  const taskId = c.req.param('taskId');
  const privyUser = c.get('user');
  const userId = privyUser.privyId;

  try {
    const body = await c.req.json();
    const { evidence } = body;

    if (!evidence) {
      return c.json({ error: 'Evidence is required' }, 400);
    }

    // Find user's active assignment for this task
    const db = c.get('db');
    const [assignment] = await db
      .select()
      .from(taskAssignments)
      .where(and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.userId, userId),
        eq(taskAssignments.status, 'assigned')
      ))
      .limit(1);

    if (!assignment) {
      return c.json({ error: 'NoActiveAssignment' }, 400);
    }

    // Update assignment with evidence and mark as submitted
    const [updatedAssignment] = await db
      .update(taskAssignments)
      .set({
        evidence: evidence,
        status: 'submitted',
        submittedAt: new Date(),
      })
      .where(eq(taskAssignments.taskAssignmentId, assignment.taskAssignmentId))
      .returning();

    return c.json({
      taskAssignmentId: updatedAssignment!.taskAssignmentId,
      taskId: updatedAssignment!.taskId,
      userId: updatedAssignment!.userId,
      status: updatedAssignment!.status,
      evidence: updatedAssignment!.evidence,
      submittedAt: updatedAssignment!.submittedAt,
      rewardAmount: updatedAssignment!.rewardAmount,
      currency: updatedAssignment!.currency,
      payoutStatus: updatedAssignment!.payoutStatus,
    });

  } catch (error) {
    console.error('Error submitting task proof:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default taskRoutes;