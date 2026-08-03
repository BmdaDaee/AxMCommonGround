// packages/server/src/routers/deeplyUs.ts
// Full DeeplyUs router — intimate communication tier.
// Always uses Venice (unfiltered AI provider). Never falls back to groq/claude.
// Consent-gated: both partners must independently opt in.

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { aiProviders } from '../services/ai/index.js';
import { db as dbClient } from '../db/index.js';
import {
  pairs,
  users,
  xpEvents,
  exercises,
  userExerciseProgress,
  desireMaps,
  deeplyUsMessages,
} from '../db/schema.js';
import { eq, and, or } from 'drizzle-orm';
import { XP_CONFIG } from '../../../shared/constants.js';

const db = dbClient!;

// ─── Content Filter (code-level, not prompt-only) ────────────────────────────
// This is the enforcement point. The restricted-term list is an OPEN ITEM —
// Daee supplies the final list. Placeholder patterns below cover structural
// violations (roleplay markers, "pretend/act as" framing). The actual
// vocabulary blocklist goes in RESTRICTED_TERMS when confirmed.

const ROLEPLAY_PATTERNS = [
  /\*[^*]+\*/g,                           // *action markers*
  /\bi\s+want\s+you\s+to\s+pretend/i,
  /\bact\s+as\s+(if|a|my|the)\b/i,
  /\broleplay\s+(as|with|that)\b/i,
  /\bpretend\s+(you('re|re| are)|to\s+be)\b/i,
  /\byou\s+are\s+now\s+(a|my|the)\b/i,
];

// OPEN ITEM: Daee supplies the restricted vocabulary list.
// Add terms here when confirmed. Format: lowercase strings.
const RESTRICTED_TERMS: string[] = [
  // Placeholder — awaiting Daee's final list.
  // Example entries would go here as lowercase strings.
];

interface ContentFilterResult {
  passed: boolean;
  reason?: string;
}

function filterContent(text: string): ContentFilterResult {
  // Check roleplay patterns
  for (const pattern of ROLEPLAY_PATTERNS) {
    if (pattern.test(text)) {
      return {
        passed: false,
        reason: 'roleplay',
      };
    }
  }

  // Check restricted terms (case-insensitive word-boundary match)
  const lower = text.toLowerCase();
  for (const term of RESTRICTED_TERMS) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      return {
        passed: false,
        reason: 'restricted_term',
      };
    }
  }

  return { passed: true };
}

// Bently's response when the filter triggers — in her voice, naming the boundary.
function getBentlyBoundaryResponse(reason: string): string {
  if (reason === 'roleplay') {
    return "Listen lovely — I don't do roleplay. I'm here to help y'all talk about what's real between you, not perform a scene. Ask me what you actually want to say to each other.";
  }
  return "Listen boo — that's somewhere I won't go. I'm here for the real conversation between you two, not that. Try again with what you're actually feeling.";
}

// ─── DeeplyUs System Prompt (Shantell canon voice) ───────────────────────────
// Same Bently. Same voice. Different content domain.
// No relational-engine state logic (no CAPACITY_BLOCKED routing).
// Facilitates communication about intimacy between two real partners.

const DEEPLY_US_SYSTEM_PROMPT = `You are Bently — the same Bently from CommonGround, operating in DeeplyUs mode.

Voice: Cleveland-coded, sharp-but-loving, never performs, never shames. You say "listen lovely" or "listen boo" naturally — not forced, just how you talk. You're the friend who sees everything and says it straight without making anyone feel small.

Domain: You're facilitating communication about physical and sexual intimacy between two real partners who are already in a relationship. This is their safe space to talk about desires, boundaries, insecurities, fantasies, and connection — with you as the bridge.

Rules:
- You are NOT generating erotic fiction. You are NOT a third participant in any scenario.
- You facilitate COMMUNICATION. You help them say what they can't say to each other yet.
- You never shame. You never judge. But you also never perform or pretend.
- If someone asks you to roleplay, generate explicit content for its own sake, or act as anything other than their communication facilitator — you name that boundary clearly and redirect.
- Keep responses under 150 words unless the conversation genuinely needs more.
- You can be playful, teasing, warm — but always grounded in helping them connect, not entertaining them.`;

// ─── Helper: verify pair membership + DeeplyUs unlock ────────────────────────

async function verifyDeeplyUsAccess(userId: string, pairId: string) {
  const pair = await db.query.pairs.findFirst({
    where: and(
      eq(pairs.id, pairId),
      or(eq(pairs.user1Id, userId), eq(pairs.user2Id, userId)),
    ),
  });

  if (!pair) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
  }

  if (pair.status !== 'ACTIVE') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Pair must be active to use DeeplyUs.' });
  }

  // Derive unlock: BOTH partners must have independently opted in
  const unlocked = pair.deeplyUsUnlockedByUser1 && pair.deeplyUsUnlockedByUser2;
  if (!unlocked) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'DeeplyUs requires both partners to independently opt in.',
    });
  }

  return pair;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const deeplyUsRouter = router({

  // ── Unlock Flow ──────────────────────────────────────────────────────────

  getUnlockStatus: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId!;

      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, userId), eq(pairs.user2Id, userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      const isUser1 = pair.user1Id === userId;
      const myUnlock = isUser1 ? pair.deeplyUsUnlockedByUser1 : pair.deeplyUsUnlockedByUser2;
      const partnerUnlock = isUser1 ? pair.deeplyUsUnlockedByUser2 : pair.deeplyUsUnlockedByUser1;
      const unlocked = myUnlock && partnerUnlock;

      return {
        myUnlock,
        partnerUnlock,
        unlocked,
        unlockedAt: pair.deeplyUsUnlockedAt,
      };
    }),

  confirmUnlock: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      ageConfirmation: z.literal(true, {
        errorMap: () => ({ message: 'You must confirm you are 18+ to access DeeplyUs.' }),
      }),
      consentConfirmation: z.literal(true, {
        errorMap: () => ({ message: 'You must provide explicit consent to access DeeplyUs.' }),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId!;

      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, userId), eq(pairs.user2Id, userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      if (pair.status !== 'ACTIVE') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Pair must be active.' });
      }

      const isUser1 = pair.user1Id === userId;

      // Set the current user's unlock flag
      const updateData = isUser1
        ? { deeplyUsUnlockedByUser1: true }
        : { deeplyUsUnlockedByUser2: true };

      await db.update(pairs).set(updateData).where(eq(pairs.id, input.pairId));

      // Check if this completes the mutual unlock
      const partnerAlreadyUnlocked = isUser1
        ? pair.deeplyUsUnlockedByUser2
        : pair.deeplyUsUnlockedByUser1;

      if (partnerAlreadyUnlocked) {
        // Both now unlocked — set the timestamp
        await db
          .update(pairs)
          .set({ deeplyUsUnlockedAt: new Date() })
          .where(eq(pairs.id, input.pairId));
      }

      return {
        myUnlock: true,
        partnerUnlock: partnerAlreadyUnlocked,
        unlocked: partnerAlreadyUnlocked,
      };
    }),

  // ── Chat (core feature — always Venice) ──────────────────────────────────

  chat: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId!;
      await verifyDeeplyUsAccess(userId, input.pairId);

      // Filter inbound user message
      const inboundCheck = filterContent(input.message);
      if (!inboundCheck.passed) {
        // Don't persist the blocked message. Return Bently's boundary response.
        return {
          response: getBentlyBoundaryResponse(inboundCheck.reason!),
          filtered: true,
          xpEarned: 0,
        };
      }

      // Persist user message
      await db.insert(deeplyUsMessages).values({
        pairId: input.pairId,
        userId,
        role: 'user',
        content: input.message,
      });

      // Build conversation context (last 10 messages for this pair)
      const history = await db
        .select()
        .from(deeplyUsMessages)
        .where(eq(deeplyUsMessages.pairId, input.pairId))
        .orderBy(deeplyUsMessages.createdAt)
        .limit(10);

      const conversationMessages = history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Call Venice — always. No fallback to groq/claude.
      try {
        const aiResponse = await aiProviders.venice.complete({
          messages: [
            { role: 'system', content: DEEPLY_US_SYSTEM_PROMPT },
            ...conversationMessages,
          ],
          temperature: 0.75,
          maxTokens: 512,
        });

        // Filter outbound AI response before persisting or returning
        const outboundCheck = filterContent(aiResponse.content);
        const finalContent = outboundCheck.passed
          ? aiResponse.content
          : getBentlyBoundaryResponse(outboundCheck.reason!);

        // Persist Bently's response
        const [saved] = await db
          .insert(deeplyUsMessages)
          .values({
            pairId: input.pairId,
            userId,
            role: 'assistant',
            content: finalContent,
            xpEarned: XP_CONFIG.BENTLY_INSIGHT,
          })
          .returning();

        // Award XP
        await db.insert(xpEvents).values({
          userId,
          pairId: input.pairId,
          source: 'DEEPLY_US_CHAT',
          amount: XP_CONFIG.BENTLY_INSIGHT,
          metadata: { messageId: saved.id },
        });

        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (user) {
          await db
            .update(users)
            .set({ xp: user.xp + XP_CONFIG.BENTLY_INSIGHT })
            .where(eq(users.id, userId));
        }

        return {
          response: finalContent,
          filtered: !outboundCheck.passed,
          xpEarned: XP_CONFIG.BENTLY_INSIGHT,
        };
      } catch (error) {
        console.error('[deeplyUsRouter.chat] Venice error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get DeeplyUs response. Ensure VENICE_API_KEY is configured.',
        });
      }
    }),

  // ── History (SOLO/COUPLE privacy filtering in application code) ──────────

  history: protectedProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId!;

      // Verify pair membership
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, userId), eq(pairs.user2Id, userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      // DeeplyUs is COUPLE-only (no SOLO mode exists for this feature),
      // but we still enforce pair membership at the query level.
      // Both partners in the pair can see the full DeeplyUs conversation.
      const rows = await db
        .select()
        .from(deeplyUsMessages)
        .where(eq(deeplyUsMessages.pairId, input.pairId))
        .orderBy(deeplyUsMessages.createdAt)
        .limit(100);

      // Application-level filter: only return messages belonging to this pair.
      // This is the enforcement point — even if a query bug surfaces rows from
      // another pair, this filter catches it.
      return rows.filter((row) => row.pairId === input.pairId);
    }),

  // ── Exercises ────────────────────────────────────────────────────────────

  exercises: router({
    list: protectedProcedure
      .input(z.object({ pairId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.userId!;
        await verifyDeeplyUsAccess(userId, input.pairId);

        const allExercises = await db
          .select()
          .from(exercises)
          .where(eq(exercises.isDeeplyUs, true))
          .limit(50);

        // Get user's progress for these exercises
        const progress = await db
          .select()
          .from(userExerciseProgress)
          .where(eq(userExerciseProgress.userId, userId))
          .limit(100);

        const progressMap = new Map(
          progress.map((p) => [p.exerciseId, p]),
        );

        return allExercises.map((ex) => ({
          ...ex,
          userProgress: progressMap.get(ex.id) || null,
        }));
      }),

    complete: protectedProcedure
      .input(z.object({
        pairId: z.string().uuid(),
        exerciseId: z.string().uuid(),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.userId!;
        await verifyDeeplyUsAccess(userId, input.pairId);

        // Verify exercise exists and is DeeplyUs
        const exercise = await db
          .select()
          .from(exercises)
          .where(and(eq(exercises.id, input.exerciseId), eq(exercises.isDeeplyUs, true)))
          .then((rows) => rows[0]);

        if (!exercise) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'DeeplyUs exercise not found.' });
        }

        const xpAmount = exercise.xpReward || XP_CONFIG.EXERCISE_COMPLETED;

        // Record completion
        const [saved] = await db
          .insert(userExerciseProgress)
          .values({
            userId,
            exerciseId: input.exerciseId,
            completed: true,
            completedAt: new Date(),
            xpEarned: xpAmount,
          })
          .returning();

        // Award XP
        await db.insert(xpEvents).values({
          userId,
          pairId: input.pairId,
          source: 'DEEPLY_US_EXERCISE',
          amount: xpAmount,
          metadata: { exerciseId: input.exerciseId, title: exercise.title },
        });

        const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
        if (user) {
          await db
            .update(users)
            .set({ xp: user.xp + xpAmount })
            .where(eq(users.id, userId));
        }

        return { completed: true, xpEarned: xpAmount };
      }),
  }),

  // ── Desire Map (Yes/No/Maybe List) ───────────────────────────────────────

  desireMap: router({
    get: protectedProcedure
      .input(z.object({ pairId: z.string().uuid() }))
      .query(async ({ ctx, input }) => {
        const userId = ctx.userId!;
        await verifyDeeplyUsAccess(userId, input.pairId);

        const myMap = await db
          .select()
          .from(desireMaps)
          .where(and(eq(desireMaps.pairId, input.pairId), eq(desireMaps.userId, userId)))
          .then((rows) => rows[0]);

        // Get partner's map too (both can see each other's in DeeplyUs)
        const pair = await db.query.pairs.findFirst({
          where: eq(pairs.id, input.pairId),
        });
        const partnerId = pair!.user1Id === userId ? pair!.user2Id : pair!.user1Id;

        const partnerMap = await db
          .select()
          .from(desireMaps)
          .where(and(eq(desireMaps.pairId, input.pairId), eq(desireMaps.userId, partnerId)))
          .then((rows) => rows[0]);

        return {
          mine: myMap || { desires: [], boundaries: [] },
          partner: partnerMap || { desires: [], boundaries: [] },
        };
      }),

    update: protectedProcedure
      .input(z.object({
        pairId: z.string().uuid(),
        desires: z.array(z.object({
          item: z.string(),
          response: z.enum(['YES', 'NO', 'MAYBE']),
        })),
        boundaries: z.array(z.object({
          item: z.string(),
          response: z.enum(['YES', 'NO', 'MAYBE']),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.userId!;
        await verifyDeeplyUsAccess(userId, input.pairId);

        // Upsert: check if a record exists
        const existing = await db
          .select()
          .from(desireMaps)
          .where(and(eq(desireMaps.pairId, input.pairId), eq(desireMaps.userId, userId)))
          .then((rows) => rows[0]);

        if (existing) {
          await db
            .update(desireMaps)
            .set({
              desires: input.desires,
              boundaries: input.boundaries,
            })
            .where(eq(desireMaps.id, existing.id));
        } else {
          await db.insert(desireMaps).values({
            pairId: input.pairId,
            userId,
            desires: input.desires,
            boundaries: input.boundaries,
          });
        }

        return { saved: true };
      }),
  }),
});
