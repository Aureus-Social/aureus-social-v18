-- Table absences/congés
CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id TEXT NOT NULL,
  emp_nom TEXT,
  type TEXT DEFAULT 'conge_annuel', -- conge_annuel | maladie | accident_travail | conge_sans_solde | formation | autre
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  jours_ouvrables NUMERIC(5,1) DEFAULT 1,
  statut TEXT DEFAULT 'demande', -- demande | approuve | refuse | annule
  motif TEXT,
  approuve_par TEXT,
  approuve_at TIMESTAMPTZ,
  certificat_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table mandats_log
CREATE TABLE IF NOT EXISTS mandats_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- mandat_onss | mandat_belcotax | domiciliation | prime_emploi
  data JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandats_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "absences_owner" ON absences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "mandats_log_owner" ON mandats_log FOR ALL USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_absences_user_emp ON absences(user_id, emp_id);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(user_id, date_debut, date_fin);
CREATE INDEX IF NOT EXISTS idx_mandats_log_user ON mandats_log(user_id, generated_at DESC);
