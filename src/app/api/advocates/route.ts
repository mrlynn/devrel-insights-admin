import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/advocates - List all advocates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const active = searchParams.get('active');

    const col = await getCollection(collections.advocates);
    
    const filter: any = {};
    if (role) filter.role = role;
    if (active === 'true') filter.isActive = true;
    if (active === 'false') filter.isActive = false;

    const advocates = await col.find(filter).sort({ name: 1 }).toArray();

    return NextResponse.json({ advocates });
  } catch (error) {
    console.error('GET /api/advocates error:', error);
    return NextResponse.json({ error: 'Failed to fetch advocates' }, { status: 500 });
  }
}

// POST /api/advocates - Create advocate
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const col = await getCollection(collections.advocates);

    const now = new Date().toISOString();
    const advocate = {
      _id: new ObjectId().toString(),
      email: body.email,
      name: body.name,
      role: body.role || 'advocate',
      region: body.region,
      isActive: body.isActive ?? true,
      avatarUrl: body.avatarUrl,
      createdAt: now,
      updatedAt: now,
    };

    // Check for duplicate email
    const existing = await col.findOne({ email: body.email });
    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    await col.insertOne(advocate as any);
    return NextResponse.json(advocate, { status: 201 });
  } catch (error) {
    console.error('POST /api/advocates error:', error);
    return NextResponse.json({ error: 'Failed to create advocate' }, { status: 500 });
  }
}
