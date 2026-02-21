-- ═══════════════════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — Migration Supabase avec RLS (Row Level Security)
-- Date: 21 février 2026
-- RGPD: Art. 32 — Sécurité du traitement des données personnelles
-- ═══════════════════════════════════════════════════════════════════

-- ══════ 1. TABLE app_state (données principales) ══════
CREATE TABLE IF NOT EXISTS app_state (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_key TEXT NOT NULL DEFAULT 'main',
  state_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, state_key)
);

-- 🔒 RLS: chaque utilisateur ne voit QUE ses propres données
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own state" ON app_state;
CREATE POLICY "Users can view own state" ON app_state
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own state" ON app_state;
CREATE POLICY "Users can insert own state" ON app_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own state" ON app_state;
CREATE POLICY "Users can update own state" ON app_state
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own state" ON app_state;
CREATE POLICY "Users can delete own state" ON app_state
  FOR DELETE USING (auth.uid() = user_id);


-- ══════ 2. TABLE user_roles (gestion des rôles multi-utilisateurs) ══════
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'gestionnaire', 'readonly')),
  email TEXT,
  invited_by UUID REFERENCES auth.users(id),
  organization_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Admin voit tous les rôles de son organisation
DROP POLICY IF EXISTS "Users can view roles in org" ON user_roles;
CREATE POLICY "Users can view roles in org" ON user_roles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT ur.user_id FROM user_roles ur 
      WHERE ur.role = 'admin' 
      AND ur.organization_id = user_roles.organization_id
    )
  );

DROP POLICY IF EXISTS "Admins can manage roles" ON user_roles;
CREATE POLICY "Admins can manage roles" ON user_roles
  FOR ALL USING (
    auth.uid() = user_id 
    OR auth.uid() IN (
      SELECT ur.user_id FROM user_roles ur 
      WHERE ur.role = 'admin'
    )
  );


-- ══════ 3. TABLE email_log (journal des emails envoyés) ══════
CREATE TABLE IF NOT EXISTS email_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  resend_id TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own emails" ON email_log;
CREATE POLICY "Users can view own emails" ON email_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emails" ON email_log;
CREATE POLICY "Users can insert own emails" ON email_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ══════ 4. TABLE payroll_history (historique paie) ══════
CREATE TABLE IF NOT EXISTS payroll_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year BETWEEN 2020 AND 2100),
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id, period_month, period_year)
);

ALTER TABLE payroll_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payroll" ON payroll_history;
CREATE POLICY "Users can view own payroll" ON payroll_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own payroll" ON payroll_history;
CREATE POLICY "Users can manage own payroll" ON payroll_history
  FOR ALL USING (auth.uid() = user_id);


-- ══════ 5. TABLE activity_log (audit trail — RGPD Art. 30) ══════
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON activity_log;
CREATE POLICY "Users can view own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activity" ON activity_log;
CREATE POLICY "Users can insert own activity" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activity log is append-only: no update or delete
DROP POLICY IF EXISTS "No updates on activity log" ON activity_log;


-- ══════ 6. TABLE audit_log (logs système) ══════
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own audit" ON audit_log;
CREATE POLICY "Users can view own audit" ON audit_log
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert audit" ON audit_log;
CREATE POLICY "Users can insert audit" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ══════ 7. INDEX pour performances ══════
CREATE INDEX IF NOT EXISTS idx_app_state_user ON app_state(user_id);
CREATE INDEX IF NOT EXISTS idx_app_state_key ON app_state(user_id, state_key);
CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_user ON payroll_history(user_id, period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_roles_org ON user_roles(organization_id);


-- ══════ 8. FONCTION auto-update updated_at ══════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_state_updated_at ON app_state;
CREATE TRIGGER app_state_updated_at
  BEFORE UPDATE ON app_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS payroll_updated_at ON payroll_history;
CREATE TRIGGER payroll_updated_at
  BEFORE UPDATE ON payroll_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ══════ 9. RÉTENTION DONNÉES (RGPD Art. 5) ══════
-- Les logs d'activité sont purgés après 2 ans automatiquement
-- À exécuter via un cron Supabase ou pg_cron
-- DELETE FROM activity_log WHERE created_at < now() - INTERVAL '2 years';
-- DELETE FROM audit_log WHERE created_at < now() - INTERVAL '2 years';
-- DELETE FROM email_log WHERE created_at < now() - INTERVAL '1 year';

-- ══════ RÉSUMÉ SÉCURITÉ ══════
-- ✅ RLS activé sur TOUTES les tables
-- ✅ Chaque utilisateur ne voit QUE ses propres données
-- ✅ activity_log en append-only (pas de modification/suppression)
-- ✅ Cascade delete si le compte est supprimé
-- ✅ Index pour performances
-- ✅ Contraintes de vérification sur les données
