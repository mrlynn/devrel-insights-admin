'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Chip,
  Stack,
  Avatar,
  Paper,
  alpha,
  useTheme,
  Button,
  CircularProgress,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  IconButton,
  Tooltip as MuiTooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Event,
  SentimentSatisfied,
  EmojiEvents,
  Warning,
  Speed,
  AutoAwesome,
  ContentCopy,
  Check,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

// MongoDB brand colors
const COLORS = {
  primary: '#00ED64',
  secondary: '#016BF8',
  dark: '#001E2B',
  success: '#00ED64',
  warning: '#FFC010',
  error: '#EF4444',
  purple: '#7C3AED',
  teal: '#14B8A6',
};

const CHART_COLORS = ['#00ED64', '#016BF8', '#7C3AED', '#14B8A6', '#FFC010', '#EF4444', '#EC4899', '#F97316'];

const SENTIMENT_COLORS: Record<string, string> = {
  Positive: '#00ED64',
  Neutral: '#016BF8',
  Negative: '#EF4444',
};

const PRIORITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High: '#F97316',
  Medium: '#FFC010',
  Low: '#14B8A6',
};

interface DashboardData {
  summary: {
    totalInsights: number;
    totalEvents: number;
    last30Days: number;
    trend: number;
    sentimentScore: number;
    avgInsightsPerEvent: number;
  };
  charts: {
    insightsByDay: Array<{ date: string; total: number; positive: number; negative: number; neutral: number }>;
    sentiment: Array<{ name: string; value: number }>;
    types: Array<{ name: string; value: number }>;
    productAreas: Array<{ name: string; count: number }>;
    priority: Array<{ name: string; value: number }>;
    topEvents: Array<{ name: string; insights: number; positive: number; negative: number }>;
  };
  lists: {
    criticalItems: Array<{ id: string; text: string; type: string; priority: string; event: string; capturedAt: string }>;
    topAdvocates: Array<{ id: string; name: string; count: number }>;
  };
}

interface AISummary {
  summary: string;
  themes: string[];
  stats: {
    total: number;
    events: number;
    advocates: number;
  };
  period: string;
  generatedAt: string;
}

// Metric Card Component
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = COLORS.primary,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}) {
  const theme = useTheme();
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(color, 0.1)} 0%, ${alpha(color, 0.05)} 100%)`,
        border: `1px solid ${alpha(color, 0.2)}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                {trend >= 0 ? (
                  <TrendingUp sx={{ color: COLORS.success, fontSize: 18 }} />
                ) : (
                  <TrendingDown sx={{ color: COLORS.error, fontSize: 18 }} />
                )}
                <Typography
                  variant="body2"
                  sx={{ color: trend >= 0 ? COLORS.success : COLORS.error, fontWeight: 600 }}
                >
                  {trend >= 0 ? '+' : ''}{trend}% vs last month
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: alpha(color, 0.15),
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

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <Paper sx={{ p: 1.5, bgcolor: 'background.paper', boxShadow: 3 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>{label}</Typography>
      {payload.map((entry: any, idx: number) => (
        <Typography key={idx} variant="body2" sx={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </Typography>
      ))}
    </Paper>
  );
}

// Get initials for avatar
function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

// Generate consistent color from name
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return CHART_COLORS[Math.abs(hash) % CHART_COLORS.length];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryPeriod, setSummaryPeriod] = useState<string>('quarter');
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const generateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch('/api/insights/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: summaryPeriod }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiSummary(json);
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (aiSummary?.summary) {
      navigator.clipboard.writeText(aiSummary.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Executive Dashboard</Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>Developer insights from the field</Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
              <Card><CardContent><Skeleton variant="rectangular" height={120} /></CardContent></Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Executive Dashboard</Typography>
        <Card><CardContent><Typography color="error">Failed to load dashboard data</Typography></CardContent></Card>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          Executive Dashboard
        </Typography>
        <Typography color="text.secondary">
          Real-time developer insights from conferences and events
        </Typography>
      </Box>

      {/* AI Executive Summary */}
      <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${alpha(COLORS.purple, 0.1)} 0%, ${alpha(COLORS.secondary, 0.05)} 100%)`, border: `1px solid ${alpha(COLORS.purple, 0.2)}` }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesome sx={{ color: COLORS.purple }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                AI Executive Summary
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ToggleButtonGroup
                value={summaryPeriod}
                exclusive
                onChange={(_, v) => v && setSummaryPeriod(v)}
                size="small"
              >
                <ToggleButton value="week">Week</ToggleButton>
                <ToggleButton value="month">Month</ToggleButton>
                <ToggleButton value="quarter">Quarter</ToggleButton>
              </ToggleButtonGroup>
              <Button
                variant="contained"
                onClick={generateSummary}
                disabled={summaryLoading}
                startIcon={summaryLoading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
                sx={{ bgcolor: COLORS.purple, '&:hover': { bgcolor: alpha(COLORS.purple, 0.85) } }}
              >
                {summaryLoading ? 'Generating...' : 'Generate Summary'}
              </Button>
            </Box>
          </Box>

          {aiSummary ? (
            <Box>
              {/* Themes */}
              {aiSummary.themes && aiSummary.themes.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Key Themes:
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {aiSummary.themes.map((theme, idx) => (
                      <Chip
                        key={idx}
                        label={theme}
                        size="small"
                        sx={{ bgcolor: alpha(COLORS.purple, 0.15), color: COLORS.purple, fontWeight: 500 }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {/* Summary Text */}
              <Paper sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2, position: 'relative' }}>
                <MuiTooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                  <IconButton
                    onClick={copyToClipboard}
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8 }}
                  >
                    {copied ? <Check color="success" /> : <ContentCopy fontSize="small" />}
                  </IconButton>
                </MuiTooltip>
                <Typography
                  variant="body1"
                  sx={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', pr: 4 }}
                >
                  {aiSummary.summary}
                </Typography>
              </Paper>

              {/* Stats Footer */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Stack direction="row" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    Based on <strong>{aiSummary.stats.total}</strong> insights from <strong>{aiSummary.stats.events}</strong> events
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Generated: {new Date(aiSummary.generatedAt).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                Click "Generate Summary" to create an AI-powered executive brief from your insights data.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Perfect for quarterly reviews, stakeholder updates, and CMO reporting.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Total Insights"
            value={data.summary.totalInsights.toLocaleString()}
            subtitle="All time"
            icon={<Lightbulb fontSize="large" />}
            trend={data.summary.trend}
            color={COLORS.primary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Events Covered"
            value={data.summary.totalEvents}
            subtitle={`${data.summary.avgInsightsPerEvent} insights/event avg`}
            icon={<Event fontSize="large" />}
            color={COLORS.secondary}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Last 30 Days"
            value={data.summary.last30Days}
            subtitle="New insights captured"
            icon={<Speed fontSize="large" />}
            color={COLORS.purple}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <MetricCard
            title="Sentiment Score"
            value={`${data.summary.sentimentScore}%`}
            subtitle="Developer satisfaction"
            icon={<SentimentSatisfied fontSize="large" />}
            color={data.summary.sentimentScore >= 60 ? COLORS.success : data.summary.sentimentScore >= 40 ? COLORS.warning : COLORS.error}
          />
        </Grid>
      </Grid>

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Insights Over Time */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Insights Trend (90 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.charts.insightsByDay}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis
                    dataKey="date"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 12 } as any}
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 12 } as any} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                    name="Total"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Sentiment Pie */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Sentiment Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.charts.sentiment}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.charts.sentiment.map((entry, idx) => (
                      <Cell key={idx} fill={SENTIMENT_COLORS[entry.name] || CHART_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Product Areas */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Top Product Areas
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.charts.productAreas} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis type="number" stroke={theme.palette.text.secondary} tick={{ fontSize: 12 } as any} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 12 } as any}
                    width={120}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Mentions" radius={[0, 4, 4, 0]}>
                    {data.charts.productAreas.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Insight Types */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Insight Types
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.charts.types}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis
                    dataKey="name"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 11, angle: -45, textAnchor: 'end' } as any}
                    height={80}
                  />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 12 } as any} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Count" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 3 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Events */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Event Performance
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.charts.topEvents}>
                  <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.text.primary, 0.1)} />
                  <XAxis
                    dataKey="name"
                    stroke={theme.palette.text.secondary}
                    tick={{ fontSize: 11, angle: -30, textAnchor: 'end' } as any}
                    height={100}
                  />
                  <YAxis stroke={theme.palette.text.secondary} tick={{ fontSize: 12 } as any} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="positive" name="Positive" stackId="a" fill={COLORS.success} />
                  <Bar dataKey="negative" name="Negative" stackId="a" fill={COLORS.error} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Advocates */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmojiEvents sx={{ color: '#FFD700' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Top Contributors
                </Typography>
              </Box>
              <Stack spacing={2}>
                {data.lists.topAdvocates.map((advocate, idx) => (
                  <Box
                    key={advocate.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: idx === 0 ? alpha('#FFD700', 0.1) : 'background.default',
                    }}
                  >
                    <Typography
                      sx={{
                        width: 24,
                        fontWeight: 700,
                        color: idx < 3 ? ['#FFD700', '#C0C0C0', '#CD7F32'][idx] : 'text.secondary',
                      }}
                    >
                      #{idx + 1}
                    </Typography>
                    <Avatar sx={{ bgcolor: stringToColor(advocate.name), width: 36, height: 36 }}>
                      {getInitials(advocate.name)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {advocate.name}
                      </Typography>
                    </Box>
                    <Chip
                      label={advocate.count}
                      size="small"
                      sx={{
                        bgcolor: COLORS.primary,
                        color: COLORS.dark,
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Critical Items */}
      {data.lists.criticalItems.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Warning sx={{ color: COLORS.error }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Needs Attention
              </Typography>
            </Box>
            <Stack spacing={2}>
              {data.lists.criticalItems.map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: 'background.default',
                    borderLeft: 4,
                    borderColor: PRIORITY_COLORS[item.priority] || COLORS.warning,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={item.priority}
                      size="small"
                      sx={{
                        bgcolor: alpha(PRIORITY_COLORS[item.priority] || COLORS.warning, 0.2),
                        color: PRIORITY_COLORS[item.priority] || COLORS.warning,
                        fontWeight: 600,
                      }}
                    />
                    <Chip label={item.type} size="small" variant="outlined" />
                    {item.event && <Chip label={item.event} size="small" variant="outlined" />}
                  </Box>
                  <Typography variant="body2">{item.text}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(item.capturedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
