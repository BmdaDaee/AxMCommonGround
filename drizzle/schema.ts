import {
  boolean,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const pairs = mysqlTable("pairs", {
  id: int("id").autoincrement().primaryKey(),
  inviteCode: varchar("inviteCode", { length: 16 }).notNull().unique(),
  createdByUserId: int("createdByUserId").notNull(),
  partnerId: int("partnerId"),
  coupleNickname: varchar("coupleNickname", { length: 100 }),
  togetherSince: timestamp("togetherSince"),
  deeplyusConsent1: boolean("deeplyusConsent1").default(false).notNull(),
  deeplyusConsent2: boolean("deeplyusConsent2").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Pair = typeof pairs.$inferSelect;

export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  pairId: int("pairId"),
  displayName: varchar("displayName", { length: 100 }),
  avatarStyle: mysqlEnum("avatarStyle", ["Bold", "Ethereal", "Classic", "Fantasy"]).default("Classic"),
  avatarColor: varchar("avatarColor", { length: 20 }).default("#0B6B4F"),
  directness: int("directness").default(50).notNull(),
  empathy: int("empathy").default(50).notNull(),
  wit: int("wit").default(50).notNull(),
  warmth: int("warmth").default(50).notNull(),
  xp: int("xp").default(0).notNull(),
  rank: mysqlEnum("rank", ["SPARK", "FLAME", "CALIBRATOR", "INFERNO", "SOVEREIGN"]).default("SPARK").notNull(),
  rankTheme: mysqlEnum("rankTheme", ["Pharaoh", "Samurai", "Celestial", "Shadow"]).default("Pharaoh"),
  streakDays: int("streakDays").default(0).notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow(),
  bentlyEnabled: boolean("bentlyEnabled").default(true).notNull(),
  reducedMotion: boolean("reducedMotion").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Profile = typeof profiles.$inferSelect;

export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isDeeplyUs: boolean("isDeeplyUs").default(false).notNull(),
  bentlyRewrite: text("bentlyRewrite"),
  rewriteTone: mysqlEnum("rewriteTone", ["Gentle", "Direct", "Collaborative"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;

export const missions = mysqlTable("missions", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId"),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("Connection").notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed"]).default("not_started").notNull(),
  xpReward: int("xpReward").default(50).notNull(),
  isGlobal: boolean("isGlobal").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Mission = typeof missions.$inferSelect;

export const sparks = mysqlTable("sparks", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId"),
  type: mysqlEnum("type", ["Would You Rather", "2 Truths 1 Lie", "Rate Your Day", "Tonight Spark", "Daily Prompt"]).notNull(),
  content: text("content").notNull(),
  optionA: text("optionA"),
  optionB: text("optionB"),
  xpReward: int("xpReward").default(10).notNull(),
  isGlobal: boolean("isGlobal").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Spark = typeof sparks.$inferSelect;

export const memories = mysqlTable("memories", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  addedByUserId: int("addedByUserId").notNull(),
  imageUrl: text("imageUrl"),
  imageKey: text("imageKey"),
  caption: text("caption"),
  category: varchar("category", { length: 50 }).default("Moment"),
  xpEarned: int("xpEarned").default(20).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Memory = typeof memories.$inferSelect;

export const deeplyusSessions = mysqlTable("deeplyus_sessions", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull().unique(),
  isActive: boolean("isActive").default(false).notNull(),
  moodAffection: int("moodAffection").default(50).notNull(),
  moodPassion: int("moodPassion").default(50).notNull(),
  moodCalm: int("moodCalm").default(50).notNull(),
  activatedAt: timestamp("activatedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DeeplyUsSession = typeof deeplyusSessions.$inferSelect;

export const playlistItems = mysqlTable("playlist_items", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  artist: varchar("artist", { length: 200 }),
  addedByUserId: int("addedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PlaylistItem = typeof playlistItems.$inferSelect;

export const vaultItems = mysqlTable("vault_items", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  content: text("content").notNull(),
  addedByUserId: int("addedByUserId").notNull(),
  isEncrypted: boolean("isEncrypted").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VaultItem = typeof vaultItems.$inferSelect;

export const dailyPrompts = mysqlTable("daily_prompts", {
  id: int("id").autoincrement().primaryKey(),
  content: text("content").notNull(),
  xpReward: int("xpReward").default(10).notNull(),
  activeDate: timestamp("activeDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DailyPrompt = typeof dailyPrompts.$inferSelect;

export const promptResponses = mysqlTable("prompt_responses", {
  id: int("id").autoincrement().primaryKey(),
  promptId: int("promptId").notNull(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  iconEmoji: varchar("iconEmoji", { length: 10 }).default("🏆"),
  xpEarned: int("xpEarned").default(100).notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
});
export type Achievement = typeof achievements.$inferSelect;

export const intimateMessages = mysqlTable("intimate_messages", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  bentlyResponse: text("bentlyResponse"),
  escalationLevel: int("escalationLevel").default(1).notNull(),
  isDisappearing: boolean("isDisappearing").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IntimateMessage = typeof intimateMessages.$inferSelect;

export const desireMap = mysqlTable("desire_map", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  item: varchar("item", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["green", "yellow", "red"]).default("yellow").notNull(),
  isShared: boolean("isShared").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DesireMapItem = typeof desireMap.$inferSelect;

export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  aiAnalysis: text("aiAnalysis"),
  mood: varchar("mood", { length: 30 }),
  isSharedWithPartner: boolean("isSharedWithPartner").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type JournalEntry = typeof journalEntries.$inferSelect;

export const quizResponses = mysqlTable("quiz_responses", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  questionId: int("questionId").notNull(),
  chosenOption: varchar("chosenOption", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type QuizResponse = typeof quizResponses.$inferSelect;

export const dailyQuestionAnswers = mysqlTable("daily_question_answers", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  questionIndex: int("questionIndex").notNull(),
  answer: text("answer").notNull(),
  dateKey: varchar("dateKey", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DailyQuestionAnswer = typeof dailyQuestionAnswers.$inferSelect;

export const growthCompletions = mysqlTable("growth_completions", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  moduleId: varchar("moduleId", { length: 50 }).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type GrowthCompletion = typeof growthCompletions.$inferSelect;

export const exerciseCompletions = mysqlTable("exercise_completions", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  exerciseId: varchar("exerciseId", { length: 50 }).notNull(),
  xpAwarded: int("xpAwarded").default(0).notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type ExerciseCompletion = typeof exerciseCompletions.$inferSelect;

export const sharedLists = mysqlTable("shared_lists", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  listType: varchar("listType", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  addedByUserId: int("addedByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SharedListItem = typeof sharedLists.$inferSelect;

export const calendarEvents = mysqlTable("calendar_events", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  category: varchar("category", { length: 50 }).default("Date").notNull(),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CalendarEvent = typeof calendarEvents.$inferSelect;

export const relationalStateHistory = mysqlTable("relational_state_history", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  availability: mysqlEnum("availability", ["LOW", "MEDIUM", "HIGH"]).notNull(),
  alignment: mysqlEnum("alignment", ["LOW", "MEDIUM", "HIGH"]).notNull(),
  activation: mysqlEnum("activation", ["LOW", "MEDIUM", "HIGH"]).notNull(),
  trust: mysqlEnum("trust", ["LOW", "MEDIUM", "HIGH"]).notNull(),
  derivedState: varchar("derivedState", { length: 30 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type RelationalStateHistory = typeof relationalStateHistory.$inferSelect;

export const astrologyReadings = mysqlTable("astrology_readings", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  zodiac1: varchar("zodiac1", { length: 20 }).notNull(),
  zodiac2: varchar("zodiac2", { length: 20 }).notNull(),
  mode: mysqlEnum("mode", ["common", "deeply"]).default("common").notNull(),
  reading: text("reading").notNull(),
  dateKey: varchar("dateKey", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AstrologyReading = typeof astrologyReadings.$inferSelect;

export const bentlyInterventions = mysqlTable("bently_interventions", {
  id: int("id").autoincrement().primaryKey(),
  pairId: int("pairId").notNull(),
  userId: int("userId").notNull(),
  interventionType: varchar("interventionType", { length: 30 }).notNull(),
  overlayType: varchar("overlayType", { length: 20 }).default("common").notNull(),
  interventionText: text("interventionText").notNull(),
  userResponse: text("userResponse"),
  xpAwarded: int("xpAwarded").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BentlyIntervention = typeof bentlyInterventions.$inferSelect;
