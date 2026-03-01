// ═══ AUREUS SOCIAL PRO — Module: Persistence (Supabase + localStorage) ═══
import { getCryptoKey, encryptState, decryptState, initCryptoKey, encryptField, decryptField } from './crypto.js';

const STORE_KEY = 'aureus-social-pro';
const MAX_RETRIES = 3;

// ═══ CHIFFREMENT localStorage (RGPD — données sensibles ne doivent pas être en clair) ═══
async function encryptForLocalStorage(data) {
  try {
    const key = getCryptoKey();
    if (!key) return JSON.stringify(data);
    const json = JSON.stringify(data);
    const encrypted = await encryptField(json, key);
    return encrypted || json;
  } catch (e) {
    console.warn('[Persistence] Chiffrement localStorage échoué, sauvegarde en clair');
    return JSON.stringify(data);
  }
}

async function decryptFromLocalStorage(stored) {
  try {
    if (!stored) return null;
    // Si les données commencent par ENC:, elles sont chiffrées
    if (stored.startsWith('ENC:')) {
      const key = getCryptoKey();
      if (!key) return null;
      const decrypted = await decryptField(stored, key);
      if (decrypted && decrypted !== stored) return JSON.parse(decrypted);
      return null;
    }
    // Données legacy en clair (JSON)
    return JSON.parse(stored);
  } catch (e) {
    return null;
  }
}

let _supabaseRef = null;
let _userIdRef = null;
let _saveQueue = null;
let _saveTimer = null;
let _lastSaveTime = 0;
let _saveStatus = 'idle';
let _statusCallback = null;

export function getSupabaseRef() { return _supabaseRef; }
export function getUserIdRef() { return _userIdRef; }

function _notifyStatus(status) {
  _saveStatus = status;
  if (_statusCallback) _statusCallback(status);
}

export function onSaveStatus(cb) { _statusCallback = cb; }

export function setSupabaseRefs(sb, uid) {
  _supabaseRef = sb;
  _userIdRef = uid;
  if (uid) initCryptoKey(uid);
}

export async function saveToSupabase(supabase, userId, data) {
  if (!supabase || !userId) return false;
  try {
    const key = getCryptoKey();
    const encData = key ? await encryptState(data, key) : data;
    const { error } = await supabase.from('app_state').upsert({
      user_id: userId, state_key: 'main', state_data: encData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,state_key' });
    return !error;
  } catch(e) { return false; }
}

export async function loadFromSupabase(supabase, userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase.from('app_state')
      .select('state_data').eq('user_id', userId).eq('state_key', 'main').maybeSingle();
    if (error || !data) return null;
    const key = getCryptoKey();
    return key ? await decryptState(data.state_data, key) : data.state_data;
  } catch(e) { return null; }
}

export function scheduleSave(data) {
  _saveQueue = data;
  if (_saveTimer) clearTimeout(_saveTimer);
  const elapsed = Date.now() - _lastSaveTime;
  const delay = elapsed < 2000 ? 2000 : 500;
  _saveTimer = setTimeout(() => _executeSave(), delay);
}

async function _executeSave() {
  const data = _saveQueue;
  if (!data) return;
  _saveQueue = null;
  _notifyStatus('saving');
  try {
    const encrypted = await encryptForLocalStorage(data);
    localStorage.setItem(STORE_KEY, encrypted);
    localStorage.setItem(STORE_KEY + '_backup', encrypted);
    localStorage.setItem(STORE_KEY + '_ts', new Date().toISOString());
  } catch (e) {
    try { localStorage.removeItem(STORE_KEY + '_backup'); localStorage.setItem(STORE_KEY, await encryptForLocalStorage(data)); } catch (e2) {}
  }
  if (_supabaseRef && _userIdRef) {
    let success = false;
    for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
      success = await saveToSupabase(_supabaseRef, _userIdRef, data);
      if (!success && attempt < MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
    _notifyStatus(success ? 'saved' : 'error');
  } else {
    _notifyStatus('saved');
  }
  _lastSaveTime = Date.now();
  setTimeout(() => { if (_saveStatus === 'saved') _notifyStatus('idle'); }, 3000);
}

export async function forceSave(data) {
  if (typeof window === 'undefined') return;
  try {
    const encrypted = await encryptForLocalStorage(data);
    localStorage.setItem(STORE_KEY, encrypted);
    localStorage.setItem(STORE_KEY + '_backup', encrypted);
    if (_supabaseRef && _userIdRef) {
      await saveToSupabase(_supabaseRef, _userIdRef, data);
    }
  } catch(e) {}
}

export async function loadFromLocalStorage() {
  try {
    const stored = localStorage.getItem(STORE_KEY);
    if (!stored) return null;
    const data = await decryptFromLocalStorage(stored);
    if (data) return data;
    // Essayer le backup
    const backup = localStorage.getItem(STORE_KEY + '_backup');
    if (backup) return await decryptFromLocalStorage(backup);
    return null;
  } catch(e) { return null; }
}

export { STORE_KEY };
