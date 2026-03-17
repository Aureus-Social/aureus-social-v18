-- AUREUS SOCIAL PRO — SQL FINAL adapté à la vraie structure
-- Basé sur l'audit du 17/03/2026
-- À exécuter dans Supabase SQL Editor (jwjtlpewwdjxdboxtbdf)

-- ══════════════════════════════════════════════════════════════════
-- TABLES À CRÉER (absentes de la base)
-- ══════════════════════════════════════════════════════════════════

-- fiches_paie (nouvelle)
CREATE TABLE IF NOT EXISTS fiches_paie (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id TEXT, ename TEXT, period TEXT, month INT, year INT,
  gross NUMERIC(12,2), net NUMERIC(12,2), onss_w NUMERIC(12,2),
  onss_e NUMERIC(12,2), pp NUMERIC(12,2), cost_total NUMERIC(12,2),
  net_factor NUMERIC(8,4), prime_emploi NUMERIC(12,2) DEFAULT 0,
  bonus_emploi NUMERIC(12,2) DEFAULT 0, cheques_repas NUMERIC(12,2) DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
);

-- mandats_log (nouvelle)
CREATE TABLE IF NOT EXISTS mandats_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, data JSONB, generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- legal_watch_log (nouvelle)
CREATE TABLE IF NOT EXISTS legal_watch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sources_ok INT DEFAULT 0, sources_error INT DEFAULT 0,
  calendar_alerts INT DEFAULT 0, sources_data JSONB, alerts_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- clotures_historique (nouvelle)
CREATE TABLE IF NOT EXISTS clotures_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode TEXT NOT NULL, annee INT NOT NULL, mois INT NOT NULL,
  nb_employes INT DEFAULT 0, nb_fiches INT DEFAULT 0,
  masse_brute NUMERIC(14,2) DEFAULT 0,
  closed_at TIMESTAMPTZ DEFAULT NOW(), closed_by TEXT, status TEXT DEFAULT 'closed'
);

-- ══════════════════════════════════════════════════════════════════
-- COLONNES À AJOUTER sur tables existantes
-- ══════════════════════════════════════════════════════════════════

-- clients : ajouter user_id si manquant
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nom TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS actif BOOLEAN DEFAULT true;

-- declarations : ajouter user_id si manquant
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS periode TEXT;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS annee INT;
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS montant NUMERIC(14,2);
ALTER TABLE declarations ADD COLUMN IF NOT EXISTS reference TEXT;

-- absences : ajouter emp_id si manquant (la table a employee_id)
ALTER TABLE absences ADD COLUMN IF NOT EXISTS emp_id TEXT;
ALTER TABLE absences ADD COLUMN IF NOT EXISTS emp_nom TEXT;
ALTER TABLE absences ADD COLUMN IF NOT EXISTS statut TEXT DEFAULT 'demande';
ALTER TABLE absences ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'conge_annuel';
ALTER TABLE absences ADD COLUMN IF NOT EXISTS date_debut TEXT;
ALTER TABLE absences ADD COLUMN IF NOT EXISTS date_fin TEXT;

-- ══════════════════════════════════════════════════════════════════
-- RLS sur nouvelles tables
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE fiches_paie ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandats_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE clotures_historique ENABLE ROW LEVEL SECURITY;

-- ══════════════════════════════════════════════════════════════════
-- POLICIES
-- ══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "fiches_paie_owner" ON fiches_paie;
CREATE POLICY "fiches_paie_owner" ON fiches_paie FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mandats_log_owner" ON mandats_log;
CREATE POLICY "mandats_log_owner" ON mandats_log FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clotures_owner" ON clotures_historique;
CREATE POLICY "clotures_owner" ON clotures_historique FOR ALL USING (auth.uid() = user_id);

-- Pour clients et declarations (user_id vient d'être ajouté)
DROP POLICY IF EXISTS "clients_owner" ON clients;
CREATE POLICY "clients_owner" ON clients FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "declarations_owner" ON declarations;
CREATE POLICY "declarations_owner" ON declarations FOR ALL USING (auth.uid() = user_id);

-- ══════════════════════════════════════════════════════════════════
-- INDEX PERFORMANCE
-- ══════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_fiches_user ON fiches_paie(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_fiches_emp ON fiches_paie(user_id, emp_id);
CREATE INDEX IF NOT EXISTS idx_legal_watch_date ON legal_watch_log(checked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clotures_unique ON clotures_historique(user_id, annee, mois);

-- ══════════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ══════════════════════════════════════════════════════════════════
SELECT table_name, 
  (SELECT count(*) FROM information_schema.columns c 
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') as nb_colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
