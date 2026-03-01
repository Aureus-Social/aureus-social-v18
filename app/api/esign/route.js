// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — E-Signature API (Item 22)
// Integration Yousign v3 API for electronic document signing
// Set YOUSIGN_API_KEY and YOUSIGN_ENV (sandbox/production) in env
// ═══════════════════════════════════════════════════════════

const YOUSIGN_SANDBOX = 'https://api-sandbox.yousign.app/v3';
const YOUSIGN_PROD = 'https://api.yousign.app/v3';

function getBaseUrl() {
  return process.env.YOUSIGN_ENV === 'production' ? YOUSIGN_PROD : YOUSIGN_SANDBOX;
}

function getHeaders() {
  return {
    'Authorization': `Bearer ${process.env.YOUSIGN_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

// POST /api/esign — Create signature request or check status
export async function POST(request) {
  // ═══ SÉCURITÉ : Authentification requise ═══
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return Response.json({ error: 'Authentification requise' }, { status: 401 });
  }

  const apiKey = process.env.YOUSIGN_API_KEY;

  try {
    const body = await request.json();
    const { action } = body;

    // Dev mode fallback
    if (!apiKey) {
      return Response.json({
        ok: true,
        mode: 'dev',
        message: 'E-signature en mode développement (YOUSIGN_API_KEY non configurée)',
        mockId: 'sig_dev_' + Date.now(),
        action,
      });
    }

    const baseUrl = getBaseUrl();

    switch (action) {
      // ── Create signature request ──
      case 'create': {
        const { name, documentBase64, fileName, signers } = body;
        if (!documentBase64 || !signers?.length) {
          return Response.json({ error: 'documentBase64 and signers required' }, { status: 400 });
        }

        // Validate signer data
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const s of signers) {
          if (!s.email || !emailRegex.test(s.email)) {
            return Response.json({ error: 'Each signer must have a valid email address' }, { status: 400 });
          }
          if (!s.firstName || !s.lastName) {
            return Response.json({ error: 'Each signer must have firstName and lastName' }, { status: 400 });
          }
        }

        // 1. Create signature request
        const reqRes = await fetch(`${baseUrl}/signature_requests`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            name: name || 'Aureus Social Pro — Document à signer',
            delivery_mode: 'email',
            timezone: 'Europe/Brussels',
          }),
        });
        if (!reqRes.ok) {
          const err = await reqRes.json();
          return Response.json({ error: err.detail || 'E-signature service error' }, { status: reqRes.status });
        }
        const sigReq = await reqRes.json();

        // 2. Upload document
        const docRes = await fetch(`${baseUrl}/signature_requests/${sigReq.id}/documents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            file_name: fileName || 'document.pdf',
            file_content: documentBase64,
            nature: 'signable_document',
          }),
        });
        if (!docRes.ok) {
          const err = await docRes.json();
          return Response.json({ error: 'Document upload failed' }, { status: docRes.status });
        }
        const doc = await docRes.json();

        // 3. Add signers
        const addedSigners = [];
        for (const s of signers) {
          const signerRes = await fetch(`${baseUrl}/signature_requests/${sigReq.id}/signers`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
              info: {
                first_name: s.firstName,
                last_name: s.lastName,
                email: s.email,
                locale: 'fr',
              },
              signature_level: 'electronic_signature',
              signature_authentication_mode: 'otp_email',
              fields: [{
                type: 'signature',
                document_id: doc.id,
                page: s.page || 1,
                x: s.x || 350,
                y: s.y || 700,
                width: 180,
                height: 60,
              }],
            }),
          });
          if (signerRes.ok) {
            addedSigners.push(await signerRes.json());
          }
        }

        // 4. Activate (send for signing)
        await fetch(`${baseUrl}/signature_requests/${sigReq.id}/activate`, {
          method: 'POST',
          headers: getHeaders(),
        });

        return Response.json({
          ok: true,
          signatureRequestId: sigReq.id,
          documentId: doc.id,
          signers: addedSigners.length,
          status: 'activated',
        });
      }

      // ── Check status ──
      case 'status': {
        const { signatureRequestId } = body;
        if (!signatureRequestId) {
          return Response.json({ error: 'signatureRequestId required' }, { status: 400 });
        }
        const res = await fetch(`${baseUrl}/signature_requests/${signatureRequestId}`, {
          headers: getHeaders(),
        });
        if (!res.ok) {
          return Response.json({ error: 'Not found' }, { status: res.status });
        }
        const data = await res.json();
        return Response.json({
          ok: true,
          id: data.id,
          status: data.status,
          created_at: data.created_at,
          signers: data.signers?.map(s => ({
            name: `${s.info.first_name} ${s.info.last_name}`,
            email: s.info.email,
            status: s.status,
          })),
        });
      }

      // ── Download signed document ──
      case 'download': {
        const { signatureRequestId: dlId, documentId: dlDocId } = body;
        if (!dlId) {
          return Response.json({ error: 'signatureRequestId required' }, { status: 400 });
        }
        const dlRes = await fetch(
          `${baseUrl}/signature_requests/${dlId}/documents/${dlDocId}/download`,
          { headers: { 'Authorization': `Bearer ${apiKey}` } }
        );
        if (!dlRes.ok) {
          return Response.json({ error: 'Download failed' }, { status: dlRes.status });
        }
        const buffer = await dlRes.arrayBuffer();
        return new Response(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="signed-document.pdf"`,
          },
        });
      }

      default:
        return Response.json({ error: 'Unknown action. Use: create, status, download' }, { status: 400 });
    }
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const hasKey = !!process.env.YOUSIGN_API_KEY;
  return Response.json({
    service: 'Aureus Social Pro — E-Signature (Yousign v3)',
    status: 'ok',
    yousign: hasKey ? 'configured' : 'not configured (dev mode)',
    env: process.env.YOUSIGN_ENV || 'sandbox',
    actions: ['create', 'status', 'download'],
  });
}
