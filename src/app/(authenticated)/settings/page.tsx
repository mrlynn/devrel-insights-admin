'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import { Delete, Save, Refresh } from '@mui/icons-material';
import { SCHEMA } from '@/lib/schema-mapper';

interface SchemaMapping {
  field: string;
  aliases: string[];
}

export default function SettingsPage() {
  const [aliases, setAliases] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/schema')
      .then((res) => res.json())
      .then((data) => {
        setAliases(data.aliases || {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDeleteAlias = async (field: string, alias: string) => {
    try {
      await fetch('/api/schema', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, alias }),
      });
      
      setAliases((prev) => ({
        ...prev,
        [field]: (prev[field] || []).filter((a) => a !== alias),
      }));
    } catch (err) {
      console.error('Failed to delete alias:', err);
    }
  };

  const allMappings = SCHEMA.map((field) => ({
    field: field.name,
    builtIn: field.aliases,
    custom: aliases[field.name] || [],
    required: field.required,
  }));

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Settings</Typography>
        <Typography color="text.secondary">
          Configure schema mappings and system settings
        </Typography>
      </Box>

      {/* Database Connection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Database Connection
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Configure MONGODB_URI in your .env.local file
          </Alert>
          <TextField
            fullWidth
            label="MongoDB URI"
            value="mongodb+srv://***@***.mongodb.net"
            disabled
            size="small"
            helperText="Connection string is configured via environment variables"
          />
        </CardContent>
      </Card>

      {/* Schema Mappings */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">
                Column Mappings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Learned aliases for CSV import. These are auto-saved when you correct mappings.
              </Typography>
            </Box>
            <Button
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Field</TableCell>
                  <TableCell>Built-in Aliases</TableCell>
                  <TableCell>Learned Aliases</TableCell>
                  <TableCell width={80}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allMappings.map((mapping) => (
                  <TableRow key={mapping.field}>
                    <TableCell>
                      <Typography component="span" fontWeight={500}>
                        {mapping.field}
                      </Typography>
                      {mapping.required && (
                        <Chip label="required" size="small" sx={{ ml: 1 }} color="error" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {mapping.builtIn.slice(0, 4).map((alias) => (
                          <Chip key={alias} label={alias} size="small" variant="outlined" sx={{ mb: 0.5 }} />
                        ))}
                        {mapping.builtIn.length > 4 && (
                          <Chip label={`+${mapping.builtIn.length - 4}`} size="small" sx={{ mb: 0.5 }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {mapping.custom.map((alias) => (
                          <Chip
                            key={alias}
                            label={alias}
                            size="small"
                            color="primary"
                            onDelete={() => handleDeleteAlias(mapping.field, alias)}
                            sx={{ mb: 0.5 }}
                          />
                        ))}
                        {mapping.custom.length === 0 && (
                          <Typography variant="body2" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {mapping.custom.length > 0 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            mapping.custom.forEach((a) => handleDeleteAlias(mapping.field, a));
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Export
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined">Export Events (CSV)</Button>
            <Button variant="outlined">Export Insights (CSV)</Button>
            <Button variant="outlined">Export All (JSON)</Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
