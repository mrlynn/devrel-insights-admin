#!/usr/bin/env node
/**
 * Setup reactions collection indexes
 * Run: node scripts/setup-reactions.mjs
 */

import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'devrel-insights';

if (!uri) {
  console.error('❌ MONGODB_URI not set in .env.local');
  process.exit(1);
}

async function setup() {
  console.log('🔧 Setting up reactions collection...\n');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    const reactions = db.collection('reactions');
    const insights = db.collection('insights');

    // Create indexes on reactions collection
    console.log('📇 Creating indexes on reactions collection...');
    
    // Compound unique index: one reaction per user per insight
    await reactions.createIndex(
      { insightId: 1, advocateId: 1 },
      { unique: true, name: 'insightId_advocateId_unique' }
    );
    console.log('  ✓ Created unique index on (insightId, advocateId)');

    // Index for finding all reactions by insight
    await reactions.createIndex(
      { insightId: 1, createdAt: -1 },
      { name: 'insightId_createdAt' }
    );
    console.log('  ✓ Created index on (insightId, createdAt)');

    // Index for finding all reactions by user
    await reactions.createIndex(
      { advocateId: 1, createdAt: -1 },
      { name: 'advocateId_createdAt' }
    );
    console.log('  ✓ Created index on (advocateId, createdAt)');

    // Index for aggregation by type
    await reactions.createIndex(
      { type: 1 },
      { name: 'type' }
    );
    console.log('  ✓ Created index on type');

    // Create indexes on insights collection for popular feed
    console.log('\n📇 Creating indexes on insights collection...');
    
    await insights.createIndex(
      { reactionTotal: -1, capturedAt: -1 },
      { name: 'reactionTotal_capturedAt' }
    );
    console.log('  ✓ Created index on (reactionTotal, capturedAt)');

    await insights.createIndex(
      { 'reactionCounts.love': -1, reactionTotal: -1 },
      { name: 'reactionCounts_love' }
    );
    console.log('  ✓ Created index on (reactionCounts.love, reactionTotal)');

    await insights.createIndex(
      { 'reactionCounts.insightful': -1, reactionTotal: -1 },
      { name: 'reactionCounts_insightful' }
    );
    console.log('  ✓ Created index on (reactionCounts.insightful, reactionTotal)');

    // Initialize reactionCounts and reactionTotal on existing insights if missing
    console.log('\n🔄 Initializing reaction fields on existing insights...');
    
    const result = await insights.updateMany(
      { reactionCounts: { $exists: false } },
      { 
        $set: { 
          reactionCounts: { like: 0, love: 0, insightful: 0, celebrate: 0, fire: 0 },
          reactionTotal: 0 
        } 
      }
    );
    console.log(`  ✓ Updated ${result.modifiedCount} insights with default reaction fields`);

    // Get stats
    console.log('\n📊 Collection stats:');
    const reactionCount = await reactions.countDocuments();
    const insightCount = await insights.countDocuments();
    const insightsWithReactions = await insights.countDocuments({ reactionTotal: { $gt: 0 } });
    
    console.log(`  • Reactions: ${reactionCount}`);
    console.log(`  • Insights: ${insightCount}`);
    console.log(`  • Insights with reactions: ${insightsWithReactions}`);

    console.log('\n✅ Setup complete!');
    console.log('\nAPI Endpoints:');
    console.log('  POST   /api/insights/[id]/react   - Add/toggle reaction');
    console.log('  DELETE /api/insights/[id]/react   - Remove reaction');
    console.log('  GET    /api/insights/[id]/react   - Get reactions for insight');
    console.log('  GET    /api/insights/popular      - Popular insights feed');
    console.log('  POST   /api/insights/popular      - Reaction stats (action=stats)');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

setup();
