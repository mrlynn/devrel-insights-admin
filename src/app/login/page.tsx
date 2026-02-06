'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
} from '@mui/material';
import { Lightbulb, Email } from '@mui/icons-material';
import { mongoColors } from '@/theme';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) setError(err);
  }, [searchParams]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSuccess('Check your email — we sent you a sign-in link.');
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: mongoColors.gray[100],
        p: 3,
      }}
    >
      <Card sx={{ maxWidth: 420, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: `${mongoColors.green}20`,
                color: mongoColors.green,
                mx: 'auto',
                mb: 2,
              }}
            >
              <Lightbulb sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: mongoColors.black,
                letterSpacing: '-0.02em',
              }}
            >
              DevRel Insights
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              Admin Portal
            </Typography>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Magic Link Form */}
          <Box component="form" onSubmit={handleMagicLink}>
            <TextField
              label="Email address"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              autoComplete="email"
              autoFocus
              placeholder="you@mongodb.com"
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !email.trim()}
              startIcon={<Email />}
              sx={{ 
                py: 1.25, 
                fontWeight: 600,
                bgcolor: mongoColors.green,
                color: mongoColors.black,
                '&:hover': {
                  bgcolor: mongoColors.darkGreen,
                  color: mongoColors.white,
                },
              }}
            >
              {loading ? 'Sending...' : 'Send Sign-In Link'}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              display: 'block',
              textAlign: 'center',
              mt: 3,
              color: 'text.secondary',
            }}
          >
            We&apos;ll email you a magic link for password-free sign in.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
