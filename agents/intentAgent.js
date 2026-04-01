/**
 * AGENT 1: Intent Agent
 * Role: AI Input Understanding Agent
 * Converts raw user input into structured JSON data.
 * Does NOT generate emails - only parses intent.
 */

'use strict';

// Receiver keyword maps → role type
const RECEIVER_MAP = {
  hr: 'HR',
  'human resources': 'HR',
  professor: 'Professor',
  prof: 'Professor',
  teacher: 'Professor',
  lecturer: 'Professor',
  manager: 'Manager',
  boss: 'Manager',
  supervisor: 'Manager',
  sir: 'Manager',
  madam: 'Manager',
  client: 'Client',
  customer: 'Client',
  friend: 'Friend',
  colleague: 'Colleague',
  coworker: 'Colleague',
  team: 'Colleague',
  intern: 'Colleague',
  admin: 'Admin',
  principal: 'Admin',
  dean: 'Admin',
  director: 'Admin',
};

// Purpose keyword maps
const PURPOSE_MAP = {
  leave: 'leave_request',
  'sick leave': 'leave_request',
  'casual leave': 'leave_request',
  'medical leave': 'leave_request',
  absent: 'leave_request',
  fever: 'leave_request',
  ill: 'leave_request',
  sick: 'leave_request',
  referral: 'referral',
  recommend: 'referral',
  recommendation: 'referral',
  complaint: 'complaint',
  complain: 'complaint',
  issue: 'complaint',
  problem: 'complaint',
  'follow up': 'follow_up',
  'follow-up': 'follow_up',
  followup: 'follow_up',
  reminder: 'follow_up',
  meeting: 'meeting_request',
  schedule: 'meeting_request',
  'set up a call': 'meeting_request',
  call: 'meeting_request',
  submit: 'task_submission',
  submission: 'task_submission',
  assignment: 'task_submission',
  project: 'task_submission',
  report: 'task_submission',
  thank: 'thank_you',
  thanks: 'thank_you',
  grateful: 'thank_you',
  apolog: 'apology',
  sorry: 'apology',
  request: 'general_request',
  apply: 'job_application',
  application: 'job_application',
  job: 'job_application',
  internship: 'job_application',
  introduction: 'introduction',
  introduce: 'introduction',
};

// Urgency indicators
const URGENCY_KEYWORDS = {
  high: ['urgent', 'immediately', 'asap', 'emergency', 'critical', 'right away', 'today'],
  medium: ['soon', 'by tomorrow', 'as soon as possible', 'quickly', 'deadline'],
  low: [],
};

// Tone indicators
const TONE_KEYWORDS = {
  formal: ['formally', 'official', 'respectfully', 'dear', 'sincerely'],
  urgent: ['urgent', 'emergency', 'critical', 'immediately', 'asap'],
  friendly: ['hey', 'hi', 'friend', 'buddy', 'thanks a lot', 'cheers'],
  polite: ['please', 'kindly', 'request', 'appreciate', 'grateful'],
};

// Sender role indicators
const SENDER_MAP = {
  student: 'Student',
  employee: 'Employee',
  intern: 'Intern',
  developer: 'Employee',
  engineer: 'Employee',
  manager: 'Manager',
  teacher: 'Teacher',
  professor: 'Professor',
  client: 'Client',
  freelancer: 'Freelancer',
};

/**
 * Detect purpose from input text
 */
function detectPurpose(text) {
  const lower = text.toLowerCase();
  for (const [keyword, purpose] of Object.entries(PURPOSE_MAP)) {
    if (lower.includes(keyword)) return purpose;
  }
  return 'general_request';
}

/**
 * Detect receiver type from receiver email domain or text context
 */
function detectReceiver(text, receiverEmail) {
  const lower = text.toLowerCase();

  // Check text for receiver mentions
  for (const [keyword, role] of Object.entries(RECEIVER_MAP)) {
    if (lower.includes(keyword)) return role;
  }

  // Infer from email domain
  if (receiverEmail) {
    const domain = receiverEmail.split('@')[1] || '';
    if (domain.includes('.edu') || domain.includes('university') || domain.includes('college')) {
      return 'Professor';
    }
    if (domain.includes('hr')) return 'HR';
  }

  return 'Unknown';
}

/**
 * Detect tone based on context and receiver
 */
function detectTone(text, receiverType) {
  const lower = text.toLowerCase();

  // Check explicit tone keywords
  for (const [tone, keywords] of Object.entries(TONE_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return tone;
  }

  // Infer from receiver type
  const formalReceivers = ['HR', 'Professor', 'Admin', 'Director', 'Dean'];
  const politeReceivers = ['Manager', 'Client', 'Supervisor'];
  const casualReceivers = ['Friend'];

  if (formalReceivers.includes(receiverType)) return 'formal';
  if (politeReceivers.includes(receiverType)) return 'polite';
  if (casualReceivers.includes(receiverType)) return 'friendly';

  return 'neutral';
}

/**
 * Detect urgency level
 */
function detectUrgency(text) {
  const lower = text.toLowerCase();
  if (URGENCY_KEYWORDS.high.some((kw) => lower.includes(kw))) return 'high';
  if (URGENCY_KEYWORDS.medium.some((kw) => lower.includes(kw))) return 'medium';
  return 'low';
}

/**
 * Extract key points from user input
 */
function extractKeyPoints(text) {
  const points = [];

  // Extract numbers (days, dates, counts)
  const numbers = text.match(/\b(\d+)\s*(day|days|week|weeks|hour|hours|month|months)\b/gi);
  if (numbers) points.push(...numbers.map((n) => `Duration: ${n}`));

  // Extract dates
  const dates = text.match(
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+\w+)\b/gi
  );
  if (dates) points.push(...dates.map((d) => `Date: ${d}`));

  // Extract reason/cause words
  const reasonMatch = text.match(/\b(due to|because of|owing to|since|as|reason[:]\s*)\s*([^,.]+)/i);
  if (reasonMatch) points.push(`Reason: ${reasonMatch[2].trim()}`);

  // Extract action words
  const purposeWords = ['requesting', 'applying', 'submitting', 'following up', 'complaining', 'thanking', 'apologizing'];
  purposeWords.forEach((word) => {
    if (text.toLowerCase().includes(word)) points.push(`Action: ${word}`);
  });

  // If no specific points extracted, use the input summary
  if (points.length === 0) {
    // Trim and split the input for short bullet points
    const trimmed = text.trim().replace(/\s+/g, ' ');
    points.push(trimmed.length > 100 ? trimmed.substring(0, 100) + '...' : trimmed);
  }

  return [...new Set(points)]; // Remove duplicates
}

/**
 * Detect sender role from input
 */
function detectSenderRole(text) {
  const lower = text.toLowerCase();
  for (const [keyword, role] of Object.entries(SENDER_MAP)) {
    if (lower.includes(keyword)) return role;
  }
  return 'Unknown';
}

/**
 * Identify what information is missing
 */
function findMissingInfo(text, receiverEmail, purpose) {
  const missing = [];

  if (!receiverEmail || receiverEmail.trim() === '') {
    missing.push('receiver_email');
  }

  // Check for purpose-specific missing info
  const leaveTypes = ['leave_request'];
  if (leaveTypes.includes(purpose)) {
    if (!text.match(/\d+\s*(day|days)/i) && !text.match(/from.*to/i)) {
      missing.push('leave_duration_or_dates');
    }
    if (!text.match(/due to|because|reason|fever|sick|ill|personal|family|medical/i)) {
      missing.push('reason_for_leave');
    }
  }

  if (purpose === 'meeting_request') {
    if (!text.match(/\d{1,2}[:/]\d{2}|\d+\s*(am|pm)|morning|afternoon|evening/i)) {
      missing.push('preferred_meeting_time');
    }
  }

  if (purpose === 'job_application') {
    if (!text.match(/position|role|post|designation|job title/i)) {
      missing.push('job_position_or_role');
    }
  }

  return missing;
}

/**
 * Main intent parsing function
 * @param {string} userInput - Raw user input
 * @param {string} receiverEmail - Target email address (optional)
 * @returns {Object} Structured intent JSON
 */
function parseIntent(userInput, receiverEmail = '') {
  if (!userInput || userInput.trim() === '') {
    return {
      purpose: 'unknown',
      key_points: [],
      sender_role: 'Unknown',
      receiver: 'Unknown',
      tone: 'neutral',
      urgency: 'low',
      missing_info: ['user_input'],
    };
  }

  const purpose = detectPurpose(userInput);
  const receiver = detectReceiver(userInput, receiverEmail);
  const tone = detectTone(userInput, receiver);
  const urgency = detectUrgency(userInput);
  const key_points = extractKeyPoints(userInput);
  const sender_role = detectSenderRole(userInput);
  const missing_info = findMissingInfo(userInput, receiverEmail, purpose);

  return {
    purpose,
    key_points,
    sender_role,
    receiver,
    tone,
    urgency,
    missing_info,
  };
}

module.exports = { parseIntent };
