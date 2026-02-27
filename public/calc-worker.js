// ═══════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — PAYROLL CALCULATION WEB WORKER
// Item #36 Phase 2: Offload heavy calc() to separate thread
// Prevents UI freeze during batch payroll calculations
// ═══════════════════════════════════════════════════════════

const _OW = 0.1307; // ONSS travailleur

// Simplified PP calculation (mirrors calcPrecompteExact)
function calcPP(brut, opts = {}) {
  const situation = opts.situation || 'isole';
  const enfants = opts.enfants || 0;
  const handicap = opts.handicap || false;
  const conjointRevenu = opts.conjointRevenu || false;
  const taxeCommunale = opts.taxeCommunale || 7;
  const dirigeant = opts.dirigeant || false;
  const tempsPartiel = opts.tempsPartiel || 1;
  
  // Step 1: Imposable
  const onss = Math.round(brut * _OW * 100) / 100;
  const imposable = brut - onss;
  
  // Step 2: Annualisation
  const annuel = imposable * 12 / tempsPartiel;
  
  // Step 3: Frais professionnels
  let fraisPro;
  if (dirigeant) {
    fraisPro = Math.min(annuel * 0.03, 2870);
  } else {
    fraisPro = Math.min(annuel * 0.30, 5750);
  }
  
  // Step 4: Base imposable
  const base = Math.max(0, annuel - fraisPro);
  
  // Step 5: Barème progressif
  let ppBrut = 0;
  if (base > 0) ppBrut += Math.min(base, 15200) * 0.25;
  if (base > 15200) ppBrut += Math.min(base - 15200, 11240) * 0.40;
  if (base > 26440) ppBrut += Math.min(base - 26440, 19060) * 0.45;
  if (base > 45500) ppBrut += (base - 45500) * 0.50;
  
  // Step 6: Quotité exemptée
  let exemption = 10160;
  const exemptEnfants = [0, 1850, 4920, 8090, 12980, 17870, 22760, 27650, 32540];
  if (enfants > 0 && enfants < exemptEnfants.length) exemption += exemptEnfants[enfants];
  if (handicap) exemption += 1850;
  if (situation === 'marie1' && !conjointRevenu) exemption += 1850;
  
  ppBrut -= exemption * 0.25;
  ppBrut = Math.max(0, ppBrut);
  
  // Step 7: Taxe communale
  ppBrut *= (1 + taxeCommunale / 100);
  
  // Step 8: Mensualisation
  let ppMois = Math.round(ppBrut / 12 * tempsPartiel * 100) / 100;
  
  return { pp: ppMois, imposable, onss, annuel, base, fraisPro, exemption };
}

// CSSS (Cotisation Spéciale Sécurité Sociale)
function calcCSSS(brutMensuel, situation) {
  const brutTrim = brutMensuel * 3;
  let csss = 0;
  if (situation === 'isole' || situation === 'marie2') {
    if (brutTrim <= 5836.14) csss = 0;
    else if (brutTrim <= 6570.54) csss = Math.max(9.30, (brutTrim - 5836.14) * 0.076) / 3;
    else if (brutTrim <= 18116.46) csss = Math.min(51.64, 18.60 + (brutTrim - 6570.54) * 0.011) / 3;
    else csss = 51.64 / 3;
  } else {
    if (brutTrim <= 5836.14) csss = 0;
    else if (brutTrim <= 6570.54) csss = (brutTrim - 5836.14) * 0.076 / 3;
    else if (brutTrim <= 10599.76) csss = 18.60 / 3;
    else if (brutTrim <= 18116.46) csss = Math.min(51.64, 18.60 + (brutTrim - 10599.76) * 0.011) / 3;
    else csss = 51.64 / 3;
  }
  return Math.round(csss * 100) / 100;
}

// Bonus emploi
function calcBonusEmploi(brutMensuel, typeWorker, fraction) {
  fraction = fraction || 1;
  const ref = brutMensuel / fraction;
  const seuil1 = 2998.52, seuil2 = 3144.45;
  let bonusSocial = 0;
  if (ref <= seuil1) bonusSocial = 280.09;
  else if (ref <= seuil2) bonusSocial = 280.09 - (280.09 / (seuil2 - seuil1)) * (ref - seuil1);
  bonusSocial = Math.round(bonusSocial * fraction * 100) / 100;
  const voletA = Math.round(bonusSocial * 0.3314 * 100) / 100;
  const voletB = Math.round(bonusSocial * 0.5254 * 100) / 100;
  return { bonusSocial, voletA, voletB, totalFiscal: voletA + voletB };
}

// Full payroll calculation for one employee
function calcPayroll(emp, period, company) {
  const brut = Number(emp.gross || emp.brut || 0);
  const type = emp.type || 'employe';
  const fraction = Number(emp.fractionOccupation || emp.fraction || 1);
  const situation = emp.situation || 'isole';
  const enfants = Number(emp.enfants || emp.childrenCharge || 0);
  const taxeCom = Number(emp.taxeCommunale || 7);
  
  // ONSS
  const onss = Math.round(brut * _OW * 100) / 100;
  
  // PP
  const ppResult = calcPP(brut, { situation, enfants, taxeCommunale: taxeCom, tempsPartiel: fraction });
  const pp = ppResult.pp;
  
  // CSSS
  const csss = calcCSSS(brut, situation);
  
  // Bonus emploi
  const bonus = calcBonusEmploi(brut, type, fraction);
  
  // Net
  const net = Math.round((brut - onss - pp - csss + bonus.bonusSocial) * 100) / 100;
  
  // Coût employeur
  const onssPatronal = Math.round(brut * 0.2506 * 100) / 100; // ~25.06% standard
  const coutTotal = Math.round((brut + onssPatronal) * 100) / 100;
  
  return {
    brut, onss, imposable: ppResult.imposable, pp, csss,
    bonusSocial: bonus.bonusSocial, bonusFiscalA: bonus.voletA, bonusFiscalB: bonus.voletB,
    net, onssPatronal, coutTotal,
    details: ppResult
  };
}

// Batch calculation handler
function calcBatch(employees, period, company) {
  const results = [];
  const errors = [];
  let totals = { brut: 0, onss: 0, pp: 0, csss: 0, net: 0, onssPatronal: 0, coutTotal: 0 };
  
  for (let i = 0; i < employees.length; i++) {
    try {
      const result = calcPayroll(employees[i], period, company);
      results.push({ index: i, emp: employees[i], ...result });
      Object.keys(totals).forEach(k => totals[k] += result[k] || 0);
    } catch (e) {
      errors.push({ index: i, emp: employees[i], error: e.message });
    }
  }
  
  // Round totals
  Object.keys(totals).forEach(k => totals[k] = Math.round(totals[k] * 100) / 100);
  
  return { results, errors, totals, count: results.length };
}

// Message handler
self.onmessage = function(e) {
  const { type, data, id } = e.data;
  
  try {
    let result;
    switch (type) {
      case 'calc_single':
        result = calcPayroll(data.employee, data.period, data.company);
        break;
      case 'calc_batch':
        result = calcBatch(data.employees, data.period, data.company);
        break;
      case 'calc_pp':
        result = calcPP(data.brut, data.options);
        break;
      case 'calc_csss':
        result = calcCSSS(data.brut, data.situation);
        break;
      case 'calc_bonus':
        result = calcBonusEmploi(data.brut, data.type, data.fraction);
        break;
      case 'ping':
        result = { status: 'ready', version: '20.4' };
        break;
      default:
        throw new Error('Unknown calculation type: ' + type);
    }
    self.postMessage({ id, type, result, error: null });
  } catch (err) {
    self.postMessage({ id, type, result: null, error: err.message });
  }
};
