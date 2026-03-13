-- AUREUS SOCIAL PRO — Migration consolidée 2026-03-13
-- Exécuter dans Supabase SQL Editor (projet jwjtlpewwdjxdboxtbdf)

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
ALTER TABLE fiches_paie ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "fiches_paie_owner" ON fiches_paie FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_fiches_user ON fiches_paie(user_id, year DESC, month DESC);

CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id TEXT NOT NULL, emp_nom TEXT, type TEXT DEFAULT 'conge_annuel',
  date_debut TEXT NOT NULL, date_fin TEXT NOT NULL,
  jours_ouvrables NUMERIC(5,1) DEFAULT 1, statut TEXT DEFAULT 'demande',
  motif TEXT, approuve_par TEXT, approuve_at TIMESTAMPTZ,
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "absences_owner" ON absences FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_absences_user_emp ON absences(user_id, emp_id);

CREATE TABLE IF NOT EXISTS mandats_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, data JSONB, generated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE mandats_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "mandats_log_owner" ON mandats_log FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS legal_watch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sources_ok INT DEFAULT 0, sources_error INT DEFAULT 0,
  calendar_alerts INT DEFAULT 0, sources_data JSONB, alerts_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_legal_watch_date ON legal_watch_log(checked_at DESC);

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT, bce TEXT, vat TEXT, adresse TEXT, email TEXT, tel TEXT, iban TEXT,
  contact_nom TEXT, type TEXT DEFAULT 'fiduciaire',
  actif BOOLEAN DEFAULT true, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "clients_owner" ON clients FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id, actif);
