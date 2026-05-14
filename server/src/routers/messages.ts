import { publicProcedure, router } from '../trpc';
import { z } from 'zod';

export const messagesRouter = router({
  send: publicProcedure
    .input(z.object({
      pairId: z.string(),
      userId: z.string(),
      content: z.string(),
    }))
    .mutation(async ({ input }) => {
      return {
        id: 'msg_' + Date.now(),
        pairId: input.pairId,
        userId: input.userId,
        content: input.content,
        xpReward: 10,
        createdAt: new Date(),
      };
    }),

  rewrite: publicProcedure
    .input(z.object({
      messageId: z.string(),
      originalContent: z.string(),
      mode: z.enum(['SOFTEN', 'CLARIFY', 'DEESCALATE', 'EMOTION_TO_WORDS', 'BOUNDARY_SET', 'SUMMARIZE']),
    }))
    .mutation(async ({ input }) => {
      return {
        id: 'rewrite_' + Date.now(),
        messageId: input.messageId,
        originalContent: input.originalContent,
        rewriteMode: input.mode,
        rewrittenContent: '[AI rewritten in Phase 3]',
      };
    }),

  list: publicProcedure
    .input(z.object({
      pairId: z.string(),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      return [];
    }),
});
