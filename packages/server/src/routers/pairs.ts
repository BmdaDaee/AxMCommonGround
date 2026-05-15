// packages/server/src/routers/pairs.ts
// Full replacement — adds invite code pair creation on top of existing routes.

import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { router, publicProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { pairs, inviteCodes, users } from '../db/schema.js';
import { eq, or, and, gt } from 'drizzle-orm';
import { evaluateRelationalState } from '../engine/relationalEngine.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateInviteCode(): string {
  // 8 chars, uppercase alphanumeric, unambiguous (no 0/O, 1/I/L)
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}

const INVITE_TTL_HOURS = 48;

// ─── Router ──────────────────────────────────────────────────────────────────

export const pairsRouter = router({

  // ── Create invite code ────────────────────────────────────────────────────
  // Call this when the first partner wants to invite their person.
  // Returns a code the inviter shows to their partner (copy/share).
  createInvite: publicProcedure
    .mutation(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      // Block if user already has an active pair
      const existingPair = await db.query.pairs.findFirst({
        where: and(
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
          eq(pairs.status, 'ACTIVE'),
        ),
      });

      if (existingPair) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already in an active pair.',
        });
      }

      // Expire any previous pending invites from this user
      await db
        .update(inviteCodes)
        .set({ status: 'CANCELLED' })
        .where(
          and(
            eq(inviteCodes.inviterId, ctx.userId),
            eq(inviteCodes.status, 'PENDING'),
          ),
        );

      const expiresAt = new Date(Date.now() + INVITE_TTL_HOURS * 60 * 60 * 1000);
      const code = generateInviteCode();

      const [invite] = await db
        .insert(inviteCodes)
        .values({
          inviterId: ctx.userId,
          code,
          expiresAt,
        })
        .returning();

      return {
        code: invite.code,
        expiresAt: invite.expiresAt,
      };
    }),

  // ── Accept invite code ────────────────────────────────────────────────────
  // Call this when the second partner enters the code they received.
  // Creates the pair, activates it, and returns the pair object.
  acceptInvite: publicProcedure
    .input(z.object({ code: z.string().min(6).max(8).toUpperCase() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      // Block if acceptor already has an active pair
      const existingPair = await db.query.pairs.findFirst({
        where: and(
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
          eq(pairs.status, 'ACTIVE'),
        ),
      });

      if (existingPair) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You are already in an active pair.',
        });
      }

      // Find the invite
      const invite = await db.query.inviteCodes.findFirst({
        where: and(
          eq(inviteCodes.code, input.code),
          eq(inviteCodes.status, 'PENDING'),
          gt(inviteCodes.expiresAt, new Date()),
        ),
      });

      if (!invite) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invite code is invalid, expired, or already used.',
        });
      }

      // Can't pair with yourself
      if (invite.inviterId === ctx.userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot use your own invite code.',
        });
      }

      // Create the pair
      const [newPair] = await db
        .insert(pairs)
        .values({
          user1Id: invite.inviterId,
          user2Id: ctx.userId,
          status: 'ACTIVE',
          relationalState: 'DORMANT', // starts dormant — engine will update
          relationalMetrics: {},
        })
        .returning();

      // Mark invite as accepted and link the pair
      await db
        .update(inviteCodes)
        .set({ status: 'ACCEPTED', pairId: newPair.id })
        .where(eq(inviteCodes.id, invite.id));

      return {
        pair: newPair,
        message: 'Pair created. CommonGround is now active.',
      };
    }),

  // ── Get invite status ─────────────────────────────────────────────────────
  // Let the inviter poll or check if their code was accepted.
  getInviteStatus: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      const invite = await db.query.inviteCodes.findFirst({
        where: and(
          eq(inviteCodes.inviterId, ctx.userId),
          eq(inviteCodes.status, 'PENDING'),
          gt(inviteCodes.expiresAt, new Date()),
        ),
      });

      if (!invite) {
        return { pending: false };
      }

      return {
        pending: true,
        code: invite.code,
        expiresAt: invite.expiresAt,
      };
    }),

  // ── Dissolve pair ─────────────────────────────────────────────────────────
  dissolvePair: publicProcedure
    .input(z.object({ pairId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      const pair = await db.query.pairs.findFirst({
        where: and(
          eq(pairs.id, input.pairId),
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      await db
        .update(pairs)
        .set({ status: 'DISSOLVED' })
        .where(eq(pairs.id, input.pairId));

      return { dissolved: true };
    }),

  // ── Get current user's active pair ────────────────────────────────────────
  getMyPair: publicProcedure
    .query(async ({ ctx }) => {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const db = ctx.db!;

      const pair = await db.query.pairs.findFirst({
        where: and(
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
          eq(pairs.status, 'ACTIVE'),
        ),
      });

      return pair ?? null;
    }),

  // ── Get relational state ──────────────────────────────────────────────────
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
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      return {
        state: pair.relationalState,
        metrics: pair.relationalMetrics,
      };
    }),

  // ── Derive state (manual trigger) ─────────────────────────────────────────
  // Currently uses stored metrics. Wire signal collector here in next pass.
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
          or(eq(pairs.user1Id, ctx.userId), eq(pairs.user2Id, ctx.userId)),
        ),
      });

      if (!pair) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pair not found.' });
      }

      const currentMetrics = (pair.relationalMetrics as any) || {};
      const signals = {
        availability: currentMetrics.availability || 50,
        alignment: currentMetrics.alignment || 50,
        activation: currentMetrics.activation || 50,
        trust: currentMetrics.trust || 50,
      };

      const evaluation = evaluateRelationalState(signals);

      await db
        .update(pairs)
        .set({
          relationalState: evaluation.state,
          relationalMetrics: evaluation.dimensions,
        })
        .where(eq(pairs.id, input.pairId));

      return evaluation;
    }),

  // ── List all user's pairs (including dissolved) ───────────────────────────
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
