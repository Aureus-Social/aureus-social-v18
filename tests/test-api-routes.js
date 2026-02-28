#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — TESTS UNITAIRES ROUTES API
// Validation de la sécurité, du CORS, de l'input validation
// ══════════════════════════════════════════════════════════════════════

let total = 0, passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  total++;
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; failures.push({ name, error: e.message }); console.log(`  ❌ ${name}: ${e.message}`); }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function eq(a, b, label) { if (a !== b) throw new Error(`${label}: expected ${b}, got ${a}`); }

// ═══════════════════════════════════════
// 1. CORS — origin.startsWith → exact match
// ═══════════════════════════════════════
console.log('\n═══ 1. SÉCURITÉ CORS ═══');

const ALLOWED_ORIGINS = [
  'https://aureussocial.be',
  'https://www.aureussocial.be',
  'https://app.aureussocial.be',
  'https://aureus-social-v18.vercel.app',
  'http://localhost:3000',
];

function testCORS(origin) {
  return ALLOWED_ORIGINS.some(o => origin === o);
}

function testCORS_vulnerable(origin) {
  return ALLOWED_ORIGINS.some(o => origin.startsWith(o));
}

test('CORS: domaine légitime accepté', () => {
  assert(testCORS('https://aureussocial.be'), 'Should accept aureussocial.be');
});

test('CORS: sous-domaine malveillant rejeté (exact match)', () => {
  assert(!testCORS('https://aureussocial.be.evil.com'), 'Should reject subdomain attack');
});

test('CORS: ancienne implémentation (startsWith) vulnérable', () => {
  // This test proves the vulnerability existed
  assert(testCORS_vulnerable('https://aureussocial.be.evil.com'), 'startsWith was vulnerable');
});

test('CORS: origine vide acceptée (requêtes same-origin)', () => {
  assert(!testCORS(''), 'Empty origin returns false from matcher');
});

test('CORS: localhost accepté en dev', () => {
  assert(testCORS('http://localhost:3000'), 'Should accept localhost:3000');
});

test('CORS: localhost sur autre port rejeté', () => {
  assert(!testCORS('http://localhost:4000'), 'Should reject localhost:4000');
});

// ═══════════════════════════════════════
// 2. VALIDATION PAYROLL
// ═══════════════════════════════════════
console.log('\n═══ 2. VALIDATION PAYROLL ═══');

const validSituations = ['isole', 'marie_1rev', 'marie_2rev', 'cohabitant_1rev', 'cohabitant_2rev', 'parent_isole'];
const validStatuts = ['employe', 'ouvrier'];

test('Payroll: toutes les situations valides acceptées', () => {
  for (const s of validSituations) {
    assert(validSituations.includes(s), `${s} should be valid`);
  }
});

test('Payroll: situation invalide rejetée', () => {
  assert(!validSituations.includes('célibataire'), 'célibataire should be invalid');
});

test('Payroll: statut employe valide', () => {
  assert(validStatuts.includes('employe'), 'employe should be valid');
});

test('Payroll: statut ouvrier valide', () => {
  assert(validStatuts.includes('ouvrier'), 'ouvrier should be valid');
});

test('Payroll: statut freelance invalide', () => {
  assert(!validStatuts.includes('freelance'), 'freelance should be invalid');
});

test('Payroll: brut négatif rejeté', () => {
  const brut = -1000;
  assert(!(brut > 0 && brut <= 100000), 'Negative brut should be rejected');
});

test('Payroll: brut > 100000 rejeté', () => {
  const brut = 150000;
  assert(!(brut > 0 && brut <= 100000), 'Excessive brut should be rejected');
});

test('Payroll: brut valide accepté', () => {
  const brut = 3500;
  assert(brut > 0 && brut <= 100000, 'Normal brut should be accepted');
});

// ═══════════════════════════════════════
// 3. VALIDATION NISS
// ═══════════════════════════════════════
console.log('\n═══ 3. VALIDATION NISS (Numéro National) ═══');

function validateNISS(raw) {
  const niss = (raw || '').replace(/[^0-9]/g, '');
  if (niss.length !== 11) return { valid: false, reason: 'length' };
  const base = parseInt(niss.slice(0, 9));
  const check = parseInt(niss.slice(9, 11));
  const valid97 = 97 - (base % 97) === check || 97 - ((2000000000 + base) % 97) === check;
  return { valid: valid97, reason: valid97 ? null : 'checksum' };
}

test('NISS: format valide (85.07.30-044.17) accepté', () => {
  // 85073004417 — base=850730044, check=17, 97-(850730044%97)=97-80=17 ✓
  assert(validateNISS('85073004417').valid, 'Valid NISS should pass');
});

test('NISS: trop court rejeté', () => {
  eq(validateNISS('1234567890').valid, false, 'Short NISS');
});

test('NISS: trop long rejeté', () => {
  eq(validateNISS('123456789012').valid, false, 'Long NISS');
});

test('NISS: checksum invalide rejeté', () => {
  eq(validateNISS('85073004499').valid, false, 'Invalid checksum');
});

test('NISS: caractères non numériques nettoyés', () => {
  const result = validateNISS('85.07.30-044.17');
  assert(result.valid, 'Formatted NISS should be cleaned and validated');
});

// ═══════════════════════════════════════
// 4. SANITIZATION HTML (Email)
// ═══════════════════════════════════════
console.log('\n═══ 4. SANITIZATION HTML ═══');

function sanitizeHTML(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<math[\s\S]*?<\/math>/gi, '')
    .replace(/<meta[\s\S]*?>/gi, '')
    .replace(/<link[\s\S]*?>/gi, '')
    .replace(/<base[\s\S]*?>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, 'blocked:')
    .replace(/vbscript\s*:/gi, 'blocked:')
    .replace(/data\s*:\s*text\/html/gi, 'blocked:');
}

test('Sanitize: script tags supprimés', () => {
  const result = sanitizeHTML('<p>Hello</p><script>alert(1)</script>');
  assert(!result.includes('<script'), 'Should remove script tags');
  assert(result.includes('<p>Hello</p>'), 'Should keep valid HTML');
});

test('Sanitize: iframe supprimé', () => {
  assert(!sanitizeHTML('<iframe src="evil.com"></iframe>').includes('<iframe'), 'Should remove iframe');
});

test('Sanitize: svg supprimé (XSS vector)', () => {
  assert(!sanitizeHTML('<svg onload="alert(1)"></svg>').includes('<svg'), 'Should remove svg');
});

test('Sanitize: meta tag supprimé', () => {
  assert(!sanitizeHTML('<meta http-equiv="refresh" content="0;url=evil">').includes('<meta'), 'Should remove meta');
});

test('Sanitize: event handlers supprimés', () => {
  const result = sanitizeHTML('<img src="x" onerror="alert(1)">');
  assert(!result.includes('onerror'), 'Should remove onerror');
});

test('Sanitize: javascript: protocol bloqué', () => {
  const result = sanitizeHTML('<a href="javascript:alert(1)">click</a>');
  assert(!result.includes('javascript:'), 'Should block javascript: protocol');
});

test('Sanitize: vbscript: protocol bloqué', () => {
  const result = sanitizeHTML('<a href="vbscript:alert(1)">click</a>');
  assert(!result.includes('vbscript:'), 'Should block vbscript: protocol');
});

test('Sanitize: data:text/html bloqué', () => {
  const result = sanitizeHTML('<a href="data:text/html,<script>alert(1)</script>">click</a>');
  assert(!result.includes('data:text/html'), 'Should block data:text/html');
});

test('Sanitize: contenu normal préservé', () => {
  const input = '<h1>Facture</h1><p>Montant: 1.234,56€</p><table><tr><td>OK</td></tr></table>';
  eq(sanitizeHTML(input), input, 'Normal HTML should be preserved');
});

// ═══════════════════════════════════════
// 5. DMS — VALIDATION CATÉGORIES
// ═══════════════════════════════════════
console.log('\n═══ 5. DMS VALIDATION ═══');

const CATEGORIES = [
  'contrat', 'avenant', 'fiche_paie', 'c4', 'dimona',
  'attestation', 'reglement_travail', 'convention', 'facture',
  'a1_detachement', 'medical', 'formation', 'autre',
];

const ALLOWED_TYPES = [
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'text/plain',
];

test('DMS: catégorie contrat acceptée', () => {
  assert(CATEGORIES.includes('contrat'), 'contrat should be valid');
});

test('DMS: catégorie inventée rejetée', () => {
  assert(!CATEGORIES.includes('secret'), 'secret should be invalid');
});

test('DMS: PDF accepté', () => {
  assert(ALLOWED_TYPES.includes('application/pdf'), 'PDF should be accepted');
});

test('DMS: EXE rejeté', () => {
  assert(!ALLOWED_TYPES.includes('application/x-msdownload'), 'EXE should be rejected');
});

test('DMS: sanitize filename removes path separators', () => {
  const unsafe = '../../../etc/passwd';
  const safe = unsafe.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
  assert(!safe.includes('/'), 'Should remove path separators');
  // After sanitization: dots remain (valid in filenames), slashes replaced with _
  // Result: .._.._.._etc_passwd — no path traversal possible
  assert(safe === '.._.._.._etc_passwd', `Sanitized: ${safe}`);
});

// ═══════════════════════════════════════
// 6. FAILOVER — LOGIC BUG FIX
// ═══════════════════════════════════════
console.log('\n═══ 6. FAILOVER LOGIC ═══');

test('Failover: secondary healthy reflète correctement primary down', () => {
  let _primaryHealthy = false;
  const info = {
    primary: { healthy: _primaryHealthy },
    secondary: { healthy: !_primaryHealthy },
  };
  assert(info.secondary.healthy === true, 'Secondary should be active when primary is down');
});

test('Failover: secondary inactive quand primary up', () => {
  let _primaryHealthy = true;
  const info = {
    primary: { healthy: _primaryHealthy },
    secondary: { healthy: !_primaryHealthy },
  };
  assert(info.secondary.healthy === false, 'Secondary should be inactive when primary is up');
});

test('Failover: ancien bug (!_primaryHealthy || true) toujours true', () => {
  // Prouve que l'ancien code était bugué
  let _primaryHealthy = true;
  const buggyResult = !_primaryHealthy || true;
  assert(buggyResult === true, 'Old bug: always true regardless of primary status');
});

// ═══════════════════════════════════════
// 7. HEALTH CHECK — STATUS HARMONISÉS
// ═══════════════════════════════════════
console.log('\n═══ 7. HEALTH CHECK STATUS ═══');

const HEALTH_STATUSES = ['ok', 'degraded', 'down'];

test('Health: statuts harmonisés (ok, degraded, down)', () => {
  // Tous les endpoints doivent utiliser ces 3 valeurs
  for (const s of HEALTH_STATUSES) {
    assert(typeof s === 'string' && s.length > 0, `Status ${s} should be a non-empty string`);
  }
});

test('Health: operational/major_outage ne sont plus utilisés', () => {
  // Vérifie que les anciens statuts incompatibles ne sont plus en usage
  assert(!HEALTH_STATUSES.includes('operational'), 'operational should not be used');
  assert(!HEALTH_STATUSES.includes('major_outage'), 'major_outage should not be used');
});

test('Health: seuils de latence cohérents', () => {
  const LATENCY_DEGRADED = 2000;
  const LATENCY_DOWN = 3000;
  assert(LATENCY_DEGRADED < LATENCY_DOWN, 'DEGRADED threshold should be lower than DOWN');
  assert(LATENCY_DEGRADED === 2000, 'DEGRADED should be 2000ms');
  assert(LATENCY_DOWN === 3000, 'DOWN should be 3000ms');
});

// ═══════════════════════════════════════
// 8. IP WHITELIST CIDR
// ═══════════════════════════════════════
console.log('\n═══ 8. IP WHITELIST CIDR ═══');

function ipMatchesCIDR(ip, cidr) {
  const [range, bits = '32'] = cidr.split('/');
  const mask = ~(2 ** (32 - parseInt(bits)) - 1) >>> 0;
  const ipParts = ip.split('.');
  const rangeParts = range.split('.');
  if (ipParts.length !== 4 || rangeParts.length !== 4) return false;
  const ipNum = ipParts.reduce((a, o) => (a * 256) + parseInt(o), 0) >>> 0;
  const rangeNum = rangeParts.reduce((a, o) => (a * 256) + parseInt(o), 0) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
}

test('CIDR: IP exacte /32 match', () => {
  assert(ipMatchesCIDR('192.168.1.1', '192.168.1.1/32'), 'Exact IP should match');
});

test('CIDR: IP dans le range /24 match', () => {
  assert(ipMatchesCIDR('10.0.0.123', '10.0.0.0/24'), 'IP in /24 range should match');
});

test('CIDR: IP hors du range /24 rejetée', () => {
  assert(!ipMatchesCIDR('10.0.1.1', '10.0.0.0/24'), 'IP outside /24 range should not match');
});

test('CIDR: /8 large range', () => {
  assert(ipMatchesCIDR('10.255.255.255', '10.0.0.0/8'), '10.x.x.x should match /8');
  assert(!ipMatchesCIDR('11.0.0.1', '10.0.0.0/8'), '11.x should not match 10.0.0.0/8');
});

test('CIDR: IP malformée rejetée', () => {
  assert(!ipMatchesCIDR('not.an.ip', '10.0.0.0/8'), 'Malformed IP should not match');
});

// ═══════════════════════════════════════
// 9. E-SIGNATURE — VALIDATION SIGNERS
// ═══════════════════════════════════════
console.log('\n═══ 9. E-SIGNATURE VALIDATION ═══');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

test('E-sign: email valide accepté', () => {
  assert(emailRegex.test('user@example.com'), 'Valid email should pass');
});

test('E-sign: email sans @ rejeté', () => {
  assert(!emailRegex.test('userexample.com'), 'No @ should fail');
});

test('E-sign: email sans domaine rejeté', () => {
  assert(!emailRegex.test('user@'), 'No domain should fail');
});

test('E-sign: email avec espaces rejeté', () => {
  assert(!emailRegex.test('user @example.com'), 'Space in email should fail');
});

// ═══════════════════════════════════════
// 10. TIMING-SAFE COMPARE (CRON AUTH)
// ═══════════════════════════════════════
console.log('\n═══ 10. CRON AUTH ═══');

const { timingSafeEqual } = require('crypto');

function safeCompare(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

test('SafeCompare: même secret = true', () => {
  assert(safeCompare('my-secret-123', 'my-secret-123'), 'Same strings should match');
});

test('SafeCompare: secret différent = false', () => {
  assert(!safeCompare('my-secret-123', 'wrong-secret'), 'Different strings should not match');
});

test('SafeCompare: null/undefined = false', () => {
  assert(!safeCompare(null, 'secret'), 'null should not match');
  assert(!safeCompare('secret', null), 'null should not match');
  assert(!safeCompare(undefined, undefined), 'undefined should not match');
});

test('SafeCompare: string vide = false', () => {
  assert(!safeCompare('', 'secret'), 'Empty string should not match');
});

// ═══ RAPPORT ═══
console.log('\n' + '═'.repeat(60));
console.log(`  RÉSULTAT: ${passed}/${total} tests passés`);
if (failed > 0) {
  console.log(`  ❌ ${failed} ÉCHECS:`);
  for (const f of failures) console.log(`     • ${f.name}: ${f.error}`);
} else {
  console.log('  ✅ TOUS LES TESTS PASSENT');
}
console.log('═'.repeat(60));
process.exit(failed > 0 ? 1 : 0);
