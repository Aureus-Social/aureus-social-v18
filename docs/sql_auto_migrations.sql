
-- ══════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — Migrations auto 17/03/2026
-- Tables manquantes + colonnes + chiffrement
-- ══════════════════════════════════════════════════════

-- Table employes
CREATE TABLE IF NOT EXISTS employes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first TEXT, last TEXT, prenom TEXT, nom_emp TEXT,
  email TEXT, tel TEXT,
  niss TEXT, iban TEXT,
  niss_encrypted TEXT, iban_encrypted TEXT,
  monthlySalary NUMERIC(12,2), gross NUMERIC(12,2),
  startD TEXT, date_entree TEXT, endD TEXT,
  contract TEXT DEFAULT 'cdi',
  commission_paritaire TEXT DEFAULT '200', cp TEXT DEFAULT '200',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table entreprises
CREATE TABLE IF NOT EXISTS entreprises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT, name TEXT, bce TEXT, vat TEXT,
  matricule_onss TEXT, onss TEXT,
  adresse TEXT, address TEXT,
  email TEXT, tel TEXT, iban TEXT,
  commission_paritaire TEXT, secretariat_social TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table factures
CREATE TABLE IF NOT EXISTS factures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero TEXT, client_nom TEXT, client_bce TEXT,
  montant NUMERIC(12,2), ht NUMERIC(12,2), tva NUMERIC(12,2),
  statut TEXT DEFAULT 'brouillon',
  date_facture TEXT, date_echeance TEXT,
  notes TEXT, pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table error_logs
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  level TEXT DEFAULT 'error',
  message TEXT, stack TEXT, context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Colonnes manquantes clients (invitation)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS desactive_at TIMESTAMPTZ;

-- RLS
ALTER TABLE employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employes_owner" ON employes;
CREATE POLICY "employes_owner" ON employes FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "entreprises_owner" ON entreprises;
CREATE POLICY "entreprises_owner" ON entreprises FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "factures_owner" ON factures;
CREATE POLICY "factures_owner" ON factures FOR ALL USING (auth.uid() = user_id);

-- pgcrypto pour chiffrement futur
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Index performance
CREATE INDEX IF NOT EXISTS idx_employes_user ON employes(user_id);
CREATE INDEX IF NOT EXISTS idx_entreprises_user ON entreprises(user_id);
CREATE INDEX IF NOT EXISTS idx_factures_user ON factures(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_client_user ON clients(client_user_id);

-- Vérification finale
SELECT table_name, 
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name=t.table_name AND c.table_schema='public') as nb_cols
FROM information_schema.tables t
WHERE table_schema='public' ORDER BY table_name;
