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
  PictureAsPdf,
  Print,
} from '@mui/icons-material';
import jsPDF from 'jspdf';
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

  const downloadPDF = () => {
    if (!aiSummary || !data) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let yPos = margin;

    // Helper to draw a pie chart
    const drawPieChart = (centerX: number, centerY: number, radius: number, slices: Array<{value: number, color: [number, number, number], label: string}>) => {
      const total = slices.reduce((sum, s) => sum + s.value, 0);
      if (total === 0) return;
      
      let startAngle = -Math.PI / 2;
      slices.forEach((slice) => {
        const sliceAngle = (slice.value / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        // Draw slice
        pdf.setFillColor(...slice.color);
        
        // Create pie slice path
        const steps = 30;
        const points: [number, number][] = [[centerX, centerY]];
        for (let i = 0; i <= steps; i++) {
          const angle = startAngle + (sliceAngle * i / steps);
          points.push([
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
          ]);
        }
        
        // Draw as polygon
        pdf.setDrawColor(255, 255, 255);
        pdf.setLineWidth(0.5);
        
        // Use triangle fan approach
        for (let i = 1; i < points.length - 1; i++) {
          pdf.triangle(
            points[0][0], points[0][1],
            points[i][0], points[i][1],
            points[i + 1][0], points[i + 1][1],
            'F'
          );
        }
        
        startAngle = endAngle;
      });
    };

    // Helper to draw horizontal bar chart
    const drawBarChart = (x: number, y: number, width: number, items: Array<{label: string, value: number, color: [number, number, number]}>) => {
      const maxValue = Math.max(...items.map(i => i.value), 1);
      const barHeight = 6;
      const gap = 8;
      
      items.forEach((item, idx) => {
        const barY = y + idx * (barHeight + gap);
        const barWidth = (item.value / maxValue) * (width - 40);
        
        // Label
        pdf.setFontSize(8);
        pdf.setTextColor(60, 60, 60);
        pdf.text(item.label.slice(0, 15), x, barY + 4);
        
        // Bar
        pdf.setFillColor(...item.color);
        pdf.roundedRect(x + 42, barY, barWidth, barHeight, 1, 1, 'F');
        
        // Value
        pdf.setFontSize(7);
        pdf.setTextColor(100, 100, 100);
        pdf.text(String(item.value), x + 44 + barWidth + 2, barY + 4);
      });
      
      return items.length * (barHeight + gap);
    };

    // MongoDB green header bar
    pdf.setFillColor(0, 237, 100);
    pdf.rect(0, 0, pageWidth, 25, 'F');

    // Title
    pdf.setTextColor(0, 30, 43);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DevRel Insights Executive Summary', margin, 17);

    yPos = 35;

    // Period and date
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${aiSummary.period} Report`, margin, yPos);
    pdf.text(`Generated: ${new Date(aiSummary.generatedAt).toLocaleDateString()}`, pageWidth - margin - 50, yPos);
    
    yPos += 12;

    // Stats boxes
    const boxWidth = (contentWidth - 10) / 3;
    const statsData = [
      { label: 'Insights', value: aiSummary.stats.total, color: [0, 237, 100] as [number, number, number] },
      { label: 'Events', value: aiSummary.stats.events, color: [1, 107, 248] as [number, number, number] },
      { label: 'Advocates', value: aiSummary.stats.advocates, color: [124, 58, 237] as [number, number, number] },
    ];
    
    statsData.forEach((stat, idx) => {
      const boxX = margin + idx * (boxWidth + 5);
      pdf.setFillColor(250, 250, 250);
      pdf.roundedRect(boxX, yPos, boxWidth, 18, 2, 2, 'F');
      pdf.setFillColor(...stat.color);
      pdf.rect(boxX, yPos, 3, 18, 'F');
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...stat.color);
      pdf.text(String(stat.value), boxX + 8, yPos + 12);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(stat.label, boxX + 28, yPos + 12);
    });
    
    yPos += 28;

    // Charts section
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 30, 43);
    pdf.text('Insights Overview', margin, yPos);
    yPos += 8;

    // Sentiment pie chart
    const sentimentData = data.charts.sentiment;
    const sentimentColors: Record<string, [number, number, number]> = {
      Positive: [0, 237, 100],
      Neutral: [1, 107, 248],
      Negative: [239, 68, 68],
    };
    
    const pieSlices = sentimentData.map(s => ({
      value: s.value,
      color: sentimentColors[s.name] || [150, 150, 150],
      label: s.name,
    }));
    
    drawPieChart(margin + 25, yPos + 25, 20, pieSlices);
    
    // Pie legend
    let legendY = yPos + 8;
    pdf.setFontSize(8);
    pieSlices.forEach((slice) => {
      pdf.setFillColor(...slice.color);
      pdf.rect(margin + 50, legendY - 3, 4, 4, 'F');
      pdf.setTextColor(60, 60, 60);
      pdf.text(`${slice.label}: ${slice.value}`, margin + 56, legendY);
      legendY += 7;
    });

    // Insight types bar chart
    const typesData = data.charts.types.slice(0, 5);
    const typeColors: [number, number, number][] = [
      [0, 237, 100], [1, 107, 248], [124, 58, 237], [20, 184, 166], [255, 192, 16]
    ];
    
    const barItems = typesData.map((t, i) => ({
      label: t.name,
      value: t.value,
      color: typeColors[i % typeColors.length],
    }));
    
    drawBarChart(margin + 85, yPos, 85, barItems);
    
    yPos += 55;

    // Key Themes
    if (aiSummary.themes && aiSummary.themes.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 30, 43);
      pdf.text('Key Themes', margin, yPos);
      yPos += 7;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Draw themes as chips
      let chipX = margin;
      aiSummary.themes.forEach((theme) => {
        const chipWidth = pdf.getTextWidth(theme) + 8;
        if (chipX + chipWidth > pageWidth - margin) {
          chipX = margin;
          yPos += 8;
        }
        pdf.setFillColor(240, 230, 255);
        pdf.roundedRect(chipX, yPos - 4, chipWidth, 7, 2, 2, 'F');
        pdf.setTextColor(124, 58, 237);
        pdf.setFontSize(8);
        pdf.text(theme, chipX + 4, yPos);
        chipX += chipWidth + 3;
      });
      yPos += 12;
    }

    // Summary content
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 30, 43);
    pdf.text('Executive Summary', margin, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(40, 40, 40);
    
    const lines = pdf.splitTextToSize(aiSummary.summary, contentWidth);
    const lineHeight = 5;
    
    lines.forEach((line: string) => {
      if (yPos > pageHeight - margin - 15) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += lineHeight;
    });

    // Footer on last page
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('MongoDB Developer Relations  •  devrel-insights-admin.vercel.app', margin, pageHeight - 10);

    // Download
    const filename = `devrel-insights-${aiSummary.period.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(filename);
  };

  const handlePrint = () => {
    if (!aiSummary) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DevRel Insights - ${aiSummary.period}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #001E2B; }
          .header { background: #00ED64; padding: 20px; margin: -40px -40px 30px -40px; }
          .header h1 { margin: 0; font-size: 24px; }
          .meta { color: #666; margin-bottom: 20px; display: flex; justify-content: space-between; }
          .stats { background: #f5f5f5; padding: 10px 15px; border-radius: 4px; margin-bottom: 20px; }
          .themes { margin-bottom: 20px; }
          .themes h3 { font-size: 14px; margin-bottom: 8px; }
          .theme-chip { display: inline-block; background: #f0e6ff; color: #7C3AED; padding: 4px 12px; border-radius: 16px; margin: 4px 4px 4px 0; font-size: 12px; }
          .summary { line-height: 1.8; }
          .summary p { margin-bottom: 16px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
          @media print { .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header"><h1>DevRel Insights Executive Summary</h1></div>
        <div class="meta">
          <span>${aiSummary.period} Report</span>
          <span>Generated: ${new Date(aiSummary.generatedAt).toLocaleDateString()}</span>
        </div>
        <div class="stats">
          <strong>${aiSummary.stats.total}</strong> Insights &nbsp;•&nbsp;
          <strong>${aiSummary.stats.events}</strong> Events &nbsp;•&nbsp;
          <strong>${aiSummary.stats.advocates}</strong> Advocates
        </div>
        ${aiSummary.themes?.length ? `
          <div class="themes">
            <h3>Key Themes</h3>
            ${aiSummary.themes.map((t) => `<span class="theme-chip">${t}</span>`).join('')}
          </div>
        ` : ''}
        <div class="summary">
          ${aiSummary.summary.split('\n\n').map((p) => `<p>${p}</p>`).join('')}
        </div>
        <div class="footer">MongoDB Developer Relations • devrel-insights-admin.vercel.app</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
                <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <MuiTooltip title={copied ? 'Copied!' : 'Copy to clipboard'}>
                    <IconButton onClick={copyToClipboard} size="small">
                      {copied ? <Check color="success" /> : <ContentCopy fontSize="small" />}
                    </IconButton>
                  </MuiTooltip>
                  <MuiTooltip title="Download PDF">
                    <IconButton onClick={downloadPDF} size="small">
                      <PictureAsPdf fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
                  <MuiTooltip title="Print">
                    <IconButton onClick={handlePrint} size="small">
                      <Print fontSize="small" />
                    </IconButton>
                  </MuiTooltip>
                </Stack>
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
