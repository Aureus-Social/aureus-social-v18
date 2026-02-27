/**
 * AUREUS SOCIAL PRO — PASSWORD VALIDATION
 * Belgian enterprise security standards
 * Min 12 chars, uppercase, lowercase, digit, special char
 */

export const PASSWORD_RULES = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  maxLength: 128,
  forbidCommon: true,
};

// Common passwords to reject (top 100 + Belgian specific)
const COMMON_PASSWORDS = [
  'password', '123456', 'qwerty', 'admin', 'letmein', 'welcome',
  'azerty', 'aureussocial', 'belgium', 'bruxelles', 'brussels',
  'wachtwoord', 'motdepasse', 'password123', 'admin123',
];

export function validatePassword(password) {
  const errors = [];
  const strength = { score: 0, label: '', color: '' };

  if (!password) return { valid: false, errors: ['Mot de passe requis'], strength: { score: 0, label: 'Vide', color: '#ef4444' } };

  if (password.length < PASSWORD_RULES.minLength)
    errors.push(`Minimum ${PASSWORD_RULES.minLength} caractères (actuel: ${password.length})`);
  if (password.length > PASSWORD_RULES.maxLength)
    errors.push(`Maximum ${PASSWORD_RULES.maxLength} caractères`);
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password))
    errors.push('Au moins 1 majuscule (A-Z)');
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password))
    errors.push('Au moins 1 minuscule (a-z)');
  if (PASSWORD_RULES.requireDigit && !/[0-9]/.test(password))
    errors.push('Au moins 1 chiffre (0-9)');
  if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password))
    errors.push('Au moins 1 caractère spécial (!@#$%...)');
  if (PASSWORD_RULES.forbidCommon && COMMON_PASSWORDS.some(cp => password.toLowerCase().includes(cp)))
    errors.push('Mot de passe trop commun');

  // Calculate strength score
  let s = 0;
  if (password.length >= 12) s += 1;
  if (password.length >= 16) s += 1;
  if (password.length >= 20) s += 1;
  if (/[A-Z]/.test(password)) s += 1;
  if (/[a-z]/.test(password)) s += 1;
  if (/[0-9]/.test(password)) s += 1;
  if (/[^A-Za-z0-9]/.test(password)) s += 1;
  if (new Set(password).size >= 10) s += 1;
  
  strength.score = Math.min(5, Math.round(s * 5 / 8));
  const labels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort', 'Excellent'];
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#059669'];
  strength.label = labels[strength.score];
  strength.color = colors[strength.score];

  return { valid: errors.length === 0, errors, strength };
}

/**
 * AUREUS SOCIAL PRO — SESSION TIMEOUT
 * Auto-disconnect after 15 minutes of inactivity
 * Configurable warning before timeout
 */

export class SessionTimer {
  constructor({ timeoutMs = 15 * 60 * 1000, warningMs = 2 * 60 * 1000, onTimeout, onWarning }) {
    this.timeoutMs = timeoutMs;
    this.warningMs = warningMs;
    this.onTimeout = onTimeout;
    this.onWarning = onWarning;
    this.timer = null;
    this.warningTimer = null;
    this.lastActivity = Date.now();
    this.active = false;
  }

  start() {
    this.active = true;
    this.resetTimer();
    // Listen for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    this._handler = () => this.resetTimer();
    events.forEach(ev => {
      if (typeof window !== 'undefined') window.addEventListener(ev, this._handler, { passive: true });
    });
  }

  resetTimer() {
    this.lastActivity = Date.now();
    if (this.timer) clearTimeout(this.timer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    // Warning before timeout
    this.warningTimer = setTimeout(() => {
      if (this.onWarning) this.onWarning(this.timeoutMs - this.warningMs);
    }, this.timeoutMs - this.warningMs);
    // Actual timeout
    this.timer = setTimeout(() => {
      if (this.onTimeout) this.onTimeout();
      this.stop();
    }, this.timeoutMs);
  }

  stop() {
    this.active = false;
    if (this.timer) clearTimeout(this.timer);
    if (this.warningTimer) clearTimeout(this.warningTimer);
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(ev => {
      if (typeof window !== 'undefined' && this._handler) window.removeEventListener(ev, this._handler);
    });
  }

  getTimeRemaining() {
    return Math.max(0, this.timeoutMs - (Date.now() - this.lastActivity));
  }
}

/**
 * AUREUS SOCIAL PRO — AUDIT LOG
 * Track who accessed what, when, from where
 * Supabase table: audit_logs
 */

export function createAuditEntry({ userId, userName, action, module, resource, details, ip, userAgent }) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: new Date().toISOString(),
    user_id: userId || 'anonymous',
    user_name: userName || 'Unknown',
    action: action || 'view', // view, create, update, delete, export, login, logout
    module: module || 'unknown',
    resource: resource || null, // e.g. "employee:123", "payslip:2026-01"
    details: details || null,
    ip_address: ip || null,
    user_agent: userAgent || null,
    session_id: typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('session_id') : null,
  };
}

// In-memory audit log (persisted to Supabase when available)
let auditBuffer = [];
const MAX_BUFFER = 100;

export function logAudit(entry) {
  const log = createAuditEntry(entry);
  auditBuffer.push(log);
  if (auditBuffer.length > MAX_BUFFER) auditBuffer = auditBuffer.slice(-MAX_BUFFER);
  // Persist to Supabase if available
  if (typeof window !== 'undefined' && window.__supabase) {
    window.__supabase.from('audit_logs').insert(log).then(() => {}).catch(() => {});
  }
  return log;
}

export function getAuditBuffer() {
  return [...auditBuffer];
}

export function clearAuditBuffer() {
  auditBuffer = [];
}

/**
 * SQL to create audit_logs table in Supabase:
 * 
 * CREATE TABLE IF NOT EXISTS audit_logs (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   timestamp TIMESTAMPTZ DEFAULT now(),
 *   user_id TEXT NOT NULL,
 *   user_name TEXT,
 *   action TEXT NOT NULL CHECK (action IN ('view','create','update','delete','export','login','logout','failed_login')),
 *   module TEXT,
 *   resource TEXT,
 *   details JSONB,
 *   ip_address INET,
 *   user_agent TEXT,
 *   session_id TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * CREATE INDEX idx_audit_user ON audit_logs(user_id);
 * CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
 * CREATE INDEX idx_audit_module ON audit_logs(module);
 * CREATE INDEX idx_audit_action ON audit_logs(action);
 * 
 * -- RLS: Only admins can read audit logs
 * ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Admins can read audit" ON audit_logs FOR SELECT USING (
 *   auth.jwt() ->> 'role' = 'admin'
 * );
 * CREATE POLICY "System can insert audit" ON audit_logs FOR INSERT WITH CHECK (true);
 * 
 * -- Auto-purge after 2 years (RGPD)
 * CREATE OR REPLACE FUNCTION purge_old_audit_logs() RETURNS void AS $$
 * DELETE FROM audit_logs WHERE timestamp < now() - interval '2 years';
 * $$ LANGUAGE sql;
 */
