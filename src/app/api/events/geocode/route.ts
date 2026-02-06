import { NextRequest, NextResponse } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';
import { geocodeLocation } from '@/lib/geocoder';

export const dynamic = 'force-dynamic';

// POST /api/events/geocode - Geocode events missing coordinates
export async function POST(request: NextRequest) {
  try {
    const { limit = 10 } = await request.json().catch(() => ({}));
    const col = await getCollection(collections.events);
    
    // Find events that need geocoding:
    // - Have a location
    // - Not virtual
    // - Don't have geo coordinates yet
    const filter = {
      location: { $exists: true, $nin: ['', 'Virtual'] },
      isVirtual: { $ne: true },
      geo: { $exists: false },
    };
    const eventsToGeocode = await col.find(filter as any).limit(limit).toArray() as any[];
    
    if (eventsToGeocode.length === 0) {
      return NextResponse.json({ 
        message: 'All events are already geocoded',
        processed: 0,
        remaining: 0,
      });
    }
    
    const results = {
      processed: 0,
      geocoded: 0,
      failed: 0,
      errors: [] as string[],
    };
    
    for (const event of eventsToGeocode) {
      const geocodeResult = await geocodeLocation(event.location);
      results.processed++;
      
      if (geocodeResult.geo) {
        await col.updateOne(
          { _id: event._id },
          { 
            $set: { 
              geo: geocodeResult.geo,
              geoCity: geocodeResult.city,
              geoCountry: geocodeResult.country,
              geoFormattedAddress: geocodeResult.formattedAddress,
              geocodedAt: new Date().toISOString(),
            } 
          }
        );
        results.geocoded++;
      } else {
        // Mark as attempted so we don't retry failed ones
        await col.updateOne(
          { _id: event._id },
          { 
            $set: { 
              geocodeError: geocodeResult.error,
              geocodedAt: new Date().toISOString(),
            } 
          }
        );
        results.failed++;
        results.errors.push(`${event.name}: ${geocodeResult.error}`);
      }
    }
    
    // Count remaining
    const remainingFilter = {
      location: { $exists: true, $nin: ['', 'Virtual'] },
      isVirtual: { $ne: true },
      geo: { $exists: false },
      geocodeError: { $exists: false },
    };
    const remaining = await col.countDocuments(remainingFilter as any);
    
    return NextResponse.json({ ...results, remaining });
  } catch (error) {
    console.error('POST /api/events/geocode error:', error);
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 });
  }
}

// DELETE /api/events/geocode - Reset failed geocodes for retry
export async function DELETE() {
  try {
    const col = await getCollection(collections.events);
    
    const result = await col.updateMany(
      { geocodeError: { $exists: true } },
      { $unset: { geocodeError: '', geocodedAt: '' } }
    );
    
    return NextResponse.json({ 
      reset: result.modifiedCount,
      message: `Reset ${result.modifiedCount} failed geocodes for retry`,
    });
  } catch (error) {
    console.error('DELETE /api/events/geocode error:', error);
    return NextResponse.json({ error: 'Failed to reset' }, { status: 500 });
  }
}

// GET /api/events/geocode - Get geocoding status
export async function GET() {
  try {
    const col = await getCollection(collections.events);
    
    const pendingFilter = {
      location: { $exists: true, $nin: ['', 'Virtual'] },
      isVirtual: { $ne: true },
      geo: { $exists: false },
      geocodeError: { $exists: false },
    };
    
    const [total, geocoded, virtual, pending, failed] = await Promise.all([
      col.countDocuments({}),
      col.countDocuments({ geo: { $exists: true } } as any),
      col.countDocuments({ $or: [{ isVirtual: true }, { location: 'Virtual' }] } as any),
      col.countDocuments(pendingFilter as any),
      col.countDocuments({ geocodeError: { $exists: true } } as any),
    ]);
    
    return NextResponse.json({
      total,
      geocoded,
      virtual,
      pending,
      failed,
    });
  } catch (error) {
    console.error('GET /api/events/geocode error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
