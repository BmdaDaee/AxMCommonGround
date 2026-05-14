// Pair Status
export const PAIR_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DISSOLVED: 'DISSOLVED',
} as const;
export type PairStatus = typeof PAIR_STATUS[keyof typeof PAIR_STATUS];

// Relational State (5-state machine output)
export const RELATIONAL_STATE = {
  ALIGNED: 'ALIGNED',
  DORMANT: 'DORMANT',
  MISALIGNED: 'MISALIGNED',
  CAPACITY_BLOCKED: 'CAPACITY_BLOCKED',
  TRUST_FRACTURED: 'TRUST_FRACTURED',
} as const;
export type RelationalState = typeof RELATIONAL_STATE[keyof typeof RELATIONAL_STATE];

// Relational Metric (Dimension values)
export const RELATIONAL_METRIC = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
} as const;
export type RelationalMetric = typeof RELATIONAL_METRIC[keyof typeof RELATIONAL_METRIC];

// Rank Tiers
export const RANK_TIER = {
  SPARK: 'SPARK',
  FLAME: 'FLAME',
  CALIBRATOR: 'CALIBRATOR',
  INFERNO: 'INFERNO',
  SOVEREIGN: 'SOVEREIGN',
} as const;
export type RankTier = typeof RANK_TIER[keyof typeof RANK_TIER];

// Rank Themes
export const RANK_THEME = {
  PHARAOH: 'PHARAOH',
  SAMURAI: 'SAMURAI',
  CELESTIAL: 'CELESTIAL',
  SHADOW: 'SHADOW',
} as const;
export type RankTheme = typeof RANK_THEME[keyof typeof RANK_THEME];

// Communication Style
export const COMMUNICATION_STYLE = {
  GENTLE: 'GENTLE',
  DIRECT: 'DIRECT',
  COLLABORATIVE: 'COLLABORATIVE',
} as const;
export type CommunicationStyle = typeof COMMUNICATION_STYLE[keyof typeof COMMUNICATION_STYLE];

// Art Style
export const ART_STYLE = {
  ETHEREAL: 'ETHEREAL',
  BOLD: 'BOLD',
  CLASSIC: 'CLASSIC',
  FANTASY: 'FANTASY',
} as const;
export type ArtStyle = typeof ART_STYLE[keyof typeof ART_STYLE];

// Love Language Types
export const LOVE_LANGUAGE = {
  WORDS_OF_AFFIRMATION: 'WORDS_OF_AFFIRMATION',
  QUALITY_TIME: 'QUALITY_TIME',
  PHYSICAL_TOUCH: 'PHYSICAL_TOUCH',
  ACTS_OF_SERVICE: 'ACTS_OF_SERVICE',
  GIFTS: 'GIFTS',
} as const;
export type LoveLanguageType = typeof LOVE_LANGUAGE[keyof typeof LOVE_LANGUAGE];

// Bently Modes
export const BENTLY_MODE = {
  COMMON: 'COMMON',
  DEEPLY_US: 'DEEPLY_US',
  SANDBOX: 'SANDBOX',
  BRIDGE: 'BRIDGE',
} as const;
export type BentlyMode = typeof BENTLY_MODE[keyof typeof BENTLY_MODE];

// Message Types
export const MESSAGE_TYPE = {
  TEXT: 'TEXT',
  VOICE: 'VOICE',
  IMAGE: 'IMAGE',
  BENTLY_REWRITE: 'BENTLY_REWRITE',
} as const;
export type MessageType = typeof MESSAGE_TYPE[keyof typeof MESSAGE_TYPE];

// Rewrite Modes
export const REWRITE_MODE = {
  SOFTEN: 'SOFTEN',
  CLARIFY: 'CLARIFY',
  DEESCALATE: 'DEESCALATE',
  EMOTION_TO_WORDS: 'EMOTION_TO_WORDS',
  BOUNDARY_SET: 'BOUNDARY_SET',
  SUMMARIZE: 'SUMMARIZE',
} as const;
export type RewriteMode = typeof REWRITE_MODE[keyof typeof REWRITE_MODE];

// Sentiment Types
export const SENTIMENT_TYPE = {
  POSITIVE: 'POSITIVE',
  NEUTRAL: 'NEUTRAL',
  NEGATIVE: 'NEGATIVE',
  MIXED: 'MIXED',
} as const;
export type SentimentType = typeof SENTIMENT_TYPE[keyof typeof SENTIMENT_TYPE];

// Tone Types
export const TONE_TYPE = {
  AFFECTIONATE: 'AFFECTIONATE',
  PLAYFUL: 'PLAYFUL',
  SERIOUS: 'SERIOUS',
  FRUSTRATED: 'FRUSTRATED',
  WITHDRAWN: 'WITHDRAWN',
  ANGRY: 'ANGRY',
} as const;
export type ToneType = typeof TONE_TYPE[keyof typeof TONE_TYPE];

// Mood Types
export const MOOD_TYPE = {
  ENERGIZED: 'ENERGIZED',
  CONTENT: 'CONTENT',
  NEUTRAL: 'NEUTRAL',
  ANXIOUS: 'ANXIOUS',
  OVERWHELMED: 'OVERWHELMED',
  DEPRESSED: 'DEPRESSED',
} as const;
export type MoodType = typeof MOOD_TYPE[keyof typeof MOOD_TYPE];

// Exercise Categories
export const EXERCISE_CATEGORY = {
  COMMUNICATION: 'COMMUNICATION',
  INTIMACY: 'INTIMACY',
  CONFLICT_RESOLUTION: 'CONFLICT_RESOLUTION',
  TRUST_BUILDING: 'TRUST_BUILDING',
  PLAYFULNESS: 'PLAYFULNESS',
} as const;
export type ExerciseCategory = typeof EXERCISE_CATEGORY[keyof typeof EXERCISE_CATEGORY];

// Growth Categories
export const GROWTH_CATEGORY = {
  SELF_AWARENESS: 'SELF_AWARENESS',
  EMOTIONAL_INTELLIGENCE: 'EMOTIONAL_INTELLIGENCE',
  RELATIONSHIP_SKILLS: 'RELATIONSHIP_SKILLS',
  WELLNESS: 'WELLNESS',
} as const;
export type GrowthCategory = typeof GROWTH_CATEGORY[keyof typeof GROWTH_CATEGORY];

// DeeplyUs Categories
export const DEEPLY_US_CATEGORY = {
  FANTASY: 'FANTASY',
  DESIRE: 'DESIRE',
  BOUNDARY: 'BOUNDARY',
  VULNERABILITY: 'VULNERABILITY',
  APPRECIATION: 'APPRECIATION',
} as const;
export type DeeplyUsCategory = typeof DEEPLY_US_CATEGORY[keyof typeof DEEPLY_US_CATEGORY];

// Difficulty Levels
export const DIFFICULTY_LEVEL = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type DifficultyLevel = typeof DIFFICULTY_LEVEL[keyof typeof DIFFICULTY_LEVEL];

// Priority Levels
export const PRIORITY_LEVEL = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type PriorityLevel = typeof PRIORITY_LEVEL[keyof typeof PRIORITY_LEVEL];

// Frequency Levels
export const FREQUENCY_LEVEL = {
  RARE: 'RARE',
  OCCASIONAL: 'OCCASIONAL',
  REGULAR: 'REGULAR',
  FREQUENT: 'FREQUENT',
} as const;
export type FrequencyLevel = typeof FREQUENCY_LEVEL[keyof typeof FREQUENCY_LEVEL];

// Firmness Levels
export const FIRMNESS_LEVEL = {
  SOFT: 'SOFT',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
} as const;
export type FirmnessLevel = typeof FIRMNESS_LEVEL[keyof typeof FIRMNESS_LEVEL];

// Event Types
export const EVENT_TYPE = {
  DATE: 'DATE',
  ANNIVERSARY: 'ANNIVERSARY',
  CHECK_IN: 'CHECK_IN',
  MILESTONE: 'MILESTONE',
  OTHER: 'OTHER',
} as const;
export type EventType = typeof EVENT_TYPE[keyof typeof EVENT_TYPE];

// Theme Mode
export const THEME_MODE = {
  LIGHT: 'LIGHT',
  DARK: 'DARK',
  AUTO: 'AUTO',
} as const;
export type ThemeMode = typeof THEME_MODE[keyof typeof THEME_MODE];

// Email Frequency
export const EMAIL_FREQUENCY = {
  NEVER: 'NEVER',
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
} as const;
export type EmailFrequency = typeof EMAIL_FREQUENCY[keyof typeof EMAIL_FREQUENCY];

// Goal Frequency
export const GOAL_FREQUENCY = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  CUSTOM: 'CUSTOM',
} as const;
export type GoalFrequency = typeof GOAL_FREQUENCY[keyof typeof GOAL_FREQUENCY];

// Privacy Level
export const PRIVACY_LEVEL = {
  PUBLIC: 'PUBLIC',
  FRIENDS: 'FRIENDS',
  PRIVATE: 'PRIVATE',
} as const;
export type PrivacyLevel = typeof PRIVACY_LEVEL[keyof typeof PRIVACY_LEVEL];
