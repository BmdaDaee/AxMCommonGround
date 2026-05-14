import { pgTable, text, serial, integer, boolean, timestamp, uuid, varchar, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatar: text('avatar'),
  loveLanguage: varchar('love_language', { length: 50 }),
  communicationStyle: varchar('communication_style', { length: 50 }),
  artStyle: varchar('art_style', { length: 50 }),
  rankTheme: varchar('rank_theme', { length: 50 }),
  xp: integer('xp').default(0),
  rank: varchar('rank', { length: 50 }).default('SPARK'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIndex: uniqueIndex('users_email_idx').on(table.email),
}));

// Pairs table
export const pairs = pgTable('pairs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user1Id: uuid('user1_id').notNull().references(() => users.id),
  user2Id: uuid('user2_id').notNull().references(() => users.id),
  status: varchar('status', { length: 50 }).default('PENDING'),
  relationalState: varchar('relational_state', { length: 50 }).default('DORMANT'),
  availability: varchar('availability', { length: 50 }).default('MEDIUM'),
  alignment: varchar('alignment', { length: 50 }).default('MEDIUM'),
  activation: varchar('activation', { length: 50 }).default('MEDIUM'),
  trust: varchar('trust', { length: 50 }).default('MEDIUM'),
  pairedAt: timestamp('paired_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  user1Index: index('pairs_user1_idx').on(table.user1Id),
  user2Index: index('pairs_user2_idx').on(table.user2Id),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  type: varchar('type', { length: 50 }).default('TEXT'),
  mediaUrls: jsonb('media_urls'),
  xpReward: integer('xp_reward').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  pairIndex: index('messages_pair_idx').on(table.pairId),
  userIndex: index('messages_user_idx').on(table.userId),
}));

// Message Rewrites table
export const messageRewrites = pgTable('message_rewrites', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').notNull().references(() => messages.id),
  originalContent: text('original_content').notNull(),
  rewriteMode: varchar('rewrite_mode', { length: 50 }).notNull(),
  rewrittenContent: text('rewritten_content').notNull(),
  applied: boolean('applied').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

// Missions table
export const missions = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  xpReward: integer('xp_reward').default(50),
  completed: boolean('completed').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  pairIndex: index('missions_pair_idx').on(table.pairId),
}));

// Journal Entries table
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  prompt: text('prompt'),
  content: text('content').notNull(),
  mood: varchar('mood', { length: 50 }),
  themes: jsonb('themes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  pairIndex: index('journal_pair_idx').on(table.pairId),
  userIndex: index('journal_user_idx').on(table.userId),
}));

// XP Logs table
export const xpLogs = pgTable('xp_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  pairId: uuid('pair_id').references(() => pairs.id),
  amount: integer('amount').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIndex: index('xp_logs_user_idx').on(table.userId),
}));
