import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

async function verifyUser(request) {
  const { createClient } = await import('@supabase/supabase-js');
  const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const { data: { user } } = await s.auth.getUser(auth.slice(7));
  return user || null;
}

export async function POST(request) {
  const caller = await verifyUser(request);
  if (!caller) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

  const { email, nom, plan, loginUrl } = await request.json();
  if (!email || !nom) return NextResponse.json({ error: 'email et nom requis' }, { status: 400 });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY manquant' }, { status: 500 });

  const appUrl = loginUrl || 'https://app.aureussocial.be';
  const planLabel = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }[plan] || 'Starter';

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bienvenue sur Aureus Social Pro</title>
</head>
<body style="margin:0;padding:0;background:#0c0b09;font-family:'Inter',system-ui,sans-serif;color:#e8e6e0;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- LOGO -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:32px;font-weight:800;color:#c6a34e;letter-spacing:3px;">AUREUS</div>
      <div style="font-size:11px;color:#5e5c56;margin-top:4px;letter-spacing:1px;">SOCIAL PRO</div>
    </div>

    <!-- CARD PRINCIPALE -->
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(198,163,78,.15);border-radius:16px;padding:40px;">

      <div style="font-size:24px;font-weight:700;color:#c6a34e;margin-bottom:8px;">
        Bienvenue, ${nom} 👋
      </div>
      <div style="font-size:14px;color:#9e9b93;margin-bottom:32px;line-height:1.6;">
        Votre accès à <strong style="color:#e8e6e0;">Aureus Social Pro</strong> est prêt.
        Votre secrétariat social digital belge vous attend.
      </div>

      <!-- BADGE PLAN -->
      <div style="display:inline-block;background:rgba(198,163,78,.12);border:1px solid rgba(198,163,78,.3);
        border-radius:20px;padding:6px 16px;font-size:11px;font-weight:700;color:#c6a34e;
        text-transform:uppercase;letter-spacing:1px;margin-bottom:32px;">
        Plan ${planLabel}
      </div>

      <!-- CTA BUTTON -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${appUrl}" style="display:inline-block;background:rgba(198,163,78,.2);
          color:#c6a34e;text-decoration:none;padding:16px 40px;border-radius:12px;
          font-weight:700;font-size:16px;border:1px solid rgba(198,163,78,.3);
          letter-spacing:.5px;">
          Accéder à mon espace →
        </a>
      </div>

      <!-- FEATURES -->
      <div style="border-top:1px solid rgba(255,255,255,.06);padding-top:28px;margin-top:28px;">
        <div style="font-size:12px;color:#5e5c56;margin-bottom:16px;text-transform:uppercase;letter-spacing:.5px;">
          Ce qui vous attend
        </div>
        <div style="display:grid;gap:12px;">
          ${[
            ['👥', 'Gestion des travailleurs', 'Contrats, absences, planning'],
            ['💰', 'Fiches de paie automatiques', 'Calcul ONSS, PP, net belge'],
            ['📤', 'Dimona en 1 clic', 'Déclarations ONSS simplifiées'],
            ['📋', 'Listing TVA Intervat', 'XML prêt à uploader sur MyMinfin'],
            ['⚖️', 'Veille légale quotidienne', 'Alertes droit social belge'],
          ].map(([icon, title, desc]) => `
          <div style="display:flex;gap:14px;align-items:flex-start;">
            <div style="font-size:20px;flex-shrink:0;">${icon}</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:#e8e6e0;">${title}</div>
              <div style="font-size:11px;color:#5e5c56;margin-top:2px;">${desc}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center;margin-top:32px;font-size:11px;color:#5e5c56;">
      <div style="margin-bottom:8px;">
        Aureus IA SPRL · Place Marcel Broodthaers 8, 1060 Saint-Gilles, Bruxelles
      </div>
      <div style="margin-bottom:8px;">
        <a href="mailto:info@aureus-ia.com" style="color:#c6a34e;text-decoration:none;">info@aureus-ia.com</a>
        · <a href="https://aureus-ia.com" style="color:#c6a34e;text-decoration:none;">aureus-ia.com</a>
      </div>
      <div style="color:#3a3835;">BCE BE 1028.230.781</div>
    </div>

  </div>
</body>
</html>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Aureus Social Pro <noreply@aureussocial.be>',
        to: [email],
        subject: `Votre accès Aureus Social Pro est prêt, ${nom.split(' ')[0]} !`,
        html,
        reply_to: 'info@aureus-ia.com',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      // Fallback: essayer avec le domaine Resend par défaut
      const res2 = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Aureus Social Pro <onboarding@resend.dev>',
          to: [email],
          subject: `Votre accès Aureus Social Pro est prêt, ${nom.split(' ')[0]} !`,
          html,
        }),
      });
      const data2 = await res2.json();
      if (!res2.ok) return NextResponse.json({ error: data2.message || 'Erreur envoi' }, { status: 500 });
      return NextResponse.json({ ok: true, id: data2.id, mode: 'fallback' });
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
