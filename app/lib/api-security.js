// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — API RATE LIMITER (Item #33)
// Token-based + IP-based rate limiting for REST API v1
// ═══════════════════════════════════════════════════════════

const tokenLimits = new Map(); // per-token limits
const ipLimits = new Map();    // per-IP limits

const WINDOW_MS = 60000; // 1 minute window
const TOKEN_LIMIT = 120; // 120 req/min per token
const IP_LIMIT = 30;     // 30 req/min per IP (unauthenticated)
const CLEANUP_THRESHOLD = 5000;

function checkLimit(map, key, limit) {
  const now = Date.now();
  const entry = map.get(key);
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }
  entry.count++;
  map.set(key, entry);
  // Cleanup old entries periodically
  if (map.size > CLEANUP_THRESHOLD) {
    for (const [k, v] of map) { if (now > v.resetAt) map.delete(k); }
  }
  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt
  };
}

export function apiRateLimit(request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') || 'unknown';

  // Token-based (higher limit)
  if (token) {
    const result = checkLimit(tokenLimits, token, TOKEN_LIMIT);
    return {
      ...result,
      headers: {
        'X-RateLimit-Limit': String(TOKEN_LIMIT),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
      }
    };
  }

  // IP-based (lower limit for unauthenticated)
  const result = checkLimit(ipLimits, ip, IP_LIMIT);
  return {
    ...result,
    headers: {
      'X-RateLimit-Limit': String(IP_LIMIT),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
    }
  };
}

// Middleware-style helper
export function withRateLimit(handler) {
  return async function(request, ...args) {
    const rl = apiRateLimit(request);
    if (!rl.allowed) {
      return Response.json(
        { error: 'Rate limit exceeded', retryAfter: 60 },
        { status: 429, headers: { ...rl.headers, 'Retry-After': '60' } }
      );
    }
    const response = await handler(request, ...args);
    // Add rate limit headers to successful responses
    if (response instanceof Response) {
      const newHeaders = new Headers(response.headers);
      Object.entries(rl.headers).forEach(([k, v]) => newHeaders.set(k, v));
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });
    }
    return response;
  };
}

// ═══ AUDIT LOGGER (Item #36) ═══
export async function auditLog(supabase, action, details = {}) {
  try {
    await supabase.from('audit_log').insert({
      action,
      details: typeof details === 'string' ? { message: details } : details,
      timestamp: new Date().toISOString(),
      ip: details._ip || null,
      user_agent: details._ua || null,
    });
  } catch (e) {
    console.warn('[AuditLog]', e.message);
  }
}
