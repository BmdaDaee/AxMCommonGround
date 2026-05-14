import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { messages, pairs, users } from '../db/schema.js';
import { eq, or, and, desc } from 'drizzle-orm';
import { XP_CONFIG } from '../../../shared/constants.js';

export const messagesRouter = router({
  sendMessage: publicProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      content: z.string().min(1),
      type: z.string().default('TEXT'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;
      // Verify user is part of the pair
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId))
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not part of this pair' });
      }

      const [newMessage] = await db.insert(messages).values({
        pairId: input.pairId,
        userId: ctx.userId,
        content: input.content,
        type: input.type,
        xpReward: XP_CONFIG.MESSAGE_SENT,
      }).returning();

      // Update user XP
      const user = await db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user) {
        await db.update(users)
          .set({ xp: user.xp + XP_CONFIG.MESSAGE_SENT })
          .where(eq(users.id, ctx.userId));
      }

      return newMessage;
    }),

  listThreads: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = ctx.db!;
    const userPairs = await db.query.pairs.findMany({
      where: or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
    });

    return userPairs;
  }),

  getMessages: publicProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(),
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;
      const items = await db.query.messages.findMany({
        where: eq(messages.pairId, input.pairId),
        limit: input.limit,
        orderBy: [desc(messages.createdAt)],
      });

      return {
        items,
        nextCursor: items.length === input.limit ? items[items.length - 1].id : undefined,
      };
    }),

  markAsRead: publicProcedure
    .input(z.object({
      pairId: z.string().uuid(),
    }))
    .mutation(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      return { success: true };
    }),
});
