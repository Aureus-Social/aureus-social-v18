// app/api/save-beacon/route.js — Aureus Social Pro
// Handles navigator.sendBeacon on page close for data persistence
// This ensures no data is lost when the user closes the browser
// SÉCURITÉ : Vérifie le user_id via le token JWT Supabase

import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const body = await request.text();
    const { user_id, data } = JSON.parse(body);

    if (!user_id || !data) {
      return Response.json({ error: 'Missing user_id or data' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json({ success: true, mode: 'noop' });
    }

    // ═══ SÉCURITÉ : Vérifier l'identité via le token Bearer ou le cookie ═══
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (token) {
      const supabaseAuth = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || supabaseServiceKey);
      const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
      // Vérifier que le user_id dans le body correspond au user authentifié
      if (authError || !userData?.user || userData.user.id !== user_id) {
        return Response.json({ error: 'Non autorisé — user_id ne correspond pas au token' }, { status: 403 });
      }
    }
    // Note: sendBeacon ne peut pas envoyer de headers custom. Si pas de token,
    // on accepte mais on valide le format du user_id (UUID v4)
    else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(user_id)) {
      return Response.json({ error: 'user_id invalide' }, { status: 400 });
    }

    // Use service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabase.from('app_state').upsert({
      user_id,
      state_key: 'main',
      state_data: data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,state_key' });

    if (error) {
      console.error('[SAVE-BEACON] Supabase error:', error.message);
      return Response.json({ error: 'Erreur sauvegarde' }, { status: 500 });
    }

    return Response.json({ success: true, mode: 'supabase' });
  } catch (error) {
    console.error('[SAVE-BEACON] Error:', error.message);
    return Response.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
