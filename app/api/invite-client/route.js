import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

// POST — Inviter un client (créer compte + envoyer email)
export async function POST(request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  // Vérifier que c'est bien Nourdin (admin) qui invite
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const token = authHeader.slice(7);
  const { data: { user: caller }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !caller) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

  const body = await request.json();
  const { email, nom, bce, plan = 'starter', message_perso } = body;

  if (!email || !nom) {
    return NextResponse.json({ error: 'Email et nom requis' }, { status: 400 });
  }

  try {
    // 1. Créer le compte Supabase Auth avec invitation
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.aureussocial.be'}/onboarding`;
    
    const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: redirectUrl,
      data: {
        nom_entreprise: nom,
        bce: bce || '',
        plan,
        invited_by: caller.email,
        role: 'client',
      }
    });

    if (inviteErr) {
      // Si user existe déjà, envoyer un magic link
      if (inviteErr.message?.includes('already been registered')) {
        const { error: mlErr } = await admin.auth.admin.generateLink({
          type: 'magiclink',
          email,
          options: { redirectTo: redirectUrl }
        });
        if (mlErr) return NextResponse.json({ error: mlErr.message }, { status: 400 });
        return NextResponse.json({ ok: true, mode: 'existing_user', message: 'Lien de connexion envoyé' });
      }
      return NextResponse.json({ error: inviteErr.message }, { status: 400 });
    }

    const newUserId = inviteData.user?.id;

    // 2. Créer l'entrée dans la table clients (liée au compte Nourdin = caller)
    await admin.from('clients').insert([{
      user_id: caller.id,
      client_user_id: newUserId,
      nom,
      bce: bce || '',
      email,
      plan,
      actif: true,
      invited_at: new Date().toISOString(),
      invited_by: caller.id,
    }]);

    // 3. Créer l'entrée entreprise pour le nouveau client
    if (newUserId) {
      await admin.from('entreprises').upsert([{
        user_id: newUserId,
        nom,
        name: nom,
        bce: bce || '',
        email,
        created_at: new Date().toISOString(),
      }], { onConflict: 'user_id' });
    }

    // 4. Logger l'invitation
    await admin.from('audit_log').insert([{
      user_id: caller.id,
      action: 'INVITE_CLIENT',
      table_name: 'clients',
      details: { email, nom, bce, plan, new_user_id: newUserId },
      created_at: new Date().toISOString(),
    }]);

    // 5. Envoyer l'email de bienvenue branded Aureus
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.aureussocial.be';
      await fetch(`${appUrl}/api/send-welcome-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('authorization'),
        },
        body: JSON.stringify({ email, nom, plan, loginUrl: `${appUrl}/onboarding` }),
      });
    } catch (emailErr) {
      console.warn('[invite-client] Email bienvenue non envoyé:', emailErr.message);
      // On continue même si l'email échoue — l'invitation Supabase est déjà partie
    }

    return NextResponse.json({
      ok: true,
      mode: 'invited',
      userId: newUserId,
      message: `Invitation envoyée à ${email}. Le client recevra 2 emails : lien Supabase + email de bienvenue Aureus.`,
    });

  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — Lister les clients invités
export async function GET(request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const token = authHeader.slice(7);
  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

  const { data, error } = await admin.from('clients')
    .select('*')
    .eq('user_id', caller.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data || [] });
}

// DELETE — Désactiver un client
export async function DELETE(request) {
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  const token = authHeader.slice(7);
  const { data: { user: caller } } = await admin.auth.getUser(token);
  if (!caller) return NextResponse.json({ error: 'Token invalide' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('id');
  if (!clientId) return NextResponse.json({ error: 'id requis' }, { status: 400 });

  const { error } = await admin.from('clients')
    .update({ actif: false, desactive_at: new Date().toISOString() })
    .eq('id', clientId).eq('user_id', caller.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
