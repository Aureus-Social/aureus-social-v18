import { NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — SECURITY MIDDLEWARE
// HSTS + CSP + Rate Limiting + Brute Force Protection
// ═══════════════════════════════════════════════════════════

// Rate limiting maps
const rateMap = new Map();
const authAttempts = new Map(); // Brute force protection
const RATE_LIMIT = 60; // 60 req/min general
const AUTH_RATE_LIMIT = 5; // 5 auth attempts max
const AUTH_BLOCK_MS = 30 * 60 * 1000; // 30 min block after exceeded
const WINDOW_MS = 60000;

function checkRateLimit(ip, limit = RATE_LIMIT) {
  const now = Date.now();
  const entry = rateMap.get(ip) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + WINDOW_MS; }
  entry.count++;
  rateMap.set(ip, entry);
  if (rateMap.size > 10000) { for (const [k, v] of rateMap) { if (now > v.resetAt) rateMap.delete(k); } }
  return entry.count <= limit;
}

function checkAuthBruteForce(ip) {
  const now = Date.now();
  const entry = authAttempts.get(ip);
  if (!entry) { authAttempts.set(ip, { count: 1, firstAt: now, blockedUntil: 0 }); return { allowed: true, remaining: AUTH_RATE_LIMIT - 1 }; }
  // Blocked?
  if (entry.blockedUntil > now) { return { allowed: false, remaining: 0, blockedUntil: entry.blockedUntil, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) }; }
  // Reset window if > 15min since first attempt
  if (now - entry.firstAt > 15 * 60 * 1000) { entry.count = 1; entry.firstAt = now; entry.blockedUntil = 0; return { allowed: true, remaining: AUTH_RATE_LIMIT - 1 }; }
  entry.count++;
  if (entry.count > AUTH_RATE_LIMIT) { entry.blockedUntil = now + AUTH_BLOCK_MS; return { allowed: false, remaining: 0, retryAfter: AUTH_BLOCK_MS / 1000 }; }
  return { allowed: true, remaining: AUTH_RATE_LIMIT - entry.count };
}

// CSP Policy — Strict but functional
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://*.supabase.co",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://*.supabase.co https://*.googleapis.com",
  "connect-src 'self' https://*.supabase.co https://*.vercel.app wss://*.supabase.co https://ipapi.co https://*.aureussocial.be",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || '';

  // ── API ROUTES ──
  if (pathname.startsWith('/api/')) {
    // Auth endpoints: strict brute force protection
    if (pathname.includes('auth') || pathname.includes('login') || pathname.includes('signin')) {
      if (request.method === 'POST') {
        const bf = checkAuthBruteForce(ip);
        if (!bf.allowed) {
          return NextResponse.json(
            { error: 'Trop de tentatives. Réessayez dans ' + Math.ceil(bf.retryAfter / 60) + ' minutes.', blocked: true, retryAfter: bf.retryAfter },
            { status: 429, headers: { 'Retry-After': String(bf.retryAfter), 'X-RateLimit-Remaining': '0' } }
          );
        }
      }
    }
    // General API rate limiting
    const limit = pathname.includes('auth') ? 10 : RATE_LIMIT;
    if (!checkRateLimit(ip, limit)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
    }
    // CORS
    const origin = request.headers.get('origin') || '';
    const allowedOrigins = [process.env.ALLOWED_ORIGIN, 'https://aureussocial.be', 'https://aureus-social-v18.vercel.app', 'http://localhost:3000'].filter(Boolean);
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
    response.headers.set('X-Request-Id', crypto.randomUUID());
    return response;
  }

  // ── ALL ROUTES — Security Headers ──
  const response = NextResponse.next();

  // HSTS — Force HTTPS (2 years, include subdomains, preload)
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

  // Content Security Policy
  response.headers.set('Content-Security-Policy', CSP_POLICY);

  // Anti-clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // MIME sniffing protection
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy — Disable unnecessary browser features
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');

  // Prevent information leakage
  response.headers.set('X-Powered-By', '');
  response.headers.set('Server', '');

  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
