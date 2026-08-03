// packages/server/src/db/seeds/deeplyUsSeed.ts
// Seeds 12 intimate prompts (via sparks table, isDeeplyUs: true)
// and 6 structured exercises (via exercises table, isDeeplyUs: true).
//
// Run with: npx tsx packages/server/src/db/seeds/deeplyUsSeed.ts
// Requires DATABASE_URL in environment.

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

// ─── 12 Intimate Prompts (Bently's voice, categorized) ──────────────────────
// These go into the `sparks` table with isDeeplyUs = true, type = INTIMATE_PROMPT
// They need a pairId — we'll insert them for all active pairs.

const INTIMATE_PROMPTS = [
  // FANTASY (2)
  {
    category: 'FANTASY',
    content: {
      prompt: "Listen lovely — what's one fantasy you've never said out loud to your partner? Not the safe one. The real one.",
      followUp: "No judgment here. This is between y'all and me.",
    },
  },
  {
    category: 'FANTASY',
    content: {
      prompt: "If there were zero inhibitions and zero consequences — what would you want tonight to look like? Paint the picture.",
      followUp: "Be specific. Vague doesn't help either of you.",
    },
  },
  // DESIRE (2)
  {
    category: 'DESIRE',
    content: {
      prompt: "What does your partner do — without even trying — that turns you on? The thing they probably don't even know about.",
      followUp: "Could be a gesture, a look, the way they move. Name it.",
    },
  },
  {
    category: 'DESIRE',
    content: {
      prompt: "Where on your body do you wish your partner would spend more time? Be honest — they can't read your mind.",
      followUp: "Specificity is kindness here.",
    },
  },
  // INSECURITY (2)
  {
    category: 'INSECURITY',
    content: {
      prompt: "What's one thing about your body that makes you hold back during intimacy? The thing you hope they don't notice.",
      followUp: "This is the hardest one. But saying it takes its power away.",
    },
  },
  {
    category: 'INSECURITY',
    content: {
      prompt: "Is there something you want to ask for in bed but you're afraid it'll change how they see you?",
      followUp: "Fear of judgment kills more desire than anything else. Name it.",
    },
  },
  // EXPLORATION (2)
  {
    category: 'EXPLORATION',
    content: {
      prompt: "What's one thing you've been curious about trying together but haven't brought up yet? Could be small, could be big.",
      followUp: "Curiosity isn't commitment. It's just an open door.",
    },
  },
  {
    category: 'EXPLORATION',
    content: {
      prompt: "If you could add one completely new element to your intimate life — something neither of you has done — what would it be?",
      followUp: "New doesn't mean extreme. It just means unexplored.",
    },
  },
  // CONNECTION (2)
  {
    category: 'CONNECTION',
    content: {
      prompt: "When was the last time you felt genuinely desired by your partner — not just loved, but wanted? What did they do?",
      followUp: "Desire and love aren't the same thing. Both matter.",
    },
  },
  {
    category: 'CONNECTION',
    content: {
      prompt: "What's one intimate moment between you two that still lives in your head? The one you replay.",
      followUp: "Tell them why it stuck. They might not know.",
    },
  },
  // AFTERCARE (2)
  {
    category: 'AFTERCARE',
    content: {
      prompt: "After intimacy — what do you actually need? Not what you think you should need. What makes you feel safe and held.",
      followUp: "Some people need words. Some need silence. Some need touch. What's yours?",
    },
  },
  {
    category: 'AFTERCARE',
    content: {
      prompt: "Has there been a time after being intimate where you felt disconnected or alone — even though they were right there? What would have changed that?",
      followUp: "This isn't blame. It's information they need.",
    },
  },
];

// ─── 6 Structured Exercises ─────────────────────────────────────────────────

const EXERCISES = [
  {
    title: 'Sensate Focus',
    description: 'Take turns exploring each other through touch — no goal, no destination. Just presence. Set a timer for 15 minutes each. The person being touched only communicates what feels good. The person touching only focuses on sensation, not performance.',
    category: 'EXPLORATION',
    duration: 30,
    difficulty: 'MEDIUM',
    xpReward: 75,
  },
  {
    title: 'Desire Mapping',
    description: 'Using the Yes/No/Maybe list in this app, each of you independently marks your responses. Then come together and compare — look for the overlaps first. The maybes are where the real conversation lives.',
    category: 'DESIRE',
    duration: 20,
    difficulty: 'EASY',
    xpReward: 50,
  },
  {
    title: 'Fantasy Share',
    description: 'Each partner shares one fantasy — uninterrupted, no immediate reaction required. The listener\'s only job: "Thank you for telling me that." Discussion comes after, if both want it. No pressure to act on anything shared.',
    category: 'FANTASY',
    duration: 15,
    difficulty: 'HARD',
    xpReward: 100,
  },
  {
    title: 'Yes / No / Maybe List',
    description: 'The classic intimacy exercise. Go through the desire map together — each item gets a Yes (interested), No (not for me), or Maybe (curious but not sure). Compare your lists. Where you both said Yes? That\'s your green light zone.',
    category: 'EXPLORATION',
    duration: 30,
    difficulty: 'MEDIUM',
    xpReward: 75,
  },
  {
    title: 'Aftercare Conversation',
    description: 'Sit together (clothed, relaxed) and answer: "After we\'re intimate, what do I need to feel safe and connected?" Take turns. Write it down. This becomes your aftercare agreement — a living document you can update anytime.',
    category: 'AFTERCARE',
    duration: 15,
    difficulty: 'EASY',
    xpReward: 50,
  },
  {
    title: 'Body Insecurity Share',
    description: 'The vulnerability exercise. Each partner names one thing about their body that makes them self-conscious during intimacy. The listener responds only with what they genuinely find beautiful or attractive about that exact thing. No fixing. No dismissing. Just seeing each other.',
    category: 'INSECURITY',
    duration: 10,
    difficulty: 'HARD',
    xpReward: 100,
  },
];

async function seed() {
  const client = await pool.connect();

  try {
    console.log('[DeeplyUs Seed] Starting...');

    // Seed exercises
    console.log('[DeeplyUs Seed] Inserting 6 exercises...');
    for (const ex of EXERCISES) {
      await client.query(
        `INSERT INTO exercises (title, description, category, duration, difficulty, xp_reward, is_deeply_us)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         ON CONFLICT DO NOTHING`,
        [ex.title, ex.description, ex.category, ex.duration, ex.difficulty, ex.xpReward],
      );
    }
    console.log('[DeeplyUs Seed] ✓ Exercises seeded');

    // Seed prompts for all active pairs
    const pairsResult = await client.query(
      `SELECT id, user1_id, user2_id FROM pairs WHERE status = 'ACTIVE' LIMIT 50`,
    );

    if (pairsResult.rows.length === 0) {
      console.log('[DeeplyUs Seed] No active pairs found. Prompts will be seeded when pairs exist.');
      console.log('[DeeplyUs Seed] Creating prompts without pair assignment (template mode)...');

      // Insert as templates with a placeholder pair (first pair found, or skip)
      const anyPair = await client.query(`SELECT id, user1_id, user2_id FROM pairs LIMIT 1`);
      if (anyPair.rows.length > 0) {
        const pair = anyPair.rows[0];
        for (const prompt of INTIMATE_PROMPTS) {
          await client.query(
            `INSERT INTO sparks (pair_id, type, content, status, user1_id, user2_id, is_deeply_us)
             VALUES ($1, 'INTIMATE_PROMPT', $2, 'UNANSWERED', $3, $4, true)`,
            [pair.id, JSON.stringify(prompt.content), pair.user1_id, pair.user2_id],
          );
        }
        console.log(`[DeeplyUs Seed] ✓ 12 prompts seeded for pair ${pair.id}`);
      }
    } else {
      for (const pair of pairsResult.rows) {
        for (const prompt of INTIMATE_PROMPTS) {
          await client.query(
            `INSERT INTO sparks (pair_id, type, content, status, user1_id, user2_id, is_deeply_us)
             VALUES ($1, 'INTIMATE_PROMPT', $2, 'UNANSWERED', $3, $4, true)`,
            [pair.id, JSON.stringify(prompt.content), pair.user1_id, pair.user2_id],
          );
        }
        console.log(`[DeeplyUs Seed] ✓ 12 prompts seeded for pair ${pair.id}`);
      }
    }

    console.log('[DeeplyUs Seed] Done.');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('[DeeplyUs Seed] Fatal error:', err);
  process.exit(1);
});
