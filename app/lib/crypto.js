// ═══ AUREUS SOCIAL PRO — Module: Chiffrement AES-256-GCM (RGPD Art. 32) ═══
const CRYPTO_SALT = 'AureusSocialPro-2026-RGPD';
const SENSITIVE_FIELDS = ['niss', 'NISS', 'iban', 'IBAN'];
let _cryptoKey = null;

export function getCryptoKey() { return _cryptoKey; }

export async function deriveKey(userId) {
  if (!userId || typeof crypto === 'undefined' || !crypto.subtle) return null;
  try {
    const enc = new TextEncoder();
    const km = await crypto.subtle.importKey('raw', enc.encode(userId + CRYPTO_SALT), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode(CRYPTO_SALT), iterations: 100000, hash: 'SHA-256' },
      km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  } catch (e) { return null; }
}

export async function encryptField(plaintext, key) {
  if (!plaintext || !key) return plaintext;
  try {
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext));
    return 'ENC:' + btoa(String.fromCharCode(...iv)) + ':' + btoa(String.fromCharCode(...new Uint8Array(ct)));
  } catch (e) { return plaintext; }
}

export async function decryptField(ciphertext, key) {
  if (!ciphertext || !key || typeof ciphertext !== 'string' || !ciphertext.startsWith('ENC:')) return ciphertext;
  try {
    const p = ciphertext.split(':');
    if (p.length !== 3) return ciphertext;
    const iv = Uint8Array.from(atob(p[1]), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(p[2]), c => c.charCodeAt(0));
    return new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct));
  } catch (e) { return ciphertext; }
}

async function processEmps(emp, key, encrypt) {
  if (!key || !emp) return emp;
  const copy = { ...emp };
  for (const f of SENSITIVE_FIELDS) {
    if (copy[f] && typeof copy[f] === 'string') {
      if (encrypt && !copy[f].startsWith('ENC:')) copy[f] = await encryptField(copy[f], key);
      else if (!encrypt && copy[f].startsWith('ENC:')) copy[f] = await decryptField(copy[f], key);
    }
  }
  return copy;
}

async function processState(state, key, encrypt) {
  if (!key || !state) return state;
  const copy = JSON.parse(JSON.stringify(state));
  if (copy.clients && Array.isArray(copy.clients)) {
    for (let c = 0; c < copy.clients.length; c++) {
      if (copy.clients[c].emps && Array.isArray(copy.clients[c].emps)) {
        for (let e = 0; e < copy.clients[c].emps.length; e++) {
          copy.clients[c].emps[e] = await processEmps(copy.clients[c].emps[e], key, encrypt);
        }
      }
      if (copy.clients[c].company?.bank) {
        const b = copy.clients[c].company.bank;
        if (typeof b === 'string') {
          if (encrypt && !b.startsWith('ENC:')) copy.clients[c].company.bank = await encryptField(b, key);
          else if (!encrypt && b.startsWith('ENC:')) copy.clients[c].company.bank = await decryptField(b, key);
        }
      }
    }
  }
  if (copy.emps && Array.isArray(copy.emps)) {
    for (let e = 0; e < copy.emps.length; e++) {
      copy.emps[e] = await processEmps(copy.emps[e], key, encrypt);
    }
  }
  return copy;
}

export async function encryptState(state, key) { return processState(state, key, true); }
export async function decryptState(state, key) { return processState(state, key, false); }

export async function initCryptoKey(userId) {
  _cryptoKey = await deriveKey(userId);
  return !!_cryptoKey;
}
