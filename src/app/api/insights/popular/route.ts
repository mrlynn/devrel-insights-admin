import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections, REACTION_EMOJI } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/insights/popular - Get popular insights feed
 * 
 * Query params:
 * - period: 'day' | 'week' | 'month' | 'all' (default: 'week')
 * - limit: number (default: 20, max: 100)
 * - skip: number (default: 0)
 * - sort: 'total' | 'trending' | 'love' | 'insightful' (default: 'total')
 * - advocateId: optional - include user's reaction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');
    const sort = searchParams.get('sort') || 'total';
    const advocateId = searchParams.get('advocateId');

    const insightsCol = await getCollection(collections.insights);
    const reactionsCol = await getCollection(collections.reactions);

    // Build date filter based on period
    const dateFilter: Record<string, any> = {};
    const now = new Date();
    
    if (period !== 'all') {
      let startDate: Date;
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      dateFilter.capturedAt = { $gte: startDate.toISOString() };
    }

    // Build sort options
    let sortField: Record<string, 1 | -1>;
    switch (sort) {
      case 'trending':
        // Trending = recent reactions weighted higher
        // For simplicity, use reactionTotal + recency boost
        sortField = { reactionTotal: -1, capturedAt: -1 };
        break;
      case 'love':
        sortField = { 'reactionCounts.love': -1, reactionTotal: -1 };
        break;
      case 'insightful':
        sortField = { 'reactionCounts.insightful': -1, reactionTotal: -1 };
        break;
      case 'total':
      default:
        sortField = { reactionTotal: -1, capturedAt: -1 };
    }

    // Query insights with reactions
    const filter = {
      ...dateFilter,
      reactionTotal: { $gt: 0 },
    };

    const [insights, total] = await Promise.all([
      insightsCol
        .find(filter)
        .sort(sortField)
        .skip(skip)
        .limit(limit)
        .toArray(),
      insightsCol.countDocuments(filter),
    ]);

    // Get user's reactions if advocateId provided
    let userReactions: Record<string, string> = {};
    if (advocateId && insights.length > 0) {
      const insightIds = insights.map((i: any) => i._id);
      const reactions = await reactionsCol
        .find({ 
          insightId: { $in: insightIds }, 
          advocateId 
        })
        .toArray();
      
      userReactions = Object.fromEntries(
        reactions.map((r: any) => [r.insightId, r.type])
      );
    }

    // Enrich insights with reaction display
    const enriched = insights.map((insight: any) => {
      const counts = insight.reactionCounts || {};
      
      // Build reaction summary string (e.g., "👍 12  ❤️ 5  💡 3")
      const reactionSummary = Object.entries(counts)
        .filter(([_, count]) => (count as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([type, count]) => `${REACTION_EMOJI[type as keyof typeof REACTION_EMOJI] || '?'} ${count}`)
        .join('  ');

      return {
        ...insight,
        reactionSummary,
        userReaction: userReactions[insight._id] || null,
      };
    });

    return NextResponse.json({
      insights: enriched,
      total,
      limit,
      skip,
      period,
      sort,
    });
  } catch (error) {
    console.error('GET /api/insights/popular error:', error);
    return NextResponse.json({ error: 'Failed to fetch popular insights' }, { status: 500 });
  }
}

/**
 * GET /api/insights/popular/stats - Get reaction statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'stats') {
      const insightsCol = await getCollection(collections.insights);
      const reactionsCol = await getCollection(collections.reactions);

      // Get top reactors (advocates who give most reactions)
      const topReactors = await reactionsCol.aggregate([
        { $group: { 
          _id: '$advocateId', 
          name: { $first: '$advocateName' },
          count: { $sum: 1 } 
        }},
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]).toArray();

      // Get top receivers (advocates whose insights get most reactions)
      const topReceivers = await insightsCol.aggregate([
        { $match: { reactionTotal: { $gt: 0 } } },
        { $group: { 
          _id: '$advocateId', 
          name: { $first: '$advocateName' },
          totalReactions: { $sum: '$reactionTotal' },
          insightCount: { $sum: 1 }
        }},
        { $sort: { totalReactions: -1 } },
        { $limit: 10 },
      ]).toArray();

      // Get reaction type distribution
      const typeDistribution = await reactionsCol.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).toArray();

      // Get total stats
      const totalReactions = await reactionsCol.countDocuments();
      const insightsWithReactions = await insightsCol.countDocuments({ 
        reactionTotal: { $gt: 0 } 
      });

      return NextResponse.json({
        topReactors: topReactors.map(r => ({ 
          advocateId: r._id, 
          name: r.name, 
          count: r.count 
        })),
        topReceivers: topReceivers.map(r => ({ 
          advocateId: r._id, 
          name: r.name, 
          totalReactions: r.totalReactions,
          insightCount: r.insightCount 
        })),
        typeDistribution: Object.fromEntries(
          typeDistribution.map(t => [
            t._id, 
            { count: t.count, emoji: REACTION_EMOJI[t._id as keyof typeof REACTION_EMOJI] }
          ])
        ),
        totals: {
          reactions: totalReactions,
          insightsWithReactions,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('POST /api/insights/popular error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}
