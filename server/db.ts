/**
 * AxMCommonGround — Supabase DB helpers
 * Relational engine logic lives in ./relationalEngine
 */
import { supabase, awardXP, DAILY_QUESTIONS } from "./supabase";
import { computeAndRecordState } from "./relationalEngine";

// ─── Users / Profile ────────────────────────────────────────────────────────────────

export async function upsertUser(user: {
  openId: string;
  name?: string | null;
  email?: string | null;
  loginMethod?: string | null;
}) {
  const { data: existing } = await supabase.from("profiles").select("id").eq("auth_id", user.openId).maybeSingle();
  if (existing) {
    await supabase.from("profiles").update({ display_name: user.name ?? undefined, email: user.email ?? undefined, updated_at: new Date().toISOString() }).eq("auth_id", user.openId);
    return;
  }
  await supabase.from("profiles").insert({ auth_id: user.openId, display_name: user.name, email: user.email, app_mode: "common", preferences: {}, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
}

export async function getUserByOpenId(openId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("auth_id", openId).maybeSingle();
  return data ?? undefined;
}

export async function getProfileByOpenId(openId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("auth_id", openId).maybeSingle();
  if (!data) return null;
  const { data: xp } = await supabase.from("user_xp").select("total_xp").eq("profile_id", data.id).maybeSingle();
  const { data: member } = await supabase.from("pair_members").select("pair_id").eq("profile_id", data.id).maybeSingle();
  return { ...data, totalXp: xp?.total_xp ?? 0, pairId: member?.pair_id ?? null };
}

export async function updateProfile(openId: string, updates: {
  displayName?: string; avatarStyle?: string; avatarColor?: string; avatarUrl?: string;
  avatarDescription?: string; couplePicUrl?: string; zodiacSign?: string;
  directness?: number; empathy?: number; wit?: number; warmth?: number;
  rankTheme?: string; bentlyEnabled?: boolean; reducedMotion?: boolean; appMode?: string;
}) {
  const prefs: Record<string, unknown> = {};
  if (updates.avatarStyle !== undefined) prefs.avatarStyle = updates.avatarStyle;
  if (updates.avatarColor !== undefined) prefs.avatarColor = updates.avatarColor;
  if (updates.directness !== undefined) prefs.directness = updates.directness;
  if (updates.empathy !== undefined) prefs.empathy = updates.empathy;
  if (updates.wit !== undefined) prefs.wit = updates.wit;
  if (updates.warmth !== undefined) prefs.warmth = updates.warmth;
  if (updates.rankTheme !== undefined) prefs.rankTheme = updates.rankTheme;
  if (updates.bentlyEnabled !== undefined) prefs.bentlyEnabled = updates.bentlyEnabled;
  if (updates.reducedMotion !== undefined) prefs.reducedMotion = updates.reducedMotion;

  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.displayName !== undefined) row.display_name = updates.displayName;
  if (updates.avatarUrl !== undefined) row.avatar_url = updates.avatarUrl;
  if (updates.avatarDescription !== undefined) row.avatar_description = updates.avatarDescription;
  if (updates.couplePicUrl !== undefined) row.couple_pic_url = updates.couplePicUrl;
  if (updates.zodiacSign !== undefined) row.zodiac_sign = updates.zodiacSign;
  if (updates.appMode !== undefined) row.app_mode = updates.appMode;
  if (Object.keys(prefs).length > 0) row.preferences = prefs;
  await supabase.from("profiles").update(row).eq("auth_id", openId);
}

// ─── Pairs ────────────────────────────────────────────────────────────────────────

export async function getPairByOpenId(openId: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) return null;
  const { data: member } = await supabase.from("pair_members").select("pair_id").eq("profile_id", profile.id).maybeSingle();
  if (!member) return null;
  const { data: pair } = await supabase.from("pairs").select("*").eq("id", member.pair_id).maybeSingle();
  return pair;
}

export async function getPairWithProfiles(pairId: string) {
  const { data: pair } = await supabase.from("pairs").select("*").eq("id", pairId).maybeSingle();
  const { data: members } = await supabase.from("pair_members").select("*, profiles(*)").eq("pair_id", pairId);
  const { data: ranking } = await supabase.from("pair_rankings").select("total_xp, level").eq("pair_id", pairId).maybeSingle();
  return { pair, members: members ?? [], xp: ranking };
}

export async function createPair(openId: string, inviteCode: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) throw new Error("Profile not found");
  const { data: existing } = await supabase.from("pairs").select("id").eq("pair_code", inviteCode).maybeSingle();
  if (existing) throw new Error("Invite code already in use");
  const { data: pair, error } = await supabase.from("pairs").insert({ pair_code: inviteCode, status: "waiting", relational_state: "NEUTRAL", created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  if (error || !pair) throw new Error("Failed to create pair");
  await supabase.from("pair_members").insert({ pair_id: pair.id, profile_id: profile.id, role: "creator", joined_at: new Date().toISOString() });
  await supabase.from("pair_rankings").insert({ pair_id: pair.id, total_xp: 0, level: 1, updated_at: new Date().toISOString() });
  return pair;
}

export async function joinPair(openId: string, inviteCode: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) throw new Error("Profile not found");
  const { data: pair } = await supabase.from("pairs").select("id, status").eq("pair_code", inviteCode.toUpperCase()).maybeSingle();
  if (!pair) throw new Error("Invalid invite code");
  const { data: members } = await supabase.from("pair_members").select("id, profile_id").eq("pair_id", pair.id);
  if (members && members.length >= 2) throw new Error("Pair is already full");
  if (members?.some((m) => m.profile_id === profile.id)) throw new Error("Already in this pair");
  await supabase.from("pair_members").insert({ pair_id: pair.id, profile_id: profile.id, role: "partner", joined_at: new Date().toISOString() });
  await supabase.from("pairs").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", pair.id);
  return pair;
}

// ─── Messages ────────────────────────────────────────────────────────────────────

export async function getMessages(pairId: string, isDeeplyUs: boolean) {
  const { data } = await supabase.from("messages").select("*, profiles(display_name, avatar_url)").eq("pair_id", pairId).eq("mode", isDeeplyUs ? "deeply" : "common").order("created_at", { ascending: false }).limit(50);
  return data ?? [];
}

export async function sendMessage(pairId: string, senderOpenId: string, content: string, isDeeplyUs: boolean) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", senderOpenId).maybeSingle();
  if (!profile) throw new Error("Profile not found");
  await supabase.from("messages").insert({ pair_id: pairId, sender_id: profile.id, content, mode: isDeeplyUs ? "deeply" : "common", created_at: new Date().toISOString() });
}

export async function getIntimateMessages(pairId: string) {
  const { data } = await supabase.from("intimate_messages").select("*, profiles(display_name, avatar_url)").eq("pair_id", pairId).order("created_at", { ascending: false }).limit(50);
  return data ?? [];
}

export async function sendIntimateMessage(pairId: string, senderOpenId: string, content: string, escalationLevel: number, bentlyResponse?: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", senderOpenId).maybeSingle();
  if (!profile) throw new Error("Profile not found");
  await supabase.from("intimate_messages").insert({ pair_id: pairId, sender_id: profile.id, content, escalation_level: escalationLevel, bently_response: bentlyResponse ?? null, created_at: new Date().toISOString() });
}

// ─── Missions ───────────────────────────────────────────────────────────────────────

export async function getMissions(pairId: string) {
  const { data: missionRows } = await supabase.from("missions").select("*").order("created_at", { ascending: true }).limit(20);
  if (!missionRows || missionRows.length === 0) return [];
  const { data: progress } = await supabase.from("mission_progress").select("*").eq("pair_id", pairId);
  return missionRows.map((m) => {
    const p = progress?.find((pr) => pr.mission_id === m.id);
    return { ...m, status: p?.status ?? "not_started", startedAt: p?.started_at ?? null, completedAt: p?.completed_at ?? null };
  });
}

export async function updateMissionStatus(pairId: string, missionId: string, status: "not_started" | "in_progress" | "completed", openId: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  const { data: existing } = await supabase.from("mission_progress").select("id").eq("pair_id", pairId).eq("mission_id", missionId).maybeSingle();
  const now = new Date().toISOString();
  if (existing) {
    await supabase.from("mission_progress").update({ status, completed_at: status === "completed" ? now : null }).eq("id", existing.id);
  } else {
    await supabase.from("mission_progress").insert({ pair_id: pairId, mission_id: missionId, status, started_at: now, completed_at: status === "completed" ? now : null });
  }
  if (status === "completed" && profile) {
    const { data: mission } = await supabase.from("missions").select("xp_reward").eq("id", missionId).maybeSingle();
    if (mission?.xp_reward) await awardXP(profile.id, mission.xp_reward);
  }
}

// ─── Sparks ────────────────────────────────────────────────────────────────────────

export async function getSparks() {
  const { data } = await supabase.from("sparks").select("*").order("created_at", { ascending: true });
  return data ?? [];
}

export async function recordSparkSession(pairId: string, openId: string, gameId: string, score: number, xpAwarded: number) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) return;
  await supabase.from("spark_sessions").insert({ pair_id: pairId, profile_id: profile.id, game_id: gameId, score, xp_awarded: xpAwarded, played_at: new Date().toISOString() });
  await awardXP(profile.id, xpAwarded);
}

// ─── Vault ───────────────────────────────────────────────────────────────────────

export async function getVaultMemories(pairId: string) {
  const { data } = await supabase.from("vault_memories").select("*").eq("pair_id", pairId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function addVaultMemory(pairId: string, title: string, content: string, category: string) {
  await supabase.from("vault_memories").insert({ pair_id: pairId, title, content, category, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
}

// ─── Journal ───────────────────────────────────────────────────────────────────────

export async function getJournalEntries(pairId: string, openId: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) return [];
  const { data } = await supabase.from("journal_entries").select("*").eq("pair_id", pairId).eq("profile_id", profile.id).order("created_at", { ascending: false });
  return data ?? [];
}

export async function addJournalEntry(pairId: string, openId: string, content: string, mood: string, aiAnalysis?: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) throw new Error("Profile not found");
  await supabase.from("journal_entries").insert({ pair_id: pairId, profile_id: profile.id, content, mood, ai_analysis: aiAnalysis ?? null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
  await awardXP(profile.id, 15);
}

// ─── Shared Lists ────────────────────────────────────────────────────────────────────

export async function getSharedLists(pairId: string) {
  const { data } = await supabase.from("shared_lists").select("*, list_items(*)").eq("pair_id", pairId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function createSharedList(pairId: string, title: string, listType: string) {
  const { data, error } = await supabase.from("shared_lists").insert({ pair_id: pairId, title, list_type: listType, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }).select().single();
  if (error) throw new Error("Failed to create list");
  return data;
}

export async function addListItem(listId: string, openId: string, content: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  await supabase.from("list_items").insert({ list_id: listId, content, completed: false, created_by: profile?.id ?? null, created_at: new Date().toISOString() });
}

export async function toggleListItem(itemId: string, completed: boolean) {
  await supabase.from("list_items").update({ completed }).eq("id", itemId);
}

// ─── Daily Questions ───────────────────────────────────────────────────────────────────

export function getTodayQuestion() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];
}

export async function getDailyAnswers(pairId: string, dateKey: string) {
  const { data } = await supabase.from("daily_answers").select("*, profiles(display_name, avatar_url)").eq("pair_id", pairId).eq("date_key", dateKey);
  return data ?? [];
}

export async function submitDailyAnswer(pairId: string, openId: string, answerText: string, dateKey: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) throw new Error("Profile not found");
  const { data: existing } = await supabase.from("daily_answers").select("id").eq("pair_id", pairId).eq("profile_id", profile.id).eq("date_key", dateKey).maybeSingle();
  if (existing) {
    await supabase.from("daily_answers").update({ answer_text: answerText }).eq("id", existing.id);
  } else {
    await supabase.from("daily_answers").insert({ pair_id: pairId, profile_id: profile.id, answer_text: answerText, date_key: dateKey, created_at: new Date().toISOString() });
    await awardXP(profile.id, 10);
  }
}

// ─── Astrology ───────────────────────────────────────────────────────────────────────

export async function getLatestAstrologyReading(pairId: string, mode: string) {
  const { data } = await supabase.from("astrology_readings").select("*").eq("pair_id", pairId).eq("mode", mode).order("generated_at", { ascending: false }).limit(1).maybeSingle();
  return data;
}

export async function saveAstrologyReading(pairId: string, sign1: string, sign2: string, readingText: string, mode: string) {
  await supabase.from("astrology_readings").insert({ pair_id: pairId, zodiac_sign_1: sign1, zodiac_sign_2: sign2, reading_text: readingText, mode, generated_at: new Date().toISOString() });
}

// ─── Rankings ──────────────────────────────────────────────────────────────────────

export async function getLeaderboard() {
  const { data } = await supabase.from("pair_rankings").select("*, pairs(pair_code), pair_members(profiles(display_name, avatar_url))").order("total_xp", { ascending: false }).limit(20);
  return data ?? [];
}

export async function getPairRanking(pairId: string) {
  const { data } = await supabase.from("pair_rankings").select("*").eq("pair_id", pairId).maybeSingle();
  return data;
}

// ─── Relational Engine (delegated) ─────────────────────────────────────────────────────────────

export { getRelationalState, computeAndRecordState as recordRelationalState } from "./relationalEngine";

// ─── XP / Achievements ──────────────────────────────────────────────────────────────────────

export async function getUserXP(openId: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) return 0;
  const { data } = await supabase.from("user_xp").select("total_xp").eq("profile_id", profile.id).maybeSingle();
  return data?.total_xp ?? 0;
}

export async function getUserAchievements(openId: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  if (!profile) return [];
  const { data } = await supabase.from("user_achievements").select("*").eq("profile_id", profile.id).order("earned_at", { ascending: false });
  return data ?? [];
}

export async function seedGlobalMissions() {
  const { data: existing } = await supabase.from("missions").select("id").limit(1);
  if (existing && existing.length > 0) return;
  await supabase.from("missions").insert([
    { title: "Love Language Discovery", description: "Complete the Love Language quiz together and discuss your results.", category: "Connection", duration_days: 1, xp_reward: 50, created_at: new Date().toISOString() },
    { title: "Digital Detox Date", description: "Spend 2 hours together with phones off. No screens, just presence.", category: "Quality Time", duration_days: 1, xp_reward: 40, created_at: new Date().toISOString() },
    { title: "Memory Lane", description: "Share 3 favorite memories from your relationship. Add them to the Vault.", category: "Reflection", duration_days: 2, xp_reward: 60, created_at: new Date().toISOString() },
    { title: "Conflict Resolution Practice", description: "Use the Gentle Startup technique during your next disagreement.", category: "Communication", duration_days: 3, xp_reward: 80, created_at: new Date().toISOString() },
    { title: "Future Visioning", description: "Each write 5 goals for your relationship in the next year. Share and align.", category: "Growth", duration_days: 2, xp_reward: 70, created_at: new Date().toISOString() },
    { title: "Appreciation Ritual", description: "Every morning for 7 days, tell your partner one specific thing you appreciate.", category: "Appreciation", duration_days: 7, xp_reward: 100, created_at: new Date().toISOString() },
    { title: "Bently Deep Dive", description: "Have Bently analyze your communication patterns and implement one suggestion.", category: "AI Coaching", duration_days: 3, xp_reward: 75, created_at: new Date().toISOString() },
    { title: "Intimacy Inventory", description: "Complete the intimacy check-in together using the DeeplyUs mood mixer.", category: "Intimacy", duration_days: 1, xp_reward: 50, created_at: new Date().toISOString() },
  ]);
}

export async function saveBentlyIntervention(pairId: string, openId: string, interventionType: string, overlayType: string, interventionText: string) {
  const { data: profile } = await supabase.from("profiles").select("id").eq("auth_id", openId).maybeSingle();
  await supabase.from("bently_interventions").insert({ pair_id: pairId, profile_id: profile?.id ?? null, intervention_type: interventionType, overlay_type: overlayType, intervention_text: interventionText, created_at: new Date().toISOString() });
}
