import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface SessionDoc {
  _id: string;
  eventId?: string;
  title: string;
  description?: string;
  speaker?: string;
  room?: string;
  startTime?: string;
  endTime?: string;
  isWorkshop?: boolean;
  attendanceEstimate?: number;
  audienceSize?: number;
  duration?: number;
  engagementNotes?: string;
  commonQuestions?: string[];
  resonantDemos?: string[];
  createdAt: string;
  updatedAt: string;
}

// GET /api/sessions/[id] - Get single session
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const col = await getCollection(collections.sessions);
    
    const session = await col.findOne({ _id: id as unknown as any });
    
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('GET /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 });
  }
}

// PUT /api/sessions/[id] - Update session
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getCollection(collections.sessions);
    const eventsCol = await getCollection(collections.events);

    const now = new Date().toISOString();

    // Fields that can be updated
    const allowedFields = [
      'title', 'description', 'speaker', 'room', 'startTime', 'endTime',
      'isWorkshop', 'attendanceEstimate', 'audienceSize', 'duration',
      'engagementNotes', 'commonQuestions', 'resonantDemos'
    ];

    const updates: Record<string, any> = { updatedAt: now };
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const result = await col.findOneAndUpdate(
      { _id: id as unknown as any },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update the embedded session in the event document
    const session = result as unknown as SessionDoc;
    if (session.eventId) {
      await eventsCol.updateOne(
        { _id: session.eventId as unknown as any, 'sessions._id': id },
        { 
          $set: { 
            'sessions.$': session,
            updatedAt: now 
          } 
        }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('PUT /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}

// DELETE /api/sessions/[id] - Delete session
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const col = await getCollection(collections.sessions);
    const eventsCol = await getCollection(collections.events);

    // Get session first to find eventId
    const sessionDoc = await col.findOne({ _id: id as unknown as any });
    
    if (!sessionDoc) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const session = sessionDoc as unknown as SessionDoc;

    // Delete from sessions collection
    await col.deleteOne({ _id: id as unknown as any });

    // Remove from event's embedded array
    if (session.eventId) {
      await eventsCol.updateOne(
        { _id: session.eventId as unknown as any },
        { 
          $pull: { sessions: { _id: id } } as any,
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    console.error('DELETE /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}

// POST /api/sessions/[id] - Session actions (add question, demo, etc.)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getCollection(collections.sessions);
    const eventsCol = await getCollection(collections.events);

    const now = new Date().toISOString();
    let result: any;

    if (body.action === 'addQuestion') {
      // Add a common question
      result = await col.findOneAndUpdate(
        { _id: id as unknown as any },
        { 
          $addToSet: { commonQuestions: body.question } as any,
          $set: { updatedAt: now }
        },
        { returnDocument: 'after' }
      );
    } else if (body.action === 'addDemo') {
      // Add a resonant demo
      result = await col.findOneAndUpdate(
        { _id: id as unknown as any },
        { 
          $addToSet: { resonantDemos: body.demo } as any,
          $set: { updatedAt: now }
        },
        { returnDocument: 'after' }
      );
    } else if (body.action === 'updateAttendance') {
      // Update audience size
      result = await col.findOneAndUpdate(
        { _id: id as unknown as any },
        { 
          $set: { 
            audienceSize: body.audienceSize,
            updatedAt: now 
          }
        },
        { returnDocument: 'after' }
      );
    } else if (body.action === 'addNotes') {
      // Append to engagement notes
      const sessionDoc = await col.findOne({ _id: id as unknown as any });
      const session = sessionDoc as unknown as SessionDoc;
      const existingNotes = session?.engagementNotes || '';
      const newNotes = existingNotes 
        ? `${existingNotes}\n\n[${new Date().toLocaleString()}]\n${body.notes}`
        : `[${new Date().toLocaleString()}]\n${body.notes}`;
      
      result = await col.findOneAndUpdate(
        { _id: id as unknown as any },
        { 
          $set: { 
            engagementNotes: newNotes,
            updatedAt: now 
          }
        },
        { returnDocument: 'after' }
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Sync to event's embedded session
    const session = result as unknown as SessionDoc;
    if (session.eventId) {
      await eventsCol.updateOne(
        { _id: session.eventId as unknown as any, 'sessions._id': id },
        { $set: { 'sessions.$': result, updatedAt: now } }
      );
    }

    return NextResponse.json({ success: true, session: result });
  } catch (error) {
    console.error('POST /api/sessions/[id] error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}
