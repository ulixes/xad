import { pgTable, text, decimal, timestamp, boolean, pgEnum, uuid, integer, json, unique, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Enums
export const platformEnum = pgEnum('platform', ['x', 'farcaster', 'reddit']);
export const taskTypeEnum = pgEnum('task_type', ['comment', 'upvote', 'like', 'love', 'follow']);
export const verificationEnum = pgEnum('verification', ['manual', 'auto']);
export const taskAssignmentStatusEnum = pgEnum('task_assignment_status', ['assigned', 'submitted', 'approved', 'awaiting', 'paid', 'rejected', 'expired']);
export const payoutStatusEnum = pgEnum('payout_status', ['pending', 'on_hold', 'released', 'failed']);
export const rewardModeEnum = pgEnum('reward_mode', ['static', 'dynamic']);

// Brand entity - represents advertisers/businesses
export const brands = pgTable('brands', {
  brandId: uuid('brand_id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User entity - represents platform users
export const users = pgTable('users', {
  privyUserId: text('privy_user_id').primaryKey(), // Privy's DID as primary key
  balance: decimal('balance', { precision: 10, scale: 2 }).default('0.00').notNull(),
  cashOutLimit: decimal('cash_out_limit', { precision: 10, scale: 2 }).default('5.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  redditUsername: text('reddit_username'),
  redditData: text('reddit_data'), // JSON string of Reddit profile data
  profileScrapedAt: timestamp('profile_scraped_at'),
});

// Task entity - represents paid actions
export const tasks = pgTable('tasks', {
  taskId: uuid('task_id').defaultRandom().primaryKey(),
  brandId: uuid('brand_id').references(() => brands.brandId).notNull(),
  platform: platformEnum('platform').notNull(),
  type: taskTypeEnum('type').notNull(),
  targets: text('targets').array().notNull(), // Array of links
  volume: integer('volume').notNull(), // Total requested actions
  budget: decimal('budget', { precision: 10, scale: 2 }).notNull(), // Total budget
  currency: text('currency').default('USD').notNull(),
  rewardPerAction: decimal('reward_per_action', { precision: 10, scale: 2 }), // Can be null, auto-calculated
  expirationDate: timestamp('expiration_date'),
  payoutReleaseAfter: text('payout_release_after'), // ISO-8601 duration
  active: boolean('active').default(true).notNull(),
  instructions: text('instructions').array().notNull(),
  verification: verificationEnum('verification').default('auto').notNull(),
  maxActionsPerUser: integer('max_actions_per_user').default(1).notNull(),
  rewardDistribution: json('reward_distribution').notNull(), // {mode: 'static' | 'dynamic', tiers: null}
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// TaskAssignment entity - connects users with tasks
export const taskAssignments = pgTable('task_assignments', {
  taskAssignmentId: uuid('task_assignment_id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.taskId).notNull(),
  userId: text('user_id').references(() => users.privyUserId).notNull(),
  status: taskAssignmentStatusEnum('status').default('assigned').notNull(),
  evidence: json('evidence'), // {screenshot_url, comment_text, metadata}
  rewardAmount: decimal('reward_amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  submittedAt: timestamp('submitted_at'),
  approvedAt: timestamp('approved_at'),
  paidAt: timestamp('paid_at'),
  payoutStatus: payoutStatusEnum('payout_status').default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  // Ensure one assignment per user per task
  uniqueUserTask: unique().on(table.taskId, table.userId),
  // Ensure only one assigned task per user at a time
  uniqueActiveAssignment: uniqueIndex('unique_active_assignment_idx').on(table.userId).where(sql`${table.status} = 'assigned'`),
}));


// Type exports
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskAssignment = typeof taskAssignments.$inferSelect;
export type NewTaskAssignment = typeof taskAssignments.$inferInsert;