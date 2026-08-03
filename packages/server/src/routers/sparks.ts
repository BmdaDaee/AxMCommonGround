import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { sparks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const db = dbClient!;

export const sparksRouter = router({
  getDailySparks: protectedProcedure
    .input(z.object({ pairId: z.string().uuid(), isDeeplyUs: z.boolean().default(false) }))
    .query(async ({ ctx, input }) => {
      return await db.select().from(sparks).where(
        and(eq(sparks.pairId, input.pairId), eq(sparks.isDeeplyUs, input.isDeeplyUs))
      );
    }),

  submitAnswer: protectedProcedure
    .input(z.object({ sparkId: z.string().uuid(), pairId: z.string().uuid(), answer: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId!;
      const spark = await db.select().from(sparks).where(eq(sparks.id, input.sparkId)).then(res => res[0]);

      if (!spark) throw new Error("Spark not found");

      const isUser1 = spark.user1Id === userId;
      const partnerAnswer = isUser1 ? spark.user2Answer : spark.user1Answer;

      let newStatus: 'WAITING_ON_PARTNER' | 'REVEALED' = 'WAITING_ON_PARTNER';
      let bentlySynthesis: string | null = null;

      if (partnerAnswer !== null) {
        newStatus = 'REVEALED';
        bentlySynthesis = "Listen lovely, you both prioritize shared experiences over material things."; // Placeholder for Bently AI synthesis
      }

      await db.update(sparks)
        .set({
          ...(isUser1 ? { user1Answer: input.answer } : { user2Answer: input.answer }),
          status: newStatus,
          ...(bentlySynthesis ? { bentlySynthesis } : {}),
        })
        .where(eq(sparks.id, input.sparkId));

      return { success: true, status: newStatus };
    }),
});
