'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Skeleton,
  Stack,
} from '@mui/material';
import { Add, Edit, Visibility, Delete } from '@mui/icons-material';

interface Event {
  _id: string;
  name: string;
  status: string;
  region: string;
  engagementType: string;
  location: string;
  startDate?: string;
  insightCount?: number;
  account?: { name: string };
}

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  'In Queue': 'default',
  'In Hack Queue': 'default',
  'Scheduled': 'info',
  'In Progress': 'warning',
  'Delivered': 'success',
  'Postponed': 'error',
  'Cancelled': 'error',
};

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        setError('Failed to load events. Check your MongoDB connection.');
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" width={120} height={40} />
        </Box>
        <Card>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
            ))}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>Events</Typography>
            <Typography color="text.secondary">Manage conferences, hackathons, and developer days</Typography>
          </Box>
        </Box>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Events Yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first event or import from the PMO spreadsheet.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" startIcon={<Add />}>
                Create Event
              </Button>
              <Button variant="outlined" onClick={() => router.push('/import')}>
                Import from PMO
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Events</Typography>
          <Typography color="text.secondary">Manage conferences, hackathons, and developer days</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={() => router.push('/import')}>
            Import PMO
          </Button>
          <Button variant="contained" startIcon={<Add />}>
            New Event
          </Button>
        </Stack>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Insights</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id} hover>
                  <TableCell>
                    <Typography fontWeight={600}>{event.name}</Typography>
                    {event.account?.name && (
                      <Typography variant="caption" color="text.secondary">
                        {event.account.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.status}
                      size="small"
                      color={statusColors[event.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>{event.region}</TableCell>
                  <TableCell>{event.engagementType}</TableCell>
                  <TableCell>
                    {event.startDate ? new Date(event.startDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{event.location}</TableCell>
                  <TableCell>
                    <Chip label={event.insightCount || 0} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => router.push(`/events/${event._id}`)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => router.push(`/events/${event._id}/edit`)}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
