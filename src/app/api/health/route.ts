import { NextResponse } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

/**
 * GET /api/health - Health check endpoint
 * 
 * Returns API status, database connectivity, and basic stats.
 * Useful for debugging mobile app connectivity issues.
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test database connectivity
    const col = await getCollection(collections.events);
    const eventCount = await col.countDocuments();
    
    const insightsCol = await getCollection(collections.insights);
    const insightCount = await insightsCol.countDocuments();
    
    const dbLatency = Date.now() - startTime;
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        latencyMs: dbLatency,
        stats: {
          events: eventCount,
          insights: insightCount,
        },
      },
      version: '1.0.0',
      environment: process.env.VERCEL_ENV || 'local',
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      version: '1.0.0',
      environment: process.env.VERCEL_ENV || 'local',
    }, { status: 503 });
  }
}
