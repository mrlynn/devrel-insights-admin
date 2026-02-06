import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

// GET /api/dashboard - Executive dashboard data
export async function GET(request: NextRequest) {
  try {
    const insightsCol = await getCollection(collections.insights);
    const eventsCol = await getCollection(collections.events);

    // Date boundaries
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Parallel queries for performance
    const [
      totalInsights,
      totalEvents,
      last30Days,
      prev30Days,
      insightsByDay,
      bySentiment,
      byType,
      byProductArea,
      byPriority,
      topEvents,
      recentCritical,
      advocateStats,
    ] = await Promise.all([
      // Total counts
      insightsCol.countDocuments(),
      eventsCol.countDocuments(),
      
      // Last 30 days count
      insightsCol.countDocuments({
        capturedAt: { $gte: thirtyDaysAgo.toISOString() }
      }),
      
      // Previous 30 days count (for trend)
      insightsCol.countDocuments({
        capturedAt: { 
          $gte: sixtyDaysAgo.toISOString(),
          $lt: thirtyDaysAgo.toISOString()
        }
      }),

      // Insights by day (last 90 days)
      insightsCol.aggregate([
        { $match: { capturedAt: { $gte: ninetyDaysAgo.toISOString() } } },
        {
          $group: {
            _id: { $substr: ['$capturedAt', 0, 10] },
            count: { $sum: 1 },
            positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'Negative'] }, 1, 0] } },
            neutral: { $sum: { $cond: [{ $eq: ['$sentiment', 'Neutral'] }, 1, 0] } },
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray(),

      // Sentiment distribution
      insightsCol.aggregate([
        { $group: { _id: '$sentiment', count: { $sum: 1 } } }
      ]).toArray(),

      // Type distribution
      insightsCol.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray(),

      // Product area distribution
      insightsCol.aggregate([
        { $unwind: '$productAreas' },
        { $group: { _id: '$productAreas', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]).toArray(),

      // Priority distribution
      insightsCol.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]).toArray(),

      // Top events by insight count
      insightsCol.aggregate([
        { $match: { eventName: { $ne: null } } },
        {
          $group: {
            _id: '$eventId',
            eventName: { $first: '$eventName' },
            count: { $sum: 1 },
            positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'Positive'] }, 1, 0] } },
            negative: { $sum: { $cond: [{ $eq: ['$sentiment', 'Negative'] }, 1, 0] } },
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 }
      ]).toArray(),

      // Recent critical/high priority items
      insightsCol.find({
        priority: { $in: ['Critical', 'High'] }
      })
        .sort({ capturedAt: -1 })
        .limit(5)
        .toArray(),

      // Top advocates
      insightsCol.aggregate([
        { $match: { advocateId: { $ne: null } } },
        {
          $group: {
            _id: '$advocateId',
            name: { $first: '$advocateName' },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray(),
    ]);

    // Calculate trends
    const trend = prev30Days > 0 
      ? Math.round(((last30Days - prev30Days) / prev30Days) * 100)
      : last30Days > 0 ? 100 : 0;

    // Calculate sentiment score (weighted average)
    const sentimentMap: Record<string, number> = {};
    bySentiment.forEach((s) => { sentimentMap[s._id] = s.count; });
    const totalSentiment = (sentimentMap['Positive'] || 0) + (sentimentMap['Neutral'] || 0) + (sentimentMap['Negative'] || 0);
    const sentimentScore = totalSentiment > 0
      ? Math.round(((sentimentMap['Positive'] || 0) * 100 + (sentimentMap['Neutral'] || 0) * 50) / totalSentiment)
      : 50;

    // Format for charts
    const formatForPieChart = (data: Array<any>) =>
      data.map((d) => ({ name: d._id || 'Unknown', value: d.count }));

    return NextResponse.json({
      summary: {
        totalInsights,
        totalEvents,
        last30Days,
        trend,
        sentimentScore,
        avgInsightsPerEvent: totalEvents > 0 ? Math.round(totalInsights / totalEvents * 10) / 10 : 0,
      },
      charts: {
        insightsByDay: insightsByDay.map((d) => ({
          date: d._id,
          total: d.count,
          positive: d.positive,
          negative: d.negative,
          neutral: d.neutral,
        })),
        sentiment: formatForPieChart(bySentiment),
        types: formatForPieChart(byType),
        productAreas: byProductArea.map((p) => ({ name: p._id, count: p.count })),
        priority: formatForPieChart(byPriority),
        topEvents: topEvents.map((e) => ({
          name: e.eventName,
          insights: e.count,
          positive: e.positive,
          negative: e.negative,
        })),
      },
      lists: {
        criticalItems: recentCritical.map((i: any) => ({
          id: i._id,
          text: i.text,
          type: i.type,
          priority: i.priority,
          event: i.eventName,
          capturedAt: i.capturedAt,
        })),
        topAdvocates: advocateStats.map((a) => ({
          id: a._id,
          name: a.name,
          count: a.count,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
