import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const RANK_TIERS = [
  { tier: "SPARK", minXP: 0, emoji: "✨" },
  { tier: "FLAME", minXP: 500, emoji: "🔥" },
  { tier: "CALIBRATOR", minXP: 2000, emoji: "⚖️" },
  { tier: "INFERNO", minXP: 5000, emoji: "🌋" },
  { tier: "SOVEREIGN", minXP: 15000, emoji: "👑" },
] as const;

export function getTierFromXP(xp: number) {
  let idx = 0;
  for (let i = 0; i < RANK_TIERS.length; i++) { if (xp >= RANK_TIERS[i].minXP) idx = i; }
  const current = RANK_TIERS[idx];
  const next = RANK_TIERS[idx + 1];
  return { tier: current.tier, tierEmoji: current.emoji, nextTier: next?.tier ?? null, xpToNext: next ? next.minXP - xp : 0 };
}

export async function awardXP(profileId: string, amount: number): Promise<number> {
  const { data: existing } = await supabase.from("user_xp").select("total_xp").eq("profile_id", profileId).single();
  const newTotal = (existing?.total_xp ?? 0) + amount;
  await supabase.from("user_xp").upsert({ profile_id: profileId, total_xp: newTotal, updated_at: new Date().toISOString() }, { onConflict: "profile_id" });
  return newTotal;
}

export const EXERCISES = [
  { id: "eye_contact", title: "4-Minute Eye Contact", description: "Sit facing each other, maintain eye contact for 4 minutes without speaking.", category: "Connection", xp: 30, mode: "common" },
  { id: "gratitude_shower", title: "Gratitude Shower", description: "Each partner shares 5 specific things they appreciate about the other.", category: "Appreciation", xp: 25, mode: "common" },
  { id: "listening_challenge", title: "Deep Listening", description: "One partner speaks for 5 minutes uninterrupted. The other only listens, then reflects back.", category: "Communication", xp: 35, mode: "common" },
  { id: "love_map", title: "Love Map Update", description: "Ask each other 10 questions about your partner's inner world — dreams, fears, goals.", category: "Intimacy", xp: 40, mode: "common" },
  { id: "conflict_repair", title: "Conflict Repair Ritual", description: "After a disagreement, each partner shares: what I felt, what I needed, what I appreciate about you.", category: "Repair", xp: 50, mode: "common" },
  { id: "sensory_presence", title: "Sensory Presence", description: "Sit together in silence for 10 minutes. Notice each other's presence without words.", category: "Mindfulness", xp: 20, mode: "deeply" },
  { id: "desire_share", title: "Desire Share", description: "Each partner shares one desire or fantasy they've been holding back. No judgment, only curiosity.", category: "Intimacy", xp: 60, mode: "deeply" },
  { id: "touch_map", title: "Touch Map", description: "Guide your partner's hand to show them exactly how and where you like to be touched.", category: "Physical", xp: 50, mode: "deeply" },
];

export const GROWTH_MODULES = [
  { id: "feel_closer", title: "Feel Closer", description: "Deepen emotional connection through daily micro-rituals", days: 7, xp: 100 },
  { id: "healthy_conflict", title: "Healthy Conflict", description: "Learn to argue better — and come out stronger", days: 7, xp: 100 },
  { id: "clear_communication", title: "Clear Communication", description: "Fix misunderstandings at the root", days: 7, xp: 100 },
  { id: "deeper_intimacy", title: "Deeper Intimacy", description: "Physical and emotional closeness, rebuilt from scratch", days: 7, xp: 100 },
  { id: "trust_rebuild", title: "Trust Rebuild", description: "Repair your foundation together, step by step", days: 14, xp: 150 },
];

export const LOVE_LANGUAGE_QUESTIONS = [
  { id: 1, optionA: "Words of Affirmation — hearing how much you're appreciated", optionB: "Acts of Service — having them help with chores" },
  { id: 2, optionA: "Receiving Gifts — a thoughtful gift", optionB: "Quality Time — uninterrupted time together" },
  { id: 3, optionA: "Words of Affirmation — a sincere compliment", optionB: "Physical Touch — a back massage" },
  { id: 4, optionA: "Acts of Service — they do chores without asking", optionB: "Quality Time — they plan a surprise date" },
  { id: 5, optionA: "Words of Affirmation — a written love note", optionB: "Quality Time — quality conversation" },
  { id: 6, optionA: "Receiving Gifts — receiving flowers", optionB: "Physical Touch — physical affection" },
  { id: 7, optionA: "Words of Affirmation — praise from partner", optionB: "Acts of Service — helping with a project" },
  { id: 8, optionA: "Quality Time — a weekend getaway", optionB: "Receiving Gifts — a thoughtful present" },
  { id: 9, optionA: "Physical Touch — holding hands", optionB: "Words of Affirmation — listening without judgment" },
  { id: 10, optionA: "Receiving Gifts — being remembered (birthday, etc.)", optionB: "Acts of Service — help when stressed" },
];

export const DAILY_QUESTIONS = [
  "What's one moment today where you felt most like yourself?",
  "What's something you're carrying right now that you haven't said out loud?",
  "What did you need from me today that you didn't ask for?",
  "What's one thing about us that made you smile recently?",
  "Where are you feeling stuck, and what would help?",
  "What's a dream you've been afraid to share?",
  "What does safety feel like to you right now?",
  "What's one thing you want more of in our relationship?",
  "What are you most grateful for about us right now?",
  "What's one goal you have for our relationship this year?",
  "What does trust mean to you in this relationship?",
  "When do you feel most connected to me?",
];

export const ZODIAC_SIGNS = [
  { sign: "Aries", symbol: "♈", dates: "Mar 21 – Apr 19", element: "Fire" },
  { sign: "Taurus", symbol: "♉", dates: "Apr 20 – May 20", element: "Earth" },
  { sign: "Gemini", symbol: "♊", dates: "May 21 – Jun 20", element: "Air" },
  { sign: "Cancer", symbol: "♋", dates: "Jun 21 – Jul 22", element: "Water" },
  { sign: "Leo", symbol: "♌", dates: "Jul 23 – Aug 22", element: "Fire" },
  { sign: "Virgo", symbol: "♍", dates: "Aug 23 – Sep 22", element: "Earth" },
  { sign: "Libra", symbol: "♎", dates: "Sep 23 – Oct 22", element: "Air" },
  { sign: "Scorpio", symbol: "♏", dates: "Oct 23 – Nov 21", element: "Water" },
  { sign: "Sagittarius", symbol: "♐", dates: "Nov 22 – Dec 21", element: "Fire" },
  { sign: "Capricorn", symbol: "♑", dates: "Dec 22 – Jan 19", element: "Earth" },
  { sign: "Aquarius", symbol: "♒", dates: "Jan 20 – Feb 18", element: "Air" },
  { sign: "Pisces", symbol: "♓", dates: "Feb 19 – Mar 20", element: "Water" },
];
