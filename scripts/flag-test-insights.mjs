/**
 * Flag existing insights as test data and rebalance sentiment
 * 
 * Current: Negative 90, Neutral 60, Positive 58
 * Target:  Positive ~50%, Neutral ~30%, Negative ~20%
 * 
 * Run: node scripts/flag-test-insights.mjs
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'devrel-insights';

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env.local');
  process.exit(1);
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const insights = db.collection('insights');
    
    // Step 1: Flag all existing insights as test data
    console.log('\n📌 Step 1: Flagging all insights as test data...');
    const flagResult = await insights.updateMany(
      { isTest: { $ne: true } },
      { 
        $set: { 
          isTest: true,
          testDataNote: 'Flagged as test data on 2026-02-07. Can be filtered out for production reporting.',
        } 
      }
    );
    console.log(`   Flagged ${flagResult.modifiedCount} insights as test data`);
    
    // Step 2: Get current sentiment counts
    console.log('\n📊 Step 2: Current sentiment distribution...');
    const sentimentCounts = await insights.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]).toArray();
    
    const counts = {};
    sentimentCounts.forEach(s => { counts[s._id] = s.count; });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    
    console.log(`   Positive: ${counts.Positive || 0} (${Math.round((counts.Positive || 0) / total * 100)}%)`);
    console.log(`   Neutral:  ${counts.Neutral || 0} (${Math.round((counts.Neutral || 0) / total * 100)}%)`);
    console.log(`   Negative: ${counts.Negative || 0} (${Math.round((counts.Negative || 0) / total * 100)}%)`);
    
    // Step 3: Rebalance to ~50% Positive, ~30% Neutral, ~20% Negative
    // Target: Positive 104, Neutral 62, Negative 42
    const targetPositive = Math.round(total * 0.50);
    const targetNeutral = Math.round(total * 0.30);
    const targetNegative = total - targetPositive - targetNeutral;
    
    console.log(`\n🎯 Target distribution (total: ${total}):`);
    console.log(`   Positive: ${targetPositive} (50%)`);
    console.log(`   Neutral:  ${targetNeutral} (30%)`);
    console.log(`   Negative: ${targetNegative} (20%)`);
    
    // Calculate how many to flip
    const flipNegativeToPositive = Math.max(0, (counts.Negative || 0) - targetNegative);
    const currentPositive = counts.Positive || 0;
    const needMorePositive = targetPositive - currentPositive;
    const flipToPositive = Math.min(flipNegativeToPositive, needMorePositive);
    
    console.log(`\n🔄 Step 3: Flipping ${flipToPositive} Negative → Positive...`);
    
    if (flipToPositive > 0) {
      // Get random negative insights to flip
      const negativesToFlip = await insights.find({ sentiment: 'Negative' })
        .limit(flipToPositive)
        .toArray();
      
      const idsToFlip = negativesToFlip.map(i => i._id);
      
      const flipResult = await insights.updateMany(
        { _id: { $in: idsToFlip } },
        { 
          $set: { 
            sentiment: 'Positive',
            sentimentFlippedFromTest: 'Negative', // Track original for reference
          } 
        }
      );
      
      console.log(`   Flipped ${flipResult.modifiedCount} insights to Positive`);
    }
    
    // Step 4: Verify final distribution
    console.log('\n✅ Step 4: Final sentiment distribution...');
    const finalCounts = await insights.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]).toArray();
    
    const finalTotal = finalCounts.reduce((a, b) => a + b.count, 0);
    finalCounts.forEach(s => {
      console.log(`   ${s._id}: ${s.count} (${Math.round(s.count / finalTotal * 100)}%)`);
    });
    
    console.log('\n✨ Done! All insights flagged with isTest: true');
    console.log('   To filter out test data in queries, use: { isTest: { $ne: true } }');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
