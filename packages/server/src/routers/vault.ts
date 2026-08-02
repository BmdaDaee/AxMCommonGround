// packages/server/src/routers/vault.ts

import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { TRPCError } from '@trpc/server';
import { imageProviders } from '../services/image/index.js';
import { pairs, vaultMemories, users } from '../db/schema.js';
import { eq, and, or, desc } from 'drizzle-orm';

async function requireActivePair(db: any, pairId: string, userId: string) {
  const pair = await db.query.pairs.findFirst({
    where: and(
      eq(pairs.id, pairId),
      or(eq(pairs.user1Id, userId), eq(pairs.user2Id, userId)),
      eq(pairs.status, 'ACTIVE'),
    ),
  });
  if (!pair) throw new TRPCError({ code: 'NOT_FOUND', message: 'Active pair not found.' });
  return pair;
}

export const vaultRouter = router({
  // Generate an AI couple portrait/scene and store it in the Memory Vault.
  // Creates the row as PENDING first so the client can show a loading state
  // and the record survives even if generation fails partway.
  createScene: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      title: z.string().min(1).max(180),
      prompt: z.string().min(1).max(500),
      style: z.enum(['ETHEREAL', 'BOLD', 'CLASSIC', 'FANTASY']).default('ETHEREAL'),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const db = ctx.db!;

      await requireActivePair(db, input.pairId, ctx.userId);

      const [pending] = await db
        .insert(vaultMemories)
        .values({
          pairId: input.pairId,
          createdBy: ctx.userId,
          type: 'SCENE',
          title: input.title,
          description: '',
          promptUsed: input.prompt,
          imageProvider: 'gemini',
          status: 'PENDING',
        })
        .returning();

      try {
        const result = await imageProviders.gemini.generate({
          prompt: input.prompt,
          style: input.style,
          aspectRatio: '4:3',
        });

        const [updated] = await db
          .update(vaultMemories)
          .set({
            imageUrl: result.imageUrl,
            promptUsed: result.promptUsed,
            status: 'COMPLETE',
          })
          .where(eq(vaultMemories.id, pending.id))
          .returning();

        return updated;
      } catch (error) {
        await db
          .update(vaultMemories)
          .set({ status: 'FAILED' })
          .where(eq(vaultMemories.id, pending.id));

        // Surface the real reason (e.g. "GEMINI_API_KEY not configured")
        // rather than a generic failure -- this is expected to fail until
        // Gemini credentials are added, and the client should be able to
        // tell the difference between "not configured" and "actually broke."
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Image generation failed',
        });
      }
    }),

  // Record a milestone or rank achievement (no image generation involved).
  addMilestone: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      type: z.enum(['MILESTONE', 'RANK']),
      title: z.string().min(1).max(180),
      description: z.string().max(1000).default(''),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const db = ctx.db!;

      await requireActivePair(db, input.pairId, ctx.userId);

      const [saved] = await db
        .insert(vaultMemories)
        .values({
          pairId: input.pairId,
          createdBy: ctx.userId,
          type: input.type,
          title: input.title,
          description: input.description,
          status: 'COMPLETE',
        })
        .returning();

      return saved;
    }),

  getMemories: protectedProcedure
    .input(z.object({
      pairId: z.string().uuid(),
      type: z.enum(['SCENE', 'MILESTONE', 'RANK']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const db = ctx.db!;

      await requireActivePair(db, input.pairId, ctx.userId);

      const rows = await db.query.vaultMemories.findMany({
        where: input.type
          ? and(eq(vaultMemories.pairId, input.pairId), eq(vaultMemories.type, input.type))
          : eq(vaultMemories.pairId, input.pairId),
        orderBy: (t: typeof vaultMemories, { desc }: { desc: any }) => [desc(t.createdAt)],
      });

      return rows;
    }),
});
