import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { pairs, inviteCodes } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import { randomBytes } from 'crypto';

const db = dbClient!;

function generateInviteCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

export const pairsRouter = router({
  createInvite: protectedProcedure.mutation(async ({ ctx }) => {
    const inviteCode = generateInviteCode();

    await db.insert(inviteCodes).values({
      code: inviteCode,
      inviterId: ctx.userId!,
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
        .from(inviteCodes)
        .where(eq(inviteCodes.code, input.inviteCode));

      if (inviteResult.length === 0) {
        throw new Error('Invite code not found');
      }

      const invite = inviteResult[0];

      // Check expiration
      if (invite.expiresAt < new Date()) {
        throw new Error('Invite code expired');
      }

      // Create pair
      const pairResult = await db
        .insert(pairs)
        .values({
          user1Id: invite.inviterId,
          user2Id: ctx.userId!,
          status: 'ACTIVE',
        })
        .returning({ id: pairs.id });

      const pairId = pairResult[0].id;

      // Update invite
      await db
        .update(inviteCodes)
        .set({ pairId, status: 'ACCEPTED' })
        .where(eq(inviteCodes.id, invite.id));

      return { pairId };
    }),

  getInviteStatus: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .query(async ({ input }) => {
      const result = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, input.inviteCode));

      if (result.length === 0) {
        return { status: 'NOT_FOUND' };
      }

      return { status: result[0].status };
    }),

  getMyPair: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select()
      .from(pairs)
      .where(
        or(
          eq(pairs.user1Id, ctx.userId!),
          eq(pairs.user2Id, ctx.userId!)
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
      await db
        .update(pairs)
        .set({ status: 'DISSOLVED' })
        .where(eq(pairs.id, input.pairId));

      return { success: true };
    }),
});
