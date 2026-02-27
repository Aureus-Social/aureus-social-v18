// ═══════════════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Simulateur Coût Employeur
//  Calculs connectés à LOIS_BELGES (lib/lois-belges.js)
// ═══════════════════════════════════════════════════════════════

/**
 * Calcule le coût employeur complet pour un travailleur belge
 * @param {Object} params
 * @param {number} params.brutMensuel - Salaire brut mensuel
 * @param {string} params.statut - 'employe' | 'ouvrier'
 * @param {string} params.cp - Commission paritaire (ex: '200')
 * @param {boolean} params.premierEngagement - 1er engagement?
 * @param {number} params.numeroEngagement - 1 à 6 (pour réductions)
 * @param {number} params.chequesRepasPatronal - Part patronale chèques-repas (0-6.91)
 * @param {number} params.ecoChequesAn - Éco-chèques annuels (0-250)
 * @param {number} params.joursMois - Jours ouvrables du mois (défaut 20)
 * @param {boolean} params.teletravail - Indemnité télétravail?
 * @param {boolean} params.treizieme - 13ème mois applicable?
 * @param {Object} params.loisBelges - Référence aux constantes LOIS_BELGES
 * @returns {Object} Détail complet du coût
 */
export function simulerCoutEmployeur({
  brutMensuel = 3000,
  statut = 'employe',
  cp = '200',
  premierEngagement = false,
  numeroEngagement = 1,
  chequesRepasPatronal = 6.91,
  ecoChequesAn = 250,
  joursMois = 20,
  teletravail = false,
  treizieme = true,
  assuranceAT = 0.015,
  medecineTravailAn = 100,
} = {}) {

  const isOuvrier = statut === 'ouvrier';
  const brut100 = isOuvrier ? brutMensuel * 1.08 : brutMensuel;

  // ── ONSS Patronal ──
  const tauxONSSPatronal = 0.2507;
  const onssPatronal = brut100 * tauxONSSPatronal;

  // ── Réductions premiers engagements ──
  let reductionONSS = 0;
  if (premierEngagement || numeroEngagement === 1) {
    reductionONSS = onssPatronal; // Exonération quasi-totale
  } else if (numeroEngagement === 2) {
    reductionONSS = 1550 / 3; // ~516.67€/mois
  } else if (numeroEngagement === 3) {
    reductionONSS = 1050 / 3;
  } else if (numeroEngagement >= 4 && numeroEngagement <= 6) {
    reductionONSS = 1000 / 3;
  }
  reductionONSS = Math.min(reductionONSS, onssPatronal);

  const onssNet = onssPatronal - reductionONSS;

  // ── Provision pécule de vacances ──
  const provPecule = brutMensuel * 0.1538 / 12; // 15.38% annuel

  // ── Provision 13ème mois ──
  const provTreizieme = treizieme ? brutMensuel / 12 : 0;

  // ── ONSS sur provisions ──
  const onssProvisions = (provPecule + provTreizieme) * tauxONSSPatronal;

  // ── Assurance accidents du travail ──
  const assuranceATMontant = brutMensuel * assuranceAT;

  // ── Médecine du travail ──
  const medecineMois = medecineTravailAn / 12;

  // ── Chèques-repas ──
  const chequesRepasMois = chequesRepasPatronal * joursMois;

  // ── Éco-chèques ──
  const ecoChequeMois = ecoChequesAn / 12;

  // ── Télétravail ──
  const forfaitTeletravail = teletravail ? 154.74 : 0;

  // ── TOTAUX ──
  const coutMensuel = brutMensuel + onssNet + provPecule + provTreizieme +
    onssProvisions + assuranceATMontant + medecineMois +
    chequesRepasMois + ecoChequeMois + forfaitTeletravail;

  const coutAnnuel = coutMensuel * 12;
  const ratio = coutMensuel / brutMensuel;

  // ── Calcul Net approximatif (pour info) ──
  const onssTravailleur = brut100 * 0.1307;
  const imposable = brutMensuel - onssTravailleur;
  // PP approximatif simplifié (barème 1, isolé, pas d'enfant)
  let ppApprox = 0;
  const imposableAnnuel = imposable * 12;
  const fraisPro = Math.min(imposableAnnuel * 0.30, 5930);
  const base = imposableAnnuel - fraisPro - 2987.98; // quotité exemptée
  if (base > 0) {
    if (base <= 16310) ppApprox = base * 0.2675;
    else if (base <= 28790) ppApprox = 16310 * 0.2675 + (base - 16310) * 0.4280;
    else if (base <= 49820) ppApprox = 16310 * 0.2675 + 12480 * 0.4280 + (base - 28790) * 0.4815;
    else ppApprox = 16310 * 0.2675 + 12480 * 0.4280 + 21030 * 0.4815 + (base - 49820) * 0.5350;
    ppApprox = ppApprox / 12;
  }
  const netApprox = imposable - Math.max(0, ppApprox);

  return {
    // Inputs
    brutMensuel,
    statut,
    cp,
    isOuvrier,
    brut100: Math.round(brut100 * 100) / 100,

    // Détail ONSS
    onssPatronalBrut: Math.round(onssPatronal * 100) / 100,
    reductionONSS: Math.round(reductionONSS * 100) / 100,
    onssPatronalNet: Math.round(onssNet * 100) / 100,
    tauxONSSEffectif: Math.round((onssNet / brutMensuel) * 10000) / 100,

    // Provisions
    provisionPeculeVacances: Math.round(provPecule * 100) / 100,
    provisionTreizieme: Math.round(provTreizieme * 100) / 100,
    onssProvisions: Math.round(onssProvisions * 100) / 100,

    // Charges annexes
    assuranceAT: Math.round(assuranceATMontant * 100) / 100,
    medecineTravail: Math.round(medecineMois * 100) / 100,

    // Avantages
    chequesRepas: Math.round(chequesRepasMois * 100) / 100,
    ecoChequeMois: Math.round(ecoChequeMois * 100) / 100,
    forfaitTeletravail,

    // Totaux
    coutMensuel: Math.round(coutMensuel * 100) / 100,
    coutAnnuel: Math.round(coutAnnuel * 100) / 100,
    ratio: Math.round(ratio * 100) / 100,

    // Net approximatif
    onssTravailleur: Math.round(onssTravailleur * 100) / 100,
    precomptePro: Math.round(Math.max(0, ppApprox) * 100) / 100,
    netApprox: Math.round(netApprox * 100) / 100,

    // Résumé textuel
    resume: `💰 Coût employeur: ${Math.round(coutMensuel).toLocaleString('fr-BE')}€/mois (${Math.round(coutAnnuel).toLocaleString('fr-BE')}€/an) | Ratio: ×${ratio.toFixed(2)} | Net approx: ~${Math.round(netApprox).toLocaleString('fr-BE')}€`,
  };
}

/**
 * Calcul rapide du préavis en semaines
 * @param {number} ancienneteAnnees - Ancienneté en années
 * @param {string} initiateur - 'employeur' | 'travailleur'
 * @returns {Object} { semaines, description }
 */
export function calculerPreavis(ancienneteAnnees, initiateur = 'employeur') {
  const table = [
    { min: 0, max: 0.25, emp: 1, trav: 1 },
    { min: 0.25, max: 0.5, emp: 3, trav: 2 },
    { min: 0.5, max: 0.75, emp: 4, trav: 2 },
    { min: 0.75, max: 1, emp: 4, trav: 2 },
    { min: 1, max: 2, emp: 5, trav: 2 },
    { min: 2, max: 3, emp: 7, trav: 4 },
    { min: 3, max: 4, emp: 9, trav: 4 },
    { min: 4, max: 5, emp: 12, trav: 7 },
    { min: 5, max: 6, emp: 15, trav: 9 },
    { min: 6, max: 7, emp: 18, trav: 10 },
    { min: 7, max: 8, emp: 21, trav: 12 },
    { min: 8, max: 9, emp: 24, trav: 13 },
    { min: 9, max: 10, emp: 27, trav: 13 },
    { min: 10, max: 11, emp: 30, trav: 13 },
    { min: 11, max: 12, emp: 33, trav: 13 },
    { min: 12, max: 13, emp: 36, trav: 13 },
    { min: 13, max: 14, emp: 39, trav: 13 },
    { min: 14, max: 15, emp: 39, trav: 13 },
    { min: 15, max: 16, emp: 42, trav: 13 },
    { min: 16, max: 17, emp: 45, trav: 13 },
    { min: 17, max: 18, emp: 48, trav: 13 },
    { min: 18, max: 19, emp: 51, trav: 13 },
    { min: 19, max: 20, emp: 54, trav: 13 },
    { min: 20, max: 21, emp: 57, trav: 13 },
    { min: 21, max: 22, emp: 60, trav: 13 },
    { min: 22, max: 23, emp: 62, trav: 13 },
    { min: 23, max: 24, emp: 63, trav: 13 },
    { min: 24, max: 25, emp: 64, trav: 13 },
    { min: 25, max: 99, emp: 65, trav: 13 },
  ];

  const row = table.find(r => ancienneteAnnees >= r.min && ancienneteAnnees < r.max)
    || table[table.length - 1];

  const semaines = initiateur === 'employeur' ? row.emp : row.trav;
  const jours = semaines * 7;
  const moisApprox = Math.round(jours / 30 * 10) / 10;

  return {
    semaines,
    jours,
    moisApprox,
    anciennete: ancienneteAnnees,
    initiateur,
    base_legale: 'Loi 26/12/2013 (Statut unique)',
    indemniteRupture: `${semaines} semaines de rémunération (si non presté)`,
    outplacement: semaines >= 30 ? 'Obligatoire (60h, min 1.800€ sur 12 mois)' : 'Non requis',
  };
}

/**
 * Vérifie les alertes légales pour un dossier
 * @param {Object} company - Données entreprise
 * @param {Array} employees - Liste employés
 * @returns {Array} Liste d'alertes
 */
export function checkAlertesLegales(company, employees = []) {
  const alertes = [];
  const now = new Date();
  const moisActuel = now.getMonth() + 1;

  // ── Alerte: Règlement de travail ──
  if (employees.length > 0 && !company?.reglementTravail) {
    alertes.push({
      severity: 'critique',
      type: 'document_manquant',
      titre: 'Règlement de travail obligatoire',
      message: `Vous avez ${employees.length} travailleur(s) mais pas de règlement de travail enregistré. Ce document est obligatoire dès le premier travailleur.`,
      baseLegale: 'Loi 8/4/1965',
      sanction: 'Amende 400€ à 4.000€',
      action: 'Rédigez et déposez un règlement de travail auprès du CLS.',
    });
  }

  // ── Alerte: Assurance AT ──
  if (employees.length > 0 && !company?.assuranceAT) {
    alertes.push({
      severity: 'critique',
      type: 'assurance_manquante',
      titre: 'Assurance Accidents du Travail obligatoire',
      message: 'Toute entreprise avec au moins 1 travailleur doit souscrire une assurance AT auprès d\'un assureur agréé.',
      baseLegale: 'Loi 10/4/1971',
      sanction: 'Affiliation d\'office à Fedris + arriérés + amendes',
      action: 'Souscrivez une police AT (AG, AXA, Ethias, etc.)',
    });
  }

  // ── Alerte: CPPT si >= 50 travailleurs ──
  if (employees.length >= 50 && !company?.cppt) {
    alertes.push({
      severity: 'haute',
      type: 'organe_manquant',
      titre: 'CPPT obligatoire (≥50 travailleurs)',
      message: `Avec ${employees.length} travailleurs, un Comité pour la Prévention et la Protection au Travail est obligatoire.`,
      baseLegale: 'Loi 4/8/1996, Code bien-être',
      sanction: 'Infraction sociale niveau 3',
      action: 'Organisez des élections sociales lors du prochain cycle.',
    });
  }

  // ── Alerte: CE si >= 100 travailleurs ──
  if (employees.length >= 100 && !company?.conseilEntreprise) {
    alertes.push({
      severity: 'haute',
      type: 'organe_manquant',
      titre: 'Conseil d\'Entreprise obligatoire (≥100 travailleurs)',
      message: `Avec ${employees.length} travailleurs, un Conseil d'Entreprise doit être institué.`,
      baseLegale: 'Loi 20/9/1948',
      sanction: 'Infraction sociale niveau 3',
      action: 'Organisez des élections sociales.',
    });
  }

  // ── Alerte: Bilan social si >= 20 ──
  if (employees.length >= 20 && !company?.bilanSocial) {
    alertes.push({
      severity: 'moyenne',
      type: 'declaration_manquante',
      titre: 'Bilan social obligatoire (≥20 ETP)',
      message: 'Le bilan social doit être déposé auprès de la BNB avec les comptes annuels.',
      baseLegale: 'AR 4/8/1996',
      sanction: 'Non-conformité aux obligations comptables',
      action: 'Préparez le bilan social avec votre comptable.',
    });
  }

  // ── Alerte: Dimona manquante ──
  employees.forEach(emp => {
    if (!emp.dimona && emp.actif !== false) {
      alertes.push({
        severity: 'critique',
        type: 'dimona_manquante',
        titre: `Dimona manquante: ${emp.prenom || ''} ${emp.nom || ''}`,
        message: 'La déclaration Dimona IN doit être faite AVANT le premier jour de travail.',
        baseLegale: 'AR 5/11/2002',
        sanction: '2.750€ à 13.750€ par travailleur',
        action: 'Effectuez la Dimona IN immédiatement via le portail de la sécurité sociale.',
      });
    }
  });

  // ── Alerte: Deadlines trimestrielles ──
  const deadlines = [
    { mois: 1, limite: 31, label: 'DmfA T4 + ONSS T4' },
    { mois: 2, limite: 28, label: 'Belcotax 281.10/20' },
    { mois: 4, limite: 30, label: 'DmfA T1 + ONSS T1' },
    { mois: 7, limite: 31, label: 'DmfA T2 + ONSS T2' },
    { mois: 10, limite: 31, label: 'DmfA T3 + ONSS T3' },
  ];

  deadlines.forEach(dl => {
    const jourActuel = now.getDate();
    if (moisActuel === dl.mois && jourActuel >= dl.limite - 7) {
      alertes.push({
        severity: 'haute',
        type: 'deadline',
        titre: `⏰ Deadline approche: ${dl.label}`,
        message: `Date limite: ${dl.limite}/${String(dl.mois).padStart(2, '0')} — dans ${dl.limite - jourActuel} jour(s).`,
        baseLegale: 'Loi ONSS 27/6/1969',
        sanction: 'Majorations de retard + intérêts',
        action: 'Vérifiez et envoyez vos déclarations.',
      });
    }
  });

  // ── Alerte: Indexation CP 200 (janvier) ──
  if (moisActuel === 12 || moisActuel === 1) {
    alertes.push({
      severity: 'info',
      type: 'indexation',
      titre: '📊 Indexation CP 200 — Janvier',
      message: 'L\'indexation annuelle de la CP 200 est applicable au 1er janvier. Vérifiez que tous les barèmes ont été mis à jour.',
      baseLegale: 'CCT sectorielle CP 200',
      action: 'Mettez à jour les barèmes dans le module Veille Légale.',
    });
  }

  // ── Alerte: Pécule de vacances (mai-juin) ──
  if (moisActuel === 4 || moisActuel === 5) {
    alertes.push({
      severity: 'info',
      type: 'pecule',
      titre: '🏖️ Pécule de vacances — Rappel',
      message: 'Le double pécule de vacances des employés est généralement payé en mai-juin. Vérifiez vos provisions.',
      baseLegale: 'Lois coordonnées 28/6/1971',
      action: 'Calculez et provisionnez le pécule de vacances.',
    });
  }

  return alertes.sort((a, b) => {
    const order = { critique: 0, haute: 1, moyenne: 2, info: 3 };
    return (order[a.severity] || 9) - (order[b.severity] || 9);
  });
}
