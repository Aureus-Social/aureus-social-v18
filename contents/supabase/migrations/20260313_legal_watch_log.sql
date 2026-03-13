-- Table legal_watch_log pour historique veille légale
CREATE TABLE IF NOT EXISTS legal_watch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sources_ok INT DEFAULT 0,
  sources_error INT DEFAULT 0,
  calendar_alerts INT DEFAULT 0,
  sources_data JSONB,
  alerts_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_legal_watch_date ON legal_watch_log(checked_at DESC);
