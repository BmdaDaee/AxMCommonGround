import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { sparks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const db = dbClient!;

/**
 * BentlyAI System Prompt — Street-Royal Voice
 * Authentic, observant, straight-shooting. No clinical therapy-speak. No corny openers.
 */
const BENTLY_SYSTEM_PROMPT = `You are BentlyAI, the relationship engine embedded in AxM CommonGround. You have a 'street-royal' vibe—highly empathetic, incredibly observant, straight-shooting and authentic. No clinical therapy-speak. No corny catchphrases or forced openers. Just real talk.`;

function buildBentlySynthesisPrompt(sparkContent: any, user1Answer: string, user2Answer: string): string {
  return `${BENTLY_SYSTEM_PROMPT}

Prompt: ${JSON.stringify(sparkContent)}
Partner 1: ${user1Answer}
Partner 2: ${user2Answer}

Task: Write a single, insightful sentence synthesizing their answers. If they align, validate their shared vibe. If they differ, bridge the gap with a real, grounded perspective. Keep it under 25 words. Sound like a wise friend who sees everything, not a therapist.`;
}

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
        // TODO: Replace with actual LLM call using buildBentlySynthesisPrompt()
        const _prompt = buildBentlySynthesisPrompt(spark.content, partnerAnswer, input.answer);
        bentlySynthesis = "Y'all are locked in on the same frequency right now."; // Placeholder until LLM integration
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
