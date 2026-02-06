import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';

let mongoServer: MongoMemoryServer;
let mongoClient: MongoClient;

// Set environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.SMTP_FROM = 'test@test.com';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
    verify: jest.fn().mockResolvedValue(true),
  }),
}));

beforeAll(async () => {
  // Start in-memory MongoDB (longer timeout for binary download on first run)
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;
  
  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  
  // Store client for tests
  (global as any).__MONGO_CLIENT__ = mongoClient;
  (global as any).__MONGO_DB__ = mongoClient.db('test');
});

afterAll(async () => {
  if (mongoClient) {
    await mongoClient.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Clean up collections between tests
afterEach(async () => {
  const db = (global as any).__MONGO_DB__;
  if (db) {
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }
  }
});
