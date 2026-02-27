import { apiRateLimit, auditLog } from "../../../lib/api-security";
// Aureus Social Pro — API v1 Payroll
// Calculate payslips via REST API

const TX_ONSS_W = 0.1307;
const TX_ONSS_E = 0.2507;
const CSSS_RATES = [{ min: 0, max: 1945.38, rate: 0 }, { min: 1945.38, max: 2190.18, rate: 0 }, { min: 2190.18, max: Infinity, rate: 0.09 }];

function quickPP(brut, situation = 'isole', enfants = 0) {
  const onss = Math.round(brut * TX_ONSS_W * 100) / 100;
  let imposable = brut - onss;
  const fraisPro = Math.min(imposable * 0.30, 5930 / 12);
  imposable -= fraisPro;

  // 2026 brackets
  const brackets = [
    { limit: 15200 / 12, rate: 0.2675 },
    { limit: 26830 / 12, rate: 0.4280 },
    { limit: 46440 / 12, rate: 0.4815 },
    { limit: Infinity, rate: 0.5350 },
  ];

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
  if (S <= 2072.09) return Math.round(Math.min(S * TX_ONSS_W, 277.68) * 100) / 100;
  if (S <= 2726.16) return Math.round(Math.max(0, 277.68 - (S - 2072.09) * 0.2446) * 100) / 100;
  return 0;
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { brut, situation, enfants, statut, regime } = body;

    if (!brut || brut <= 0) return Response.json({ error: 'brut must be > 0' }, { status: 400, headers: cors() });

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
        fraisPro: Math.round(Math.min(imposable * 0.30, 5930 / 12) * 100) / 100,
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
    }, { headers: cors() });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: cors() });
  }
}
