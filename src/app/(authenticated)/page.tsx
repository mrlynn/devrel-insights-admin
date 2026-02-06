'use client';

import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Skeleton, Chip, Stack } from '@mui/material';
import { Event, Lightbulb, TrendingUp, People, Map } from '@mui/icons-material';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const EventMap = dynamic(() => import('@/components/EventMap'), {
  ssr: false,
  loading: () => (
    <Box sx={{ height: 400, bgcolor: 'background.default', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Typography color="text.secondary">Loading map...</Typography>
    </Box>
  ),
});

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtitle?: string;
  color?: string;
}

function StatCard({ title, value, icon, subtitle, color = '#00ED64' }: StatCardProps) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}20`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

interface Insight {
  _id: string;
  type: string;
  sentiment: string;
  text: string;
  capturedAt: string;
  advocateName: string;
  eventName?: string;
}

interface DashboardData {
  eventCount: number;
  insightCount: number;
  thisWeekCount: number;
  recentInsights: Insight[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [eventsRes, insightsRes] = await Promise.all([
          fetch('/api/events?limit=1'),
          fetch('/api/insights?limit=5'),
        ]);

        if (!eventsRes.ok || !insightsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const eventsData = await eventsRes.json();
        const insightsData = await insightsRes.json();

        setData({
          eventCount: eventsData.total || 0,
          insightCount: insightsData.total || 0,
          thisWeekCount: 0, // TODO: Calculate from insights
          recentInsights: insightsData.insights || [],
        });
      } catch (err) {
        setError('Failed to connect to MongoDB. Please check your MONGODB_URI in .env.local');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard</Typography>
          <Typography color="text.secondary">Overview of DevRel events and insights</Typography>
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" height={60} />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard</Typography>
        </Box>
        <Card>
          <CardContent>
            <Typography color="error">{error}</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Dashboard</Typography>
        <Typography color="text.secondary">Overview of DevRel events and insights</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Events"
            value={data?.eventCount || 0}
            icon={<Event fontSize="large" />}
            subtitle="All time"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Insights"
            value={data?.insightCount || 0}
            icon={<Lightbulb fontSize="large" />}
            subtitle="Captured by advocates"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="This Week"
            value={data?.thisWeekCount || 0}
            icon={<TrendingUp fontSize="large" />}
            subtitle="New insights"
            color="#016BF8"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Advocates"
            value="-"
            icon={<People fontSize="large" />}
            subtitle="Active team"
            color="#00684A"
          />
        </Grid>
      </Grid>

      {/* Event Map */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Map /> Event Locations
          </Typography>
          <EventMap height={400} />
        </CardContent>
      </Card>

      {/* Recent Insights */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Recent Insights
          </Typography>
          {!data?.recentInsights.length ? (
            <Typography color="text.secondary">
              No insights captured yet. Start capturing insights from the mobile app!
            </Typography>
          ) : (
            <Stack spacing={2}>
              {data.recentInsights.map((insight) => (
                <Box
                  key={insight._id}
                  sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={insight.type} size="small" />
                    <Chip
                      label={insight.sentiment}
                      size="small"
                      color={
                        insight.sentiment === 'Positive'
                          ? 'success'
                          : insight.sentiment === 'Negative'
                          ? 'error'
                          : 'default'
                      }
                      variant="outlined"
                    />
                    {insight.eventName && (
                      <Chip label={insight.eventName} size="small" variant="outlined" />
                    )}
                  </Box>
                  <Typography variant="body2">{insight.text}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(insight.capturedAt).toLocaleString()} • {insight.advocateName}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
