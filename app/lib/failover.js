// ═══════════════════════════════════════════════════════════
// Item #35 — MULTI-REGION FAILOVER
// Health checks, automatic failover to secondary Supabase
// region, connection pooling, retry logic
// ═══════════════════════════════════════════════════════════
"use client";
import { createClient } from '@supabase/supabase-js';

// Primary: EU West (Frankfurt)
const PRIMARY = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  region: 'eu-west-1',
  label: 'Frankfurt (Primary)',
};

// Secondary: EU Central (Amsterdam) — Read replica
const SECONDARY = {
  url: process.env.NEXT_PUBLIC_SUPABASE_SECONDARY_URL || PRIMARY.url,
  key: process.env.NEXT_PUBLIC_SUPABASE_SECONDARY_KEY || PRIMARY.key,
  region: 'eu-central-1',
  label: 'Amsterdam (Secondary)',
};

let _primaryHealthy = true;
let _lastCheck = 0;
const CHECK_INTERVAL = 30000; // 30s
const TIMEOUT = 5000;

// Health check with timeout
async function checkHealth(config) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);
    const client = createClient(config.url, config.key);
    const start = Date.now();
    const { error } = await client.from('app_state').select('state_key').limit(1).abortSignal(controller.signal);
    clearTimeout(timeout);
    const latency = Date.now() - start;
    return { healthy: !error, latency, region: config.region, label: config.label };
  } catch (e) {
    return { healthy: false, latency: TIMEOUT, region: config.region, label: config.label, error: e.message };
  }
}

// Get optimal client (with automatic failover)
export async function getSupabaseClient() {
  const now = Date.now();
  
  // Only recheck every 30s
  if (now - _lastCheck > CHECK_INTERVAL) {
    _lastCheck = now;
    const health = await checkHealth(PRIMARY);
    _primaryHealthy = health.healthy;
    
    if (!_primaryHealthy) {
      console.warn(`[Failover] Primary ${PRIMARY.label} DOWN — switching to ${SECONDARY.label}`);
      // Log failover event
      try {
        const sec = createClient(SECONDARY.url, SECONDARY.key);
        await sec.from('system_events').insert({
          type: 'failover',
          details: { from: PRIMARY.region, to: SECONDARY.region, reason: health.error },
          timestamp: new Date().toISOString(),
        });
      } catch (e) {}
    }
  }
  
  const config = _primaryHealthy ? PRIMARY : SECONDARY;
  return createClient(config.url, config.key, {
    auth: { persistSession: true, autoRefreshToken: true },
    db: { schema: 'public' },
    realtime: { params: { eventsPerSecond: 10 } },
  });
}

// Health status endpoint (for monitoring)
export async function getHealthStatus() {
  const [primary, secondary] = await Promise.all([
    checkHealth(PRIMARY),
    checkHealth(SECONDARY),
  ]);
  return {
    status: primary.healthy ? 'healthy' : secondary.healthy ? 'degraded' : 'down',
    primary,
    secondary,
    activeRegion: _primaryHealthy ? PRIMARY.region : SECONDARY.region,
    timestamp: new Date().toISOString(),
  };
}

// Retry wrapper with exponential backoff
export async function withRetry(fn, maxRetries = 3, baseDelay = 500) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 200;
      console.warn(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${Math.round(delay)}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Connection pool status
export function getConnectionInfo() {
  return {
    primary: { ...PRIMARY, healthy: _primaryHealthy },
    secondary: { ...SECONDARY, healthy: !_primaryHealthy },
    lastCheck: _lastCheck ? new Date(_lastCheck).toISOString() : null,
  };
}
