import { z } from 'zod';
import { router, protectedProcedure } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { sparks } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const db = dbClient!;

/**
 * BentlyAI System Prompt — Street-Royal Voice
 * No clinical therapy-speak. No NVC. Straight-shooting and authentic.
 */
const BENTLY_SYSTEM_PROMPT = `You are BentlyAI, the relationship engine embedded in AxM CommonGround. You have a 'street-royal' vibe—you are highly empathetic, incredibly observant, but straight-shooting and authentic. No clinical therapy-speak.`;

function buildBentlySynthesisPrompt(sparkContent: any, user1Answer: string, user2Answer: string): string {
  return `${BENTLY_SYSTEM_PROMPT}

Prompt: ${JSON.stringify(sparkContent)}
Partner 1: ${user1Answer}
Partner 2: ${user2Answer}

Task: Write a single, insightful sentence synthesizing their answers. If they align, validate their shared vibe. If they differ, bridge the gap with a real, grounded perspective. You MUST start your sentence with either 'Listen lovely,' or 'Listen boo,'. Keep it under 25 words.`;
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
        // For now, placeholder that matches Bently's real voice:
        const prompt = buildBentlySynthesisPrompt(spark.content, partnerAnswer, input.answer);
        bentlySynthesis = "Listen boo, y'all are clearly on the same wavelength—own that energy together."; // Placeholder until LLM integration
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
