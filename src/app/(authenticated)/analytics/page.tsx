'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  LinearProgress,
  Stack,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  SentimentSatisfied,
  SentimentDissatisfied,
} from '@mui/icons-material';

interface Stats {
  byType: Record<string, number>;
  bySentiment: Record<string, number>;
  byPriority: Record<string, number>;
  byProductArea: Record<string, number>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'stats' }),
        });
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Analytics</Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width="40%" height={32} />
                  <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const hasData = stats && Object.values(stats).some((v) => Object.keys(v).length > 0);

  if (!hasData) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Analytics</Typography>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Data Yet
            </Typography>
            <Typography color="text.secondary">
              Analytics will populate as insights are captured from the mobile app.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const totalInsights = Object.values(stats.byType).reduce((a, b) => a + b, 0);
  const maxProductArea = Math.max(...Object.values(stats.byProductArea), 1);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Analytics</Typography>
        <Typography color="text.secondary">
          Insights breakdown and trends
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Sentiment Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Sentiment Distribution
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {['Positive', 'Neutral', 'Negative'].map((sentiment) => {
                  const count = stats.bySentiment[sentiment] || 0;
                  const pct = totalInsights > 0 ? (count / totalInsights) * 100 : 0;
                  return (
                    <Box key={sentiment}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {sentiment === 'Positive' ? (
                            <SentimentSatisfied color="success" fontSize="small" />
                          ) : sentiment === 'Negative' ? (
                            <SentimentDissatisfied color="error" fontSize="small" />
                          ) : (
                            <TrendingUp color="action" fontSize="small" />
                          )}
                          <Typography variant="body2">{sentiment}</Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {count} ({pct.toFixed(0)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct}
                        color={
                          sentiment === 'Positive'
                            ? 'success'
                            : sentiment === 'Negative'
                            ? 'error'
                            : 'inherit'
                        }
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Type Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Insight Types
              </Typography>
              <Stack spacing={2} sx={{ mt: 2 }}>
                {Object.entries(stats.byType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => {
                    const pct = totalInsights > 0 ? (count / totalInsights) * 100 : 0;
                    return (
                      <Box key={type}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">{type}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {count} ({pct.toFixed(0)}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={pct}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    );
                  })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Priority Distribution */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Priority Breakdown
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {['Critical', 'High', 'Medium', 'Low'].map((priority) => {
                  const count = stats.byPriority[priority] || 0;
                  const colorMap: Record<string, 'error' | 'warning' | 'info' | 'default'> = {
                    Critical: 'error',
                    High: 'warning',
                    Medium: 'info',
                    Low: 'default',
                  };
                  return (
                    <Chip
                      key={priority}
                      label={`${priority}: ${count}`}
                      color={colorMap[priority]}
                      sx={{ mb: 1 }}
                    />
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Product Areas */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Areas
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {Object.entries(stats.byProductArea)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([area, count]) => (
                    <Box key={area}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">{area}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {count}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(count / maxProductArea) * 100}
                        color="primary"
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
