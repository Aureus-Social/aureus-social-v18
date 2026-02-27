// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — API /api/onss/status
//  Check ONSS connection status & configuration
// ═══════════════════════════════════════════════════════

import { AUREUS_ONSS, ENVS, getAccessToken } from '../../../lib/onss-client.js';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const testConnection = searchParams.get('test') === 'true';
  const env = searchParams.get('env') || 'simulation';

  const hasClientId = !!process.env.ONSS_CLIENT_ID;
  const hasPrivateKey = !!process.env.ONSS_PRIVATE_KEY;

  const status = {
    enterprise: AUREUS_ONSS,
    configuration: {
      identification: { status: 'OK', date: '2026-02-26', ref: AUREUS_ONSS.identificationRef },
      clientId: hasClientId ? 'configured' : 'missing',
      privateKey: hasPrivateKey ? 'configured' : 'missing',
      chamanChannel: hasClientId ? 'active' : 'pending_setup',
      env,
    },
    readiness: {
      identification: true,    // Validated 26/02/2026
      chamanConfig: hasClientId && hasPrivateKey,
      oauthToken: false,
      dimonaReady: false,
      dmfaReady: false,
    },
    nextSteps: [],
    urls: ENVS[env] || ENVS.simulation,
  };

  // Check what's needed
  if (!hasClientId) {
    status.nextSteps.push({
      priority: 1,
      action: 'Configurer le canal REST dans Chaman',
      detail: 'Le GAP doit se connecter sur la Gestion des Accès et activer le canal REST pour Dimona/DmfA',
      url: 'https://www.socialsecurity.be/site_fr/general/helpcentre/access.htm',
    });
    status.nextSteps.push({
      priority: 2,
      action: 'Générer un certificat auto-signé',
      detail: 'Créer une paire RSA 2048-bit, uploader la clé publique dans Chaman',
      doc: 'https://www.rest-documentation.socialsecurity.be/documentation/developer-guide/token/generating-your-self-signed-certificate.html',
    });
    status.nextSteps.push({
      priority: 3,
      action: 'Ajouter les variables d\'environnement Vercel',
      detail: 'ONSS_CLIENT_ID = le Client ID de Chaman | ONSS_PRIVATE_KEY = la clé privée RSA PEM',
    });
  }

  if (!status.readiness.identification) {
    status.nextSteps.push({
      priority: 0,
      action: 'Enregistrer premier mandat dans Mahis',
      detail: 'Deadline: 26/08/2026. Sans mandat, l\'identification expire.',
      url: 'https://mahis.socialsecurity.be',
    });
  }

  // Test actual connection if requested
  if (testConnection && hasClientId && hasPrivateKey) {
    try {
      const token = await getAccessToken({
        clientId: process.env.ONSS_CLIENT_ID,
        privateKey: null,
        env,
      });
      status.readiness.oauthToken = true;
      status.readiness.dimonaReady = true;
      status.configuration.oauthTest = 'SUCCESS';
      status.configuration.tokenObtained = new Date().toISOString();
    } catch (err) {
      status.configuration.oauthTest = 'FAILED';
      status.configuration.oauthError = err.message;
    }
  }

  return Response.json(status, { headers: cors() });
}
