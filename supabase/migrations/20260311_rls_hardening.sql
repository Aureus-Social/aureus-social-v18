-- ════════════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — RLS Hardening
-- Renforcement Row Level Security sur les tables critiques
-- Exécuter dans Supabase SQL Editor
-- ════════════════════════════════════════════════════════════

-- ── Activer RLS sur toutes les tables si pas encore fait
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN ('schema_migrations')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;

-- ── Table: clients — chaque user ne voit QUE ses propres clients
DROP POLICY IF EXISTS "users_own_clients" ON clients;
CREATE POLICY "users_own_clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- ── Table: employees — via clients appartenant à l'user
DROP POLICY IF EXISTS "users_own_employees" ON employees;
CREATE POLICY "users_own_employees" ON employees
  FOR ALL USING (
    client_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

-- ── Table: payslips — via employees → clients
DROP POLICY IF EXISTS "users_own_payslips" ON payslips;
CREATE POLICY "users_own_payslips" ON payslips
  FOR ALL USING (
    employee_id IN (
      SELECT e.id FROM employees e
      JOIN clients c ON c.id = e.client_id
      WHERE c.user_id = auth.uid()
    )
  );

-- ── Table: audit_log — lecture seule pour admins
DROP POLICY IF EXISTS "admins_read_audit" ON audit_log;
CREATE POLICY "admins_read_audit" ON audit_log
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

DROP POLICY IF EXISTS "authenticated_insert_audit" ON audit_log;
CREATE POLICY "authenticated_insert_audit" ON audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── Fonction helper: vérifier si l'user est admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Vue sécurisée: nombre de clients par user (sans exposer les données)
CREATE OR REPLACE VIEW user_client_count AS
  SELECT auth.uid() as user_id, COUNT(*) as total_clients
  FROM clients WHERE user_id = auth.uid()
  GROUP BY auth.uid();

-- ── Index pour les policies RLS (performance)
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_client_id ON employees(client_id);

SELECT 'RLS Hardening appliqué avec succès ✅' as status;
