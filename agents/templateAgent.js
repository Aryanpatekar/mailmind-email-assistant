/**
 * AGENT 8: Backup Email Template Provider
 *
 * Role: Used strictly when the AI (Gemini) is unavailable, fails, or exceeds quota.
 *       It acts as a deterministic fallback, returning a professionally pre-written
 *       email matching the required tone and purpose.
 *
 * Tasks:
 * - Identify email purpose
 * - Select appropriate template (Purpose + Tone)
 * - Fill placeholders using available data (intent)
 *
 * Rules:
 * - Keep it simple and professional
 * - Ensure email is ready to send
 *
 * Output Format:
 * {
 *   "subject": "",
 *   "template_email": ""
 * }
 */

'use strict';

const { getTemplate: getRawTemplate, getAvailablePurposes } = require('../utils/templates');

/**
 * Intelligent placeholder interpolation.
 * Replaces known bracketed placeholders in the raw template with actual context from the intent.
 *
 * @param {string} text - The raw template text
 * @param {Object} intent - The parsed intent object containing Context
 * @returns {string} The text with placeholders filled
 */
function fillPlaceholders(text, intent) {
  let filled = text;

  // 1. Receiver Name Placeholder
  // e.g., [Manager's Name], [Name], [Hiring Manager], [Title] [Name]
  const receiverName = (intent.receiver && intent.receiver.toLowerCase() !== 'unknown')
    ? intent.receiver
    : 'there'; // Fallback so "Dear there," -> wait, "Dear Sir/Madam," is better if unknown, but templates usually use [Name] politely. Let's just use the receiver string.
  
  filled = filled.replace(/\[Manager's Name\]/gi, intent.receiver !== 'Unknown' ? intent.receiver : 'Manager');
  filled = filled.replace(/\[Hiring Manager\]/gi, intent.receiver !== 'Unknown' ? intent.receiver : 'Hiring Manager');
  filled = filled.replace(/\[Title\] \[Name\]/gi, intent.receiver !== 'Unknown' ? intent.receiver : 'Sir/Madam');
  filled = filled.replace(/\[Name\]/gi, intent.receiver !== 'Unknown' ? intent.receiver : 'Colleague');
  filled = filled.replace(/\[Candidate Name\]/gi, intent.receiver !== 'Unknown' ? intent.receiver : 'the candidate');

  // 2. Context/Topic Placeholders
  // e.g., [topic], [matter], [reason], [issue], [role], [position]
  const context = (intent.key_points && intent.key_points.length > 0)
    ? intent.key_points.join(' and ')
    : 'the matter discussed';

  filled = filled.replace(/\[topic\]/gi, context);
  filled = filled.replace(/\[matter\]/gi, context);
  filled = filled.replace(/\[reason\]/gi, context);
  filled = filled.replace(/\[issue\]/gi, context);
  filled = filled.replace(/\[issue\/incident\]/gi, context);
  
  // Specific role / tasks
  filled = filled.replace(/\[role\/opportunity\]/gi, context);
  filled = filled.replace(/\[role\]/gi, context);
  filled = filled.replace(/\[position\]/gi, context);
  filled = filled.replace(/\[position\/opportunity\]/gi, context);
  filled = filled.replace(/\[task\/assignment\/report\]/gi, 'the requested task');
  filled = filled.replace(/\[task\/document\]/gi, 'the requested documents');
  filled = filled.replace(/\[task\]/gi, 'the requested task');

  // 3. Sender Placeholder (Leave explicitly for user to fill later, or use generic)
  // Usually users want their names inserted, but we'll leave [Your Name] 
  // exactly as it is because sender name isn't in Intent usually.
  
  // 4. Brief description / background
  filled = filled.replace(/\[brief description of your role\/background\]/gi, 'reaching out to connect');
  filled = filled.replace(/\[brief background\]/gi, 'wanted to get in touch');
  filled = filled.replace(/\[brief intro\]/gi, 'wanted to say hi');
  filled = filled.replace(/\[brief description of issue\]/gi, context);
  filled = filled.replace(/\[brief description\]/gi, context);
  
  return filled;
}

/**
 * Backup Email Template Provider Agent entry point.
 *
 * @param {string} purpose - Attempted email purpose (e.g., 'leave_request')
 * @param {string} toneKey - Attempted tone (e.g., 'formal')
 * @param {Object} intent  - Parsed intent containing metadata
 *
 * @returns {{ subject: string, template_email: string }}
 */
function provideBackupTemplate(purpose, toneKey, intent = {}) {
  // 1. Identify specific purpose and tone, fallback to generic if unknown
  const validPurposes = getAvailablePurposes();
  const safePurpose   = validPurposes.includes(purpose) ? purpose : 'general_request';
  
  // 2. Retrieve raw template text from established utilities
  const rawTemplate = getRawTemplate(safePurpose, toneKey, intent);

  // 3. Fill placeholders intelligently
  const filledSubject = fillPlaceholders(rawTemplate.subject, intent);
  const filledBody    = fillPlaceholders(rawTemplate.body, intent);

  // 4. Format to the strict required output structure
  return {
    subject:        filledSubject,
    template_email: filledBody,
  };
}

module.exports = { provideBackupTemplate };
