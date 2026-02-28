#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — TESTS UNITAIRES BIBLIOTHÈQUES EXTRAITES
// Vérifie les constantes légales, le moteur de paie, et les générateurs
// ══════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

let total = 0, passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  total++;
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch (e) { failed++; failures.push({ name, error: e.message }); console.log(`  ❌ ${name}: ${e.message}`); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
function eq(a, b, label) { if (a !== b) throw new Error(`${label || 'eq'}: attendu ${b}, obtenu ${a}`); }
function near(a, b, tol, label) { if (Math.abs(a - b) > (tol || 0.01)) throw new Error(`${label || 'near'}: attendu ~${b}, obtenu ${a}`); }

// ═══ CHARGER lois-belges.js ═══
console.log('\n═══ 1. CONSTANTES LÉGALES BELGES (lois-belges.js) ═══');

const loisSrc = fs.readFileSync(path.join(__dirname, '..', 'app', 'lib', 'lois-belges.js'), 'utf-8');
const loisClean = loisSrc
  .replace(/"use client";?/g, '')
  .replace(/^import .+$/gm, '')
  .replace(/^export const /gm, 'const ')
  .replace(/^export \{[^}]*\};?$/gm, '');

let LOIS_BELGES, TX_ONSS_W, TX_ONSS_E, TX_AT, PV_SIMPLE, PV_DOUBLE, PP_EST, RMMMG, NET_FACTOR;
let SAISIE_2026_TRAVAIL, SAISIE_2026_REMPLACEMENT, SAISIE_IMMUN_ENFANT_2026, AF_REGIONS;
try {
  const fn = new Function(loisClean + `
    return { LOIS_BELGES, TX_ONSS_W, TX_ONSS_E, TX_AT, PV_SIMPLE, PV_DOUBLE, PP_EST, RMMMG, NET_FACTOR,
             SAISIE_2026_TRAVAIL, SAISIE_2026_REMPLACEMENT, SAISIE_IMMUN_ENFANT_2026, AF_REGIONS };
  `);
  const r = fn();
  LOIS_BELGES = r.LOIS_BELGES; TX_ONSS_W = r.TX_ONSS_W; TX_ONSS_E = r.TX_ONSS_E;
  TX_AT = r.TX_AT; PV_SIMPLE = r.PV_SIMPLE; PV_DOUBLE = r.PV_DOUBLE;
  PP_EST = r.PP_EST; RMMMG = r.RMMMG; NET_FACTOR = r.NET_FACTOR;
  SAISIE_2026_TRAVAIL = r.SAISIE_2026_TRAVAIL;
  SAISIE_2026_REMPLACEMENT = r.SAISIE_2026_REMPLACEMENT;
  SAISIE_IMMUN_ENFANT_2026 = r.SAISIE_IMMUN_ENFANT_2026;
  AF_REGIONS = r.AF_REGIONS;
  console.log('  ✓ lois-belges.js chargé avec succès');
} catch (e) {
  console.error('  ✗ Erreur chargement lois-belges.js:', e.message);
  process.exit(1);
}

// ── ONSS ──
test('TX_ONSS_W = 13,07%', () => eq(TX_ONSS_W, 0.1307, 'TX_ONSS_W'));
test('TX_ONSS_E = 25,07%', () => eq(TX_ONSS_E, 0.2507, 'TX_ONSS_E'));
test('LOIS_BELGES.onss.travailleur = 0.1307', () => eq(LOIS_BELGES.onss.travailleur, 0.1307, 'onss.trav'));
test('LOIS_BELGES.onss.ouvrier108 = 1.08', () => eq(LOIS_BELGES.onss.ouvrier108, 1.08, 'ouvrier108'));

// ── Précompte professionnel ──
test('PP 4 tranches progressives', () => eq(LOIS_BELGES.pp.tranches.length, 4, 'tranches'));
test('PP tranche 1 : 26,75%', () => eq(LOIS_BELGES.pp.tranches[0].taux, 0.2675, 'T1'));
test('PP tranche 2 : 42,80%', () => eq(LOIS_BELGES.pp.tranches[1].taux, 0.4280, 'T2'));
test('PP tranche 3 : 48,15%', () => eq(LOIS_BELGES.pp.tranches[2].taux, 0.4815, 'T3'));
test('PP tranche 4 : 53,50%', () => eq(LOIS_BELGES.pp.tranches[3].taux, 0.5350, 'T4'));
test('PP frais pro salarié 30% max 6070', () => {
  eq(LOIS_BELGES.pp.fraisPro.salarie.pct, 0.30, 'pct');
  eq(LOIS_BELGES.pp.fraisPro.salarie.max, 6070, 'max');
});
test('PP quotient conjugal 30% max 12520', () => {
  eq(LOIS_BELGES.pp.quotientConjugal.pct, 0.30, 'pct');
  eq(LOIS_BELGES.pp.quotientConjugal.max, 12520, 'max');
});
test('PP réductions enfants : 9 paliers', () => {
  eq(LOIS_BELGES.pp.reductionsEnfants.length, 9, 'paliers');
  eq(LOIS_BELGES.pp.reductionsEnfants[0], 0, '0 enfant');
  eq(LOIS_BELGES.pp.reductionsEnfants[1], 624, '1 enfant');
  eq(LOIS_BELGES.pp.reductionsEnfants[2], 1656, '2 enfants');
});
test('PP bonus emploi seuils définis', () => {
  assert(LOIS_BELGES.pp.bonusEmploi.seuilBrut1 > 2500, 'seuil1');
  assert(LOIS_BELGES.pp.bonusEmploi.seuilBrut2 > 2900, 'seuil2');
});

// ── RMMMG ──
test('RMMMG défini', () => assert(RMMMG > 2000, 'RMMMG > 2000'));

// ── Raccourcis ──
test('TX_AT défini (accident travail)', () => assert(typeof TX_AT === 'number' && TX_AT > 0, 'TX_AT'));
test('PV_SIMPLE défini (pécule simple)', () => assert(typeof PV_SIMPLE === 'number' && PV_SIMPLE > 0, 'PV_SIMPLE'));
test('PV_DOUBLE défini (pécule double)', () => assert(typeof PV_DOUBLE === 'number' && PV_DOUBLE > 0, 'PV_DOUBLE'));
test('PP_EST défini', () => assert(typeof PP_EST === 'number' && PP_EST > 0, 'PP_EST'));
test('NET_FACTOR défini', () => assert(typeof NET_FACTOR === 'number' && NET_FACTOR > 0.5, 'NET_FACTOR'));

// ── CSSS ──
test('CSSS 3 catégories (isolé, ménage 2 revenus, ménage 1 revenu)', () => {
  assert(LOIS_BELGES.csss, 'csss existe');
  assert(LOIS_BELGES.csss.isole, 'isole');
  assert(LOIS_BELGES.csss.menage2revenus, 'menage2revenus');
  assert(LOIS_BELGES.csss.menage1revenu, 'menage1revenu');
});

// ── Chèques-repas ──
test('Chèques-repas valeur faciale max 8€', () => eq(LOIS_BELGES.chequesRepas.valeurFaciale.max, 8, 'CR max'));
test('Chèques-repas part patronale max 6.91€', () => eq(LOIS_BELGES.chequesRepas.partPatronale.max, 6.91, 'CR empl'));

// ── Saisies sur salaire ──
test('Barèmes saisie travail définis', () => {
  assert(Array.isArray(SAISIE_2026_TRAVAIL), 'array');
  assert(SAISIE_2026_TRAVAIL.length >= 4, 'min 4 tranches');
});
test('Barèmes saisie remplacement définis', () => {
  assert(Array.isArray(SAISIE_2026_REMPLACEMENT), 'array');
});
test('Immunité enfant saisie définie', () => {
  assert(typeof SAISIE_IMMUN_ENFANT_2026 === 'number', 'nombre');
  assert(SAISIE_IMMUN_ENFANT_2026 > 70, '>70€');
});

// ── Allocations familiales ──
test('AF régions définies (VL, WAL, BXL)', () => {
  assert(AF_REGIONS, 'existe');
  assert(AF_REGIONS.VL, 'Flandre (VL)');
  assert(AF_REGIONS.WAL, 'Wallonie (WAL)');
  assert(AF_REGIONS.BXL, 'Bruxelles (BXL)');
});

// ═══ CHARGER payroll-engine.js ═══
console.log('\n═══ 2. MOTEUR DE PAIE (payroll-engine.js) ═══');

const peSrc = fs.readFileSync(path.join(__dirname, '..', 'app', 'lib', 'payroll-engine.js'), 'utf-8');
const peClean = peSrc
  .replace(/"use client";?/g, '')
  .replace(/^import .+$/gm, '')
  .replace(/^export function /gm, 'function ')
  .replace(/^export \{[^}]*\};?$/gm, '');

let calcPrecompteExact, quickPP, quickNet, calcPayroll, calcPeculeDouble, calcProrata, calc13eMois, calcQuotiteSaisissable, calcAllocEnfant;
try {
  // Inject the loaded constants
  const fullCode = `
    const LOIS_BELGES = ${JSON.stringify(LOIS_BELGES)};
    const TX_ONSS_W = ${TX_ONSS_W};
    const TX_ONSS_E = ${TX_ONSS_E};
    const TX_AT = ${TX_AT};
    const PV_SIMPLE = ${PV_SIMPLE};
    const PV_DOUBLE = ${PV_DOUBLE};
    const PP_EST = ${PP_EST};
    const SAISIE_2026_TRAVAIL = ${JSON.stringify(SAISIE_2026_TRAVAIL)};
    const SAISIE_2026_REMPLACEMENT = ${JSON.stringify(SAISIE_2026_REMPLACEMENT)};
    const SAISIE_IMMUN_ENFANT_2026 = ${SAISIE_IMMUN_ENFANT_2026};
    const AF_REGIONS = ${JSON.stringify(AF_REGIONS)};
    ${peClean}
    return { calcPrecompteExact, quickPP, quickNet, calcPayroll, calcPeculeDouble, calcProrata, calc13eMois, calcQuotiteSaisissable, calcAllocEnfant };
  `;
  const fn = new Function(fullCode);
  const r = fn();
  calcPrecompteExact = r.calcPrecompteExact;
  quickPP = r.quickPP;
  quickNet = r.quickNet;
  calcPayroll = r.calcPayroll;
  calcPeculeDouble = r.calcPeculeDouble;
  calcProrata = r.calcProrata;
  calc13eMois = r.calc13eMois;
  calcQuotiteSaisissable = r.calcQuotiteSaisissable;
  calcAllocEnfant = r.calcAllocEnfant;
  console.log('  ✓ payroll-engine.js chargé avec succès');
} catch (e) {
  console.error('  ✗ Erreur chargement payroll-engine.js:', e.message);
  process.exit(1);
}

// ── calcPrecompteExact ──
test('PP isolé 3000€ brut — résultat cohérent', () => {
  const r = calcPrecompteExact(3000, { situation: 'isole' });
  assert(r, 'résultat');
  assert(r.pp > 0, 'PP > 0');
  assert(r.pp < 1200, 'PP < 1200');
});

test('PP isolé 3000€ — détails disponibles', () => {
  const r = calcPrecompteExact(3000, { situation: 'isole' });
  assert(typeof r.rate === 'number', 'rate');
  assert(typeof r.forfait === 'number', 'forfait');
  assert(typeof r.reduction === 'number', 'reduction');
});

test('PP marié 1 revenu 3500€ — barème 2', () => {
  const r = calcPrecompteExact(3500, { situation: 'marie_1r' });
  const r2 = calcPrecompteExact(3500, { situation: 'isole' });
  assert(r.pp < r2.pp, 'barème 2 moins élevé que barème 1');
});

test('PP avec 2 enfants — réduction', () => {
  const sans = calcPrecompteExact(3000, { situation: 'isole', enfants: 0 });
  const avec = calcPrecompteExact(3000, { situation: 'isole', enfants: 2 });
  assert(avec.pp < sans.pp, 'enfants réduisent le PP');
});

test('PP parent isolé — réduction supplémentaire', () => {
  const normal = calcPrecompteExact(3000, { situation: 'isole', enfants: 1 });
  const pi = calcPrecompteExact(3000, { situation: 'isole', enfants: 1, parentIsole: true });
  assert(pi.pp < normal.pp, 'parent isolé réduit le PP');
});

test('PP brut 0 — retourne 0', () => {
  const r = calcPrecompteExact(0, {});
  eq(r.pp, 0, 'PP 0');
});

test('PP brut négatif — retourne 0', () => {
  const r = calcPrecompteExact(-500, {});
  eq(r.pp, 0, 'PP 0');
});

test('PP temps partiel 50% — proportionnel', () => {
  const r = calcPrecompteExact(3000, { situation: 'isole', regime: 50 });
  const rFull = calcPrecompteExact(1500, { situation: 'isole' });
  near(r.pp, rFull.pp, 1, 'PP temps partiel');
});

// ── quickPP / quickNet ──
test('quickPP 3000€ — retourne un nombre > 0', () => {
  const pp = quickPP(3000);
  assert(typeof pp === 'number', 'nombre');
  assert(pp > 0, '>0');
  assert(pp < 1500, '<1500');
});

test('quickNet 3000€ — entre 1800 et 2600', () => {
  const net = quickNet(3000);
  assert(net > 1800, '>1800');
  assert(net < 2600, '<2600');
});

test('quickNet cohérent : brut - ONSS - PP', () => {
  const brut = 3500;
  const net = quickNet(brut);
  const onss = Math.round(brut * TX_ONSS_W * 100) / 100;
  const pp = quickPP(brut);
  near(net, brut - onss - pp, 1, 'net = brut - onss - pp');
});

// ── calcPayroll (brut, statut, familial, charges, regime) ──
test('calcPayroll — fiche de paie complète', () => {
  const r = calcPayroll(3000, 'employe', 'isole', 0, 100);
  assert(r, 'résultat');
  assert(r.net > 0, 'net > 0');
  assert(r.onssE > 0, 'onssE > 0');
  assert(r.coutTotal > 3000, 'coût total > brut');
});

test('calcPayroll brut 0 — résultat vide', () => {
  const r = calcPayroll(0);
  eq(r.net, 0, 'net 0');
});

// ── calcPeculeDouble (brutAnnuel) ──
test('calcPeculeDouble — retourne objet avec net', () => {
  const r = calcPeculeDouble(36000);
  assert(r, 'résultat');
  assert(r.base > 0, 'base > 0');
  assert(r.net > 0, 'net > 0');
  assert(r.onss > 0, 'onss retenu');
});

test('calcPeculeDouble — proportionnel au brut annuel', () => {
  const r1 = calcPeculeDouble(36000);
  const r2 = calcPeculeDouble(48000);
  assert(r2.base > r1.base, 'plus haut brut = plus haut pécule');
});

// ── calcProrata ──
test('calcProrata — calcul au prorata', () => {
  const r = calcProrata(3000, 15, 30);
  near(r, 1500, 1, 'prorata 15/30');
});

// ── calc13eMois (brutMensuel) ──
test('calc13eMois — retourne objet avec net', () => {
  const r = calc13eMois(3000);
  assert(r, 'résultat');
  assert(r.brut > 0, 'brut');
  assert(r.net > 0, 'net');
  assert(r.onss > 0, 'onss');
});

// ── calcQuotiteSaisissable (retourne objet {saisissable, protege, ...}) ──
test('Saisie sur salaire — sous 1260€ insaisissable', () => {
  const r = calcQuotiteSaisissable(1200, 0);
  assert(r, 'résultat');
  eq(r.saisissable, 0, 'insaisissable');
});

test('Saisie sur salaire — au-dessus 1700€', () => {
  const r = calcQuotiteSaisissable(2000, 0);
  assert(r.saisissable > 0, 'saisissable');
});

test('Saisie — enfants augmentent immunité', () => {
  const sans = calcQuotiteSaisissable(2000, 0);
  const avec = calcQuotiteSaisissable(2000, 2);
  assert(avec.saisissable < sans.saisissable, 'enfants réduisent saisissable');
});

test('Saisie — pension alimentaire saisissable en totalité', () => {
  const r = calcQuotiteSaisissable(2000, 0, false, true);
  eq(r.saisissable, 2000, 'tout saisissable');
});

// ── calcAllocEnfant (region, birthYear, age) ──
test('Allocations familiales Flandre (enfant né après 2019)', () => {
  const r = calcAllocEnfant('VL', 2022, 5);
  assert(typeof r === 'number', 'nombre');
  assert(r > 0, '>0');
});

test('Allocations familiales Wallonie (enfant né après 2020)', () => {
  const r = calcAllocEnfant('WAL', 2022, 3);
  assert(r > 0, '>0');
});

test('Allocations familiales Bruxelles (enfant né après 2020)', () => {
  const r = calcAllocEnfant('BXL', 2022, 5);
  assert(r > 0, '>0');
});

test('Allocations familiales — région invalide retourne 0', () => {
  const r = calcAllocEnfant('INVALID', 2022, 5);
  eq(r, 0, '0');
});

// ═══ VÉRIFIER FICHIERS MODULES ═══
console.log('\n═══ 3. VÉRIFICATION FICHIERS MODULES ═══');

const moduleFiles = [
  'app/modules/ClotureMensuelle.js',
  'app/modules/PortailClientSS.js',
  'app/modules/FloatingLegalAgent.js',
  'app/modules/ModsBatch3.js',
  'app/modules/ModsBatch1.js',
  'app/modules/ModsBatch2.js',
  'app/modules/SprintComponents.js',
  'app/modules/DocumentForms.js',
  'app/lib/doc-generators.js',
  'app/lib/payroll-engine.js',
  'app/lib/lois-belges.js',
  'app/lib/shared-ui.js',
  'app/lib/i18n.js',
];

for (const f of moduleFiles) {
  test(`Fichier ${f} existe`, () => {
    const p = path.join(__dirname, '..', f);
    assert(fs.existsSync(p), `${f} manquant`);
    const stat = fs.statSync(p);
    assert(stat.size > 100, `${f} trop petit (${stat.size}b)`);
  });
}

test('FloatingLegalAgent contient LEGAL_KB', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/modules/FloatingLegalAgent.js'), 'utf-8');
  assert(src.includes('LEGAL_KB'), 'LEGAL_KB');
  assert(src.includes('AGENT_SYS_FR'), 'AGENT_SYS_FR');
  assert(src.includes('AGENT_QUICK'), 'AGENT_QUICK');
  assert(src.includes('export default'), 'export default');
});

test('ClotureMensuelle exporte le composant', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/modules/ClotureMensuelle.js'), 'utf-8');
  assert(src.includes('export default'), 'export default');
  assert(src.includes("'use client'"), 'use client');
});

test('PortailClientSS exporte le composant', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/modules/PortailClientSS.js'), 'utf-8');
  assert(src.includes('export default'), 'export default');
  assert(src.includes("'use client'"), 'use client');
});

// ═══ VÉRIFIER INTÉGRITÉ MONOLITHE ═══
console.log('\n═══ 4. INTÉGRITÉ MONOLITHE ═══');

const monoSrc = fs.readFileSync(path.join(__dirname, '..', 'app/AureusSocialPro.js'), 'utf-8');

test('Monolithe contient export default', () => {
  assert(monoSrc.includes('export default function AureusSocialPro'), 'export');
});

test('Monolithe utilise ClotureMensuelleLazy', () => {
  assert(monoSrc.includes('ClotureMensuelleLazy'), 'lazy import');
  assert(!monoSrc.includes('<ClotureMensuelle '), 'ancien ref supprimée');
});

test('Monolithe utilise PortailClientSSLazy', () => {
  assert(monoSrc.includes('PortailClientSSLazy'), 'lazy import');
  assert(!monoSrc.includes('<PortailClientSS '), 'ancien ref supprimée');
});

test('Monolithe utilise FloatingLegalAgentLazy', () => {
  assert(monoSrc.includes('FloatingLegalAgentLazy'), 'lazy import');
  assert(!monoSrc.includes('<FloatingLegalAgent '), 'ancien ref supprimée');
});

test('LEGAL_KB supprimé du monolithe', () => {
  assert(!monoSrc.includes('const LEGAL_KB='), 'LEGAL_KB supprimé');
});

test('Monolithe < 24000 lignes', () => {
  const lines = monoSrc.split('\n').length;
  assert(lines < 24000, `${lines} lignes — encore trop gros`);
});

test('I18N extrait du monolithe → i18n.js', () => {
  assert(!monoSrc.includes("const I18N = {"), 'I18N ne devrait plus être défini dans le monolithe');
  assert(monoSrc.includes('import { I18N }'), 'import I18N présent');
  const i18nSrc = fs.readFileSync(path.join(__dirname, '..', 'app/lib/i18n.js'), 'utf-8');
  assert(i18nSrc.includes('export const I18N'), 'export const I18N');
  assert(i18nSrc.includes("'nav.dashboard'"), 'contient nav.dashboard');
  assert(i18nSrc.includes("'btn.save'"), 'contient btn.save');
});

test('KPI mémorisés avec useMemo', () => {
  assert(monoSrc.includes('kpiData=useMemo'), 'kpiData useMemo');
  assert(monoSrc.includes('kpiData.scoreMoyen'), 'scoreMoyen utilisé');
  assert(monoSrc.includes('kpiData.dossiersRisque'), 'dossiersRisque utilisé');
  assert(monoSrc.includes('kpiData.masseSalariale'), 'masseSalariale utilisé');
});

test('escapeHtml défini pour protection XSS', () => {
  assert(monoSrc.includes('function escapeHtml('), 'escapeHtml défini');
  assert(monoSrc.includes('escapeHtml(title)'), 'title échappé');
  assert(monoSrc.includes('escapeHtml(name)'), 'name échappé dans attestations');
});

// ═══ 5. VÉRIFICATIONS SÉCURITÉ API ═══
console.log('\n═══ 5. VÉRIFICATIONS SÉCURITÉ API ═══');

test('API push requiert auth', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/push/route.js'), 'utf-8');
  assert(src.includes('getAuthToken'), 'getAuthToken');
  assert(src.includes("Unauthorized"), 'retourne 401');
});

test('API webhooks valide les URLs (anti-SSRF)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/webhooks/route.js'), 'utf-8');
  assert(src.includes('isValidWebhookUrl'), 'validation URL');
  assert(src.includes('169.254.169.254'), 'bloque AWS metadata');
  assert(src.includes("protocol !== 'https:'"), 'HTTPS requis');
  assert(src.includes("Unauthorized"), 'requiert auth');
});

test('API lois-update requiert auth', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/lois-update/route.js'), 'utf-8');
  assert(src.includes("authorization"), 'vérifie authorization header');
  assert(src.includes("Unauthorized"), 'retourne 401');
});

// ═══ 6. NOUVELLES FONCTIONNALITÉS ═══
console.log('\n═══ 6. NOUVELLES FONCTIONNALITÉS ═══');

test('SEPA pain.001.003 XML generator existe', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/lib/xml-generators.js'), 'utf-8');
  assert(src.includes('genSEPAXML'), 'fonction genSEPAXML exportée');
  assert(src.includes('pain.001.001.03'), 'format pain.001.001.03');
  assert(src.includes('CstmrCdtTrfInitn'), 'element racine ISO 20022');
  assert(src.includes('CdtTrfTxInf'), 'transactions individuelles');
  assert(src.includes('IBAN'), 'support IBAN');
  assert(src.includes('SEPA'), 'service level SEPA');
});

test('SEPA XML structure ISO 20022 complète', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/lib/xml-generators.js'), 'utf-8');
  assert(src.includes('GrpHdr'), 'GroupHeader');
  assert(src.includes('PmtInf'), 'PaymentInformation');
  assert(src.includes('NbOfTxs'), 'nombre de transactions');
  assert(src.includes('CtrlSum'), 'somme de contrôle');
  assert(src.includes('DbtrAcct'), 'compte débiteur');
  assert(src.includes('CdtrAcct'), 'compte créditeur');
  assert(src.includes('InstdAmt'), 'montant instruit');
  assert(src.includes('RmtInf'), 'information remise');
});

test('API facturation existe et requiert auth', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/facturation/route.js'), 'utf-8');
  assert(src.includes('getAuthToken'), 'fonction auth');
  assert(src.includes("Unauthorized"), 'retourne 401');
  assert(src.includes('generate'), 'action generate');
  assert(src.includes('list'), 'action list');
  assert(src.includes('update_status'), 'action update_status');
});

test('API facturation grille tarifaire correcte', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/facturation/route.js'), 'utf-8');
  assert(src.includes('forfait_base'), 'forfait base');
  assert(src.includes('cout_par_fiche'), 'coût par fiche');
  assert(src.includes('cout_dimona'), 'coût Dimona');
  assert(src.includes('cout_dmfa'), 'coût DmfA');
  assert(src.includes('cout_belcotax'), 'coût Belcotax');
  assert(src.includes('remise_volume'), 'remise volume');
  assert(src.includes('21'), 'TVA 21%');
});

test('API facturation calcul facture complet', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/api/facturation/route.js'), 'utf-8');
  assert(src.includes('calculerFacture'), 'fonction calculerFacture');
  assert(src.includes('genererNumeroFacture'), 'fonction genererNumeroFacture');
  assert(src.includes('sous_total'), 'sous-total');
  assert(src.includes('tva_montant'), 'montant TVA');
  assert(src.includes('total_ttc'), 'total TTC');
  assert(src.includes('communication'), 'communication structurée');
});

test('IP Whitelist UI dans SecuriteData', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/AureusSocialPro.js'), 'utf-8');
  assert(src.includes('IP Whitelist'), 'section IP Whitelist');
  assert(src.includes('ip_whitelist'), 'table ip_whitelist');
  assert(src.includes('addIp'), 'fonction ajout IP');
  assert(src.includes('deleteIp'), 'fonction suppression IP');
  assert(src.includes('toggleIp'), 'fonction toggle IP');
  assert(src.includes('cidrRegex'), 'validation CIDR');
});

test('Checklist sécurité mise à jour (16/16)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'app/AureusSocialPro.js'), 'utf-8');
  // Vérifier que les anciens "todo" sont maintenant "ok"
  const startIdx = src.indexOf('const securityChecks=[');
  const scoreIdx = src.indexOf('const score=', startIdx);
  const securiteSection = src.substring(startIdx, scoreIdx);
  assert(securiteSection.length > 100, 'section trouvée');
  assert(!securiteSection.includes("status:'todo'"), 'plus aucun check en todo');
  assert(securiteSection.includes('TOTP'), '2FA/TOTP présent');
  assert(securiteSection.includes('Middleware CIDR'), 'IP whitelist marqué comme actif');
  assert(securiteSection.includes('SSRF'), 'SSRF marqué comme actif');
  assert(securiteSection.includes('OWASP'), 'OWASP marqué comme actif');
});

// ═══ RÉSUMÉ ═══
console.log('\n══════════════════════════════════════════');
console.log(`  RÉSULTATS: ${passed}/${total} tests passés`);
if (failed > 0) {
  console.log(`  ❌ ${failed} échec(s):`);
  failures.forEach(f => console.log(`     • ${f.name}: ${f.error}`));
}
console.log('══════════════════════════════════════════\n');
process.exit(failed > 0 ? 1 : 0);
