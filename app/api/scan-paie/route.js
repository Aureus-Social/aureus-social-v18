export const maxDuration = 60;

const SYS = 'Tu es un expert en paie belge. Analyse cette fiche de paie et retourne UNIQUEMENT du JSON valide (sans markdown, sans backticks) avec cette structure: {"type":"fiche_paie","mois":"MM/YYYY","remuneration":{"brut_base":0,"brut_total":0},"retenues":{"onss_travailleur":0,"precompte_professionnel":0,"cotisation_speciale_ss":0,"bonus_emploi":0},"net":{"net_a_payer":0},"confiance":0.95}. Remplis les montants avec les valeurs trouvees dans le document.';

export async function POST(req) {
  try {
    const { documents } = await req.json();
    if (!documents || !documents.length) return Response.json({ error: 'No docs' }, { status: 400 });
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) return Response.json({ error: 'No API key' }, { status: 500 });
    const results = [];
    for (const doc of documents) {
      const { base64, filename, mediaType } = doc;
      const content = [];
      if (mediaType === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
      } else {
        content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
      }
      content.push({ type: 'text', text: 'Analyse cette fiche de paie belge. Retourne UNIQUEMENT du JSON, sans backticks, sans explication.' });
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: SYS, messages: [{ role: 'user', content }] })
      });
      const data = await r.json();
      let extracted = {};
      if (data.error) {
        extracted = { apiError: data.error.message || JSON.stringify(data.error) };
      } else {
        try {
          const t = (data.content && data.content[0] && data.content[0].text) || '';
          const i = t.indexOf('{');
          const j = t.lastIndexOf('}');
          if (i !== -1 && j > i) {
            extracted = JSON.parse(t.substring(i, j + 1));
          } else {
            extracted = { parseError: 'No JSON found', raw: t.substring(0, 300) };
          }
        } catch (e2) {
          extracted = { parseError: e2.message, raw: (data.content && data.content[0] && data.content[0].text || '').substring(0, 300) };
        }
      }
      results.push({ filename, extracted });
    }
    return Response.json({ results, count: results.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', endpoint: 'scan-paie' });
}