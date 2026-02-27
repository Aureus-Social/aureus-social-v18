// ═══ AUREUS SOCIAL PRO — Module: Calcul Indépendants (INASTI/NISSE) ═══
import { LOIS_BELGES } from './lois-belges.js';

function calcIndependant(options) {
  const opts = options || {};
  const INS = LOIS_BELGES.inasti;
  const r = {};

  // ── Paramètres d'entrée ──
  const revenuNetAnnuel = +(opts.revenuNet || 0);         // revenu net imposable annuel (estimé ou N-3)
  const type = opts.type || 'principal';                   // principal | complementaire | pensionActif | pensionRetraite | conjointMaxi | conjointMini | etudiant | mandataire
  const trimestre = opts.trimestre || 'provisoire';        // provisoire | definitif
  const primoStarter = !!opts.primoStarter;                // 4 premiers trimestres
  const primoReduite = !!opts.primoReduite;                // réduction demandée et accordée
  const deductionFraisReels = !!opts.fraisReels;           // frais réels au lieu du forfait
  const fraisReelsMontant = +(opts.fraisReelsMontant || 0);
  const caisseReduction = +(opts.caisseReduction || 0);    // réduction obtenue de la caisse
  const situationFiscale = opts.situation || 'isole';      // isole | marie_1r | marie_2r
  const enfants = +(opts.enfants || 0);
  const taxeCom = +(opts.taxeCom || 7) / 100;
  const dirigeant = !!opts.dirigeant;                      // gérant/admin → frais pro dirigeant

  r.type = type;
  r.revenuNetAnnuel = revenuNetAnnuel;
  r.revenuNetMensuel = Math.round(revenuNetAnnuel / 12 * 100) / 100;

  // ═══ 1. COTISATIONS SOCIALES INASTI ═══
  // Calculées sur le revenu net imposable professionnel de l'année N-3
  // (en régime provisoire) ou de l'année elle-même (en régime définitif)
  // Régularisation après 2-3 ans quand le SPF communique le revenu réel

  let cotisAnnuelle = 0;

  if (type === 'conjointMini') {
    // Mini-statut: cotisation fixe (uniquement maladie/invalidité)
    cotisAnnuelle = INS.minimums.conjointAidant.miniStatut * 4;
    r.couverturePension = false;
  } else {
    // Calcul sur tranches
    if (revenuNetAnnuel <= INS.cotisations.tranche1.plafond) {
      cotisAnnuelle = revenuNetAnnuel * INS.cotisations.tranche1.taux;
    } else if (revenuNetAnnuel <= INS.cotisations.tranche2.plafond) {
      cotisAnnuelle = INS.cotisations.tranche1.plafond * INS.cotisations.tranche1.taux
        + (revenuNetAnnuel - INS.cotisations.tranche1.plafond) * INS.cotisations.tranche2.taux;
    } else {
      // Au-delà du plafond absolu: plafonné
      cotisAnnuelle = INS.cotisations.tranche1.plafond * INS.cotisations.tranche1.taux
        + (INS.cotisations.tranche2.plafond - INS.cotisations.tranche1.plafond) * INS.cotisations.tranche2.taux;
    }
    r.couverturePension = true;

    // Appliquer les minimums par catégorie
    let minTrim = 0;
    if (type === 'principal' || type === 'conjointMaxi' || type === 'mandataire') {
      minTrim = INS.minimums.principal[trimestre];
    } else if (type === 'complementaire') {
      minTrim = INS.minimums.complementaire[trimestre];
    } else if (type === 'pensionActif') {
      minTrim = INS.minimums.pensionActif[trimestre];
    } else if (type === 'pensionRetraite') {
      minTrim = INS.minimums.pensionRetraite[trimestre];
    } else if (type === 'etudiant') {
      // Étudiant-entrepreneur: exonéré si revenu < seuil
      if (revenuNetAnnuel < INS.minimums.etudiant.seuilExoneration) {
        cotisAnnuelle = 0;
        minTrim = 0;
      } else {
        minTrim = INS.minimums.etudiant[trimestre];
      }
    }

    // Minimum annuel = 4 × minimum trimestriel
    const minAnnuel = minTrim * 4;
    if (cotisAnnuelle < minAnnuel) {
      cotisAnnuelle = minAnnuel;
      r.auMinimum = true;
    }
  }

  // Primo-starter: réduction possible
  if (primoStarter && primoReduite) {
    cotisAnnuelle = Math.min(cotisAnnuelle, INS.primoStarter.cotisReduite * 4);
    r.primoStarter = true;
  }

  // Réduction accordée par la caisse sociale
  if (caisseReduction > 0) {
    cotisAnnuelle = Math.max(0, cotisAnnuelle - caisseReduction * 4);
    r.caisseReduction = caisseReduction * 4;
  }

  r.cotisAnnuelle = Math.round(cotisAnnuelle * 100) / 100;
  r.cotisTrimestre = Math.round(cotisAnnuelle / 4 * 100) / 100;
  r.cotisMensuelle = Math.round(cotisAnnuelle / 12 * 100) / 100;

  // Frais de gestion caisse sociale (en sus)
  r.fraisGestion = Math.round(cotisAnnuelle * INS.fraisGestion * 100) / 100;
  r.fraisGestionTrim = Math.round(r.fraisGestion / 4 * 100) / 100;
  r.fraisGestionMens = Math.round(r.fraisGestion / 12 * 100) / 100;

  // Total cotisations + frais
  r.totalSocialAnnuel = Math.round((cotisAnnuelle + r.fraisGestion) * 100) / 100;
  r.totalSocialTrim = Math.round(r.totalSocialAnnuel / 4 * 100) / 100;
  r.totalSocialMens = Math.round(r.totalSocialAnnuel / 12 * 100) / 100;

  // Taux effectif social
  r.tauxSocial = revenuNetAnnuel > 0
    ? Math.round(r.totalSocialAnnuel / revenuNetAnnuel * 10000) / 100 : 0;

  // ═══ 2. IMPÔT DES PERSONNES PHYSIQUES (IPP) ═══
  // Même barème progressif que les salariés
  // Mais l'indépendant n'a PAS de précompte professionnel retenu à la source
  // → Il doit faire des versements anticipés (VA) sinon majoration

  // Base imposable = revenu net - cotisations sociales - frais professionnels
  const baseAvantFrais = Math.max(0, revenuNetAnnuel - cotisAnnuelle);

  // Frais professionnels: forfait 30% ou réels
  let fraisPro = 0;
  if (deductionFraisReels && fraisReelsMontant > 0) {
    fraisPro = fraisReelsMontant;
    r.fraisProType = 'reel';
  } else {
    const fpPct = dirigeant ? LOIS_BELGES.pp.fraisPro.dirigeant.pct : LOIS_BELGES.pp.fraisPro.salarie.pct;
    const fpMax = dirigeant ? LOIS_BELGES.pp.fraisPro.dirigeant.max : LOIS_BELGES.pp.fraisPro.salarie.max;
    fraisPro = Math.min(baseAvantFrais * fpPct, fpMax);
    r.fraisProType = 'forfait';
  }
  r.fraisPro = Math.round(fraisPro * 100) / 100;

  const baseImposable = Math.max(0, baseAvantFrais - fraisPro);
  r.baseImposable = Math.round(baseImposable * 100) / 100;

  // Quotient conjugal (barème 2)
  const isBareme2 = (situationFiscale === 'marie_1r');
  let qcAttribue = 0;
  let basePrincipale = baseImposable;
  if (isBareme2) {
    qcAttribue = Math.min(baseImposable * LOIS_BELGES.pp.quotientConjugal.pct, LOIS_BELGES.pp.quotientConjugal.max);
    basePrincipale = baseImposable - qcAttribue;
  }
  r.qcAttribue = Math.round(qcAttribue * 100) / 100;

  // Barème progressif (même tranches que salariés)
  const calcImpot = (base) => {
    if (base <= 0) return 0;
    const T = LOIS_BELGES.pp.tranches;
    let imp = 0, prev = 0;
    for (const t of T) {
      const s = Math.min(base, t.max) - Math.max(prev, t.min);
      if (s > 0) imp += s * t.taux;
      prev = t.max;
    }
    return imp;
  };

  let impotBrut = calcImpot(basePrincipale);
  if (isBareme2 && qcAttribue > 0) {
    impotBrut += calcImpot(qcAttribue);
  }

  // Réduction quotité exemptée
  const qeBase = isBareme2 ? LOIS_BELGES.pp.quotiteExemptee.bareme2 : LOIS_BELGES.pp.quotiteExemptee.bareme1;
  let reductions = qeBase;

  // Réduction enfants
  const tabEnfants = LOIS_BELGES.pp.reductionsEnfants;
  const suppEnfant = LOIS_BELGES.pp.reductionEnfantSupp;
  if (enfants > 0) {
    if (enfants <= 8) reductions += tabEnfants[enfants];
    else reductions += tabEnfants[8] + (enfants - 8) * suppEnfant;
  }

  const impotApresReduc = Math.max(0, impotBrut - reductions);

  // Taxe communale
  const impotAvecTaxeCom = Math.round(impotApresReduc * (1 + taxeCom) * 100) / 100;

  r.ippAnnuel = impotAvecTaxeCom;
  r.ippMensuel = Math.round(impotAvecTaxeCom / 12 * 100) / 100;
  r.ippTrimestre = Math.round(impotAvecTaxeCom / 4 * 100) / 100;
  r.ippTauxEffectif = revenuNetAnnuel > 0
    ? Math.round(impotAvecTaxeCom / revenuNetAnnuel * 10000) / 100 : 0;

  // ═══ 3. VERSEMENTS ANTICIPÉS ═══
  // Si pas de VA suffisants → majoration de 4,5% sur l'IPP
  const vaParTrimestre = Math.round(impotAvecTaxeCom / 4 * 100) / 100;
  r.vaMensuelRecommande = Math.round(vaParTrimestre / 3 * 100) / 100;
  r.vaTrimRecommande = vaParTrimestre;
  r.vaAnnuelRecommande = impotAvecTaxeCom;
  r.majorationSansVA = Math.round(impotAvecTaxeCom * INS.versementsAnticipes.majoration * 100) / 100;

  // ═══ 4. NET DISPONIBLE ═══
  r.totalChargesAnnuel = Math.round((r.totalSocialAnnuel + impotAvecTaxeCom) * 100) / 100;
  r.totalChargesMensuel = Math.round(r.totalChargesAnnuel / 12 * 100) / 100;
  r.netDisponibleAnnuel = Math.round((revenuNetAnnuel - r.totalChargesAnnuel) * 100) / 100;
  r.netDisponibleMensuel = Math.round(r.netDisponibleAnnuel / 12 * 100) / 100;
  r.tauxChargesTotal = revenuNetAnnuel > 0
    ? Math.round(r.totalChargesAnnuel / revenuNetAnnuel * 10000) / 100 : 0;
  r.tauxNetDisponible = revenuNetAnnuel > 0
    ? Math.round(r.netDisponibleAnnuel / revenuNetAnnuel * 10000) / 100 : 0;

  // ═══ 5. COMPARAISON AVEC SALARIÉ ═══
  // Permet de comparer le coût total d'un indépendant vs un salarié
  // pour le même "pouvoir d'achat net"
  const brutSalarieEquiv = revenuNetAnnuel / 12; // approximation grossière
  r.comparaisonSalarie = {
    brutEquivMensuel: Math.round(brutSalarieEquiv * 100) / 100,
    onssWSalarie: Math.round(brutSalarieEquiv * LOIS_BELGES.onss.travailleur * 100) / 100,
    coutEmployeurEstime: Math.round(brutSalarieEquiv * (1 + LOIS_BELGES.onss.employeur.total) * 100) / 100,
  };

  // ═══ 6. INFOS COMPLÉMENTAIRES ═══
  r.pasDeChomage = true;          // l'indépendant n'a PAS droit au chômage
  r.assuranceATObligatoire = false; // AT: assurance privée recommandée mais pas obligatoire
  r.droitPasserelle = type !== 'complementaire'; // droit passerelle si cessation forcée
  r.pensionLegale = type !== 'conjointMini';     // droit pension si maxi-statut ou principal

  // Cotisations déductibles fiscalement
  r.cotisationsDeductibles = r.cotisAnnuelle; // 100% déductible du revenu imposable

  return r;
}

// Raccourci: calcul rapide cotisations sociales trimestrielles
function quickCotisIndep(revenuAnnuel, type) {
  const r = calcIndependant({ revenuNet: revenuAnnuel, type: type || 'principal' });
  return r.cotisTrimestre;
}

// ── Sprint 29: Real Email Sending via /api/send-email ──

export { calcIndependant, quickCotisIndep };
