import { z } from 'zod';
import { protectedProcedure, router } from '../trpc.js';
import { db as dbClient } from '../db/index.js';
import { messages, pairs } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { aiProviders } from '../services/ai/index.js';

const db = dbClient!;

const BENTLY_SYSTEM_ID = 'BENTLY_SYSTEM';

/**
 * Bently's Real-Time Mediation Prompt
 * Street-royal. No therapy-speak. No corny catchphrases.
 */
const BENTLY_MEDIATION_SYSTEM_PROMPT = `You are BentlyAI, the relationship engine embedded in a couple's chat. You have a 'street-royal' vibe—highly empathetic, incredibly observant, straight-shooting, and authentic. No clinical therapy-speak. Just real talk.

Read the following recent chat history between Partner 1 and Partner 2.

Task: Analyze the vibe. Is there escalating conflict, passive-aggressiveness, or high tension?
- If they are just talking normally or playfully, respond with exactly: NO_INTERVENTION_NEEDED
- If they are fighting, spiraling, or missing each other's points, write a single, grounded message (under 30 words) to step into the chat and de-escalate the situation by calling out the core miscommunication. Speak directly to them.`;

async function requirePairMembership(pairId: string, userId: string) {
  const pairResult = await db.select().from(pairs).where(eq(pairs.id, pairId));

  if (pairResult.length === 0) {
    throw new Error('Pair not found');
  }

  const pair = pairResult[0];
  if (pair.user1Id !== userId && pair.user2Id !== userId) {
    throw new Error('Not authorized');
  }

  return pair;
}

/**
 * Evaluates the last 6 messages and determines if Bently should intervene.
 * Runs asynchronously — does NOT block the user's message from sending.
 */
async function evaluateBentlyMediation(pairId: string) {
  try {
    // Fetch last 6 messages (excluding Bently's own messages)
    const recentMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.pairId, pairId))
      .orderBy(desc(messages.createdAt))
      .limit(8); // Fetch a few extra to filter

    // Filter out Bently's own messages and take last 6 human messages
    const humanMessages = recentMessages
      .filter(m => m.userId !== BENTLY_SYSTEM_ID)
      .slice(0, 6)
      .reverse(); // Chronological order

    // Need at least 3 messages to evaluate tension
    if (humanMessages.length < 3) return;

    // Build context string
    const pair = await db.select().from(pairs).where(eq(pairs.id, pairId)).then(r => r[0]);
    if (!pair) return;

    const chatContext = humanMessages.map(m => {
      const label = m.userId === pair.user1Id ? 'Partner 1' : 'Partner 2';
      return `${label}: ${m.content}`;
    }).join('\n');

    // Call AI (Groq by default — fast and free)
    const response = await aiProviders.groq.complete({
      messages: [
        { role: 'system', content: BENTLY_MEDIATION_SYSTEM_PROMPT },
        { role: 'user', content: chatContext },
      ],
      temperature: 0.4,
      maxTokens: 100,
    });

    const aiContent = response.content.trim();

    // Only intervene if AI says something other than NO_INTERVENTION_NEEDED
    if (aiContent && !aiContent.includes('NO_INTERVENTION_NEEDED')) {
      await db.insert(messages).values({
        pairId,
        userId: BENTLY_SYSTEM_ID,
        content: aiContent,
        type: 'BENTLY_MEDIATION',
      });
    }
  } catch (error) {
    // Silently fail — never block the user's messaging experience
    console.error('[BentlyMediation] Error:', error);
  }
}

export const messagesRouter = router({
  sendMessage: protectedProcedure
    .input(z.object({ pairId: z.string(), content: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await requirePairMembership(input.pairId, ctx.userId!);

      // Insert the user's message immediately
      const result = await db
        .insert(messages)
        .values({
          pairId: input.pairId,
          userId: ctx.userId!,
          content: input.content,
          type: 'TEXT',
        })
        .returning({ id: messages.id });

      // Fire Bently mediation evaluation asynchronously (non-blocking)
      evaluateBentlyMediation(input.pairId).catch(() => {});

      return { messageId: result[0].id };
    }),

  getMessages: protectedProcedure
    .input(z.object({ pairId: z.string() }))
    .query(async ({ ctx, input }) => {
      await requirePairMembership(input.pairId, ctx.userId!);

      const result = await db
        .select()
        .from(messages)
        .where(eq(messages.pairId, input.pairId))
        .orderBy(messages.createdAt);

      return result;
    }),
});
