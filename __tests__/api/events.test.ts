import { Db, ObjectId } from 'mongodb';

describe('Events API', () => {
  let db: Db;

  beforeEach(async () => {
    db = (global as any).__MONGO_DB__;
  });

  describe('Event Storage', () => {
    it('stores event with all fields from PMO import', async () => {
      const eventsCol = db.collection('events');
      const now = new Date().toISOString();

      const event = {
        _id: new ObjectId().toString(),
        name: 'MongoDB Developer Day NYC',
        status: 'Confirmed',
        region: 'AMER',
        audienceType: 'Account Specific',
        engagementType: 'Developer Day',
        format: 'In Person',
        eventType: 'Customer Engagement',
        location: 'New York, NY',
        venue: 'MongoDB HQ',
        timezone: 'America/New_York',
        description: 'Hands-on workshop for enterprise developers',
        isVirtual: false,
        account: {
          name: 'Acme Corp',
          segment: 'Enterprise',
          sfAccountId: 'SF-12345',
        },
        startDate: '2026-03-15',
        endDate: '2026-03-15',
        estimatedAttendees: 50,
        actualAttendees: null,
        technicalTheme: 'Vector Search & AI',
        customerMotivation: 'Modernize data platform',
        contacts: {
          requester: 'John Smith',
          saAssigned: 'Jane Doe',
          customerChampion: {
            name: 'Bob Wilson',
            title: 'CTO',
          },
          partners: ['AWS', 'Datadog'],
        },
        projectTrackerUrl: 'https://tracker.example.com/123',
        advocateIds: ['adv-1', 'adv-2'],
        assignments: [
          { advocateName: 'Mike Lynn', assignmentType: 'Lead' },
          { advocateName: 'Sarah Chen', assignmentType: 'Support' },
        ],
        insightCount: 0,
        geo: {
          type: 'Point',
          coordinates: [-74.0060, 40.7128],
        },
        geoCity: 'New York',
        geoCountry: 'United States',
        createdAt: now,
        updatedAt: now,
        synced: true,
      };

      await eventsCol.insertOne(event as any);

      const stored = await eventsCol.findOne({ _id: event._id });
      
      expect(stored).toBeTruthy();
      expect(stored?.name).toBe('MongoDB Developer Day NYC');
      expect(stored?.status).toBe('Confirmed');
      expect(stored?.region).toBe('AMER');
      expect(stored?.account?.name).toBe('Acme Corp');
      expect(stored?.geo?.coordinates).toEqual([-74.0060, 40.7128]);
      expect(stored?.assignments).toHaveLength(2);
    });

    it('stores event with minimal fields', async () => {
      const eventsCol = db.collection('events');
      const now = new Date().toISOString();

      const event = {
        _id: new ObjectId().toString(),
        name: 'Quick Meetup',
        status: 'Draft',
        location: 'TBD',
        insightCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await eventsCol.insertOne(event as any);

      const stored = await eventsCol.findOne({ _id: event._id });
      
      expect(stored).toBeTruthy();
      expect(stored?.name).toBe('Quick Meetup');
      expect(stored?.region).toBeUndefined();
      expect(stored?.account).toBeUndefined();
    });
  });

  describe('Event Queries', () => {
    beforeEach(async () => {
      const eventsCol = db.collection('events');
      const now = new Date().toISOString();

      await eventsCol.insertMany([
        {
          _id: 'event-1',
          name: 'NYC Developer Day',
          status: 'Confirmed',
          region: 'AMER',
          startDate: '2026-03-15',
          endDate: '2026-03-15',
          location: 'New York, NY',
          insightCount: 5,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: 'event-2',
          name: 'London Workshop',
          status: 'Confirmed',
          region: 'EMEA',
          startDate: '2026-04-01',
          endDate: '2026-04-02',
          location: 'London, UK',
          insightCount: 3,
          createdAt: now,
          updatedAt: now,
        },
        {
          _id: 'event-3',
          name: 'SF Meetup',
          status: 'Completed',
          region: 'AMER',
          startDate: '2026-01-15',
          endDate: '2026-01-15',
          location: 'San Francisco, CA',
          insightCount: 10,
          createdAt: now,
          updatedAt: now,
        },
      ] as any);
    });

    it('filters by status', async () => {
      const eventsCol = db.collection('events');
      
      const confirmed = await eventsCol.find({ status: 'Confirmed' }).toArray();
      
      expect(confirmed).toHaveLength(2);
    });

    it('filters by region', async () => {
      const eventsCol = db.collection('events');
      
      const amer = await eventsCol.find({ region: 'AMER' }).toArray();
      
      expect(amer).toHaveLength(2);
    });

    it('finds upcoming events', async () => {
      const eventsCol = db.collection('events');
      const today = '2026-02-06';
      
      const upcoming = await eventsCol.find({
        endDate: { $gte: today },
      }).toArray();
      
      expect(upcoming).toHaveLength(2);
    });

    it('finds past events', async () => {
      const eventsCol = db.collection('events');
      const today = '2026-02-06';
      
      const past = await eventsCol.find({
        endDate: { $lt: today },
      }).toArray();
      
      expect(past).toHaveLength(1);
      expect(past[0].name).toBe('SF Meetup');
    });

    it('sorts by startDate', async () => {
      const eventsCol = db.collection('events');
      
      const events = await eventsCol.find({}).sort({ startDate: 1 }).toArray();
      
      expect(events[0].name).toBe('SF Meetup');
      expect(events[2].name).toBe('London Workshop');
    });
  });

  describe('Geospatial Queries', () => {
    beforeEach(async () => {
      const eventsCol = db.collection('events');
      
      // Create 2dsphere index
      await eventsCol.createIndex({ geo: '2dsphere' });

      await eventsCol.insertMany([
        {
          _id: 'event-nyc',
          name: 'NYC Event',
          location: 'New York, NY',
          geo: { type: 'Point', coordinates: [-74.0060, 40.7128] },
        },
        {
          _id: 'event-sf',
          name: 'SF Event',
          location: 'San Francisco, CA',
          geo: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        },
        {
          _id: 'event-london',
          name: 'London Event',
          location: 'London, UK',
          geo: { type: 'Point', coordinates: [-0.1276, 51.5074] },
        },
      ] as any);
    });

    it('finds events near a location', async () => {
      const eventsCol = db.collection('events');
      
      // Find events within 500km of NYC
      const nearNYC = await eventsCol.find({
        geo: {
          $near: {
            $geometry: { type: 'Point', coordinates: [-74.0060, 40.7128] },
            $maxDistance: 500000, // 500km in meters
          },
        },
      }).toArray();
      
      expect(nearNYC).toHaveLength(1);
      expect(nearNYC[0].name).toBe('NYC Event');
    });

    it('finds events with geo data', async () => {
      const eventsCol = db.collection('events');
      
      const withGeo = await eventsCol.find({
        geo: { $exists: true },
      }).toArray();
      
      expect(withGeo).toHaveLength(3);
    });
  });

  describe('Event-Insight Relationship', () => {
    it('tracks insight count', async () => {
      const eventsCol = db.collection('events');
      const insightsCol = db.collection('insights');
      const now = new Date().toISOString();

      // Create event
      await eventsCol.insertOne({
        _id: 'event-1',
        name: 'Test Event',
        status: 'Confirmed',
        insightCount: 0,
        createdAt: now,
        updatedAt: now,
      } as any);

      // Add insights
      for (let i = 0; i < 5; i++) {
        await insightsCol.insertOne({
          _id: `insight-${i}`,
          eventId: 'event-1',
          text: `Insight ${i}`,
          createdAt: now,
        } as any);
        
        await eventsCol.updateOne(
          { _id: 'event-1' },
          { $inc: { insightCount: 1 } }
        );
      }

      const event = await eventsCol.findOne({ _id: 'event-1' });
      const insights = await insightsCol.find({ eventId: 'event-1' }).toArray();
      
      expect(event?.insightCount).toBe(5);
      expect(insights).toHaveLength(5);
    });
  });
});
