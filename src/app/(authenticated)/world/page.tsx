'use client';

/**
 * World Map - Active Users Dashboard
 * 
 * Shows where DevRel Insights users are around the world.
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Paper,
  Divider,
} from '@mui/material';
import {
  Public as GlobeIcon,
  Person as PersonIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  LocationOn as LocationIcon,
  PhoneIphone as PhoneIcon,
  Android as AndroidIcon,
  Apple as AppleIcon,
} from '@mui/icons-material';

interface UserLocation {
  userId: string;
  userName: string;
  lastLocation: {
    country: string;
    countryCode: string;
    city: string;
    lat: number;
    lon: number;
  };
  lastSeen: string;
  platform: string;
  pingCount: number;
}

interface CountryStat {
  _id: string;
  country: string;
  count: number;
  users: { name: string; city: string }[];
}

interface AnalyticsData {
  activeUsers: UserLocation[];
  countryStats: CountryStat[];
  totalPings: number;
  since: string;
  hours: number;
}

// Country flag emoji from country code
const getFlagEmoji = (countryCode: string) => {
  if (!countryCode) return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const formatTimeAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export default function WorldPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('24');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/ping?hours=${timeRange}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRange: string | null
  ) => {
    if (newRange) setTimeRange(newRange);
  };

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GlobeIcon color="primary" /> Users Around the World
          </Typography>
          <Typography variant="body2" color="text.secondary">
            See where DevRel Insights is being used
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={timeRange}
          exclusive
          onChange={handleTimeRangeChange}
          size="small"
        >
          <ToggleButton value="1">1h</ToggleButton>
          <ToggleButton value="24">24h</ToggleButton>
          <ToggleButton value="168">7d</ToggleButton>
          <ToggleButton value="720">30d</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {data?.activeUsers.length || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Active Users
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <GlobeIcon color="success" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {data?.countryStats.length || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Countries
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingIcon color="info" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {data?.totalPings || 0}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Total Pings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon color="warning" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {timeRange}h
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Time Window
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Countries List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                🌍 By Country
              </Typography>
              {data?.countryStats.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No data yet. Users will appear here when they open the app.
                </Typography>
              ) : (
                <List>
                  {data?.countryStats.map((stat, index) => (
                    <React.Fragment key={stat._id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'transparent', fontSize: '2rem' }}>
                            {getFlagEmoji(stat._id)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={stat.country}
                          secondary={stat.users.slice(0, 3).map(u => u.city).filter(Boolean).join(', ')}
                        />
                        <Chip
                          label={stat.count}
                          size="small"
                          color={index === 0 ? 'primary' : 'default'}
                        />
                      </ListItem>
                      {index < (data?.countryStats.length || 0) - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Users */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                👥 Recent Activity
              </Typography>
              {data?.activeUsers.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No recent activity. Check back later!
                </Typography>
              ) : (
                <List>
                  {data?.activeUsers
                    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
                    .slice(0, 10)
                    .map((user, index) => (
                      <React.Fragment key={user.userId}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              {user.userName?.[0]?.toUpperCase() || '?'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {user.userName || 'Anonymous'}
                                {user.platform === 'ios' && <AppleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                                {user.platform === 'android' && <AndroidIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
                              </Box>
                            }
                            secondary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationIcon sx={{ fontSize: 14 }} />
                                {user.lastLocation?.city}, {user.lastLocation?.country}
                              </Box>
                            }
                          />
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatTimeAgo(user.lastSeen)}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {user.pingCount} pings
                            </Typography>
                          </Box>
                        </ListItem>
                        {index < Math.min((data?.activeUsers.length || 0), 10) - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Map placeholder - can add react-simple-maps later */}
      <Paper sx={{ mt: 3, p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
        <GlobeIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          Interactive World Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Coming soon — user locations will be displayed on a map
        </Typography>
      </Paper>
    </Box>
  );
}
