import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

const createdAt = timestamp('created_at', { withTimezone: true }).notNull().defaultNow();
const updatedAt = timestamp('updated_at', { withTimezone: true }).notNull().defaultNow();

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 120 }).notNull(),
  avatar: text('avatar'),
  loveLanguage: varchar('love_language', { length: 64 }).notNull().default('WORDS_OF_AFFIRMATION'),
  communicationStyle: varchar('communication_style', { length: 64 }).notNull().default('COLLABORATIVE'),
  artStyle: varchar('art_style', { length: 64 }).notNull().default('ETHEREAL'),
  rankTheme: varchar('rank_theme', { length: 64 }).notNull().default('PHARAOH'),
  xp: integer('xp').notNull().default(0),
  rank: varchar('rank', { length: 64 }).notNull().default('SPARK'),
  createdAt,
  updatedAt,
});

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  bio: text('bio').notNull().default(''),
  zodiacSign: varchar('zodiac_sign', { length: 64 }),
  mbti: varchar('mbti', { length: 16 }),
  enneagram: varchar('enneagram', { length: 16 }),
  companyId: varchar('company_id', { length: 120 }),
  createdAt,
  updatedAt,
});

export const authAccounts = pgTable('auth_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  provider: varchar('provider', { length: 64 }).notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  createdAt,
  updatedAt,
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt,
  updatedAt,
});

export const pairs = pgTable('pairs', {
  id: uuid('id').primaryKey().defaultRandom(),
  user1Id: uuid('user1_id').notNull().references(() => users.id),
  user2Id: uuid('user2_id').notNull().references(() => users.id),
  status: varchar('status', { length: 64 }).notNull().default('PENDING'),
  relationalState: varchar('relational_state', { length: 64 }).notNull().default('DORMANT'),
  relationalMetrics: jsonb('relational_metrics').notNull().default({}),
  pairedAt: timestamp('paired_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt,
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  type: varchar('type', { length: 64 }).notNull().default('TEXT'),
  mediaUrls: jsonb('media_urls').notNull().default([]),
  xpReward: integer('xp_reward').notNull().default(0),
  createdAt,
  updatedAt,
});

export const messageRewrites = pgTable('message_rewrites', {
  id: uuid('id').primaryKey().defaultRandom(),
  originalMessageId: uuid('original_message_id').notNull().references(() => messages.id),
  originalContent: text('original_content').notNull(),
  rewriteMode: varchar('rewrite_mode', { length: 64 }).notNull(),
  rewrittenContent: text('rewritten_content').notNull(),
  applied: boolean('applied').notNull().default(false),
  createdAt,
});

export const voiceMessages = pgTable('voice_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  audioUrl: text('audio_url').notNull(),
  transcript: text('transcript').notNull().default(''),
  duration: integer('duration').notNull().default(0),
  createdAt,
});

export const bentlyResponses = pgTable('bently_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => messages.id),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  mode: varchar('mode', { length: 64 }).notNull().default('COMMON'),
  confidence: integer('confidence').notNull().default(0),
  suggestions: jsonb('suggestions').notNull().default([]),
  xpEarned: integer('xp_earned').notNull().default(0),
  createdAt,
});

export const bentlyAnalyses = pgTable('bently_analyses', {
  id: uuid('id').primaryKey().defaultRandom(),
  messageId: uuid('message_id').references(() => messages.id),
  sentiment: varchar('sentiment', { length: 64 }).notNull().default('NEUTRAL'),
  tone: varchar('tone', { length: 64 }).notNull().default('SERIOUS'),
  emotionalLoad: integer('emotional_load').notNull().default(0),
  communicationGap: boolean('communication_gap').notNull().default(false),
  suggestedResponse: text('suggested_response').notNull().default(''),
  createdAt,
});

export const xpEvents = pgTable('xp_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  pairId: uuid('pair_id').references(() => pairs.id),
  source: varchar('source', { length: 96 }).notNull(),
  amount: integer('amount').notNull(),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt,
});

export const missions = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  title: varchar('title', { length: 180 }).notNull(),
  description: text('description').notNull(),
  xpReward: integer('xp_reward').notNull().default(0),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt,
});

export const exercises = pgTable('exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 180 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  duration: integer('duration').notNull().default(10),
  xpReward: integer('xp_reward').notNull().default(0),
  difficulty: varchar('difficulty', { length: 64 }).notNull().default('EASY'),
  createdAt,
  updatedAt,
});

export const userExerciseProgress = pgTable('user_exercise_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  exerciseId: uuid('exercise_id').notNull().references(() => exercises.id),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  xpEarned: integer('xp_earned').notNull().default(0),
  createdAt,
  updatedAt,
});

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  prompt: text('prompt').notNull(),
  content: text('content').notNull(),
  mood: varchar('mood', { length: 64 }).notNull().default('NEUTRAL'),
  themes: jsonb('themes').notNull().default([]),
  createdAt,
  updatedAt,
});

export const growthModules = pgTable('growth_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 180 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  xpReward: integer('xp_reward').notNull().default(0),
  createdAt,
  updatedAt,
});

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id').notNull().references(() => growthModules.id),
  title: varchar('title', { length: 180 }).notNull(),
  content: text('content').notNull(),
  order: integer('order').notNull().default(0),
  createdAt,
  updatedAt,
});

export const userGrowthProgress = pgTable('user_growth_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  moduleId: uuid('module_id').notNull().references(() => growthModules.id),
  completedLessons: jsonb('completed_lessons').notNull().default([]),
  completed: boolean('completed').notNull().default(false),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt,
  updatedAt,
});

export const deeplyUsVaults = pgTable('deeply_us_vaults', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  entries: jsonb('entries').notNull().default([]),
  createdAt,
  updatedAt,
});

export const desireMaps = pgTable('desire_maps', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  desires: jsonb('desires').notNull().default([]),
  boundaries: jsonb('boundaries').notNull().default([]),
  createdAt,
  updatedAt,
});

export const intimateMessages = pgTable('intimate_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  fromUserId: uuid('from_user_id').notNull().references(() => users.id),
  toUserId: uuid('to_user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  category: varchar('category', { length: 64 }).notNull(),
  createdAt,
});

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  title: varchar('title', { length: 180 }).notNull(),
  description: text('description').notNull().default(''),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  location: text('location'),
  type: varchar('type', { length: 64 }).notNull().default('OTHER'),
  reminder: boolean('reminder').notNull().default(true),
  createdAt,
  updatedAt,
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  pairId: uuid('pair_id').notNull().references(() => pairs.id),
  title: varchar('title', { length: 180 }).notNull(),
  date: timestamp('date', { withTimezone: true }).notNull(),
  description: text('description').notNull().default(''),
  importance: integer('importance').notNull().default(5),
  createdAt,
  updatedAt,
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  type: varchar('type', { length: 96 }).notNull(),
  title: varchar('title', { length: 180 }).notNull(),
  body: text('body').notNull(),
  read: boolean('read').notNull().default(false),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt,
  updatedAt,
});

export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull(),
  ownerType: varchar('owner_type', { length: 32 }).notNull(),
  values: jsonb('values').notNull().default({}),
  createdAt,
  updatedAt,
});

export const schemaTables = {
  users,
  userProfiles,
  authAccounts,
  sessions,
  pairs,
  messages,
  messageRewrites,
  voiceMessages,
  bentlyResponses,
  bentlyAnalyses,
  xpEvents,
  missions,
  exercises,
  userExerciseProgress,
  journalEntries,
  growthModules,
  lessons,
  userGrowthProgress,
  deeplyUsVaults,
  desireMaps,
  intimateMessages,
  calendarEvents,
  milestones,
  notifications,
  settings,
};
