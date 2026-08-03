import { db } from '../index.js';
import { pairs } from '../schema.js';
import { seedSparksForPair } from './sparkTemplates.js';

async function main() {
  console.log('🔥 Sparks Seed Script Starting...');

  // Find the first available pair
  const allPairs = await db!.select().from(pairs).limit(1);

  if (allPairs.length === 0) {
    console.error('❌ No pairs found in the database. Create a pair first.');
    process.exit(1);
  }

  const pairId = allPairs[0].id;
  console.log(`✅ Found pair: ${pairId}`);

  // Seed 3 CommonGround sparks
  await seedSparksForPair(pairId, 3, false);

  // Seed 3 DeeplyUs sparks
  await seedSparksForPair(pairId, 3, true);

  console.log('🎉 Sparks seeding complete!');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
