import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, collections, BUG_STATUSES, BUG_PRIORITIES, BugStatus, BugPriority } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface Bug {
  _id?: string;
  title: string;
  description: string;
  status: BugStatus;
  priority: BugPriority;
  reportedBy: string;        // advocate name
  reportedById?: string;     // advocate ID
  deviceInfo?: string;       // iOS version, device model, etc.
  appVersion?: string;
  screenshot?: string;       // base64 or URL
  steps?: string;            // steps to reproduce
  notes?: string;            // admin notes
  createdAt: string;
  updatedAt?: string;
  resolvedAt?: string;
}

/**
 * GET /api/bugs - List all bugs with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '100');
    const skip = parseInt(searchParams.get('skip') || '0');

    const col = await getCollection(collections.bugs);

    const filter: Record<string, unknown> = {};
    if (status && BUG_STATUSES.includes(status as BugStatus)) {
      filter.status = status;
    }
    if (priority && BUG_PRIORITIES.includes(priority as BugPriority)) {
      filter.priority = priority;
    }

    const [bugs, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ]);

    // Get counts by status
    const statusCounts = await col.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray();

    const counts = Object.fromEntries(
      statusCounts.map((s) => [s._id, s.count])
    );

    return NextResponse.json({ bugs, total, limit, skip, counts });
  } catch (error) {
    console.error('GET /api/bugs error:', error);
    return NextResponse.json({ error: 'Failed to fetch bugs' }, { status: 500 });
  }
}

/**
 * POST /api/bugs - Create a new bug report (from mobile app)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      priority = 'medium',
      reportedBy,
      reportedById,
      deviceInfo,
      appVersion,
      screenshot,
      steps,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const col = await getCollection(collections.bugs);
    const now = new Date().toISOString();

    const bug: Bug = {
      _id: new ObjectId().toString(),
      title: title.trim(),
      description: description.trim(),
      status: 'open',
      priority: BUG_PRIORITIES.includes(priority) ? priority : 'medium',
      reportedBy: reportedBy || 'Anonymous',
      reportedById,
      deviceInfo,
      appVersion,
      screenshot,
      steps,
      createdAt: now,
    };

    await col.insertOne(bug as any);

    return NextResponse.json({ success: true, bug }, { status: 201 });
  } catch (error) {
    console.error('POST /api/bugs error:', error);
    return NextResponse.json({ error: 'Failed to create bug report' }, { status: 500 });
  }
}
