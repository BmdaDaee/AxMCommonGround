import { publicProcedure, router } from '../trpc';
import { z } from 'zod';

export const authRouter = router({
  signup: publicProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        id: 'user_' + Date.now(),
        email: input.email,
        name: input.name,
        xp: 0,
        rank: 'SPARK',
      };
    }),

  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      return { email: input.email, authenticated: true };
    }),
});
