import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const vat = searchParams.get('vat')?.replace(/[^0-9]/g, '');
  if (!vat || vat.length < 8) {
    return NextResponse.json({ error: 'Numero TVA invalide' }, { status: 400 });
  }

  const sources = [
    `https://open.fts.be/api/v1/vatcheck/${vat}`,
    `https://ec.europa.eu/taxation_customs/vies/rest-api/ms/BE/vat/${vat}`,
  ];

  for (const url of sources) {
    try {
      const res = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const data = await res.json();

      // Normaliser la réponse selon la source
      if (url.includes('open.fts.be')) {
        if (data.valid) {
          return NextResponse.json({
            ok: true,
            nom: data.name || data.companyName || '',
            adresse: [data.address?.street, data.address?.city].filter(Boolean).join(', '),
            bce: `BE${vat}`,
            valid: true,
            source: 'open.fts.be',
          });
        }
      } else if (url.includes('vies')) {
        if (data.isValid) {
          return NextResponse.json({
            ok: true,
            nom: data.name || '',
            adresse: data.address || '',
            bce: `BE${vat}`,
            valid: true,
            source: 'VIES',
          });
        }
      }
    } catch (e) {
      continue; // Essayer la source suivante
    }
  }

  return NextResponse.json({ ok: false, error: 'Societe non trouvee', valid: false });
}
