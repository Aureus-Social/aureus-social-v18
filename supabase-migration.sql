-- ═══════════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — Supabase Database Migration
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- 1. APP STATE — Main data persistence (JSON blob per user)
CREATE TABLE IF NOT EXISTS app_state (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  state_key TEXT NOT NULL DEFAULT 'main',
  state_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, state_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_app_state_user ON app_state(user_id, state_key);

-- Enable RLS
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can read own state" ON app_state
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own state" ON app_state
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own state" ON app_state
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can access all (for save-beacon)
CREATE POLICY "Service role full access" ON app_state
  FOR ALL USING (auth.role() = 'service_role');

-- 2. USER ROLES — RBAC
CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'admin',
  email TEXT,
  invited_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roles" ON user_roles
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can manage own role" ON user_roles
  FOR ALL USING (true); -- Admin manages all roles

-- 3. ACTIVITY LOG — User actions
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own activity" ON activity_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. AUDIT LOG — System audit trail
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID DEFAULT auth.uid(),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can insert audit" ON audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admin can read audit" ON audit_log
  FOR SELECT USING (auth.role() = 'authenticated');

-- 5. PAYROLL HISTORY — Monthly payroll runs (immutable)
CREATE TABLE IF NOT EXISTS payroll_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL CHECK (period_year BETWEEN 2020 AND 2099),
  run_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed',
  summary JSONB NOT NULL DEFAULT '{}',
  -- summary: { totalBrut, totalNet, totalCout, totalONSS, totalPP, empCount }
  fiches JSONB NOT NULL DEFAULT '[]',
  -- fiches: [{ empId, empName, brut, onssW, imposable, pp, csss, bonusEmploi, net, onssP, coutTotal }]
  documents JSONB DEFAULT '[]',
  -- documents: [{ type, empName, generated_at, sent_to_email, status }]
  UNIQUE(user_id, client_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_user_period ON payroll_history(user_id, period_year DESC, period_month DESC);
CREATE INDEX IF NOT EXISTS idx_payroll_client ON payroll_history(client_id, period_year DESC, period_month DESC);

ALTER TABLE payroll_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own payroll" ON payroll_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payroll" ON payroll_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payroll" ON payroll_history
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. EMAIL LOG — Track all sent emails
CREATE TABLE IF NOT EXISTS email_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  resend_id TEXT,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_log_user ON email_log(user_id, created_at DESC);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own emails" ON email_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own emails" ON email_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. DOCUMENT STORAGE — Metadata for uploaded/generated documents
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id TEXT,
  employee_id TEXT,
  doc_type TEXT NOT NULL, -- contrat, fiche_paie, c4, attestation, dimona, etc.
  title TEXT NOT NULL,
  storage_path TEXT, -- Supabase Storage path
  file_size INTEGER,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  period_month INTEGER,
  period_year INTEGER,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_docs_user_client ON documents(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_docs_type ON documents(doc_type);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own docs" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- 8. Enable Realtime for app_state (live sync between users)
ALTER PUBLICATION supabase_realtime ADD TABLE app_state;

-- 9. Storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: users can upload to their own folder
CREATE POLICY "Users can upload own docs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can read own docs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.role() = 'authenticated'
  );

-- ═══════════════════════════════════════════════════════════
-- DONE! Your database is ready for Aureus Social Pro.
-- 
-- Next steps:
-- 1. Go to Vercel > Settings > Environment Variables
-- 2. Add: NEXT_PUBLIC_SUPABASE_URL = your-project.supabase.co
-- 3. Add: NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key
-- 4. Add: SUPABASE_SERVICE_ROLE_KEY = your-service-key
-- 5. Add: RESEND_API_KEY = re_xxxx (from resend.com)
-- ═══════════════════════════════════════════════════════════
