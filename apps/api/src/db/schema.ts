import { pgTable, pgEnum, uuid, text, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const actionRunStatusEnum = pgEnum('action_run_status', [
  'pending_verification',
  'completed', 
  'failed',
  'paid'
]);

export const actionTypeEnum = pgEnum('action_type', [
  'like',
  'comment', 
  'share',
  'follow',
  'retweet',
  'upvote',
  'award'
]);

export const platformEnum = pgEnum('platform', [
  'tiktok',
  'x',
  'instagram', 
  'reddit',
  'facebook',
  'farcaster',
  'youtube',
  'linkedin'
]);

export const userStatusEnum = pgEnum('user_status', [
  'active',
  'pending_verification',
  'suspended',
  'deactivated'
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  privyId: text('privy_id').unique(),
  email: text('email').notNull().unique(),
  status: userStatusEnum('status').notNull().default('pending_verification'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: platformEnum('platform').notNull(),
  handle: text('handle').notNull(),
  platformUserId: text('platform_user_id'),
  isVerified: boolean('is_verified').notNull().default(false),
  lastVerifiedAt: timestamp('last_verified_at'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  platform: platformEnum('platform').notNull(),
  actionType: actionTypeEnum('action_type').notNull(),
  target: text('target').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  price: integer('price').notNull(),
  maxVolume: integer('max_volume').notNull(),
  currentVolume: integer('current_volume').notNull().default(0),
  eligibilityCriteria: jsonb('eligibility_criteria').notNull().default({}),
  isActive: boolean('is_active').notNull().default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const actionRuns = pgTable('action_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actionId: uuid('action_id').notNull().references(() => actions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  socialAccountId: uuid('social_account_id').notNull().references(() => socialAccounts.id, { onDelete: 'cascade' }),
  status: actionRunStatusEnum('status').notNull().default('pending_verification'),
  proof: jsonb('proof').notNull().default({}),
  verificationData: jsonb('verification_data'),
  paymentData: jsonb('payment_data'),
  completedAt: timestamp('completed_at'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  socialAccounts: many(socialAccounts),
  actionRuns: many(actionRuns),
}));

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [socialAccounts.userId],
    references: [users.id],
  }),
  actionRuns: many(actionRuns),
}));

export const actionsRelations = relations(actions, ({ many }) => ({
  actionRuns: many(actionRuns),
}));

export const actionRunsRelations = relations(actionRuns, ({ one }) => ({
  action: one(actions, {
    fields: [actionRuns.actionId],
    references: [actions.id],
  }),
  user: one(users, {
    fields: [actionRuns.userId],
    references: [users.id],
  }),
  socialAccount: one(socialAccounts, {
    fields: [actionRuns.socialAccountId],
    references: [socialAccounts.id],
  }),
}));