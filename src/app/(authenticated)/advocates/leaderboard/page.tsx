'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Stack,
  Skeleton,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  EmojiEvents,
  TrendingUp,
  CalendarToday,
  Insights,
  ThumbUp,
  ThumbDown,
  Lightbulb,
  BugReport,
} from '@mui/icons-material';

interface LeaderboardEntry {
  advocateId: string;
  advocateName: string;
  totalInsights: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  criticalCount: number;
  highCount: number;
  featureRequests: number;
  bugReports: number;
  useCases: number;
  eventCount: number;
  impactScore: number;
  lastCapturedAt: string;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  period: string;
  totalInsights: number;
  totalAdvocates: number;
}

// Generate color from name
function stringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#00ED64', '#016BF8', '#00684A', '#5C6BC0', '#26A69A', '#7E57C2', '#EF5350', '#FF7043'];
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getMedalColor(rank: number): string {
  switch (rank) {
    case 0: return '#FFD700';
    case 1: return '#C0C0C0';
    case 2: return '#CD7F32';
    default: return 'transparent';
  }
}

function formatLastActive(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'all' | 'week' | 'month' | 'year'>('all');

  useEffect(() => {
    async function loadLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/insights/leaderboard?limit=25&period=${period}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, [period]);

  const maxImpact = data?.leaderboard?.[0]?.impactScore || 1;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmojiEvents sx={{ color: '#FFD700' }} />
            Advocate Leaderboard
          </Typography>
          <Typography color="text.secondary">
            {data?.totalAdvocates || 0} advocates • {data?.totalInsights || 0} total insights
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, v) => v && setPeriod(v)}
          size="small"
        >
          <ToggleButton value="week">This Week</ToggleButton>
          <ToggleButton value="month">This Month</ToggleButton>
          <ToggleButton value="year">This Year</ToggleButton>
          <ToggleButton value="all">All Time</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Top 3 Podium */}
      {data && data.leaderboard.length >= 3 && !loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mb: 4 }}>
          {[1, 0, 2].map((rank) => {
            const entry = data.leaderboard[rank];
            if (!entry) return null;
            const isFirst = rank === 0;
            return (
              <Card
                key={entry.advocateId}
                sx={{
                  width: isFirst ? 200 : 170,
                  textAlign: 'center',
                  py: 3,
                  transform: isFirst ? 'scale(1.1)' : 'none',
                  zIndex: isFirst ? 1 : 0,
                  border: `3px solid ${getMedalColor(rank)}`,
                }}
              >
                <Box sx={{ position: 'relative', display: 'inline-block' }}>
                  <Avatar
                    sx={{
                      width: isFirst ? 80 : 64,
                      height: isFirst ? 80 : 64,
                      mx: 'auto',
                      bgcolor: stringToColor(entry.advocateName),
                      fontSize: isFirst ? '2rem' : '1.5rem',
                      fontWeight: 600,
                    }}
                  >
                    {getInitials(entry.advocateName)}
                  </Avatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: getMedalColor(rank),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      color: rank === 0 ? '#000' : '#fff',
                      border: '2px solid white',
                    }}
                  >
                    {rank + 1}
                  </Box>
                </Box>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 600 }} noWrap>
                  {entry.advocateName}
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {entry.impactScore}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  impact points
                </Typography>
                <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                  <Chip size="small" icon={<Insights />} label={entry.totalInsights} />
                  <Chip size="small" icon={<CalendarToday />} label={entry.eventCount} />
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Full Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}>Rank</TableCell>
                <TableCell>Advocate</TableCell>
                <TableCell align="center">
                  <Tooltip title="Total Insights">
                    <Insights fontSize="small" />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Positive">
                    <ThumbUp fontSize="small" sx={{ color: '#00ED64' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Negative">
                    <ThumbDown fontSize="small" sx={{ color: '#F44336' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Feature Requests">
                    <Lightbulb fontSize="small" sx={{ color: '#FFC107' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Bug Reports">
                    <BugReport fontSize="small" sx={{ color: '#E53935' }} />
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  <Tooltip title="Events">
                    <CalendarToday fontSize="small" />
                  </Tooltip>
                </TableCell>
                <TableCell>Impact Score</TableCell>
                <TableCell>Last Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton width={30} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton width={150} />
                      </Box>
                    </TableCell>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}><Skeleton width={40} /></TableCell>
                    ))}
                    <TableCell><Skeleton width={60} /></TableCell>
                  </TableRow>
                ))
              ) : data?.leaderboard.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No insights captured yet</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data?.leaderboard.map((entry, index) => (
                  <TableRow
                    key={entry.advocateId}
                    sx={{
                      bgcolor: index < 3 ? `${getMedalColor(index)}10` : 'inherit',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: index < 3 ? getMedalColor(index) : 'grey.200',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                          color: index < 3 ? (index === 0 ? '#000' : '#fff') : 'text.secondary',
                        }}
                      >
                        {index + 1}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: stringToColor(entry.advocateName),
                            width: 40,
                            height: 40,
                          }}
                        >
                          {getInitials(entry.advocateName)}
                        </Avatar>
                        <Typography sx={{ fontWeight: 500 }}>{entry.advocateName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography sx={{ fontWeight: 600 }}>{entry.totalInsights}</Typography>
                    </TableCell>
                    <TableCell align="center">{entry.positiveCount}</TableCell>
                    <TableCell align="center">{entry.negativeCount}</TableCell>
                    <TableCell align="center">{entry.featureRequests}</TableCell>
                    <TableCell align="center">{entry.bugReports}</TableCell>
                    <TableCell align="center">{entry.eventCount}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: 'primary.main', minWidth: 40 }}>
                          {entry.impactScore}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={(entry.impactScore / maxImpact) * 100}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatLastActive(entry.lastCapturedAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Impact Score Explanation */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          <TrendingUp sx={{ fontSize: 18, verticalAlign: 'text-bottom', mr: 0.5 }} />
          How Impact Score Works
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Impact score rewards actionable insights: +1 per insight, +3 for Critical priority, +2 for High priority,
          +1.5 for Feature Requests & Bug Reports, +2 for Use Cases.
        </Typography>
      </Paper>
    </Box>
  );
}
