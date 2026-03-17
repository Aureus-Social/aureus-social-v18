-- Mise à jour table clients pour le systeme d'invitation
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS desactive_at TIMESTAMPTZ;

-- Index pour retrouver un client par son user_id propre
CREATE INDEX IF NOT EXISTS idx_clients_client_user ON clients(client_user_id);
CREATE INDEX IF NOT EXISTS idx_clients_invited_by ON clients(invited_by);
