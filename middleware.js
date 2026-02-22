import { NextResponse } from 'next/server';
const rateMap = new Map();
const RATE_LIMIT = 60;
const AUTH_RATE_LIMIT = 10;
function checkRateLimit(ip, limit = RATE_LIMIT) {
  const now = Date.now();
  const windowMs = 60000;
  const entry = rateMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
  entry.count++;
  rateMap.set(ip, entry);
  if (rateMap.size > 10000) { for (const [k, v] of rateMap) { if (now > v.resetAt) rateMap.delete(k); } }
  return entry.count <= limit;
}
export function middleware(request) {
  const { pathname } = request.nextUrl;
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  if (pathname.startsWith('/api/')) {
    const limit = pathname.includes('auth') ? AUTH_RATE_LIMIT : RATE_LIMIT;
    if (!checkRateLimit(ip, limit)) { return NextResponse.json({ error: 'Too many requests' }, { status: 429 }); }
    const origin = process.env.ALLOWED_ORIGIN || 'https://aureussocial.be';
    if (request.method === 'OPTIONS') { return new NextResponse(null, { status: 204, headers: { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } }); }
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    return response;
  }
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
