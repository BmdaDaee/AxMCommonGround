import { publicProcedure, router } from '../trpc';
import { z } from 'zod';

export const bentlyRouter = router({
  chat: publicProcedure
    .input(z.object({
      pairId: z.string(),
      userId: z.string(),
      message: z.string(),
      mode: z.enum(['COMMON', 'DEEPLY_US', 'SANDBOX', 'BRIDGE']),
    }))
    .mutation(async ({ input }) => {
      return {
        id: 'bently_' + Date.now(),
        content: 'Bently AI response (full integration in Phase 3)',
        mode: input.mode,
        confidence: 0.85,
        suggestions: [],
        xpEarned: 20,
        createdAt: new Date(),
      };
    }),

  analyze: publicProcedure
    .input(z.object({
      messageId: z.string(),
      content: z.string(),
    }))
    .query(async ({ input }) => {
      return {
        sentiment: 'neutral',
        tone: 'serious',
        emotionalLoad: 5,
        communicationGap: false,
      };
    }),
});
