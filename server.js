/**
 * Main Entry Point — Express Server
 * Intelligent Email Assistant Backend
 */

'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/email', emailRoutes);

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Intelligent Email Assistant',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    ai: process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
      ? 'configured'
      : 'not_configured (fallback templates will be used)',
    email: process.env.EMAIL_USER && process.env.EMAIL_USER !== 'yourname@gmail.com'
      ? 'configured'
      : 'not_configured',
  });
});

// ── SPA Fallback: serve index.html for any unknown route ──────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.stack);
  res.status(500).json({ success: false, error: 'Internal server error.' });
});

// ── Start Server ───────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   🤖 Intelligent Email Assistant         ║');
  console.log(`  ║   Running at: http://localhost:${PORT}      ║`);
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');
  const aiStatus = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
    ? '✓ Gemini AI configured'
    : '⚠ Gemini API key missing — will use fallback templates';
  const emailStatus = process.env.EMAIL_USER && process.env.EMAIL_USER !== 'yourname@gmail.com'
    ? '✓ Email credentials configured'
    : '⚠ Email credentials missing — sending will fail';
  console.log(`  ${aiStatus}`);
  console.log(`  ${emailStatus}`);
  console.log('');
});

module.exports = app;
