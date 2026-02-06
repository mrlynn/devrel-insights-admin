import { Db, ObjectId } from 'mongodb';

describe('Insights API', () => {
  let db: Db;

  beforeEach(async () => {
    db = (global as any).__MONGO_DB__;
  });

  describe('Insight Storage', () => {
    it('stores insight with all required fields', async () => {
      const insightsCol = db.collection('insights');
      const now = new Date().toISOString();

      const insight = {
        _id: new ObjectId().toString(),
        type: 'Feature Request',
        productAreas: ['Atlas', 'Charts'],
        text: 'Add support for dark mode in Charts',
        sentiment: 'Positive',
        priority: 'High',
        tags: ['ui', 'charts', 'dark-mode'],
        eventId: 'event-123',
        eventName: 'MongoDB Developer Day NYC',
        advocateId: 'advocate-456',
        advocateName: 'Mike Lynn',
        developerInfo: {
          role: 'Backend Developer',
          experience: '5+ years',
        },
        followUpRequired: false,
        capturedAt: now,
        createdAt: now,
        updatedAt: now,
        synced: true,
      };

      await insightsCol.insertOne(insight as any);

      const stored = await insightsCol.findOne({ _id: insight._id });
      
      expect(stored).toBeTruthy();
      expect(stored?.type).toBe('Feature Request');
      expect(stored?.productAreas).toContain('Atlas');
      expect(stored?.productAreas).toContain('Charts');
      expect(stored?.text).toBe('Add support for dark mode in Charts');
      expect(stored?.sentiment).toBe('Positive');
      expect(stored?.priority).toBe('High');
      expect(stored?.tags).toHaveLength(3);
      expect(stored?.advocateName).toBe('Mike Lynn');
    });

    it('stores insight without optional fields', async () => {
      const insightsCol = db.collection('insights');
      const now = new Date().toISOString();

      const insight = {
        _id: new ObjectId().toString(),
        type: 'General Feedback',
        productAreas: ['Atlas'],
        text: 'Simple feedback',
        sentiment: 'Neutral',
        priority: 'Medium',
        tags: [],
        advocateId: 'advocate-456',
        advocateName: 'Local User',
        capturedAt: now,
        createdAt: now,
        updatedAt: now,
        synced: true,
      };

      await insightsCol.insertOne(insight as any);

      const stored = await insightsCol.findOne({ _id: insight._id });
      
      expect(stored).toBeTruthy();
      expect(stored?.eventId).toBeUndefined();
      expect(stored?.sessionId).toBeUndefined();
    });

    it('updates event insight count when linked', async () => {
      const eventsCol = db.collection('events');
      const insightsCol = db.collection('insights');
      const now = new Date().toISOString();

      // Create event
      const eventId = new ObjectId().toString();
      await eventsCol.insertOne({
        _id: eventId,
        name: 'Test Event',
        status: 'Confirmed',
        insightCount: 0,
        createdAt: now,
        updatedAt: now,
      } as any);

      // Create insight linked to event
      const insight = {
        _id: new ObjectId().toString(),
        type: 'Feature Request',
        productAreas: ['Atlas'],
        text: 'Test insight',
        sentiment: 'Positive',
        priority: 'Medium',
        tags: [],
        eventId: eventId,
        advocateId: 'advocate-456',
        advocateName: 'Test User',
        capturedAt: now,
        createdAt: now,
        updatedAt: now,
        synced: true,
      };

      await insightsCol.insertOne(insight as any);

      // Simulate the API incrementing insightCount
      await eventsCol.updateOne(
        { _id: eventId },
        { $inc: { insightCount: 1 } }
      );

      const event = await eventsCol.findOne({ _id: eventId });
      expect(event?.insightCount).toBe(1);
    });
  });

  describe('Insight Queries', () => {
    beforeEach(async () => {
      const insightsCol = db.collection('insights');
      const now = new Date().toISOString();
      
      // Seed test data
      await insightsCol.insertMany([
        {
          _id: new ObjectId().toString(),
          type: 'Feature Request',
          productAreas: ['Atlas'],
          text: 'Feature 1',
          sentiment: 'Positive',
          priority: 'High',
          tags: ['important'],
          eventId: 'event-1',
          advocateId: 'adv-1',
          advocateName: 'User 1',
          capturedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: new ObjectId().toString(),
          type: 'Bug Report',
          productAreas: ['Charts'],
          text: 'Bug 1',
          sentiment: 'Negative',
          priority: 'Critical',
          tags: ['bug'],
          eventId: 'event-1',
          advocateId: 'adv-2',
          advocateName: 'User 2',
          capturedAt: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: new ObjectId().toString(),
          type: 'Feature Request',
          productAreas: ['Search'],
          text: 'Feature 2',
          sentiment: 'Positive',
          priority: 'Medium',
          tags: [],
          eventId: 'event-2',
          advocateId: 'adv-1',
          advocateName: 'User 1',
          capturedAt: now,
          createdAt: now,
          updatedAt: now,
        },
      ] as any);
    });

    it('filters by eventId', async () => {
      const insightsCol = db.collection('insights');
      
      const insights = await insightsCol.find({ eventId: 'event-1' }).toArray();
      
      expect(insights).toHaveLength(2);
    });

    it('filters by type', async () => {
      const insightsCol = db.collection('insights');
      
      const insights = await insightsCol.find({ type: 'Feature Request' }).toArray();
      
      expect(insights).toHaveLength(2);
    });

    it('filters by sentiment', async () => {
      const insightsCol = db.collection('insights');
      
      const insights = await insightsCol.find({ sentiment: 'Negative' }).toArray();
      
      expect(insights).toHaveLength(1);
      expect(insights[0].type).toBe('Bug Report');
    });

    it('filters by priority', async () => {
      const insightsCol = db.collection('insights');
      
      const insights = await insightsCol.find({ priority: 'Critical' }).toArray();
      
      expect(insights).toHaveLength(1);
    });

    it('supports pagination', async () => {
      const insightsCol = db.collection('insights');
      
      const page1 = await insightsCol.find({}).limit(2).toArray();
      const page2 = await insightsCol.find({}).skip(2).limit(2).toArray();
      
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });

    it('sorts by capturedAt descending', async () => {
      const insightsCol = db.collection('insights');
      
      // Add insights with different times
      await insightsCol.deleteMany({});
      await insightsCol.insertMany([
        { _id: '1', text: 'Old', capturedAt: '2026-01-01T00:00:00Z' },
        { _id: '2', text: 'New', capturedAt: '2026-02-01T00:00:00Z' },
        { _id: '3', text: 'Middle', capturedAt: '2026-01-15T00:00:00Z' },
      ] as any);
      
      const insights = await insightsCol.find({}).sort({ capturedAt: -1 }).toArray();
      
      expect(insights[0].text).toBe('New');
      expect(insights[2].text).toBe('Old');
    });
  });

  describe('Insight Aggregations', () => {
    beforeEach(async () => {
      const insightsCol = db.collection('insights');
      
      await insightsCol.insertMany([
        { type: 'Feature Request', sentiment: 'Positive', priority: 'High', productAreas: ['Atlas'] },
        { type: 'Feature Request', sentiment: 'Positive', priority: 'Medium', productAreas: ['Atlas', 'Charts'] },
        { type: 'Bug Report', sentiment: 'Negative', priority: 'Critical', productAreas: ['Charts'] },
        { type: 'General Feedback', sentiment: 'Neutral', priority: 'Low', productAreas: ['Search'] },
      ] as any);
    });

    it('aggregates by type', async () => {
      const insightsCol = db.collection('insights');
      
      const byType = await insightsCol.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();
      
      expect(byType).toHaveLength(3);
      expect(byType.find(t => t._id === 'Feature Request')?.count).toBe(2);
    });

    it('aggregates by sentiment', async () => {
      const insightsCol = db.collection('insights');
      
      const bySentiment = await insightsCol.aggregate([
        { $group: { _id: '$sentiment', count: { $sum: 1 } } },
      ]).toArray();
      
      expect(bySentiment.find(s => s._id === 'Positive')?.count).toBe(2);
      expect(bySentiment.find(s => s._id === 'Negative')?.count).toBe(1);
      expect(bySentiment.find(s => s._id === 'Neutral')?.count).toBe(1);
    });

    it('aggregates by productArea', async () => {
      const insightsCol = db.collection('insights');
      
      const byArea = await insightsCol.aggregate([
        { $unwind: '$productAreas' },
        { $group: { _id: '$productAreas', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();
      
      expect(byArea.find(a => a._id === 'Atlas')?.count).toBe(2);
      expect(byArea.find(a => a._id === 'Charts')?.count).toBe(2);
      expect(byArea.find(a => a._id === 'Search')?.count).toBe(1);
    });
  });
});
