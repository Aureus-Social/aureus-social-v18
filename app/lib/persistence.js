// ═══ AUREUS SOCIAL PRO — Module: Persistence (Supabase + localStorage) ═══
import { getCryptoKey, encryptState, decryptState, initCryptoKey } from './crypto.js';

const STORE_KEY = 'aureus-social-pro';
const MAX_RETRIES = 3;

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
    const json = JSON.stringify(data);
    localStorage.setItem(STORE_KEY, json);
    localStorage.setItem(STORE_KEY + '_backup', json);
    localStorage.setItem(STORE_KEY + '_ts', new Date().toISOString());
  } catch (e) {
    try { localStorage.removeItem(STORE_KEY + '_backup'); localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e2) {}
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
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    if (_supabaseRef && _userIdRef) {
      await saveToSupabase(_supabaseRef, _userIdRef, data);
    }
  } catch(e) {}
}

export function loadFromLocalStorage() {
  try {
    const json = localStorage.getItem(STORE_KEY);
    return json ? JSON.parse(json) : null;
  } catch(e) { return null; }
}

export { STORE_KEY };
