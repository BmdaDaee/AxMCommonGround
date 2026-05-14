// Auth & User Types
export type UserId = string & { readonly __brand: "UserId" };
export type PairId = string & { readonly __brand: "PairId" };
export type MessageId = string & { readonly __brand: "MessageId" };

export interface User {
  id: UserId;
  email: string;
  name: string;
  avatar: string | null;
  loveLanguage: LoveLanguageType;
  communicationStyle: CommunicationStyle;
  artStyle: ArtStyle;
  rankTheme: RankTheme;
  xp: number;
  rank: RankTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  bio: string;
  zodiacSign: string | null;
  mbti: string | null;
  enneagram: string | null;
  companyId: string | null;
}

// Pair & Relationship Types
export interface Pair {
  id: PairId;
  user1Id: UserId;
  user2Id: UserId;
  status: PairStatus;
  relationalState: RelationalState;
  relationalMetrics: RelationalMetrics;
  pairedAt: Date;
  updatedAt: Date;
}

export interface RelationalMetrics {
  availability: RelationalMetric;
  alignment: RelationalMetric;
  activation: RelationalMetric;
  trust: RelationalMetric;
}

export interface RelationalHealth {
  state: RelationalState;
  score: number; // 0-100
  dimensions: RelationalMetrics;
  lastUpdated: Date;
}

// Message Types
export interface Message {
  id: MessageId;
  pairId: PairId;
  userId: UserId;
  content: string;
  type: MessageType;
  mediaUrls: string[];
  xpReward: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRewrite {
  originalMessageId: MessageId;
  originalContent: string;
  rewriteMode: RewriteMode;
  rewrittenContent: string;
  applied: boolean;
  createdAt: Date;
}

export interface VoiceMessage {
  id: string;
  pairId: PairId;
  userId: UserId;
  audioUrl: string;
  transcript: string;
  duration: number;
  createdAt: Date;
}

// Bently AI Types
export interface BentlyContext {
  pairId: PairId;
  userId: UserId;
  relationalState: RelationalState;
  relationalMetrics: RelationalMetrics;
  recentMessages: Message[];
  currentMode: BentlyMode;
}

export interface BentlyResponse {
  id: string;
  messageId: MessageId;
  content: string;
  mode: BentlyMode;
  confidence: number;
  suggestions: string[];
  xpEarned: number;
  createdAt: Date;
}

export interface BentlyAnalysis {
  messageId: MessageId;
  sentiment: SentimentType;
  tone: ToneType;
  emotionalLoad: number; // 0-10
  communicationGap: boolean;
  suggestedResponse: string;
}

// XP & Rank Types
export interface RankProgress {
  userId: UserId;
  currentRank: RankTier;
  currentXp: number;
  xpToNextRank: number;
  percentProgress: number;
}

export interface Mission {
  id: string;
  pairId: PairId;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  category: ExerciseCategory;
  duration: number; // in minutes
  xpReward: number;
  difficulty: DifficultyLevel;
}

export interface UserExerciseProgress {
  userId: UserId;
  exerciseId: string;
  completed: boolean;
  completedAt: Date | null;
  xpEarned: number;
}

// Journal & Growth Types
export interface JournalEntry {
  id: string;
  pairId: PairId;
  userId: UserId;
  prompt: string;
  content: string;
  mood: MoodType;
  themes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GrowthModule {
  id: string;
  title: string;
  description: string;
  category: GrowthCategory;
  lessons: Lesson[];
  xpReward: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  order: number;
}

export interface UserGrowthProgress {
  userId: UserId;
  moduleId: string;
  completedLessons: string[];
  completed: boolean;
  completedAt: Date | null;
}

// DeeplyUs Types
export interface DeeplyUsVault {
  id: string;
  pairId: PairId;
  userId: UserId;
  entries: DeeplyUsEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DeeplyUsEntry {
  id: string;
  content: string;
  category: DeeplyUsCategory;
  createdAt: Date;
}

export interface DesireMap {
  id: string;
  pairId: PairId;
  userId: UserId;
  desires: DesireItem[];
  boundaries: BoundaryItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DesireItem {
  id: string;
  title: string;
  description: string;
  priority: PriorityLevel;
  frequency: FrequencyLevel;
}

export interface BoundaryItem {
  id: string;
  title: string;
  description: string;
  firmness: FirmnessLevel; // soft, medium, hard
}

export interface IntimateMessage {
  id: string;
  pairId: PairId;
  fromUserId: UserId;
  toUserId: UserId;
  content: string;
  category: DeeplyUsCategory;
  createdAt: Date;
}

// Calendar & Event Types
export interface CalendarEvent {
  id: string;
  pairId: PairId;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string | null;
  type: EventType;
  reminder: boolean;
}

export interface Milestone {
  id: string;
  pairId: PairId;
  title: string;
  date: Date;
  description: string;
  importance: number; // 1-10
}

// Settings Types
export interface UserSettings {
  userId: UserId;
  notificationsEnabled: boolean;
  emailDigest: EmailFrequency;
  theme: ThemeMode;
  language: string;
}

export interface PairSettings {
  pairId: PairId;
  goalFrequency: GoalFrequency;
  checkInReminders: boolean;
  privacyLevel: PrivacyLevel;
}

// Import enums for type usage
import {
  PairStatus,
  RelationalState,
  RelationalMetric,
  RankTier,
  RankTheme,
  CommunicationStyle,
  ArtStyle,
  LoveLanguageType,
  BentlyMode,
  MessageType,
  RewriteMode,
  SentimentType,
  ToneType,
  MoodType,
  ExerciseCategory,
  GrowthCategory,
  DeeplyUsCategory,
  DifficultyLevel,
  PriorityLevel,
  FrequencyLevel,
  FirmnessLevel,
  EventType,
  ThemeMode,
  EmailFrequency,
  GoalFrequency,
  PrivacyLevel,
} from './enums';
