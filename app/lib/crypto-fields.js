// ═══ AUREUS SOCIAL PRO — Chiffrement données sensibles ═══
// AES-256-GCM pour NISS et IBAN
// Clé : ENCRYPTION_KEY (env var, min 32 chars)
// Usage: encryptField('85.04.23-123-45') → 'enc:iv:authTag:ciphertext'
// Usage: decryptField('enc:iv:authTag:ciphertext') → '85.04.23-123-45'

import crypto from 'crypto';

const ALGO = 'aes-256-gcm';
const KEY_LEN = 32;

function getKey() {
  const raw = process.env.ENCRYPTION_KEY || '';
  if (!raw) return null;
  // Dériver une clé 32 bytes depuis la variable env
  return crypto.scryptSync(raw, 'aureus-salt-2026', KEY_LEN);
}

/**
 * Chiffrer un champ sensible (NISS, IBAN)
 * @param {string} plaintext 
 * @returns {string} 'enc:iv_hex:tag_hex:cipher_hex' ou plaintext si erreur
 */
export function encryptField(plaintext) {
  if (!plaintext) return plaintext;
  if (plaintext.startsWith('enc:')) return plaintext; // Déjà chiffré
  try {
    const key = getKey();
    if (!key) return plaintext; // Pas de clé → stocker en clair avec warning
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  } catch {
    return plaintext;
  }
}

/**
 * Déchiffrer un champ
 * @param {string} value 
 * @returns {string} plaintext
 */
export function decryptField(value) {
  if (!value) return value;
  if (!value.startsWith('enc:')) return value; // Pas chiffré
  try {
    const key = getKey();
    if (!key) return value;
    const parts = value.split(':');
    if (parts.length !== 4) return value;
    const [, ivHex, tagHex, cipherHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return value; // Si erreur déchiffrement, retourner la valeur brute
  }
}

/**
 * Masquer partiellement pour affichage (NISS: 85.04.**-***-**)
 */
export function maskNISS(niss) {
  if (!niss) return '';
  const decrypted = decryptField(niss);
  if (decrypted.length < 6) return '***';
  return decrypted.slice(0, 5) + '.**-***-**';
}

export function maskIBAN(iban) {
  if (!iban) return '';
  const decrypted = decryptField(iban);
  if (decrypted.length < 8) return '***';
  return decrypted.slice(0, 4) + ' **** **** ' + decrypted.slice(-4);
}
