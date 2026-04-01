/**
 * AGENT 6: Email Review & Optimization Expert
 *
 * Role: Reviews a generated email draft and returns a polished,
 *       ready-to-send version with a list of improvements made.
 *
 * Input:
 *   - subject    {string} — Draft subject line
 *   - email_body {string} — Draft email body
 *   - intent     {Object} — Parsed intent JSON from intentAgent
 *   - tone       {string} — Tone key (formal/polite/friendly/urgent/neutral)
 *
 * Output: {
 *   "final_subject":     "...",
 *   "final_email":       "...",
 *   "improvements_made": ["...", "..."]
 * }
 *
 * Tasks:
 * - Correct grammar and sentence structure
 * - Improve clarity and readability
 * - Enhance professionalism and tone
 * - Remove unnecessary words
 * - Ensure alignment with purpose
 *
 * Rules:
 * - Do NOT change original meaning
 * - Keep it human-like
 * - Make it ready to send
 */

'use strict';

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getToneProfile } = require('./toneAgent');

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
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────

function buildReviewPrompt(subject, emailBody, intent, toneKey) {
  const toneProfile = getToneProfile(toneKey);

  return `You are an Email Review and Optimization Expert.

You will receive a draft email. Your job is to review and improve it without changing its meaning.

═══════════════════════════════════════════════
DRAFT EMAIL:
═══════════════════════════════════════════════
Subject: ${subject}

${emailBody}

═══════════════════════════════════════════════
CONTEXT:
═══════════════════════════════════════════════
- Purpose: ${intent.purpose || 'general_request'}
- Receiver Type: ${intent.receiver || 'Unknown'}
- Tone: ${toneProfile.label} (${toneKey})
- Urgency: ${intent.urgency || 'low'}
- Key Points to preserve: ${(intent.key_points || []).join('; ') || 'N/A'}

═══════════════════════════════════════════════
YOUR REVIEW TASKS:
═══════════════════════════════════════════════
1. GRAMMAR & STRUCTURE
   - Fix any grammatical errors
   - Correct awkward or unclear sentence structures
   - Ensure proper punctuation throughout

2. CLARITY & READABILITY
   - Make sentences clear and easy to understand
   - Break long sentences into shorter ones where needed
   - Ensure logical flow from start to finish

3. PROFESSIONALISM & TONE
   - Align with the "${toneProfile.label}" tone
   - Remove phrases that are too stiff, robotic, or overly casual
   - Make it sound like a real human wrote it

4. CONCISENESS
   - Remove unnecessary filler words or redundant phrases
   - Keep every sentence purposeful
   - Trim wordy expressions (e.g., "due to the fact that" → "because")

5. PURPOSE ALIGNMENT
   - Ensure the email clearly addresses its purpose: ${intent.purpose || 'general_request'}
   - The core message must remain unchanged
   - All original key points must still be present

═══════════════════════════════════════════════
STRICT RULES:
═══════════════════════════════════════════════
- Do NOT change the original meaning
- Do NOT add new information not present in the draft
- Keep [Your Name] placeholder as-is
- Make it feel natural and human — not AI-generated
- Keep the same general structure (greeting, body, closing)

═══════════════════════════════════════════════
STRICT OUTPUT FORMAT:
═══════════════════════════════════════════════
Return ONLY this JSON. No extra text. No markdown code fences.

{
  "final_subject": "improved subject line",
  "final_email": "complete improved email body with \\n for line breaks",
  "improvements_made": [
    "brief description of improvement 1",
    "brief description of improvement 2"
  ]
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE PARSER
// ─────────────────────────────────────────────────────────────────────────────

function parseReviewResponse(text) {
  // Try direct JSON parse (strip markdown fences if present)
  try {
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.final_subject && parsed.final_email) {
      return {
        final_subject: parsed.final_subject.trim(),
        final_email: parsed.final_email.trim(),
        improvements_made: Array.isArray(parsed.improvements_made)
          ? parsed.improvements_made
          : [],
      };
    }
  } catch { /* fall through */ }

  // Regex fallbacks
  const subjectMatch = text.match(/"final_subject"\s*:\s*"([^"]+)"/i);
  const emailMatch   = text.match(/"final_email"\s*:\s*"([\s\S]+?)"\s*,\s*"improvements/i);
  const improvMatch  = text.match(/"improvements_made"\s*:\s*\[([\s\S]+?)\]/i);

  const finalSubject = subjectMatch ? subjectMatch[1].trim() : null;
  const finalEmail   = emailMatch   ? emailMatch[1].replace(/\\n/g, '\n').trim() : null;

  let improvements = [];
  if (improvMatch) {
    try {
      improvements = JSON.parse(`[${improvMatch[1]}]`);
    } catch {
      improvements = improvMatch[1]
        .split('",')
        .map((s) => s.replace(/^[\s"]+|[\s"]+$/g, ''))
        .filter(Boolean);
    }
  }

  if (finalSubject && finalEmail) {
    return { final_subject: finalSubject, final_email: finalEmail, improvements_made: improvements };
  }

  return null; // Signal to use fallback
}

// ─────────────────────────────────────────────────────────────────────────────
// RULE-BASED FALLBACK REVIEWER
// Applied when AI is unavailable — does basic deterministic improvements
// ─────────────────────────────────────────────────────────────────────────────

const WORDY_REPLACEMENTS = [
  [/\bdue to the fact that\b/gi, 'because'],
  [/\bin order to\b/gi, 'to'],
  [/\bat this point in time\b/gi, 'now'],
  [/\bfor the purpose of\b/gi, 'for'],
  [/\bplease do not hesitate to\b/gi, 'please feel free to'],
  [/\bkindly be informed that\b/gi, 'please note that'],
  [/\bI am writing to inform you that\b/gi, 'I wanted to let you know that'],
  [/\bI am writing to let you know that\b/gi, 'I wanted to let you know that'],
  [/\bthank you for your kind\b/gi, 'thank you for your'],
  [/\bI would like to take this opportunity to\b/gi, 'I would like to'],
  [/\bPlease find attached\b/gi, 'I have attached'],
  [/\bat your earliest convenience\b/gi, 'as soon as possible'],
];

function applyFallbackReview(subject, emailBody, intent) {
  let finalSubject = subject.trim();
  let finalEmail   = emailBody.trim();
  const improvements = [];

  // 1. Trim trailing whitespace per line
  const linesBefore = finalEmail.split('\n');
  const linesAfter  = linesBefore.map((l) => l.trimEnd());
  if (linesAfter.join('') !== linesBefore.join('')) {
    improvements.push('Removed trailing whitespace from lines');
  }
  finalEmail = linesAfter.join('\n');

  // 2. Replace wordy phrases
  WORDY_REPLACEMENTS.forEach(([pattern, replacement]) => {
    if (pattern.test(finalEmail)) {
      finalEmail = finalEmail.replace(pattern, replacement);
      improvements.push(`Replaced wordy phrase: "${pattern.source}" → "${replacement}"`);
    }
  });

  // 3. Fix double spaces
  if (/  +/.test(finalEmail)) {
    finalEmail = finalEmail.replace(/  +/g, ' ');
    improvements.push('Removed double spaces');
  }

  // 4. Ensure subject is not too long (trim to 80 chars)
  if (finalSubject.length > 80) {
    finalSubject = finalSubject.substring(0, 77) + '...';
    improvements.push('Trimmed overly long subject line');
  }

  // 5. Ensure proper ending punctuation on subject
  if (!/[.!?]$/.test(finalSubject) === false) {
    // Subject lines should NOT end with punctuation — remove if present
    finalSubject = finalSubject.replace(/[.]+$/, '');
    improvements.push('Removed trailing punctuation from subject line');
  }

  // 6. Collapse 3+ blank lines into 2
  if (/\n{3,}/.test(finalEmail)) {
    finalEmail = finalEmail.replace(/\n{3,}/g, '\n\n');
    improvements.push('Collapsed excessive blank lines');
  }

  if (improvements.length === 0) {
    improvements.push('Email reviewed — no major issues found, minor formatting normalized');
  }

  return { final_subject: finalSubject, final_email: finalEmail, improvements_made: improvements };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN REVIEW FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Review and optimize a generated email draft.
 *
 * @param {string} subject    - Draft subject from email generator
 * @param {string} emailBody  - Draft body from email generator
 * @param {Object} intent     - Parsed intent JSON from intentAgent
 * @param {string} toneKey    - Tone key (formal/polite/friendly/urgent/neutral)
 *
 * @returns {Promise<{
 *   final_subject:     string,
 *   final_email:       string,
 *   improvements_made: string[],
 *   usedFallback:      boolean
 * }>}
 */
async function reviewEmail(subject, emailBody, intent = {}, toneKey = 'neutral') {
  const aiReady = initGemini();
  let usedFallback = false;

  if (aiReady) {
    try {
      const prompt = buildReviewPrompt(subject, emailBody, intent, toneKey);
      const result = await model.generateContent(prompt);
      const text   = result.response.text();
      const parsed = parseReviewResponse(text);

      if (parsed) {
        console.log(`[ReviewAgent] ✓ AI reviewed email | Improvements: ${parsed.improvements_made.length}`);
        return { ...parsed, usedFallback: false };
      }

      // Parsing failed — use fallback
      console.warn('[ReviewAgent] Could not parse AI response — applying rule-based review');
      const fallback = applyFallbackReview(subject, emailBody, intent);
      return { ...fallback, usedFallback: true };

    } catch (err) {
      console.warn(`[ReviewAgent] AI review failed: ${err.message} — applying rule-based review`);
      const fallback = applyFallbackReview(subject, emailBody, intent);
      return { ...fallback, usedFallback: true };
    }
  }

  // No AI available — rule-based review
  console.warn('[ReviewAgent] Gemini not configured — applying rule-based review');
  const fallback = applyFallbackReview(subject, emailBody, intent);
  return { ...fallback, usedFallback: true };
}

module.exports = { reviewEmail };
