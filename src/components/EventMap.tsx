'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';
import dynamic from 'next/dynamic';
import L from 'leaflet';

// Fix Leaflet marker icons not loading in Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface EventLocation {
  _id: string;
  name: string;
  location: string;
  startDate?: string;
  status: string;
  eventType: string;
  geo: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  geoCity?: string;
  geoCountry?: string;
}

interface EventMapProps {
  events?: EventLocation[];
  height?: number | string;
}

export default function EventMap({ events: propEvents, height = 400 }: EventMapProps) {
  const [events, setEvents] = useState<EventLocation[]>(propEvents || []);
  const [loading, setLoading] = useState(!propEvents);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (propEvents) {
      setEvents(propEvents);
      return;
    }

    // Fetch events with geo coordinates
    fetch('/api/events?limit=200')
      .then((res) => res.json())
      .then((data) => {
        const geoEvents = (data.events || []).filter(
          (e: any) => e.geo?.coordinates?.length === 2
        );
        setEvents(geoEvents);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [propEvents]);

  // Calculate center from events or default to world view
  const getCenter = (): [number, number] => {
    if (events.length === 0) return [20, 0]; // World center
    
    const lats = events.map((e) => e.geo.coordinates[1]);
    const lngs = events.map((e) => e.geo.coordinates[0]);
    
    return [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length,
    ];
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
      COMPLETED: 'success',
      ASSIGNED: 'info',
      CONFIRMING: 'warning',
      CANCELLED: 'error',
      NEEDS_STAFFING: 'error',
    };
    return colors[status] || 'default';
  };

  if (!mounted) {
    return (
      <Box
        sx={{
          height,
          bgcolor: 'background.default',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">Loading map...</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          height,
          bgcolor: 'background.default',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">Loading events...</Typography>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box
        sx={{
          height,
          bgcolor: 'background.default',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Typography color="text.secondary">No geocoded events yet</Typography>
        <Typography variant="caption" color="text.secondary">
          Import events and run geocoding to see them on the map
        </Typography>
      </Box>
    );
  }

  const center = getCenter();

  return (
    <Box sx={{ height, borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={2}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {events.map((event) => (
          <Marker
            key={event._id}
            position={[event.geo.coordinates[1], event.geo.coordinates[0]]}
          >
            <Popup>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {event.name}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {event.geoCity && `${event.geoCity}, `}
                  {event.geoCountry || event.location}
                </Typography>
                {event.startDate && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    {new Date(event.startDate).toLocaleDateString()}
                  </Typography>
                )}
                <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
                  <Chip
                    label={event.status}
                    size="small"
                    color={getStatusColor(event.status)}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                  <Chip
                    label={event.eventType}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                </Stack>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          bgcolor: 'background.paper',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          zIndex: 1000,
        }}
      >
        <Typography variant="caption">{events.length} events</Typography>
      </Box>
    </Box>
  );
}
