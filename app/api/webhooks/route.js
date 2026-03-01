export const runtime = 'edge';

function isValidWebhookUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname;
    if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '::1') return false;
    if (h.startsWith('192.168.') || h.startsWith('10.') || h.startsWith('172.')) return false;
    if (h === '169.254.169.254') return false;
    if (h.endsWith('.internal') || h.endsWith('.local')) return false;
    return true;
  } catch { return false; }
}

export async function POST(request) {
  try {
    const auth = request.headers.get('authorization');
    if (!auth?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { event, data, webhookUrl, secret } = await request.json();
    if (!webhookUrl || !event) { return Response.json({ error: 'required' }, { status: 400 }); }
    if (!isValidWebhookUrl(webhookUrl)) { return Response.json({ error: 'Invalid webhook URL — HTTPS required, private IPs forbidden' }, { status: 400 }); }
    const payload = { event, data, timestamp: new Date().toISOString(), source: 'aureus-social-pro' };
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret || 'default'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload))))).map(b => b.toString(16).padStart(2, '0')).join('');
    const resp = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Aureus-Signature': sig, 'X-Aureus-Event': event }, body: JSON.stringify(payload) });
    return Response.json({ delivered: resp.ok, status: resp.status, event });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
export async function GET() { return Response.json({ events: ['payroll.calculated','employee.created','declaration.submitted','cloture.monthly'], signature: 'HMAC-SHA256' }); }
