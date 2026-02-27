-- ═══════════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — Multi-Tenant RLS Migration
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. TENANTS TABLE (fiduciaires)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  vat TEXT,  -- BCE number
  onss TEXT, -- ONSS number
  plan TEXT DEFAULT 'starter', -- starter, pro, enterprise
  status TEXT DEFAULT 'active', -- active, trial, suspended
  max_clients INT DEFAULT 10,
  max_users INT DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Admin can see all, others see only their tenant
CREATE POLICY "tenants_admin_all" ON tenants
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'role') = 'admin'
    OR id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
  );

-- 2. ADD tenant_id TO EXISTING TABLES
-- user_rôles
ALTER TABLE "user_rôles" ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON "user_rôles"(tenant_id);

-- app_state (client data)
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_app_state_tenant ON app_state(tenant_id);

-- payroll_history
ALTER TABLE payroll_history ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_payroll_tenant ON payroll_history(tenant_id);

-- activity_log
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_activity_log_tenant ON activity_log(tenant_id);

-- documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);

-- 3. LEAVE REQUESTS TABLE (employee portal)
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  employee_email TEXT NOT NULL,
  employee_niss TEXT,
  type TEXT NOT NULL, -- conge, maladie, sans_solde, formation, familial, autre
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees see own requests, gestionnaires see all for their tenant
CREATE POLICY "leave_requests_isolation" ON leave_requests
  FOR ALL USING (
    tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
    AND (
      employee_email = auth.jwt()->>'email'
      OR (auth.jwt()->'user_metadata'->>'role') IN ('admin', 'gestionnaire')
    )
  );

-- 4. INVITATIONS TABLE
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client', -- admin, gestionnaire, comptable, client, employee
  invited_by UUID REFERENCES auth.users(id),
  token TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + interval '7 days',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitations_tenant" ON invitations
  FOR ALL USING (
    tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
  );

-- 5. RLS POLICIES — TENANT ISOLATION

-- app_state: each tenant sees only their data
DROP POLICY IF EXISTS "app_state_tenant_isolation" ON app_state;
CREATE POLICY "app_state_tenant_isolation" ON app_state
  FOR ALL USING (
    tenant_id IS NULL  -- legacy data (no tenant yet)
    OR tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- payroll_history
DROP POLICY IF EXISTS "payroll_tenant_isolation" ON payroll_history;
CREATE POLICY "payroll_tenant_isolation" ON payroll_history
  FOR ALL USING (
    tenant_id IS NULL
    OR tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- activity_log
DROP POLICY IF EXISTS "activity_log_tenant" ON activity_log;
CREATE POLICY "activity_log_tenant" ON activity_log
  FOR ALL USING (
    tenant_id IS NULL
    OR tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- documents
DROP POLICY IF EXISTS "documents_tenant" ON documents;
CREATE POLICY "documents_tenant" ON documents
  FOR ALL USING (
    tenant_id IS NULL
    OR tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- user_rôles
DROP POLICY IF EXISTS "user_roles_tenant" ON "user_rôles";
CREATE POLICY "user_roles_tenant" ON "user_rôles"
  FOR ALL USING (
    tenant_id IS NULL
    OR tenant_id = (auth.jwt()->'user_metadata'->>'tenant_id')::UUID
    OR (auth.jwt()->'user_metadata'->>'role') = 'admin'
  );

-- 6. HELPER FUNCTIONS

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt()->'user_metadata'->>'tenant_id')::UUID;
$$ LANGUAGE sql STABLE;

-- Auto-set tenant_id on insert
CREATE OR REPLACE FUNCTION set_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['app_state', 'payroll_history', 'activity_log', 'documents', 'leave_requests'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_tenant_id ON %I', tbl);
    EXECUTE format('CREATE TRIGGER set_tenant_id BEFORE INSERT ON %I FOR EACH ROW EXECUTE FUNCTION set_tenant_id()', tbl);
  END LOOP;
END;
$$;

-- 7. SEED: Create first tenant for Aureus admin
INSERT INTO tenants (name, slug, email, vat, onss, plan, status, max_clients, max_users)
VALUES ('Aureus IA SPRL', 'aureus', 'info@aureus-ia.com', 'BE1028230781', '', 'enterprise', 'active', 999, 999)
ON CONFLICT (slug) DO NOTHING;

-- Set admin user tenant_id (run after first login)
-- UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || 
--   jsonb_build_object('tenant_id', (SELECT id FROM tenants WHERE slug = 'aureus'), 'role', 'admin')
-- WHERE email = 'info@aureus-ia.com';

COMMENT ON TABLE tenants IS 'Multi-tenant isolation — one row per fiduciaire/cabinet';
COMMENT ON TABLE leave_requests IS 'Employee leave requests with tenant isolation';
COMMENT ON TABLE invitations IS 'User invitations with role assignment and token-based acceptance';
