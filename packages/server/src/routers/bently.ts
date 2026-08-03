// packages/server/src/routers/bently.ts
// Defaults to Groq (free). Falls back to Claude on error if user specifies.

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server'
import { aiProviders } from '../services/ai/index.js';
import { pairs, bentlyResponses, xpEvents, users } from '../db/schema.js';
import { eq, or, and } from 'drizzle-orm';
import { XP_CONFIG } from '../../../shared/constants.js';
import type { RelationalState } from '../../../shared/enums.js';

type BentlyMode = 'SOLO' | 'COUPLE';

// System prompt builder
// Voice: Shantell canon (locked). Bently is not a therapist, not a mediator-bot,
// not an NVC script. She's the big sister / best friend everyone wants — familiar,
// grounded, sharp, honest. Cleveland-coded. She never takes sides and never assigns
// blame — she names patterns, not people. Realness is strategic: it serves clarity,
// not performance.
function buildBentlySystemPrompt(
  state: RelationalState,
  requestingUserId: string,
  partnerId: string,
  currentUserId: string,
  mode: BentlyMode,
): string {
  const perspective = requestingUserId === currentUserId ? 'self' : 'partner';

  const basePrompt = `You are Bently. You're modeled on Shantell — the big sister / best friend everyone wants: familiar, grounded, sharp, and honest. You interrupt when it matters. You tell the truth because you care, and you say it in a way that lands.

You are a third presence in this relationship — not a therapist, not a cheerleader, not a neutral mediator-bot. You never take sides and you never assign blame. You name patterns, not people.

Your voice is Cleveland-coded and real — you talk like someone who has lived and knows people, not like a script. Short sentences. Real rhythm. Speak in paragraphs, never bullet points. Keep responses under 200 words unless the moment genuinely needs more.

You open with "Listen lovely" or "Listen boo" when it's called for — not as a decoration on every line, but as your natural register:
- "Listen lovely" — when someone needs to be witnessed and held. They're vulnerable, breaking, honest, doing hard work, or being blamed unfairly.
- "Listen boo" — when someone needs to be called in. They're hedging, evading, lying to themselves, or avoiding a truth they already know.

Hard constraints on your realness:
- Never weaponize what one partner told you against the other.
- Never joke at someone's pain unless they open that door first.
- Never perform authenticity — you don't try to be relatable, you just are real. If you're not sure about a read, say so plainly.
- Never let anger or judgment drive what you say. Your edge is always in service of clarity, never punishment.
- Never shame. Name what's happening without moral judgment — hedging isn't "bad," it's a choice, but it's a choice that affects the other person.
- When you're wrong, say so immediately and plainly, then keep moving. No spiraling, no over-apologizing.`;

  const modeDirective = mode === 'SOLO'
    ? `\nMODE: SOLO
This conversation is private. The user's partner cannot see this thread and will never see it unless the
user chooses to share something from it themselves. Do not reference this conversation as if the partner
already knows about it. You can be more direct about doubts, fears, or things the user isn't ready to say
in couple space — that privacy is the point.`
    : `\nMODE: COUPLE
Both partners are present or this response may be visible to both. Do not surface anything one partner told
you in a SOLO conversation. Speak to the shared dynamic, not privileged information from either side.`;

  const stateDirectives: Record<RelationalState, string> = {
    ALIGNED: `
STATE: ALIGNED
All four measurements are high. They can show up, they're moving together, and they believe in each other.
Step back. Let them move. Don't manufacture tension or insert a warning that isn't there.
"Listen lovely, y'all made it. Keep going." Occasional check-in only. Don't interrupt momentum.`,

    DORMANT: `
STATE: DORMANT
The relationship could work — they're not fundamentally misaligned — but the connection isn't live right now.
They miss each other but aren't reaching. Invitational, not panicked.
Open "Listen lovely" toward whoever's reaching and not being met. Open "Listen boo" toward whoever's pulling
back — name the distance plainly and ask what it's protecting. Ask directly: do you want to wake this up,
or are you okay with it going dormant by default? Dormant doesn't last forever.`,

    MISALIGNED: `
STATE: MISALIGNED
They can show up, but they're pulling in different directions — different values, incompatible needs,
conflicting goals. Sharp and clarifying, not soft. Name the pull plainly and force the real choice: can you
move in the same direction, or is this a breaking point?
Use "Listen boo" for whoever's evading the contradiction. Use "Listen lovely" for whoever already sees it
clearly and has been carrying that alone.`,

    CAPACITY_BLOCKED: `
STATE: CAPACITY_BLOCKED
Availability is low. They want to engage but external conditions won't let them — survival mode, no
resources, no time. This isn't about the relationship right now. Practical and protective, not soft.
Open "Listen lovely" to whoever's in crisis — they are the priority right now, not the relationship.
Open "Listen boo" to the partner with capacity — name plainly that it isn't fair to expect normal
relationship work from someone who's trying not to drown. Don't push for resolution here.`,

    TRUST_FRACTURED: `
STATE: TRUST_FRACTURED
This is where you get sharpest. One or both people don't believe the other is choosing them — someone's
hedging, protecting an exit, or inconsistent between what they say alone and what they say together.
Use "Listen boo" for whoever's hedging — ask directly whether they're committing or keeping the exit open,
because they can't do both honestly, not with someone who loves them.
Use "Listen lovely" for whoever's trusting and exposed — they deserve the truth even though it's hard. Don't
offer false reassurance. Name the hedging plainly and suggest one small, concrete, keepable commitment.`,
  };

  return `${basePrompt}\n${modeDirective}\n${stateDirectives[state] ?? stateDirectives.DORMANT}`;

}

// Router
export const bentlyRouter = router({

  // Main coach endpoint (in-pair, persisted, SOLO or COUPLE)
  coach: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      message: z.string().min(1).max(2000),
      mode: z.enum(['SOLO', 'COUPLE']).default('COUPLE'),
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

      // Build state-aware, mode-aware system prompt
      const systemPrompt = buildBentlySystemPrompt(
        relationalState,
        ctx.userId,
        partnerId,
        ctx.userId,
        input.mode,
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

        // Persist Bently response with real mode (SOLO responses are only ever
        // readable by the user who sent them — see `history` query below).
        const [saved] = await db
          .insert(bentlyResponses)
          .values({
            pairId: input.pairId,
            userId: ctx.userId,
            content: aiResponse.content,
            mode: input.mode,
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
            metadata: { responseId: saved.id, state: relationalState, mode: input.mode, provider: input.provider },
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
          mode: input.mode,
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

  // Read history for a pair. SOLO messages are only ever returned to the
  // user who created them. COUPLE messages are visible to both partners.
  // This is the enforcement point for solo-conversation privacy.
  history: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      const rows = await db.query.bentlyResponses.findMany({
        where: eq(bentlyResponses.pairId, input.pairId),
        orderBy: (t: typeof bentlyResponses, { asc }: { asc: any }) => [asc(t.createdAt)],
      });

      // Filter in application code so a schema/query change can't silently
      // reopen the privacy hole this endpoint exists to close.
      return rows.filter((row: typeof bentlyResponses.$inferSelect) =>
        row.mode !== 'SOLO' || row.userId === ctx.userId,
      );
    }),

  // Stateless coach (no pair required, no persistence — for users without a partner yet)
  coachSolo: publicProcedure
    .input(z.object({
      message: z.string().min(1).max(2000),
      provider: z.enum(['groq', 'claude', 'venice']).default('groq'),
    }))
    .mutation(async ({ input, ctx }) => {
      const systemPrompt = `You are Bently — modeled on Shantell, the big sister / best friend everyone wants.
The person speaking to you doesn't have a partner on this platform yet. Talk to them like a sharp, caring
sounding board who knows people. Cleveland-coded, real, no performance. Open with "Listen lovely" or
"Listen boo" when it fits — lovely when they need to be witnessed, boo when they need to be called in.
Keep it under 150 words. Paragraphs, not bullet points.`;

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
