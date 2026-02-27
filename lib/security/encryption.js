/**
 * AUREUS SOCIAL PRO — ENCRYPTION MODULE
 * AES-256-GCM for sensitive data (NISS, IBAN, salaries)
 * 
 * Uses Web Crypto API (browser + Edge Runtime compatible)
 * Key derivation: PBKDF2 from environment secret
 * 
 * IMPORTANT: Set ENCRYPTION_KEY in Vercel env vars (min 32 chars)
 * Never commit the key to git!
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits for GCM
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;

// Convert string to ArrayBuffer
function str2ab(str) {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function ab2str(buf) {
  return new TextDecoder().decode(buf);
}

// Convert ArrayBuffer to hex
function ab2hex(buf) {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convert hex to ArrayBuffer
function hex2ab(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

// Derive AES-256 key from secret using PBKDF2
async function deriveKey(secret, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', str2ab(secret), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a string value with AES-256-GCM
 * Returns: hex string (salt:iv:ciphertext:tag)
 */
export async function encrypt(plaintext, secret) {
  if (!plaintext || !secret) return null;
  try {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(secret, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      str2ab(plaintext)
    );
    // Format: salt(hex):iv(hex):ciphertext(hex)
    return ab2hex(salt) + ':' + ab2hex(iv) + ':' + ab2hex(encrypted);
  } catch (e) {
    console.error('Encryption error:', e);
    return null;
  }
}

/**
 * Decrypt a previously encrypted string
 * Input: hex string (salt:iv:ciphertext)
 */
export async function decrypt(encryptedHex, secret) {
  if (!encryptedHex || !secret) return null;
  try {
    const parts = encryptedHex.split(':');
    if (parts.length !== 3) return null;
    const salt = new Uint8Array(hex2ab(parts[0]));
    const iv = new Uint8Array(hex2ab(parts[1]));
    const ciphertext = hex2ab(parts[2]);
    const key = await deriveKey(secret, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      ciphertext
    );
    return ab2str(decrypted);
  } catch (e) {
    console.error('Decryption error:', e);
    return null;
  }
}

/**
 * Mask a value for display (show only last N chars)
 * e.g. maskValue("85.07.15-123-45", 4) => "***********3-45"
 */
export function maskValue(value, showLast = 4) {
  if (!value || typeof value !== 'string') return '***';
  if (value.length <= showLast) return value;
  return '•'.repeat(value.length - showLast) + value.slice(-showLast);
}

/**
 * Check if a value is encrypted (hex format with colons)
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/.test(value);
}

/**
 * Encrypt sensitive employee fields
 * Returns new object with encrypted NISS, IBAN, salary
 */
export async function encryptEmployee(emp, secret) {
  const encrypted = { ...emp };
  if (emp.niss || emp.NISS) {
    encrypted._niss_enc = await encrypt(emp.niss || emp.NISS, secret);
    encrypted.niss = maskValue(emp.niss || emp.NISS, 4);
    encrypted.NISS = encrypted.niss;
  }
  if (emp.iban || emp.IBAN) {
    encrypted._iban_enc = await encrypt(emp.iban || emp.IBAN, secret);
    encrypted.iban = maskValue(emp.iban || emp.IBAN, 4);
    encrypted.IBAN = encrypted.iban;
  }
  if (emp.monthlySalary || emp.gross) {
    const sal = String(emp.monthlySalary || emp.gross);
    encrypted._salary_enc = await encrypt(sal, secret);
    // Keep numeric value for calculations, but mark as having encrypted backup
    encrypted._encrypted = true;
  }
  return encrypted;
}

/**
 * Decrypt sensitive employee fields
 */
export async function decryptEmployee(emp, secret) {
  const decrypted = { ...emp };
  if (emp._niss_enc) {
    const val = await decrypt(emp._niss_enc, secret);
    if (val) { decrypted.niss = val; decrypted.NISS = val; }
  }
  if (emp._iban_enc) {
    const val = await decrypt(emp._iban_enc, secret);
    if (val) { decrypted.iban = val; decrypted.IBAN = val; }
  }
  if (emp._salary_enc) {
    const val = await decrypt(emp._salary_enc, secret);
    if (val) { decrypted.monthlySalary = +val; decrypted.gross = +val; }
  }
  return decrypted;
}

export default { encrypt, decrypt, maskValue, isEncrypted, encryptEmployee, decryptEmployee };
