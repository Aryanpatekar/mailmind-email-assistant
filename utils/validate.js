/**
 * Utility: Email Validation
 */

'use strict';

/**
 * Validate email address format (RFC 5322 simplified regex)
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email address is required.' };
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    return { valid: false, message: 'Email address cannot be empty.' };
  }

  // RFC 5322 compliant simplified regex
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: `"${trimmed}" is not a valid email address.` };
  }

  // Check for common typos in domains
  const commonTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
  };

  const domain = trimmed.split('@')[1];
  if (commonTypos[domain]) {
    return {
      valid: false,
      message: `Did you mean "${trimmed.replace(domain, commonTypos[domain])}"?`,
    };
  }

  return { valid: true, message: 'Valid email address.' };
}

/**
 * Validate user input text
 * @param {string} input
 * @returns {{ valid: boolean, message: string }}
 */
function validateInput(input) {
  if (!input || typeof input !== 'string' || input.trim().length === 0) {
    return { valid: false, message: 'Please describe what you want to say in your email.' };
  }

  if (input.trim().length < 5) {
    return { valid: false, message: 'Input too short. Please provide more context.' };
  }

  if (input.trim().length > 2000) {
    return { valid: false, message: 'Input too long. Please keep it under 2000 characters.' };
  }

  return { valid: true, message: 'Valid.' };
}

module.exports = { validateEmail, validateInput };
