/**
 * AGENT 5: Tone Adjustment Agent
 *
 * Role: Receives a reviewed email and actively adjusts its wording
 *       to perfectly match the appropriate tone for the receiver type.
 *
 * Input:
 *   - subject      {string} — Reviewed email subject
 *   - emailBody    {string} — Reviewed email body
 *   - receiverType {string} — Detected receiver (HR, Professor, Manager, Friend, etc.)
 *   - intent       {Object} — Intent JSON from intentAgent (for context)
 *
 * Output: {
 *   "tone":           "formal | polite | casual | neutral | urgent",
 *   "adjusted_email": "full adjusted email body"
 * }
 *
 * Tone Rules:
 *   HR / Professor / Admin / Director → Formal
 *   Manager / Client / Supervisor     → Polite
 *   Friend / Colleague                → Casual
 *   Unknown                           → Neutral
 *   [urgent keyword in context]       → Urgent
 *
 * Rules:
 *   - Do NOT change meaning
 *   - Only adjust tone and wording
 *   - Keep all key information intact
 */

'use strict';

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getToneForReceiver, getToneProfile } = require('./toneAgent');

let genAI = null;
let model = null;

/** Initialize Gemini (lazy) */
function initGemini() {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TONE MAPS
// ─────────────────────────────────────────────────────────────────────────────

const TONE_RULES = {
  formal: {
    label: 'Formal',
    receivers: ['HR', 'Professor', 'Admin', 'Director', 'Dean', 'Principal'],
    wordSwaps: [
      ['Hey,',           'Dear Sir/Madam,'],
      ['Hi,',            'Dear Sir/Madam,'],
      ['Hello,',         'Dear Sir/Madam,'],
      ["I'll",           'I will'],
      ["I'm",            'I am'],
      ["can't",          'cannot'],
      ["won't",          'will not'],
      ["don't",          'do not'],
      ["doesn't",        'does not'],
      ["it's",           'it is'],
      ["that's",         'that is'],
      ["you're",         'you are'],
      ["we're",          'we are'],
      ["they're",        'they are'],
      ['Thanks,',        'Yours sincerely,'],
      ['Cheers,',        'Yours faithfully,'],
      ['Best,',          'Yours sincerely,'],
      ['Take care,',     'Yours sincerely,'],
      ['thanks a lot',   'thank you very much'],
      ['let me know',    'please do not hesitate to contact me'],
      ['ASAP',           'as soon as possible'],
      ['FYI',            'for your information'],
      ['get back to me', 'please respond at your earliest convenience'],
    ],
  },

  polite: {
    label: 'Polite',
    receivers: ['Manager', 'Client', 'Supervisor', 'Colleague'],
    wordSwaps: [
      ['Hey,',           'Dear [Name],'],
      ['Hi,',            'Dear [Name],'],
      ['Dear Sir/Madam,','Dear [Name],'],
      ['Yours sincerely,','Best regards,'],
      ['Yours faithfully,','Best regards,'],
      ['Cheers,',        'Best regards,'],
      ['Take care,',     'Best regards,'],
      ['please do not hesitate to contact me', 'feel free to reach out'],
      ['I would like to formally', 'I would like to'],
      ['ASAP',           'as soon as possible'],
    ],
  },

  casual: {
    label: 'Casual',
    receivers: ['Friend'],
    wordSwaps: [
      ['Dear Sir/Madam,',       'Hey,'],
      ['Dear [Name],',          'Hey,'],
      ['To Whom It May Concern,','Hey,'],
      ['Yours sincerely,',      'Cheers,'],
      ['Yours faithfully,',     'Cheers,'],
      ['Best regards,',         'Cheers,'],
      ['I am writing to',       'I wanted to'],
      ['I would like to',       'I want to'],
      ['please do not hesitate to contact me', 'just hit me up'],
      ['at your earliest convenience', 'whenever you get a chance'],
      ['I am unable to',        "I can't"],
      ['I will not be able to', "I won't be able to"],
      ['please be informed',    'just wanted to let you know'],
      ['I would appreciate',    "I'd really appreciate"],
      ['kindly',                'please'],
      ['I am pleased to',       "I'm happy to"],
      ['I am grateful',         "I'm grateful"],
      ['as soon as possible',   'ASAP'],
      ['Thank you for your understanding.', 'Thanks for understanding!'],
    ],
  },

  neutral: {
    label: 'Neutral',
    receivers: ['Unknown'],
    wordSwaps: [
      ['Hey,',       'Hello,'],
      ['Hi ,',       'Hello,'],
      ['Cheers,',    'Regards,'],
      ['Take care,', 'Regards,'],
      ['Yours sincerely,', 'Regards,'],
    ],
  },

  urgent: {
    label: 'Urgent',
    receivers: [],
    wordSwaps: [
      ['Dear Sir/Madam,', 'Dear Sir/Madam,\n\n[URGENT]'],
      ['I am writing to request', 'I am urgently requesting'],
      ['I would like to', 'I need to immediately'],
      ['Please let me know', 'Please respond ASAP'],
      ['at your earliest convenience', 'immediately'],
      ['as soon as possible', 'immediately'],
      ['Best regards,', 'Urgently,'],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// TONE DETECTOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine tone key from receiver type and urgency
 */
function determineTone(receiverType, urgency = 'low') {
  if (urgency === 'high') return 'urgent';
  return getToneForReceiver(receiverType); // Uses existing toneAgent mapping
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE-BASED TONE ADJUSTER (fallback)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Apply word-level tone swaps deterministically
 */
function applyRuleBasedAdjustment(emailBody, toneKey) {
  const toneMap = TONE_RULES[toneKey] || TONE_RULES.neutral;
  let adjusted = emailBody;

  toneMap.wordSwaps.forEach(([from, to]) => {
    // Case-insensitive, whole-phrase replacement
    try {
      const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedFrom, 'gi');
      adjusted = adjusted.replace(regex, to);
    } catch { /* skip invalid patterns */ }
  });

  return adjusted;
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildTonePrompt(subject, emailBody, receiverType, toneKey, intent) {
  const toneProfile = getToneProfile(toneKey);

  const toneExamples = {
    formal: [
      'Salutation: "Dear Sir/Madam," or "Dear [Title] [Name],"',
      'Closing: "Yours sincerely," or "Yours faithfully,"',
      'No contractions (use "I will" not "I\'ll")',
      'Formal vocabulary ("I am writing to formally request..." not "I wanted to ask...")',
    ],
    polite: [
      'Salutation: "Dear [Name],"',
      'Closing: "Best regards," or "Kind regards,"',
      'Contractions allowed',
      'Warm but professional ("I would be grateful if..." not "Could you please...")',
    ],
    casual: [
      'Salutation: "Hey [Name]," or "Hi!"',
      'Closing: "Cheers," or "Thanks!" or "Talk soon,"',
      'Contractions encouraged ("I\'ll", "can\'t", "I\'m")',
      'Conversational phrasing ("Just wanted to let you know..." not "I am writing to inform you...")',
    ],
    neutral: [
      'Salutation: "Hello,"',
      'Closing: "Regards,"',
      'Clear and direct language',
      'Neither too formal nor too casual',
    ],
    urgent: [
      'Open with urgency: mention the critical nature immediately',
      'Use action-oriented language',
      'Closing: "Urgently," or "With urgency,"',
      'Mark subject with [URGENT] prefix if not already present',
    ],
  };

  const examples = (toneExamples[toneKey] || toneExamples.neutral)
    .map((e) => `  - ${e}`)
    .join('\n');

  return `You are a Tone Adjustment Agent.

You will receive a reviewed email and ONLY adjust its tone and wording. Do NOT change its meaning.

═══════════════════════════════════════════════
INPUT EMAIL:
═══════════════════════════════════════════════
Subject: ${subject}

${emailBody}

═══════════════════════════════════════════════
RECEIVER CONTEXT:
═══════════════════════════════════════════════
- Receiver Type: ${receiverType}
- Required Tone: ${toneProfile.label.toUpperCase()} (${toneKey})
- Urgency: ${intent.urgency || 'low'}
- Purpose: ${intent.purpose || 'general_request'}

═══════════════════════════════════════════════
TONE REQUIREMENTS FOR "${toneProfile.label.toUpperCase()}":
═══════════════════════════════════════════════
${examples}

═══════════════════════════════════════════════
YOUR TASKS:
═══════════════════════════════════════════════
1. Detect if the current email tone matches the required tone
2. Adjust the salutation to match the tone
3. Adjust vocabulary and phrasing throughout the body
4. Adjust contractions (expand for formal, allow for casual)
5. Adjust the closing/sign-off to match the tone
6. Ensure the email feels natural for the target audience

═══════════════════════════════════════════════
STRICT RULES:
═══════════════════════════════════════════════
- Do NOT change the meaning or key information
- Do NOT add or remove facts
- Keep [Your Name] placeholder
- Only change tone, wording, and phrasing
- The result must feel natural, not robotic

═══════════════════════════════════════════════
STRICT OUTPUT FORMAT:
═══════════════════════════════════════════════
Return ONLY this JSON. No markdown. No explanation.

{
  "tone": "${toneKey}",
  "adjusted_email": "full adjusted email body with \\n for line breaks"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE PARSER
// ─────────────────────────────────────────────────────────────────────────────

function parseToneResponse(text, expectedTone) {
  // Try direct JSON parse
  try {
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.adjusted_email) {
      return {
        tone: parsed.tone || expectedTone,
        adjusted_email: parsed.adjusted_email.trim(),
      };
    }
  } catch { /* fall through */ }

  // Regex fallback
  const toneMatch  = text.match(/"tone"\s*:\s*"([^"]+)"/i);
  const emailMatch = text.match(/"adjusted_email"\s*:\s*"([\s\S]+?)"\s*[,}]/i);

  if (emailMatch) {
    return {
      tone: toneMatch ? toneMatch[1].trim() : expectedTone,
      adjusted_email: emailMatch[1].replace(/\\n/g, '\n').trim(),
    };
  }

  return null; // signal to use fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ADJUST FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Adjust email tone to match the receiver type.
 *
 * @param {string} subject      - Reviewed email subject
 * @param {string} emailBody    - Reviewed email body
 * @param {string} receiverType - e.g. 'HR', 'Manager', 'Friend', 'Unknown'
 * @param {Object} intent       - Intent object from intentAgent
 *
 * @returns {Promise<{
 *   tone:           string,
 *   adjusted_email: string,
 *   usedFallback:   boolean
 * }>}
 */
async function adjustTone(subject, emailBody, receiverType = 'Unknown', intent = {}) {
  const toneKey    = determineTone(receiverType, intent.urgency);
  const aiReady    = initGemini();
  let usedFallback = false;

  if (aiReady) {
    try {
      const prompt = buildTonePrompt(subject, emailBody, receiverType, toneKey, intent);
      const result = await model.generateContent(prompt);
      const text   = result.response.text();
      const parsed = parseToneResponse(text, toneKey);

      if (parsed) {
        console.log(`[ToneAdjustmentAgent] ✓ AI adjusted tone to: ${parsed.tone}`);
        return { ...parsed, usedFallback: false };
      }

      console.warn('[ToneAdjustmentAgent] Could not parse AI response — applying rule-based adjustment');
    } catch (err) {
      console.warn(`[ToneAdjustmentAgent] AI failed: ${err.message} — applying rule-based adjustment`);
    }
  } else {
    console.warn('[ToneAdjustmentAgent] Gemini not configured — applying rule-based adjustment');
  }

  // Rule-based fallback
  const adjusted = applyRuleBasedAdjustment(emailBody, toneKey);
  usedFallback   = true;

  return {
    tone: toneKey,
    adjusted_email: adjusted,
    usedFallback,
  };
}

module.exports = { adjustTone, determineTone };
