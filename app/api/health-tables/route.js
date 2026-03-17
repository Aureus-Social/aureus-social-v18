import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Route protégée — accès admin seulement
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  const isAdmin = authHeader === `Bearer ${cronSecret}`;

  // Vérifier aussi token Supabase valide
  if (!isAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key && authHeader?.startsWith('Bearer ')) {
      const s = createClient(url, key);
      const { data: { user }, error } = await s.auth.getUser(authHeader.slice(7));
      // Vérifier email admin
      const adminEmails = ['moussati.nourdin@gmail.com', 'info@aureus-ia.com'];
      if (error || !user || !adminEmails.includes(user.email)) {
        return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }
  }

  const u = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!u || !k) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  const s = createClient(u, k);

  const tables = ['employes', 'entreprises', 'factures', 'dimona_declarations',
    'fiches_paie', 'absences', 'mandats_log', 'legal_watch_log',
    'clients', 'clotures_historique', 'declarations', 'app_state',
    'audit_log', 'error_logs'];

  const status = {};
  for (const table of tables) {
    try {
      const { count, error } = await s.from(table).select('*', { count: 'exact', head: true });
      status[table] = error ? { exists: false, error: 'Access denied' } : { exists: true, rows: count };
    } catch {
      status[table] = { exists: false };
    }
  }

  const existing = Object.entries(status).filter(([, v]) => v.exists).map(([k]) => k);
  const missing = Object.entries(status).filter(([, v]) => !v.exists).map(([k]) => k);
  return NextResponse.json({ ok: missing.length === 0, existing, missing });
}
