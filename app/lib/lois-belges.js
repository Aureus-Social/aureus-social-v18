// ═══ AUREUS SOCIAL PRO — Module: Lois Belges 2026 ═══
// Constantes légales centralisées + timeline auto-update

var LOIS_BELGES = {
  _meta: { version: '2026.1.0', dateMAJ: '2026-01-01', source: 'SPF Finances / ONSS / CNT / Moniteur Belge', annee: 2026 },

  // ═══ ONSS ═══
  onss: {
    travailleur: 0.1307,
    employeur: { total: 0.2507, detail: { pension: 0.0886, maladie: 0.0370, chomage: 0.0138, accidents: 0.0087, maladiesPro: 0.0102, fermeture: 0.0012, moderation: 0.0560, cotisationsSpec: 0.0352 }},
    plafondAnnuel: null, // pas de plafond en Belgique
    ouvrier108: 1.08, // majoration 8% ouvriers
    reductionStructurelle: { seuil: 9932.40, forfait: 0, pctAuDessus: 0 },
    groupeCible: { jeunesNonQualifies: { age: 25, reduc: 1500 }, agees: { age: 55, reduc: 1500 }, handicapes: { reduc: 1500 }},
  },

  // ═══ PRÉCOMPTE PROFESSIONNEL ═══
  pp: {
    tranches: [
      { min: 0, max: 16710, taux: 0.2675 },
      { min: 16710, max: 29500, taux: 0.4280 },
      { min: 29500, max: 51050, taux: 0.4815 },
      { min: 51050, max: Infinity, taux: 0.5350 },
    ],
    fraisPro: { salarie: { pct: 0.30, max: 6070 }, dirigeant: { pct: 0.03, max: 3120 }},
    quotiteExemptee: { bareme1: 2987.98, bareme2: 5975.96 },
    quotientConjugal: { pct: 0.30, max: 12520 },
    reductionsEnfants: [0, 624, 1656, 4404, 7620, 11100, 14592, 18120, 21996],
    reductionEnfantSupp: 3864,
    reductionParentIsole: 624,
    reductionHandicape: 624,
    reductionConjointHandicape: 624,
    reductionConjointRevenuLimite: 1698,
    reductionConjointPensionLimitee: 3390,
    reductionPersonne65: 1992,
    reductionAutreCharge: 624,
    bonusEmploi: { pctReduction: 0.3314, maxMensuel: 194.03, seuilBrut1: 2561.42, seuilBrut2: 2997.59 },
  },

  // ═══ CSSS — Cotisation Spéciale Sécurité Sociale ═══
  csss: {
    isole: [
      { min: 0, max: 18592.02, montant: 0, taux: 0 },
      { min: 18592.02, max: 21070.96, montant: 0, taux: 0.076 },
      { min: 21070.96, max: 37344.02, montant: 9.30, taux: 0.011 },
      { min: 37344.02, max: 60181.95, montant: 9.30, tauxBase: 0.011, taux: 0.013, palierBase: 37344.02 },
      { min: 60181.95, max: Infinity, montantFixe: 51.64 },
    ],
    menage2revenus: [
      { min: 0, max: 18592.02, montant: 0, taux: 0 },
      { min: 18592.02, max: 21070.96, montant: 0, taux: 0.076 },
      { min: 21070.96, max: 60181.95, montant: 9.30, taux: 0.011 },
      { min: 60181.95, max: Infinity, montantFixe: 51.64 },
    ],
    menage1revenu: [
      { min: 0, max: 18592.02, montant: 0, taux: 0 },
      { min: 18592.02, max: 21070.96, montant: 0, taux: 0.076 },
      { min: 21070.96, max: 37344.02, montant: 9.30, taux: 0.011 },
      { min: 37344.02, max: 60181.95, montant: 0, taux: 0.013 },
      { min: 60181.95, max: Infinity, montantFixe: 51.64 },
    ],
  },

  // ═══ RÉMUNÉRATION ═══
  remuneration: {
    RMMMG: { montant18ans: 2070.48, montant20ans6m: 2070.48, montant21ans12m: 2070.48, source: 'CNT - CCT 43/15' },
    indexSante: { coeff: 2.0399, pivot: 125.60, dateDerniereIndex: '2024-12-01', prochainPivotEstime: '2026-06-01' },
    peculeVacances: {
      simple: { pct: 0.0767, base: 'brut annuel precedent' },
      double: { pct: 0.9200, base: 'brut mensuel' },
      patronal: { pct: 0.1535, base: 'brut annuel precedent' },
      ouvrierDouble: { pct: 0.0858, base: 'brut ouvrier x 108%' },
    },
    treizieme: { obligatoire: true, cp200: true, base: 'salaire mensuel brut', onss: true },
  },

  // ═══ CHÈQUES-REPAS ═══
  chequesRepas: {
    partTravailleur: { min: 1.09, max: null },
    valeurFaciale: { max: 10.00 },
    partPatronale: { max: 8.91 },
    conditions: 'Par jour effectivement preste',
    exonerationFiscale: true,
    exonerationONSS: true,
  },

  // ═══ FRAIS PROPRES EMPLOYEUR ═══
  fraisPropres: {
    forfaitBureau: { max: 157.83, base: 'mensuel' },
    forfaitDeplacement: { voiture: 0.4415, velo: 0.35, transportCommun: 1.00 },
    forfaitRepresentation: { max: 40, base: 'mensuel sans justificatif' },
    teletravail: { max: 157.83, base: 'mensuel structurel' },
  },

  // ═══ AVANTAGES — ALIAS POUR MODULES ═══
  avantages: {
    fraisPropres: {
      bureau: 154.74,
      km: 0.4415,
      repas: 19.22,
      teletravail: 154.74,
    },
    atnGSM: 3,
    atnPC: 6,
    atnInternet: 5,
    ecoMax: 250,
  },

  // ═══ COTISATIONS SPÉCIALES ═══
  cotisations: {
    cotCO2Min: 31.34,
    plafondONSS: 75038.09,
    flexiJob: { plafond: 12000, taux: 0.2807 },
  },

  // ═══ ATN — AVANTAGES EN NATURE ═══
  atn: {
    voiture: { CO2Ref: { essence: 102, diesel: 84, hybride: 84 }, coeff: 0.055, min: 1600, formule: '(catalogue x 6/7 x vetuste) x %CO2 / 12' },
    logement: { cadastralx100: true, meuble: 1.333 },
    gsm: { forfait: 3, mensuel: true },
    pc: { forfait: 6, mensuel: true },
    internet: { forfait: 5, mensuel: true },
    electricite: { cadre: 2130, noncadre: 960, annuel: true },
    chauffage: { cadre: 4720, noncadre: 2130, annuel: true },
  },

  // ═══ PRÉAVIS (CCT 109 / Loi Statut Unique) ═══
  preavis: {
    // Durée en semaines par ancienneté (années)
    employeur: [
      { ancMin: 0, ancMax: 0.25, semaines: 1 },
      { ancMin: 0.25, ancMax: 0.5, semaines: 3 },
      { ancMin: 0.5, ancMax: 0.75, semaines: 4 },
      { ancMin: 0.75, ancMax: 1, semaines: 5 },
      { ancMin: 1, ancMax: 2, semaines: 6 },
      { ancMin: 2, ancMax: 3, semaines: 7 },
      { ancMin: 3, ancMax: 4, semaines: 9 },
      { ancMin: 4, ancMax: 5, semaines: 12 },
      { ancMin: 5, ancMax: 6, semaines: 15 },
      { ancMin: 6, ancMax: 7, semaines: 18 },
      { ancMin: 7, ancMax: 8, semaines: 21 },
      { ancMin: 8, ancMax: 9, semaines: 24 },
      { ancMin: 9, ancMax: 10, semaines: 27 },
      { ancMin: 10, ancMax: 11, semaines: 30 },
      { ancMin: 11, ancMax: 12, semaines: 33 },
      { ancMin: 12, ancMax: 13, semaines: 36 },
      { ancMin: 13, ancMax: 14, semaines: 39 },
      { ancMin: 14, ancMax: 15, semaines: 42 },
      { ancMin: 15, ancMax: 16, semaines: 45 },
      { ancMin: 16, ancMax: 17, semaines: 48 },
      { ancMin: 17, ancMax: 18, semaines: 51 },
      { ancMin: 18, ancMax: 19, semaines: 54 },
      { ancMin: 19, ancMax: 20, semaines: 57 },
      { ancMin: 20, ancMax: 21, semaines: 60 },
      { ancMin: 21, ancMax: 22, semaines: 62 },
      { ancMin: 22, ancMax: 23, semaines: 63 },
      { ancMin: 23, ancMax: 24, semaines: 64 },
      { ancMin: 24, ancMax: 25, semaines: 65 },
    ],
    parAnSupp: 3, // +3 semaines par année > 25 ans
    travailleur: { facteur: 0.5, min: 1, max: 13 },
    motifGrave: 0,
    outplacement: { seuil: 30, semaines: 4 },
  },

  // ═══ TEMPS DE TRAVAIL ═══
  tempsTravail: {
    dureeHebdoLegale: 38,
    dureeHebdoMax: 38,
    heuresSupp: { majoration50: 0.50, majoration100: 1.00, recuperation: true, plafondAnnuel: 120, plafondVolontaire: 360 },
    nuit: { debut: '20:00', fin: '06:00', majoration: 0 },
    dimanche: { majoration: 1.00, repos: true },
    jourFerie: { nombre: 10, majoration: 2.00, remplacement: true },
    petitChomage: { mariage: 2, deces1: 3, deces2: 1, communion: 1, demenagement: 1 },
  },

  // ═══ CONTRATS ═══
  contrats: {
    periodeEssai: { supprimee: true, exception: 'travail etudiant/interim/occupation temporaire' },
    clauseNonConcurrence: { dureeMax: 12, brut_min: 44447, brut_mid: 88895, indemniteMin: 0.50 },
    ecolecholage: { dureeMax: 36, brut_min: 44447, formationMin: 80 },
  },

  // ═══ SEUILS SOCIAUX ═══
  seuils: {
    electionsSociales: { cppt: 50, ce: 100 },
    planFormation: 20,
    bilanSocial: 20,
    reglementTravail: 1,
    delegationSyndicale: { cp200: 50 },
    servicePPT: { interne: 20 },
    conseillerPrevention: { interne: 20 },
  },

  // ═══ ASSURANCES ═══
  assurances: {
    accidentTravail: { taux: 0.01, obligatoire: true },
    medecineTravail: { cout: 91.50, parTravailleur: true, annuel: false },
    assuranceLoi: { obligatoire: true },
    assuranceGroupe: { deductible: true, plafond80pct: true },
  },

  // ═══ ALLOCATIONS FAMILIALES (Région Bruxelles) ═══
  allocFamBxl: {
    base: { montant: 171.08, parEnfant: true },
    supplement1218: 29.64,
    supplementSocial: { plafondRevenu: 35978, montant: 54.38 },
    primeNaissance: { premier: 1214.73, suivants: 607.37 },
  },

  // ═══ DIMONA ═══
  dimona: {
    delaiIN: 'Avant debut prestations',
    delaiOUT: 'Le jour meme',
    types: ['IN','OUT','UPDATE','CANCEL'],
    canal: 'Portail securite sociale ou batch',
    sanctionNiveau: 3,
  },

  // ═══ DMFA ═══
  dmfa: {
    periodicite: 'Trimestrielle',
    delai: 'Dernier jour du mois suivant le trimestre',
    format: 'XML via batch ou portail',
    cotisationsPNP: true,
  },

  // ═══ BELCOTAX ═══
  belcotax: {
    delai: '1er mars annee N+1',
    format: 'XML BelcotaxOnWeb',
    fiches: ['281.10','281.13','281.14','281.20','281.30','281.50'],
  },

  // ═══ SOURCES OFFICIELLES ═══
  sources: [
    { id: 'spf', nom: 'SPF Finances', url: 'https://finances.belgium.be/fr/entreprises/personnel_et_remuneration/precompte_professionnel', type: 'PP/Fiscal' },
    { id: 'onss', nom: 'ONSS', url: 'https://www.socialsecurity.be', type: 'Cotisations sociales' },
    { id: 'cnt', nom: 'Conseil National du Travail', url: 'https://www.cnt-nar.be', type: 'CCT/RMMMG' },
    { id: 'spf_emploi', nom: 'SPF Emploi', url: 'https://emploi.belgique.be', type: 'Droit du travail' },
    { id: 'moniteur', nom: 'Moniteur Belge', url: 'https://www.ejustice.just.fgov.be/cgi/summary.pl', type: 'Legislation' },
    { id: 'statbel', nom: 'Statbel', url: 'https://statbel.fgov.be/fr/themes/prix-la-consommation/indice-sante', type: 'Index/Prix' },
    { id: 'bnb', nom: 'Banque Nationale', url: 'https://www.nbb.be', type: 'Bilan social' },
    { id: 'refli', nom: 'Refli.be', url: 'https://refli.be/fr/documentation/computation/tax', type: 'Reference technique' },
    { id: 'inasti', nom: 'INASTI/NISSE', url: 'https://www.nisse.be', type: 'Cotisations indépendants' },
  ],

  // ═══ RÉGIME INDÉPENDANTS — INASTI/NISSE 2026 ═══
  // Source: AR 19/12/1967 + Loi 05/08/2022 + Index 01/01/2026
  // Caisse sociale: perception trimestrielle (pas ONSS)
  inasti: {
    // ── Cotisations sociales trimestrielles (sur revenu net imposable annuel) ──
    cotisations: {
      // Taux principal: 20,50% jusqu'au plafond 1, puis 14,16% jusqu'au plafond 2
      tranche1: { taux: 0.2050, plafond: 73907.41 },  // indexé 2026
      tranche2: { taux: 0.1416, plafond: 108942.74 },  // indexé 2026
      // Au-delà du plafond 2: 0%
      plafondAbsolu: 108942.74,
    },
    // ── Frais de gestion caisse sociale (en sus des cotisations) ──
    fraisGestion: 0.0305, // 3,05% — variable selon caisse d'assurances sociales
    
    // ── Minimums trimestriels par catégorie (indexés 2026) ──
    minimums: {
      principal: {
        provisoire: 876.42,      // cotisation provisoire minimum/trimestre
        definitif: 876.42,       // cotisation définitive minimum/trimestre
        annuel: 3505.68,         // = 4 × 876.42
      },
      complementaire: {
        provisoire: 87.64,       // minimum beaucoup plus bas
        definitif: 87.64,
        annuel: 350.56,
      },
      pensionActif: {            // indépendant pensionné < 65 ans
        provisoire: 876.42,      // même que principal si activité principale
        definitif: 876.42,
      },
      pensionRetraite: {         // pensionné ≥ 65 ans (activité autorisée)
        provisoire: 87.64,       // minimum réduit
        definitif: 87.64,
      },
      conjointAidant: {
        maxiStatut: 876.42,      // maxi-statut = même que principal
        miniStatut: 292.14,      // mini-statut (uniquement maladie/invalidité)
      },
      etudiant: {
        provisoire: 87.64,       // étudiant-entrepreneur (< 25 ans)
        definitif: 87.64,
        seuilExoneration: 8429.88, // si revenu net < ce seuil → pas de cotisation
      },
    },

    // ── Primo-starters (4 premiers trimestres d'activité) ──
    primoStarter: {
      reductionPct: 0,           // pas de réduction automatique
      cotisProvisoire: 876.42,   // cotisation provisoire minimum (peut demander réduction)
      cotisReduite: 438.21,      // si réduction accordée par caisse sociale
    },

    // ── Dispense de cotisations (Art. 22 AR 19/12/1967) ──
    // Possible si difficultés financières — demande à la caisse sociale
    // Couverture maintenue mais droits pension réduits

    // ── Couverture sociale incluse dans les cotisations ──
    couverture: {
      pension: true,             // pension de retraite + survie
      maladieInvalidite: true,   // soins de santé + incapacité de travail
      allocationsFamiliales: true, // via Famiwal/Fons/Kind&Gezin
      maternite: true,           // repos maternité (12 sem employée, 12 sem indépendante)
      aidantProche: true,        // droit passerelle (faillite, cessation forcée)
      droitPasserelle: true,     // max 12 mois d'allocation en cas de cessation
      // PAS inclus: chômage (pas de droit), accident du travail (assurance privée)
    },

    // ── IPP (Impôt des Personnes Physiques) — même barème que salariés ──
    // Mais pas de précompte professionnel retenu à la source
    // → Versements anticipés obligatoires (VA1-VA4) sinon majoration 4,5%
    versementsAnticipes: {
      VA1: { trimestre: 'Q1', echeance: '10 avril', avantage: 3.0 },    // % de bonification
      VA2: { trimestre: 'Q2', echeance: '10 juillet', avantage: 2.5 },
      VA3: { trimestre: 'Q3', echeance: '10 octobre', avantage: 2.0 },
      VA4: { trimestre: 'Q4', echeance: '20 décembre', avantage: 1.5 },
      majoration: 0.045,         // 4,5% majoration si pas de VA suffisants
    },

    // ── Frais professionnels (forfait ou réels) ──
    fraisPro: {
      forfait: { pct: 0.30, max: 6070 }, // 30% plafonné (même barème que salariés)
      reel: true,                // l'indépendant peut déduire les frais réels (comptabilité)
    },

    // ── Statut social du conjoint aidant ──
    // Obligatoire depuis 01/07/2005 pour conjoint non divorcé d'un indépendant
    // qui aide régulièrement dans l'activité
    conjointAidant: {
      miniStatut: { couverture: ['maladie', 'invalidite', 'maternite'], pension: false },
      maxiStatut: { couverture: ['pension', 'maladie', 'invalidite', 'maternite', 'droitPasserelle'], pension: true },
    },

    // ── Société de management / Dirigeant d'entreprise (Art. 32 CIR 92) ──
    // Le dirigeant peut percevoir une rémunération (soumise ONSS comme salarié)
    // ET/OU des dividendes (précompte mobilier 30% ou VVPRbis 15%/20%)
    // Règle des 80%: pension complémentaire limitée à 80% de la dernière rémunération
    // Rémunération minimale recommandée: 45.000€ pour taux réduit ISOC
    dirigeant: {
      remunerationMinISO: 45000, // pour bénéficier du taux réduit ISOC 20%
      dividendeSeuil: 0.30,      // PM 30% (standard)
      vvprbisTaux1: 0.15,        // VVPRbis: 15% à partir de 3ème exercice
      vvprbisTaux2: 0.20,        // VVPRbis: 20% au 2ème exercice
      regle80pct: 0.80,          // pension complémentaire max 80% dernière rémunération
    },
  },
};

// ═══════════════════════════════════════════════════════════════════
// MOTEUR DE VEILLE LÉGALE AUTOMATIQUE — Timeline par date effective
// Chaque entrée = une date effective + les constantes qui changent CE JOUR-LÀ
// Le moteur applique toutes les entrées <= date du jour, dans l'ordre chronologique
// ═══════════════════════════════════════════════════════════════════

var LOIS_BELGES_TIMELINE = [
  // ─── 2024 ────────────────────────────────────────────────────────
  { date: '2024-01-01', source: 'MB — Index salaires conv. / SPF Finances',
    cct90: { plafondONSS: 4020, plafondFiscal: 3496, cotisationPatronale: 0.33, cotisationTravailleur: 0.1307 },
    chequesRepas: { valeurMax: 8.00, partPatronaleMax: 6.91, partTravailleurMin: 1.09, deductibilite: 2.00 },
    seuils: { ecolage: 39353, nonConcurrenceBas: 39353, nonConcurrenceHaut: 78606, arbitrage: 78606, supplementChomTemp: 3946 },
    teletravail: { forfaitBureau: 148.73, internet: 20, pc: 20, ecran: 5 },
    rmmmg: { montant18: 1994.18 },
    indemKm: { voiture: 0.4269, velo: 0.35 },
    pp: { fraisProMax: 5520, quotiteExemptee1: 2887.55 },
  },
  { date: '2024-06-01', source: 'ONSS Instructions 2024/2',
    teletravail: { forfaitBureau: 151.70 },
  },
  { date: '2024-07-01', source: 'AR indem. km 2024-2025',
    indemKm: { voiture: 0.4269, velo: 0.35 },
  },

  // ─── 2025 ────────────────────────────────────────────────────────
  { date: '2025-01-01', source: 'MB 13/11/2024 — Index salaires conv.',
    cct90: { plafondONSS: 4164, plafondFiscal: 3622 },
    seuils: { ecolage: 43106, nonConcurrenceBas: 43106, nonConcurrenceHaut: 86212, arbitrage: 86212, supplementChomTemp: 4149 },
    pp: { fraisProMax: 5750, quotiteExemptee1: 2920.86 },
    rmmmg: { montant18: 2029.88 },
  },
  { date: '2025-03-01', source: 'ONSS Instructions 2025/1',
    teletravail: { forfaitBureau: 157.83 },
  },
  { date: '2025-07-01', source: 'AR indem. km 2025-2026',
    indemKm: { voiture: 0.4415, velo: 0.35 },
  },

  // ─── 2026 ────────────────────────────────────────────────────────
  { date: '2026-01-01', source: 'MB 13/11/2025 + AR 10/11/2025 + Loi 30/12/2025',
    cct90: { plafondONSS: 4255, plafondFiscal: 3701 },
    chequesRepas: { valeurMax: 10.00, partPatronaleMax: 8.91, partTravailleurMin: 1.09, deductibilite: 4.00 },
    seuils: { ecolage: 44447, nonConcurrenceBas: 44447, nonConcurrenceHaut: 88895, arbitrage: 88895, supplementChomTemp: 4284 },
    pp: { fraisProMax: 6070, quotiteExemptee1: 2987.98 },
    rmmmg: { montant18: 2070.48 },
  },
  // Le forfait télétravail n'a PAS changé en mars 2026 (reste 157,83 depuis mars 2025)
  // Dès publication: ajouter { date: '2026-03-01', teletravail: { forfaitBureau: XXX.XX } }
  // Idem pour indem. km: { date: '2026-07-01', indemKm: { voiture: X.XXXX } }
];

// ═══ État courant — Résultat de l'application de la timeline ═══
var LOIS_BELGES_CURRENT = {
  cct90: { plafondONSS: 4255, plafondFiscal: 3701, cotisationPatronale: 0.33, cotisationTravailleur: 0.1307 },
  chequesRepas: { valeurMax: 10.00, partPatronaleMax: 8.91, partTravailleurMin: 1.09, deductibilite: 4.00 },
  seuils: { ecolage: 44447, nonConcurrenceBas: 44447, nonConcurrenceHaut: 88895, arbitrage: 88895, supplementChomTemp: 4284 },
  teletravail: { forfaitBureau: 157.83, internet: 20, pc: 20, ecran: 5 },
  rmmmg: { montant18: 2070.48 },
  indemKm: { voiture: 0.4415, velo: 0.35 },
  pp: { fraisProMax: 6070, quotiteExemptee1: 2987.98 },
  _lastApplied: '2026-01-01',
};

// Applique la timeline: merge toutes les entrées dont la date <= targetDate
function applyTimeline(targetDate) {
  var td = targetDate || new Date().toISOString().slice(0, 10);
  var state = {};
  var lastDate = '';
  var appliedCount = 0;
  for (var i = 0; i < LOIS_BELGES_TIMELINE.length; i++) {
    var entry = LOIS_BELGES_TIMELINE[i];
    if (entry.date <= td) {
      // Deep merge: chaque clé de l'entrée override la valeur correspondante
      var keys = Object.keys(entry);
      for (var k = 0; k < keys.length; k++) {
        var key = keys[k];
        if (key === 'date' || key === 'source') continue;
        if (!state[key]) state[key] = {};
        var subKeys = Object.keys(entry[key]);
        for (var s = 0; s < subKeys.length; s++) {
          state[key][subKeys[s]] = entry[key][subKeys[s]];
        }
      }
      lastDate = entry.date;
      appliedCount++;
    }
  }
  state._lastApplied = lastDate;
  state._appliedEntries = appliedCount;
  return state;
}

// Applique l'état à LOIS_BELGES et LOIS_BELGES_CURRENT
function syncLoisBelges(state) {
  if (!state || !state.chequesRepas) return;
  // Copie vers CURRENT
  Object.keys(state).forEach(function(k) { if (k[0] !== '_') LOIS_BELGES_CURRENT[k] = state[k]; });
  LOIS_BELGES_CURRENT._lastApplied = state._lastApplied;
  // Sync vers LOIS_BELGES (objet principal utilisé partout)
  if (state.chequesRepas) {
    LOIS_BELGES.chequesRepas.valeurFaciale.max = state.chequesRepas.valeurMax;
    LOIS_BELGES.chequesRepas.partPatronale.max = state.chequesRepas.partPatronaleMax;
    if (state.chequesRepas.partTravailleurMin) LOIS_BELGES.chequesRepas.partTravailleur.min = state.chequesRepas.partTravailleurMin;
  }
  if (state.teletravail) {
    LOIS_BELGES.fraisPropres.forfaitBureau.max = state.teletravail.forfaitBureau;
    LOIS_BELGES.fraisPropres.teletravail.max = state.teletravail.forfaitBureau;
  }
  if (state.seuils) {
    LOIS_BELGES.contrats.clauseNonConcurrence.brut_min = state.seuils.nonConcurrenceBas;
    LOIS_BELGES.contrats.clauseNonConcurrence.brut_mid = state.seuils.nonConcurrenceHaut;
    LOIS_BELGES.contrats.ecolecholage.brut_min = state.seuils.ecolage;
  }
  if (state.rmmmg) LOIS_BELGES.remuneration.RMMMG.montant18ans = state.rmmmg.montant18;
  if (state.pp) {
    LOIS_BELGES.pp.fraisPro.salarie.max = state.pp.fraisProMax;
    LOIS_BELGES.pp.quotiteExemptee.bareme1 = state.pp.quotiteExemptee1;
    LOIS_BELGES.pp.quotiteExemptee.bareme2 = state.pp.quotiteExemptee1 * 2;
  }
  LOIS_BELGES._meta.dateMAJ = new Date().toISOString().slice(0, 10);
  LOIS_BELGES._meta.version = state._lastApplied.slice(0, 4) + '.auto';
  LOIS_BELGES._meta.annee = parseInt(state._lastApplied.slice(0, 4));
}

// Détecte si des entrées futures existent (= on sait déjà ce qui va changer)
function checkLoisBelgesOutdated() {
  var today = new Date().toISOString().slice(0, 10);
  var applied = LOIS_BELGES_CURRENT._lastApplied || '';
  var future = LOIS_BELGES_TIMELINE.filter(function(e) { return e.date > today; });
  var pending = LOIS_BELGES_TIMELINE.filter(function(e) { return e.date <= today && e.date > applied; });
  var lastEntry = LOIS_BELGES_TIMELINE[LOIS_BELGES_TIMELINE.length - 1];
  var lastYear = lastEntry ? parseInt(lastEntry.date.slice(0, 4)) : 0;
  var currentYear = new Date().getFullYear();
  return {
    outdated: pending.length > 0 || lastYear < currentYear,
    pendingCount: pending.length,
    futureCount: future.length,
    futureEntries: future.map(function(e) { return { date: e.date, source: e.source }; }),
    lastApplied: applied,
    missingYear: lastYear < currentYear,
    warnings: pending.length > 0 ? ['Il y a ' + pending.length + ' mise(s) a jour en attente.'] :
              lastYear < currentYear ? ['Aucune entree pour ' + currentYear + '. Verifiez les publications officielles.'] : [],
  };
}

// Snapshot par année (pour VeilleLegale comparaison)
var LOIS_BELGES_HISTORIQUE = {};
(function buildYearlySnapshots() {
  [2024, 2025, 2026, 2027, 2028].forEach(function(y) {
    var state = applyTimeline(y + '-12-31');
    if (state._appliedEntries > 0) LOIS_BELGES_HISTORIQUE[y] = state;
  });
})();

// Auto-apply au chargement
(function autoApplyLoisBelges() {
  var state = applyTimeline();
  syncLoisBelges(state);
})();


// Aliases courts pour accès rapide dans tout le code
var LB=LOIS_BELGES;
var TX_ONSS_W=LB.onss.travailleur; // 0.1307
var TX_ONSS_E=LB.onss.employeur.total; // 0.2507
var TX_OUV108=LB.onss.ouvrier108; // 1.08
var TX_AT=LB.assurances.accidentTravail.taux; // 0.01
var COUT_MED=LB.assurances.medecineTravail.cout; // COUT_MED
var CR_TRAV=LB.chequesRepas.partTravailleur.min; // CR_TRAV
var PP_EST=0.22; // PP estimation moyenne (~22% de l'imposable)
var NET_FACTOR=(1-TX_ONSS_W)*(1-PP_EST); // facteur net approx = ~0.5645
var quickNetEst=(b)=>Math.round(b*NET_FACTOR*100)/100; // estimation rapide net
var CR_MAX=LB.chequesRepas.valeurFaciale.max; // 8.00
var CR_PAT=LB.chequesRepas.partPatronale.max; // 6.91
var FORF_BUREAU=LB.fraisPropres.forfaitBureau.max; // FORF_BUREAU
var FORF_KM=LB.fraisPropres.forfaitDeplacement.voiture; // 0.4415
var PV_SIMPLE=LB.remuneration.peculeVacances.simple.pct; // PV_SIMPLE
var PV_DOUBLE=LB.remuneration.peculeVacances.double.pct; // 0.92
var RMMMG=LB.remuneration.RMMMG.montant18ans; // RMMMG
var BONUS_MAX=LB.pp.bonusEmploi.maxMensuel; // 194.03
var SEUIL_CPPT=LB.seuils.electionsSociales.cppt; // 50
var SEUIL_CE=LB.seuils.electionsSociales.ce; // 100
var HEURES_HEBDO=LB.tempsTravail.dureeHebdoLegale; // 38
var JOURS_FERIES=LB.tempsTravail.jourFerie.nombre; // 10


// Fonction centralisée: obtenir une valeur légale
function getLoi(path, fallback) {
  const parts = path.split('.');
  let val = LOIS_BELGES;
  for (const p of parts) { val = val?.[p]; if (val === undefined) return fallback; }
  return val;
}


// Aliases courts pour calculs — connectés à LOIS_BELGES
// (voir bloc RACCOURCIS CENTRALISÉS plus bas)
var _PVP = LOIS_BELGES.remuneration.peculeVacances.patronal.pct;
var _HLEG = LOIS_BELGES.tempsTravail.dureeHebdoLegale;

// Fonction centralisée: calculer PP via LOIS_BELGES
function calcPPFromLois(brut, opts) {
  const L = LOIS_BELGES;
  const onss = Math.round(brut * L.onss.travailleur * 100) / 100;
  const imposable = brut - onss;
  const annuel = imposable * 12;
  const dirigeant = opts?.dirigeant || false;
  const fp = dirigeant ? L.pp.fraisPro.dirigeant : L.pp.fraisPro.salarie;
  const forfait = Math.min(annuel * fp.pct, fp.max);
  const base = Math.max(0, annuel - forfait);
  const isB2 = opts?.bareme2 || false;
  let qc = 0, baseNet = base;
  if (isB2) { qc = Math.min(base * L.pp.quotientConjugal.pct, L.pp.quotientConjugal.max); baseNet = base - qc; }
  const calcTr = (b) => { let imp = 0, prev = 0; for (const t of L.pp.tranches) { const slice = Math.min(b, t.max) - Math.max(prev, t.min); if (slice > 0) imp += slice * t.taux; prev = t.max; } return imp; };
  let impot = calcTr(baseNet);
  if (isB2 && qc > 0) impot += calcTr(qc);
  const qe = isB2 ? L.pp.quotiteExemptee.bareme2 : L.pp.quotiteExemptee.bareme1;
  const enf = +(opts?.enfants || 0);
  const enfH = +(opts?.enfantsHandicapes || 0);
  const enfFisc = enf + enfH;
  let redEnf = 0;
  if (enfFisc > 0) { redEnf = enfFisc <= 8 ? L.pp.reductionsEnfants[enfFisc] : L.pp.reductionsEnfants[8] + (enfFisc - 8) * L.pp.reductionEnfantSupp; }
  let totalRed = qe + redEnf;
  if (opts?.parentIsole && enf > 0) totalRed += L.pp.reductionParentIsole;
  if (opts?.handicape) totalRed += L.pp.reductionHandicape;
  const taxeCom = (opts?.taxeCom || 7) / 100;
  const ppAn = Math.max(0, impot - totalRed) * (1 + taxeCom);
  return Math.round(ppAn / 12 * 100) / 100;
}


// ═══ RACCOURCIS CENTRALISÉS — Toute modif dans LOIS_BELGES se propage ICI ═══
var _OW = LOIS_BELGES.onss.travailleur; // 0.1307
var _OE = LOIS_BELGES.onss.employeur.total; // 0.2507
var _OUV108 = LOIS_BELGES.onss.ouvrier108; // 1.08
var _AT = LOIS_BELGES.assurances.accidentTravail.taux; // 0.01
var _MED = LOIS_BELGES.assurances.medecineTravail.cout; // _MED
var _CR_W = LOIS_BELGES.chequesRepas.partTravailleur.min; // _CR_W
var _CR_VF = LOIS_BELGES.chequesRepas.valeurFaciale.max; // 8.00
var _CR_E = LOIS_BELGES.chequesRepas.partPatronale.max; // 6.91
var _PVS = LOIS_BELGES.remuneration.peculeVacances.simple.pct; // PV_SIMPLE
var _PVD = LOIS_BELGES.remuneration.peculeVacances.double.pct; // 0.92
var _PVE = LOIS_BELGES.remuneration.peculeVacances.patronal.pct; // _PVP()
var _KM = LOIS_BELGES.fraisPropres.forfaitDeplacement.voiture; // _KM
var _BUREAU = LOIS_BELGES.fraisPropres.forfaitBureau.max; // 157.83
var _RMMMG = LOIS_BELGES.remuneration.RMMMG.montant18ans; // 2070.48
var _IDX = LOIS_BELGES.remuneration.indexSante.coeff; // 2.0399


// ═══ FORMATEURS CENTRALISÉS ═══
var fmt = (v) => new Intl.NumberFormat('fr-BE', { style: 'currency', currency: 'EUR' }).format(v);
var fi = (v) => new Intl.NumberFormat('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
var fmtP = (v) => (v * 100).toFixed(2) + ' %';

// ═══ EXPORTS ═══
export { LOIS_BELGES, LOIS_BELGES_TIMELINE, LOIS_BELGES_CURRENT, LOIS_BELGES_HISTORIQUE,
  applyTimeline, syncLoisBelges, getLoi, calcPPFromLois, checkLoisBelgesOutdated,
  LB, TX_ONSS_W, TX_ONSS_E, TX_OUV108, TX_AT, COUT_MED, CR_TRAV,
  PP_EST, NET_FACTOR, quickNetEst,
  CR_MAX, CR_PAT, FORF_BUREAU, FORF_KM,
  PV_SIMPLE, PV_DOUBLE, RMMMG, BONUS_MAX,
  SEUIL_CPPT, SEUIL_CE, HEURES_HEBDO, JOURS_FERIES,
  _OW, _OE, _PVP, _HLEG,
  _OUV108, _AT, _MED, _CR_W, _CR_VF, _CR_E,
  _PVS, _PVD, _PVE, _KM, _BUREAU, _RMMMG, _IDX,
  fmt, fi, fmtP };
