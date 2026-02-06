import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// Generate a normalized key for duplicate detection
function generateEventKey(name: string, startDate: string | null): string {
  const normalizedName = (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '');
  const normalizedDate = startDate ? startDate.slice(0, 10) : 'nodate';
  return `${normalizedName}:${normalizedDate}`;
}

// POST /api/events/upsert - Bulk upsert events
export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();
    
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'events array required' }, { status: 400 });
    }

    const col = await getCollection(collections.events);
    const now = new Date().toISOString();

    // Build a map of existing events by key
    const existingEvents = await col.find({}).toArray() as any[];
    const existingByKey = new Map<string, any>();
    for (const event of existingEvents) {
      const key = generateEventKey(event.name, event.startDate);
      existingByKey.set(key, event);
    }

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const eventData of events) {
      try {
        const key = generateEventKey(eventData.name, eventData.startDate);
        const existing = existingByKey.get(key);

        if (existing) {
          // Update existing event - merge fields, preserve _id and createdAt
          const updateFields = { ...eventData };
          delete updateFields._id;
          delete updateFields.createdAt;
          
          await col.updateOne(
            { _id: existing._id },
            {
              $set: {
                ...updateFields,
                updatedAt: now,
                lastImportedAt: now,
              },
            }
          );
          results.updated++;
        } else {
          // Create new event
          const newEvent = {
            ...eventData,
            _id: new ObjectId().toString(),
            insightCount: 0,
            createdAt: now,
            updatedAt: now,
            lastImportedAt: now,
            synced: true,
          };
          await col.insertOne(newEvent);
          
          // Add to map so subsequent duplicates in same import are detected
          existingByKey.set(key, newEvent);
          results.created++;
        }
      } catch (err) {
        results.errors.push(`Failed to upsert "${eventData.name}": ${err}`);
        results.skipped++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('POST /api/events/upsert error:', error);
    return NextResponse.json({ error: 'Failed to upsert events' }, { status: 500 });
  }
}

// GET /api/events/upsert - Preview duplicates
export async function GET(request: NextRequest) {
  try {
    const col = await getCollection(collections.events);
    const events = await col.find({}, { projection: { name: 1, startDate: 1, _id: 1 } }).toArray() as any[];
    
    // Return map of key -> id for client-side duplicate detection
    const keyMap: Record<string, string> = {};
    for (const event of events) {
      const key = generateEventKey(event.name, event.startDate);
      keyMap[key] = String(event._id);
    }
    
    return NextResponse.json({ keyMap, count: events.length });
  } catch (error) {
    console.error('GET /api/events/upsert error:', error);
    return NextResponse.json({ error: 'Failed to fetch event keys' }, { status: 500 });
  }
}
