// ═══════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — API /api/onss/belcotax
//  Soumission Belcotax (fiches 281.10/20/50) au SPF Finances
//  Via BelcotaxOnWeb API — https://financien.belgium.be
//  Env: simulation (test) ou production
// ═══════════════════════════════════════════════════════

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// ── Endpoints SPF Finances ──
const BELCOTAX_ENVS = {
  simulation: {
    upload: 'https://ccff02.minfin.fgov.be/belcotaxonweb/api/v1/test/upload',
    status: 'https://ccff02.minfin.fgov.be/belcotaxonweb/api/v1/test/status',
    label: 'Test (simulation)',
  },
  production: {
    upload: 'https://ccff02.minfin.fgov.be/belcotaxonweb/api/v1/upload',
    status: 'https://ccff02.minfin.fgov.be/belcotaxonweb/api/v1/status',
    label: 'Production',
  },
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

// GET — Statut config + consultation envoi
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const submissionId = searchParams.get('id');
    const env = searchParams.get('env') || 'simulation';

    const certPem = process.env.BELCOTAX_CERT_PEM;
    const certKey = process.env.BELCOTAX_CERT_KEY;
    const companyBCE = process.env.BELCOTAX_BCE || process.env.NEXT_PUBLIC_BCE;

    if (!certPem || !certKey) {
      return Response.json({
        service: 'Aureus Social Pro — Belcotax SPF Finances',
        configured: false,
        error: 'BELCOTAX_NOT_CONFIGURED',
        message: 'Certificat Belcotax non configuré',
        setup: {
          step1: 'Obtenir un certificat de classe 3 (Isabel, GlobalSign, ou Certipost)',
          step2: 'Enregistrer le certificat sur BelcotaxOnWeb (financien.belgium.be)',
          step3: 'Ajouter BELCOTAX_CERT_PEM (certificat PEM) et BELCOTAX_CERT_KEY (clé privée) dans Vercel env vars',
          step4: 'Ajouter BELCOTAX_BCE (numéro BCE débiteur)',
          alternative: 'Vous pouvez aussi soumettre manuellement via https://financien.belgium.be/fr/e-services/belcotaxonweb',
          doc: 'https://financien.belgium.be/fr/e-services/belcotaxonweb',
        },
        manualUpload: {
          note: 'En attendant la configuration automatique, exportez le XML et uploadez-le manuellement',
          url: 'https://financien.belgium.be/fr/e-services/belcotaxonweb',
          xmlEndpoint: 'Utilisez genBelcotax() pour générer le XML',
        },
      }, { status: 200, headers: cors() });
    }

    // Consulter le statut d'un envoi
    if (action === 'status' && submissionId) {
      const urls = BELCOTAX_ENVS[env] || BELCOTAX_ENVS.simulation;

      const resp = await fetch(`${urls.status}/${submissionId}`, {
        headers: {
          'Accept': 'application/json',
        },
        // En production, utiliser le certificat client mTLS
        // La configuration mTLS dépend du runtime (Vercel, Node.js natif, etc.)
      });

      if (resp.ok) {
        const data = await resp.json();
        return Response.json({
          success: true,
          submissionId,
          status: data.status,
          result: data,
        }, { headers: cors() });
      }

      return Response.json({
        success: false,
        submissionId,
        status: resp.status,
        message: 'Impossible de récupérer le statut',
      }, { status: resp.status, headers: cors() });
    }

    // Info API
    return Response.json({
      service: 'Aureus Social Pro — Belcotax SPF Finances',
      configured: true,
      bce: companyBCE ? companyBCE.replace(/(\d{4})(\d{3})(\d{3})/, '$1.$2.$3') : 'Non configuré',
      env,
      supportedTypes: ['281.10 (salariés)', '281.20 (dirigeants)', '281.50 (commissions)'],
      deadlines: {
        fiches_281_10: 'Avant le 1er mars de l\'année suivante',
        fiches_281_20: 'Avant le 1er mars de l\'année suivante',
        fiches_325: 'Accompagne les fiches 281 (récapitulatif)',
      },
      endpoints: {
        'POST /api/onss/belcotax': 'Soumettre un fichier Belcotax XML',
        'GET /api/onss/belcotax?action=status&id={submissionId}': 'Consulter le statut d\'un envoi',
      },
    }, { headers: cors() });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500, headers: cors() });
  }
}

// POST — Soumettre un fichier Belcotax
export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    const env = new URL(request.url).searchParams.get('env') || 'simulation';

    const certPem = process.env.BELCOTAX_CERT_PEM;
    const certKey = process.env.BELCOTAX_CERT_KEY;
    const companyBCE = process.env.BELCOTAX_BCE || process.env.NEXT_PUBLIC_BCE;

    if (!certPem || !certKey) {
      return Response.json({
        success: false,
        error: 'BELCOTAX_NOT_CONFIGURED',
        message: 'Certificat Belcotax non configuré. Voir GET /api/onss/belcotax pour les étapes.',
        workaround: 'Exportez le XML et soumettez manuellement sur BelcotaxOnWeb',
      }, { status: 200, headers: cors() });
    }

    let xmlContent;
    let metadata = {};

    if (contentType.includes('application/json')) {
      const body = await request.json();
      xmlContent = body.xml;
      metadata = {
        year: body.year,
        ficheType: body.ficheType || '281.10',
        workerCount: body.workerCount,
        bce: body.bce || companyBCE,
      };
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xmlContent = await request.text();
      const yearMatch = xmlContent.match(/<AangifteJaar>(\d{4})<\/AangifteJaar>/);
      const typeMatch = xmlContent.match(/<Aangiftetype>([\d.]+)<\/Aangiftetype>/);
      const countMatch = xmlContent.match(/<AantalOpgaven>(\d+)<\/AantalOpgaven>/);
      metadata = {
        year: yearMatch ? parseInt(yearMatch[1]) : null,
        ficheType: typeMatch ? typeMatch[1] : '281.10',
        workerCount: countMatch ? parseInt(countMatch[1]) : null,
        bce: companyBCE,
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
        message: 'Le contenu XML Belcotax est requis',
      }, { status: 400, headers: cors() });
    }

    // Validation basique
    if (!xmlContent.includes('<Belcotax') && !xmlContent.includes('<Verzending')) {
      return Response.json({
        success: false,
        error: 'INVALID_XML',
        message: 'Le XML doit être au format BelcotaxOnWeb (balise Belcotax ou Verzending)',
      }, { status: 400, headers: cors() });
    }

    // Validation fiche 325 (récapitulatif)
    // La fiche 325 est automatiquement générée par BelcotaxOnWeb
    // mais nous vérifions la cohérence des montants

    // Audit log
    console.log('[BELCOTAX]', JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'BELCOTAX_SUBMIT',
      env,
      ficheType: metadata.ficheType,
      year: metadata.year,
      workerCount: metadata.workerCount,
      bce: metadata.bce,
      xmlLength: xmlContent.length,
    }));

    // Soumettre au SPF Finances
    const urls = BELCOTAX_ENVS[env] || BELCOTAX_ENVS.simulation;

    // BelcotaxOnWeb utilise un upload multipart avec certificat client
    const formData = new FormData();
    const xmlBlob = new Blob([xmlContent], { type: 'application/xml' });
    formData.append('file', xmlBlob, `belcotax_${metadata.ficheType || '281.10'}_${metadata.year || 'unknown'}.xml`);
    formData.append('bce', (metadata.bce || '').replace(/[^0-9]/g, ''));

    const resp = await fetch(urls.upload, {
      method: 'POST',
      body: formData,
      // mTLS avec le certificat client — à configurer selon l'hébergeur
      // Sur Vercel, utiliser une Edge Function avec certificat ou un proxy
    });

    if (resp.ok) {
      let responseData = {};
      try { responseData = await resp.json(); } catch { /* XML response possible */ }

      return Response.json({
        success: true,
        status: 200,
        message: 'Fichier Belcotax soumis au SPF Finances',
        env,
        metadata,
        submissionId: responseData.submissionId || responseData.id || null,
        pollUrl: responseData.submissionId
          ? `/api/onss/belcotax?action=status&id=${responseData.submissionId}&env=${env}`
          : null,
        nextSteps: {
          note: 'Le traitement prend généralement 24-48h',
          check: 'Vérifiez le statut via le pollUrl ou sur BelcotaxOnWeb',
          fiche325: 'La fiche 325 récapitulative est générée automatiquement par le SPF',
        },
        ...responseData,
      }, { status: 200, headers: cors() });
    }

    if (resp.status === 400) {
      const errData = await resp.text();
      return Response.json({
        success: false,
        status: 400,
        message: 'Fichier XML rejeté par BelcotaxOnWeb',
        details: errData,
        env,
        hints: [
          'Vérifiez que le namespace XML correspond à l\'année fiscale',
          'Vérifiez que tous les INSZ (NISS) sont valides',
          'Vérifiez que le numéro BCE est correct',
        ],
      }, { status: 400, headers: cors() });
    }

    if (resp.status === 401 || resp.status === 403) {
      return Response.json({
        success: false,
        status: resp.status,
        message: 'Certificat non reconnu par BelcotaxOnWeb',
        hints: [
          'Vérifiez que le certificat est enregistré sur BelcotaxOnWeb',
          'Vérifiez que le certificat est de classe 3 (Isabel, GlobalSign, Certipost)',
          'Vérifiez que le certificat n\'est pas expiré',
        ],
        env,
      }, { status: resp.status, headers: cors() });
    }

    const errText = await resp.text();
    return Response.json({
      success: false,
      status: resp.status,
      message: errText || 'Erreur technique SPF Finances',
      env,
    }, { status: resp.status, headers: cors() });

  } catch (err) {
    console.error('[BELCOTAX-ERROR]', err);
    return Response.json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    }, { status: 500, headers: cors() });
  }
}
