/**
 * AGENT 2: Tone Agent
 * Role: Maps receiver type and context to the appropriate communication tone.
 * Provides tone instructions to the Email Generator Agent.
 */

'use strict';

/**
 * Tone profiles — define writing style for each tone type
 */
const TONE_PROFILES = {
  formal: {
    label: 'Formal',
    description: 'Official, respectful, structured language suitable for HR, professors, and officials.',
    salutation: 'Dear [Receiver Name/Designation],',
    closing: 'Yours sincerely,',
    style_instructions: [
      'Use full sentences and avoid contractions (do not vs don\'t)',
      'Maintain a professional and respectful tone throughout',
      'Avoid casual phrases, slang, or abbreviations',
      'Be precise and concise',
      'Use passive voice where appropriate to maintain formality',
    ],
  },
  polite: {
    label: 'Polite',
    description: 'Courteous and professional, suitable for managers, clients, and workplace peers.',
    salutation: 'Dear [Receiver Name],',
    closing: 'Best regards,',
    style_instructions: [
      'Be respectful and courteous',
      'Contractions are acceptable (I\'ll, I\'m, we\'re)',
      'Use a warm but professional tone',
      'Be direct while remaining considerate',
      'Express gratitude where appropriate',
    ],
  },
  friendly: {
    label: 'Friendly',
    description: 'Casual and warm, suitable for friends, colleagues, and informal communication.',
    salutation: 'Hey [Name],',
    closing: 'Cheers,',
    style_instructions: [
      'Use conversational, natural language',
      'Contractions and informal phrases are encouraged',
      'Keep it short and to the point',
      'Be warm and personable',
      'Avoid overly structured formatting',
    ],
  },
  urgent: {
    label: 'Urgent',
    description: 'Direct and time-sensitive, highlights priority clearly.',
    salutation: 'Dear [Receiver Name/Designation],',
    closing: 'Regards,',
    style_instructions: [
      'Clearly state urgency in the opening line',
      'Be direct and get to the point immediately',
      'Use action-oriented language',
      'Highlight the deadline or critical timeframe',
      'Keep the email brief but complete',
    ],
  },
  neutral: {
    label: 'Neutral',
    description: 'Balanced, clear communication for unknown receivers.',
    salutation: 'Dear Sir/Madam,',
    closing: 'Regards,',
    style_instructions: [
      'Be clear and straightforward',
      'Use professional but accessible language',
      'Maintain a balanced tone — not too formal, not too casual',
      'Ensure clarity in every sentence',
    ],
  },
};

/**
 * Receiver → Default tone mapping
 */
const RECEIVER_TONE_MAP = {
  HR: 'formal',
  Professor: 'formal',
  Admin: 'formal',
  Director: 'formal',
  Dean: 'formal',
  Manager: 'polite',
  Client: 'polite',
  Supervisor: 'polite',
  Colleague: 'polite',
  Friend: 'friendly',
  Unknown: 'neutral',
};

/**
 * Get tone for a given receiver type
 * @param {string} receiverType - e.g. 'HR', 'Manager', 'Friend'
 * @param {string} [overrideTone] - Optional user-specified tone override
 * @returns {string} tone key
 */
function getToneForReceiver(receiverType, overrideTone = null) {
  if (overrideTone && TONE_PROFILES[overrideTone]) {
    return overrideTone;
  }
  return RECEIVER_TONE_MAP[receiverType] || 'neutral';
}

/**
 * Get full tone profile with instructions
 * @param {string} toneKey - e.g. 'formal', 'polite', 'friendly'
 * @returns {Object} Full tone profile object
 */
function getToneProfile(toneKey) {
  return TONE_PROFILES[toneKey] || TONE_PROFILES.neutral;
}

/**
 * Build tone instruction string for the AI generator prompt
 * @param {string} toneKey
 * @returns {string} Formatted instructions for AI
 */
function buildToneInstructions(toneKey) {
  const profile = getToneProfile(toneKey);
  const instructions = [
    `Tone: ${profile.label}`,
    `Description: ${profile.description}`,
    `Salutation style: ${profile.salutation}`,
    `Closing style: ${profile.closing}`,
    `Style rules:`,
    ...profile.style_instructions.map((rule) => `  - ${rule}`),
  ];
  return instructions.join('\n');
}

/**
 * Get list of all available tones (for frontend selector)
 * @returns {Array} Array of { key, label, description }
 */
function getAvailableTones() {
  return Object.entries(TONE_PROFILES).map(([key, profile]) => ({
    key,
    label: profile.label,
    description: profile.description,
  }));
}

module.exports = {
  getToneForReceiver,
  getToneProfile,
  buildToneInstructions,
  getAvailableTones,
};
