import { NextRequest } from 'next/server';
import { getCollection, collections } from '@/lib/mongodb';
import { geocodeLocation } from '@/lib/geocoder';

export const dynamic = 'force-dynamic';

// GET /api/events/geocode/stream - Stream geocoding progress via SSE
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const col = await getCollection(collections.events);
        
        // Find events that need geocoding
        const filter = {
          location: { $exists: true, $nin: ['', 'Virtual'] },
          isVirtual: { $ne: true },
          geo: { $exists: false },
          geocodeError: { $exists: false },
        };
        
        const eventsToGeocode = await col.find(filter as any).limit(limit).toArray() as any[];
        const total = eventsToGeocode.length;
        
        if (total === 0) {
          send({ type: 'complete', message: 'All events are already geocoded', geocoded: 0, failed: 0 });
          controller.close();
          return;
        }

        send({ type: 'start', total, message: `Starting geocoding of ${total} events...` });

        let geocoded = 0;
        let failed = 0;

        for (let i = 0; i < eventsToGeocode.length; i++) {
          const event = eventsToGeocode[i];
          
          send({
            type: 'progress',
            current: i + 1,
            total,
            eventName: event.name,
            location: event.location,
            status: 'geocoding',
          });

          const result = await geocodeLocation(event.location);

          if (result.geo) {
            await col.updateOne(
              { _id: event._id },
              {
                $set: {
                  geo: result.geo,
                  geoCity: result.city,
                  geoCountry: result.country,
                  geoFormattedAddress: result.formattedAddress,
                  geocodedAt: new Date().toISOString(),
                },
              }
            );
            geocoded++;
            
            send({
              type: 'result',
              current: i + 1,
              total,
              eventName: event.name,
              location: event.location,
              success: true,
              city: result.city,
              country: result.country,
              coordinates: result.geo.coordinates,
            });
          } else {
            await col.updateOne(
              { _id: event._id },
              {
                $set: {
                  geocodeError: result.error,
                  geocodedAt: new Date().toISOString(),
                },
              }
            );
            failed++;
            
            send({
              type: 'result',
              current: i + 1,
              total,
              eventName: event.name,
              location: event.location,
              success: false,
              error: result.error,
            });
          }
        }

        // Get remaining count
        const remaining = await col.countDocuments(filter as any);

        send({
          type: 'complete',
          geocoded,
          failed,
          remaining,
          message: `Completed: ${geocoded} geocoded, ${failed} failed, ${remaining} remaining`,
        });

        controller.close();
      } catch (error) {
        send({ type: 'error', message: String(error) });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
