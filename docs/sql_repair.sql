-- ÉTAPE 2 : Réparation complète — safe pour tous les cas
-- Ajoute les colonnes manquantes si la table existe sans user_id
-- Crée la table si elle n existe pas du tout

-- ── fiches_paie ──────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='fiches_paie') THEN
    -- Table existe : ajouter colonnes manquantes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='fiches_paie' AND column_name='user_id') THEN
      ALTER TABLE fiches_paie ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  ELSE
    -- Table n existe pas : créer
    CREATE TABLE fiches_paie (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      emp_id TEXT, ename TEXT, period TEXT, month INT, year INT,
      gross NUMERIC(12,2), net NUMERIC(12,2), onss_w NUMERIC(12,2),
      onss_e NUMERIC(12,2), pp NUMERIC(12,2), cost_total NUMERIC(12,2),
      net_factor NUMERIC(8,4), prime_emploi NUMERIC(12,2) DEFAULT 0,
      generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── absences ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='absences') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='absences' AND column_name='user_id') THEN
      ALTER TABLE absences ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='absences' AND column_name='emp_id') THEN
      ALTER TABLE absences ADD COLUMN emp_id TEXT;
    END IF;
  ELSE
    CREATE TABLE absences (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      emp_id TEXT NOT NULL, emp_nom TEXT, type TEXT DEFAULT 'conge_annuel',
      date_debut TEXT NOT NULL, date_fin TEXT NOT NULL,
      jours_ouvrables NUMERIC(5,1) DEFAULT 1, statut TEXT DEFAULT 'demande',
      motif TEXT, notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── mandats_log ──────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='mandats_log') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='mandats_log' AND column_name='user_id') THEN
      ALTER TABLE mandats_log ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  ELSE
    CREATE TABLE mandats_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, data JSONB, generated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── legal_watch_log ──────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='legal_watch_log') THEN
    CREATE TABLE legal_watch_log (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sources_ok INT DEFAULT 0, sources_error INT DEFAULT 0,
      calendar_alerts INT DEFAULT 0, sources_data JSONB, alerts_data JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── clients ──────────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clients') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clients' AND column_name='user_id') THEN
      ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  ELSE
    CREATE TABLE clients (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      nom TEXT, bce TEXT, email TEXT, actif BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── clotures_historique ──────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='clotures_historique') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='clotures_historique' AND column_name='user_id') THEN
      ALTER TABLE clotures_historique ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  ELSE
    CREATE TABLE clotures_historique (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      periode TEXT NOT NULL, annee INT NOT NULL, mois INT NOT NULL,
      nb_employes INT DEFAULT 0, masse_brute NUMERIC(14,2) DEFAULT 0,
      closed_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── declarations ─────────────────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='declarations') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='declarations' AND column_name='user_id') THEN
      ALTER TABLE declarations ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  ELSE
    CREATE TABLE declarations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      type TEXT NOT NULL, periode TEXT, status TEXT DEFAULT 'submitted',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- ── app_state ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  val TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS + Policies ───────────────────────────────────────────────
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

-- ── Vérification finale ──────────────────────────────────────────
SELECT table_name, 
  (SELECT array_agg(column_name) FROM information_schema.columns c WHERE c.table_name=t.table_name AND c.table_schema='public') as colonnes
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
