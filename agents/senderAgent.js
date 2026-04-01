/**
 * AGENT 6: Email Sending Agent (v2)
 *
 * Role: Final agent in the pipeline. Receives confirmed email payload,
 *       validates it, prepares it, and sends it securely via Gmail SMTP.
 *       NEVER sends without explicit user confirmation.
 *
 * Stages:
 *   1. PENDING  — awaiting user confirmation (UI/API must confirm before calling sendEmail)
 *   2. VALIDATE — validates email format, subject, body
 *   3. PREPARE  — builds final email payload (text + HTML)
 *   4. SEND     — transmits via Nodemailer with 3-retry logic
 *
 * Output: {
 *   "status":  "sent" | "failed" | "pending",
 *   "message": "Human-readable result message"
 * }
 *
 * Rules:
 * - NEVER call sendEmail without { confirmed: true } in payload
 * - Handle all errors and return structured output
 * - Validate email format before any SMTP call
 * - Secure sending via TLS
 */

'use strict';

require('dotenv').config();
const nodemailer = require('nodemailer');
const { handleRetry } = require('./retryAgent');

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 1 — CONFIRMATION GATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a PENDING status immediately if confirmation is missing.
 * The frontend/route MUST pass { confirmed: true } to proceed.
 *
 * @param {boolean} confirmed
 * @returns {{ status, message } | null} null if confirmed, PENDING object if not
 */
function checkConfirmation(confirmed) {
  if (confirmed !== true) {
    return {
      status:  'pending',
      message: 'Awaiting user confirmation. The email has NOT been sent. Please approve to proceed.',
    };
  }
  return null; // confirmed — proceed
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 2 — VALIDATION
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

const DOMAIN_TYPOS = {
  'gmial.com':  'gmail.com',
  'gmai.com':   'gmail.com',
  'yahooo.com': 'yahoo.com',
  'hotmial.com':'hotmail.com',
  'outlok.com': 'outlook.com',
};

/**
 * Validate the full email payload before sending.
 *
 * @param {{ to, subject, body }} payload
 * @returns {{ valid: boolean, status: string, message: string }}
 */
function validatePayload(payload) {
  const { to, subject, body } = payload;

  // Validate recipient
  if (!to || to.trim() === '') {
    return { valid: false, status: 'failed', message: 'Recipient email address is required.' };
  }
  if (!EMAIL_REGEX.test(to.trim())) {
    return { valid: false, status: 'failed', message: `Invalid recipient email address: "${to}". Please check and try again.` };
  }

  // Check for common typos
  const domain = to.split('@')[1];
  if (DOMAIN_TYPOS[domain]) {
    return {
      valid: false,
      status: 'failed',
      message: `Possible typo in email domain. Did you mean "${to.replace(domain, DOMAIN_TYPOS[domain])}"?`,
    };
  }

  // Validate subject
  if (!subject || subject.trim() === '') {
    return { valid: false, status: 'failed', message: 'Email subject cannot be empty.' };
  }
  if (subject.trim().length > 200) {
    return { valid: false, status: 'failed', message: 'Subject is too long (max 200 characters).' };
  }

  // Validate body
  if (!body || body.trim() === '') {
    return { valid: false, status: 'failed', message: 'Email body cannot be empty.' };
  }
  if (body.trim().length < 10) {
    return { valid: false, status: 'failed', message: 'Email body is too short.' };
  }

  // Validate sender credentials exist
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'yourname@gmail.com') {
    return { valid: false, status: 'failed', message: 'Sender email (EMAIL_USER) is not configured in .env file.' };
  }
  if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_gmail_app_password_here') {
    return { valid: false, status: 'failed', message: 'Email App Password (EMAIL_PASS) is not configured in .env file.' };
  }

  return { valid: true, status: 'ok', message: 'Payload valid.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 3 — PAYLOAD PREPARATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the final Nodemailer mail options object.
 *
 * @param {{ to, subject, body, from }} payload
 * @returns {Object} Nodemailer mailOptions
 */
function preparePayload({ to, subject, body, from = 'MailMind AI Assistant' }) {
  return {
    from:    `"${from}" <${process.env.EMAIL_USER}>`,
    to:      to.trim(),
    subject: subject.trim(),
    text:    body.trim(),
    html:    buildHtmlBody(body.trim()),
  };
}

/**
 * Convert plain-text email body to clean HTML.
 */
function buildHtmlBody(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const html = escaped
    .split('\n\n')
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 15px;
      color: #1a1a2e;
      line-height: 1.7;
      max-width: 680px;
      margin: 0 auto;
      padding: 32px 24px;
      background: #f8f9fc;
    }
    .email-card {
      background: #ffffff;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    p { margin: 0 0 16px; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="email-card">
    ${html}
  </div>
  <div class="footer">Sent via MailMind — Intelligent Email Assistant</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// STAGE 4 — SMTP TRANSPORT
// ─────────────────────────────────────────────────────────────────────────────

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls:      { rejectUnauthorized: false },
    secure:   false,
    pool:     false,
    maxConnections: 1,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SEND FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send email — the complete 4-stage pipeline.
 *
 * @param {Object} payload
 * @param {string}  payload.to          - Recipient email address
 * @param {string}  payload.subject     - Email subject
 * @param {string}  payload.body        - Email body (plain text)
 * @param {string}  [payload.from]      - Sender display name
 * @param {boolean} [payload.confirmed] - MUST be true to proceed (default: false)
 *
 * @returns {Promise<{
 *   status:    "sent" | "failed" | "pending",
 *   message:   string,
 *   attempts?: number,
 *   messageId?: string
 * }>}
 */
async function sendEmail(payload) {
  const { to, subject, body, from, confirmed = false } = payload;

  // ── STAGE 1: Confirmation gate ──────────────────────────────────────────
  const confirmCheck = checkConfirmation(confirmed);
  if (confirmCheck) {
    console.log('[SenderAgent] ⏸ Email pending user confirmation.');
    return confirmCheck;
  }

  // ── STAGE 2: Validate payload ────────────────────────────────────────────
  const validation = validatePayload({ to, subject, body });
  if (!validation.valid) {
    console.warn(`[SenderAgent] ✗ Validation failed: ${validation.message}`);
    return { status: 'failed', message: validation.message };
  }

  console.log(`[SenderAgent] ✓ Payload validated. Preparing to send to: ${to}`);

  // ── STAGE 3: Prepare payload ─────────────────────────────────────────────
  const mailOptions = preparePayload({ to, subject, body, from });

  // ── STAGE 4: Delegate to Email Retry Handler Agent ───────────────────────
  
  // Define the isolated action to retry
  const sendAction = async () => {
    const transporter = createTransporter();
    return await transporter.sendMail(mailOptions);
  };

  // Agent 7 Handles the heavy lifting (retries, delays, failure detection)
  const retryResult = await handleRetry(sendAction);

  if (retryResult.final_status === 'sent') {
    return {
      status:    'sent',
      message:   `Email sent successfully to ${to} on attempt ${retryResult.attempts}.`,
      attempts:  retryResult.attempts,
      messageId: retryResult.messageId,
    };
  } else {
    return {
      status:   'failed',
      message:  retryResult.error || `Failed to send after ${retryResult.attempts} attempts.`,
      attempts: retryResult.attempts,
      error:    retryResult.error,
    };
  }
}

/**
 * Validate email address format (for external use by routes)
 */
function isValidEmail(email) {
  return EMAIL_REGEX.test(String(email || '').trim().toLowerCase());
}

/**
 * Get a PENDING status object (for preflight before user confirmation)
 * Useful to preview what will be sent.
 */
function getPendingStatus(to, subject) {
  return {
    status:  'pending',
    message: `Ready to send to ${to} | Subject: "${subject}". Awaiting user confirmation.`,
  };
}

module.exports = { sendEmail, isValidEmail, getPendingStatus, validatePayload };
