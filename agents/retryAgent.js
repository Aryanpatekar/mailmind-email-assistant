/**
 * AGENT 7: Email Retry Handler Agent
 *
 * Role: Handles failed email send attempts. Wraps the actual SMTP transport
 *       call with resilient retry logic.
 *
 * Tasks:
 * - Detect failure reason
 * - Retry sending up to 3 times
 * - Add delay between retries
 * - Stop when successful
 * - Do NOT retry endlessly
 * - Log each attempt
 *
 * Output Format:
 * {
 *   "attempts": number,
 *   "final_status": "sent" | "failed",
 *   "error": "human-readable error message if failed",
 *   "messageId": "SMTP message ID if sent"
 * }
 */

'use strict';

const MAX_RETRIES    = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Halts execution for the specified milliseconds.
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyzes the error object to detect the specific failure reason.
 *
 * @param {Error} err - The error thrown by the transport
 * @returns {string} User-friendly failure reason
 */
function detectFailureReason(err) {
  const msg = err.message || '';
  if (msg.includes('535') || msg.includes('Username and Password not accepted')) {
    return 'Authentication failed: Invalid Gmail App Password.';
  }
  if (msg.includes('534') || msg.includes('Application-specific password required')) {
    return 'Authentication failed: Google requires an App Password.';
  }
  if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
    return 'Network error: Cannot reach the SMTP server.';
  }
  if (msg.includes('ETIMEDOUT')) {
    return 'Network error: Connection to SMTP server timed out.';
  }
  if (msg.includes('550') || msg.includes('Invalid recipient')) {
    return 'Recipient rejected: The email address may not exist.';
  }
  return `SMTP Error: ${msg}`;
}

/**
 * Handle retry logic for a given async action (specifically tailored for sending email).
 *
 * @param {Function} sendAction - An async function that returns { messageId } on success.
 *
 * @returns {Promise<{
 *   attempts: number,
 *   final_status: "sent" | "failed",
 *   error: string,
 *   messageId?: string
 * }>}
 */
async function handleRetry(sendAction) {
  let lastErrorMsg = '';

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[RetryHandlerAgent] 📤 Attempt ${attempt}/${MAX_RETRIES}...`);

      // Execute the send action
      const info = await sendAction();

      console.log(`[RetryHandlerAgent] ✅ Success on attempt ${attempt}.`);
      return {
        attempts:     attempt,
        final_status: 'sent',
        error:        '',
        messageId:    info.messageId,
      };

    } catch (err) {
      // 1. Detect failure reason
      const reason = detectFailureReason(err);
      lastErrorMsg = reason;

      // 2. Log attempt and error
      console.warn(`[RetryHandlerAgent] ✗ Attempt ${attempt} failed: ${reason}`);

      // 3. Stop if successful (handled by the return above) or if we hit the limit
      if (attempt < MAX_RETRIES) {
        // 4. Add delay between retries
        console.log(`[RetryHandlerAgent] ⏳ Applying delay of ${RETRY_DELAY_MS}ms before next attempt...`);
        await sleep(RETRY_DELAY_MS);
      } else {
        console.warn(`[RetryHandlerAgent] 🛑 Max retries (${MAX_RETRIES}) reached. Halting.`);
      }
    }
  }

  // 5. Final failed state (do NOT retry endlessly)
  return {
    attempts:     MAX_RETRIES,
    final_status: 'failed',
    error:        lastErrorMsg,
  };
}

module.exports = { handleRetry, detectFailureReason };
