#!/usr/bin/env node
// Script d'exécution automatique des migrations SQL
// Utilise SUPABASE_DB_URL depuis les secrets GitHub/Vercel

const { Client } = require('pg');

const SQL = `
-- AUREUS SOCIAL PRO — Migration SAFE 2026-03-17
-- Exécution automatique via script Node.js + PostgreSQL direct

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

CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emp_id TEXT NOT NULL, emp_nom TEXT, type TEXT DEFAULT 'conge_annuel',
  date_debut TEXT NOT NULL, date_fin TEXT NOT NULL,
  jours_ouvrables NUMERIC(5,1) DEFAULT 1, statut TEXT DEFAULT 'demande',
  motif TEXT, approuve_par TEXT, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT, bce TEXT, vat TEXT, adresse TEXT, email TEXT, tel TEXT, iban TEXT,
  contact_nom TEXT, type TEXT DEFAULT 'fiduciaire',
  actif BOOLEAN DEFAULT true, notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clotures_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode TEXT NOT NULL, annee INT NOT NULL, mois INT NOT NULL,
  nb_employes INT DEFAULT 0, nb_fiches INT DEFAULT 0,
  masse_brute NUMERIC(14,2) DEFAULT 0,
  closed_at TIMESTAMPTZ DEFAULT NOW(), closed_by TEXT, status TEXT DEFAULT 'closed'
);

CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, periode TEXT, annee INT, trimestre INT, mois INT,
  status TEXT DEFAULT 'submitted', reference TEXT, montant NUMERIC(14,2),
  xml_content TEXT, notes TEXT, submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  val TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fiches_paie ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandats_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clotures_historique ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiches_paie_owner" ON fiches_paie;
CREATE POLICY "fiches_paie_owner" ON fiches_paie FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "absences_owner" ON absences;
CREATE POLICY "absences_owner" ON absences FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "mandats_log_owner" ON mandats_log;
CREATE POLICY "mandats_log_owner" ON mandats_log FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clients_owner" ON clients;
CREATE POLICY "clients_owner" ON clients FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "clotures_owner" ON clotures_historique;
CREATE POLICY "clotures_owner" ON clotures_historique FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "declarations_owner" ON declarations;
CREATE POLICY "declarations_owner" ON declarations FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_fiches_user ON fiches_paie(user_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_fiches_emp ON fiches_paie(user_id, emp_id);
CREATE INDEX IF NOT EXISTS idx_absences_user_emp ON absences(user_id, emp_id);
CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_watch_date ON legal_watch_log(checked_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clotures_unique ON clotures_historique(user_id, annee, mois);
CREATE INDEX IF NOT EXISTS idx_declarations_user ON declarations(user_id, type, created_at DESC);
`;

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error('❌ SUPABASE_DB_URL non défini');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  try {
    await client.connect();
    console.log('✅ Connecté à Supabase PostgreSQL');
    
    await client.query(SQL);
    console.log('✅ Toutes les tables créées avec succès');
    
    // Vérifier les tables créées
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('\n📋 Tables dans public schema:');
    result.rows.forEach(r => console.log('  -', r.table_name));
    
  } catch (err) {
    console.error('❌ Erreur SQL:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
