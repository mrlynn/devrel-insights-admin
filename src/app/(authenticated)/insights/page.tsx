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
  Chip,
  Skeleton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search, SentimentSatisfied, SentimentNeutral, SentimentDissatisfied } from '@mui/icons-material';

interface Insight {
  _id: string;
  type: string;
  text: string;
  sentiment: string;
  priority: string;
  productAreas: string[];
  tags: string[];
  eventName?: string;
  advocateName: string;
  capturedAt: string;
}

const priorityColors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  'Low': 'default',
  'Medium': 'info',
  'High': 'warning',
  'Critical': 'error',
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    sentiment: '',
    priority: '',
    search: '',
  });

  useEffect(() => {
    async function loadInsights() {
      try {
        const params = new URLSearchParams();
        if (filters.type) params.set('type', filters.type);
        if (filters.sentiment) params.set('sentiment', filters.sentiment);
        if (filters.priority) params.set('priority', filters.priority);
        
        const res = await fetch(`/api/insights?${params}`);
        const data = await res.json();
        setInsights(data.insights || []);
      } catch (err) {
        console.error('Failed to load insights:', err);
      } finally {
        setLoading(false);
      }
    }
    loadInsights();
  }, [filters.type, filters.sentiment, filters.priority]);

  const filteredInsights = insights.filter((insight) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        insight.text.toLowerCase().includes(search) ||
        insight.tags.some((t) => t.includes(search)) ||
        insight.eventName?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive':
        return <SentimentSatisfied color="success" />;
      case 'Negative':
        return <SentimentDissatisfied color="error" />;
      default:
        return <SentimentNeutral color="action" />;
    }
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>Insights</Typography>
        <Card>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Insights</Typography>
        <Typography color="text.secondary">
          Developer feedback captured at events ({insights.length} total)
        </Typography>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              size="small"
              placeholder="Search insights..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                label="Type"
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Pain Point">Pain Point</MenuItem>
                <MenuItem value="Feature Request">Feature Request</MenuItem>
                <MenuItem value="Praise">Praise</MenuItem>
                <MenuItem value="Question">Question</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sentiment</InputLabel>
              <Select
                value={filters.sentiment}
                label="Sentiment"
                onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Positive">Positive</MenuItem>
                <MenuItem value="Neutral">Neutral</MenuItem>
                <MenuItem value="Negative">Negative</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Insights Table */}
      <Card>
        {filteredInsights.length === 0 ? (
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Insights Yet
            </Typography>
            <Typography color="text.secondary">
              Insights will appear here when captured from the mobile app.
            </Typography>
          </CardContent>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={40}></TableCell>
                  <TableCell>Insight</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Advocate</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInsights.map((insight) => (
                  <TableRow key={insight._id} hover>
                    <TableCell>{getSentimentIcon(insight.sentiment)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 400 }}>
                        {insight.text.length > 150
                          ? `${insight.text.substring(0, 150)}...`
                          : insight.text}
                      </Typography>
                      {insight.tags.length > 0 && (
                        <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                          {insight.tags.slice(0, 3).map((tag) => (
                            <Chip key={tag} label={tag} size="small" variant="outlined" />
                          ))}
                          {insight.tags.length > 3 && (
                            <Chip label={`+${insight.tags.length - 3}`} size="small" />
                          )}
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={insight.type} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={insight.priority}
                        size="small"
                        color={priorityColors[insight.priority] || 'default'}
                      />
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
      </Card>
    </Box>
  );
}
