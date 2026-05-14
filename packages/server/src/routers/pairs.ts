import { z } from 'zod';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { pairs } from '../db/schema.js';
import { eq, or, and } from 'drizzle-orm';
import { evaluateRelationalState } from '../engine/relationalEngine.js';

export const pairsRouter = router({
  getRelationalState: publicProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId))
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found' });
      }

      return {
        state: pair.relationalState,
        metrics: pair.relationalMetrics,
      };
    }),

  deriveState: publicProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;
      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId))
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found' });
      }

      // In a real app, we'd analyze messages + XP to derive these signals.
      // For now, we'll use existing metrics or defaults if empty.
      const currentMetrics = (pair.relationalMetrics as any) || {};
      const signals = {
        availability: currentMetrics.availability || 50,
        alignment: currentMetrics.alignment || 50,
        activation: currentMetrics.activation || 50,
        trust: currentMetrics.trust || 50,
      };

      const evaluation = evaluateRelationalState(signals);

      await db.update(pairs)
        .set({
          relationalState: evaluation.state,
          relationalMetrics: evaluation.dimensions,
        })
        .where(eq(pairs.id, input.pairId));

      return evaluation;
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    const db = ctx.db!;
    return db.query.pairs.findMany({
      where: or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
    });
  }),
});
