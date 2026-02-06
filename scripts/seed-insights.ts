/**
 * Seed script to generate realistic insight data
 * Run: npx tsx scripts/seed-insights.ts
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB || 'devrel-insights';

// Realistic advocate names (MongoDB DevRel team)
const advocates = [
  { id: 'adv_001', name: 'Sarah Chen' },
  { id: 'adv_002', name: 'Marcus Johnson' },
  { id: 'adv_003', name: 'Priya Sharma' },
  { id: 'adv_004', name: 'Alex Rivera' },
  { id: 'adv_005', name: 'Jordan Kim' },
  { id: 'adv_006', name: 'Taylor Brooks' },
  { id: 'adv_007', name: 'Chris Martinez' },
  { id: 'adv_008', name: 'Morgan Lee' },
];

// Sample events
const events = [
  { id: 'evt_001', name: 'MongoDB.local NYC 2026', location: 'New York, NY' },
  { id: 'evt_002', name: 'AWS re:Invent', location: 'Las Vegas, NV' },
  { id: 'evt_003', name: 'KubeCon NA', location: 'Chicago, IL' },
  { id: 'evt_004', name: 'MongoDB.local London', location: 'London, UK' },
  { id: 'evt_005', name: 'Developer Week SF', location: 'San Francisco, CA' },
  { id: 'evt_006', name: 'PyCon US', location: 'Pittsburgh, PA' },
  { id: 'evt_007', name: 'NodeConf EU', location: 'Dublin, Ireland' },
  { id: 'evt_008', name: 'MongoDB World', location: 'New York, NY' },
];

// Insight templates by type
const insightTemplates: Record<string, string[]> = {
  'Feature Request': [
    'Would love to see better integration with Terraform for Atlas cluster provisioning',
    'Need ability to pause clusters on a schedule to save costs in dev environments',
    'Requesting GraphQL support directly in Atlas without needing a separate service',
    'Want native support for time-series data with automatic rollups',
    'Could really use a visual query builder in Compass for aggregation pipelines',
    'Need better tooling for schema versioning and migrations',
    'Requesting webhook notifications for Atlas alerts to integrate with PagerDuty',
    'Would be great to have a local emulator for Atlas Search during development',
    'Need multi-region active-active replication for our global app',
    'Want ability to set per-collection encryption keys for compliance',
  ],
  'Bug Report': [
    'Compass crashes when trying to export large collections (>1M docs)',
    'Atlas Search synonyms not working correctly with phrase queries',
    'Connection pooling issues in Node.js driver when using transactions',
    'Slow query analyzer shows incorrect index suggestions for compound indexes',
    'Atlas triggers sometimes fire twice for the same document change',
    'Change streams occasionally miss events during primary elections',
    'Performance Advisor recommendations conflict with each other',
    'mongosh autocomplete breaks with special characters in field names',
  ],
  'Pain Point': [
    'Aggregation pipeline syntax is hard to learn for SQL developers on my team',
    'Cost visibility in Atlas is confusing - hard to predict monthly bills',
    'Setting up proper security with VPC peering took way too long',
    'Documentation for sharding best practices is scattered across multiple pages',
    'Backup and restore process for large clusters needs better progress indicators',
    'Index builds blocking writes is a major pain point for zero-downtime deploys',
    'Understanding the difference between read preferences is confusing',
    'Migrating from self-hosted to Atlas has too many manual steps',
  ],
  'Positive Feedback': [
    'Atlas Vector Search was incredibly easy to set up - had RAG working in an hour',
    'Love the new Atlas UI redesign - much more intuitive navigation',
    'Aggregation pipeline performance is amazing - 10x faster than our previous solution',
    'The MongoDB University courses are excellent - just got my associate cert',
    'Support response time has been fantastic - resolved our issue in 2 hours',
    'Change streams are a game changer for our real-time features',
    'Realm SDK made mobile sync trivial to implement',
    'Atlas Charts saved us from building a custom dashboard solution',
  ],
  'Competitive Intel': [
    'Team was considering DynamoDB but chose MongoDB for flexible schema',
    'Customer migrated from Couchbase due to better developer experience',
    'Competitor Fauna mentioned as alternative but concerns about vendor lock-in',
    'PostgreSQL with JSON was evaluated but aggregation was too slow',
    'Redis being used alongside MongoDB for caching - asked about in-memory features',
    'Customer compared Atlas Search vs Elasticsearch - loved unified platform',
  ],
  'Use Case': [
    'Building a real-time inventory system for 50K SKUs across 200 stores',
    'IoT sensor data from 10K devices with time-series workload',
    'Multi-tenant SaaS platform with per-customer data isolation',
    'Content management system for a major news publisher',
    'Financial transaction ledger requiring strong consistency',
    'Gaming platform with player profiles and leaderboards',
    'Healthcare records system with strict compliance requirements',
    'E-commerce product catalog with faceted search',
  ],
  'Documentation': [
    'Docs for Spring Data MongoDB are outdated - still showing deprecated methods',
    'Need more examples of production-ready aggregation pipelines',
    'Atlas Kubernetes Operator docs missing common troubleshooting scenarios',
    'Would help to have architecture diagrams in the best practices guide',
    'Migration guide from MySQL needs more detailed schema mapping examples',
  ],
  'General Feedback': [
    'The booth was too crowded - consider more demo stations next time',
    'Workshop was too advanced - need beginner track option',
    'Really appreciated the hands-on lab format at this conference',
    'Swag quality was great - everyone loved the MongoDB socks',
    'Would be helpful to have session recordings available after the event',
  ],
};

const productAreas = [
  'Atlas',
  'Atlas Search',
  'Atlas Vector Search',
  'Charts',
  'Compass',
  'Drivers',
  'Realm',
  'mongosh',
  'Atlas Triggers',
  'Change Streams',
  'Aggregation Framework',
  'Kubernetes Operator',
  'Atlas Data Lake',
  'Performance Advisor',
];

const sentiments = ['Positive', 'Neutral', 'Negative'];
const priorities = ['Critical', 'High', 'Medium', 'Low'];

const developerRoles = ['Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'Tech Lead', 'Architect'];
const experienceLevels = ['Junior', 'Mid-Level', 'Senior', 'Staff+'];
const companySizes = ['Startup (1-50)', 'SMB (51-500)', 'Mid-Market (501-2000)', 'Enterprise (2000+)'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return pastDate;
}

function generateInsight(advocate: typeof advocates[0], event: typeof events[0]) {
  const type = randomItem(Object.keys(insightTemplates));
  const templates = insightTemplates[type];
  const text = randomItem(templates);
  
  // Weight sentiment based on type
  let sentiment: string;
  if (type === 'Positive Feedback') {
    sentiment = 'Positive';
  } else if (type === 'Bug Report' || type === 'Pain Point') {
    sentiment = Math.random() > 0.3 ? 'Negative' : 'Neutral';
  } else {
    sentiment = randomItem(sentiments);
  }

  // Weight priority based on type
  let priority: string;
  if (type === 'Bug Report') {
    priority = Math.random() > 0.5 ? randomItem(['Critical', 'High']) : randomItem(['Medium', 'Low']);
  } else if (type === 'Feature Request') {
    priority = randomItem(['High', 'Medium', 'Medium', 'Low']);
  } else {
    priority = randomItem(priorities);
  }

  const capturedAt = randomDate(90); // Last 90 days

  return {
    _id: new ObjectId().toString(),
    text,
    type,
    sentiment,
    priority,
    productAreas: randomItems(productAreas, 1, 3),
    eventId: event.id,
    eventName: event.name,
    sessionId: null,
    advocateId: advocate.id,
    advocateName: advocate.name,
    developerInfo: {
      role: randomItem(developerRoles),
      experience: randomItem(experienceLevels),
      companySize: randomItem(companySizes),
    },
    tags: [],
    followUpRequired: type === 'Bug Report' || priority === 'Critical' ? Math.random() > 0.5 : false,
    capturedAt: capturedAt.toISOString(),
    createdAt: capturedAt.toISOString(),
    updatedAt: capturedAt.toISOString(),
    synced: true,
  };
}

async function seed() {
  console.log('🌱 Seeding DevRel Insights database...\n');
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(dbName);
    
    // Seed events first
    const eventsCol = db.collection('events');
    const existingEvents = await eventsCol.countDocuments();
    if (existingEvents === 0) {
      console.log('📅 Seeding events...');
      const eventDocs = events.map((e) => ({
        _id: e.id,
        name: e.name,
        location: e.location,
        startDate: randomDate(60).toISOString(),
        endDate: randomDate(55).toISOString(),
        insightCount: 0,
        createdAt: new Date().toISOString(),
      }));
      await eventsCol.insertMany(eventDocs);
      console.log(`   ✓ Created ${events.length} events`);
    } else {
      console.log(`📅 Events already exist (${existingEvents}), skipping...`);
    }

    // Seed advocates
    const advocatesCol = db.collection('advocates');
    const existingAdvocates = await advocatesCol.countDocuments();
    if (existingAdvocates === 0) {
      console.log('👥 Seeding advocates...');
      const advocateDocs = advocates.map((a) => ({
        _id: a.id,
        name: a.name,
        email: `${a.name.toLowerCase().replace(' ', '.')}@mongodb.com`,
        createdAt: new Date().toISOString(),
      }));
      await advocatesCol.insertMany(advocateDocs);
      console.log(`   ✓ Created ${advocates.length} advocates`);
    } else {
      console.log(`👥 Advocates already exist (${existingAdvocates}), skipping...`);
    }

    // Generate insights with varying counts per advocate
    console.log('💡 Generating insights...');
    const insightsCol = db.collection('insights');
    
    // Clear existing insights if you want fresh data
    // await insightsCol.deleteMany({});
    
    const insights: ReturnType<typeof generateInsight>[] = [];
    
    // Give each advocate a different number of insights (simulates varied activity)
    const advocateActivity = [
      { advocate: advocates[0], count: 45 },  // Top performer
      { advocate: advocates[1], count: 38 },
      { advocate: advocates[2], count: 32 },
      { advocate: advocates[3], count: 28 },
      { advocate: advocates[4], count: 22 },
      { advocate: advocates[5], count: 18 },
      { advocate: advocates[6], count: 12 },
      { advocate: advocates[7], count: 8 },   // Least active
    ];

    for (const { advocate, count } of advocateActivity) {
      for (let i = 0; i < count; i++) {
        const event = randomItem(events);
        insights.push(generateInsight(advocate, event));
      }
    }

    if (insights.length > 0) {
      await insightsCol.insertMany(insights as any[]);
      console.log(`   ✓ Created ${insights.length} insights`);
    }

    // Update event insight counts
    console.log('📊 Updating event insight counts...');
    for (const event of events) {
      const count = await insightsCol.countDocuments({ eventId: event.id });
      await eventsCol.updateOne({ _id: event.id }, { $set: { insightCount: count } });
    }
    console.log('   ✓ Updated event counts');

    // Summary stats
    const byType = await insightsCol.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]).toArray();

    console.log('\n📈 Summary:');
    console.log(`   Total insights: ${insights.length}`);
    console.log('   By type:');
    for (const { _id, count } of byType) {
      console.log(`      ${_id}: ${count}`);
    }

    console.log('\n✅ Seeding complete!');
    
  } finally {
    await client.close();
  }
}

seed().catch(console.error);
