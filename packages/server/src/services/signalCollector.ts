// packages/server/src/services/signalCollector.ts
//
// Computes the four relational dimension scores (availability, alignment,
// activation, trust) from real behavioral data in the database.
// Called on every message send. Feeds evaluateRelationalState() with real inputs
// instead of the default 50s.
//
// ─── DIMENSION DEFINITIONS ───────────────────────────────────────────────────
//
//  AVAILABILITY  — Are both people showing up?
//                  Primary signal: message frequency + recency from both sides.
//                  Low = one or both have gone quiet.
//
//  ALIGNMENT     — Are they engaging each other, not just broadcasting?
//                  Primary signal: response rate (does a message get a reply?)
//                  and session symmetry (are both initiating roughly equally?).
//
//  ACTIVATION    — Is there energy and intentionality in the relationship?
//                  Primary signal: XP velocity (exercise completions, journal
//                  entries, Bently interactions, mission completions) in the
//                  last 7 days.
//
//  TRUST         — Structural integrity over time. Slow-moving signal.
//                  Primary signal: consistency (did engagement hold across
//                  the last 3 rolling periods?) + journal mood trend
//                  + absence of sustained silence from either side.
//
// ─────────────────────────────────────────────────────────────────────────────

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { messages, xpEvents, journalEntries, pairs } from '../db/schema.js';
import { evaluateRelationalState } from '../engine/relationalEngine.js';
import type { Database } from '../db/client.js';
import type { RelationalSignals } from '../engine/relationalEngine.js';

// How many days of history we look at for each signal
const WINDOW_DAYS = {
  AVAILABILITY: 7,
  ALIGNMENT: 7,
  ACTIVATION: 7,
  TRUST_NEAR: 7,    // recent period
  TRUST_MID: 14,   // mid period (for consistency comparison)
  TRUST_FAR: 21,   // far period (for consistency comparison)
} as const;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ─── Individual signal computers ─────────────────────────────────────────────

async function computeAvailability(
  db: Database,
  pairId: string,
  user1Id: string,
  user2Id: string,
): Promise<number> {
  const since = daysAgo(WINDOW_DAYS.AVAILABILITY);

  const rows = await db
    .select({ userId: messages.userId, count: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.pairId, pairId), gte(messages.createdAt, since)))
    .groupBy(messages.userId);

  const countMap = Object.fromEntries(rows.map((r) => [r.userId, r.count]));
  const c1 = countMap[user1Id] ?? 0;
  const c2 = countMap[user2Id] ?? 0;

  if (c1 === 0 && c2 === 0) return 10; // Both silent

  // Score based on volume + symmetry
  const total = c1 + c2;
  const volumeScore = Math.min(100, (total / 14) * 100); // 14 msgs/week = 100
  const symmetry = total > 0 ? 1 - Math.abs(c1 - c2) / total : 0;
  const symmetryBonus = symmetry * 20; // up to 20pt bonus for balanced participation

  return clamp(volumeScore * 0.8 + symmetryBonus);
}

async function computeAlignment(
  db: Database,
  pairId: string,
  user1Id: string,
  user2Id: string,
): Promise<number> {
  const since = daysAgo(WINDOW_DAYS.ALIGNMENT);

  // Get last 40 messages ordered by time
  const recentMessages = await db
    .select({ id: messages.id, userId: messages.userId, createdAt: messages.createdAt })
    .from(messages)
    .where(and(eq(messages.pairId, pairId), gte(messages.createdAt, since)))
    .orderBy(messages.createdAt)
    .limit(40);

  if (recentMessages.length < 2) return 50; // Not enough data, neutral

  // Count how many messages got a response from the other person
  let responseCount = 0;
  let opportunities = 0;

  for (let i = 0; i < recentMessages.length - 1; i++) {
    const current = recentMessages[i];
    const next = recentMessages[i + 1];
    if (current.userId !== next.userId) {
      responseCount++;
    }
    opportunities++;
  }

  const responseRate = opportunities > 0 ? responseCount / opportunities : 0;

  // Also check initiation balance
  const u1Starts = recentMessages.filter((m, i) =>
    m.userId === user1Id && (i === 0 || recentMessages[i - 1].userId !== user1Id)
  ).length;
  const u2Starts = recentMessages.filter((m, i) =>
    m.userId === user2Id && (i === 0 || recentMessages[i - 1].userId !== user2Id)
  ).length;
  const totalStarts = u1Starts + u2Starts;
  const initiationBalance = totalStarts > 0
    ? 1 - Math.abs(u1Starts - u2Starts) / totalStarts
    : 0.5;

  return clamp((responseRate * 70) + (initiationBalance * 30));
}

async function computeActivation(
  db: Database,
  pairId: string,
  user1Id: string,
  user2Id: string,
): Promise<number> {
  const since = daysAgo(WINDOW_DAYS.ACTIVATION);

  // XP events from intentional actions (excludes passive MESSAGE_SENT)
  const intentionalSources = [
    'BENTLY_INSIGHT',
    'EXERCISE_COMPLETED',
    'MISSION_COMPLETED',
    'JOURNAL_ENTRY',
    'REWRITE_APPLIED',
  ];

  const rows = await db
    .select({ source: xpEvents.source, count: sql<number>`count(*)::int` })
    .from(xpEvents)
    .where(
      and(
        eq(xpEvents.pairId, pairId),
        gte(xpEvents.createdAt, since),
        sql`${xpEvents.source} = ANY(${intentionalSources})`,
      ),
    )
    .groupBy(xpEvents.source);

  const totalIntentionalEvents = rows.reduce((sum, r) => sum + r.count, 0);

  // Also count journal entries from both users
  const journalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(journalEntries)
    .where(
      and(
        eq(journalEntries.pairId, pairId),
        gte(journalEntries.createdAt, since),
      ),
    );
  const journalCount = journalRows[0]?.count ?? 0;

  // 10 intentional events per week across the pair = fully activated
  const eventScore = Math.min(100, ((totalIntentionalEvents + journalCount) / 10) * 100);

  return clamp(eventScore);
}

async function computeTrust(
  db: Database,
  pairId: string,
  user1Id: string,
  user2Id: string,
): Promise<number> {
  // Trust = consistency over time. Compare message counts across 3 rolling windows.
  const nearSince = daysAgo(WINDOW_DAYS.TRUST_NEAR);
  const midSince = daysAgo(WINDOW_DAYS.TRUST_MID);
  const farSince = daysAgo(WINDOW_DAYS.TRUST_FAR);

  async function countInWindow(from: Date, to: Date): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.pairId, pairId),
          gte(messages.createdAt, from),
          sql`${messages.createdAt} < ${to}`,
        ),
      );
    return rows[0]?.count ?? 0;
  }

  const [nearCount, midCount, farCount] = await Promise.all([
    countInWindow(nearSince, new Date()),
    countInWindow(midSince, nearSince),
    countInWindow(farSince, midSince),
  ]);

  // If all three windows are zero, trust score tanks — prolonged silence
  if (nearCount === 0 && midCount === 0 && farCount === 0) return 20;

  // Consistency: how stable is engagement across windows?
  const counts = [nearCount, midCount, farCount].filter((c) => c > 0);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const variance = counts.reduce((sum, c) => sum + Math.abs(c - avg), 0) / counts.length;
  const consistencyScore = Math.max(0, 100 - (variance / Math.max(avg, 1)) * 50);

  // Also factor in whether both users have journal mood data (signals self-disclosure)
  const journalRows = await db
    .select({ userId: journalEntries.userId, mood: journalEntries.mood })
    .from(journalEntries)
    .where(and(eq(journalEntries.pairId, pairId), gte(journalEntries.createdAt, nearSince)))
    .orderBy(desc(journalEntries.createdAt))
    .limit(10);

  const bothJournaling =
    journalRows.some((j) => j.userId === user1Id) &&
    journalRows.some((j) => j.userId === user2Id);

  const journalBonus = bothJournaling ? 10 : 0;

  return clamp(consistencyScore + journalBonus);
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function collectSignalsAndDeriveState(
  db: Database,
  pairId: string,
): Promise<{
  signals: RelationalSignals;
  evaluation: ReturnType<typeof evaluateRelationalState>;
}> {
  // Get pair membership
  const pair = await db.query.pairs.findFirst({ where: eq(pairs.id, pairId) });
  if (!pair) throw new Error(`Pair ${pairId} not found`);

  const { user1Id, user2Id } = pair;

  // Compute all four signals in parallel
  const [availability, alignment, activation, trust] = await Promise.all([
    computeAvailability(db, pairId, user1Id, user2Id),
    computeAlignment(db, pairId, user1Id, user2Id),
    computeActivation(db, pairId, user1Id, user2Id),
    computeTrust(db, pairId, user1Id, user2Id),
  ]);

  const signals: RelationalSignals = { availability, alignment, activation, trust };
  const evaluation = evaluateRelationalState(signals);

  // Write back to pair
  await db
    .update(pairs)
    .set({
      relationalState: evaluation.state,
      relationalMetrics: evaluation.dimensions,
    })
    .where(eq(pairs.id, pairId));

  return { signals, evaluation };
}
