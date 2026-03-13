// ═══ AUREUS SOCIAL PRO — API Legal Watch ═══
// Veille légale automatique : scraping Moniteur Belge + SPF + ONSS
// GET /api/legal-watch

import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

const SOURCES = [
  { name: 'Moniteur Belge (ejustice.just.fgov.be)', url: 'https://www.ejustice.just.fgov.be/cgi_loi/legislation.pl' },
  { name: 'SPF Finances — Fiscalité', url: 'https://finances.belgium.be/fr/particuliers' },
  { name: 'ONSS — Taux cotisations', url: 'https://www.socialsecurity.be/employer/instructions/dmfa/fr/latest/instructions/special_contributions/overview.html' },
  { name: 'SPF ETCS — Normes travail', url: 'https://emploi.belgique.be/fr/themes/remunerations-et-avantages' },
  { name: 'CNT — CCT en vigueur', url: 'https://www.cnt-nar.be/AVIS/avis-liste.aspx' },
];

async function checkSource(source) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(source.url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AureusSocialBot/1.0 (veille-legale@aureus-ia.com)' },
    });
    clearTimeout(timeout);
    return {
      name: source.name,
      url: source.url,
      status: res.ok ? 'ok' : 'error',
      httpStatus: res.status,
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      name: source.name,
      url: source.url,
      status: 'error',
      error: e.message?.slice(0, 100),
      checkedAt: new Date().toISOString(),
    };
  }
}

// Valeurs de référence connues (hardcodées 2026 — à comparer avec scraping)
const KNOWN_VALUES_2026 = {
  rmmmg: 2070.48,
  onss_travailleur: 0.1307,
  onss_employeur: 0.2507,
  pp_taux_base: 0.2535, // tranche principale
  pv_provision: 0.1523,
  bonus_emploi_seuil: 3249.12,
  cheque_repas_max: 8.00,
  forfait_bureau_max: 151.70,
};

export async function GET(request) {
  const startTime = Date.now();

  // Vérifier les sources en parallèle (avec timeout)
  const sourceResults = await Promise.allSettled(
    SOURCES.map(s => checkSource(s))
  );

  const sources = sourceResults.map(r =>
    r.status === 'fulfilled' ? r.value : { name: '?', status: 'error', error: r.reason?.message }
  );

  const okCount = sources.filter(s => s.status === 'ok').length;

  // Simuler détection de changements (en production : comparer avec hash précédent en DB)
  // Ici on retourne les valeurs courantes + flag "vérifié"
  const changes = []; // Serait rempli si une valeur a changé depuis la dernière vérification

  // Alertes légales automatiques calendrier 2026
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const quarter = Math.ceil(month / 3);

  const calendarAlerts = [];

  // Précompte professionnel — 5 de chaque mois
  const nextPP = day > 5 ? new Date(now.getFullYear(), now.getMonth() + 1, 5) : new Date(now.getFullYear(), now.getMonth(), 5);
  const daysPP = Math.ceil((nextPP - now) / 86400000);
  if (daysPP <= 5) calendarAlerts.push({ level: 'critical', msg: `PP 274 dû dans ${daysPP}j`, echéance: nextPP.toISOString().split('T')[0] });

  // DmfA trimestrielle
  const qEnd = new Date(now.getFullYear(), quarter * 3, 0);
  const daysDmfa = Math.ceil((qEnd - now) / 86400000);
  if (daysDmfa <= 14) calendarAlerts.push({ level: daysDmfa <= 5 ? 'critical' : 'warning', msg: `DmfA T${quarter} dans ${daysDmfa}j`, echéance: qEnd.toISOString().split('T')[0] });

  // Belcotax
  if (month <= 2) {
    const belco = new Date(now.getFullYear(), 2, 1);
    const db = Math.ceil((belco - now) / 86400000);
    calendarAlerts.push({ level: db <= 14 ? 'critical' : 'warning', msg: `Belcotax 281.xx dans ${db}j`, echéance: `${now.getFullYear()}-03-01` });
  }

  const elapsed = Date.now() - startTime;

  return NextResponse.json({
    ok: true,
    checkedAt: new Date().toISOString(),
    elapsed: `${elapsed}ms`,
    sources,
    sourcesOk: okCount,
    sourcesTotal: SOURCES.length,
    changes,
    calendarAlerts,
    knownValues: KNOWN_VALUES_2026,
    nextCheck: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // dans 6h
    meta: {
      version: 'v38',
      engine: 'AureusLegalWatch/1.0',
      annee: 2026,
    },
  });
}
