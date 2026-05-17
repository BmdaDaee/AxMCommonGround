// XP & Rank Configuration
export const XP_CONFIG = {
    MESSAGE_SENT: 10,
    REWRITE_APPLIED: 25,
    EXERCISE_COMPLETED: 50,
    MISSION_COMPLETED: 100,
    JOURNAL_ENTRY: 15,
    BENTLY_INSIGHT: 20,
};
export const RANK_XP_REQUIREMENTS = {
    SPARK: 0,
    FLAME: 500,
    CALIBRATOR: 2000,
    INFERNO: 5000,
    SOVEREIGN: 10000,
};
// Message & Communication
export const MESSAGE_LIMITS = {
    MAX_LENGTH: 5000,
    MAX_MEDIA_COUNT: 5,
    MAX_VOICE_DURATION: 600, // 10 minutes in seconds
};
// Relational Engine Logic
export const RELATIONAL_ENGINE = {
    // 5-state machine thresholds
    ALIGNED_THRESHOLD: 4, // All 4 dimensions HIGH
    DORMANT_THRESHOLD: 4, // All 4 dimensions LOW
    CAPACITY_BLOCKED_FACTORS: ['AVAILABILITY', 'ACTIVATION'], // If either is LOW
    TRUST_FRACTURED_FACTOR: 'TRUST', // If trust is LOW
};
// Cache & Persistence
export const CACHE_TTL = {
    USER_PROFILE: 3600, // 1 hour
    PAIR_HEALTH: 300, // 5 minutes
    MESSAGES: 3600, // 1 hour
    XP_LEADERBOARD: 1800, // 30 minutes
};
// API Pagination
export const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
};
// Timeouts
export const TIMEOUTS = {
    BENTLY_RESPONSE: 10000, // 10 seconds
    IMAGE_GENERATION: 30000, // 30 seconds
    VOICE_TRANSCRIPTION: 60000, // 60 seconds
};
