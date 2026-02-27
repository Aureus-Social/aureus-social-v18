// ============================================================================
// PATCH AUTOMATIQUE — Bonus Emploi 2026 (C1+C2+C3)
// ============================================================================
// USAGE: depuis C:\Users\mouss\aureus-social-v18, lancer:
//   node patch-bonus-emploi.js
//
// Ce script:
//   C1: Met à jour les seuils dans LOIS_BELGES (ligne 69)
//   C2: Remplace calcBonusEmploi par Volet A + Volet B (ligne 3994)
//   C3: Active le bonus fiscal dans calcPrecompteExact (ligne 3936)
//
// Source officielle: Partena Professional 08/01/2026 (ONSS)
// ============================================================================

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'app', 'AureusSocialPro.js');
const BACKUP = FILE + '.backup-' + new Date().toISOString().slice(0,10).replace(/-/g,'');

console.log('═══ PATCH BONUS EMPLOI 2026 ═══\n');

// Lire le fichier
if (!fs.existsSync(FILE)) {
  console.error('❌ Fichier introuvable:', FILE);
  process.exit(1);
}

let code = fs.readFileSync(FILE, 'utf8');
const originalLength = code.length;

// Backup
fs.writeFileSync(BACKUP, code);
console.log('✅ Backup créé:', BACKUP);

let patchCount = 0;

// ─────────────────────────────────────────────────────────────────────────────
// PATCH C1: Remplacer les constantes bonusEmploi dans LOIS_BELGES
// ─────────────────────────────────────────────────────────────────────────────

const OLD_CONSTANTS = `bonusEmploi: { pctReduction: 0.3314, maxMensuel: 194.03, seuilBrut1: 2561.42, seuilBrut2: 2997.59 },`;

const NEW_CONSTANTS = `bonusEmploi: {
      // Volet A+B depuis 01/04/2024 — Montants indexés 01/01/2026 (Partena/ONSS)
      jan2026: {
        voletA: { employes: { seuilBas: 2833.36, seuilHaut: 3271.48, max: 123.00, coeff: 0.2807 }, ouvriers: { seuilBas: 2833.36, seuilHaut: 3271.48, max: 132.84, coeff: 0.3032 }},
        voletB: { employes: { seuilBas: 2218.73, seuilHaut: 2833.36, max: 165.87, coeff: 0.2699 }, ouvriers: { seuilBas: 2218.73, seuilHaut: 2833.36, max: 179.14, coeff: 0.2915 }},
      },
      mars2026: {
        voletA: { employes: { seuilBas: 2833.36, seuilHaut: 3336.98, max: 123.00, coeff: 0.2442 }, ouvriers: { seuilBas: 2833.36, seuilHaut: 3336.98, max: 132.84, coeff: 0.2638 }},
        voletB: { employes: { seuilBas: 2218.73, seuilHaut: 2833.36, max: 165.87, coeff: 0.2699 }, ouvriers: { seuilBas: 2218.73, seuilHaut: 2833.36, max: 179.14, coeff: 0.2915 }},
      },
      fiscalTauxA: 0.3314,  // 33.14% du volet A social
      fiscalTauxB: 0.5254,  // 52.54% du volet B social
      // Rétro-compatibilité (ancien format pour BONUS_MAX etc.)
      pctReduction: 0.3314, maxMensuel: 288.87, seuilBrut1: 2833.36, seuilBrut2: 3336.98,
    },`;

if (code.includes(OLD_CONSTANTS)) {
  code = code.replace(OLD_CONSTANTS, NEW_CONSTANTS);
  patchCount++;
  console.log('✅ C1: Constantes LOIS_BELGES mises à jour (seuils 2026 Volet A+B)');
} else {
  console.log('⚠️  C1: Constantes déjà modifiées ou pattern non trouvé');
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH C2: Remplacer la fonction calcBonusEmploi
// ─────────────────────────────────────────────────────────────────────────────

const OLD_FUNCTION = `// Bonus emploi (Art. 289ter CIR) — Réduction fiscale
function calcBonusEmploi(brutMensuel) {
  if (brutMensuel <= 0) return 0;
  const onss = Math.round(brutMensuel * _OW * 100) / 100;
  const refSalaire = brutMensuel;
  const BE = LOIS_BELGES.pp.bonusEmploi;
  const seuil1 = BE.seuilBrut1;
  const seuil2 = BE.seuilBrut2;
  const maxBonus = BE.maxMensuel;

  if (refSalaire <= seuil1) return maxBonus;
  if (refSalaire <= seuil2) {
    return Math.round(maxBonus * (1 - (refSalaire - seuil1) / (seuil2 - seuil1)) * 100) / 100;
  }
  return 0;
}`;

// Also try with encoded characters (the file might have UTF-8 issues)
const OLD_FUNCTION_ALT = code.match(/\/\/ Bonus emploi \(Art\. 289ter CIR\)[^\n]*\nfunction calcBonusEmploi\(brutMensuel\) \{[^}]+if \(refSalaire <= seuil2\) \{[^}]+\}\s*return 0;\s*\}/);

const NEW_FUNCTION = `// Bonus emploi 2026 — Volet A (bas salaires) + Volet B (très bas salaires)
// Source: Partena Professional 08/01/2026, AR 27/03/2023, ONSS
// Retourne le bonus SOCIAL (réduction ONSS) — rétro-compatible (nombre)
function calcBonusEmploi(brutMensuel, typeWorker, fractionOccupation, moisPaie) {
  const detail = calcBonusEmploiDetail(brutMensuel, typeWorker, fractionOccupation, moisPaie);
  return detail.totalSocial;
}

// Version détaillée — retourne { voletA, voletB, totalSocial, fiscalA, fiscalB, totalFiscal }
function calcBonusEmploiDetail(brutMensuel, typeWorker, fractionOccupation, moisPaie) {
  const r = { voletA: 0, voletB: 0, totalSocial: 0, fiscalA: 0, fiscalB: 0, totalFiscal: 0 };
  if (!brutMensuel || brutMensuel <= 0) return r;

  const tw = typeWorker || 'employe';
  const frac = fractionOccupation || 1.0;

  // Déterminer période (jan/fév = jan2026, mars+ = mars2026)
  let periode = 'mars2026';
  if (moisPaie) {
    const d = typeof moisPaie === 'string' ? new Date(moisPaie) : moisPaie;
    if (d.getMonth() <= 1) periode = 'jan2026'; // 0=jan, 1=fev
  }

  const BE = LOIS_BELGES.pp.bonusEmploi;
  const params = BE[periode] || BE.mars2026;
  const type = tw === 'ouvrier' ? 'ouvriers' : 'employes';

  // Salaire de référence temps plein
  const S = frac > 0 ? brutMensuel / frac : brutMensuel;

  // ── VOLET A (bas salaires) ──
  const pA = params.voletA[type];
  let vA = 0;
  if (S <= pA.seuilBas) vA = pA.max;
  else if (S <= pA.seuilHaut) vA = Math.max(0, pA.max - (pA.coeff * (S - pA.seuilBas)));

  // ── VOLET B (très bas salaires) ──
  const pB = params.voletB[type];
  let vB = 0;
  if (S <= pB.seuilBas) vB = pB.max;
  else if (S <= pB.seuilHaut) vB = Math.max(0, pB.max - (pB.coeff * (S - pB.seuilBas)));

  // Proratiser temps partiel
  vA = Math.round(vA * frac * 100) / 100;
  vB = Math.round(vB * frac * 100) / 100;

  // Écrêtement: bonus social ≤ cotisations ONSS personnelles
  const onssPerso = Math.round(brutMensuel * _OW * 100) / 100;
  const totalBrut = vA + vB;
  const totalSocial = Math.round(Math.min(totalBrut, onssPerso) * 100) / 100;

  // Si écrêtement, réduire volet B d'abord, puis volet A
  if (totalBrut > onssPerso) {
    const excedent = totalBrut - onssPerso;
    if (excedent <= vB) { vB = Math.round((vB - excedent) * 100) / 100; }
    else { vA = Math.round(Math.max(0, vA - (excedent - vB)) * 100) / 100; vB = 0; }
  }

  // Bonus fiscal: 33.14% volet A + 52.54% volet B
  const fA = Math.round(vA * (BE.fiscalTauxA || 0.3314) * 100) / 100;
  const fB = Math.round(vB * (BE.fiscalTauxB || 0.5254) * 100) / 100;

  r.voletA = vA;
  r.voletB = vB;
  r.totalSocial = totalSocial;
  r.fiscalA = fA;
  r.fiscalB = fB;
  r.totalFiscal = Math.round((fA + fB) * 100) / 100;
  return r;
}`;

if (code.includes(OLD_FUNCTION)) {
  code = code.replace(OLD_FUNCTION, NEW_FUNCTION);
  patchCount++;
  console.log('✅ C2: Fonction calcBonusEmploi remplacée (Volet A+B 2026)');
} else if (OLD_FUNCTION_ALT) {
  code = code.replace(OLD_FUNCTION_ALT[0], NEW_FUNCTION);
  patchCount++;
  console.log('✅ C2: Fonction calcBonusEmploi remplacée (match alternatif)');
} else {
  // Try a more lenient match
  const funcStart = code.indexOf('function calcBonusEmploi(brutMensuel)');
  if (funcStart > -1) {
    // Find the closing brace
    let braceCount = 0;
    let funcEnd = -1;
    for (let i = code.indexOf('{', funcStart); i < code.length; i++) {
      if (code[i] === '{') braceCount++;
      if (code[i] === '}') { braceCount--; if (braceCount === 0) { funcEnd = i + 1; break; } }
    }
    if (funcEnd > -1) {
      // Find the comment line before the function
      let commentStart = funcStart;
      const prevNewline = code.lastIndexOf('\n', funcStart - 1);
      const prevPrevNewline = code.lastIndexOf('\n', prevNewline - 1);
      const prevLine = code.substring(prevPrevNewline + 1, prevNewline).trim();
      if (prevLine.startsWith('//') && prevLine.includes('Bonus')) {
        commentStart = prevPrevNewline + 1;
      }
      code = code.substring(0, commentStart) + NEW_FUNCTION + code.substring(funcEnd);
      patchCount++;
      console.log('✅ C2: Fonction calcBonusEmploi remplacée (match par position)');
    }
  } else {
    console.log('❌ C2: Impossible de trouver calcBonusEmploi — MODIFICATION MANUELLE REQUISE');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH C3: Activer le bonus fiscal dans calcPrecompteExact
// ─────────────────────────────────────────────────────────────────────────────

// Pattern exact de la ligne 3936
const OLD_PP_LINE = `const bonusEmploi = 0; // calculé séparément si nécessaire`;
const NEW_PP_LINE = `// C3: Bonus fiscal déduit du PP (33.14% volet A + 52.54% volet B)
  const _bonusDetail = calcBonusEmploiDetail(brutMensuel, opts.typeWorker || 'employe', opts.fractionOccupation || 1.0, opts.moisPaie || null);
  const bonusEmploi = _bonusDetail.totalFiscal;`;

// Try with accented version too
const OLD_PP_LINE_ALT = "const bonusEmploi = 0; // calcul\u00e9 s\u00e9par\u00e9ment si n\u00e9cessaire";

if (code.includes(OLD_PP_LINE)) {
  code = code.replace(OLD_PP_LINE, NEW_PP_LINE);
  patchCount++;
  console.log('✅ C3: Bonus fiscal activé dans calcPrecompteExact');
} else if (code.includes(OLD_PP_LINE_ALT)) {
  code = code.replace(OLD_PP_LINE_ALT, NEW_PP_LINE);
  patchCount++;
  console.log('✅ C3: Bonus fiscal activé dans calcPrecompteExact (alt match)');
} else {
  // Try regex match
  const ppMatch = code.match(/const bonusEmploi\s*=\s*0\s*;[^\n]*calcul[^\n]*/);
  if (ppMatch) {
    code = code.replace(ppMatch[0], NEW_PP_LINE);
    patchCount++;
    console.log('✅ C3: Bonus fiscal activé dans calcPrecompteExact (regex match)');
  } else {
    console.log('❌ C3: Impossible de trouver "bonusEmploi = 0" dans calcPrecompteExact — MODIFICATION MANUELLE REQUISE');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH BONUS: Mettre à jour var BONUS_MAX
// ─────────────────────────────────────────────────────────────────────────────

const OLD_BONUS_MAX = 'var BONUS_MAX=LB.pp.bonusEmploi.maxMensuel; // 194.03';
const NEW_BONUS_MAX = 'var BONUS_MAX=LB.pp.bonusEmploi.maxMensuel; // 288.87 (volet A 123 + volet B 165.87, jan 2026)';

if (code.includes(OLD_BONUS_MAX)) {
  code = code.replace(OLD_BONUS_MAX, NEW_BONUS_MAX);
  console.log('✅ BONUS_MAX commentaire mis à jour');
}

// ─────────────────────────────────────────────────────────────────────────────
// ÉCRITURE DU FICHIER
// ─────────────────────────────────────────────────────────────────────────────

if (patchCount === 0) {
  console.log('\n❌ AUCUN PATCH APPLIQUÉ — Vérifier le fichier manuellement');
  process.exit(1);
}

fs.writeFileSync(FILE, code, 'utf8');

console.log(`\n═══ RÉSUMÉ ═══`);
console.log(`Patches appliqués: ${patchCount}/3`);
console.log(`Taille avant: ${originalLength} chars`);
console.log(`Taille après: ${code.length} chars`);
console.log(`Backup: ${BACKUP}`);
console.log(`\n📋 PROCHAINES ÉTAPES:`);
console.log(`1. Ouvrir VS Code et vérifier le diff (git diff app/AureusSocialPro.js)`);
console.log(`2. Tester: npm run dev → ouvrir un calcul de paie avec salaire 2500€`);
console.log(`3. Vérifier que le bonus social apparaît (~213€) et le PP est réduit`);
console.log(`4. Comparer avec calculateur-de-salaire.be`);
console.log(`5. Si OK: git add . && git commit -m "fix: bonus emploi 2026 volet A+B (C1+C2+C3)"`);
console.log(`\n⚠️  Si problème: restaurer avec: copy "${BACKUP}" "${FILE}"`);
