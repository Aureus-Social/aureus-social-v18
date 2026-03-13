-- ═══ AUREUS SOCIAL PRO — Migration tables manquantes ═══
-- À exécuter dans Supabase SQL Editor (project jwjtlpewwdjxdboxtbdf)

-- Table employes (si pas déjà existante)
CREATE TABLE IF NOT EXISTS employes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prenom TEXT,
  nom TEXT,
  first TEXT,
  last TEXT,
  niss TEXT,
  iban TEXT,
  email TEXT,
  monthlySalary NUMERIC(12,2),
  salaire_brut NUMERIC(12,2),
  gross NUMERIC(12,2),
  date_entree TEXT,
  startD TEXT,
  date_fin TEXT,
  endD TEXT,
  commission_paritaire TEXT DEFAULT '200',
  cp TEXT DEFAULT '200',
  type_employe TEXT DEFAULT 'employe',
  contract TEXT DEFAULT 'cdi',
  regime TEXT DEFAULT 'temps_plein',
  dept TEXT,
  wtype TEXT DEFAULT 'OTH',
  status TEXT DEFAULT 'active',
  birth TEXT,
  birthDate TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table entreprises
CREATE TABLE IF NOT EXISTS entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT,
  name TEXT,
  bce TEXT,
  vat TEXT,
  matricule_onss TEXT,
  onss TEXT,
  adresse TEXT,
  address TEXT,
  cp_ville TEXT,
  email TEXT,
  tel TEXT,
  iban TEXT,
  commission_paritaire TEXT,
  type_employe TEXT,
  regime TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table factures
CREATE TABLE IF NOT EXISTS factures (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  client_nom TEXT,
  client_email TEXT,
  client_bce TEXT,
  client_adresse TEXT,
  client_iban TEXT,
  date_facture TEXT,
  date_echeance TEXT,
  tva_rate NUMERIC(5,2) DEFAULT 21,
  ht NUMERIC(12,2),
  tva NUMERIC(12,2),
  ttc NUMERIC(12,2),
  lignes JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'envoyee',
  relances JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table dimona_declarations
CREATE TABLE IF NOT EXISTS dimona_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  eid TEXT,
  ename TEXT,
  action TEXT,
  wtype TEXT,
  wtype_desc TEXT,
  start_date TEXT,
  end_date TEXT,
  xml TEXT,
  dimona_ref TEXT,
  hours NUMERIC(6,2),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  onss_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE dimona_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "employes_owner" ON employes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "entreprises_owner" ON entreprises FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "factures_owner" ON factures FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "dimona_owner" ON dimona_declarations FOR ALL USING (auth.uid() = user_id);

-- Index performance
CREATE INDEX IF NOT EXISTS idx_employes_user ON employes(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_user ON factures(user_id);
CREATE INDEX IF NOT EXISTS idx_dimona_user ON dimona_declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_employes_status ON employes(user_id, status);
