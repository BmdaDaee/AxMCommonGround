import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { messages, pairs } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const db = dbClient!;

async function requirePairMembership(pairId: string, userId: string) {
  const pairResult = await db.select().from(pairs).where(eq(pairs.id, pairId));

  if (pairResult.length === 0) {
    throw new Error('Pair not found');
  }

  const pair = pairResult[0];
  if (pair.user1Id !== userId && pair.user2Id !== userId) {
    throw new Error('Not authorized');
  }

  return pair;
}

export const messagesRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({ pairId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requirePairMembership(input.pairId, ctx.userId!);

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
      // SECURITY: without this check, any authenticated user could read any
      // pair's messages by passing an arbitrary pairId. Verify membership first.
      await requirePairMembership(input.pairId, ctx.userId!);

      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.pairId, input.pairId));

      return result;
    }),
});
