// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — API /api/onss/dimona
//  Submit Dimona declarations to ONSS REST v2
//  Supports: IN, OUT, UPDATE, CANCEL
//  Env: simulation (test) or production
// ═══════════════════════════════════════════════════════

import {
  submitDimona,
  getDimonaStatus,
  searchDimona,
  searchPeriods,
  searchRelations,
  buildDimonaIn,
  buildDimonaOut,
  buildDimonaUpdate,
  buildDimonaCancel,
  AUREUS_ONSS,
  getAccessToken,
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

// GET — Check declaration status or search
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action'); // status, period, search
    const declarationId = searchParams.get('id');
    const env = searchParams.get('env') || 'simulation';

    // Config from env vars (set in Vercel)
    const config = {
      clientId: process.env.ONSS_CLIENT_ID,
      privateKey: process.env.ONSS_PRIVATE_KEY,
      env,
      scope: 'scope:dimona:declare scope:dimona:consult',
    };

    if (!config.clientId || !config.privateKey) {
      return Response.json({
        success: false,
        error: 'ONSS_NOT_CONFIGURED',
        message: 'Variables ONSS_CLIENT_ID et ONSS_PRIVATE_KEY non configurées',
        setup: {
          step1: 'Configurer le canal REST dans Chaman (Gestion des accès)',
          step2: 'Générer un certificat auto-signé (self-signed)',
          step3: 'Récupérer le Client ID depuis Chaman',
          step4: 'Ajouter ONSS_CLIENT_ID et ONSS_PRIVATE_KEY dans Vercel env vars',
          doc: 'https://www.rest-documentation.socialsecurity.be/documentation/developer-guide.html',
        },
      }, { status: 200, headers: cors() });
    }

    if (action === 'status' && declarationId) {
      const result = await getDimonaStatus(config, declarationId);
      return Response.json(result, { headers: cors() });
    }

    // Default: return API info
    return Response.json({
      service: 'Aureus Social Pro — ONSS Dimona REST v2',
      enterprise: AUREUS_ONSS,
      env,
      endpoints: {
        'POST /api/onss/dimona': 'Submit Dimona declaration (IN/OUT/UPDATE/CANCEL)',
        'GET /api/onss/dimona?action=status&id={declarationId}': 'Check declaration status',
      },
      documentation: 'https://www.socialsecurity.be/site_fr/employer/applics/dimona/documents/pdf/documentation-fonctionnelle-restv2_F.pdf',
    }, { headers: cors() });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500, headers: cors() });
  }
}

// POST — Submit Dimona declaration
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type,          // IN, OUT, UPDATE, CANCEL
      env = 'simulation',
      employer,      // { noss, enterpriseNumber }
      worker,        // { niss, firstName, lastName, birthDate, ... }
      occupation,    // { startDate, endDate, jointCommissionNbr, workerType, ... }
      periodId,      // For UPDATE/CANCEL
      endDate,       // For OUT
    } = body;

    // Config
    const config = {
      clientId: process.env.ONSS_CLIENT_ID,
      privateKey: process.env.ONSS_PRIVATE_KEY,
      env,
      scope: 'scope:dimona:declare scope:dimona:consult',
    };

    if (!config.clientId || !config.privateKey) {
      return Response.json({
        success: false,
        error: 'ONSS_NOT_CONFIGURED',
        message: 'Configurez d\'abord le canal REST dans Chaman. Voir GET /api/onss/dimona pour les étapes.',
      }, { status: 200, headers: cors() });
    }

    // Validate
    if (!type || !['IN', 'OUT', 'UPDATE', 'CANCEL'].includes(type.toUpperCase())) {
      return Response.json({
        success: false,
        error: 'INVALID_TYPE',
        message: 'Type requis: IN, OUT, UPDATE ou CANCEL',
      }, { status: 400, headers: cors() });
    }

    if (!employer?.enterpriseNumber && !employer?.noss) {
      return Response.json({
        success: false,
        error: 'MISSING_EMPLOYER',
        message: 'Numéro ONSS (noss) ou numéro d\'entreprise (enterpriseNumber) requis',
      }, { status: 400, headers: cors() });
    }

    if (!worker?.niss && !worker?.lastName) {
      return Response.json({
        success: false,
        error: 'MISSING_WORKER',
        message: 'NISS ou données MID (nom, prénom, date naissance) requis',
      }, { status: 400, headers: cors() });
    }

    // Build declaration payload
    let declaration;
    const t = type.toUpperCase();

    if (t === 'IN') {
      if (!occupation?.startDate) {
        return Response.json({ success: false, error: 'MISSING_START_DATE' }, { status: 400, headers: cors() });
      }
      declaration = buildDimonaIn(employer, worker, occupation);
    } else if (t === 'OUT') {
      if (!endDate) {
        return Response.json({ success: false, error: 'MISSING_END_DATE' }, { status: 400, headers: cors() });
      }
      declaration = buildDimonaOut(employer, worker, endDate);
    } else if (t === 'UPDATE') {
      if (!periodId) {
        return Response.json({ success: false, error: 'MISSING_PERIOD_ID' }, { status: 400, headers: cors() });
      }
      declaration = buildDimonaUpdate(employer, worker, periodId, endDate);
    } else if (t === 'CANCEL') {
      if (!periodId) {
        return Response.json({ success: false, error: 'MISSING_PERIOD_ID' }, { status: 400, headers: cors() });
      }
      declaration = buildDimonaCancel(employer, worker, periodId);
    }

    // Audit log
    const audit = {
      timestamp: new Date().toISOString(),
      action: `DIMONA_${t}`,
      env,
      employer: employer.enterpriseNumber || employer.noss,
      worker: worker.niss ? `NISS:${worker.niss.slice(0, 6)}***` : `${worker.lastName}`,
      declaration,
    };
    console.log('[ONSS-DIMONA]', JSON.stringify(audit));

    // Submit to ONSS
    const result = await submitDimona(config, declaration);

    return Response.json({
      ...result,
      env,
      type: t,
      timestamp: new Date().toISOString(),
      // If success, include poll URL
      ...(result.success && result.declarationId && {
        pollUrl: `/api/onss/dimona?action=status&id=${result.declarationId}&env=${env}`,
        retrySpec: {
          note: 'ONSS traite en ~2.5s (médiane). >99% sous 4 secondes.',
          '0-2s': 'Pas d\'appel',
          '2-30s': 'Poll toutes les 1s',
          '30s-20min': 'Poll toutes les 1min',
        },
      }),
    }, { status: result.success ? 201 : 400, headers: cors() });

  } catch (err) {
    console.error('[ONSS-DIMONA-ERROR]', err);
    return Response.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500, headers: cors() });
  }
}
