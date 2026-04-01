/**
 * AGENT 3 (v2): Professional Email Writing AI Agent
 *
 * Role: Receives structured JSON from the Intent Agent and generates
 *       a complete, professional email with proper sections.
 *
 * Input:  Structured intent JSON { purpose, key_points, sender_role,
 *         receiver, tone, urgency, missing_info }
 *
 * Output: { "subject": "...", "email_body": "..." }
 *
 * Rules:
 * - Generate a clear subject line
 * - Write a professional greeting
 * - Convert key points into structured paragraphs
 * - Maintain proper tone throughout
 * - Add polite closing and signature
 * - Keep email concise and professional
 * - Use simple English, avoid grammatical errors
 * - Personalize when possible
 */

'use strict';

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildToneInstructions, getToneProfile } = require('./toneAgent');
const { provideBackupTemplate } = require('./templateAgent');

let genAI = null;
let model = null;

/** Initialize Gemini client (lazy) */
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

/**
 * Build a strict, structured AI prompt from intent JSON
 */
function buildPrompt(userInput, intent, toneKey, receiverEmail) {
  const toneProfile = getToneProfile(toneKey);
  const toneInstructions = buildToneInstructions(toneKey);
  const keyPointsList = intent.key_points.length > 0
    ? intent.key_points.map((p, i) => `  ${i + 1}. ${p}`).join('\n')
    : '  (none detected — infer from the user input)';

  const urgencyNote = intent.urgency === 'high'
    ? 'URGENT: Prefix the subject with [URGENT] and mention priority in the opening line.'
    : intent.urgency === 'medium'
    ? 'NOTE: Mention the deadline or timeframe clearly in the body.'
    : '';

  return `You are a Professional Email Writing AI Agent.

You will receive structured intent data and must write a complete, professional email.

═══════════════════════════════════════════════
INPUT DATA:
═══════════════════════════════════════════════

USER'S ORIGINAL REQUEST:
"${userInput}"

PARSED INTENT JSON:
{
  "purpose": "${intent.purpose}",
  "key_points": [${intent.key_points.map((k) => `"${k}"`).join(', ')}],
  "sender_role": "${intent.sender_role}",
  "receiver": "${intent.receiver}",
  "tone": "${toneKey}",
  "urgency": "${intent.urgency}",
  "missing_info": [${intent.missing_info.map((m) => `"${m}"`).join(', ')}]
}

RECIPIENT EMAIL: ${receiverEmail || 'Not provided'}

═══════════════════════════════════════════════
TONE PROFILE: ${toneProfile.label.toUpperCase()}
═══════════════════════════════════════════════
${toneInstructions}

${urgencyNote}

═══════════════════════════════════════════════
KEY POINTS TO INCLUDE:
═══════════════════════════════════════════════
${keyPointsList}

═══════════════════════════════════════════════
EMAIL STRUCTURE REQUIREMENTS:
═══════════════════════════════════════════════
1. SUBJECT LINE
   - Clear, highly professional, and relevant to the actual underlying situation
   - 6–12 words maximum (e.g., "Unable to Attend [Event] Due to [Reason]")

2. GREETING
   - Use "${toneProfile.salutation}" style
   - If receiver type is known (${intent.receiver}), address appropriately
   - Do NOT use placeholder brackets like [Name]

3. OPENING PARAGRAPH
   - Warmly open the email and explicitly state the core purpose immediately
   - 2–3 sentences to establish context strongly

4. BODY PARAGRAPHS (Crucial: Be Comprehensive)
   - Write a HIGHLY DETAILED, fully fleshed-out professional email.
   - Do NOT just write a 2-line note. Expand on the provided key points to create a cohesive, flowing, and comprehensive narrative.
   - For example, if the input is "fever, cannot attend", expand it to explain the sudden onset, the inability to participate, and the regret of missing the opportunity.
   - Ensure the tone is extremely polished and respectful.

5. CLOSING PARAGRAPH
   - Polite call to action or expression of gratitude/regret (e.g., "Thank you for your understanding", "I appreciate your consideration")
   - 1–3 sentences

6. SIGN-OFF
   - Use "${toneProfile.closing}" style
   - Leave space for name with: "[Your Name]"
   - If sender role is known (${intent.sender_role}), optionally add the role

═══════════════════════════════════════════════
STRICT OUTPUT FORMAT:
═══════════════════════════════════════════════
Return ONLY this JSON. No extra text, no markdown, no explanation.

{
  "subject": "subject line here",
  "email_body": "full email body here with proper line breaks using \\n"
}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RESPONSE PARSER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse AI response — expects JSON { subject, email_body }
 * Falls back gracefully if JSON parsing fails
 */
function parseAIResponse(text) {
  // Try direct JSON parse first
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.subject && parsed.email_body) {
      return {
        subject: parsed.subject.trim(),
        body: parsed.email_body.trim(),
      };
    }
  } catch { /* fall through to regex parsing */ }

  // Regex fallback — extract subject and body separately
  const subjectMatch = text.match(/"subject"\s*:\s*"([^"]+)"/i);
  const bodyMatch = text.match(/"email_body"\s*:\s*"([\s\S]+?)"\s*[,}]/i);

  if (subjectMatch && bodyMatch) {
    return {
      subject: subjectMatch[1].trim(),
      body: bodyMatch[1].replace(/\\n/g, '\n').trim(),
    };
  }

  // Last resort — treat entire response as body
  const lines = text.split('\n');
  const subject = lines[0].replace(/^(subject:|re:|fw:)/i, '').trim() || 'Email';
  const body = lines.slice(1).join('\n').trim() || text.trim();
  return { subject, body };
}

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK GENERATOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate structured email from fallback templates
 * Returns { subject, body } matching the same contract as AI output
 */
function generateWithFallback(intent, toneKey) {
  const template = provideBackupTemplate(intent.purpose, toneKey, intent);
  return {
    subject: template.subject,
    body: template.template_email,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATE FUNCTION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a professional email from structured intent data.
 *
 * @param {string} userInput      - Original raw user input
 * @param {Object} intent         - Structured intent JSON from intentAgent
 * @param {string} toneKey        - Tone key: formal | polite | friendly | urgent | neutral
 * @param {string} receiverEmail  - Target email address (optional)
 *
 * @returns {Promise<{subject: string, body: string, usedFallback: boolean, rawOutput: Object}>}
 */
async function generateEmail(userInput, intent, toneKey, receiverEmail = '') {
  let usedFallback = false;
  let subject = '';
  let body = '';
  let rawOutput = null;

  const aiReady = initGemini();

  if (aiReady) {
    try {
      const prompt = buildPrompt(userInput, intent, toneKey, receiverEmail);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const parsed = parseAIResponse(responseText);
      subject = parsed.subject;
      body = parsed.body;

      // Store raw AI JSON output for transparency
      rawOutput = { subject, email_body: body };

      console.log(`[EmailGeneratorAgent] ✓ AI generated email | Subject: "${subject}"`);
    } catch (err) {
      console.warn(`[EmailGeneratorAgent] AI generation failed: ${err.message} \n— using fallback`);
      const fallback = generateWithFallback(intent, toneKey);
      subject = fallback.subject;
      body = fallback.body;
      usedFallback = true;
    }
  } else {
    console.warn('[EmailGeneratorAgent] Gemini not configured — using fallback template');
    const fallback = generateWithFallback(intent, toneKey);
    subject = fallback.subject;
    body = fallback.body;
    usedFallback = true;
  }

  return {
    subject,
    body,
    usedFallback,
    rawOutput: rawOutput || { subject, email_body: body },
  };
}

module.exports = { generateEmail };
