// app/api/save-beacon/route.js — Aureus Social Pro
// Handles navigator.sendBeacon on page close for data persistence
// This ensures no data is lost when the user closes the browser

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
      // No Supabase config — just acknowledge
      return Response.json({ success: true, mode: 'noop' });
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
      console.error('[SAVE-BEACON] Supabase error:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, mode: 'supabase' });
  } catch (error) {
    console.error('[SAVE-BEACON] Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
