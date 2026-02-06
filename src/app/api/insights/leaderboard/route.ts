import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/insights/leaderboard - Get advocate leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const period = searchParams.get('period') || 'all'; // all, week, month, year

    const col = await getCollection(collections.insights);

    // Build date filter based on period
    const dateFilter: any = {};
    const now = new Date();
    
    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      dateFilter.capturedAt = { $gte: weekAgo.toISOString() };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter.capturedAt = { $gte: monthAgo.toISOString() };
    } else if (period === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      dateFilter.capturedAt = { $gte: yearAgo.toISOString() };
    }

    const pipeline = [
      { $match: { advocateId: { $ne: null }, ...dateFilter } },
      {
        $group: {
          _id: '$advocateId',
          advocateName: { $first: '$advocateName' },
          totalInsights: { $sum: 1 },
          positiveCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] },
          },
          negativeCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'Negative'] }, 1, 0] },
          },
          neutralCount: {
            $sum: { $cond: [{ $eq: ['$sentiment', 'Neutral'] }, 1, 0] },
          },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$priority', 'Critical'] }, 1, 0] },
          },
          highCount: {
            $sum: { $cond: [{ $eq: ['$priority', 'High'] }, 1, 0] },
          },
          featureRequests: {
            $sum: { $cond: [{ $eq: ['$type', 'Feature Request'] }, 1, 0] },
          },
          bugReports: {
            $sum: { $cond: [{ $eq: ['$type', 'Bug Report'] }, 1, 0] },
          },
          useCases: {
            $sum: { $cond: [{ $eq: ['$type', 'Use Case'] }, 1, 0] },
          },
          uniqueEvents: { $addToSet: '$eventId' },
          lastCapturedAt: { $max: '$capturedAt' },
        },
      },
      {
        $addFields: {
          eventCount: { $size: '$uniqueEvents' },
          // Calculate impact score: weighted sum favoring actionable insights
          impactScore: {
            $add: [
              { $multiply: ['$totalInsights', 1] },
              { $multiply: ['$criticalCount', 3] },
              { $multiply: ['$highCount', 2] },
              { $multiply: ['$featureRequests', 1.5] },
              { $multiply: ['$bugReports', 1.5] },
              { $multiply: ['$useCases', 2] },
            ],
          },
        },
      },
      { $sort: { totalInsights: -1 } },
      { $limit: limit },
      {
        $project: {
          advocateId: '$_id',
          advocateName: 1,
          totalInsights: 1,
          positiveCount: 1,
          negativeCount: 1,
          neutralCount: 1,
          criticalCount: 1,
          highCount: 1,
          featureRequests: 1,
          bugReports: 1,
          useCases: 1,
          eventCount: 1,
          impactScore: { $round: ['$impactScore', 0] },
          lastCapturedAt: 1,
          _id: 0,
        },
      },
    ];

    const leaderboard = await col.aggregate(pipeline).toArray();

    // Get total insights for context
    const totalInsights = await col.countDocuments(dateFilter);
    const totalAdvocates = await col.distinct('advocateId', { advocateId: { $ne: null } });

    return NextResponse.json({
      leaderboard,
      period,
      totalInsights,
      totalAdvocates: totalAdvocates.length,
    });
  } catch (error) {
    console.error('GET /api/insights/leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }
}
