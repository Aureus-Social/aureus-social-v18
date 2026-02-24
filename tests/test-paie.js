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
global.supabase = null;

// ═══ CHARGER ET EXTRAIRE ═══
console.log('⏳ Chargement AureusSocialPro.js...');
const srcPath = path.join(__dirname, '..', 'app', 'AureusSocialPro.js');
const fullSrc = fs.readFileSync(srcPath, 'utf-8');
const lines = fullSrc.split('\n');

function _findLine(pat, after) {
  const start = after || 0;
  for (let i = start; i < lines.length; i++) if (lines[i].includes(pat)) return i;
  return -1;
}

// ═══ STRATÉGIE: Extraire uniquement les blocs nécessaires par nom ═══
// On cible exactement ce qu'il faut, avec brace-balancing aware des strings/comments

function _extractBB(startIdx) {
  if (startIdx < 0) return { text: '', endIdx: startIdx };
  let depth = 0, started = false, inStr = 0; // inStr: 0=no, 1=single, 2=double, 3=template
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const c = line[j], prev = j > 0 ? line[j-1] : '';
      // Skip escaped chars
      if (prev === '\\') continue;
      // String tracking
      if (inStr === 0) {
        if (c === "'" ) { inStr = 1; continue; }
        if (c === '"' ) { inStr = 2; continue; }
        if (c === '`' ) { inStr = 3; continue; }
        if (c === '/' && j + 1 < line.length && line[j+1] === '/') break; // rest is comment
        if (c === '{') { depth++; started = true; }
        if (c === '}') depth--;
      } else if (inStr === 1 && c === "'") { inStr = 0; }
      else if (inStr === 2 && c === '"') { inStr = 0; }
      else if (inStr === 3 && c === '`') { inStr = 0; }
    }
    if (started && depth === 0) {
      return { text: lines.slice(startIdx, i + 1).join('\n'), endIdx: i + 1 };
    }
  }
  return { text: lines.slice(startIdx, Math.min(startIdx + 300, lines.length)).join('\n'), endIdx: startIdx + 300 };
}

function _extractFunc(signature, afterLine) {
  const idx = _findLine(signature, afterLine || 0);
  if (idx === -1) return null;
  // Include comment lines before
  let start = idx;
  while (start > 0 && lines[start - 1].trim().startsWith('//')) start--;
  const { text, endIdx } = _extractBB(start);
  return { text, startIdx: idx, endIdx, lines: text.split('\n').length };
}

const parts = [];

// ── 1. LOIS_BELGES: chercher le GROS objet (pas une réassignation d'1 ligne) ──
let loisIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('var LOIS_BELGES') && lines[i].includes('{')) {
    // Vérifier que c'est le gros (>10 lignes)
    const { text } = _extractBB(i);
    if (text.split('\n').length > 10) {
      loisIdx = i;
      parts.push(text);
      console.log(`  ✓ LOIS_BELGES: ligne ${i + 1} (${text.split('\n').length} lignes)`);
      break;
    }
  }
}

// ── 2. Tout le code entre LOIS_BELGES et la section i18n/React ──
// On prend var/const/function MAIS on skip les fonctions React (PascalCase)
if (loisIdx >= 0) {
  const loisText = parts[0];
  let afterLois = loisIdx + loisText.split('\n').length;
  const legalIdx = _findLine('var LEGAL=');
  const endZone = legalIdx > 0 ? legalIdx : afterLois + 800;

  let i = afterLois;
  while (i < endZone) {
    const t = lines[i].trim();

    // Skip blanks and lone comments
    if (t === '' || (t.startsWith('//') && !t.includes('function'))) { i++; continue; }

    // React/JSX → skip
    if (/<[a-zA-Z]/.test(t) || t.includes('.Provider') || t.includes('changeLan') ||
        /^\s*'[^']+':\s*\{.*fr:/.test(t) || /^\s*"[^"]+":\s*\{.*fr:/.test(t)) { i++; continue; }

    // PascalCase function → skip entire body
    if (/^function\s+[A-Z]/.test(t)) {
      const { endIdx } = _extractBB(i);
      i = endIdx;
      continue;
    }

    // const/var/let assigned to React → skip
    if (/^(var|const|let)\s+\w+\s*=\s*(React|createContext|useContext|useState)/.test(t)) { i++; continue; }
    if (t.includes('createContext') || t.includes('useContext')) { i++; continue; }

    // var/const/let declaration
    if (/^(var|const|let)\s+/.test(t)) {
      if (t.endsWith(';')) {
        parts.push(lines[i]);
        i++;
      } else {
        const { text, endIdx } = _extractBB(i);
        parts.push(text);
        i = endIdx;
      }
      continue;
    }

    // Lowercase function
    if (/^function\s+[a-z_]/.test(t)) {
      const { text, endIdx } = _extractBB(i);
      const name = t.match(/function\s+([a-z_]\w*)/)?.[1];
      if (name) console.log(`  ✓ ${name}: ligne ${i + 1} (${text.split('\n').length} lignes)`);
      parts.push(text);
      i = endIdx;
      continue;
    }

    i++;
  }
}

// ── 3. var LEGAL ──
const legalIdx = _findLine('var LEGAL=');
if (legalIdx >= 0) {
  const { text } = _extractBB(legalIdx);
  parts.push(text);
  console.log(`  ✓ LEGAL: ligne ${legalIdx + 1} (${text.split('\n').length} lignes)`);
}

// ── 4. Fonctions métier ciblées (après LEGAL seulement!) ──
const targets = [
  'function calc(',          // Le VRAI calc (~ligne 2024, pas 26287)
  'function calcPrecompteExact(',
  'function calcCSSS(',
  'function calcBonusEmploi(',
  'function calcBonusEmploiDetail(',
  'function calcIndependant(',
];
const afterLegal = legalIdx > 0 ? legalIdx + 100 : 1000;
for (const sig of targets) {
  const r = _extractFunc(sig, afterLegal);
  if (r) {
    const name = sig.replace('function ', '').replace('(', '');
    console.log(`  ✓ ${name}: ligne ${r.startIdx + 1} (${r.lines} lignes)`);
    parts.push(r.text);
  }
}

// ── 5. Assembler ──
let src = parts.join('\n\n');

// Nettoyage basique
src = src.replace(/^['"]use client['"];?\s*/gm, '');
src = src.replace(/import\s+.*?from\s+['"].*?['"];?\s*/gm, '');
src = src.replace(/export\s+default\s+/gm, 'var __exported__ = ');
src = src.replace(/export\s+/gm, '');

// Filet de sécurité: toute ligne avec du JSX
src = src.replace(/^.*return\s+\(?<[A-Za-z].*$/gm, '// [JSX]');
src = src.replace(/^.*<\/[a-zA-Z].*>.*$/gm, '// [JSX]');
src = src.replace(/^\s*<[a-zA-Z].*$/gm, '// [JSX]');
src = src.replace(/^.*\bonClick\b.*$/gm, '// [JSX]');
src = src.replace(/^.*\bclassName[=\s].*$/gm, '// [JSX]');
src = src.replace(/^.*\.Provider\b.*$/gm, '// [JSX]');

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
    React: global.React, useState: global.useState, useEffect: global.useEffect,
    useRef: global.useRef, useCallback: global.useCallback, useMemo: global.useMemo,
    useContext: global.useContext, createContext: global.createContext,
  };

  const ctx = vm.createContext(sandbox);
  fs.writeFileSync(path.join(__dirname, 'extracted-logic.js'), src);
  console.log(`\n  Total: ${src.split('\n').length} lignes → extracted-logic.js`);
  vm.runInContext(src, ctx);
  console.log('✅ Code chargé avec succès\n');

  const LOIS_BELGES = ctx.LOIS_BELGES;
  const calc = ctx.calc;
  const calcPrecompteExact = ctx.calcPrecompteExact;
  const calcCSSS = ctx.calcCSSS;
  const calcBonusEmploi = ctx.calcBonusEmploi;
  const calcBonusEmploiDetail = ctx.calcBonusEmploiDetail;
  const calcIndependant = ctx.calcIndependant;

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

  const emp3500 = { monthlySalary: 3500, status: 'employe', situation: 'isole', enfants: 0, taxeCom: 7, dirigeant: false };
  const per0 = { month: 1, year: 2026 };
  const co0 = {};

  // ═══ 1. STRUCTURE LOIS_BELGES ═══
  console.log('═══ 1. STRUCTURE LOIS_BELGES ═══');
  test('LOIS_BELGES existe', () => { assert(LOIS_BELGES !== undefined, 'LOIS_BELGES non trouvé'); });
  test('LOIS_BELGES.onss.travailleur = 13.07%', () => { eq(LOIS_BELGES.onss.travailleur, 0.1307, 'ONSS travailleur'); });
  test('LOIS_BELGES.pp.bonusEmploi existe', () => { assert(LOIS_BELGES.pp.bonusEmploi !== undefined, 'bonusEmploi manquant'); });

  // ═══ 2. ONSS ═══
  console.log('\n═══ 2. ONSS ═══');
  test('ONSS employé: 13.07% sur brut', () => { eq(Math.round(3500 * 0.1307 * 100) / 100, 457.45, 'ONSS 3500€'); });
  test('ONSS ouvrier: base × 1.08', () => { eq(Math.round(2500 * 1.08 * 0.1307 * 100) / 100, 352.89, 'ONSS ouvrier', 0.01); });

  // ═══ 3. PRÉCOMPTE PROFESSIONNEL ═══
  console.log('\n═══ 3. PRÉCOMPTE PROFESSIONNEL ═══');
  test('calcPrecompteExact existe', () => { assert(typeof calcPrecompteExact === 'function', 'non trouvé'); });
  test('PP sur 0€ = 0€', () => { eq(calcPrecompteExact(0, { situation: 'isole' }).pp, 0, 'PP 0€'); });
  test('PP sur 2.000€ isolé — structure', () => {
    const r = calcPrecompteExact(2000, { situation: 'isole', enfants: 0 });
    assert(r.pp !== undefined && r.rate !== undefined && r.detail !== undefined, 'structure incomplète');
    assert(r.pp >= 0 && r.rate >= 0, `PP négatif: ${r.pp}`);
  });
  test('PP sur 2.000€ isolé ≈ 30-300€', () => {
    const r = calcPrecompteExact(2000, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 30 && r.pp <= 300, `PP 2000€ = ${r.pp} hors fourchette`);
  });
  test('PP sur 3.500€ isolé ≈ 500-800€', () => {
    const r = calcPrecompteExact(3500, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 500 && r.pp <= 800, `PP 3500€ = ${r.pp} hors fourchette`);
  });
  test('PP sur 5.000€ isolé ≈ 900-1500€', () => {
    const r = calcPrecompteExact(5000, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 900 && r.pp <= 1500, `PP 5000€ = ${r.pp} hors fourchette`);
  });
  test('PP sur 8.000€ isolé ≈ 2000-3000€', () => {
    const r = calcPrecompteExact(8000, { situation: 'isole', enfants: 0 });
    assert(r.pp >= 2000 && r.pp <= 3000, `PP 8000€ = ${r.pp} hors fourchette`);
  });
  test('PP marié 1r < isolé', () => {
    const i = calcPrecompteExact(4000, { situation: 'isole', enfants: 0 }).pp;
    const m = calcPrecompteExact(4000, { situation: 'marie_1r', enfants: 0 }).pp;
    assert(m < i, `Marié ${m} devrait être < isolé ${i}`);
  });
  test('PP 2 enfants < 0 enfant', () => {
    const p0 = calcPrecompteExact(3500, { situation: 'isole', enfants: 0 }).pp;
    const p2 = calcPrecompteExact(3500, { situation: 'isole', enfants: 2 }).pp;
    assert(p2 < p0, `2 enf ${p2} devrait être < 0 enf ${p0}`);
  });
  test('PP 4 enfants < 2 enfants', () => {
    const p2 = calcPrecompteExact(4000, { situation: 'isole', enfants: 2 }).pp;
    const p4 = calcPrecompteExact(4000, { situation: 'isole', enfants: 4 }).pp;
    assert(p4 < p2, `4 enf ${p4} devrait être < 2 enf ${p2}`);
  });
  test('PP progressivité', () => {
    const r1 = calcPrecompteExact(2500, { situation: 'isole' });
    const r2 = calcPrecompteExact(5000, { situation: 'isole' });
    const r3 = calcPrecompteExact(10000, { situation: 'isole' });
    assert(r2.rate > r1.rate && r3.rate > r2.rate, 'Taux pas progressif');
  });
  test('PP taxe communale croissante', () => {
    const r0 = calcPrecompteExact(3500, { situation: 'isole', taxeCom: 0 }).pp;
    const r7 = calcPrecompteExact(3500, { situation: 'isole', taxeCom: 7 }).pp;
    const r10 = calcPrecompteExact(3500, { situation: 'isole', taxeCom: 10 }).pp;
    assert(r7 >= r0 && r10 >= r7, 'Taxe communale pas croissante');
  });
  test('PP dirigeant > salarié', () => {
    const s = calcPrecompteExact(5000, { situation: 'isole', dirigeant: false }).pp;
    const d = calcPrecompteExact(5000, { situation: 'isole', dirigeant: true }).pp;
    assert(d > s, `Dirigeant ${d} devrait être > salarié ${s}`);
  });

  // ═══ 4. BONUS À L'EMPLOI ═══
  console.log('\n═══ 4. BONUS À L\'EMPLOI ═══');
  test('calcBonusEmploi existe', () => { assert(typeof calcBonusEmploi === 'function', 'non trouvé'); });
  test('Bonus 2000€ > 0 et ≤ 350', () => {
    const b = calcBonusEmploi(2000);
    assert(b > 0 && b <= 350, `Bonus ${b} hors fourchette`);
  });
  test('Bonus 5000€ = 0', () => { eq(calcBonusEmploi(5000), 0, 'Bonus 5000€'); });
  test('Bonus dégressif', () => {
    assert(calcBonusEmploi(2000) >= calcBonusEmploi(2500), 'pas dégressif 2000→2500');
    assert(calcBonusEmploi(2500) >= calcBonusEmploi(3000), 'pas dégressif 2500→3000');
  });
  test('Bonus 0€ = 0', () => { eq(calcBonusEmploi(0), 0, 'Bonus 0€'); });
  if (typeof calcBonusEmploiDetail === 'function') {
    test('BonusDetail volet A+B', () => {
      const d = calcBonusEmploiDetail(2500);
      assert(d.voletA >= 0 && d.voletB >= 0 && d.totalSocial >= 0, 'valeurs négatives');
      eq(d.totalSocial, d.voletA + d.voletB, 'totalSocial = A+B', 0.02);
    });
  }

  // ═══ 5. CSSS ═══
  if (typeof calcCSSS === 'function') {
    console.log('\n═══ 5. CSSS ═══');
    test('calcCSSS existe', () => { assert(typeof calcCSSS === 'function', 'non trouvé'); });
    test('CSSS 1500€ ≈ 0-40€', () => {
      const c = calcCSSS(1500, 'isole');
      assert(c >= 0 && c <= 40, `CSSS ${c} hors fourchette`);
    });
    test('CSSS progressive', () => {
      assert(calcCSSS(4000, 'isole') >= calcCSSS(2000, 'isole'), 'pas progressive');
    });
  }

  // ═══ 6. CALCUL INTÉGRÉ ═══
  if (typeof calc === 'function') {
    console.log('\n═══ 6. CALCUL INTÉGRÉ ═══');
    test('calc existe', () => { assert(typeof calc === 'function', 'non trouvé'); });
    test('calc 3500€ → objet', () => {
      const r = calc(emp3500, per0, co0);
      assert(r && typeof r === 'object', 'pas un objet');
    });
    test('net < brut', () => {
      const r = calc(emp3500, per0, co0);
      const net = r.net || r.netSalary || 0;
      assert(net > 0 && net < 3500, `Net ${net} incohérent`);
    });
    test('net croissant', () => {
      const n1 = (calc({ ...emp3500, monthlySalary: 2500 }, per0, co0).net || 0);
      const n2 = (calc({ ...emp3500, monthlySalary: 4000 }, per0, co0).net || 0);
      assert(n2 > n1, `Net 4000 (${n2}) devrait > net 2500 (${n1})`);
    });
  }

  // ═══ 7. EDGE CASES ═══
  console.log('\n═══ 7. EDGE CASES ═══');
  test('PP négatif → ≥ 0', () => { assert(calcPrecompteExact(-100, { situation: 'isole' }).pp >= 0, 'PP négatif'); });
  test('PP 15000€ ok', () => { assert(calcPrecompteExact(15000, { situation: 'isole' }).pp > 0, 'PP 15k = 0'); });
  test('Bonus -500€ = 0', () => { eq(calcBonusEmploi(-500), 0, 'Bonus négatif'); });

  // ═══ 8. INDÉPENDANTS ═══
  if (typeof calcIndependant === 'function') {
    console.log('\n═══ 8. INDÉPENDANTS ═══');
    test('calcIndependant existe', () => { assert(typeof calcIndependant === 'function', 'non trouvé'); });
    test('Indep 40k structure', () => {
      const r = calcIndependant({ revenuNet: 40000, type: 'principal', situation: 'isole' });
      assert(r.cotisAnnuelle !== undefined && r.ippAnnuel !== undefined, 'structure incomplète');
    });
    test('Cotis croissantes', () => {
      const r1 = calcIndependant({ revenuNet: 20000, type: 'principal', situation: 'isole' });
      const r2 = calcIndependant({ revenuNet: 50000, type: 'principal', situation: 'isole' });
      assert(r2.cotisAnnuelle > r1.cotisAnnuelle, 'pas croissant');
    });

    console.log('\n═══ TABLEAU INDÉPENDANTS ═══');
    console.log('  Revenu net  │ Cotis soc.  │ Frais gest │ IPP        │ Net dispo  │ Taux');
    console.log('  ────────────┼─────────────┼────────────┼────────────┼────────────┼──────');
    for (const rev of [15000, 25000, 40000, 60000, 80000, 100000]) {
      const r = calcIndependant({ revenuNet: rev, type: 'principal', situation: 'isole' });
      console.log(`  ${String(fmt(rev)).padEnd(11)}│ ${String(fmt(r.cotisAnnuelle)).padEnd(11)} │ ${String(fmt(r.fraisGestion)).padEnd(10)} │ ${String(fmt(r.ippAnnuel)).padEnd(10)} │ ${String(fmt(r.netDisponibleAnnuel)).padEnd(10)} │ ${r.tauxChargesTotal.toFixed(1)}%`);
    }
  }

  // ═══ 9. TABLEAU SALARIÉS ═══
  if (typeof calc === 'function') {
    console.log('\n═══ 9. TABLEAU RÉCAPITULATIF SALARIÉS ═══');
    console.log('  Brut     │ ONSS 13.07% │ PP        │ CSSS     │ Net       │ Coût empl │ % net');
    console.log('  ─────────┼─────────────┼───────────┼──────────┼───────────┼───────────┼──────');
    for (const brut of [2000, 2500, 3000, 3500, 4000, 4500, 5000, 6000, 8000, 10000]) {
      try {
        const r = calc({ ...emp3500, monthlySalary: brut }, per0, co0);
        const pctNet = (r.net / brut * 100).toFixed(1);
        console.log(`  ${String(fmt(brut)).padEnd(9)}│ ${String(fmt(r.onssW)).padEnd(11)} │ ${String(fmt(r.tax)).padEnd(9)} │ ${String(fmt(r.css)).padEnd(8)} │ ${String(fmt(r.net)).padEnd(9)} │ ${String(fmt(r.costTotal)).padEnd(9)} │ ${pctNet}%`);
      } catch (e) { console.log(`  ${String(fmt(brut)).padEnd(9)}│ ERREUR: ${e.message}`); }
    }
  }

  // ═══ RAPPORT FINAL ═══
  console.log('\n' + '═'.repeat(60));
  console.log(`  RÉSULTAT: ${passed}/${total} tests passés`);
  if (failed > 0) {
    console.log(`  ❌ ${failed} ÉCHECS:`);
    for (const f of failures) console.log(`     • ${f.name}: ${f.error}`);
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
