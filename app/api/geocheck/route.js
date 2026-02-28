// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — GeoIP Login Check (Item 29)
// Detects geographic anomalies on login and flags suspicious access
// Uses ip-api.com (free, no key, 45 req/min) for geolocation
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const ALLOWED_COUNTRIES = ['BE', 'FR', 'NL', 'LU', 'DE']; // Benelux + neighbors
const GEO_API = 'http://ip-api.com/json/';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip') || 'unknown';

    const body = await request.json().catch(() => ({}));
    const userId = body.userId || 'anonymous';
    const userEmail = body.email || '';

    // Skip for local/private IPs
    if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('10.') ||
        ip.startsWith('192.168.') || ip.startsWith('172.')) {
      return Response.json({ ok: true, geo: { country: 'LOCAL', suspicious: false } });
    }

    // Lookup GeoIP
    let geo = { country: 'UNKNOWN', countryCode: '??', city: '', isp: '', suspicious: false };
    try {
      const res = await fetch(`${GEO_API}${ip}?fields=status,country,countryCode,city,isp,org,lat,lon`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success') {
          geo = {
            country: data.country,
            countryCode: data.countryCode,
            city: data.city,
            isp: data.isp || data.org,
            lat: data.lat,
            lon: data.lon,
            suspicious: !ALLOWED_COUNTRIES.includes(data.countryCode),
          };
        }
      }
    } catch { /* GeoIP lookup failed — continue without blocking */ }

    // Log to Supabase audit_log if suspicious
    if (geo.suspicious && supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('audit_log').insert({
          action: 'GEO_ALERT',
          details: {
            ip,
            userId,
            email: userEmail,
            country: geo.country,
            countryCode: geo.countryCode,
            city: geo.city,
            isp: geo.isp,
            severity: 'high',
            message: `Connexion depuis ${geo.country} (${geo.city}) — pays non autorisé`,
          },
          timestamp: new Date().toISOString(),
          ip,
        });
      } catch { /* audit log is best-effort */ }
    }

    return Response.json({
      ok: true,
      geo: {
        country: geo.country,
        countryCode: geo.countryCode,
        city: geo.city,
        suspicious: geo.suspicious,
      },
      alert: geo.suspicious ? {
        level: 'warning',
        message: `Connexion inhabituelle depuis ${geo.country} (${geo.city}). Si ce n'est pas vous, changez votre mot de passe immédiatement.`,
      } : null,
    });
  } catch (err) {
    return Response.json({ ok: true, geo: { suspicious: false }, error: 'GeoIP unavailable' });
  }
}

export async function GET() {
  return Response.json({
    service: 'Aureus Social Pro — GeoIP Check',
    allowedCountries: ALLOWED_COUNTRIES,
    status: 'ok',
  });
}
