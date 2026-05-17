import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { messages, pairs } from '../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export const messagesRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({ pairId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is in this pair
      const pairResult = await db
        .select()
        .from(pairs)
        .where(
          and(
            eq(pairs.id, input.pairId),
            or(
              eq(pairs.user1Id, ctx.userId),
              eq(pairs.user2Id, ctx.userId)
            )
          )
        );

      if (pairResult.length === 0) {
        throw new Error('Not authorized');
      }

      // Insert message
      const result = await db
        .insert(messages)
        .values({
          pairId: input.pairId,
          senderId: ctx.userId,
          content: input.content,
        })
        .returning({ id: messages.id });

      return { messageId: result[0].id };
    }),

  getMessages: protectedProcedure
    .input(z.object({ pairId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify user is in this pair
      const pairResult = await db
        .select()
        .from(pairs)
        .where(
          and(
            eq(pairs.id, input.pairId),
            or(
              eq(pairs.user1Id, ctx.userId),
              eq(pairs.user2Id, ctx.userId)
            )
          )
        );

      if (pairResult.length === 0) {
        throw new Error('Not authorized');
      }

      // Get messages
      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.pairId, input.pairId))
        .orderBy(desc(messages.createdAt))
        .limit(50);

      return result.reverse();
    }),
});
