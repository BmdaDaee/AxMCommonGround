import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { users, xpEvents } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { RANK_XP_REQUIREMENTS } from '../../../shared/constants.js';

const SORTED_RANKS_DESC = Object.entries(RANK_XP_REQUIREMENTS).sort((a, b) => (b[1] as number) - (a[1] as number));
const SORTED_RANKS_ASC = Object.entries(RANK_XP_REQUIREMENTS).sort((a, b) => (a[1] as number) - (b[1] as number));

export const xpRouter = router({
  addXP: publicProcedure
    .input(z.object({
      amount: z.number().int().positive(),
      source: z.string(),
      pairId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.userId),
      });

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const newXP = user.xp + input.amount;
      
      // Determine new rank
      let newRank = user.rank;
      for (const [rank, req] of SORTED_RANKS_DESC) {
        if (newXP >= (req as number)) {
          newRank = rank;
          break;
        }
      }

      await db.update(users)
        .set({ xp: newXP, rank: newRank })
        .where(eq(users.id, ctx.userId));

      await db.insert(xpEvents).values({
        userId: ctx.userId,
        pairId: input.pairId,
        source: input.source,
        amount: input.amount,
      });

      return { xp: newXP, rank: newRank };
    }),

  getProgress: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = ctx.db!;
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.userId),
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }

    let nextRank = null;
    let xpToNextRank = 0;

    for (let i = 0; i < SORTED_RANKS_ASC.length; i++) {
      if (user.xp < (SORTED_RANKS_ASC[i][1] as number)) {
        nextRank = SORTED_RANKS_ASC[i][0];
        xpToNextRank = (SORTED_RANKS_ASC[i][1] as number) - user.xp;
        break;
      }
    }

    return {
      currentXp: user.xp,
      currentRank: user.rank,
      nextRank,
      xpToNextRank,
    };
  }),

  getRankLadder: publicProcedure.query(() => {
    return RANK_XP_REQUIREMENTS;
  }),
});
