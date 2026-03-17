import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return NextResponse.json({ error: 'Variables Supabase manquantes', url: !!url, key: !!key }, { status: 500 });
  }

  const supabase = createClient(url, key);
  const tables = ['employes', 'entreprises', 'factures', 'dimona_declarations', 
                  'fiches_paie', 'absences', 'mandats_log', 'legal_watch_log', 
                  'clients', 'clotures_historique', 'declarations', 'app_state',
                  'audit_log', 'error_logs', 'fiches_paie'];

  const status = {};
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        status[table] = { exists: false, error: error.message };
      } else {
        status[table] = { exists: true, rows: count };
      }
    } catch (e) {
      status[table] = { exists: false, error: e.message };
    }
  }

  const existing = Object.entries(status).filter(([,v]) => v.exists).map(([k]) => k);
  const missing = Object.entries(status).filter(([,v]) => !v.exists).map(([k]) => k);

  return NextResponse.json({ 
    ok: missing.length === 0,
    existing,
    missing,
    details: status
  });
}
