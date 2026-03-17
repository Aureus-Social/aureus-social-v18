#!/usr/bin/env node
// Migration via API REST Supabase (HTTP - pas de TCP direct)
// Utilise SUPABASE_DB_URL pour extraire les credentials

const https = require('https');

// Parser la DB URL pour extraire les infos
function parseDbUrl(url) {
  // Format: postgresql://postgres.xxxx:password@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
  const match = url.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+)/);
  if (!match) throw new Error('Format SUPABASE_DB_URL invalide');
  return { user: match[1], password: match[2], host: match[3], port: match[4], db: match[5] };
}

// Extraire le project ref depuis l'URL
function getProjectRef(dbUrl) {
  // user est souvent postgres.PROJECT_REF
  const { user } = parseDbUrl(dbUrl);
  const parts = user.split('.');
  return parts.length > 1 ? parts[1] : null;
}

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS fiches_paie (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emp_id TEXT, ename TEXT, period TEXT, month INT, year INT,
    gross NUMERIC(12,2), net NUMERIC(12,2), onss_w NUMERIC(12,2),
    onss_e NUMERIC(12,2), pp NUMERIC(12,2), cost_total NUMERIC(12,2),
    net_factor NUMERIC(8,4), prime_emploi NUMERIC(12,2) DEFAULT 0,
    bonus_emploi NUMERIC(12,2) DEFAULT 0, cheques_repas NUMERIC(12,2) DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(), created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS absences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emp_id TEXT NOT NULL, emp_nom TEXT, type TEXT DEFAULT 'conge_annuel',
    date_debut TEXT NOT NULL, date_fin TEXT NOT NULL,
    jours_ouvrables NUMERIC(5,1) DEFAULT 1, statut TEXT DEFAULT 'demande',
    motif TEXT, approuve_par TEXT, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS mandats_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, data JSONB, generated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS legal_watch_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sources_ok INT DEFAULT 0, sources_error INT DEFAULT 0,
    calendar_alerts INT DEFAULT 0, sources_data JSONB, alerts_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT, bce TEXT, vat TEXT, adresse TEXT, email TEXT, tel TEXT, iban TEXT,
    contact_nom TEXT, type TEXT DEFAULT 'fiduciaire',
    actif BOOLEAN DEFAULT true, notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS clotures_historique (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    periode TEXT NOT NULL, annee INT NOT NULL, mois INT NOT NULL,
    nb_employes INT DEFAULT 0, nb_fiches INT DEFAULT 0,
    masse_brute NUMERIC(14,2) DEFAULT 0,
    closed_at TIMESTAMPTZ DEFAULT NOW(), closed_by TEXT, status TEXT DEFAULT 'closed'
  )`,
  `CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, periode TEXT, annee INT, trimestre INT, mois INT,
    status TEXT DEFAULT 'submitted', reference TEXT, montant NUMERIC(14,2),
    xml_content TEXT, notes TEXT, submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS app_state (key TEXT PRIMARY KEY, val TEXT, updated_at TIMESTAMPTZ DEFAULT NOW())`,
  `ALTER TABLE fiches_paie ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE absences ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE mandats_log ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE clients ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE clotures_historique ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE declarations ENABLE ROW LEVEL SECURITY`,
  `DROP POLICY IF EXISTS "fiches_paie_owner" ON fiches_paie`,
  `CREATE POLICY "fiches_paie_owner" ON fiches_paie FOR ALL USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "absences_owner" ON absences`,
  `CREATE POLICY "absences_owner" ON absences FOR ALL USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "mandats_log_owner" ON mandats_log`,
  `CREATE POLICY "mandats_log_owner" ON mandats_log FOR ALL USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "clients_owner" ON clients`,
  `CREATE POLICY "clients_owner" ON clients FOR ALL USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "clotures_owner" ON clotures_historique`,
  `CREATE POLICY "clotures_owner" ON clotures_historique FOR ALL USING (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "declarations_owner" ON declarations`,
  `CREATE POLICY "declarations_owner" ON declarations FOR ALL USING (auth.uid() = user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_fiches_user ON fiches_paie(user_id, year DESC, month DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_fiches_emp ON fiches_paie(user_id, emp_id)`,
  `CREATE INDEX IF NOT EXISTS idx_absences_user_emp ON absences(user_id, emp_id)`,
  `CREATE INDEX IF NOT EXISTS idx_clients_user ON clients(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_legal_watch_date ON legal_watch_log(checked_at DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_clotures_unique ON clotures_historique(user_id, annee, mois)`,
  `CREATE INDEX IF NOT EXISTS idx_declarations_user ON declarations(user_id, type, created_at DESC)`,
];

async function execSQL(sql, serviceKey, projectRef) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: `${projectRef}.supabase.co`,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function execSQLDirect(sql, serviceKey, projectRef) {
  // Utiliser l'endpoint SQL direct de Supabase Management API
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const projectRef = process.env.SUPABASE_PROJECT_REF || 'jwjtlpewwdjxdboxtbdf';
  
  if (!dbUrl && !serviceKey) {
    console.error('❌ SUPABASE_DB_URL ou SUPABASE_SERVICE_ROLE_KEY requis');
    process.exit(1);
  }

  // Utiliser pg si SUPABASE_DB_URL disponible
  if (dbUrl) {
    console.log('📡 Connexion via PostgreSQL direct...');
    try {
      const { Client } = require('pg');
      const client = new Client({ 
        connectionString: dbUrl, 
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 15000
      });
      
      await client.connect();
      console.log('✅ Connecté!');
      
      let ok = 0, errors = 0;
      for (const sql of SQL_STATEMENTS) {
        try {
          await client.query(sql);
          console.log('  ✅', sql.slice(0, 60).replace(/\n/g, ' ').trim());
          ok++;
        } catch (err) {
          // Ignorer erreurs "already exists"
          if (err.message.includes('already exists') || err.message.includes('does not exist')) {
            console.log('  ⏭️ ', sql.slice(0, 50).trim(), '(déjà ok)');
            ok++;
          } else {
            console.error('  ❌', sql.slice(0, 50).trim(), ':', err.message);
            errors++;
          }
        }
      }
      
      await client.end();
      console.log(`\n✅ Migration terminée: ${ok} OK, ${errors} erreurs`);
      
      // Lister tables créées
      const client2 = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await client2.connect();
      const result = await client2.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
      console.log('\n📋 Tables dans public schema:');
      result.rows.forEach(r => console.log('  -', r.table_name));
      await client2.end();
      
      if (errors > 0) process.exit(1);
      
    } catch (err) {
      console.error('❌ Erreur connexion:', err.message);
      console.log('Code:', err.code);
      process.exit(1);
    }
  }
}

run();
