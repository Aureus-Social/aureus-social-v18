-- AUREUS SOCIAL PRO — Migration chiffrement NISS/IBAN
-- À exécuter dans Supabase SQL Editor APRÈS avoir déployé la nouvelle version

-- Activer pgcrypto pour le chiffrement côté DB si besoin futur
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ajouter colonnes chiffrées dans employes (garder les anciennes pour migration)
ALTER TABLE employes ADD COLUMN IF NOT EXISTS niss_encrypted TEXT;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS iban_encrypted TEXT;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS niss_enc TEXT;
ALTER TABLE employes ADD COLUMN IF NOT EXISTS iban_enc TEXT;

-- Note : le chiffrement AES-256-GCM est géré côté application (crypto-fields.js)
-- La clé ENCRYPTION_KEY est dans Vercel env vars (jamais en DB)
-- Format stocké : 'enc:iv_hex:tag_hex:cipher_hex'
-- Si niss commence par 'enc:' → chiffré par l'app
-- Si niss ne commence pas par 'enc:' → en clair (legacy, sera chiffré au prochain PUT)

-- Index pour optimiser la recherche
CREATE INDEX IF NOT EXISTS idx_employes_niss ON employes(user_id) WHERE niss IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_employes_status ON employes(user_id, status);

-- RLS renforcé sur employes
DROP POLICY IF EXISTS "employes_owner" ON employes;
CREATE POLICY "employes_owner" ON employes FOR ALL USING (auth.uid() = user_id);

-- Vérification
SELECT 
  'employes' as table_name,
  count(*) as total,
  count(*) FILTER (WHERE niss LIKE 'enc:%') as niss_chiffres,
  count(*) FILTER (WHERE iban LIKE 'enc:%') as iban_chiffres
FROM employes;
