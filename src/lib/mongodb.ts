/**
 * DevRel Insights Admin - MongoDB Connection
 */

import { MongoClient, Db } from 'mongodb';

const dbName = process.env.MONGODB_DB || 'devrel-insights';

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (clientPromise) return clientPromise;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please add MONGODB_URI to .env.local');
  }

  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve connection across HMR
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      const client = new MongoClient(uri);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    // In production, create a new client
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export async function getCollection<T extends Document>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

// Collection names (shared with mobile app)
export const collections = {
  insights: 'insights',
  events: 'events',
  sessions: 'sessions',
  advocates: 'advocates',
  reactions: 'reactions',
} as const;

// Reaction types (LinkedIn-style)
export const REACTION_TYPES = ['like', 'love', 'insightful', 'celebrate', 'fire'] as const;
export type ReactionType = typeof REACTION_TYPES[number];

export const REACTION_EMOJI: Record<ReactionType, string> = {
  like: '👍',
  love: '❤️',
  insightful: '💡',
  celebrate: '👏',
  fire: '🔥',
};

export default getClientPromise;
