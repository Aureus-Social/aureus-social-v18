-- ══════════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — MIGRATION MULTI-TENANT
-- Exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

-- 1. TABLE TENANTS (fiduciaires)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,  -- URL: app.aureussocial.be/dupont
  email TEXT,
  phone TEXT,
  address TEXT,
  vat_number TEXT,  -- BCE
  onss_number TEXT,
  plan TEXT DEFAULT 'starter',  -- starter, pro, enterprise
  max_employees INT DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AJOUTER tenant_id À user_rôles
ALTER TABLE user_rôles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- 3. TABLE EMPLOYEE_ACCESS (lien employé ↔ auth user)
CREATE TABLE IF NOT EXISTS employee_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  employee_email TEXT NOT NULL,
  employee_niss TEXT,
  role TEXT DEFAULT 'employee',  -- employee, manager
  active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- 4. TABLE IP_WHITELIST (restriction accès par fiduciaire)
CREATE TABLE IF NOT EXISTS ip_whitelist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  ip_cidr TEXT NOT NULL,
  label TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5. TABLE AUDIT_LOG (journal sécurité multi-tenant)
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY — Isolation par fiduciaire
-- ══════════════════════════════════════════════════════════

-- TENANTS: admin voit tout, autres voient leur tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON tenants FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_rôles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Tenant members see own" ON tenants FOR SELECT
  USING (
    id = (SELECT tenant_id FROM user_rôles WHERE user_id = auth.uid() LIMIT 1)
  );

-- USER_RÔLES: isolation par tenant
ALTER TABLE user_rôles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin full access" ON user_rôles FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_rôles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
  );
CREATE POLICY "Same tenant access" ON user_rôles FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_rôles WHERE user_id = auth.uid() LIMIT 1)
  );

-- EMPLOYEE_ACCESS: employés voient uniquement leur propre accès
ALTER TABLE employee_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employee sees own" ON employee_access FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Admin manages all" ON employee_access FOR ALL
  USING (
    EXISTS (SELECT 1 FROM user_rôles WHERE user_id = auth.uid() AND role IN ('admin', 'gestionnaire'))
  );

-- IP_WHITELIST: isolation par tenant
ALTER TABLE ip_whitelist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation" ON ip_whitelist FOR ALL
  USING (
    tenant_id = (SELECT tenant_id FROM user_rôles WHERE user_id = auth.uid() LIMIT 1)
  );

-- AUDIT_LOG: lecture par tenant, écriture par tous authentifiés
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant read" ON audit_log FOR SELECT
  USING (
    tenant_id = (SELECT tenant_id FROM user_rôles WHERE user_id = auth.uid() LIMIT 1)
    OR EXISTS (SELECT 1 FROM user_rôles WHERE user_id = auth.uid() AND role = 'admin')
  );
CREATE POLICY "Auth insert" ON audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ══════════════════════════════════════════════════════════
-- INDEXES
-- ══════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_rôles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_rôles(user_id);
CREATE INDEX IF NOT EXISTS idx_employee_access_email ON employee_access(employee_email);
CREATE INDEX IF NOT EXISTS idx_employee_access_tenant ON employee_access(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_ip_whitelist_tenant ON ip_whitelist(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);

-- ══════════════════════════════════════════════════════════
-- FONCTIONS HELPER
-- ══════════════════════════════════════════════════════════

-- Fonction pour obtenir le tenant_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM user_rôles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Fonction pour vérifier si l'utilisateur est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM user_rôles WHERE user_id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ══════════════════════════════════════════════════════════
-- TRIGGER: updated_at automatique
-- ══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ══════════════════════════════════════════════════════════
-- SEED: Premier tenant (Aureus IA)
-- ══════════════════════════════════════════════════════════
INSERT INTO tenants (name, slug, email, vat_number, onss_number, plan, max_employees)
VALUES ('Aureus IA SPRL', 'aureus', 'contact@aureusia.com', 'BE 1028.230.781', '', 'enterprise', 999)
ON CONFLICT (slug) DO NOTHING;

-- ══════════════════════════════════════════════════════════
-- NOTE: Après exécution, assigner le tenant_id aux users existants:
-- UPDATE user_rôles SET tenant_id = (SELECT id FROM tenants WHERE slug = 'aureus')
-- WHERE tenant_id IS NULL;
-- ══════════════════════════════════════════════════════════
