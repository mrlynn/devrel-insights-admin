import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections, REACTION_TYPES, ReactionType } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

interface ReactionDoc {
  _id?: string;
  insightId: string;
  advocateId: string;
  advocateName: string;
  type: ReactionType;
  createdAt: string;
}

/**
 * POST /api/insights/[id]/react - Add or change reaction
 * Body: { advocateId, advocateName, type }
 * 
 * If user already reacted with same type → removes it (toggle off)
 * If user reacted with different type → changes to new type
 * If user hasn't reacted → adds new reaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: insightId } = await params;
    const body = await request.json();
    const { advocateId, advocateName, type } = body;

    if (!advocateId) {
      return NextResponse.json({ error: 'advocateId required' }, { status: 400 });
    }

    if (!type || !REACTION_TYPES.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid reaction type. Must be one of: ${REACTION_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    const reactionsCol = await getCollection(collections.reactions);
    const insightsCol = await getCollection(collections.insights);

    // Check if insight exists
    const insight = await insightsCol.findOne({ _id: insightId as any });
    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    // Check for existing reaction from this user
    const existing = await reactionsCol.findOne({ 
      insightId, 
      advocateId 
    }) as ReactionDoc | null;

    const now = new Date().toISOString();
    let action: 'added' | 'changed' | 'removed';
    let newType: ReactionType | null = type;

    if (existing) {
      if (existing.type === type) {
        // Same reaction → toggle off (remove)
        await reactionsCol.deleteOne({ insightId, advocateId });
        action = 'removed';
        newType = null;

        // Decrement count
        await insightsCol.updateOne(
          { _id: insightId as any },
          { 
            $inc: { 
              [`reactionCounts.${type}`]: -1,
              reactionTotal: -1 
            },
            $set: { updatedAt: now }
          }
        );
      } else {
        // Different reaction → change type
        await reactionsCol.updateOne(
          { insightId, advocateId },
          { $set: { type, updatedAt: now } }
        );
        action = 'changed';

        // Update counts: decrement old, increment new
        await insightsCol.updateOne(
          { _id: insightId as any },
          { 
            $inc: { 
              [`reactionCounts.${existing.type}`]: -1,
              [`reactionCounts.${type}`]: 1 
            },
            $set: { updatedAt: now }
          }
        );
      }
    } else {
      // No existing reaction → add new
      const { ObjectId } = await import('mongodb');
      const reaction: ReactionDoc = {
        _id: new ObjectId().toString(),
        insightId,
        advocateId,
        advocateName: advocateName || 'Unknown',
        type,
        createdAt: now,
      };

      await reactionsCol.insertOne(reaction as any);
      action = 'added';

      // Increment count (initialize if needed)
      await insightsCol.updateOne(
        { _id: insightId as any },
        { 
          $inc: { 
            [`reactionCounts.${type}`]: 1,
            reactionTotal: 1 
          },
          $set: { updatedAt: now }
        }
      );
    }

    // Get updated counts
    const updated = await insightsCol.findOne({ _id: insightId as any });
    const reactionCounts = (updated as any)?.reactionCounts || {};
    const reactionTotal = (updated as any)?.reactionTotal || 0;

    return NextResponse.json({
      success: true,
      action,
      userReaction: newType,
      reactionCounts,
      reactionTotal,
    });
  } catch (error) {
    console.error('POST /api/insights/[id]/react error:', error);
    return NextResponse.json({ error: 'Failed to process reaction' }, { status: 500 });
  }
}

/**
 * DELETE /api/insights/[id]/react - Remove reaction
 * Body: { advocateId }
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: insightId } = await params;
    const body = await request.json();
    const { advocateId } = body;

    if (!advocateId) {
      return NextResponse.json({ error: 'advocateId required' }, { status: 400 });
    }

    const reactionsCol = await getCollection(collections.reactions);
    const insightsCol = await getCollection(collections.insights);

    const existing = await reactionsCol.findOne({ 
      insightId, 
      advocateId 
    }) as ReactionDoc | null;

    if (!existing) {
      return NextResponse.json({ error: 'No reaction found' }, { status: 404 });
    }

    await reactionsCol.deleteOne({ insightId, advocateId });

    // Decrement count
    const now = new Date().toISOString();
    await insightsCol.updateOne(
      { _id: insightId as any },
      { 
        $inc: { 
          [`reactionCounts.${existing.type}`]: -1,
          reactionTotal: -1 
        },
        $set: { updatedAt: now }
      }
    );

    // Get updated counts
    const updated = await insightsCol.findOne({ _id: insightId as any });
    const reactionCounts = (updated as any)?.reactionCounts || {};
    const reactionTotal = (updated as any)?.reactionTotal || 0;

    return NextResponse.json({
      success: true,
      action: 'removed',
      reactionCounts,
      reactionTotal,
    });
  } catch (error) {
    console.error('DELETE /api/insights/[id]/react error:', error);
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}

/**
 * GET /api/insights/[id]/react - Get reactions for an insight
 * Query: ?advocateId=xxx to check user's reaction
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: insightId } = await params;
    const { searchParams } = new URL(request.url);
    const advocateId = searchParams.get('advocateId');

    const reactionsCol = await getCollection(collections.reactions);
    const insightsCol = await getCollection(collections.insights);

    // Get insight with counts
    const insight = await insightsCol.findOne({ _id: insightId as any });
    if (!insight) {
      return NextResponse.json({ error: 'Insight not found' }, { status: 404 });
    }

    const reactionCounts = (insight as any).reactionCounts || {};
    const reactionTotal = (insight as any).reactionTotal || 0;

    // Get user's reaction if advocateId provided
    let userReaction: ReactionType | null = null;
    if (advocateId) {
      const existing = await reactionsCol.findOne({ 
        insightId, 
        advocateId 
      }) as ReactionDoc | null;
      userReaction = existing?.type || null;
    }

    // Get recent reactors (last 10)
    const recentReactions = await reactionsCol
      .find({ insightId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      insightId,
      reactionCounts,
      reactionTotal,
      userReaction,
      recentReactions: recentReactions.map(r => ({
        advocateId: (r as any).advocateId,
        advocateName: (r as any).advocateName,
        type: (r as any).type,
        createdAt: (r as any).createdAt,
      })),
    });
  } catch (error) {
    console.error('GET /api/insights/[id]/react error:', error);
    return NextResponse.json({ error: 'Failed to get reactions' }, { status: 500 });
  }
}
