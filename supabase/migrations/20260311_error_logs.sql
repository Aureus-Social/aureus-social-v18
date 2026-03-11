-- ════════════════════════════════════════════════════
-- AUREUS SOCIAL PRO — Table error_logs
-- Utilisée par app/lib/security/logger.js
-- pour envoyer les erreurs prod vers Supabase
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS error_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level       TEXT NOT NULL CHECK (level IN ('DEBUG','INFO','WARN','ERROR')),
  module      TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        JSONB,
  url         TEXT,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index pour requêtes de monitoring
CREATE INDEX IF NOT EXISTS idx_error_logs_level     ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_module    ON error_logs(module);
CREATE INDEX IF NOT EXISTS idx_error_logs_created   ON error_logs(created_at DESC);

-- RLS: seulement les admins peuvent lire les logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Politique lecture : admins seulement
CREATE POLICY "admins_read_error_logs" ON error_logs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_roles WHERE role = 'admin'
    )
  );

-- Politique écriture : tous les utilisateurs authentifiés (pour logger les erreurs)
CREATE POLICY "authenticated_insert_error_logs" ON error_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Purge automatique après 90 jours (RGPD)
-- Sera géré par le cron rgpd_retention.sql
