// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — Monitoring & Alertes (Item 18)
// Sentry error tracking + Slack/Discord webhook notifications
// Env vars: SENTRY_DSN, SLACK_WEBHOOK_URL, DISCORD_WEBHOOK_URL
// ═══════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js';

const SERVICES = [
  { id: 'api', name: 'API Health', url: '/api/health', critical: true },
  { id: 'auth', name: 'Supabase Auth', check: 'supabase', critical: true },
  { id: 'db', name: 'Database', check: 'supabase', critical: true },
  { id: 'email', name: 'Email (Resend)', url: '/api/send-email', critical: false },
  { id: 'agent', name: 'Agent IA', url: '/api/agent', critical: false },
  { id: 'esign', name: 'E-Signature', url: '/api/esign', critical: false },
  { id: 'dms', name: 'DMS Documents', url: '/api/dms', critical: false },
  { id: 'geoip', name: 'GeoIP Check', url: '/api/geocheck', critical: false },
];

// ── Sentry error reporting ──
async function reportToSentry(error, context = {}) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    const dsnMatch = dsn.match(/^https:\/\/([^@]+)@([^/]+)\/(.+)$/);
    if (!dsnMatch) return null;
    const [, publicKey, host, projectId] = dsnMatch;

    const event = {
      event_id: crypto.randomUUID().replace(/-/g, ''),
      timestamp: new Date().toISOString(),
      platform: 'node',
      server_name: 'aureus-social-pro',
      environment: process.env.NODE_ENV || 'production',
      release: 'aureus-social-v18@1.0.0',
      exception: {
        values: [{
          type: error.name || 'Error',
          value: error.message || String(error),
          stacktrace: error.stack ? {
            frames: error.stack.split('\n').slice(1, 6).map(line => ({
              filename: line.trim(),
              function: 'unknown',
            })),
          } : undefined,
        }],
      },
      tags: context.tags || {},
      extra: context.extra || {},
    };

    await fetch(`https://${host}/api/${projectId}/store/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=aureus/1.0, sentry_key=${publicKey}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(5000),
    });
    return event.event_id;
  } catch { return null; }
}

// ── Slack webhook ──
async function notifySlack(message, severity = 'info') {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return false;

  const color = severity === 'critical' ? '#dc2626' : severity === 'warning' ? '#f59e0b' : '#22c55e';
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: `Aureus Social Pro — ${severity.toUpperCase()}`,
          text: message,
          footer: 'Aureus Monitoring',
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    return true;
  } catch { return false; }
}

// ── Discord webhook ──
async function notifyDiscord(message, severity = 'info') {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;

  const color = severity === 'critical' ? 0xdc2626 : severity === 'warning' ? 0xf59e0b : 0x22c55e;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `Aureus Social Pro — ${severity.toUpperCase()}`,
          description: message,
          color,
          timestamp: new Date().toISOString(),
          footer: { text: 'Aureus Monitoring' },
        }],
      }),
      signal: AbortSignal.timeout(5000),
    });
    return true;
  } catch { return false; }
}

// ── Health check all services ──
async function checkAllServices(baseUrl) {
  const results = [];

  for (const svc of SERVICES) {
    const start = Date.now();
    let status = 'ok';
    let latencyMs = 0;
    let error = null;

    if (svc.check === 'supabase') {
      try {
        const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!sbUrl || !sbKey) { status = 'down'; error = 'Not configured'; }
        else {
          const sb = createClient(sbUrl, sbKey);
          const { error: dbErr } = await sb.from('app_state').select('state_key').limit(1).maybeSingle();
          latencyMs = Date.now() - start;
          if (dbErr) { status = latencyMs > 3000 ? 'down' : 'degraded'; error = dbErr.message; }
          else if (latencyMs > 2000) status = 'degraded';
        }
      } catch (e) { status = 'down'; error = e.message; latencyMs = Date.now() - start; }
    } else if (svc.url) {
      try {
        const res = await fetch(`${baseUrl}${svc.url}`, { signal: AbortSignal.timeout(5000) });
        latencyMs = Date.now() - start;
        if (!res.ok && res.status !== 401 && res.status !== 403) { status = res.status >= 500 ? 'down' : 'degraded'; }
        else if (latencyMs > 2000) status = 'degraded';
      } catch (e) { status = 'down'; error = e.message; latencyMs = Date.now() - start; }
    }

    results.push({ id: svc.id, name: svc.name, status, latencyMs, critical: svc.critical, error });
  }

  return results;
}

// POST /api/monitoring — Report error or trigger alert
export async function POST(request) {
  try {
    const body = await request.json();
    const { action, error, message, severity, context } = body;

    switch (action) {
      case 'error': {
        const errObj = new Error(error?.message || message || 'Unknown error');
        errObj.name = error?.name || 'ApplicationError';
        errObj.stack = error?.stack || '';
        const sentryId = await reportToSentry(errObj, context);
        if (severity === 'critical' || severity === 'warning') {
          await Promise.all([
            notifySlack(message || errObj.message, severity),
            notifyDiscord(message || errObj.message, severity),
          ]);
        }
        return Response.json({ ok: true, sentryId });
      }

      case 'alert': {
        const [slackOk, discordOk] = await Promise.all([
          notifySlack(message, severity || 'info'),
          notifyDiscord(message, severity || 'info'),
        ]);
        return Response.json({ ok: true, slack: slackOk, discord: discordOk });
      }

      default:
        return Response.json({ error: 'Unknown action. Use: error, alert' }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/monitoring — Full health check of all 8 services
export async function GET(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const results = await checkAllServices(baseUrl);

  const overall = results.some(r => r.critical && r.status === 'down') ? 'down'
    : results.some(r => r.status === 'down' || r.status === 'degraded') ? 'degraded'
    : 'ok';

  // Alert if any critical service is down
  if (overall === 'down') {
    const downServices = results.filter(r => r.status === 'down').map(r => r.name).join(', ');
    const msg = `Services DOWN: ${downServices}`;
    await Promise.all([
      notifySlack(msg, 'critical'),
      notifyDiscord(msg, 'critical'),
      reportToSentry(new Error(msg), { tags: { type: 'health_check' } }),
    ]);
  }

  const code = overall === 'down' ? 503 : overall === 'degraded' ? 207 : 200;

  return Response.json({
    status: overall,
    services: results,
    integrations: {
      sentry: !!process.env.SENTRY_DSN,
      slack: !!process.env.SLACK_WEBHOOK_URL,
      discord: !!process.env.DISCORD_WEBHOOK_URL,
    },
    timestamp: new Date().toISOString(),
  }, { status: code });
}
