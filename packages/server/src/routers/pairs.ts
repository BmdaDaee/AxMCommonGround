import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';
import { db } from '../db';
import { pairs, invites } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export const pairsRouter = router({
  createInvite: protectedProcedure.mutation(async ({ ctx }) => {
    const inviteCode = generateInviteCode();

    await db.insert(invites).values({
      code: inviteCode,
      createdBy: ctx.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return { inviteCode };
  }),

  acceptInvite: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Find invite
      const inviteResult = await db
        .select()
        .from(invites)
        .where(
          and(
            eq(invites.code, input.inviteCode),
            eq(invites.acceptedAt, null)
          )
        );

      if (inviteResult.length === 0) {
        throw new Error('Invalid or expired invite code');
      }

      const invite = inviteResult[0];

      // Create pair
      const pairResult = await db
        .insert(pairs)
        .values({
          user1Id: invite.createdBy,
          user2Id: ctx.userId,
        })
        .returning({ id: pairs.id });

      // Mark invite as accepted
      await db
        .update(invites)
        .set({ acceptedAt: new Date() })
        .where(eq(invites.id, invite.id));

      return { pairId: pairResult[0].id };
    }),

  getInviteStatus: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(invites)
        .where(eq(invites.code, input.inviteCode));

      if (result.length === 0) {
        return { status: 'not_found' };
      }

      const invite = result[0];

      if (invite.acceptedAt) {
        return { status: 'accepted' };
      }

      if (new Date() > invite.expiresAt) {
        return { status: 'expired' };
      }

      return { status: 'pending' };
    }),

  getMyPair: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select()
      .from(pairs)
      .where(
        or(
          eq(pairs.user1Id, ctx.userId),
          eq(pairs.user2Id, ctx.userId)
        )
      );

    if (result.length === 0) {
      return null;
    }

    return result[0];
  }),

  dissolvePair: protectedProcedure
    .input(z.object({ pairId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is part of this pair
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

      // Delete pair
      await db.delete(pairs).where(eq(pairs.id, input.pairId));

      return { success: true };
    }),
});
