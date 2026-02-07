/**
 * Analytics Ping API
 * 
 * Tracks app usage with IP-based geolocation.
 * Called when mobile app launches.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

interface GeoData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
}

async function getGeoFromIP(ip: string): Promise<GeoData | null> {
  try {
    // Use ip-api.com (free, no key required, 45 req/min limit)
    // For production, consider MaxMind or ipinfo.io
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,lat,lon,timezone,isp`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        ip,
        country: data.country,
        countryCode: data.countryCode,
        region: data.region,
        city: data.city,
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone,
        isp: data.isp,
      };
    }
    return null;
  } catch (error) {
    console.error('Geo lookup failed:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // Get IP from headers (Vercel/Cloudflare provide these)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIP || 'unknown';
    
    // Get geo data
    const geo = ip !== 'unknown' ? await getGeoFromIP(ip) : null;
    
    const db = await getDb();
    
    const ping = {
      userId: body.userId || null,
      userName: body.userName || null,
      userEmail: body.userEmail || null,
      appVersion: body.appVersion || null,
      platform: body.platform || null, // 'ios' | 'android'
      deviceModel: body.deviceModel || null,
      ip,
      geo: geo ? {
        country: geo.country,
        countryCode: geo.countryCode,
        region: geo.region,
        city: geo.city,
        lat: geo.lat,
        lon: geo.lon,
        timezone: geo.timezone,
      } : null,
      timestamp: new Date(),
    };
    
    await db.collection('analytics_pings').insertOne(ping);
    
    // Also update/upsert user's last known location
    if (body.userId && geo) {
      await db.collection('user_locations').updateOne(
        { userId: body.userId },
        {
          $set: {
            userName: body.userName,
            userEmail: body.userEmail,
            lastLocation: {
              country: geo.country,
              countryCode: geo.countryCode,
              city: geo.city,
              lat: geo.lat,
              lon: geo.lon,
            },
            lastSeen: new Date(),
            platform: body.platform,
            appVersion: body.appVersion,
          },
          $inc: { pingCount: 1 },
        },
        { upsert: true }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics ping error:', error);
    return NextResponse.json({ error: 'Failed to record ping' }, { status: 500 });
  }
}

// GET - retrieve active users for the map
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hours = parseInt(searchParams.get('hours') || '24', 10);
    
    const db = await getDb();
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    // Get unique users with locations from recent pings
    const activeUsers = await db.collection('user_locations')
      .find({ lastSeen: { $gte: since } })
      .project({
        userId: 1,
        userName: 1,
        lastLocation: 1,
        lastSeen: 1,
        platform: 1,
        pingCount: 1,
      })
      .toArray();
    
    // Get aggregate stats by country
    const countryStats = await db.collection('user_locations').aggregate([
      { $match: { lastSeen: { $gte: since } } },
      {
        $group: {
          _id: '$lastLocation.countryCode',
          country: { $first: '$lastLocation.country' },
          count: { $sum: 1 },
          users: { $push: { name: '$userName', city: '$lastLocation.city' } },
        },
      },
      { $sort: { count: -1 } },
    ]).toArray();
    
    // Total pings in time window
    const totalPings = await db.collection('analytics_pings')
      .countDocuments({ timestamp: { $gte: since } });
    
    return NextResponse.json({
      activeUsers,
      countryStats,
      totalPings,
      since: since.toISOString(),
      hours,
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
