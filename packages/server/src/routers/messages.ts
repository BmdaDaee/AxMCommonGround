// packages/server/src/routers/messages.ts
// Full replacement — adds signal collection trigger on sendMessage.

import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { messages, pairs, users } from '../db/schema.js';
import { eq, or, and, desc, lt } from 'drizzle-orm';
import { XP_CONFIG } from '../../../shared/constants.js';
import { collectSignalsAndDeriveState } from '../services/signalCollector.js';

export const messagesRouter = router({

  // ── Send message ──────────────────────────────────────────────────────────
  sendMessage: publicProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      content: z.string().min(1).max(5000),
      type: z.string().default('TEXT'),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      // Verify pair membership and active status
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
          eq(pairs.status, 'ACTIVE'),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not part of this active pair.' });
      }

      // Insert message
      const [newMessage] = await db
        .insert(messages)
        .values({
          pairId: input.pairId,
          userId: ctx.userId,
          content: input.content,
          type: input.type,
          xpReward: XP_CONFIG.MESSAGE_SENT,
        })
        .returning();

      // Award XP to sender
      const user = await db.query.users.findFirst({ where: eq(users.id, ctx.userId) });
      if (user) {
        await db
          .update(users)
          .set({ xp: user.xp + XP_CONFIG.MESSAGE_SENT })
          .where(eq(users.id, ctx.userId));
      }

      // ── Signal collection trigger ─────────────────────────────────────────
      // Fire-and-forget: we don't await this so it doesn't add latency to the
      // send response. State updates in the background. If it fails, the pair's
      // last known state is still valid — no message is lost.
      collectSignalsAndDeriveState(db, input.pairId).catch((err) => {
        console.error(`[signalCollector] Failed for pair ${input.pairId}:`, err);
      });

      return newMessage;
    }),

  // ── Get messages (paginated) ──────────────────────────────────────────────
  getMessages: publicProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(), // last message id from previous page
    }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      // Verify membership
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not part of this pair.' });
      }

      // If cursor provided, get messages older than that message
      let cursorDate: Date | undefined;
      if (input.cursor) {
        const cursorMsg = await db.query.messages.findFirst({
          where: eq(messages.id, input.cursor),
        });
        cursorDate = cursorMsg?.createdAt;
      }

      const items = await db.query.messages.findMany({
        where: and(
          eq(messages.pairId, input.pairId),
          cursorDate ? lt(messages.createdAt, cursorDate) : undefined,
        ),
        limit: input.limit,
        orderBy: [desc(messages.createdAt)],
      });

      return {
        items: items.reverse(), // return chronological order
        nextCursor: items.length === input.limit ? items[0].id : undefined,
      };
    }),

  // ── List pair threads for current user ───────────────────────────────────
  listThreads: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = ctx.db!;
    return db.query.pairs.findMany({
      where: and(
        or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
        eq(pairs.status, 'ACTIVE'),
      ),
    });
  }),

  // ── Mark as read (stub — extend when read receipts are needed) ────────────
  markAsRead: publicProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .mutation(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      return { success: true };
    }),
});
