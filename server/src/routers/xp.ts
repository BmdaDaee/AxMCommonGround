import { publicProcedure, router } from '../trpc';
import { z } from 'zod';

export const xpRouter = router({
  addXP: publicProcedure
    .input(z.object({
      userId: z.string(),
      amount: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      return { xp: 100 + input.amount, rank: 'SPARK' };
    }),

  getProgress: publicProcedure
    .input(z.object({
      userId: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        currentRank: 'SPARK',
        currentXp: 100,
        xpToNextRank: 400,
        percentProgress: 20,
      };
    }),
});
