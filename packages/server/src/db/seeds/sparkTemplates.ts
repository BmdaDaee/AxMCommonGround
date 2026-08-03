import { db } from '../index.js';
import { sparks } from '../schema.js';

export const sparkTemplates = [
  // COMMONGROUND (isDeeplyUs: false)
  { type: 'FINISH_SENTENCE', isDeeplyUs: false, content: { prompt: "The very first thing I noticed about you when we met was..." } },
  { type: 'FINISH_SENTENCE', isDeeplyUs: false, content: { prompt: "A compliment I've been holding onto and meaning to give you lately is..." } },
  { type: 'FINISH_SENTENCE', isDeeplyUs: false, content: { prompt: "When I think about our future together, the thing I look forward to most is..." } },
  { type: 'WOULD_YOU_RATHER', isDeeplyUs: false, content: { optionA: "Have a quiet, cozy night in with just the two of us", optionB: "Get dressed up and go out for an unpredictable night on the town" } },
  { type: 'WOULD_YOU_RATHER', isDeeplyUs: false, content: { optionA: "Know every detail of your partner's past", optionB: "Let the past remain a complete mystery" } },
  { type: 'RATE_DAY', isDeeplyUs: false, content: { prompt: "How aligned and connected did you feel with me today?" } },

  // DEEPLYUS (isDeeplyUs: true)
  { type: 'FINISH_SENTENCE', isDeeplyUs: true, content: { prompt: "If we were completely alone right now, the first thing I would do is..." } },
  { type: 'FINISH_SENTENCE', isDeeplyUs: true, content: { prompt: "If you leaned over and whispered something in my ear tonight, I'd want it to be..." } },
  { type: 'FINISH_SENTENCE', isDeeplyUs: true, content: { prompt: "My absolute biggest weakness when it comes to you is..." } },
  { type: 'FINISH_SENTENCE', isDeeplyUs: true, content: { prompt: "A secret fantasy or desire I've been too nervous to tell you about is..." } },
  { type: 'WOULD_YOU_RATHER', isDeeplyUs: true, content: { optionA: "Take full control in the bedroom tonight", optionB: "Completely surrender control to me tonight" } },
  { type: 'WOULD_YOU_RATHER', isDeeplyUs: true, content: { optionA: "Experience a slow, passionate, hours-long session", optionB: "Have a spontaneous, intense quickie somewhere risky" } },
];

export async function seedSparksForPair(pairId: string, count: number = 3, deeplyUs: boolean = false) {
  const pool = sparkTemplates.filter(spark => spark.isDeeplyUs === deeplyUs);
  const shuffled = pool.sort(() => 0.5 - Math.random());
  const selectedSparks = shuffled.slice(0, count);

  const insertData = selectedSparks.map(spark => ({
    pairId: pairId,
    type: spark.type as any,
    content: spark.content,
    isDeeplyUs: spark.isDeeplyUs,
    status: 'UNANSWERED' as const,
  }));

  await db!.insert(sparks).values(insertData);
  console.log(`Seeded ${count} Sparks for Pair: ${pairId} (DeeplyUs: ${deeplyUs})`);
}
