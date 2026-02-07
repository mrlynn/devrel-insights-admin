'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Lightbulb,
  Event,
  People,
  Download,
  Refresh,
} from '@mui/icons-material';

interface DashboardData {
  summary: {
    totalInsights: number;
    thisWeek: number;
    lastWeek: number;
    thisMonth: number;
    totalEvents: number;
    activeAdvocates: number;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  byType: Record<string, number>;
  byProductArea: Record<string, number>;
  byPriority: Record<string, number>;
  topAdvocates: Array<{ name: string; count: number }>;
  recentHighPriority: Array<{
    _id: string;
    text: string;
    type: string;
    priority: string;
    sentiment: string;
    advocateName: string;
    eventName?: string;
    capturedAt: string;
  }>;
  weeklyTrend: Array<{ week: string; count: number }>;
}

const priorityColors: Record<string, string> = {
  'Critical': '#D32F2F',
  'High': '#F57C00',
  'Medium': '#1976D2',
  'Low': '#757575',
};

export default function ExecutiveDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [insightsRes, eventsRes, advocatesRes] = await Promise.all([
        fetch('/api/insights?limit=500'),
        fetch('/api/events?limit=200'),
        fetch('/api/advocates'),
      ]);

      const [insightsData, eventsData, advocatesData] = await Promise.all([
        insightsRes.json(),
        eventsRes.json(),
        advocatesRes.json(),
      ]);

      const insights = insightsData.insights || [];
      const events = eventsData.events || [];
      const advocates = advocatesData.advocates || [];

      // Calculate time-based metrics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const thisWeek = insights.filter((i: any) => new Date(i.capturedAt) >= oneWeekAgo).length;
      const lastWeek = insights.filter((i: any) => {
        const date = new Date(i.capturedAt);
        return date >= twoWeeksAgo && date < oneWeekAgo;
      }).length;
      const thisMonth = insights.filter((i: any) => new Date(i.capturedAt) >= oneMonthAgo).length;

      // Sentiment breakdown
      const sentiment = { positive: 0, neutral: 0, negative: 0 };
      insights.forEach((i: any) => {
        if (i.sentiment === 'Positive') sentiment.positive++;
        else if (i.sentiment === 'Negative') sentiment.negative++;
        else sentiment.neutral++;
      });

      // By type
      const byType: Record<string, number> = {};
      insights.forEach((i: any) => {
        byType[i.type] = (byType[i.type] || 0) + 1;
      });

      // By product area
      const byProductArea: Record<string, number> = {};
      insights.forEach((i: any) => {
        (i.productAreas || []).forEach((area: string) => {
          byProductArea[area] = (byProductArea[area] || 0) + 1;
        });
      });

      // By priority
      const byPriority: Record<string, number> = {};
      insights.forEach((i: any) => {
        byPriority[i.priority] = (byPriority[i.priority] || 0) + 1;
      });

      // Top advocates
      const advocateCounts: Record<string, number> = {};
      insights.forEach((i: any) => {
        const name = i.advocateName || 'Unknown';
        advocateCounts[name] = (advocateCounts[name] || 0) + 1;
      });
      const topAdvocates = Object.entries(advocateCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent high-priority insights
      const recentHighPriority = insights
        .filter((i: any) => i.priority === 'Critical' || i.priority === 'High')
        .sort((a: any, b: any) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
        .slice(0, 10);

      // Weekly trend (last 8 weeks)
      const weeklyTrend: Array<{ week: string; count: number }> = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        const count = insights.filter((ins: any) => {
          const date = new Date(ins.capturedAt);
          return date >= weekStart && date < weekEnd;
        }).length;
        weeklyTrend.push({
          week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
        });
      }

      setData({
        summary: {
          totalInsights: insights.length,
          thisWeek,
          lastWeek,
          thisMonth,
          totalEvents: events.length,
          activeAdvocates: advocates.filter((a: any) => a.isActive).length,
        },
        sentiment,
        byType,
        byProductArea,
        byPriority,
        topAdvocates,
        recentHighPriority,
        weeklyTrend,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/insights?limit=1000');
      const data = await res.json();
      const insights = data.insights || [];

      // Create CSV
      const headers = ['Date', 'Type', 'Sentiment', 'Priority', 'Product Areas', 'Text', 'Event', 'Advocate', 'Tags'];
      const rows = insights.map((i: any) => [
        new Date(i.capturedAt).toISOString().split('T')[0],
        i.type,
        i.sentiment,
        i.priority,
        (i.productAreas || []).join('; '),
        `"${(i.text || '').replace(/"/g, '""')}"`,
        i.eventName || '',
        i.advocateName || '',
        (i.tags || []).join('; '),
      ]);

      const csv = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Executive Dashboard</Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography color="text.secondary">Failed to load dashboard data</Typography>
        <Button onClick={handleRefresh} sx={{ mt: 2 }}>Retry</Button>
      </Box>
    );
  }

  const weekTrend = data.summary.thisWeek - data.summary.lastWeek;
  const weekTrendPct = data.summary.lastWeek > 0 
    ? Math.round((weekTrend / data.summary.lastWeek) * 100) 
    : data.summary.thisWeek > 0 ? 100 : 0;

  const totalSentiment = data.sentiment.positive + data.sentiment.neutral + data.sentiment.negative;
  const maxProductArea = Math.max(...Object.values(data.byProductArea), 1);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Executive Dashboard</Typography>
          <Typography color="text.secondary">
            Developer insights overview • Updated {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Tooltip title="Refresh">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh className={refreshing ? 'spinning' : ''} />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<Download />} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </Stack>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2">Total Insights</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>{data.summary.totalInsights}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {data.summary.thisMonth} this month
                  </Typography>
                </Box>
                <Lightbulb sx={{ fontSize: 40, color: '#00ED64', opacity: 0.7 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2">This Week</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>{data.summary.thisWeek}</Typography>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {weekTrend >= 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: '#00ED64' }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: '#F44336' }} />
                    )}
                    <Typography variant="body2" color={weekTrend >= 0 ? 'success.main' : 'error.main'}>
                      {weekTrend >= 0 ? '+' : ''}{weekTrendPct}% vs last week
                    </Typography>
                  </Stack>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: '#2196F3', opacity: 0.7 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2">Events Tracked</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>{data.summary.totalEvents}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    across all regions
                  </Typography>
                </Box>
                <Event sx={{ fontSize: 40, color: '#9C27B0', opacity: 0.7 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography color="text.secondary" variant="body2">Active Advocates</Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, my: 1 }}>{data.summary.activeAdvocates}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    capturing insights
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: '#FF9800', opacity: 0.7 }} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sentiment & Priority */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Sentiment Breakdown</Typography>
              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SentimentSatisfied color="success" />
                      <Typography>Positive</Typography>
                    </Stack>
                    <Typography fontWeight={600}>
                      {data.sentiment.positive} ({totalSentiment > 0 ? Math.round((data.sentiment.positive / totalSentiment) * 100) : 0}%)
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={totalSentiment > 0 ? (data.sentiment.positive / totalSentiment) * 100 : 0} color="success" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SentimentNeutral color="action" />
                      <Typography>Neutral</Typography>
                    </Stack>
                    <Typography fontWeight={600}>
                      {data.sentiment.neutral} ({totalSentiment > 0 ? Math.round((data.sentiment.neutral / totalSentiment) * 100) : 0}%)
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={totalSentiment > 0 ? (data.sentiment.neutral / totalSentiment) * 100 : 0} color="inherit" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <SentimentDissatisfied color="error" />
                      <Typography>Negative</Typography>
                    </Stack>
                    <Typography fontWeight={600}>
                      {data.sentiment.negative} ({totalSentiment > 0 ? Math.round((data.sentiment.negative / totalSentiment) * 100) : 0}%)
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={totalSentiment > 0 ? (data.sentiment.negative / totalSentiment) * 100 : 0} color="error" sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>By Priority</Typography>
              <Stack spacing={1.5}>
                {['Critical', 'High', 'Medium', 'Low'].map((priority) => (
                  <Stack key={priority} direction="row" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={priority}
                      size="small"
                      sx={{
                        bgcolor: `${priorityColors[priority]}20`,
                        color: priorityColors[priority],
                        fontWeight: 600,
                        minWidth: 70,
                      }}
                    />
                    <Typography fontWeight={600}>{data.byPriority[priority] || 0}</Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Top Advocates</Typography>
              {data.topAdvocates.length === 0 ? (
                <Typography color="text.secondary">No data yet</Typography>
              ) : (
                <Stack spacing={1.5}>
                  {data.topAdvocates.map((advocate, idx) => (
                    <Stack key={advocate.name} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: idx === 0 ? '#FFD700' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : '#E0E0E0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {idx + 1}
                        </Typography>
                        <Typography>{advocate.name}</Typography>
                      </Stack>
                      <Chip label={advocate.count} size="small" />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Product Areas */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Insights by Product Area</Typography>
          <Grid container spacing={2}>
            {Object.entries(data.byProductArea)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([area, count]) => (
                <Grid key={area} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">{area}</Typography>
                      <Typography variant="body2" fontWeight={600}>{count}</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={(count / maxProductArea) * 100}
                      sx={{ height: 6, borderRadius: 3, bgcolor: '#E0E0E0', '& .MuiLinearProgress-bar': { bgcolor: '#00ED64' } }}
                    />
                  </Box>
                </Grid>
              ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Recent High Priority */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Recent High-Priority Insights</Typography>
          {data.recentHighPriority.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No critical or high priority insights yet
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell>Insight</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Advocate</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.recentHighPriority.map((insight) => (
                    <TableRow key={insight._id} hover>
                      <TableCell>
                        <Chip
                          label={insight.priority}
                          size="small"
                          sx={{
                            bgcolor: `${priorityColors[insight.priority]}20`,
                            color: priorityColors[insight.priority],
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 400 }}>
                        <Typography variant="body2">
                          {insight.text.length > 120 ? `${insight.text.slice(0, 120)}...` : insight.text}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{insight.type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {insight.eventName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{insight.advocateName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(insight.capturedAt).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Box>
  );
}
