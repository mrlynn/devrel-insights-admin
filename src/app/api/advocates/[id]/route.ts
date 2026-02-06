import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/advocates/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const col = await getCollection(collections.advocates);
    
    const advocate = await col.findOne({ _id: id as any });

    if (!advocate) {
      return NextResponse.json({ error: 'Advocate not found' }, { status: 404 });
    }

    return NextResponse.json(advocate);
  } catch (error) {
    console.error('GET /api/advocates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch advocate' }, { status: 500 });
  }
}

// PUT /api/advocates/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const col = await getCollection(collections.advocates);

    const result = await col.updateOne(
      { _id: id as any },
      { 
        $set: { 
          ...body, 
          updatedAt: new Date().toISOString() 
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Advocate not found' }, { status: 404 });
    }

    const updated = await col.findOne({ _id: id as any });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/advocates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update advocate' }, { status: 500 });
  }
}

// DELETE /api/advocates/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const col = await getCollection(collections.advocates);

    const result = await col.deleteOne({ _id: id as any });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Advocate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/advocates/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete advocate' }, { status: 500 });
  }
}
