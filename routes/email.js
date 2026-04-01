/**
 * API Routes: /api/email
 * Orchestrates all agents for the email generation and sending pipeline.
 */

'use strict';

const express = require('express');
const router = express.Router();

const { parseIntent } = require('../agents/intentAgent');
const { getToneForReceiver, getAvailableTones } = require('../agents/toneAgent');
const { generateEmail } = require('../agents/emailGeneratorAgent');
const { reviewEmail }   = require('../agents/reviewAgent');
const { adjustTone }    = require('../agents/toneAdjustmentAgent');
const { sendEmail, isValidEmail } = require('../agents/senderAgent');
const { saveEmail, getRecentEmails, getEmailById, deleteEmail, clearHistory, markAsSent } = require('../agents/memoryAgent');
const { validateEmail, validateInput } = require('../utils/validate');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/generate
// Pipeline: intentAgent → toneAgent → emailGeneratorAgent → reviewAgent → toneAdjustmentAgent
// ─────────────────────────────────────────────────────────────────────────────
router.post('/generate', async (req, res) => {
  try {
    const { userInput, receiverEmail, toneOverride } = req.body;

    // Validate input
    const inputCheck = validateInput(userInput);
    if (!inputCheck.valid) {
      return res.status(400).json({ success: false, error: inputCheck.message });
    }

    // Agent 1: Parse intent
    const intent = parseIntent(userInput, receiverEmail);

    // Agent 2: Determine tone
    const toneKey = getToneForReceiver(intent.receiver, toneOverride || null);

    // Agent 3: Generate email (Professional Email Writing AI)
    const { subject, body, usedFallback: genFallback } = await generateEmail(
      userInput, intent, toneKey, receiverEmail || ''
    );

    // Agent 4: Review & optimize the generated draft
    const reviewed = await reviewEmail(subject, body, intent, toneKey);

    // Agent 5: Tone Adjustment — final wording polish for receiver type
    const toneResult = await adjustTone(
      reviewed.final_subject,
      reviewed.final_email,
      intent.receiver,
      intent
    );

    const finalSubject = reviewed.final_subject;
    const finalBody    = toneResult.adjusted_email;
    const usedFallback = genFallback || reviewed.usedFallback || toneResult.usedFallback;

    return res.json({
      success: true,
      intent,
      tone: toneResult.tone,
      // Final values — shown in the UI
      subject: finalSubject,
      body:    finalBody,
      usedFallback,
      // Per-agent structured outputs
      rawOutput: { subject, email_body: body },
      reviewOutput: {
        final_subject:     reviewed.final_subject,
        final_email:       reviewed.final_email,
        improvements_made: reviewed.improvements_made,
      },
      toneOutput: {
        tone:           toneResult.tone,
        adjusted_email: finalBody,
      },
      message: usedFallback
        ? 'Generated using fallback — templates applied.'
        : `Email generated, reviewed & tone-adjusted (${toneResult.tone}). ${reviewed.improvements_made.length} improvement(s) applied.`,
    });
  } catch (err) {
    console.error('[Route /generate] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Email generation failed. Please try again.',
      details: err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/send
// Email Sending Agent — 4-stage pipeline
// Stage 1: Confirmation gate  (confirmed: true required)
// Stage 2: Payload validation (format, credentials)
// Stage 3: Payload preparation (text + HTML)
// Stage 4: SMTP send with 3-retry logic
// Output: { status: "sent"|"failed"|"pending", message: "" }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, userInput, tone, receiver, purpose, confirmed } = req.body;

    // Pass confirmed flag to agent — it WILL return pending status if false
    const result = await sendEmail({ to, subject, body, confirmed: confirmed === true });

    // Save to memory for all outcomes (sent, failed, pending)
    let savedRecord = null;
    if (to && subject && body) {
      savedRecord = saveEmail({
        userInput:     userInput || '',
        subject:       subject || '',
        body:          body || '',
        tone:          tone || 'neutral',
        receiver:      receiver || 'Unknown',
        receiverEmail: to || '',
        purpose:       purpose || 'general_request',
        sent:          result.status === 'sent',
      });
      if (result.status === 'sent' && savedRecord) {
        markAsSent(savedRecord.id, true);
      }
    }

    // Map status to HTTP codes:
    //   sent    → 200
    //   pending → 202 Accepted (not yet acted upon)
    //   failed  → 502 Bad Gateway
    const httpStatus = result.status === 'sent'
      ? 200
      : result.status === 'pending'
      ? 202
      : 502;

    return res.status(httpStatus).json({
      success:   result.status === 'sent',
      // Agent output — strict format
      status:    result.status,
      message:   result.message,
      // Additional metadata
      attempts:  result.attempts || 0,
      messageId: result.messageId || null,
      emailId:   savedRecord ? savedRecord.id : null,
    });

  } catch (err) {
    console.error('[Route /send] Error:', err);
    return res.status(500).json({
      success: false,
      status:  'failed',
      message: 'Internal server error while sending email.',
      error:   err.message,
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/preflight
// Returns PENDING status and validates payload BEFORE user confirmation
// Useful to show the user what will be sent
// ─────────────────────────────────────────────────────────────────────────────
router.post('/preflight', (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const { validatePayload, getPendingStatus } = require('../agents/senderAgent');

    const validation = validatePayload({ to, subject, body });
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        status:  'failed',
        message: validation.message,
      });
    }

    const pending = getPendingStatus(to, subject);
    return res.status(202).json({ success: true, ...pending });
  } catch (err) {
    return res.status(500).json({ success: false, status: 'failed', message: err.message });
  }
});



// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/history
// Returns stored email history from memory agent
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const emails = getRecentEmails(limit);
    return res.json({ success: true, emails, count: emails.length });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not fetch email history.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/history/:id
// Returns a single email by ID
// ─────────────────────────────────────────────────────────────────────────────
router.get('/history/:id', (req, res) => {
  try {
    const email = getEmailById(req.params.id);
    if (!email) {
      return res.status(404).json({ success: false, error: 'Email not found.' });
    }
    return res.json({ success: true, email });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not fetch email.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/email/history/:id
// Deletes an email from history
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/history/:id', (req, res) => {
  try {
    const deleted = deleteEmail(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Email not found.' });
    }
    return res.json({ success: true, message: 'Email deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not delete email.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/email/history
// Clear all history
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/history', (req, res) => {
  try {
    clearHistory();
    return res.json({ success: true, message: 'History cleared.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not clear history.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/email/tones
// Returns available tones (for frontend selector)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/tones', (req, res) => {
  try {
    const tones = getAvailableTones();
    return res.json({ success: true, tones });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Could not fetch tones.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/email/parse-intent
// Returns just the parsed intent (for debugging/testing)
// ─────────────────────────────────────────────────────────────────────────────
router.post('/parse-intent', (req, res) => {
  try {
    const { userInput, receiverEmail } = req.body;
    const inputCheck = validateInput(userInput);
    if (!inputCheck.valid) {
      return res.status(400).json({ success: false, error: inputCheck.message });
    }
    const intent = parseIntent(userInput, receiverEmail || '');
    return res.json({ success: true, intent });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
