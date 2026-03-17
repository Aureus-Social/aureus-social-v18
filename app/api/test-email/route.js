import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

// Route test envoi email — admin seulement
export async function POST(request) {
  const auth = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Auth: CRON_SECRET ou token admin
  let isAuthorized = auth === `Bearer ${cronSecret}`;
  if (!isAuthorized) {
    const { createClient } = await import('@supabase/supabase-js');
    const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (auth?.startsWith('Bearer ')) {
      const { data: { user } } = await s.auth.getUser(auth.slice(7));
      const adminEmails = ['moussati.nourdin@gmail.com', 'info@aureus-ia.com'];
      isAuthorized = user && adminEmails.includes(user.email);
    }
  }
  if (!isAuthorized) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { email, type = 'welcome' } = await request.json();
  if (!email) return NextResponse.json({ error: 'email requis' }, { status: 400 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY manquant' }, { status: 500 });

  // Test simple
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Aureus Social Pro <onboarding@resend.dev>',
      to: [email],
      subject: 'Test email — Aureus Social Pro',
      html: '<h1 style="color:#c6a34e">Test OK</h1><p>Aureus Social Pro fonctionne.</p>',
    }),
  });

  const data = await res.json();
  return NextResponse.json({ ok: res.ok, status: res.status, data });
}
