-- AUREUS SOCIAL PRO — SQL SAFE v4
-- Seulement ce qui est sûr à 100%
-- 17/03/2026

-- ── 4 nouvelles tables ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiches_paie (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id TEXT, ename TEXT, period TEXT, month INT, year INT,
  gross NUMERIC(12,2), net NUMERIC(12,2), onss_w NUMERIC(12,2),
  onss_e NUMERIC(12,2), pp NUMERIC(12,2), cost_total NUMERIC(12,2),
  net_factor NUMERIC(8,4), prime_emploi NUMERIC(12,2) DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mandats_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, data JSONB, generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS legal_watch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sources_ok INT DEFAULT 0, sources_error INT DEFAULT 0,
  calendar_alerts INT DEFAULT 0, sources_data JSONB, alerts_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clotures_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode TEXT NOT NULL, annee INT NOT NULL, mois INT NOT NULL,
  nb_employes INT DEFAULT 0, nb_fiches INT DEFAULT 0,
  masse_brute NUMERIC(14,2) DEFAULT 0,
  closed_at TIMESTAMPTZ DEFAULT NOW(), closed_by TEXT, status TEXT DEFAULT 'closed'
);

-- ── Colonnes manquantes sur tables existantes ──────────────────
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;

ALTER TABLE declarations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS periode TEXT;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS annee INT;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS montant NUMERIC(14,2);
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS reference TEXT;

-- ── RLS nouvelles tables ───────────────────────────────────────
ALTER TABLE fiches_paie ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandats_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE clotures_historique ENABLE ROW LEVEL SECURITY;

-- ── Policies nouvelles tables ──────────────────────────────────
DROP POLICY IF EXISTS "fiches_paie_owner" ON fiches_paie;
CREATE POLICY "fiches_paie_owner" ON fiches_paie FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mandats_log_owner" ON mandats_log;
CREATE POLICY "mandats_log_owner" ON mandats_log FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clotures_owner" ON clotures_historique;
CREATE POLICY "clotures_owner" ON clotures_historique FOR ALL USING (auth.uid() = user_id);

-- ── Index ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fiches_user ON fiches_paie(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_legal_watch_date ON legal_watch_log(checked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clotures_unique ON clotures_historique(user_id, annee, mois);

-- ── Confirmation ───────────────────────────────────────────────
SELECT 'OK' as status, count(*) as nb_tables
FROM information_schema.tables
WHERE table_schema = 'public';
