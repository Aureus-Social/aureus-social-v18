// ═══════════════════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — ONSS REST API CLIENT
//  OAuth2 Client Credentials + JWT Client Assertion (RFC 7523)
//  Dimona REST v2 + DmfA Batch
//  Ref: https://www.rest-documentation.socialsecurity.be
//  Prestataire: AUREUS IA — BCE 1028.230.781
//  Identification: DGIII/MAHI011/1028.230.781 (26/02/2026)
// ═══════════════════════════════════════════════════════════════════

import crypto from 'crypto';

// ── Environment URLs ──
const ENVS = {
  simulation: {
    oauth: 'https://services.socialsecurity.be/REST/oauth/v5/token',
    dimona: 'https://services-sim.socialsecurity.be/REST/dimona/v2',
    dmfa: 'https://services-sim.socialsecurity.be/REST/dmfa/v1',
    label: 'Simulation (test)',
  },
  production: {
    oauth: 'https://services.socialsecurity.be/REST/oauth/v5/token',
    dimona: 'https://services.socialsecurity.be/REST/dimona/v2',
    dmfa: 'https://services.socialsecurity.be/REST/dmfa/v1',
    label: 'Production',
  },
};

// ── ONSS Enterprise Info ──
const AUREUS_ONSS = {
  enterpriseNumber: '1028230781', // BCE sans points
  name: 'AUREUS IA',
  identificationRef: 'DGIII/MAHI011/1028.230.781',
  identificationDate: '2026-02-26',
};

// ── Token Cache ──
let _tokenCache = { token: null, expiresAt: 0 };

/**
 * Get private key from environment
 * Supports: raw PEM string, base64-encoded PEM, or PEM without newlines
 */
function getPrivateKey() {
  let key = process.env.ONSS_PRIVATE_KEY;
  if (!key) return null;
  
  key = key.trim();
  
  // Case 1: Already a proper PEM with BEGIN marker
  if (key.startsWith('-----BEGIN')) {
    // Ensure newlines are present (Vercel might store as literal \n)
    key = key.replace(/\\n/g, '\n');
    return key;
  }
  
  // Case 2: Base64-encoded PEM file
  try {
    const decoded = Buffer.from(key, 'base64').toString('utf8');
    if (decoded.startsWith('-----BEGIN')) {
      return decoded;
    }
  } catch (e) { /* not valid base64 */ }
  
  // Case 3: Raw base64 key material (no PEM wrapper) — wrap it
  try {
    // Remove any whitespace
    const clean = key.replace(/\s/g, '');
    // Verify it's valid base64
    Buffer.from(clean, 'base64');
    // Wrap in PEM format (PKCS#8)
    const lines = clean.match(/.{1,64}/g) || [];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
  } catch (e) { /* not valid */ }
  
  return null;
}

/**
 * Generate JWT Client Assertion for OAuth2
 * Per RFC 7523 — signed with RSA private key (self-signed cert from Chaman)
 */
function generateJWTAssertion(clientId, audience, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  // Header
  const header = { alg: 'RS256', typ: 'JWT' };

  // Payload per RFC 7523 Section 2.2
  const payload = {
    iss: clientId,           // Client ID from Chaman
    sub: clientId,           // Same as issuer
    aud: audience,           // Token endpoint URL
    jti: jti,                // Unique token ID
    iat: now,                // Issued at
    exp: now + 300,          // Expires in 5 min (max allowed)
  };

  const encHeader = base64url(JSON.stringify(header));
  const encPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encHeader}.${encPayload}`;

  // Sign with RSA-SHA256
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKeyPem, 'base64url');

  return `${signingInput}.${signature}`;
}

function base64url(str) {
  return Buffer.from(str).toString('base64url');
}

/**
 * Get OAuth2 access token from Social Security OAuth server
 * Uses Client Credentials Grant with JWT Client Assertion
 */
async function getAccessToken(config) {
  const { clientId, privateKey: configKey, env = 'simulation', scope } = config;
  const urls = ENVS[env] || ENVS.simulation;

  // Check cache (token valid for 10 min, renew at 1 min before expiry)
  if (_tokenCache.token && Date.now() < _tokenCache.expiresAt - 60000) {
    return _tokenCache.token;
  }

  const pk = configKey || getPrivateKey();
  if (!pk) throw new Error('ONSS private key not found');

  const assertion = generateJWTAssertion(clientId, urls.oauth, pk);

  // Scope is OPTIONAL per ONSS docs — omit to use client's default scopes from Chaman
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: assertion,
  });

  const resp = await fetch(urls.oauth, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OAuth token error (${resp.status}): ${err} [URL: ${urls.oauth}] [ClientID: ${clientId?.substring(0,20)}...]`);
  }

  const data = await resp.json();
  _tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 600) * 1000,
  };

  return data.access_token;
}

// ═══════════════════════════════════════════════════════
//  DIMONA REST v2 CLIENT
// ═══════════════════════════════════════════════════════

/**
 * Submit a Dimona declaration (IN, OUT, UPDATE, CANCEL)
 * POST /declarations
 * Returns: { declarationId, location, status }
 */
async function submitDimona(config, declaration) {
  const token = await getAccessToken(config);
  const urls = ENVS[config.env || 'simulation'];

  const resp = await fetch(`${urls.dimona}/declarations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(declaration),
  });

  if (resp.status === 201) {
    const location = resp.headers.get('Location');
    const declarationId = location ? location.split('/').pop() : null;
    return {
      success: true,
      status: 201,
      declarationId,
      location,
      message: 'Déclaration réceptionnée par l\'ONSS',
    };
  }

  if (resp.status === 400) {
    const err = await resp.json().catch(() => ({}));
    return { success: false, status: 400, message: 'Paramètres invalides', errors: err };
  }

  if (resp.status === 403) {
    return { success: false, status: 403, message: 'Déclaration non autorisée pour cet employeur' };
  }

  if (resp.status === 500) {
    return { success: false, status: 500, message: 'Erreur technique ONSS — réessayez plus tard' };
  }

  const body = await resp.text();
  return { success: false, status: resp.status, message: body };
}

/**
 * Get Dimona declaration status (with retry mechanism)
 * GET /declarations/{declarationId}
 * Result codes: A (Accepted), W (Warning), R (Refused), S (Pending Sigedis)
 */
async function getDimonaStatus(config, declarationId) {
  const token = await getAccessToken(config);
  const urls = ENVS[config.env || 'simulation'];

  const resp = await fetch(`${urls.dimona}/declarations/${declarationId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (resp.status === 200) {
    const data = await resp.json();
    return {
      success: true,
      status: 200,
      result: data.result, // A, W, R, S
      declaration: data,
      periodId: data.periodId || null,
    };
  }

  if (resp.status === 404) {
    return { success: true, status: 404, result: 'PENDING', message: 'En cours de traitement' };
  }

  return { success: false, status: resp.status };
}

/**
 * Search Dimona declarations
 * POST /declarations/search
 */
async function searchDimona(config, searchParams) {
  const token = await getAccessToken(config);
  const urls = ENVS[config.env || 'simulation'];

  const resp = await fetch(`${urls.dimona}/declarations/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(searchParams),
  });

  if (resp.ok) {
    return { success: true, data: await resp.json() };
  }
  return { success: false, status: resp.status };
}

/**
 * Get Dimona period details
 * GET /periods/{periodId}
 */
async function getDimonaPeriod(config, periodId) {
  const token = await getAccessToken(config);
  const urls = ENVS[config.env || 'simulation'];

  const resp = await fetch(`${urls.dimona}/periods/${periodId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  if (resp.ok) {
    return { success: true, data: await resp.json() };
  }
  return { success: false, status: resp.status };
}

/**
 * Search Dimona periods
 * POST /periods/search
 */
async function searchPeriods(config, searchParams) {
  const token = await getAccessToken(config);
  const urls = ENVS[config.env || 'simulation'];

  const resp = await fetch(`${urls.dimona}/periods/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(searchParams),
  });

  if (resp.ok) {
    return { success: true, data: await resp.json() };
  }
  return { success: false, status: resp.status };
}

/**
 * Search employer-worker relations
 * POST /relations/search
 */
async function searchRelations(config, searchParams) {
  const token = await getAccessToken(config);
  const urls = ENVS[config.env || 'simulation'];

  const resp = await fetch(`${urls.dimona}/relations/search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(searchParams),
  });

  if (resp.ok) {
    return { success: true, data: await resp.json() };
  }
  return { success: false, status: resp.status };
}

// ═══════════════════════════════════════════════════════
//  DIMONA DECLARATION BUILDERS
//  Build JSON payloads conforming to ONSS REST v2 schema
// ═══════════════════════════════════════════════════════

/**
 * Build Dimona-IN declaration
 * @param {Object} employer - { noss, enterpriseNumber }
 * @param {Object} worker - { niss, firstName, lastName, birthDate, ... }
 * @param {Object} occupation - { startDate, jointCommissionNbr, workerType, ... }
 */
function buildDimonaIn(employer, worker, occupation) {
  const decl = {
    declarationType: 'IN',
    employer: {
      ...(employer.noss && { nossRegistrationNbr: employer.noss }),
      ...(employer.enterpriseNumber && { companyId: employer.enterpriseNumber }),
    },
    worker: {},
    dimonaIn: {
      startDate: occupation.startDate, // YYYY-MM-DD
      ...(occupation.plannedEndDate && { plannedEndDate: occupation.plannedEndDate }),
      jointCommissionNbr: occupation.jointCommissionNbr || '200', // CP 200 default
      workerType: occupation.workerType || 'OTH', // OTH, STU, FLX, IVT, ...
      ...(occupation.plannedHoursNbr && { plannedHoursNbr: occupation.plannedHoursNbr }),
    },
  };

  // Worker identification: NISS preferred, else MID-Data
  if (worker.niss) {
    decl.worker.socialSecurityId = worker.niss.replace(/[\s.-]/g, '');
  } else {
    decl.worker.midData = {
      lastName: worker.lastName || worker.ln || worker.last,
      firstName: worker.firstName || worker.fn || worker.first,
      birthDate: worker.birthDate || worker.dob,
      sex: worker.sex || (worker.gender === 'F' ? 'F' : 'M'),
      ...(worker.nationality && { nationality: worker.nationality }),
      ...(worker.birthPlace && { birthPlace: worker.birthPlace }),
      ...(worker.birthCountry && { birthCountry: worker.birthCountry }),
      address: {
        countryCode: worker.countryCode || 'BE',
        ...(worker.zipCode && { zipCode: worker.zipCode }),
        ...(worker.city && { cityName: worker.city }),
        ...(worker.street && { streetName: worker.street }),
        ...(worker.houseNbr && { houseNbr: worker.houseNbr }),
      },
    };
  }

  return decl;
}

/**
 * Build Dimona-OUT declaration
 */
function buildDimonaOut(employer, worker, endDate) {
  return {
    declarationType: 'OUT',
    employer: {
      ...(employer.noss && { nossRegistrationNbr: employer.noss }),
      ...(employer.enterpriseNumber && { companyId: employer.enterpriseNumber }),
    },
    worker: {
      ...(worker.niss && { socialSecurityId: worker.niss.replace(/[\s.-]/g, '') }),
    },
    dimonaOut: {
      endDate, // YYYY-MM-DD
    },
  };
}

/**
 * Build Dimona-UPDATE declaration (extend or shorten planned period)
 */
function buildDimonaUpdate(employer, worker, periodId, newEndDate) {
  return {
    declarationType: 'UPDATE',
    employer: {
      ...(employer.noss && { nossRegistrationNbr: employer.noss }),
      ...(employer.enterpriseNumber && { companyId: employer.enterpriseNumber }),
    },
    worker: {
      ...(worker.niss && { socialSecurityId: worker.niss.replace(/[\s.-]/g, '') }),
    },
    dimonaUpdate: {
      periodId,
      ...(newEndDate && { plannedEndDate: newEndDate }),
    },
  };
}

/**
 * Build Dimona-CANCEL declaration
 */
function buildDimonaCancel(employer, worker, periodId) {
  return {
    declarationType: 'CANCEL',
    employer: {
      ...(employer.noss && { nossRegistrationNbr: employer.noss }),
      ...(employer.enterpriseNumber && { companyId: employer.enterpriseNumber }),
    },
    worker: {
      ...(worker.niss && { socialSecurityId: worker.niss.replace(/[\s.-]/g, '') }),
    },
    dimonaCancel: { periodId },
  };
}

// ═══════════════════════════════════════════════════════
//  RETRY MECHANISM (per ONSS spec)
// ═══════════════════════════════════════════════════════

/**
 * Poll declaration status with ONSS-prescribed retry intervals
 * 0-2s: no calls | 2-30s: every 1s | 31s-20min: every 1min
 */
async function pollDimonaStatus(config, declarationId, onUpdate, maxAttempts = 30) {
  // Wait initial 2 seconds (ONSS spec: no calls before 2s)
  await sleep(2000);

  let attempts = 0;
  let elapsed = 2; // seconds

  while (attempts < maxAttempts) {
    const result = await getDimonaStatus(config, declarationId);

    if (onUpdate) onUpdate({ attempt: attempts + 1, elapsed, ...result });

    // Terminal states
    if (result.status === 200 && result.result) {
      return result;
    }

    attempts++;

    // Retry intervals per ONSS spec
    if (elapsed < 30) {
      await sleep(1000); // Every 1 second for first 30s
      elapsed += 1;
    } else {
      await sleep(60000); // Every 1 minute after 30s
      elapsed += 60;
    }
  }

  return { success: false, result: 'TIMEOUT', message: `Pas de réponse après ${maxAttempts} tentatives` };
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════

export {
  ENVS,
  AUREUS_ONSS,
  getAccessToken,
  getPrivateKey,
  submitDimona,
  getDimonaStatus,
  searchDimona,
  getDimonaPeriod,
  searchPeriods,
  searchRelations,
  buildDimonaIn,
  buildDimonaOut,
  buildDimonaUpdate,
  buildDimonaCancel,
  pollDimonaStatus,
};
