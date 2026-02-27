// Aureus Social Pro — Invitation API
// POST: Create invitation and send email
// GET: Accept invitation by token

import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, role, tenant_id, invited_by, portal_type } = body;

    if (!email || !role) {
      return Response.json({ error: 'Email et rôle requis' }, { status: 400 });
    }

    // Validate role
    const validRoles = ['admin', 'gestionnaire', 'comptable', 'readonly', 'client', 'employee'];
    if (!validRoles.includes(role)) {
      return Response.json({ error: 'Rôle invalide: ' + role }, { status: 400 });
    }

    // Check if SUPABASE_SERVICE_ROLE_KEY is set
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Dev mode — log and return success
      if(process.env.NODE_ENV==='development') console.log('[INVITE-DEV]', { email, role, tenant_id });
      return Response.json({
        success: true,
        mode: 'dev',
        message: 'Invitation logged (no SERVICE_ROLE_KEY configured)',
        invite_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://aureussocial.be'}?portal=${portal_type || role}&invite=dev-token`,
      });
    }

    // Create invitation record
    const { data: invite, error: inviteError } = await getSupabaseAdmin()
      .from('invitations')
      .insert({
        email: email.toLowerCase().trim(),
        role,
        tenant_id: tenant_id || null,
        invited_by: invited_by || null,
      })
      .select()
      .single();

    if (inviteError) {
      return Response.json({ error: 'Erreur création invitation: ' + inviteError.message }, { status: 500 });
    }

    // Build invitation URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aureussocial.be';
    const portalParam = role === 'employee' ? 'employee' : role === 'client' ? 'client' : '';
    const inviteUrl = `${appUrl}${portalParam ? '?portal=' + portalParam + '&' : '?'}invite=${invite.token}`;

    // Send invitation email via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const portalName = role === 'employee' ? 'Portail Employé' : role === 'client' ? 'Portail Client' : 'Aureus Social Pro';
      const htmlEmail = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
          <div style="text-align:center;margin-bottom:20px">
            <span style="font-size:24px;font-weight:800;color:#c6a34e;font-family:Georgia,serif">AUREUS SOCIAL PRO</span>
          </div>
          <h2 style="color:#1a1a2e">Invitation — ${portalName}</h2>
          <p>Bonjour,</p>
          <p>Vous avez été invité(e) à rejoindre <strong>${portalName}</strong> avec le rôle <strong>${role}</strong>.</p>
          <p style="text-align:center;margin:24px 0">
            <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#c6a34e;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
              Accepter l'invitation
            </a>
          </p>
          <p style="font-size:11px;color:#888">Ce lien expire dans 7 jours.</p>
          <p style="font-size:11px;color:#888">Si vous n'avez pas demandé cette invitation, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
          <p style="font-size:9px;color:#999;text-align:center">Aureus Social Pro — Aureus IA SPRL — BCE BE 1028.230.781</p>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Aureus Social Pro <noreply@aureussocial.be>',
          to: [email],
          subject: `Invitation — ${portalName}`,
          html: htmlEmail,
        }),
      });
    }

    // For employee invitations: also create a magic link
    if (role === 'employee') {
      const { data: magicLink, error: mlError } = await getSupabaseAdmin().auth.admin.generateLink({
        type: 'magiclink',
        email: email.toLowerCase().trim(),
        options: {
          data: {
            role: 'employee',
            portal_type: 'employee',
            tenant_id: tenant_id || null,
          },
          redirectTo: `${appUrl}?portal=employee`,
        },
      });
      
      if (!mlError && magicLink?.properties?.action_link) {
        return Response.json({
          success: true,
          invite_id: invite.id,
          invite_url: inviteUrl,
          magic_link: magicLink.properties.action_link,
          message: 'Invitation envoyée avec magic link',
        });
      }
    }

    return Response.json({
      success: true,
      invite_id: invite.id,
      invite_url: inviteUrl,
      message: 'Invitation envoyée à ' + email,
    });

  } catch (error) {
    console.error('[INVITE-ERROR]', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// GET: Accept invitation
export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.json({ error: 'Token requis' }, { status: 400 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ success: true, mode: 'dev', message: 'Invitation acceptée (dev mode)' });
  }

  try {
    // Find invitation
    const { data: invite, error } = await getSupabaseAdmin()
      .from('invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .single();

    if (error || !invite) {
      return Response.json({ error: 'Invitation invalide ou expirée' }, { status: 404 });
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return Response.json({ error: 'Invitation expirée' }, { status: 410 });
    }

    // Mark as accepted
    await getSupabaseAdmin()
      .from('invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id);

    return Response.json({
      success: true,
      role: invite.role,
      tenant_id: invite.tenant_id,
      email: invite.email,
      message: 'Invitation acceptée. Connectez-vous pour accéder au portail.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
