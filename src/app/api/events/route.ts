import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/events - List all events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');
    const status = searchParams.get('status');
    const region = searchParams.get('region');

    const col = await getCollection(collections.events);
    
    const filter: any = {};
    if (status) filter.status = status;
    if (region) filter.region = region;

    const [events, total] = await Promise.all([
      col.find(filter).sort({ startDate: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    return NextResponse.json({ events, total, limit, skip });
  } catch (error) {
    console.error('GET /api/events error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const col = await getCollection(collections.events);

    const now = new Date().toISOString();
    const event = {
      ...body,
      _id: new ObjectId().toString(),
      insightCount: 0,
      createdAt: now,
      updatedAt: now,
      synced: true,
    };

    await col.insertOne(event);
    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('POST /api/events error:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
