// Aureus Social Pro — Push Notifications API
// POST /api/push/subscribe — Save push subscription
// POST /api/push/send — Send push notification to subscribers

import webPush from 'web-push';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = 'mailto:info@aureus-ia.com';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.warn('[PUSH] VAPID keys not configured — push notifications disabled');
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request) {
  try {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      return Response.json({ error: 'Push notifications not configured — VAPID keys missing' }, { status: 503 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'subscribe';
    const body = await request.json();

    webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

    if (action === 'subscribe') {
      // Save push subscription
      const { subscription, user_email, tenant_id } = body;
      if (!subscription?.endpoint) {
        return Response.json({ error: 'Subscription invalide' }, { status: 400 });
      }

      // Try Supabase first
      const sb = getSupabase();
      if (sb) {
        await sb.from('push_subscriptions').upsert({
          endpoint: subscription.endpoint,
          keys_p256dh: subscription.keys?.p256dh,
          keys_auth: subscription.keys?.auth,
          user_email: user_email || '',
          tenant_id: tenant_id || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'endpoint' });
      } else {
        // No Supabase available — reject
        return Response.json({ error: 'Push storage unavailable — configure Supabase' }, { status: 503 });
      }

      return Response.json({ success: true, message: 'Abonnement push enregistré' });
    }

    if (action === 'send') {
      // Send push notification
      const { title, body: msgBody, url: notifUrl, tag, tenant_id, target_email, urgent } = body;

      if (!title) {
        return Response.json({ error: 'Titre requis' }, { status: 400 });
      }

      const payload = JSON.stringify({
        title,
        body: msgBody || '',
        icon: '/icon-192.png',
        badge: '/favicon-32.png',
        tag: tag || 'aureus-' + Date.now(),
        url: notifUrl || '/',
        event: tag,
        urgent: urgent || false,
        actions: [
          { action: 'open', title: 'Ouvrir' },
          { action: 'dismiss', title: 'Fermer' },
        ],
      });

      let targets = [];
      const sb = getSupabase();
      
      if (sb) {
        let query = sb.from('push_subscriptions').select('*');
        if (tenant_id) query = query.eq('tenant_id', tenant_id);
        if (target_email) query = query.eq('user_email', target_email);
        const { data } = await query;
        targets = (data || []).map(d => ({
          endpoint: d.endpoint,
          keys: { p256dh: d.keys_p256dh, auth: d.keys_auth },
        }));
      } else {
        return Response.json({ error: 'Push storage unavailable — configure Supabase' }, { status: 503 });
      }

      let sent = 0, failed = 0;
      for (const sub of targets) {
        try {
          await webPush.sendNotification(sub, payload);
          sent++;
        } catch (e) {
          failed++;
          // Remove invalid subscription
          if (e.statusCode === 410 || e.statusCode === 404) {
            if (sb) {
              await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            }
          }
        }
      }

      return Response.json({ success: true, sent, failed, total: targets.length });
    }

    if (action === 'vapid') {
      // Return public VAPID key
      return Response.json({ publicKey: VAPID_PUBLIC });
    }

    return Response.json({ error: 'Action inconnue. Utilisez: subscribe, send, vapid' }, { status: 400 });

  } catch (error) {
    console.error('[PUSH-ERROR]', error.message);
    return Response.json({ error: 'Internal push error' }, { status: 500 });
  }
}

// GET: Return VAPID public key (public key only, never private)
export async function GET() {
  return Response.json({
    publicKey: VAPID_PUBLIC || null,
    supported: !!VAPID_PUBLIC,
    provider: 'web-push',
  });
}
