import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

const COLLECTION = 'schema_mappings';

/**
 * Schema mapping storage
 * 
 * Stores learned column aliases so future imports work better.
 * Format: { field: string, aliases: string[], updatedAt: string }
 */

// GET /api/schema - Get all custom aliases
export async function GET() {
  try {
    const db = await getDb();
    const mappings = await db.collection(COLLECTION).find().toArray();
    
    // Convert to { fieldName: ['alias1', 'alias2'] } format
    const aliases: Record<string, string[]> = {};
    for (const mapping of mappings) {
      aliases[mapping.field] = mapping.aliases || [];
    }
    
    return NextResponse.json({ aliases });
  } catch (error) {
    console.error('GET /api/schema error:', error);
    return NextResponse.json({ aliases: {} });
  }
}

// POST /api/schema - Learn a new mapping
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { field, alias } = body;
    
    if (!field || !alias) {
      return NextResponse.json(
        { error: 'field and alias are required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    // Upsert: add alias to field's alias list
    await db.collection(COLLECTION).updateOne(
      { field },
      {
        $addToSet: { aliases: alias.toLowerCase().trim() },
        $set: { updatedAt: new Date().toISOString() },
        $setOnInsert: { field, createdAt: new Date().toISOString() },
      },
      { upsert: true }
    );
    
    return NextResponse.json({ success: true, field, alias });
  } catch (error) {
    console.error('POST /api/schema error:', error);
    return NextResponse.json({ error: 'Failed to save mapping' }, { status: 500 });
  }
}

// DELETE /api/schema - Remove an alias
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { field, alias } = body;
    
    if (!field || !alias) {
      return NextResponse.json(
        { error: 'field and alias are required' },
        { status: 400 }
      );
    }
    
    const db = await getDb();
    
    await db.collection(COLLECTION).updateOne(
      { field },
      {
        $pull: { aliases: alias.toLowerCase().trim() },
        $set: { updatedAt: new Date().toISOString() },
      }
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/schema error:', error);
    return NextResponse.json({ error: 'Failed to delete mapping' }, { status: 500 });
  }
}
