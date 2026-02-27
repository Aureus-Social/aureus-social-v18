import { NextResponse } from 'next/server';

// Rate limiting maps
const rateMap = new Map();
const RATE_LIMIT = 60;
const WINDOW_MS = 60000;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + WINDOW_MS; }
  entry.count++;
  rateMap.set(ip, entry);
  if (rateMap.size > 10000) { for (const [k, v] of rateMap) { if (now > v.resetAt) rateMap.delete(k); } }
  return entry.count <= RATE_LIMIT;
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // API ROUTES
  if (pathname.startsWith('/api/')) {
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = [
      process.env.ALLOWED_ORIGIN,
      'https://aureussocial.be', 'https://www.aureussocial.be',
      'https://app.aureussocial.be',
      'https://aureus-social-v18.vercel.app',
      'http://localhost:3000'
    ].filter(Boolean);
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || !origin;

    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': isAllowed ? origin : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-Id',
        'Access-Control-Max-Age': '86400',
      }});
    }
    const response = NextResponse.next();
    if (isAllowed) response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }

  // ALL ROUTES — Security Headers (no CSP for now to avoid blocking)
  const response = NextResponse.next();
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
