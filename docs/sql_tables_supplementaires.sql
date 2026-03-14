CREATE TABLE IF NOT EXISTS clotures_historique (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  periode TEXT NOT NULL,
  annee INT NOT NULL,
  mois INT NOT NULL,
  nb_employes INT DEFAULT 0,
  nb_fiches INT DEFAULT 0,
  masse_brute NUMERIC(14,2) DEFAULT 0,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  closed_by TEXT,
  status TEXT DEFAULT 'closed'
);
ALTER TABLE clotures_historique ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "clotures_owner" ON clotures_historique FOR ALL USING (auth.uid() = user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clotures_unique ON clotures_historique(user_id, annee, mois);

CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  periode TEXT,
  annee INT,
  trimestre INT,
  mois INT,
  status TEXT DEFAULT 'submitted',
  reference TEXT,
  montant NUMERIC(14,2),
  xml_content TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "declarations_owner" ON declarations FOR ALL USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_declarations_user ON declarations(user_id, type, created_at DESC);

CREATE TABLE IF NOT EXISTS app_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  val TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
