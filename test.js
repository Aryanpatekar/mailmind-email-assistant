/**
 * Verification test script — runs without API keys
 * Tests: intentAgent, toneAgent, memoryAgent, fallback templates
 */

const { parseIntent } = require('./agents/intentAgent');
const { getToneForReceiver, buildToneInstructions } = require('./agents/toneAgent');
const { getTemplate } = require('./utils/templates');
const { validateEmail, validateInput } = require('./utils/validate');
const { saveEmail, getRecentEmails, clearHistory } = require('./agents/memoryAgent');

let passed = 0;
let failed = 0;

function assert(label, condition, got) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label} — got: ${JSON.stringify(got)}`);
    failed++;
  }
}

// ── TEST 1: Intent Agent ─────────────────────────────────────────────────
console.log('\n[1] Intent Agent Tests');

const i1 = parseIntent('sick leave for 2 days due to fever, inform hr', 'hr@company.com');
assert('Purpose = leave_request', i1.purpose === 'leave_request', i1.purpose);
assert('Receiver = HR', i1.receiver === 'HR', i1.receiver);
assert('Tone = formal', i1.tone === 'formal', i1.tone);
assert('Has key points', i1.key_points.length > 0, i1.key_points);
assert('Duration extracted', i1.key_points.some(k => k.toLowerCase().includes('2')), i1.key_points);

const i2 = parseIntent('follow up on my job application from last week', '');
assert('Follow-up purpose', i2.purpose === 'follow_up', i2.purpose);
assert('Missing receiver_email', i2.missing_info.includes('receiver_email'), i2.missing_info);

const i3 = parseIntent('hey can we grab coffee tomorrow?', 'friend@gmail.com');
assert('Friendly tone', i3.tone === 'friendly', i3.tone);

const i4 = parseIntent('urgent: server is down, need immediate support', 'manager@company.com');
assert('Urgency = high', i4.urgency === 'high', i4.urgency);

// ── TEST 2: Tone Agent ───────────────────────────────────────────────────
console.log('\n[2] Tone Agent Tests');

assert('HR → formal', getToneForReceiver('HR') === 'formal', getToneForReceiver('HR'));
assert('Manager → polite', getToneForReceiver('Manager') === 'polite', getToneForReceiver('Manager'));
assert('Friend → friendly', getToneForReceiver('Friend') === 'friendly', getToneForReceiver('Friend'));
assert('Unknown → neutral', getToneForReceiver('Unknown') === 'neutral', getToneForReceiver('Unknown'));
assert('Override tone works', getToneForReceiver('HR', 'friendly') === 'friendly', getToneForReceiver('HR', 'friendly'));

const instr = buildToneInstructions('formal');
assert('Tone instructions non-empty', instr.length > 50, instr.length);

// ── TEST 3: Fallback Templates ───────────────────────────────────────────
console.log('\n[3] Template Tests');

const t1 = getTemplate('leave_request', 'formal', { key_points: ['2 days', 'fever'] });
assert('Leave/formal has subject', t1.subject.length > 0, t1.subject);
assert('Leave/formal has body', t1.body.length > 100, t1.body.length);

const t2 = getTemplate('meeting_request', 'polite', {});
assert('Meeting/polite template', t2.subject.length > 0, t2.subject);

const t3 = getTemplate('unknown_purpose_xyz', 'formal', {});
assert('Unknown purpose → general fallback', t3.subject.length > 0, t3.subject);

// ── TEST 4: Validation ───────────────────────────────────────────────────
console.log('\n[4] Validation Tests');

assert('Valid email passes', validateEmail('test@company.com').valid === true);
assert('Invalid email fails', validateEmail('not-an-email').valid === false);
assert('Empty email fails', validateEmail('').valid === false);
assert('Typo detected (gmial.com)', validateEmail('user@gmial.com').valid === false);
assert('Valid input passes', validateInput('sick leave for 2 days').valid === true);
assert('Empty input fails', validateInput('').valid === false);
assert('Short input fails', validateInput('ab').valid === false);

// ── TEST 5: Memory Agent ────────────────────────────────────────────────
console.log('\n[5] Memory Agent Tests');

clearHistory();
const saved = saveEmail({
  userInput: 'sick leave',
  subject: 'Leave Application',
  body: 'Dear HR...',
  tone: 'formal',
  receiver: 'HR',
  receiverEmail: 'hr@co.com',
  purpose: 'leave_request',
  sent: false,
});
assert('Save returns id', typeof saved.id === 'string' && saved.id.length > 0, saved.id);
assert('Save returns timestamp', !!saved.timestamp, saved.timestamp);

const recent = getRecentEmails(10);
assert('History has 1 record', recent.length === 1, recent.length);
assert('Saved record matches', recent[0].subject === 'Leave Application', recent[0].subject);

clearHistory();
const afterClear = getRecentEmails(10);
assert('Clear history works', afterClear.length === 0, afterClear.length);

// ── SUMMARY ──────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`  Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
  console.log('  ✅ ALL TESTS PASSED\n');
} else {
  console.log(`  ❌ ${failed} TEST(S) FAILED\n`);
  process.exit(1);
}
