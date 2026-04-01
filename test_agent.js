const { provideBackupTemplate } = require('./agents/templateAgent');

async function test() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('  Backup Email Template Provider Agent');
  console.log('  Unit Tests');
  console.log('╚══════════════════════════════════════════════╝\n');

  let passed = 0; let failed = 0;
  function assert(label, condition, got) {
    if (condition) { console.log(`  ✓ ${label}`); passed++; }
    else { console.log(`  ✗ ${label} — got: ${JSON.stringify(got)}`); failed++; }
  }

  // ── Test 1: Placeholder replacement ──────────────────────────────────────
  console.log('[1] Placeholder replacement (Polite Meeting Request)');
  const res1 = provideBackupTemplate('meeting_request', 'polite', {
    receiver: 'John Doe',
    key_points: ['the Q3 marketing budget', 'hiring plans']
  });

  assert('Returns subject', typeof res1.subject === 'string', res1.subject);
  assert('Returns template_email', typeof res1.template_email === 'string', typeof res1.template_email);
  assert('Replaced [Name] with receiver', res1.template_email.includes('Dear John Doe'), res1.template_email);
  assert('Replaced [topic] with key points', res1.template_email.includes('the Q3 marketing budget and hiring plans'), res1.template_email);


  // ── Test 2: Fallback when unknown ────────────────────────────────────────
  console.log('\n[2] Unknown Receiver & Generic Intent');
  const res2 = provideBackupTemplate('leave_request', 'formal', {
    receiver: 'Unknown',
    key_points: []
  });

  assert('Does not say "Dear Unknown"', !res2.template_email.includes('Dear Unknown'), res2.template_email);
  assert('Defaults to "Sir/Madam" or Generic', res2.template_email.includes('Dear Sir/Madam,') || res2.template_email.includes('Colleague'), res2.template_email);

  
  console.log('\n' + '─'.repeat(50));
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log(failed === 0 ? '  ✅ ALL TESTS PASSED\n' : `  ❌ ${failed} FAILED\n`);
}

test().catch(console.error);
