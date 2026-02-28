import { apiRateLimit, auditLog } from "../../../lib/api-security";
import { TX_ONSS_W, TX_ONSS_E, LOIS_BELGES } from "../../../lib/lois-belges";
// Aureus Social Pro — API v1 Payroll
// Calculate payslips via REST API — constantes depuis lib/lois-belges.js

const CSSS_RATES = [{ min: 0, max: 1945.38, rate: 0 }, { min: 1945.38, max: 2190.18, rate: 0 }, { min: 2190.18, max: Infinity, rate: 0.09 }];

function quickPP(brut, situation = 'isole', enfants = 0) {
  const onss = Math.round(brut * TX_ONSS_W * 100) / 100;
  let imposable = brut - onss;
  const fraisPro = Math.min(imposable * 0.30, LOIS_BELGES.pp.fraisPro.salarie.max / 12);
  imposable -= fraisPro;

  // Brackets depuis LOIS_BELGES (annuels → mensuels via /12)
  const brackets = LOIS_BELGES.pp.tranches.map(t => ({
    limit: t.max === Infinity ? Infinity : t.max / 12,
    rate: t.taux,
  }));

  let pp = 0, remaining = imposable;
  let prev = 0;
  for (const b of brackets) {
    const slice = Math.min(remaining, b.limit - prev);
    if (slice > 0) { pp += slice * b.rate; remaining -= slice; }
    prev = b.limit;
  }

  // Reductions
  if (situation === 'marie_1rev' || situation === 'cohabitant_1rev') pp -= 264.49;
  if (situation === 'isole') pp -= 0;
  const childReductions = [0, 50, 136, 310, 520, 672];
  pp -= (childReductions[Math.min(enfants, 5)] || 0);
  if (situation === 'parent_isole') pp -= 50;

  return Math.max(0, Math.round(pp * 100) / 100);
}

function calcBonusEmploi(brut) {
  const S = brut;
  const be = LOIS_BELGES.pp.bonusEmploi;
  if (S <= be.seuilBrut1) return Math.round(Math.min(S * TX_ONSS_W, be.maxMensuel) * 100) / 100;
  if (S <= be.seuilBrut2) return Math.round(Math.max(0, be.maxMensuel - (S - be.seuilBrut1) * be.pctReduction) * 100) / 100;
  return 0;
}

const ALLOWED_ORIGINS = [
  process.env.ALLOWED_ORIGIN,
  'https://aureussocial.be', 'https://www.aureussocial.be',
  'https://app.aureussocial.be',
  'https://aureus-social-v18.vercel.app',
].filter(Boolean);

function cors(request) {
  const origin = request?.headers?.get?.('origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin === o);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };
}

export async function OPTIONS(request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { brut, situation, enfants, statut, regime } = body;

    if (!brut || typeof brut !== 'number' || brut <= 0 || brut > 100000) {
      return Response.json({ error: 'brut must be a number > 0 and <= 100000' }, { status: 400, headers: cors(request) });
    }

    const validSituations = ['isole', 'marie_1rev', 'marie_2rev', 'cohabitant_1rev', 'cohabitant_2rev', 'parent_isole'];
    if (situation && !validSituations.includes(situation)) {
      return Response.json({ error: `Invalid situation. Allowed: ${validSituations.join(', ')}` }, { status: 400, headers: cors(request) });
    }

    const validStatuts = ['employe', 'ouvrier'];
    if (statut && !validStatuts.includes(statut)) {
      return Response.json({ error: `Invalid statut. Allowed: ${validStatuts.join(', ')}` }, { status: 400, headers: cors(request) });
    }

    const isOuvrier = statut === 'ouvrier';
    const baseONSS = isOuvrier ? brut * 1.08 : brut;
    const onssW = Math.round(baseONSS * TX_ONSS_W * 100) / 100;
    const onssE = Math.round(baseONSS * TX_ONSS_E * 100) / 100;
    const imposable = brut - onssW;
    const pp = quickPP(brut, situation || 'isole', enfants || 0);
    const bonusEmploi = calcBonusEmploi(brut);
    const csss = brut >= 2190.18 ? Math.round(imposable * 0.09 * 100) / 100 : 0;
    const net = Math.round((brut - onssW - pp - csss + bonusEmploi) * 100) / 100;
    const coutTotal = Math.round((brut + onssE) * 100) / 100;

    // Regime partiel
    const whWeek = body.whWeek || 38;
    const prorata = whWeek / 38;

    return Response.json({
      input: { brut, situation: situation || 'isole', enfants: enfants || 0, statut: statut || 'employe', whWeek },
      calculation: {
        brut,
        baseONSS,
        onssWorker: onssW,
        onssEmployer: onssE,
        imposable: Math.round(imposable * 100) / 100,
        fraisPro: Math.round(Math.min(imposable * 0.30, LOIS_BELGES.pp.fraisPro.salarie.max / 12) * 100) / 100,
        precompte: pp,
        csss,
        bonusEmploi,
        net,
        coutTotal,
        prorata,
      },
      meta: {
        engine: 'Aureus Social Pro v1',
        baremes: '2026',
        onssRate: '13.07% / 25.07%',
        ppSource: 'SPF Finances — Formule-clé 2026',
      },
    }, { headers: cors(request) });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors(request) });
  }
}
