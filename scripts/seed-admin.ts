/**
 * Seed admin user for DevRel Insights
 * Run: npx tsx scripts/seed-admin.ts
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function seed() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || 'devrel-insights';

  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);

    // Create admin advocate
    const advocate = {
      _id: 'advocate_mike_lynn',
      name: 'Mike Lynn',
      email: 'michael.lynn@mongodb.com',
      role: 'Principal Staff DA',
      region: 'AMER',
      isAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.collection('advocates').updateOne(
      { email: advocate.email },
      { $set: advocate },
      { upsert: true }
    );

    console.log('✅ Admin advocate created:', advocate.email);

    // Create indexes
    await db.collection('advocates').createIndex({ email: 1 }, { unique: true });
    await db.collection('events').createIndex({ startDate: -1 });
    await db.collection('insights').createIndex({ capturedAt: -1 });
    await db.collection('magic_links').createIndex({ token: 1 }, { unique: true });
    await db.collection('magic_links').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

    console.log('✅ Indexes created');

  } finally {
    await client.close();
  }
}

seed().catch(console.error);
