// packages/server/src/routers/bently.ts
// Defaults to Groq (free). Falls back to Claude on error if user specifies.

import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server'
import { aiProviders } from '../services/ai/index.js';
import { pairs, bentlyResponses, xpEvents, users } from '../db/schema.js';
import { eq, or, and } from 'drizzle-orm';
import { XP_CONFIG } from '../../../shared/constants.js';
import type { RelationalState } from '../../../shared/enums.js';

// System prompt builder
function buildBentlySystemPrompt(
  state: RelationalState,
  requestingUserId: string,
  partnerId: string,
  currentUserId: string,
): string {
  const perspective = requestingUserId === currentUserId ? 'self' : 'partner';

  const basePrompt = `You are Bently — a relational communication mediator, not a therapist and not a cheerleader.
Your job is to surface what's actually happening between two people and give them something real to work with.
You speak directly. You don't over-soften. You don't catastrophize.
You hold two truths at once when necessary: the stabilizing one and the destabilizing one.
You never take sides. You never assign blame. You name patterns, not people.
Keep responses under 200 words unless the situation requires more.
Do not use bullet points. Speak in paragraphs.`;

  const stateDirectives: Record<RelationalState, string> = {
    ALIGNED: `
STATE: ALIGNED
The pair is functioning well. Don't manufacture tension or insert warnings that don't belong here.
Respond from a single current — reinforce what's working, name it specifically, and offer one forward-facing intention.
Do not introduce a destabilizing perspective unless the user's message contains a clear sign of drift.`,

    DORMANT: `
STATE: DORMANT
The relationship is safe but low-energy. The risk here is comfortable numbness, not active conflict.
Use the dual current: one voice that validates the comfort and stability, one that names the drift without alarm.
Don't panic them. Help them feel the difference between rest and stagnation.`,

    MISALIGNED: `
STATE: MISALIGNED
Both partners have capacity but their expectations or meanings are diverging.
Use the dual current: one voice that names what each person might be trying to protect, one that shows where those protections are creating distance.
Do not assign fault. Separate positions from needs.`,

    CAPACITY_BLOCKED: `
STATE: CAPACITY_BLOCKED
One or both partners are operating near their limit. Deeper relational work is not available right now.
Stabilizing current leads. Acknowledge the strain directly.
The destabilizing current is a question, not a statement — gently name what's being deferred, not avoided.
Do not push for resolution. Help them negotiate what's actually possible right now.`,

    TRUST_FRACTURED: `
STATE: TRUST_FRACTURED
Trust is below the safety threshold. This is the most sensitive state.
Lead entirely with the stabilizing current. Do not offer a destabilizing perspective — this is not the moment.
Name the rupture carefully. Validate that repair requires observable action, not just reassurance.
Suggest one concrete, small, keepable commitment. Nothing grand.`,
  };

  return `${basePrompt}\n${stateDirectives[state] ?? stateDirectives.DORMANT}`;

}

// Router
export const bentlyRouter = router({

  // Main coach endpoint
  coach: publicProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      message: z.string().min(1).max(2000),
      provider: z.enum(['groq', 'claude', 'venice']).default('groq'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      // Verify pair membership and get current state
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
          eq(pairs.status, 'ACTIVE'),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Active pair not found.' });
      }

      const partnerId = pair.user1Id === ctx.userId ? pair.user2Id : pair.user1Id;
      const relationalState = pair.relationalState as RelationalState;

      // Build state-aware system prompt
      const systemPrompt = buildBentlySystemPrompt(
        relationalState,
        ctx.userId,
        partnerId,
        ctx.userId,
      );

      try {
        const aiResponse = await aiProviders[input.provider].complete({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.message },
          ],
          temperature: 0.75,
          maxTokens: 512,
        });

        // Persist Bently response
        const [saved] = await db
          .insert(bentlyResponses)
          .values({
            pairId: input.pairId,
            userId: ctx.userId,
            content: aiResponse.content,
            mode: 'COMMON',
            confidence: 80,
            suggestions: [],
            xpEarned: XP_CONFIG.BENTLY_INSIGHT,
          })
          .returning();

        // Award XP
        await db
          .insert(xpEvents)
          .values({
            userId: ctx.userId,
            pairId: input.pairId,
            source: 'BENTLY_INSIGHT',
            amount: XP_CONFIG.BENTLY_INSIGHT,
            metadata: { responseId: saved.id, state: relationalState, provider: input.provider },
          });

        const user = await db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
        if (user) {
          await db
            .update(users)
            .set({ xp: user.xp + XP_CONFIG.BENTLY_INSIGHT })
            .where(eq(users.id, ctx.userId));
        }

        return {
          response: aiResponse.content,
          state: relationalState,
          provider: input.provider,
          xpEarned: XP_CONFIG.BENTLY_INSIGHT,
        };
      } catch (error) {
        console.error('[bentlyRouter] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Bently response',
        });
      }
    }),

  // Stateless coach (no pair required)
  coachSolo: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      provider: z.enum(['groq', 'claude', 'venice']).default('groq'),
    }))
    .mutation(async ({ input, ctx }) => {
      const systemPrompt = `You are Bently — a relational communication mediator.
The person speaking to you does not yet have a partner on this platform.
Help them think through what they're experiencing as if you're a sharp, caring sounding board.
Speak directly. Don't over-soften. Keep it under 150 words.`;

      try {
        const aiResponse = await aiProviders[input.provider].complete({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input.message },
          ],
          temperature: 0.75,
          maxTokens: 400,
        });

        return {
          response: aiResponse.content,
          provider: input.provider,
        };
      } catch (error) {
        console.error('[bentlyRouter.coachSolo] Error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get Bently response',
        });
      }
    }),

  // Placeholder stubs
  list: publicProcedure.query(() => ({ resource: 'bently', items: [] as unknown[] })),
  getById: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(({ input }) => ({ resource: 'bently', id: input.id, item: null as unknown })),
});
