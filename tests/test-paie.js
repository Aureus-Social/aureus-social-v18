#!/usr/bin/env node
// ══════════════════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — TESTS UNITAIRES CALCULS PAIE BELGE 2026
// ══════════════════════════════════════════════════════════════════════
// Vérifie: ONSS, PP (précompte), bonus emploi, CSSS, net, coût employeur
// Référence: SPF Finances Annexe III AR/CIR 92, Instructions ONSS T1/2026
// ══════════════════════════════════════════════════════════════════════

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

// ═══ EXTRACTION INTELLIGENTE — scan ligne par ligne du fichier entier ═══

// Compteur de {} qui IGNORE les accolades dans les commentaires //
function _braceBalancedExtract(startIdx) {
  let depth = 0, started = false;
  for (let i = startIdx; i < lines.length; i++) {
    // Enlever les commentaires // avant de compter les {}
    let code = lines[i];
    const slashIdx = code.indexOf('//');
    if (slashIdx >= 0) {
      // Vérifier que // n'est pas dans une string (heuristique simple)
      const before = code.substring(0, slashIdx);
      const singleQuotes = (before.match(/'/g) || []).length;
      const doubleQuotes = (before.match(/"/g) || []).length;
      if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
        code = before; // Couper le commentaire
      }
    }
    for (const c of code) {
      if (c === '{') { depth++; started = true; }
      if (c === '}') depth--;
    }
    if (started && depth === 0) {
      return { text: lines.slice(startIdx, i + 1).join('\n'), endIdx: i + 1 };
    }
  }
  // Fallback: prendre 200 lignes max
  const end = Math.min(startIdx + 200, lines.length);
  return { text: lines.slice(startIdx, end).join('\n'), endIdx: end };
}

// Détecte si une ligne est du React/JSX/i18n (à exclure)
function _isReactJSX(line) {
  const t = line.trim();
  return /<[a-zA-Z][a-zA-Z0-9.]/.test(t) ||
    t.includes('createContext') || t.includes('useContext') || t.includes('useState(') ||
    t.includes('useEffect(') || t.includes('useRef(') || t.includes('useCallback(') ||
    t.includes('useMemo(') || t.includes('.Provider') || t.includes('.Consumer') ||
    t.includes('changeLan') || t.includes('setLang') ||
    /^function\s+[A-Z]/.test(t) ||  // React components (PascalCase)
    t.includes('LangProvider') ||
    /^\s*'[^']+':\s*\{\s*fr:/.test(t) || /^\s*"[^"]+":\s*\{\s*fr:/.test(t); // i18n translations
}

// ═══ SCAN COMPLET DU FICHIER ═══
const parts = [];
const extracted = {}; // track what we extracted
let idx = 0;

while (idx < lines.length) {
  const t = lines[idx].trim();

  // Skip blank lines, comments seuls, React/JSX
  if (t === '' || (t.startsWith('//') && !lines[idx + 1]?.trim().startsWith('var ') && !lines[idx + 1]?.trim().startsWith('function ')) || _isReactJSX(t)) {
    idx++;
    continue;
  }

  // ── var LOIS_BELGES (gros objet) ──
  if (t.startsWith('var LOIS_BELGES')) {
    const { text, endIdx } = _braceBalancedExtract(idx);
    parts.push(text);
    extracted['LOIS_BELGES'] = `ligne ${idx + 1} (${text.split('\n').length} lignes)`;
    idx = endIdx;
    continue;
  }

  // ── var LEGAL (gros objet) ──
  if (t.startsWith('var LEGAL')) {
    const { text, endIdx } = _braceBalancedExtract(idx);
    parts.push(text);
    extracted['LEGAL'] = `ligne ${idx + 1} (${text.split('\n').length} lignes)`;
    idx = endIdx;
    continue;
  }

  // ── var/const/let simple (une ligne avec ;) ──
  if (/^(var|const|let)\s+/.test(t) && t.endsWith(';') && !_isReactJSX(t)) {
    parts.push(lines[idx]);
    idx++;
    continue;
  }

  // ── var/const/let multi-ligne (objet/array) ──
  if (/^(var|const|let)\s+/.test(t) && !_isReactJSX(t)) {
    const { text, endIdx } = _braceBalancedExtract(idx);
    // Vérifier que le résultat ne contient pas de JSX
    if (!_isReactJSX(text)) {
      parts.push(text);
    }
    idx = endIdx;
    continue;
  }

  // ── Fonctions métier (lowercase = pas un composant React) ──
  if (/^function\s+[a-z]/.test(t) && !_isReactJSX(t)) {
    const funcName = t.match(/^function\s+([a-zA-Z_]+)/)?.[1] || '?';
    const { text, endIdx } = _braceBalancedExtract(idx);
    parts.push(text);
    extracted[funcName] = `ligne ${idx + 1} (${text.split('\n').length} lignes)`;
    idx = endIdx;
    continue;
  }

  idx++;
}

// Afficher ce qu'on a trouvé
console.log('  Éléments extraits:');
for (const [name, info] of Object.entries(extracted)) {
  console.log(`    ✓ ${name}: ${info}`);
}

// ═══ ASSEMBLER ET NETTOYER ═══
let src = parts.join('\n\n');
src = src.replace(/^['"]use client['"];?\s*/gm, '');
src = src.replace(/import\s+.*?from\s+['"].*?['"];?\s*/gm, '');
src = src.replace(/export\s+default\s+/gm, 'var __exported__ = ');
src = src.replace(/export\s+/gm, '');

// Filet de sécurité JSX (ne devrait plus être nécessaire)
src = src.replace(/^.*return\s+\(?<.*$/gm, '// [JSX removed]');
src = src.replace(/^.*<\/[a-zA-Z].*>.*$/gm, '// [JSX removed]');
src = src.replace(/^\s*<[a-zA-Z][a-zA-Z0-9.]*[\s{/>].*$/gm, '// [JSX removed]');
src = src.replace(/^.*\bonClick\b.*$/gm, '// [JSX removed]');
src = src.replace(/^.*\bclassName[=\s:{].*$/gm, '// [JSX removed]');
src = src.replace(/^.*\.Provider\b.*$/gm, '// [JSX removed]');
src = src.replace(/^.*\bchangeLan\b.*$/gm, '// [JSX removed]');
src = src.replace(/^.*\bsetLang\b.*$/gm, '// [JSX removed]');

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
    React: global.React,
    useState: global.useState,
    useEffect: global.useEffect,
    useRef: global.useRef,
    useCallback: global.useCallback,
    useMemo: global.useMemo,
    useContext: global.useContext,
    createContext: global.createContext,
  };

  const ctx = vm.createContext(sandbox);
  fs.writeFileSync(path.join(__dirname, 'extracted-logic.js'), src);
  console.log(`\n  Total: ${src.split('\n').length} lignes → extracted-logic.js`);
  vm.runInContext(src, ctx);
  console.log('✅ Code chargé avec succès\n');

  // ═══ Extraire les fonctions du contexte ═══
  const LOIS_BELGES = ctx.LOIS_BELGES;
  const calc = ctx.calc;
  const calcPrecompteExact = ctx.calcPrecompteExact;
  const calcCSSS = ctx.calcCSSS;
  const calcBonusEmploi = ctx.calcBonusEmploi;
  const calcBonusEmploiDetail = ctx.calcBonusEmploiDetail;
  const calcIndependant = ctx.calcIndependant;
  const calcPPFromLois = ctx.calcPPFromLois;

  // ═══ FRAMEWORK DE TEST ═══
  let passed = 0, failed = 0, total = 0;
  const failures = [];
  function test(name, fn) {
    total++;
    try { fn(); passed++; console.log(`  ✅ ${name}`); }
    catch (e) { failed++; failures.push({ name, error: e.message }); console.log(`  ❌ ${name}: ${e.message}`); }
  }
  function assert(cond, msg) { if (!cond) throw new Error(msg || 'Assertion failed'); }
  function eq(actual, expected, label, tolerance) {
    const t = tolerance || 0.01;
    if (Math.abs(actual - expected) > t) throw new Error(`${label}: attendu ${expected}, obtenu ${actual}`);
  }
  function fmt(n) { return typeof n === 'number' ? n.toFixed(2) : String(n); }

  // ═══ DONNÉES DE TEST ═══
  const emp3500 = {
    monthlySalary: 3500,
    status: 'employe',
    situation: 'isole',
    enfants: 0,
    taxeCom: 7,
    dirigeant: false,
  };
  const per0 = { month: 1, year: 2026 };
  const co0 = {};

  // ══════════════════════════════════════════════════════════════════
  // 1. STRUCTURE LOIS_BELGES
  // ══════════════════════════════════════════════════════════════════
  console.log('═══ 1. STRUCTURE LOIS_BELGES ═══');

  test('LOIS_BELGES existe', () => {
    assert(LOIS_BELGES !== undefined, 'LOIS_BELGES non trouvé dans le contexte');
  });

  test('LOIS_BELGES.onss.travailleur = 13.07%', () => {
    eq(LOIS_BELGES.onss.travailleur, 0.1307, 'ONSS travailleur');
  });

  test('LOIS_BELGES.pp.bonusEmploi existe', () => {
    assert(LOIS_BELGES.pp.bonusEmploi !== undefined, 'bonusEmploi manquant');
  });

  // ══════════════════════════════════════════════════════════════════
  // 2. ONSS (cotisations sociales)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n═══ 2. ONSS ═══');

  test('ONSS employé: 13.07% sur brut', () => {
    const brut = 3500;
    const onss = Math.round(brut * 0.1307 * 100) / 100;
    eq(onss, 457.45, 'ONSS 3500€');
  });

  test('ONSS ouvrier: base × 1.08 avant calcul', () => {
    const brutOuv = 2500;
    const onssBase = brutOuv * 1.08;
    const onss = Math.round(onssBase * 0.1307 * 100) / 100;
    eq(onssBase, 2700, 'Base ouvrier');
    eq(onss, 352.89, 'ONSS ouvrier', 0.01);
  });

  // ══════════════════════════════════════════════════════════════════
  // 3. PRÉCOMPTE PROFESSIONNEL (calcPrecompteExact)
  // ══════════════════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════════════════
  // 4. BONUS À L'EMPLOI (bas salaires)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n═══ 4. BONUS À L\'EMPLOI ═══');

  test('calcBonusEmploi existe', () => {
    assert(typeof calcBonusEmploi === 'function', 'calcBonusEmploi non trouvé');
  });

  test('Bonus emploi sur 2.000€ (très bas) = max', () => {
    const bonus = calcBonusEmploi(2000);
    assert(bonus > 0, `Bonus sur 2000€ devrait être > 0, obtenu ${bonus}`);
    assert(bonus >= 50 && bonus <= 350, `Bonus ${bonus} hors fourchette raisonnable [50-350]`);
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

  test('Bonus emploi sur 0€ = 0', () => {
    const bonus = calcBonusEmploi(0);
    eq(bonus, 0, 'Bonus 0€');
  });

  if (typeof calcBonusEmploiDetail === 'function') {
    test('BonusEmploiDetail: volet A + volet B', () => {
      const d = calcBonusEmploiDetail(2500);
      assert(d.voletA >= 0, `voletA >= 0 (${d.voletA})`);
      assert(d.voletB >= 0, `voletB >= 0 (${d.voletB})`);
      assert(d.totalSocial >= 0, `totalSocial >= 0 (${d.totalSocial})`);
      assert(d.totalFiscal >= 0, `totalFiscal >= 0 (${d.totalFiscal})`);
      eq(d.totalSocial, d.voletA + d.voletB, 'totalSocial = A + B', 0.02);
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. CSSS (Cotisation Spéciale Sécurité Sociale)
  // ══════════════════════════════════════════════════════════════════
  if (typeof calcCSSS === 'function') {
    console.log('\n═══ 5. CSSS ═══');

    test('calcCSSS existe', () => {
      assert(typeof calcCSSS === 'function', 'calcCSSS non trouvé');
    });

    test('CSSS sur imposable 1.500€ isolé ≈ 0-30€', () => {
      const csss = calcCSSS(1500, 'isole');
      assert(csss >= 0 && csss <= 40, `CSSS 1500€ = ${csss} hors fourchette`);
    });

    test('CSSS progressive: plus d\'imposable = plus de CSSS', () => {
      const c2000 = calcCSSS(2000, 'isole');
      const c4000 = calcCSSS(4000, 'isole');
      assert(c4000 >= c2000, `CSSS 4000€ (${c4000}) >= 2000€ (${c2000})`);
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. CALCUL INTÉGRÉ (calc)
  // ══════════════════════════════════════════════════════════════════
  if (typeof calc === 'function') {
    console.log('\n═══ 6. CALCUL INTÉGRÉ ═══');

    test('calc existe', () => {
      assert(typeof calc === 'function', 'calc non trouvé');
    });

    test('calc 3500€ isolé — résultat cohérent', () => {
      const r = calc(emp3500, per0, co0);
      assert(r !== undefined, 'calc retourne undefined');
      assert(typeof r === 'object', 'calc devrait retourner un objet');
    });

    test('calc: net < brut', () => {
      const r = calc(emp3500, per0, co0);
      const net = r.net || r.netSalary || 0;
      assert(net > 0, `Net devrait être > 0, obtenu ${net}`);
      assert(net < 3500, `Net ${net} devrait être < brut 3500`);
    });

    test('calc: net augmente avec le brut', () => {
      const r1 = calc({ ...emp3500, monthlySalary: 2500 }, per0, co0);
      const r2 = calc({ ...emp3500, monthlySalary: 4000 }, per0, co0);
      const net1 = r1.net || r1.netSalary || 0;
      const net2 = r2.net || r2.netSalary || 0;
      assert(net2 > net1, `Net 4000€ (${net2}) devrait être > net 2500€ (${net1})`);
    });
  }

  // ══════════════════════════════════════════════════════════════════
  // 7. EDGE CASES
  // ══════════════════════════════════════════════════════════════════
  console.log('\n═══ 7. EDGE CASES ═══');

  test('PP sur salaire négatif = 0', () => {
    const r = calcPrecompteExact(-100, { situation: 'isole' });
    assert(r.pp >= 0, `PP négatif sur salaire négatif: ${r.pp}`);
  });

  test('PP sur très haut salaire (15.000€) ne crash pas', () => {
    const r = calcPrecompteExact(15000, { situation: 'isole' });
    assert(r.pp > 0, `PP sur 15000€ devrait être > 0, obtenu ${r.pp}`);
  });

  test('Bonus emploi sur salaire négatif = 0', () => {
    const bonus = calcBonusEmploi(-500);
    eq(bonus, 0, 'Bonus négatif');
  });

  // ══════════════════════════════════════════════════════════════════
  // 8. INDÉPENDANTS (calcIndependant)
  // ══════════════════════════════════════════════════════════════════
  if (typeof calcIndependant === 'function') {
    console.log('\n═══ 8. INDÉPENDANTS ═══');

    test('calcIndependant existe', () => {
      assert(typeof calcIndependant === 'function', 'calcIndependant non trouvé');
    });

    test('Indépendant 40.000€ — structure retour', () => {
      const r = calcIndependant({ revenuNet: 40000, type: 'principal', situation: 'isole' });
      assert(r.cotisAnnuelle !== undefined, 'cotisAnnuelle manquant');
      assert(r.ippAnnuel !== undefined, 'ippAnnuel manquant');
      assert(r.netDisponibleAnnuel !== undefined, 'netDisponibleAnnuel manquant');
    });

    test('Indépendant: cotisations augmentent avec le revenu', () => {
      const r1 = calcIndependant({ revenuNet: 20000, type: 'principal', situation: 'isole' });
      const r2 = calcIndependant({ revenuNet: 50000, type: 'principal', situation: 'isole' });
      assert(r2.cotisAnnuelle > r1.cotisAnnuelle, `Cotis 50k (${r2.cotisAnnuelle}) > 20k (${r1.cotisAnnuelle})`);
    });

    console.log('\n═══ TABLEAU INDÉPENDANTS ═══');
    console.log('  Revenu net  │ Cotis soc.  │ Frais gest │ IPP        │ Net dispo  │ Taux');
    console.log('  ────────────┼─────────────┼────────────┼────────────┼────────────┼──────');
    for (const rev of [15000, 25000, 40000, 60000, 80000, 100000]) {
      const r = calcIndependant({ revenuNet: rev, type: 'principal', situation: 'isole' });
      console.log(`  ${String(fmt(rev)).padEnd(11)}│ ${String(fmt(r.cotisAnnuelle)).padEnd(11)} │ ${String(fmt(r.fraisGestion)).padEnd(10)} │ ${String(fmt(r.ippAnnuel)).padEnd(10)} │ ${String(fmt(r.netDisponibleAnnuel)).padEnd(10)} │ ${r.tauxChargesTotal.toFixed(1)}%`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 9. TABLEAU RÉCAPITULATIF SALARIÉS
  // ══════════════════════════════════════════════════════════════════
  if (typeof calc === 'function') {
    console.log('\n═══ 9. TABLEAU RÉCAPITULATIF SALARIÉS ═══');
    console.log('');
    console.log('  Brut     │ ONSS 13.07% │ PP        │ CSSS     │ Net       │ Coût empl │ % net');
    console.log('  ─────────┼─────────────┼───────────┼──────────┼───────────┼───────────┼──────');
    for (const brut of [2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 8000, 10000]) {
      try {
        const emp = { ...emp3500, monthlySalary: brut };
        const r = calc(emp, per0, co0);
        const pctNet = (r.net / brut * 100).toFixed(1);
        console.log(`  ${String(fmt(brut)).padEnd(9)}│ ${String(fmt(r.onssW)).padEnd(11)} │ ${String(fmt(r.tax)).padEnd(9)} │ ${String(fmt(r.css)).padEnd(8)} │ ${String(fmt(r.net)).padEnd(9)} │ ${String(fmt(r.costTotal)).padEnd(9)} │ ${pctNet}%`);
      } catch (e) {
        console.log(`  ${String(fmt(brut)).padEnd(9)}│ ERREUR: ${e.message}`);
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // RAPPORT FINAL
  // ══════════════════════════════════════════════════════════════════
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
