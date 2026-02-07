'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Button,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Search,
  SentimentSatisfied,
  SentimentNeutral,
  SentimentDissatisfied,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import InsightFormDialog, { InsightFormData } from '@/components/InsightFormDialog';

interface Insight {
  _id: string;
  type: string;
  text: string;
  sentiment: string;
  priority: string;
  productAreas: string[];
  tags: string[];
  eventId?: string;
  eventName?: string;
  advocateName: string;
  advocateId?: string;
  followUpRequired?: boolean;
  capturedAt: string;
}

interface Event {
  _id: string;
  name: string;
}

const priorityColors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  'Low': 'default',
  'Medium': 'info',
  'High': 'warning',
  'Critical': 'error',
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    sentiment: '',
    priority: '',
    search: '',
  });

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInsight, setEditingInsight] = useState<InsightFormData | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const loadInsights = useCallback(async () => {
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
  }, [filters.type, filters.sentiment, filters.priority]);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/events?limit=200');
      const data = await res.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, []);

  useEffect(() => {
    loadInsights();
    loadEvents();
  }, [loadInsights, loadEvents]);

  const filteredInsights = insights.filter((insight) => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        insight.text.toLowerCase().includes(search) ||
        insight.tags.some((t) => t.includes(search)) ||
        insight.eventName?.toLowerCase().includes(search) ||
        insight.advocateName?.toLowerCase().includes(search)
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

  const handleAddNew = () => {
    setEditingInsight(null);
    setDialogOpen(true);
  };

  const handleEdit = (insight: Insight) => {
    setEditingInsight({
      _id: insight._id,
      text: insight.text,
      type: insight.type,
      sentiment: insight.sentiment,
      priority: insight.priority,
      productAreas: insight.productAreas || [],
      tags: insight.tags || [],
      eventId: insight.eventId,
      eventName: insight.eventName,
      advocateName: insight.advocateName,
      followUpRequired: insight.followUpRequired || false,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (insight: Insight) => {
    if (!confirm(`Delete this insight?\n\n"${insight.text.slice(0, 100)}..."`)) {
      return;
    }

    try {
      const res = await fetch(`/api/insights/${insight._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');

      setSnackbar({ open: true, message: 'Insight deleted', severity: 'success' });
      loadInsights();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete insight', severity: 'error' });
    }
  };

  const handleSave = async (data: InsightFormData) => {
    const isEdit = !!data._id;
    const url = isEdit ? `/api/insights/${data._id}` : '/api/insights';
    const method = isEdit ? 'PUT' : 'POST';

    const payload = {
      ...data,
      capturedAt: isEdit ? undefined : new Date().toISOString(),
    };

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to save insight');
    }

    setSnackbar({
      open: true,
      message: isEdit ? 'Insight updated' : 'Insight created',
      severity: 'success',
    });
    loadInsights();
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Insights</Typography>
          <Typography color="text.secondary">
            Developer feedback captured at events ({insights.length} total)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddNew}
          sx={{ mt: 1 }}
        >
          Add Insight
        </Button>
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
                <MenuItem value="Positive Feedback">Positive Feedback</MenuItem>
                <MenuItem value="Bug Report">Bug Report</MenuItem>
                <MenuItem value="Competitive Intel">Competitive Intel</MenuItem>
                <MenuItem value="Use Case">Use Case</MenuItem>
                <MenuItem value="Documentation">Documentation</MenuItem>
                <MenuItem value="General Feedback">General Feedback</MenuItem>
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
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Add insights manually or capture them from the mobile app.
            </Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={handleAddNew}>
              Add First Insight
            </Button>
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
                  <TableCell width={100}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInsights.map((insight) => (
                  <TableRow
                    key={insight._id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleEdit(insight)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {getSentimentIcon(insight.sentiment)}
                    </TableCell>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Stack direction="row" spacing={0}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleEdit(insight)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(insight)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <InsightFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        insight={editingInsight}
        events={events}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
