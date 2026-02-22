export const runtime = 'edge';
export const maxDuration = 60;

const SYSTEM_PROMPT = 'Tu es un expert en paie belge. Analyse cette fiche de paie et retourne UNIQUEMENT du JSON valide avec cette structure: {"type":"fiche_paie","mois":"MM/YYYY","travailleur":{"nom":"","prenom":"","niss":""},"remuneration":{"brut_base":0,"brut_total":0},"retenues":{"onss_travailleur":0,"precompte_professionnel":0,"cotisation_speciale_ss":0,"bonus_emploi":0},"net":{"net_a_payer":0},"confiance":0.95}';

export async function POST(request) {
  try {
    const { documents } = await request.json();
    if (!documents || !documents.length) {
      return Response.json({ error: 'No documents' }, { status: 400 });
    }
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY non configuree' }, { status: 500 });
    }
    const results = [];
    for (const doc of documents) {
      const { base64, filename, mediaType } = doc;
      const content = [];
      if (mediaType === 'application/pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
      } else {
        content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } });
      }
      content.push({ type: 'text', text: 'Analyse cette fiche de paie belge. Retourne UNIQUEMENT du JSON.' });
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: SYSTEM_PROMPT, messages: [{ role: 'user', content }] })
      });
      const data = await response.json();
      let extracted = {};
      try {
        const text = data.content?.[0]?.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      } catch (e) { extracted = { error: 'Parse error', raw: data.content?.[0]?.text?.substring(0, 200) }; }
      results.push({ filename, extracted });
    }
    return Response.json({ results, count: results.length });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ status: 'ok', endpoint: 'scan-paie', accepts: 'PDF, JPG, PNG' });
}