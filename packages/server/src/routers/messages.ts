import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { messages, pairs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const db = dbClient!;

export const messagesRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({ pairId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is in pair
      const pairResult = await db
        .select()
        .from(pairs)
        .where(eq(pairs.id, input.pairId));

      if (pairResult.length === 0) {
        throw new Error('Pair not found');
      }

      const pair = pairResult[0];
      if (pair.user1Id !== ctx.userId && pair.user2Id !== ctx.userId) {
        throw new Error('Not authorized');
      }

      // Insert message
      const result = await db
        .insert(messages)
        .values({
          pairId: input.pairId,
          userId: ctx.userId!,
          content: input.content,
          type: 'TEXT',
        })
        .returning({ id: messages.id });

      return { messageId: result[0].id };
    }),

  getMessages: protectedProcedure
    .input(z.object({ pairId: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.pairId, input.pairId));

      return result;
    }),
});
