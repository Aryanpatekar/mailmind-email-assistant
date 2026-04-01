/**
 * AGENT 3: Memory Agent
 * Role: Stores, retrieves and manages previously generated emails.
 * Persistence is via a local JSON file (data/emails.json).
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_FILE = path.join(__dirname, '..', 'data', 'emails.json');
const MAX_HISTORY = 50; // Keep last 50 emails

/**
 * Ensure the data file exists
 */
function ensureDataFile() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

/**
 * Read all stored emails
 * @returns {Array} Array of email records
 */
function readEmails() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

/**
 * Write emails array to disk
 * @param {Array} emails
 */
function writeEmails(emails) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(emails, null, 2), 'utf8');
}

/**
 * Extract semantic tags for future retrieval.
 * Uses metadata and simple keyword matching on the subject/body.
 */
function extractTags(emailData) {
  const tags = new Set();
  
  // 1. Add guaranteed metadata tags
  if (emailData.tone)     tags.add(emailData.tone.toLowerCase());
  if (emailData.receiver) tags.add(emailData.receiver.toLowerCase());
  if (emailData.purpose)  tags.add(emailData.purpose.toLowerCase());

  // 2. Add keyword-based tags from subject/body
  const content = `${emailData.subject} ${emailData.body}`.toLowerCase();
  
  const keywords = {
    leave:     ['leave', 'sick', 'vacation', 'pto', 'absence', 'fever', 'medical'],
    meeting:   ['meeting', 'catch up', 'discuss', 'sync', 'call', 'schedule'],
    followup:  ['follow up', 'update', 'status', 'checking in'],
    deadline:  ['deadline', 'due', 'urgent', 'asap', 'extension'],
    referral:  ['referral', 'recommend', 'position', 'apply'],
    complaint: ['complaint', 'issue', 'problem', 'unhappy', 'resolve'],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => content.includes(word))) {
      tags.add(category);
    }
  }

  // Ensure no empty tags, replace spaces and underscores with hyphens
  return Array.from(tags)
    .filter((t) => typeof t === 'string' && t.trim() !== '' && t !== 'unknown' && t !== 'general_request')
    .map((t) => t.trim().replace(/[\s_]+/g, '-'));
}

/**
 * Save a new email record to memory
 * @param {Object} emailData - { userInput, subject, body, tone, receiver, receiverEmail, purpose }
 * @returns {Object} { status: 'stored', tags: [], timestamp: string, id: string }
 */
function saveEmail(emailData) {
  const emails = readEmails();
  
  const tags = extractTags(emailData);
  const timestamp = new Date().toISOString();
  const id = uuidv4();

  const record = {
    id,
    timestamp,
    tags,
    userInput: emailData.userInput || '',
    subject: emailData.subject || '',
    body: emailData.body || '',
    tone: emailData.tone || 'neutral',
    receiver: emailData.receiver || 'Unknown',
    receiverEmail: emailData.receiverEmail || '',
    purpose: emailData.purpose || 'general_request',
    sent: emailData.sent || false,
  };

  // Prepend new record (newest first)
  emails.unshift(record);

  // Trim to max history size
  const trimmed = emails.slice(0, MAX_HISTORY);
  writeEmails(trimmed);

  // Return strictly defined contract for Agent pipeline
  return {
    status: 'stored',
    tags,
    timestamp,
    id, // kept for route lookup (markAsSent)
  };
}

/**
 * Get recent emails
 * @param {number} limit - How many to return (default 20)
 * @returns {Array} Array of email records
 */
function getRecentEmails(limit = 20) {
  const emails = readEmails();
  return emails.slice(0, limit);
}

/**
 * Get a single email by ID
 * @param {string} id
 * @returns {Object|null}
 */
function getEmailById(id) {
  const emails = readEmails();
  return emails.find((e) => e.id === id) || null;
}

/**
 * Find similar emails based on purpose (for quick reuse suggestions)
 * @param {string} purpose
 * @param {number} limit
 * @returns {Array}
 */
function findSimilarEmails(purpose, limit = 3) {
  const emails = readEmails();
  return emails.filter((e) => e.purpose === purpose).slice(0, limit);
}

/**
 * Update sent status of an email
 * @param {string} id
 * @param {boolean} sent
 */
function markAsSent(id, sent = true) {
  const emails = readEmails();
  const idx = emails.findIndex((e) => e.id === id);
  if (idx !== -1) {
    emails[idx].sent = sent;
    emails[idx].sentAt = new Date().toISOString();
    writeEmails(emails);
  }
}

/**
 * Delete an email by ID
 * @param {string} id
 * @returns {boolean} true if deleted
 */
function deleteEmail(id) {
  const emails = readEmails();
  const idx = emails.findIndex((e) => e.id === id);
  if (idx !== -1) {
    emails.splice(idx, 1);
    writeEmails(emails);
    return true;
  }
  return false;
}

/**
 * Clear all history
 */
function clearHistory() {
  writeEmails([]);
}

module.exports = {
  saveEmail,
  getRecentEmails,
  getEmailById,
  findSimilarEmails,
  markAsSent,
  deleteEmail,
  clearHistory,
};
