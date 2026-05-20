#!/usr/bin/env node
/**
 * CommonGround Production Smoke Test
 *
 * Hits the live Railway backend and verifies that every tRPC endpoint
 * the mobile app calls returns the SHAPE that the mobile app expects.
 *
 * This is contract testing, not behavioral testing.
 * It runs against production data with a throwaway test user.
 *
 * Exit codes:
 *   0 = all contracts intact
 *   1 = contract drift detected (mobile will break)
 *   2 = backend unreachable (infrastructure issue)
 */

const API_URL = process.env.API_URL || 'https://cgo.anarchyxmayhem.com';
const TRPC = `${API_URL}/trpc`;

// Tracking
const results = [];
let userToken = null;
let userId = null;

const color = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

function log(msg) { console.log(msg); }
function pass(name, detail = '') {
  results.push({ name, status: 'pass', detail });
  log(`  ${color.green('✓')} ${name}${detail ? color.dim(` — ${detail}`) : ''}`);
}
function fail(name, reason) {
  results.push({ name, status: 'fail', reason });
  log(`  ${color.red('✗')} ${name}`);
  log(`    ${color.red(reason)}`);
}
function info(msg) { log(color.dim(`  ${msg}`)); }
function header(msg) { log(`\n${color.bold(color.cyan(msg))}`); }

async function trpcCall(endpoint, input, opts = {}) {
  const isMutation = opts.method === 'POST';
  const url = isMutation
    ? `${TRPC}/${endpoint}`
    : `${TRPC}/${endpoint}?input=${encodeURIComponent(JSON.stringify(input))}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(userToken && { Authorization: `Bearer ${userToken}` }),
    ...(opts.headers || {}),
  };

  const res = await fetch(url, {
    method: opts.method || 'GET',
    headers,
    ...(isMutation && input !== undefined ? { body: JSON.stringify(input) } : {}),
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); }
  catch { data = { raw: text }; }

  return { status: res.status, data };
}

function expectField(obj, field, type) {
  if (obj === null || obj === undefined) return `expected object, got ${obj}`;
  if (!(field in obj)) return `missing field: ${field}`;
  if (type === 'any') return null;
  const actual = typeof obj[field];
  if (type === 'array') {
    if (!Array.isArray(obj[field])) return `field ${field}: expected array, got ${actual}`;
    return null;
  }
  if (actual !== type) return `field ${field}: expected ${type}, got ${actual}`;
  return null;
}

function unwrap(data) {
  // tRPC wraps responses in { result: { data: { json: ... } } } with superjson
  return data?.result?.data?.json ?? data?.result?.data ?? data;
}

// =========================================================
// TEST: Server is alive
// =========================================================
async function testHealth() {
  header('1. Infrastructure');
  try {
    const res = await fetch(API_URL, { method: 'GET' });
    if (res.status === 200 || res.status === 404) {
      pass('Server reachable', `HTTP ${res.status}`);
    } else {
      fail('Server reachable', `HTTP ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    fail('Server reachable', `Cannot connect: ${err.message}`);
    return false;
  }
}

// =========================================================
// TEST: Auth flow (signup → token)
// =========================================================
async function testAuth() {
  header('2. Auth contract');

  // Use timestamped email so each run is isolated
  const testEmail = `smoke-${Date.now()}@axm-test.local`;
  const testPassword = 'SmokeTest123!';
  const testName = 'Smoke Test';

  // Signup
  const signupRes = await trpcCall('auth.signup',
    { email: testEmail, password: testPassword, name: testName },
    { method: 'POST' }
  );

  if (signupRes.status !== 200) {
    fail('auth.signup', `HTTP ${signupRes.status}: ${JSON.stringify(signupRes.data).slice(0, 200)}`);
    return false;
  }

  const signupBody = unwrap(signupRes.data);
  const tokenErr = expectField(signupBody, 'token', 'string');
  const idErr = expectField(signupBody, 'userId', 'string');

  if (tokenErr || idErr) {
    fail('auth.signup shape', tokenErr || idErr);
    return false;
  }

  pass('auth.signup', `returns { token, userId, email }`);
  userToken = signupBody.token;
  userId = signupBody.userId;

  // Login with same credentials
  const loginRes = await trpcCall('auth.login',
    { email: testEmail, password: testPassword },
    { method: 'POST' }
  );

  if (loginRes.status !== 200) {
    fail('auth.login', `HTTP ${loginRes.status}`);
    return false;
  }

  const loginBody = unwrap(loginRes.data);
  const loginErr = expectField(loginBody, 'token', 'string');
  if (loginErr) {
    fail('auth.login shape', loginErr);
    return false;
  }
  pass('auth.login', `returns { token }`);

  return true;
}

// =========================================================
// TEST: Pair lifecycle (mobile dashboard depends on this)
// =========================================================
async function testPairs() {
  header('3. Pair contract');

  // getMyPair when no pair exists — should return null
  const myPairRes = await trpcCall('pairs.getMyPair', undefined);

  if (myPairRes.status !== 200) {
    fail('pairs.getMyPair', `HTTP ${myPairRes.status}`);
    return false;
  }

  const myPairBody = unwrap(myPairRes.data);
  if (myPairBody !== null) {
    // If a pair exists, verify shape
    const statusErr = expectField(myPairBody, 'status', 'string');
    const stateErr = expectField(myPairBody, 'relationalState', 'string');
    if (statusErr || stateErr) {
      fail('pairs.getMyPair shape (when pair exists)', statusErr || stateErr);
      return false;
    }
    // Verify status uses canonical uppercase
    if (!['ACTIVE', 'PENDING', 'DISSOLVED'].includes(myPairBody.status)) {
      fail('pairs.getMyPair status value',
        `Expected ACTIVE/PENDING/DISSOLVED, got "${myPairBody.status}"`);
      return false;
    }
    pass('pairs.getMyPair', `status="${myPairBody.status}" relationalState="${myPairBody.relationalState}"`);
  } else {
    pass('pairs.getMyPair', 'returns null when no pair (expected)');
  }

  // createInvite
  const inviteRes = await trpcCall('pairs.createInvite', undefined, { method: 'POST' });

  if (inviteRes.status !== 200) {
    fail('pairs.createInvite', `HTTP ${inviteRes.status}`);
    return false;
  }

  const inviteBody = unwrap(inviteRes.data);
  const codeErr = expectField(inviteBody, 'inviteCode', 'string');
  if (codeErr) {
    fail('pairs.createInvite shape', codeErr);
    return false;
  }

  if (inviteBody.inviteCode.length < 4 || inviteBody.inviteCode.length > 32) {
    fail('pairs.createInvite code format',
      `Expected 4-32 chars, got ${inviteBody.inviteCode.length}`);
    return false;
  }

  pass('pairs.createInvite', `code="${inviteBody.inviteCode}" (${inviteBody.inviteCode.length} chars)`);

  return true;
}

// =========================================================
// TEST: Bently coachSolo (the heart of the mobile app)
// =========================================================
async function testBently() {
  header('4. Bently contract');

  const res = await trpcCall('bently.coachSolo',
    {
      message: 'This is a smoke test. Please respond with a short acknowledgment.',
      provider: 'groq',
    },
    { method: 'POST' }
  );

  if (res.status !== 200) {
    fail('bently.coachSolo', `HTTP ${res.status}: ${JSON.stringify(res.data).slice(0, 200)}`);
    return false;
  }

  const body = unwrap(res.data);
  const responseErr = expectField(body, 'response', 'string');
  const providerErr = expectField(body, 'provider', 'string');

  if (responseErr || providerErr) {
    fail('bently.coachSolo shape', responseErr || providerErr);
    return false;
  }

  if (body.response.length < 5) {
    fail('bently.coachSolo content', `Response too short: "${body.response}"`);
    return false;
  }

  pass('bently.coachSolo', `provider="${body.provider}" length=${body.response.length}`);
  info(`Sample: "${body.response.slice(0, 80)}..."`);

  return true;
}

// =========================================================
// MAIN
// =========================================================
async function main() {
  log(color.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  log(color.bold('  CommonGround — Production Contract Smoke Test'));
  log(color.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  log(color.dim(`  Target: ${API_URL}`));
  log(color.dim(`  Time:   ${new Date().toISOString()}`));

  const healthy = await testHealth();
  if (!healthy) {
    log(color.red('\n❌ Backend unreachable. Aborting further tests.\n'));
    process.exit(2);
  }

  await testAuth();
  if (!userToken) {
    log(color.red('\n❌ Auth failed. Cannot test authenticated endpoints.\n'));
    summarize();
    process.exit(1);
  }

  await testPairs();
  await testBently();

  summarize();
}

function summarize() {
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;

  log(color.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  log(`  ${color.green(`✓ ${passed} passed`)}    ${failed > 0 ? color.red(`✗ ${failed} failed`) : ''}`);
  log(color.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  if (failed > 0) {
    log(color.red(color.bold('CONTRACT DRIFT DETECTED.')));
    log(color.red('The mobile app may be broken in production.\n'));
    log('Failed checks:');
    results.filter(r => r.status === 'fail').forEach(r => {
      log(`  ${color.red('✗')} ${r.name}`);
      log(`    ${color.dim(r.reason)}`);
    });
    log('');
    process.exit(1);
  }

  log(color.green(color.bold('All contracts intact. Mobile app should work.\n')));
  process.exit(0);
}

main().catch(err => {
  log(color.red(`\nFATAL: ${err.message}`));
  log(color.dim(err.stack));
  process.exit(2);
});
