'use client';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import { Add, Person } from '@mui/icons-material';

// Placeholder - would come from MongoDB
const TEAM_MEMBERS = [
  { id: '1', name: 'Mike Lynn', role: 'Principal Staff DA', region: 'AMER', insightCount: 0 },
];

export default function AdvocatesPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Advocates</Typography>
          <Typography color="text.secondary">
            Developer Advocacy team members
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>
          Add Advocate
        </Button>
      </Box>

      <Grid container spacing={3}>
        {TEAM_MEMBERS.map((member) => (
          <Grid key={member.id} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{member.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.role}
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip label={member.region} size="small" />
                  <Chip
                    label={`${member.insightCount} insights`}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Empty state card */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              minHeight: 150,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary" gutterBottom>
                Team members sync from mobile app
              </Typography>
              <Button size="small" startIcon={<Add />}>
                Add Manually
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
