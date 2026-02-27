// ═══════════════════════════════════════════════════════════
// Item #35 — HEALTH CHECK API (Enhanced)
// Deep health check: DB, memory, region, latency
// For load balancers, monitoring, multi-region failover
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const OK='ok', DEGRADED='degraded', DOWN='down';

async function checkDB() {
  const t = Date.now();
  try {
    const sb = createClient(supabaseUrl, supabaseKey);
    const { error } = await sb.from('app_state').select('key').limit(1).maybeSingle();
    const ms = Date.now() - t;
    if (error) return { status: ms > 3000 ? DOWN : DEGRADED, latencyMs: ms, error: error.message };
    return { status: ms > 2000 ? DEGRADED : OK, latencyMs: ms };
  } catch (e) {
    return { status: DOWN, latencyMs: Date.now() - t, error: e.message };
  }
}

function checkMem() {
  try {
    const u = process.memoryUsage();
    const pct = Math.round((u.heapUsed / u.heapTotal) * 100);
    return { status: pct > 90 ? DEGRADED : OK, heapMB: Math.round(u.heapUsed/1048576), pct };
  } catch { return { status: OK, heapMB: 0, pct: 0 }; }
}

export async function GET(request) {
  const start = Date.now();
  const url = new URL(request.url);
  const deep = url.searchParams.get('deep') === 'true';
  
  const result = {
    status: OK,
    version: '20.3',
    region: process.env.VERCEL_REGION || 'local',
    timestamp: new Date().toISOString(),
  };

  if (deep) {
    const [db, mem] = await Promise.all([checkDB(), checkMem()]);
    result.database = db;
    result.memory = mem;
    // Overall
    const all = [db.status, mem.status];
    if (all.includes(DOWN)) result.status = DOWN;
    else if (all.includes(DEGRADED)) result.status = DEGRADED;
  }

  result.responseMs = Date.now() - start;
  const code = result.status === DOWN ? 503 : result.status === DEGRADED ? 207 : 200;

  return Response.json(result, {
    status: code,
    headers: {
      'Cache-Control': 'no-cache, no-store',
      'X-Health': result.status,
      'X-Region': result.region,
    }
  });
}
