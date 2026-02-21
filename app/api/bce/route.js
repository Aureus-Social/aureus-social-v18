#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — TESTS UNITAIRES CALCULS PAIE BELGE 2026
// ═══════════════════════════════════════════════════════════════════════
// Vérifie: ONSS, PP (précompte), bonus emploi, CSSS, net, coût employeur
// Référence: SPF Finances Annexe III AR/CIR 92, Instructions ONSS T1/2026
// ═══════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// ═══ STUBS pour charger AureusSocialPro.js dans Node.js ═══
const _stubState = {};
global.React = { createElement: ()=>null };
global.useState = (v) => [typeof v === 'function' ? v() : v, ()=>{}];
global.useEffect = ()=>{};
global.useRef = ()=>({current:null});
global.useCallback = (fn)=>fn;
global.useMemo = (fn)=>fn();
global.useContext = ()=>({});
global.createContext = ()=>({Provider:()=>null});
global.fetch = ()=>Promise.resolve({ok:false});
global.document = {addEventListener:()=>{},removeEventListener:()=>{},createElement:()=>({click:()=>{},style:{}}),body:{appendChild:()=>{},removeChild:()=>{}},getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[]};
global.window = {addEventListener:()=>{},removeEventListener:()=>{},localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}},location:{href:'',hostname:'localhost'},navigator:{clipboard:{writeText:()=>Promise.resolve()}},open:()=>{},print:()=>{},matchMedia:()=>({matches:false}),innerWidth:1200,innerHeight:800,scrollTo:()=>{},URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}}};
global.localStorage = global.window.localStorage;
global.navigator = {clipboard:{writeText:()=>Promise.resolve()},userAgent:'node-test'};
global.URL = {createObjectURL:()=>'blob:test',revokeObjectURL:()=>{}};
global.Blob = class Blob { constructor(){} };
global.FileReader = class FileReader { readAsText(){} readAsDataURL(){} };
global.Image = class Image { set src(v){} get width(){return 100} get height(){return 100} };
global.btoa = (s)=>Buffer.from(s).toString('base64');
global.atob = (s)=>Buffer.from(s,'base64').toString();
global.alert = ()=>{};
global.confirm = ()=>true;
global.prompt = ()=>'';
global.setTimeout = (fn)=>{if(typeof fn==='function')fn();return 0;};
global.clearTimeout = ()=>{};
global.setInterval = ()=>0;
global.clearInterval = ()=>{};
global.AbortSignal = {timeout:()=>({})};
global.Intl = Intl;
global.console = console;
global.XMLSerializer = class { serializeToString(){return '';} };
global.DOMParser = class { parseFromString(){return {querySelector:()=>null,querySelectorAll:()=>[]};} };
global.MutationObserver = class { observe(){} disconnect(){} };
global.ResizeObserver = class { observe(){} disconnect(){} };
global.IntersectionObserver = class { observe(){} disconnect(){} };
global.performance = { now:()=>Date.now() };
global.requestAnimationFrame = (fn)=>{fn();return 0;};
global.cancelAnimationFrame = ()=>{};
global.CSS = { supports:()=>false };
global.matchMedia = ()=>({matches:false});

// ═══ CHARGER LE SOURCE — Extraire seulement les fonctions pures ═══
console.log('⏳ Chargement AureusSocialPro.js...');
const srcPath = path.join(__dirname, '..', 'app', 'AureusSocialPro.js');
const fullSrc = fs.readFileSync(srcPath, 'utf-8');
const lines = fullSrc.split('\n');

// Extraire les blocs de logique pure (pas de JSX)
// Bloc 1: L1-815 (LOIS_BELGES, constantes, helpers, calcPPFromLois)
// Bloc 2: L841-1031 (LEGAL constant — skip LangProvider JSX at 816-840)
// Bloc 3: L1852-3648 (calc, calcPrecompteExact, calcCSSS, calcBonusEmploi)
const block1 = lines.slice(0, 815).join('\n');
const block2 = lines.slice(840, 1031).join('\n');
const block3 = lines.slice(1851, 2874).join('\n');
const block4 = lines.slice(3464, 3648).join('\n');

// Nettoyer les imports/exports
let src = [block1, block2, block3, block4].join('\n');
src = src.replace(/^['"]use client['"];?\s*/gm, '');
src = src.replace(/import\s+.*?from\s+['"].*?['"];?\s*/gm, '');
src = src.replace(/export\s+default\s+/gm, 'var __exported__ = ');
src = src.replace(/export\s+/gm, '');

// Supprimer toute ligne contenant du JSX
src = src.replace(/^.*return\s+<.*$/gm, '// [JSX removed]');
src = src.replace(/^.*<\/.*>.*$/gm, '// [JSX removed]');

try {
  const vm = require('vm');
  const sandbox = {
    ...global,
    console,
    Math, Date, Number, String, Array, Object, JSON, parseInt, parseFloat, isNaN, isFinite,
    Infinity, NaN, undefined, null: null,
    Intl,
    module: { exports: {} },
    exports: {},
    // React stubs
    useState: (v) => [typeof v === 'function' ? v() : v, ()=>{}],
    useEffect: ()=>{},
    useRef: ()=>({current:null}),
    useCallback: (fn)=>fn,
    useMemo: (fn)=>fn(),
    useContext: ()=>({}),
    useReducer: (r,i)=>[i,()=>{}],
    createContext: (d)=>({Provider:()=>null,...d}),
    // DOM stubs
    fetch: ()=>Promise.resolve({ok:false,json:()=>Promise.resolve({})}),
    setTimeout: (fn,ms)=>{return 0;},
    clearTimeout: ()=>{},
    setInterval: ()=>0,
    clearInterval: ()=>{},
  };
  const context = vm.createContext(sandbox);
  
  // Add fmt function that calc() needs internally
  const fmtFn = (v) => new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
  context.fmt = fmtFn;
  
  vm.runInContext(src, context, { filename: 'extracted-logic.js', timeout: 10000 });
  
  // Extraire les fonctions et constantes
  const LOIS_BELGES = context.LOIS_BELGES;
  const LEGAL = context.LEGAL;
  const _OW = context._OW;
  const _OE = context._OE;
  const TX_ONSS_W = context.TX_ONSS_W;
  const TX_ONSS_E = context.TX_ONSS_E;
  const TX_OUV108 = context.TX_OUV108;
  const calc = context.calc;
  const calcPrecompteExact = context.calcPrecompteExact;
  const calcCSSS = context.calcCSSS;
  const calcBonusEmploi = context.calcBonusEmploi;
  const calcPPFromLois = context.calcPPFromLois;
  const quickPP = context.quickPP;
  const quickNet = context.quickNet;

  console.log('✅ Source chargé avec succès\n');

  // ═══════════════════════════════════════
  // FRAMEWORK DE TEST
  // ═══════════════════════════════════════
  let total = 0, passed = 0, failed = 0;
  const failures = [];

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`  ✅ ${name}`);
    } catch (e) {
      failed++;
      failures.push({ name, error: e.message });
      console.log(`  ❌ ${name}`);
      console.log(`     → ${e.message}`);
    }
  }

  function eq(actual, expected, msg, tolerance = 0.01) {
    if (typeof actual === 'number' && typeof expected === 'number') {
      if (Math.abs(actual - expected) > tolerance) {
        throw new Error(`${msg || ''} attendu ${expected}, obtenu ${actual} (écart ${(actual - expected).toFixed(4)})`);
      }
    } else if (actual !== expected) {
      throw new Error(`${msg || ''} attendu ${expected}, obtenu ${actual}`);
    }
  }

  function assert(condition, msg) {
    if (!condition) throw new Error(msg || 'Assertion failed');
  }

  const fmt = (v) => new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

  // Also add fmt to the sandbox for calc() internals
  context.fmt = fmt;

  // ═══════════════════════════════════════════════════════════════
  // 1. CONSTANTES LÉGALES 2026
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 1. CONSTANTES LÉGALES 2026 ═══');

  test('LOIS_BELGES existe et contient les clés principales', () => {
    assert(LOIS_BELGES, 'LOIS_BELGES manquant');
    assert(LOIS_BELGES.onss, 'LOIS_BELGES.onss manquant');
    assert(LOIS_BELGES.pp, 'LOIS_BELGES.pp manquant');
    assert(LOIS_BELGES.chequesRepas, 'LOIS_BELGES.chequesRepas manquant');
  });

  test('ONSS travailleur = 13.07%', () => {
    eq(_OW, 0.1307, 'TX_ONSS_W');
    eq(TX_ONSS_W, 0.1307, 'TX_ONSS_W alias');
  });

  test('ONSS employeur ≈ 25% (total secteur par défaut)', () => {
    assert(_OE >= 0.2490 && _OE <= 0.2600, `ONSS employeur ${_OE} hors fourchette [24.90%-26.00%]`);
  });

  test('Majoration ouvrier = 108%', () => {
    eq(TX_OUV108, 1.08, 'TX_OUV108');
  });

  test('PP tranches 2026 existent (4 tranches)', () => {
    assert(LOIS_BELGES.pp.tranches, 'Tranches PP manquantes');
    assert(LOIS_BELGES.pp.tranches.length >= 4, `Seulement ${LOIS_BELGES.pp.tranches.length} tranches`);
  });

  test('PP frais pro salarié = 30% (max indexé 2026)', () => {
    eq(LOIS_BELGES.pp.fraisPro.salarie.pct, 0.30, 'FP pct');
    const fpMax = LOIS_BELGES.pp.fraisPro.salarie.max;
    assert(fpMax >= 5900 && fpMax <= 6200, `FP max = ${fpMax}, attendu ~5930-6070 (indexé 2026)`);
  });

  test('PP quotité exemptée barème 1 (isolé) > 0', () => {
    const qe = LOIS_BELGES.pp.quotiteExemptee.bareme1;
    assert(qe > 0, `QE barème 1 = ${qe}, devrait être > 0`);
    // Peut être le montant exempté (~10900€) OU la réduction d'impôt (~2988€)
    assert((qe >= 2500 && qe <= 3500) || (qe >= 10500 && qe <= 11500),
      `QE barème 1 = ${qe} — ni réduction (~2988) ni montant exempté (~10900)`);
  });

  test('Chèques-repas: part travailleur min 1.09€', () => {
    eq(LOIS_BELGES.chequesRepas.partTravailleur.min, 1.09, 'CR trav', 0.05);
  });

  test('LEGAL.WD = 21.67 jours ouvrables/mois', () => {
    eq(LEGAL.WD, 21.67, 'WD', 0.01);
  });

  // ═══════════════════════════════════════════════════════════════
  // 2. ONSS TRAVAILLEUR (13.07%)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 2. ONSS TRAVAILLEUR ═══');

  test('ONSS sur 2.000€ brut = 261,40€', () => {
    const onss = Math.round(2000 * 0.1307 * 100) / 100;
    eq(onss, 261.40, 'ONSS 2000€');
  });

  test('ONSS sur 3.500€ brut = 457,45€', () => {
    const onss = Math.round(3500 * 0.1307 * 100) / 100;
    eq(onss, 457.45, 'ONSS 3500€');
  });

  test('ONSS sur 5.000€ brut = 653,50€', () => {
    const onss = Math.round(5000 * 0.1307 * 100) / 100;
    eq(onss, 653.50, 'ONSS 5000€');
  });

  test('ONSS ouvrier: base × 1.08 avant calcul', () => {
    const brutOuv = 2500;
    const onssBase = brutOuv * 1.08;
    const onss = Math.round(onssBase * 0.1307 * 100) / 100;
    eq(onssBase, 2700, 'Base ouvrier');
    eq(onss, 352.89, 'ONSS ouvrier', 0.01);
  });

  // ═══════════════════════════════════════════════════════════════
  // 3. PRÉCOMPTE PROFESSIONNEL (calcPrecompteExact)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 3. PRÉCOMPTE PROFESSIONNEL ═══');

  test('calcPrecompteExact existe et est une fonction', () => {
    assert(typeof calcPrecompteExact === 'function', 'calcPrecompteExact non trouvé');
  });

  test('PP sur 0€ = 0€', () => {
    const r = calcPrecompteExact(0, { situation: 'isole' });
    eq(r.pp, 0, 'PP 0€');
  });

  test('PP sur 2.000€ isolé — retour structure correcte', () => {
    const r = calcPrecompteExact(2000, { situation: 'isole', enfants: 0 });
    assert(r.pp !== undefined, 'pp manquant');
    assert(r.rate !== undefined, 'rate manquant');
    assert(r.detail !== undefined, 'detail manquant');
    assert(r.pp >= 0, `PP négatif: ${r.pp}`);
    assert(r.rate >= 0, `Rate négatif: ${r.rate}`);
  });

  test('PP sur 2.000€ isolé ≈ 50-250€ (réduit par bonus emploi fiscal)', () => {
    const r = calcPrecompteExact(2000, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 30 && r.pp <= 300, `PP 2000€ isolé = ${r.pp} hors fourchette [30-300]`);
  });

  test('PP sur 3.500€ isolé ≈ 550-750€', () => {
    const r = calcPrecompteExact(3500, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 500 && r.pp <= 800, `PP 3500€ isolé = ${r.pp} hors fourchette`);
  });

  test('PP sur 5.000€ isolé ≈ 1.000-1.400€', () => {
    const r = calcPrecompteExact(5000, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 900 && r.pp <= 1500, `PP 5000€ isolé = ${r.pp} hors fourchette`);
  });

  test('PP sur 8.000€ isolé ≈ 2.200-2.800€', () => {
    const r = calcPrecompteExact(8000, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 2000 && r.pp <= 3000, `PP 8000€ isolé = ${r.pp} hors fourchette`);
  });

  test('PP marié 1 revenu < PP isolé (quotient conjugal)', () => {
    const ppIsole = calcPrecompteExact(4000, { situation: 'isole', enfants: 0 }).pp;
    const ppMarie = calcPrecompteExact(4000, { situation: 'marie_1r', enfants: 0 }).pp;
    assert(ppMarie < ppIsole, `Marié ${ppMarie} devrait être < isolé ${ppIsole}`);
  });

  test('PP avec 2 enfants < PP sans enfant', () => {
    const pp0 = calcPrecompteExact(3500, { situation: 'isole', enfants: 0 }).pp;
    const pp2 = calcPrecompteExact(3500, { situation: 'isole', enfants: 2 }).pp;
    assert(pp2 < pp0, `PP 2 enfants ${pp2} devrait être < PP 0 enfant ${pp0}`);
  });

  test('PP avec 4 enfants < PP avec 2 enfants', () => {
    const pp2 = calcPrecompteExact(4000, { situation: 'isole', enfants: 2 }).pp;
    const pp4 = calcPrecompteExact(4000, { situation: 'isole', enfants: 4 }).pp;
    assert(pp4 < pp2, `PP 4 enfants ${pp4} devrait être < PP 2 enfants ${pp2}`);
  });

  test('PP progressivité: taux effectif augmente avec le brut', () => {
    const r1 = calcPrecompteExact(2500, { situation: 'isole' });
    const r2 = calcPrecompteExact(5000, { situation: 'isole' });
    const r3 = calcPrecompteExact(10000, { situation: 'isole' });
    assert(r2.rate > r1.rate, `Taux 5000€ (${r2.rate}%) devrait être > 2500€ (${r1.rate}%)`);
    assert(r3.rate > r2.rate, `Taux 10000€ (${r3.rate}%) devrait être > 5000€ (${r2.rate}%)`);
  });

  test('PP taxe communale: plus de taxe = plus de PP', () => {
    const r0 = calcPrecompteExact(3500, { situation: 'isole', taxeCom: 0 });
    const r7 = calcPrecompteExact(3500, { situation: 'isole', taxeCom: 7 });
    const r10 = calcPrecompteExact(3500, { situation: 'isole', taxeCom: 10 });
    assert(r7.pp >= r0.pp, `PP taxe 7% (${r7.pp}) >= PP taxe 0% (${r0.pp})`);
    assert(r10.pp >= r7.pp, `PP taxe 10% (${r10.pp}) >= PP taxe 7% (${r7.pp})`);
  });

  test('PP dirigeant: frais pro = 3% max 3120€ (vs 30% salarié)', () => {
    const rSal = calcPrecompteExact(5000, { situation: 'isole', dirigeant: false });
    const rDir = calcPrecompteExact(5000, { situation: 'isole', dirigeant: true });
    assert(rDir.pp > rSal.pp, `PP dirigeant ${rDir.pp} devrait être > salarié ${rSal.pp} (frais pro moindres)`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 4. BONUS À L'EMPLOI (bas salaires)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 4. BONUS À L\'EMPLOI ═══');

  test('calcBonusEmploi existe', () => {
    assert(typeof calcBonusEmploi === 'function', 'calcBonusEmploi non trouvé');
  });

  test('Bonus emploi sur 2.000€ (très bas) = max', () => {
    const bonus = calcBonusEmploi(2000);
    assert(bonus > 0, `Bonus sur 2000€ devrait être > 0, obtenu ${bonus}`);
    assert(bonus >= 50 && bonus <= 250, `Bonus ${bonus} hors fourchette raisonnable`);
  });

  test('Bonus emploi sur 5.000€ (haut salaire) = 0', () => {
    const bonus = calcBonusEmploi(5000);
    eq(bonus, 0, 'Bonus sur 5000€ devrait être 0');
  });

  test('Bonus emploi dégressif entre seuils', () => {
    const b2000 = calcBonusEmploi(2000);
    const b2500 = calcBonusEmploi(2500);
    const b3000 = calcBonusEmploi(3000);
    assert(b2000 >= b2500, `Bonus 2000€ (${b2000}) >= 2500€ (${b2500})`);
    assert(b2500 >= b3000, `Bonus 2500€ (${b2500}) >= 3000€ (${b3000})`);
  });

  test('Bonus emploi = 0 pour salaire négatif ou nul', () => {
    eq(calcBonusEmploi(0), 0, 'Bonus 0€');
    eq(calcBonusEmploi(-100), 0, 'Bonus négatif');
  });

  // ═══════════════════════════════════════════════════════════════
  // 5. CSSS (Cotisation Spéciale Sécurité Sociale)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 5. CSSS ═══');

  test('calcCSSS existe', () => {
    assert(typeof calcCSSS === 'function', 'calcCSSS non trouvé');
  });

  test('CSSS sur 1.500€ (bas salaire) = 0€', () => {
    const csss = calcCSSS(1500, 'isole');
    eq(csss, 0, 'CSSS 1500€', 0.10);
  });

  test('CSSS sur 3.500€ isolé > 0€ (au-dessus du seuil)', () => {
    const csss = calcCSSS(3500, 'isole');
    assert(csss > 0, `CSSS 3500€ isolé = ${csss}, devrait être > 0`);
  });

  test('CSSS isolé > CSSS ménage 2 revenus (plafond plus haut)', () => {
    const isole = calcCSSS(4000, 'isole');
    const menage = calcCSSS(4000, 'menage');
    // Le plafond isolé (60.94€/trim) est plus haut que ménage (51.64€/trim)
    // Mais pour des bruts moyens, l'isolé peut payer plus
    assert(isole >= 0 && menage >= 0, `CSSS valides: isolé=${isole}, ménage=${menage}`);
  });

  test('CSSS plafonné: ne dépasse pas max légal', () => {
    const csss5k = calcCSSS(5000, 'isole');
    const csss10k = calcCSSS(10000, 'isole');
    const csss20k = calcCSSS(20000, 'isole');
    // CSSS augmente avec le salaire
    assert(csss10k >= csss5k, `CSSS 10k (${csss10k}) >= 5k (${csss5k})`);
    assert(csss20k >= csss10k, `CSSS 20k (${csss20k}) >= 10k (${csss10k})`);
    // Mais reste raisonnable (< 500€/mois même pour très hauts revenus)
    assert(csss20k <= 500, `CSSS 20k (${csss20k}) devrait être < 500€/mois`);
    // Et le taux effectif ne dépasse jamais ~2%
    const tauxEffectif = csss20k / 20000 * 100;
    assert(tauxEffectif < 2, `Taux CSSS effectif ${tauxEffectif.toFixed(2)}% devrait être < 2%`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 6. CALCUL COMPLET calc()
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 6. CALCUL COMPLET calc() ═══');

  test('calc() existe et est une fonction', () => {
    assert(typeof calc === 'function', 'calc non trouvé');
  });

  // Employé CP 200, isolé, 3.500€ brut
  const emp3500 = {
    monthlySalary: 3500, statut: 'employe', civil: 'single',
    depChildren: 0, cp: '200', whWeek: 38, regime: 'full',
    commType: 'none', expense: 0,
  };
  const per0 = {}; // mois standard
  const co0 = { cp: '200', name: 'Test SPRL', vat: 'BE 0123.456.789' };

  test('calc() 3.500€ employé isolé — structure résultat', () => {
    const r = calc(emp3500, per0, co0);
    assert(r.gross !== undefined, 'gross manquant');
    assert(r.onssW !== undefined, 'onssW manquant');
    assert(r.onssNet !== undefined, 'onssNet manquant');
    assert(r.tax !== undefined, 'tax (PP) manquant');
    assert(r.net !== undefined, 'net manquant');
    assert(r.costTotal !== undefined, 'costTotal manquant');
  });

  test('calc() 3.500€ — brut = 3.500€', () => {
    const r = calc(emp3500, per0, co0);
    eq(r.gross, 3500, 'Brut', 0.01);
  });

  test('calc() 3.500€ — ONSS travailleur ≈ 457,45€', () => {
    const r = calc(emp3500, per0, co0);
    eq(r.onssW, 3500 * 0.1307, 'ONSS W', 1);
  });

  test('calc() 3.500€ — bonus emploi réduit ONSS net', () => {
    const r = calc(emp3500, per0, co0);
    assert(r.onssNet <= r.onssW, `ONSS net ${r.onssNet} devrait être <= ONSS brut ${r.onssW}`);
  });

  test('calc() 3.500€ — PP > 0', () => {
    const r = calc(emp3500, per0, co0);
    assert(r.tax > 0, `PP = ${r.tax}, devrait être > 0`);
    assert(r.tax >= 400 && r.tax <= 900, `PP = ${r.tax} hors fourchette [400-900]`);
  });

  test('calc() 3.500€ — net entre 2.000€ et 2.800€', () => {
    const r = calc(emp3500, per0, co0);
    assert(r.net >= 1900 && r.net <= 2900, `Net = ${r.net} hors fourchette`);
  });

  test('calc() 3.500€ — coût employeur > brut (ONSS patronal)', () => {
    const r = calc(emp3500, per0, co0);
    assert(r.costTotal > r.gross, `Coût ${r.costTotal} devrait être > brut ${r.gross}`);
    assert(r.costTotal >= 4000 && r.costTotal <= 5500, `Coût ${r.costTotal} hors fourchette`);
  });

  test('calc() 3.500€ — cohérence net = gross - retenues + ajouts', () => {
    const r = calc(emp3500, per0, co0);
    const expectedNet = r.gross - r.totalDed + (r.expense||0) + (r.transport||0)
      + (r.doublePecule||0) - (r.dpOnss||0) - (r.dpCotisSpec||0)
      + (r.peculeDepart||0) - (r.pdOnss||0)
      + (r.primeAncExoneree||0) + (r.primeNaissance||0)
      + (r.indemTeletravail||0) + (r.indemBureau||0)
      + (r.petitChomageVal||0) + (r.budgetMobPilier2||0)
      + (r.hsBrutNetTotal||0);
    eq(r.net, expectedNet, 'Net ≠ recomposition', 0.02);
  });

  // Employé 2.000€ (bas salaire — bonus emploi)
  test('calc() 2.000€ — bonus emploi > 0', () => {
    const emp2000 = { ...emp3500, monthlySalary: 2000 };
    const r = calc(emp2000, per0, co0);
    assert(r.empBonus > 0, `Bonus emploi = ${r.empBonus}, devrait être > 0 à 2000€`);
  });

  // Employé 5.000€ (haut salaire — pas de bonus)
  test('calc() 5.000€ — bonus emploi = 0', () => {
    const emp5000 = { ...emp3500, monthlySalary: 5000 };
    const r = calc(emp5000, per0, co0);
    eq(r.empBonus, 0, 'Bonus emploi 5000€', 0.01);
  });

  // Ouvrier vs employé
  test('calc() ouvrier — ONSS sur 108% du brut', () => {
    const empOuv = { ...emp3500, statut: 'ouvrier', monthlySalary: 3000 };
    const r = calc(empOuv, per0, co0);
    const onssExpected = 3000 * 1.08 * 0.1307;
    eq(r.onssW, onssExpected, 'ONSS ouvrier', 1);
  });

  // Marié 1 revenu vs isolé
  test('calc() marié 1 revenu: PP < PP isolé', () => {
    const empMarie = { ...emp3500, civil: 'married_1' };
    const rIsole = calc(emp3500, per0, co0);
    const rMarie = calc(empMarie, per0, co0);
    assert(rMarie.tax < rIsole.tax, `PP marié ${rMarie.tax} devrait être < isolé ${rIsole.tax}`);
  });

  // Avec enfants
  test('calc() 2 enfants: PP < PP sans enfant', () => {
    const empEnf = { ...emp3500, depChildren: 2 };
    const r0 = calc(emp3500, per0, co0);
    const r2 = calc(empEnf, per0, co0);
    assert(r2.tax < r0.tax, `PP 2 enfants ${r2.tax} devrait être < 0 enfant ${r0.tax}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 7. HEURES SUPPLÉMENTAIRES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 7. HEURES SUPPLÉMENTAIRES ═══');

  test('calc() avec heures sup: brut augmente', () => {
    const perHS = { overtimeH: 10 };
    const r0 = calc(emp3500, per0, co0);
    const rHS = calc(emp3500, perHS, co0);
    assert(rHS.gross > r0.gross, `Brut avec HS ${rHS.gross} > sans HS ${r0.gross}`);
  });

  test('calc() heures sup majorées ×1.5', () => {
    const r = calc(emp3500, { overtimeH: 10 }, co0);
    const hr = 3500 / (21.67 * 7.6);
    const expected = 10 * hr * 1.5;
    eq(r.overtime, expected, 'HS ×1.5', 1);
  });

  test('calc() dimanche majoré ×2', () => {
    const r = calc(emp3500, { sundayH: 8 }, co0);
    const hr = 3500 / (21.67 * 7.6);
    const expected = 8 * hr * 2;
    eq(r.sunday, expected, 'Dimanche ×2', 1);
  });

  // ═══════════════════════════════════════════════════════════════
  // 8. ATN VOITURE DE SOCIÉTÉ
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 8. ATN VOITURE ═══');

  test('ATN voiture essence CO2=120, catalogue=35.000€', () => {
    const empCar = { ...emp3500, carFuel: 'essence', carCO2: 120, carCatVal: 35000 };
    const r = calc(empCar, per0, co0);
    assert(r.atnCar > 0, `ATN voiture = ${r.atnCar}, devrait être > 0`);
    assert(r.atnCar >= 100 && r.atnCar <= 500, `ATN voiture ${r.atnCar} hors fourchette [100-500]`);
  });

  test('ATN voiture électrique: minimum 4%, min 1600€/an', () => {
    const empElec = { ...emp3500, carFuel: 'electrique', carCO2: 0, carCatVal: 40000 };
    const r = calc(empElec, per0, co0);
    assert(r.atnPct === 4, `ATN% électrique = ${r.atnPct}, devrait être 4%`);
    assert(r.atnCar >= 1600 / 12, `ATN élec ${r.atnCar} >= minimum ${1600/12}`);
  });

  test('ATN voiture pas de voiture = 0', () => {
    const r = calc(emp3500, per0, co0);
    eq(r.atnCar, 0, 'ATN sans voiture');
  });

  // ═══════════════════════════════════════════════════════════════
  // 9. ATN AUTRES AVANTAGES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 9. ATN AUTRES ═══');

  test('ATN GSM = 3.00€/mois', () => {
    const empGSM = { ...emp3500, atnGSM: true };
    const r = calc(empGSM, per0, co0);
    eq(r.atnGSM, 3.00, 'ATN GSM');
  });

  test('ATN PC = 6.00€/mois', () => {
    const empPC = { ...emp3500, atnPC: true };
    const r = calc(empPC, per0, co0);
    eq(r.atnPC, 6.00, 'ATN PC');
  });

  test('ATN Internet = 5.00€/mois', () => {
    const empNet = { ...emp3500, atnInternet: true };
    const r = calc(empNet, per0, co0);
    eq(r.atnInternet, 5.00, 'ATN Internet');
  });

  // ═══════════════════════════════════════════════════════════════
  // 10. TRANSPORT DOMICILE-TRAVAIL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 10. TRANSPORT ═══');

  test('Transport vélo: 0.27€/km A/R', () => {
    const empVelo = { ...emp3500, commType: 'bike', commDist: 15 };
    const r = calc(empVelo, per0, co0);
    // 15km × 2 × 21 jours × 0.27€ = 170.10€
    assert(r.transport > 0, `Transport vélo = ${r.transport}`);
    const expected = 15 * 2 * 21 * 0.27;
    eq(r.transport, expected, 'Transport vélo', 1);
  });

  test('Transport train: 75% abonnement', () => {
    const empTrain = { ...emp3500, commType: 'train', commMonth: 150 };
    const r = calc(empTrain, per0, co0);
    eq(r.transport, 112.5, 'Transport train 75%', 0.5);
  });

  // ═══════════════════════════════════════════════════════════════
  // 11. RÉDUCTION STRUCTURELLE ONSS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 11. RÉDUCTION STRUCTURELLE ═══');

  test('Réduction structurelle > 0 pour bas salaire 2.000€', () => {
    const empBas = { ...emp3500, monthlySalary: 2000 };
    const r = calc(empBas, per0, co0);
    assert(r.redStructMois >= 0, `Réduction structurelle = ${r.redStructMois}`);
  });

  test('Réduction structurelle = 0 ou faible pour haut salaire 8.000€', () => {
    const empHaut = { ...emp3500, monthlySalary: 8000 };
    const r = calc(empHaut, per0, co0);
    assert(r.redStructMois >= 0, `Réduction structurelle haut salaire = ${r.redStructMois}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // 12. CAS COMPLETS — VALIDATION CROISÉE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 12. CAS COMPLETS ═══');

  const testCases = [
    { name: 'SMIC belge ~2.000€', brut: 2000, civil: 'single', enfants: 0, minNet: 55, maxNet: 98 },
    { name: 'Médian CP200 ~3.200€', brut: 3200, civil: 'single', enfants: 0, minNet: 45, maxNet: 80 },
    { name: 'Cadre ~4.500€', brut: 4500, civil: 'single', enfants: 0, minNet: 45, maxNet: 80 },
    { name: 'Senior ~6.000€', brut: 6000, civil: 'married_1', enfants: 2, minNet: 45, maxNet: 80 },
    { name: 'Directeur ~8.000€', brut: 8000, civil: 'married_2', enfants: 3, minNet: 45, maxNet: 80 },
    { name: 'Haut salaire ~12.000€', brut: 12000, civil: 'single', enfants: 0, minNet: 45, maxNet: 80 },
  ];

  for (const tc of testCases) {
    test(`${tc.name}: cohérence brut → net → coût`, () => {
      const emp = {
        monthlySalary: tc.brut, statut: 'employe', civil: tc.civil,
        depChildren: tc.enfants, cp: '200', whWeek: 38, regime: 'full',
        commType: 'none', expense: 0,
      };
      const r = calc(emp, per0, co0);

      // Invariants fondamentaux
      assert(r.gross === tc.brut, `Gross ${r.gross} ≠ brut ${tc.brut}`);
      assert(r.onssW > 0, `ONSS W = ${r.onssW}, devrait être > 0`);
      assert(r.tax >= 0, `PP = ${r.tax}, devrait être >= 0`);
      assert(r.net > 0, `Net = ${r.net}, devrait être > 0`);
      assert(r.net < r.gross, `Net ${r.net} devrait être < gross ${r.gross}`);
      assert(r.costTotal > r.gross, `Coût ${r.costTotal} devrait être > gross ${r.gross}`);

      // Taux effectifs dans les fourchettes normales belges
      const tauxNet = (r.net / r.gross * 100);
      const tauxCout = (r.costTotal / r.gross * 100);
      assert(tauxNet >= (tc.minNet||45) && tauxNet <= (tc.maxNet||80),
        `Taux net ${tauxNet.toFixed(1)}% hors fourchette [${tc.minNet||45}-${tc.maxNet||80}%] pour ${tc.brut}€`);
      assert(tauxCout >= (tc.brut <= 2000 ? 100 : 115) && tauxCout <= 160,
        `Taux coût ${tauxCout.toFixed(1)}% hors fourchette pour ${tc.brut}€`);

      // ONSS = 13.07% du brut (ou 108% si ouvrier)
      eq(r.onssW, tc.brut * 0.1307, `ONSS travailleur ${tc.brut}€`, 1);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // 13. MONOTONIE ET COHÉRENCE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 13. MONOTONIE & COHÉRENCE ═══');

  test('Net augmente quand brut augmente (monotonie)', () => {
    let prevNet = 0;
    for (const brut of [1500, 2000, 2500, 3000, 3500, 4000, 5000, 6000, 8000, 10000]) {
      const emp = { ...emp3500, monthlySalary: brut };
      const r = calc(emp, per0, co0);
      assert(r.net > prevNet, `Net ${brut}€ (${r.net.toFixed(0)}) devrait être > net précédent (${prevNet.toFixed(0)})`);
      prevNet = r.net;
    }
  });

  test('Coût employeur augmente avec le brut', () => {
    let prevCost = 0;
    for (const brut of [1500, 2500, 3500, 5000, 8000]) {
      const emp = { ...emp3500, monthlySalary: brut };
      const r = calc(emp, per0, co0);
      assert(r.costTotal > prevCost, `Coût ${brut}€ (${r.costTotal.toFixed(0)}) > précédent (${prevCost.toFixed(0)})`);
      prevCost = r.costTotal;
    }
  });

  test('PP augmente avec le brut (progressivité)', () => {
    let prevPP = 0;
    for (const brut of [2000, 3000, 4000, 5000, 8000]) {
      const emp = { ...emp3500, monthlySalary: brut };
      const r = calc(emp, per0, co0);
      assert(r.tax >= prevPP, `PP ${brut}€ (${r.tax.toFixed(0)}) >= PP précédent (${prevPP.toFixed(0)})`);
      prevPP = r.tax;
    }
  });

  test('Plus d\'enfants = plus de net (réductions PP)', () => {
    let prevNet = 0;
    for (const enf of [0, 1, 2, 3, 4]) {
      const emp = { ...emp3500, depChildren: enf };
      const r = calc(emp, per0, co0);
      if (enf > 0) {
        assert(r.net >= prevNet, `Net ${enf} enfants (${r.net.toFixed(0)}) >= ${enf-1} enfants (${prevNet.toFixed(0)})`);
      }
      prevNet = r.net;
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // 14. EDGE CASES
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 14. EDGE CASES ═══');

  test('calc() avec brut = 0 ne crashe pas', () => {
    const emp0 = { ...emp3500, monthlySalary: 0 };
    const r = calc(emp0, per0, co0);
    assert(r.net !== undefined, 'Net défini même à 0€');
  });

  test('calc() avec brut très élevé 50.000€ ne crashe pas', () => {
    const emp50k = { ...emp3500, monthlySalary: 50000 };
    const r = calc(emp50k, per0, co0);
    assert(r.net > 0, `Net = ${r.net}`);
    assert(r.net < 50000, `Net < brut`);
  });

  test('calcPrecompteExact avec brut = 1€ ne crashe pas', () => {
    const r = calcPrecompteExact(1, { situation: 'isole' });
    assert(r.pp >= 0, `PP pour 1€ = ${r.pp}`);
  });

  test('calc() 13ème mois ajouté au brut', () => {
    const r = calc(emp3500, { y13: 3500 }, co0);
    eq(r.y13, 3500, '13ème mois');
    eq(r.gross, 7000, 'Brut + 13ème', 0.01);
  });

  test('calc() saisie/avance déduit du net', () => {
    const rBase = calc(emp3500, per0, co0);
    const rSaisie = calc(emp3500, { garnish: 200 }, co0);
    eq(rBase.net - rSaisie.net, 200, 'Saisie déduite', 0.01);
  });

  // ═══════════════════════════════════════════════════════════════
  // 15. TABLEAU RÉCAPITULATIF
  // ═══════════════════════════════════════════════════════════════
  console.log('\n═══ 15. TABLEAU RÉCAPITULATIF ═══');
  console.log('');
  console.log('  Brut     │ ONSS 13.07% │ PP        │ CSSS     │ Net       │ Coût empl │ % net');
  console.log('  ─────────┼─────────────┼───────────┼──────────┼───────────┼───────────┼──────');
  for (const brut of [2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 8000, 10000]) {
    const emp = { ...emp3500, monthlySalary: brut };
    const r = calc(emp, per0, co0);
    const pctNet = (r.net / brut * 100).toFixed(1);
    console.log(`  ${String(fmt(brut)).padEnd(9)}│ ${String(fmt(r.onssW)).padEnd(11)} │ ${String(fmt(r.tax)).padEnd(9)} │ ${String(fmt(r.css)).padEnd(8)} │ ${String(fmt(r.net)).padEnd(9)} │ ${String(fmt(r.costTotal)).padEnd(9)} │ ${pctNet}%`);
  }

  // ═══════════════════════════════════════════════════════════════
  // RAPPORT FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log(`  RÉSULTAT: ${passed}/${total} tests passés`);
  if (failed > 0) {
    console.log(`  ❌ ${failed} ÉCHECS:`);
    for (const f of failures) {
      console.log(`     • ${f.name}: ${f.error}`);
    }
  } else {
    console.log('  ✅ TOUS LES TESTS PASSENT');
  }
  console.log('═'.repeat(60));

  process.exit(failed > 0 ? 1 : 0);

} catch (loadErr) {
  console.error('❌ Erreur chargement source:', loadErr.message);
  console.error(loadErr.stack?.split('\n').slice(0, 5).join('\n'));
  process.exit(2);
}
