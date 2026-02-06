'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Event as EventIcon,
  LocationOn,
  Person,
  Business,
  Link as LinkIcon,
} from '@mui/icons-material';

interface EventData {
  _id: string;
  name: string;
  status: string;
  eventType: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  isVirtual?: boolean;
  timezone?: string;
  quarter?: string;
  isRegional?: boolean;
  language?: string;
  slackChannel?: string;
  account?: {
    name: string;
    segment?: string;
    region?: string;
  };
  champion?: {
    name: string;
    email?: string;
  };
  assignments?: Array<{
    advocateName: string;
    assignmentType: string;
  }>;
  travelStatus?: string;
  notes?: string;
  eventPageUrl?: string;
  sfdcLink?: string;
  wrikeTicket?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/events/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Event not found');
        return res.json();
      })
      .then((data) => {
        setEvent(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${params.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      router.push('/events');
    } catch (err) {
      setError('Failed to delete event');
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
      COMPLETED: 'success',
      ASSIGNED: 'info',
      CONFIRMING: 'warning',
      CANCELLED: 'error',
      NEEDS_STAFFING: 'error',
      NEW: 'default',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !event) {
    return (
      <Box>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/events')} sx={{ mb: 2 }}>
          Back to Events
        </Button>
        <Alert severity="error">{error || 'Event not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 4 }}>
        <IconButton onClick={() => router.push('/events')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {event.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip label={event.status} color={getStatusColor(event.status)} size="small" />
            <Chip label={event.eventType} variant="outlined" size="small" />
            {event.isVirtual && <Chip label="Virtual" size="small" />}
            {event.isRegional && <Chip label="Regional" size="small" color="info" />}
          </Stack>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => router.push(`/events/${params.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Delete />}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Event Details
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500, width: 180 }}>Date</TableCell>
                    <TableCell>
                      {event.startDate
                        ? new Date(event.startDate).toLocaleDateString()
                        : 'TBD'}
                      {event.endDate && event.endDate !== event.startDate && (
                        <> – {new Date(event.endDate).toLocaleDateString()}</>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Location</TableCell>
                    <TableCell>
                      {event.location || 'TBD'}
                      {event.timezone && ` (${event.timezone})`}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Quarter</TableCell>
                    <TableCell>{event.quarter || '-'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Language</TableCell>
                    <TableCell>{event.language || 'English'}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 500 }}>Travel Status</TableCell>
                    <TableCell>{event.travelStatus || '-'}</TableCell>
                  </TableRow>
                  {event.slackChannel && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 500 }}>Slack Channel</TableCell>
                      <TableCell>{event.slackChannel}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          {event.notes && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {event.notes}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Links */}
          {(event.eventPageUrl || event.sfdcLink || event.wrikeTicket) && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Links
                </Typography>
                <Stack spacing={1}>
                  {event.eventPageUrl && (
                    <Button
                      variant="text"
                      startIcon={<LinkIcon />}
                      href={event.eventPageUrl}
                      target="_blank"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Event Page
                    </Button>
                  )}
                  {event.sfdcLink && (
                    <Button
                      variant="text"
                      startIcon={<LinkIcon />}
                      href={event.sfdcLink}
                      target="_blank"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Salesforce
                    </Button>
                  )}
                  {event.wrikeTicket && (
                    <Button
                      variant="text"
                      startIcon={<LinkIcon />}
                      href={event.wrikeTicket}
                      target="_blank"
                      sx={{ justifyContent: 'flex-start' }}
                    >
                      Wrike Ticket
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          {/* Account */}
          {event.account && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" /> Account
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {event.account.name}
                </Typography>
                {(event.account.segment || event.account.region) && (
                  <Typography variant="body2" color="text.secondary">
                    {[event.account.segment, event.account.region].filter(Boolean).join(' • ')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Champion */}
          {event.champion && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" /> Champion
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {event.champion.name}
                </Typography>
                {event.champion.email && (
                  <Typography variant="body2" color="text.secondary">
                    {event.champion.email}
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignments */}
          {event.assignments && event.assignments.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person fontSize="small" /> Assigned DAs ({event.assignments.length})
                </Typography>
                <Stack spacing={1}>
                  {event.assignments.map((a, i) => (
                    <Paper key={i} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {a.advocateName}
                      </Typography>
                      <Chip
                        label={a.assignmentType}
                        size="small"
                        color={a.assignmentType === 'ON_SITE' ? 'success' : 'default'}
                        sx={{ mt: 0.5 }}
                      />
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
