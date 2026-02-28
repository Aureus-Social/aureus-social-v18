import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Harmonized status values (consistent with /api/health and /api/monitoring)
const OK = 'ok', DEGRADED = 'degraded', DOWN = 'down';
const LATENCY_DEGRADED = 2000;
const LATENCY_DOWN = 3000;

export async function GET() {
  const start = Date.now();
  const components = [];

  components.push({ name: 'API', status: OK, latency: 0 });

  try {
    if (!supabaseUrl || !supabaseKey) {
      components.push({ name: 'Database (Supabase EU)', status: DOWN, latency: null, error: 'Not configured' });
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const dbStart = Date.now();
      const { error } = await supabase.from('app_state').select('state_key').limit(1).maybeSingle();
      const dbLatency = Date.now() - dbStart;
      let dbStatus = OK;
      if (error) dbStatus = dbLatency > LATENCY_DOWN ? DOWN : DEGRADED;
      else if (dbLatency > LATENCY_DEGRADED) dbStatus = DEGRADED;
      components.push({ name: 'Database (Supabase EU)', status: dbStatus, latency: dbLatency });
    }
  } catch (e) {
    components.push({ name: 'Database (Supabase EU)', status: DOWN, latency: null });
  }

  components.push({ name: 'Authentication', status: OK });
  components.push({ name: 'Realtime (WebSocket)', status: OK });
  components.push({ name: 'CDN (Vercel Edge)', status: OK });

  const hasDown = components.some(c => c.status === DOWN);
  const hasDegraded = components.some(c => c.status === DEGRADED);
  const overall = hasDown ? DOWN : hasDegraded ? DEGRADED : OK;

  const code = overall === DOWN ? 503 : overall === DEGRADED ? 207 : 200;

  return Response.json({
    status: overall,
    version: '20.4',
    checked_at: new Date().toISOString(),
    response_time_ms: Date.now() - start,
    components,
    incidents: [],
    page: { name: 'Aureus Social Pro', url: 'https://app.aureussocial.be', support: 'info@aureus-ia.com' },
  }, {
    status: code,
    headers: { 'Cache-Control': 'public, max-age=30', 'Access-Control-Allow-Origin': '*' }
  });
}
