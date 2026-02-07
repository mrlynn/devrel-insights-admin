'use client';

/**
 * DevRel Insights - Quick Start Guide
 * 
 * Public page (no auth required) with step-by-step instructions
 * for new advocates getting started with the app.
 */

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Link from 'next/link';

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AppleIcon from '@mui/icons-material/Apple';
import DownloadIcon from '@mui/icons-material/Download';
import MicIcon from '@mui/icons-material/Mic';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import OfflineBoltIcon from '@mui/icons-material/OfflineBolt';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// MongoDB-themed dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00ED64',
      dark: '#00C853',
    },
    background: {
      default: '#001E2B',
      paper: '#112733',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B8C4C8',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: '#112733',
          '&:before': { display: 'none' },
        },
      },
    },
  },
});

interface StepCardProps {
  number: number;
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function StepCard({ number, title, children, icon }: StepCardProps) {
  return (
    <Card sx={{ mb: 3, bgcolor: 'background.paper', border: '1px solid rgba(255,255,255,0.1)' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              color: '#001E2B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              flexShrink: 0,
            }}
          >
            {number}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              {icon}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            </Stack>
            {children}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function QuickStartGuide() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Header */}
        <Box
          component="header"
          sx={{
            py: 2,
            px: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBackIcon />}
            color="inherit"
          >
            Back to Home
          </Button>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
            📊 DevRel Insights
          </Typography>
          <Button
            component={Link}
            href="/login"
            variant="outlined"
            color="primary"
            size="small"
          >
            Admin Login
          </Button>
        </Box>

        <Container maxWidth="md" sx={{ py: 6 }}>
          {/* Title */}
          <Box textAlign="center" mb={6}>
            <Chip label="For New Advocates" color="primary" sx={{ mb: 2 }} />
            <Typography variant="h3" sx={{ mb: 2 }}>
              Quick Start Guide
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
              Everything you need to know to start capturing developer insights
              at conferences, meetups, and customer conversations.
            </Typography>
          </Box>

          {/* Step 1: Get the App */}
          <StepCard number={1} title="Get the App" icon={<DownloadIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              DevRel Insights is available on iOS via TestFlight. Android coming soon.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AppleIcon />}
              href="https://testflight.apple.com/join/YOUR_CODE"
              target="_blank"
              sx={{ color: '#001E2B', mb: 2 }}
            >
              Download from TestFlight
            </Button>
            <Alert severity="info" sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
              First time on TestFlight? You'll need the free TestFlight app from the App Store first.
            </Alert>
          </StepCard>

          {/* Step 2: Sign In */}
          <StepCard number={2} title="Sign In with Magic Link" icon={<TouchAppIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              We use passwordless authentication. Enter your MongoDB email and check your inbox for a sign-in link.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Open the app and tap 'Sign In'" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Enter your @mongodb.com email" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Check email and tap the magic link" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="You're in! The link opens the app automatically" />
              </ListItem>
            </List>
          </StepCard>

          {/* Step 3: Capture Your First Insight */}
          <StepCard number={3} title="Capture Your First Insight" icon={<MicIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              The fastest way to capture an insight is with voice. Tap the microphone and speak naturally.
            </Typography>
            
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(0, 237, 100, 0.1)', border: '1px solid rgba(0, 237, 100, 0.3)' }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', mb: 1 }}>
                💡 Pro Tip: What to Say
              </Typography>
              <Typography variant="body2" color="text.secondary">
                "Just talked to a developer at Acme Corp who's frustrated with the aggregation pipeline syntax. 
                They said it's hard to debug nested stages. This is a pain point, high priority, 
                related to Query and Aggregation."
              </Typography>
            </Paper>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>The AI will automatically extract:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
              <Chip size="small" label="Insight type" />
              <Chip size="small" label="Sentiment" />
              <Chip size="small" label="Priority" />
              <Chip size="small" label="Product areas" />
            </Stack>

            <Typography color="text.secondary" variant="body2">
              You can always edit before saving. Review the transcription, adjust tags, and add context.
            </Typography>
          </StepCard>

          {/* Step 4: Add Photos */}
          <StepCard number={4} title="Attach Photos" icon={<CameraAltIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              Visual context makes insights richer. Snap photos of whiteboards, error messages, or presentation slides.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CameraAltIcon sx={{ color: 'text.secondary' }} /></ListItemIcon>
                <ListItemText 
                  primary="Whiteboard sketches" 
                  secondary="Capture architecture discussions before they're erased"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CameraAltIcon sx={{ color: 'text.secondary' }} /></ListItemIcon>
                <ListItemText 
                  primary="Error messages" 
                  secondary="Screenshot the exact error a developer shows you"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CameraAltIcon sx={{ color: 'text.secondary' }} /></ListItemIcon>
                <ListItemText 
                  primary="Speaker slides" 
                  secondary="Key quotes or diagrams from conference talks"
                />
              </ListItem>
            </List>
          </StepCard>

          {/* Step 5: Link to Events */}
          <StepCard number={5} title="Link to Events" icon={<EventIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              Context matters. Link your insights to the event or conference where you captured them.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Select an event from the dropdown when capturing" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Nearby events appear first (uses your location)" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Event context helps leadership understand where feedback comes from" />
              </ListItem>
            </List>
          </StepCard>

          {/* Step 6: Categorize */}
          <StepCard number={6} title="Tag and Categorize" icon={<LocalOfferIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              Good categorization makes insights actionable. Here's what to set:
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <SentimentSatisfiedIcon sx={{ color: '#00ED64' }} />
                  <Typography variant="subtitle2">Sentiment</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Positive (praise, success), Neutral (question, info), or Negative (complaint, blocker)
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <PriorityHighIcon sx={{ color: '#FF6B6B' }} />
                  <Typography variant="subtitle2">Priority</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Critical (blocking adoption), High (significant pain), Medium (nice to fix), Low (minor)
                </Typography>
              </Box>
              
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                  <LocalOfferIcon sx={{ color: '#4ECDC4' }} />
                  <Typography variant="subtitle2">Product Areas</Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Select all that apply: Atlas, Drivers, Aggregation, Search, Vector, Charts, etc.
                </Typography>
              </Box>
            </Stack>
          </StepCard>

          {/* Step 7: Offline Mode */}
          <StepCard number={7} title="Works Offline" icon={<OfflineBoltIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              No Wi-Fi at the conference venue? No problem. The app works completely offline.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Insights save locally to your device" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Sync happens automatically when you're back online" />
              </ListItem>
              <ListItem>
                <ListItemIcon><CheckCircleIcon sx={{ color: 'primary.main' }} /></ListItemIcon>
                <ListItemText primary="Check sync status on your Profile tab (green = synced)" />
              </ListItem>
            </List>
            <Alert severity="success" sx={{ mt: 2, bgcolor: 'rgba(0, 237, 100, 0.1)' }}>
              Voice transcription requires internet, but you can still type insights offline.
            </Alert>
          </StepCard>

          {/* Step 8: Light & Dark Mode */}
          <StepCard number={8} title="Choose Your Theme" icon={<DarkModeIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              The app follows your system preference by default, or set it manually.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <Paper sx={{ p: 2, flex: 1, bgcolor: '#f5f5f5', textAlign: 'center' }}>
                <LightModeIcon sx={{ color: '#FFC107', fontSize: 32 }} />
                <Typography variant="body2" sx={{ color: '#333', mt: 1 }}>Light Mode</Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>Outdoor events</Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, bgcolor: '#1a1a2e', textAlign: 'center' }}>
                <DarkModeIcon sx={{ color: '#9C27B0', fontSize: 32 }} />
                <Typography variant="body2" sx={{ color: '#fff', mt: 1 }}>Dark Mode</Typography>
                <Typography variant="caption" sx={{ color: '#aaa' }}>Dim venues</Typography>
              </Paper>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Change anytime: Profile → Settings → Appearance
            </Typography>
          </StepCard>

          {/* Step 9: Engage with Team */}
          <StepCard number={9} title="Engage with Your Team" icon={<ThumbUpIcon sx={{ color: 'primary.main' }} />}>
            <Typography color="text.secondary" paragraph>
              See what other advocates are capturing and react to insights.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon><ThumbUpIcon sx={{ color: 'text.secondary' }} /></ListItemIcon>
                <ListItemText 
                  primary="React to insights" 
                  secondary="👍 Like, ❤️ Love, 💡 Insightful, 🎉 Celebrate, 🔥 Fire"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><LeaderboardIcon sx={{ color: 'text.secondary' }} /></ListItemIcon>
                <ListItemText 
                  primary="Check the leaderboard" 
                  secondary="See top contributors and your impact score"
                />
              </ListItem>
            </List>
          </StepCard>

          {/* FAQ Section */}
          <Typography variant="h4" sx={{ mt: 6, mb: 3 }}>
            <HelpOutlineIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
            Common Questions
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>What types of insights should I capture?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                <strong>Pain Points:</strong> Frustrations, blockers, complaints<br />
                <strong>Feature Requests:</strong> "I wish MongoDB could..."<br />
                <strong>Use Cases:</strong> How developers are using the product<br />
                <strong>Success Stories:</strong> Wins, praise, testimonials<br />
                <strong>Competitive Intel:</strong> Comparisons to other databases<br />
                <strong>Questions:</strong> Common things developers ask
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>How detailed should my insights be?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                Aim for 2-3 sentences minimum. Include context: who said it, what they were trying to do, 
                and why it matters. The more context, the more actionable the insight.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>Who sees my insights?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                Your insights are visible to the DevRel team and leadership. They're used to identify 
                trends, prioritize product improvements, and track developer sentiment over time.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>Can I edit or delete an insight after submitting?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                Yes! Open the insight from your capture history and tap Edit or Delete. 
                You can also do this from the admin dashboard.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={500}>What if I'm not at an event?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography color="text.secondary">
                You can capture insights anytime! Customer calls, Slack conversations, 
                support tickets, community forums — if a developer said something worth noting, 
                capture it. Just skip the event selection.
              </Typography>
            </AccordionDetails>
          </Accordion>

          {/* Final CTA */}
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              mt: 6,
              borderRadius: 4,
              bgcolor: 'rgba(0, 237, 100, 0.05)',
              border: '1px solid rgba(0, 237, 100, 0.2)',
            }}
          >
            <TipsAndUpdatesIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" sx={{ mb: 2 }}>
              Ready to start capturing?
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
              Download the app and capture your first insight. Your field intelligence 
              directly shapes our product roadmap.
            </Typography>
            <Button
              variant="contained"
              size="large"
              color="primary"
              startIcon={<AppleIcon />}
              href="https://testflight.apple.com/join/YOUR_CODE"
              target="_blank"
              sx={{ color: '#001E2B' }}
            >
              Get Started on TestFlight
            </Button>
          </Box>
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 4,
            px: 3,
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Questions? Reach out in #devrel-insights on Slack
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            © 2026 MongoDB, Inc.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
