// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — API /api/onss/dmfa
//  Soumission DmfA trimestrielle à l'ONSS
//  Supporte: ORIGINAL, MODIFICATION, batch XML upload
//  Env: simulation (test) ou production
// ═══════════════════════════════════════════════════════

import {
  getAccessToken,
  ENVS,
  AUREUS_ONSS,
} from '../../../lib/onss-client.js';

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

// GET — Statut de la config DmfA + consulter une déclaration
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const ticketId = searchParams.get('ticket');
    const env = searchParams.get('env') || 'simulation';

    const config = {
      clientId: process.env.ONSS_CLIENT_ID,
      privateKey: process.env.ONSS_PRIVATE_KEY,
      env,
    };

    if (!config.clientId || !config.privateKey) {
      return Response.json({
        success: false,
        error: 'ONSS_NOT_CONFIGURED',
        message: 'Variables ONSS_CLIENT_ID et ONSS_PRIVATE_KEY non configurées',
        setup: {
          step1: 'Configurer le canal REST dans Chaman (Gestion des accès)',
          step2: 'Générer un certificat auto-signé RSA 2048 bits',
          step3: 'Récupérer le Client ID depuis Chaman',
          step4: 'Ajouter ONSS_CLIENT_ID et ONSS_PRIVATE_KEY dans Vercel env vars',
          doc: 'https://www.rest-documentation.socialsecurity.be/documentation/developer-guide.html',
        },
      }, { status: 200, headers: cors() });
    }

    // Consultation d'un ticket ACRF
    if (action === 'status' && ticketId) {
      const token = await getAccessToken(config);
      const urls = ENVS[env] || ENVS.simulation;

      const resp = await fetch(`${urls.dmfa}/declarations/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (resp.ok) {
        const data = await resp.json();
        return Response.json({
          success: true,
          ticket: ticketId,
          status: data.status,
          result: data.resultCode,
          anomalies: data.anomalies || [],
          declaration: data,
        }, { headers: cors() });
      }

      if (resp.status === 404) {
        return Response.json({
          success: true,
          ticket: ticketId,
          status: 'PROCESSING',
          message: 'Déclaration en cours de traitement par l\'ONSS',
        }, { headers: cors() });
      }

      return Response.json({
        success: false,
        status: resp.status,
        message: 'Erreur lors de la consultation',
      }, { status: resp.status, headers: cors() });
    }

    // Par défaut: info API
    return Response.json({
      service: 'Aureus Social Pro — ONSS DmfA REST',
      enterprise: AUREUS_ONSS,
      env,
      configured: true,
      endpoints: {
        'POST /api/onss/dmfa': 'Soumettre une DmfA trimestrielle (XML)',
        'GET /api/onss/dmfa?action=status&ticket={ticketId}': 'Consulter le statut d\'une déclaration',
      },
      documentation: 'https://www.socialsecurity.be/site_fr/employer/applics/dmfa/index.htm',
    }, { headers: cors() });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500, headers: cors() });
  }
}

// POST — Soumettre une DmfA
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const env = new URL(request.url).searchParams.get('env') || 'simulation';

    const config = {
      clientId: process.env.ONSS_CLIENT_ID,
      privateKey: process.env.ONSS_PRIVATE_KEY,
      env,
    };

    if (!config.clientId || !config.privateKey) {
      return Response.json({
        success: false,
        error: 'ONSS_NOT_CONFIGURED',
        message: 'Configurez d\'abord le canal REST dans Chaman. Voir GET /api/onss/dmfa.',
      }, { status: 200, headers: cors() });
    }

    let xmlContent;
    let metadata = {};

    // Accepter JSON avec XML embarqué ou XML direct
    if (contentType.includes('application/json')) {
      const body = await request.json();
      xmlContent = body.xml;
      metadata = {
        quarter: body.quarter,
        year: body.year,
        type: body.type || 'ORIGINAL', // ORIGINAL, MODIFICATION
        employer: body.employer,
        workerCount: body.workerCount,
      };
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xmlContent = await request.text();
      // Extraire les metadata du XML
      const qMatch = xmlContent.match(/<Quarter>(\d)<\/Quarter>/);
      const yMatch = xmlContent.match(/<Year>(\d{4})<\/Year>/);
      const wMatch = xmlContent.match(/<NbrOfWorkers>(\d+)<\/NbrOfWorkers>/);
      metadata = {
        quarter: qMatch ? parseInt(qMatch[1]) : null,
        year: yMatch ? parseInt(yMatch[1]) : null,
        workerCount: wMatch ? parseInt(wMatch[1]) : null,
        type: xmlContent.includes('FormSubType') ?
          (xmlContent.match(/<FormSubType>(\w+)<\/FormSubType>/) || [])[1] || 'ORIGINAL' : 'ORIGINAL',
      };
    } else {
      return Response.json({
        success: false,
        error: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type doit être application/json ou application/xml',
      }, { status: 400, headers: cors() });
    }

    if (!xmlContent) {
      return Response.json({
        success: false,
        error: 'MISSING_XML',
        message: 'Le contenu XML de la DmfA est requis',
      }, { status: 400, headers: cors() });
    }

    // Validation basique du XML
    if (!xmlContent.includes('<DmfAOriginal') && !xmlContent.includes('<DmfAModification')) {
      return Response.json({
        success: false,
        error: 'INVALID_XML',
        message: 'Le XML doit contenir une balise DmfAOriginal ou DmfAModification',
      }, { status: 400, headers: cors() });
    }

    // Audit log
    console.log('[ONSS-DMFA]', JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'DMFA_SUBMIT',
      env,
      type: metadata.type,
      quarter: metadata.quarter,
      year: metadata.year,
      workerCount: metadata.workerCount,
      xmlLength: xmlContent.length,
    }));

    // Soumettre au service DmfA de l'ONSS
    const token = await getAccessToken(config);
    const urls = ENVS[env] || ENVS.simulation;

    const resp = await fetch(`${urls.dmfa}/declarations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/xml',
        'Accept': 'application/json',
      },
      body: xmlContent,
    });

    if (resp.status === 201 || resp.status === 200) {
      const location = resp.headers.get('Location');
      const ticketId = location ? location.split('/').pop() : null;
      let responseData = {};
      try { responseData = await resp.json(); } catch { /* XML response */ }

      return Response.json({
        success: true,
        status: 201,
        ticketId,
        location,
        message: 'DmfA réceptionnée par l\'ONSS — traitement en cours',
        env,
        metadata,
        pollUrl: ticketId ? `/api/onss/dmfa?action=status&ticket=${ticketId}&env=${env}` : null,
        retrySpec: {
          note: 'La notification (DMNO) est généralement disponible sous 24-48h',
          immediate: 'Vérifier le statut ACRF sous 5 minutes',
          notification: 'Notification DMNO sous 1-2 jours ouvrables',
        },
        ...responseData,
      }, { status: 201, headers: cors() });
    }

    if (resp.status === 400) {
      const errData = await resp.json().catch(() => ({}));
      return Response.json({
        success: false,
        status: 400,
        message: 'XML invalide ou données incorrectes',
        errors: errData,
        env,
      }, { status: 400, headers: cors() });
    }

    if (resp.status === 403) {
      return Response.json({
        success: false,
        status: 403,
        message: 'Non autorisé — vérifiez les scopes dans Chaman (scope:dmfa:declare)',
        env,
      }, { status: 403, headers: cors() });
    }

    const errText = await resp.text();
    return Response.json({
      success: false,
      status: resp.status,
      message: errText || 'Erreur technique ONSS',
      env,
    }, { status: resp.status, headers: cors() });

  } catch (err) {
    console.error('[ONSS-DMFA-ERROR]', err);
    return Response.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500, headers: cors() });
  }
}
