import { logInfo, logError, logWarn } from '../../lib/security/logger.js';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient((process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'), (process.env.SUPABASE_SERVICE_ROLE_KEY || ''))
  : null;

export async function POST(request) {
  try {
    // ─── Auth : seuls les utilisateurs connectés peuvent écrire dans l'audit_log
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const anonSupabase = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'),
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
    );
    const { data: { user: caller } } = await anonSupabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!caller) return Response.json({ error: 'Session invalide' }, { status: 401 });

    const { action, table_name, record_id, details, user_id, user_email } = await request.json();
    if (!action) return Response.json({ error: 'action required' }, { status: 400 });
    // Valider action — pas de SQL ou de code injecté
    if (typeof action !== 'string' || action.length > 100 || !/^[A-Z_]+$/.test(action)) {
      return Response.json({ error: 'action invalide' }, { status: 400 });
    }

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    const { error } = await supabase.from('audit_log').insert({
      action,
      table_name: table_name || null,
      record_id: record_id ? String(record_id) : null,
      details: details || null,
      user_id: user_id || null,
      user_email: user_email || null,
      ip_address: ip,
      user_agent: userAgent.substring(0, 200),
      created_at: new Date().toISOString()
    });

    if (error) {
      logError('API', '[Audit] Erreur insertion:', error.message);
      return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    // ─── Auth GET : seuls les admins peuvent lire l'audit_log ──────────────
    const getAuth = request.headers.get('Authorization');
    if (!getAuth?.startsWith('Bearer ')) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }
    const { data: { user: viewer } } = await anonSupabase.auth.getUser(getAuth.replace('Bearer ', ''));
    if (!viewer) return Response.json({ error: 'Session invalide' }, { status: 401 });
    const viewerRole = viewer.user_metadata?.role;
    if (viewerRole !== 'admin' && viewerRole !== 'comptable') {
      return Response.json({ error: 'Accès refusé — admin ou comptable requis' }, { status: 403 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { searchParams } = new URL(request.url);
    // Limiter à 100 max — parseInt sécurisé
    const rawLimit = parseInt(searchParams.get('limit') || '50', 10);
    const limit = isNaN(rawLimit) ? 50 : Math.min(Math.max(rawLimit, 1), 100);
    const table = searchParams.get('table');
    const userId = searchParams.get('user_id');

    // Valider les paramètres filtres
    const ALLOWED_TABLES = ['employees','clients','travailleurs','fiches_paie','dimona','documents','auth.users'];
    let query = supabase
      .from('audit_log')
      .select('id,action,table_name,record_id,user_id,user_email,ip_address,created_at,details')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (table && ALLOWED_TABLES.includes(table)) query = query.eq('table_name', table);
    if (userId && typeof userId === 'string' && userId.length <= 100) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });

    return Response.json({ logs: data, count: data.length });
  } catch (e) {
    return Response.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
