// app/api/baremes/historique/route.js — Aureus Social Pro C9
// API pour consulter l'historique des modifications de barèmes
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/baremes/historique?limit=50
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const bareme_id = searchParams.get('bareme_id');

    let query = supabase
      .from('baremes_historique')
      .select(`
        *,
        baremes_legaux (annee, trimestre, categorie, cle, unite)
      `)
      .order('date_modification', { ascending: false })
      .limit(limit);

    if (bareme_id) query = query.eq('bareme_id', bareme_id);

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ ok: true, historique: data, total: data.length });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}