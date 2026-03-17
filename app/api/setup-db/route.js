import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  // Protection: CRON_SECRET requis
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Config manquante' }, { status: 500 });

  const supabase = createClient(url, key);
  const results = [];
  const errors = [];

  // Tables à créer via upsert de structure
  // On utilise des requêtes SQL via l'API Supabase Management
  // ou via des inserts qui créent les tables implicitement

  // Vérifier quelles tables existent
  const tablesToCheck = ['employes', 'entreprises', 'factures', 'error_logs'];
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
    if (error?.code === 'PGRST106' || error?.message?.includes('does not exist')) {
      errors.push({ table, status: 'missing' });
    } else {
      results.push({ table, status: 'exists' });
    }
  }

  return NextResponse.json({ 
    ok: errors.length === 0,
    existing: results.map(r => r.table),
    missing: errors.map(e => e.table),
    message: errors.length > 0 
      ? `Tables manquantes: ${errors.map(e => e.table).join(', ')} - Executer le SQL manuellement`
      : 'Toutes les tables existent'
  });
}
