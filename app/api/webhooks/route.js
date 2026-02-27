export const runtime = 'edge';
export async function POST(request) {
  try {
    const { event, data, webhookUrl, secret } = await request.json();
    if (!webhookUrl || !event) { return Response.json({ error: 'required' }, { status: 400 }); }
    const payload = { event, data, timestamp: new Date().toISOString(), source: 'aureus-social-pro' };
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret || 'default'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(JSON.stringify(payload))))).map(b => b.toString(16).padStart(2, '0')).join('');
    const resp = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Aureus-Signature': sig, 'X-Aureus-Event': event }, body: JSON.stringify(payload) });
    return Response.json({ delivered: resp.ok, status: resp.status, event });
  } catch (e) { return Response.json({ error: e.message }, { status: 500 }); }
}
export async function GET() { return Response.json({ events: ['payroll.calculated','employee.created','declaration.submitted','cloture.monthly'], signature: 'HMAC-SHA256' }); }
