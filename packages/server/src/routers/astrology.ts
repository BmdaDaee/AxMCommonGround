// packages/server/src/routers/astrology.ts

import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { aiProviders } from '../services/ai/index.js';
import { pairs, userProfiles, horoscopes } from '../db/schema.js';
import { eq, and, or, gte } from 'drizzle-orm';

const ZODIAC_SIGNS = [
  { sign: 'ARIES', symbol: '♈', element: 'Fire', dates: 'Mar 21 - Apr 19', traits: ['bold', 'direct', 'impatient'] },
  { sign: 'TAURUS', symbol: '♉', element: 'Earth', dates: 'Apr 20 - May 20', traits: ['steady', 'loyal', 'stubborn'] },
  { sign: 'GEMINI', symbol: '♊', element: 'Air', dates: 'May 21 - Jun 20', traits: ['curious', 'adaptable', 'restless'] },
  { sign: 'CANCER', symbol: '♋', element: 'Water', dates: 'Jun 21 - Jul 22', traits: ['nurturing', 'intuitive', 'guarded'] },
  { sign: 'LEO', symbol: '♌', element: 'Fire', dates: 'Jul 23 - Aug 22', traits: ['confident', 'generous', 'proud'] },
  { sign: 'VIRGO', symbol: '♍', element: 'Earth', dates: 'Aug 23 - Sep 22', traits: ['precise', 'practical', 'critical'] },
  { sign: 'LIBRA', symbol: '♎', element: 'Air', dates: 'Sep 23 - Oct 22', traits: ['diplomatic', 'fair', 'indecisive'] },
  { sign: 'SCORPIO', symbol: '♏', element: 'Water', dates: 'Oct 23 - Nov 21', traits: ['intense', 'loyal', 'controlling'] },
  { sign: 'SAGITTARIUS', symbol: '♐', element: 'Fire', dates: 'Nov 22 - Dec 21', traits: ['adventurous', 'honest', 'restless'] },
  { sign: 'CAPRICORN', symbol: '♑', element: 'Earth', dates: 'Dec 22 - Jan 19', traits: ['disciplined', 'ambitious', 'reserved'] },
  { sign: 'AQUARIUS', symbol: '♒', element: 'Air', dates: 'Jan 20 - Feb 18', traits: ['independent', 'inventive', 'detached'] },
  { sign: 'PISCES', symbol: '♓', element: 'Water', dates: 'Feb 19 - Mar 20', traits: ['empathetic', 'dreamy', 'avoidant'] },
] as const;

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = now.getUTCDate() - day + (day === 0 ? -6 : 1); // Monday start
  const monday = new Date(now);
  monday.setUTCDate(diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

export const astrologyRouter = router({
  getZodiacInfo: publicProcedure.query(() => ZODIAC_SIGNS),

  // Individual weekly horoscope. Caches per user per week so repeated calls
  // don't burn AI provider quota re-generating the same content.
  getHoroscope: protectedProcedure
    .input(z.object({ provider: z.enum(['groq', 'claude']).default('groq') }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const db = ctx.db!;

      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.userId, ctx.userId),
      });

      if (!profile?.zodiacSign) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Set your zodiac sign in your profile before requesting a horoscope.',
        });
      }

      const weekOf = startOfWeek();

      const existing = await db.query.horoscopes.findFirst({
        where: and(
          eq(horoscopes.scope, 'SOLO'),
          eq(horoscopes.userId, ctx.userId),
          gte(horoscopes.weekOf, weekOf),
        ),
      });

      if (existing) return existing;

      const zodiacInfo = ZODIAC_SIGNS.find((z) => z.sign === profile.zodiacSign);

      const aiResponse = await aiProviders[input.provider].complete({
        messages: [
          {
            role: 'system',
            content: `You write concise, grounded weekly horoscopes -- no vague mysticism, no "the universe wants." Speak like someone who actually reads people. 2-3 sentences. Reference the sign's real traits naturally, don't just list them.`,
          },
          {
            role: 'user',
            content: `Write this week's horoscope for ${profile.zodiacSign} (${zodiacInfo?.element ?? 'unknown'} sign, traits: ${zodiacInfo?.traits.join(', ') ?? 'n/a'}).`,
          },
        ],
        temperature: 0.9,
        maxTokens: 200,
      });

      const [saved] = await db
        .insert(horoscopes)
        .values({
          scope: 'SOLO',
          userId: ctx.userId,
          zodiacSign: profile.zodiacSign,
          content: aiResponse.content,
          weekOf,
          provider: input.provider,
        })
        .returning();

      return saved;
    }),

  // Couple horoscope -- requires an active pair, reads both partners' signs.
  getCoupleHoroscope: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), provider: z.enum(['groq', 'claude']).default('groq') }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const db = ctx.db!;

      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
          eq(pairs.status, 'ACTIVE'),
        ),
      });

      if (!pair) throw new TRPCError({ code: 'NOT_FOUND', message: 'Active pair not found.' });

      const [profile1, profile2] = await Promise.all([
        db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, pair.user1Id) }),
        db.query.userProfiles.findFirst({ where: eq(userProfiles.userId, pair.user2Id) }),
      ]);

      if (!profile1?.zodiacSign || !profile2?.zodiacSign) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Both partners need a zodiac sign set before a couple horoscope can be generated.',
        });
      }

      const weekOf = startOfWeek();

      const existing = await db.query.horoscopes.findFirst({
        where: and(
          eq(horoscopes.scope, 'COUPLE'),
          eq(horoscopes.pairId, input.pairId),
          gte(horoscopes.weekOf, weekOf),
        ),
      });

      if (existing) return existing;

      const aiResponse = await aiProviders[input.provider].complete({
        messages: [
          {
            role: 'system',
            content: `You write concise, grounded weekly couple horoscopes -- no vague mysticism. Speak to the dynamic between the two signs specifically, not each sign separately. 3-4 sentences. Name one real friction point the pairing tends toward and one real strength, based on the elements/traits given.`,
          },
          {
            role: 'user',
            content: `Write this week's couple horoscope for a ${profile1.zodiacSign} and a ${profile2.zodiacSign}.`,
          },
        ],
        temperature: 0.9,
        maxTokens: 250,
      });

      const [saved] = await db
        .insert(horoscopes)
        .values({
          scope: 'COUPLE',
          pairId: input.pairId,
          zodiacSign: profile1.zodiacSign,
          partnerZodiacSign: profile2.zodiacSign,
          content: aiResponse.content,
          weekOf,
          provider: input.provider,
        })
        .returning();

      return saved;
    }),
});
