-- ════════════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — SECURITY MIGRATION
-- Audit logs + RGPD auto-purge + RLS
-- ════════════════════════════════════════════════════════════

-- 1. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('view','create','update','delete','export','login','logout','failed_login')),
  module TEXT,
  resource TEXT,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON audit_logs(ip_address);

-- RLS: Only admins can read audit logs, system can insert
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
    OR auth.uid()::text IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- 2. Auto-purge old audit logs (RGPD — 2 years retention)
CREATE OR REPLACE FUNCTION purge_old_audit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM audit_logs WHERE timestamp < now() - interval '2 years';
$$;

-- Schedule daily purge (run via Supabase cron or pg_cron)
-- SELECT cron.schedule('purge-audit-logs', '0 3 * * *', 'SELECT purge_old_audit_logs()');

-- 3. Login attempts tracking (brute force server-side)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  email TEXT,
  success BOOLEAN DEFAULT false,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  user_agent TEXT,
  blocked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_login_ip ON login_attempts(ip_address, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_email ON login_attempts(email, attempted_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System can manage login attempts" ON login_attempts
  FOR ALL WITH CHECK (true);

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION is_ip_blocked(check_ip TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM login_attempts
    WHERE ip_address = check_ip
      AND blocked_until > now()
    LIMIT 1
  );
$$;

-- Function to record login attempt and auto-block after 5 failures
CREATE OR REPLACE FUNCTION record_login_attempt(
  p_ip TEXT,
  p_email TEXT,
  p_success BOOLEAN,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recent_failures INT;
  is_blocked BOOLEAN;
  block_until TIMESTAMPTZ;
BEGIN
  -- Check if already blocked
  SELECT EXISTS (
    SELECT 1 FROM login_attempts
    WHERE ip_address = p_ip AND blocked_until > now()
  ) INTO is_blocked;
  
  IF is_blocked THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'IP blocked');
  END IF;

  -- Count recent failures (last 15 minutes)
  SELECT COUNT(*) INTO recent_failures
  FROM login_attempts
  WHERE ip_address = p_ip
    AND success = false
    AND attempted_at > now() - interval '15 minutes';

  -- Block after 5 failures
  IF NOT p_success AND recent_failures >= 4 THEN
    block_until := now() + interval '30 minutes';
  END IF;

  -- Insert attempt
  INSERT INTO login_attempts (ip_address, email, success, user_agent, blocked_until)
  VALUES (p_ip, p_email, p_success, p_user_agent, block_until);

  -- Clean old attempts (> 24h)
  DELETE FROM login_attempts WHERE attempted_at < now() - interval '24 hours';

  IF block_until IS NOT NULL THEN
    RETURN jsonb_build_object('allowed', false, 'blocked_until', block_until, 'reason', 'Too many failures');
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', 5 - recent_failures - 1);
END;
$$;

-- 4. RGPD data retention configuration
CREATE TABLE IF NOT EXISTS rgpd_retention (
  id SERIAL PRIMARY KEY,
  data_category TEXT NOT NULL UNIQUE,
  retention_years INT NOT NULL,
  description TEXT,
  legal_basis TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO rgpd_retention (data_category, retention_years, description, legal_basis) VALUES
  ('identity', 5, 'Nom, prénom, date naissance, genre', 'Exécution contrat + Art. 2262bis Code civil'),
  ('niss', 10, 'Numéro national (NISS)', 'Obligation légale ONSS + fiscal'),
  ('financial', 10, 'Salaire, IBAN, fiches de paie', 'Art. 315 CIR 1992 (10 ans fiscal)'),
  ('contract', 5, 'Contrat, avenant, conditions', 'Art. 2262bis Code civil'),
  ('family', 5, 'Situation familiale, enfants', 'Obligation légale PP'),
  ('health', 40, 'Médecine du travail, exposition', 'AR 28/05/2003 (40 ans si exposition)'),
  ('absence', 5, 'Congés, maladies, accidents', 'Obligation légale ONSS'),
  ('training', 3, 'Formations, certificats', 'Loi 03/10/2022'),
  ('evaluation', 1, 'Objectifs, notes, entretiens', 'Intérêt légitime'),
  ('audit', 2, 'Logs accès, actions système', 'Intérêt légitime + RGPD Art. 5.1.e'),
  ('vehicle', 5, 'ATN, CO2, kilométrage', 'Obligation fiscale')
ON CONFLICT (data_category) DO NOTHING;

-- 5. IP whitelist (Niveau 3 — pour fiduciaires)
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id SERIAL PRIMARY KEY,
  organization_id UUID REFERENCES auth.users(id),
  ip_address TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_ip_whitelist_org ON ip_whitelist(organization_id, active);

ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own org whitelist" ON ip_whitelist
  FOR ALL USING (organization_id = auth.uid());
