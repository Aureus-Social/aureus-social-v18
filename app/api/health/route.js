// ═══════════════════════════════════════════════════════════
// HEALTH CHECK API (Hardened)
// Public: basic status only
// Authenticated (deep=true + valid token): DB, memory details
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OK='ok', DEGRADED='degraded', DOWN='down';

async function checkDB() {
  const t = Date.now();
  try {
    if (!supabaseUrl || !supabaseKey) return { status: DOWN, latencyMs: 0, error: 'Not configured' };
    const sb = createClient(supabaseUrl, supabaseKey);
    const { error } = await sb.from('app_state').select('state_key').limit(1).maybeSingle();
    const ms = Date.now() - t;
    if (error) return { status: ms > 3000 ? DOWN : DEGRADED, latencyMs: ms };
    return { status: ms > 2000 ? DEGRADED : OK, latencyMs: ms };
  } catch (e) {
    return { status: DOWN, latencyMs: Date.now() - t };
  }
}

function checkMem() {
  try {
    const u = process.memoryUsage();
    const pct = Math.round((u.heapUsed / u.heapTotal) * 100);
    return { status: pct > 90 ? DEGRADED : OK, pct };
  } catch { return { status: OK, pct: 0 }; }
}

export async function GET(request) {
  const start = Date.now();
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === 'true';

  // Public response — minimal info
  const result = {
    status: OK,
    timestamp: new Date().toISOString(),
  };

  if (deep) {
    // Deep checks require CRON_SECRET or service token
    const auth = request.headers.get('authorization') || '';
    const cronSecret = process.env.CRON_SECRET;
    const isAuthed = cronSecret && auth === 'Bearer ' + cronSecret;

    const [db, mem] = await Promise.all([checkDB(), checkMem()]);
    const all = [db.status, mem.status];
    if (all.includes(DOWN)) result.status = DOWN;
    else if (all.includes(DEGRADED)) result.status = DEGRADED;

    // Only expose details to authenticated callers
    if (isAuthed) {
      result.database = db;
      result.memory = mem;
    }
  }

  result.responseMs = Date.now() - start;
  const code = result.status === DOWN ? 503 : result.status === DEGRADED ? 207 : 200;

  return Response.json(result, {
    status: code,
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'X-Health': result.status,
    }
  });
}
