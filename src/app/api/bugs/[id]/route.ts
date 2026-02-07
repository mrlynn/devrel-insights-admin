import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections, BUG_STATUSES, BUG_PRIORITIES, BugStatus, BugPriority } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bugs/[id] - Get a single bug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const col = await getCollection(collections.bugs);

    const bug = await col.findOne({ _id: id as any });
    if (!bug) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json(bug);
  } catch (error) {
    console.error('GET /api/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch bug' }, { status: 500 });
  }
}

/**
 * PUT /api/bugs/[id] - Update a bug (status, priority, notes)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, priority, notes, title, description, steps } = body;

    const col = await getCollection(collections.bugs);
    const now = new Date().toISOString();

    const update: Record<string, unknown> = {
      updatedAt: now,
    };

    if (status && BUG_STATUSES.includes(status as BugStatus)) {
      update.status = status;
      if (status === 'resolved' || status === 'closed') {
        update.resolvedAt = now;
      }
    }
    if (priority && BUG_PRIORITIES.includes(priority as BugPriority)) {
      update.priority = priority;
    }
    if (notes !== undefined) {
      update.notes = notes;
    }
    if (title) {
      update.title = title.trim();
    }
    if (description) {
      update.description = description.trim();
    }
    if (steps !== undefined) {
      update.steps = steps;
    }

    const result = await col.updateOne(
      { _id: id as any },
      { $set: update }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    const updated = await col.findOne({ _id: id as any });
    return NextResponse.json({ success: true, bug: updated });
  } catch (error) {
    console.error('PUT /api/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update bug' }, { status: 500 });
  }
}

/**
 * DELETE /api/bugs/[id] - Delete a bug
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const col = await getCollection(collections.bugs);

    const result = await col.deleteOne({ _id: id as any });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Bug not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/bugs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete bug' }, { status: 500 });
  }
}
