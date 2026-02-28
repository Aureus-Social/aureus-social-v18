var LEGAL={ONSS_W:TX_ONSS_W,ONSS_E:TX_ONSS_E,BONUS_2026:{
    // Bonus à l'emploi — Volet A (bas salaires) + Volet B (très bas salaires)
    // Source: Instructions ONSS T1/2026 — indexé 01/01/2026
    // Employés (déclarés à 100%)
    A_S1:3340.44, A_MAX:132.92, A_COEFF:0.2638,  // Volet A: si S <= S1, R_A = A_MAX - A_COEFF*(S - A_S2)
    A_S2:2833.27,                                  // si S <= A_S2: R_A = A_MAX
    B_S1:2833.27, B_MAX:123.08, B_COEFF:0.2443,   // Volet B: si S <= B_S1, R_B = B_MAX - B_COEFF*(S - B_S2)
    B_S2:2330.10,                                  // si S <= B_S2: R_B = B_MAX
    // Ouvriers (déclarés à 108%) — mêmes seuils mais x1.08
    O_A_S1:3609.28, O_A_MAX:143.55, O_A_COEFF:0.2449, 
    O_A_S2:3059.93,
    O_B_S1:3059.93, O_B_MAX:132.93, O_B_COEFF:0.2262,
    O_B_S2:2516.51
  },
  // ── Réduction structurelle ONSS T1/2026 — Source: Easypay Group / ONSS 09/01/2026 ──
  RED_STRUCT_2026:{
    // Cat 1: Secteur privé marchand (25%) — F=0, δ=0 → seuls bas/très bas salaires
    CAT1_alpha:0.1400, CAT1_S0:11458.57,  // composanté bas salaires: α*(S0-S)
    CAT1_gamma:0.1500, CAT1_S2:9547.20,   // composanté très bas salaires: γ*(S2-S)
    CAT1_F:0, CAT1_delta:0, CAT1_S1:0,
    // Cat 2: Maribel social / non-marchand (±32.40%)
    CAT2_F:79.00, CAT2_alpha:0.2300, CAT2_S0:9975.60,
    CAT2_gamma:0.1500, CAT2_S2:9975.60,
    CAT2_delta:0.0600, CAT2_S1:16803.98,
    // Cat 3: Entreprises de travail adapté
    CAT3_alpha:0.1400, CAT3_S0:12416.08,
    CAT3_gamma:0.1500, CAT3_S2:9547.20,
    CAT3_F:0, CAT3_delta:0, CAT3_S1:0,
    // Cat 3bis: ETA travailleurs moins valides
    CAT3B_F:495.00, CAT3B_alpha:0.1785, CAT3B_S0:11788.30,
    CAT3B_gamma:0.1500, CAT3B_S2:9547.20,
    // Multiplicateur fixe Ps = R * µ * fraction_prestation (µ=0.1400 intégré dans formule)
    MU:1.0  // µ déjà intégré dans les coefficients ci-dessus pour simplifier
  },MV:{emax:8.91,wmin:1.09,maxTotal:10,deducFisc:4},ECO:250,WD:21.67,WH:38,WHD:7.6,
  // ── Précompte professionnel 2026 — Annexe III AR/CIR 92 (Moniteur belge) ──
  // Formule-clé complète SPF Finances (pas simplifiée)
  PP2026:{
    // Frais professionnels forfaitaires (salariés)
    FP_PCT:0.30, FP_MAX:5930,
    // Frais professionnels dirigeants d\'entreprise
    FP_DIR_PCT:0.03, FP_DIR_MAX:3120,
    // Barème progressif ANNUEL (tranches 2026 indexées)
    TRANCHES:[
      {lim:16310,rate:0.2675},
      {lim:29940,rate:0.4280},
      {lim:41370,rate:0.4815},
      {lim:Infinity,rate:0.5350}
    ],
    // Quotité exemptée d'impôt 2026
    EXEMPT:10900,
    // Réductions annuelles pour charges de famille
    RED:{
      isolée:144.00,          // personne isolée
      veuf_enfant:540.00,     // veuf/veuve non remarié(e) + enfant
      enfants:[0,612,1620,3672,5928,7116],  // 0,1,2,3,4,5 enfants
      enfantX:7116,           // par enfant supplémentaire > 5
      handicap:612,           // supplément par enfant handicape
      ascendant65:1728,       // parent/grand-parent ≥65 ans à charge
      ascendant65_handi:2100, // idem handicape
      conjoint_charge:0,      // quotient conjugal: traité séparément
    },
    // Quotient conjugal (barème 2): max 30% du revenu, plafonné à 12 520 €
    QC_PCT:0.30, QC_MAX:12520,
  },
  // ── Modulations sectorielles ONSS ──
  // Depuis tax-shift 2018: taux facial = 25% secteur marchand privé (inclut modération salariale 7,48%)
  // Non-marchand: ≈ 32,40% (réduction via Maribel social)
  // Ouvriers: cotisations calculées sur brut × 108% (compensation pécule vacances)
  ONSS_DETAIL_2026:{
    // Ventilation du taux patronal 25% (secteur marchand, employés)
    base:0.1993,           // cotisation de base
    moderation:0.0507,     // modération salariale (intégrée dans 25% facial)
    total_marchand:0.25,   // = cotisation globale secteur marchand (tax-shift 2018)
    // Cotisation supplémentaire ≥ 10 travailleurs
    supp_10trav:0.0169,    // 1,60% + modération = 1,69% si ≥ 10 travailleurs
    // Non-marchand
    total_non_marchand:0.3240,
    maribel_social:0.0024, // réduction Maribel (déduit)
    // Ouvriers
    majoration_ouvrier:1.08, // brut × 108%
    vacances_annuelles_ouvrier:0.1027, // 10,27% sur brut à 108% année N-1 (payé au 30/04)
    // Cotisations spéciales patronales T1/2026
    ffe_petit:0.0032,      // Fonds fermeture < 20 trav.
    ffe_grand:0.0037,      // Fonds fermeture ≥ 20 trav.
    chomage_temp:0.0009,   // chômage temporaire T1/2026
    amiante:0.0001,        // Fonds amiante (T1-T3 2026 seulement)
    maladies_prof:0.0017,  // cotisation maladies professionnelles (Fedris)
    // Étudiants
    étudiant_patronal:0.0542, // cotisation solidarité patronale (650h/an)
    étudiant_personnel:0.0271,// cotisation solidarité personnelle
    étudiant_total:0.0813,    // total solidarité = 8,13%
    // Flexi-jobs
    flexi_patronal:0.28,   // 28% cotisation patronale spéciale
    // CSS annuelle max
    css_max_isolé:731.28,  // max annuel isolé/conjoint sans revenus
    css_max_menage:731.28, // max annuel ménage 2 revenus (identique mais retenues mensuelles différentes)
    // Provisions mensuelles: le 5 de chaque mois
    // Solde trimestriel: dernier jour du mois suivant le trimestre
  },
  ONSS_SECTEUR:{
    'default':{e:0.25,type:"marchand",note:"Taux global standard 25% (secteur marchand privé, tax-shift 2018)"},
    '124':{e:0.3838,type:"marchand",note:"Construction: 25% + intempéries 2% + congés 6% + sécurité 0.22% + timbre fidélité"},
    '302':{e:0.2816,type:"marchand",note:"Horeca: 25% + Fonds social horeca + Fonds fermeture"},
    '140':{e:0.2716,type:"marchand",note:"Transport: 25% + Fonds social + formation"},
    '330':{e:0.3240,type:"non_marchand",note:"Soins santé (non-marchand): 32,40% - Maribel social"},
    '331':{e:0.3240,type:"non_marchand",note:"Aide sociale Flandre (non-marchand): 32,40% - Maribel"},
    '332':{e:0.3240,type:"non_marchand",note:"Aide sociale CF/RW (non-marchand): 32,40% - Maribel"},
    '329':{e:0.3240,type:"non_marchand",note:"Socio-culturel (non-marchand): 32,40% - Maribel"},
    '318':{e:0.3240,type:"non_marchand",note:"Aides familiales (non-marchand): 32,40% - Maribel"},
    '319':{e:0.3240,type:"non_marchand",note:"Éducation (non-marchand): 32,40% - Maribel"},
    '322.01':{e:0.2916,type:"marchand",note:"Titres-services: 25% + fonds titres-services 4,16%"},
    '327':{e:0.3240,type:"non_marchand",note:"ETA (non-marchand): 32,40% - Maribel"},
  },
  DIMONA_TYPES:['IN',"OUT","UPDATE","CANCEL","DAILY"],
  DIMONA_WTYPES:['OTH',"STU","FLX","IVT","A17","DWD","TRI","S17","BCW","EXT"],
  DMFA_CODES:{'495':'Employé ordinaire',"015":'Ouvrier ordinaire',"487":'Dirigeant',"027":'Apprenti',"840":'Étudiant',"050":'Intérimaire'},
  FICHE_281:{'10':'Rémunérations employés/dirigeants',"13":'Pensions/rentes',"14":'Revenus remplacement',"17":'Rentes alimentaires',"18":'Rém. non-marchand',"20":'Honoraires/commissions',"30":'Jetons de présence',"50":'Revenus mobiliers'},
  SOCIAL_DOCS:{C4:'Certificat de chômage C4',C131A:'Certificat chômage temporaire',C3_2:'Carte contrôle chômage',VACATION:'Attestation de vacances',WORK_CERT:'Certificat de travail',ACCOUNT:'Compte individuel'},
  CP:{'100':'CP 100 - Auxiliaire ouvriers',"101":'CP 101 - Mines',"102":'CP 102 - Carrières',"104":'CP 104 - Sidérurgie',"105":'CP 105 - Métaux non-ferreux',"106":'CP 106 - Ciment',"107":'CP 107 - Maîtres-tailleurs',"109":'CP 109 - Habillement/Confection',"110":'CP 110 - Entretien textile',"111":'CP 111 - Métal/Mécanique/Électrique',"112":'CP 112 - Garage',"113":'CP 113 - Céramique',"114":'CP 114 - Briqueterie',"115":'CP 115 - Verrerie',"116":'CP 116 - Chimie',"117":'CP 117 - Pétrole',"118":'CP 118 - Industrie alimentaire',"119":'CP 119 - Commerce alimentaire',"120":'CP 120 - Textile/Bonneterie',"121":'CP 121 - Nettoyage',"124":'CP 124 - Construction',"125":'CP 125 - Industrie du bois',"126":'CP 126 - Ameublement',"127":'CP 127 - Commerce combustibles',"128":'CP 128 - Cuirs et peaux',"129":'CP 129 - Pâtes/Papiers/Cartons',"130":'CP 130 - Imprimerie/Arts graphiques',"132":'CP 132 - Travaux techniques agricoles',"133":'CP 133 - Tabacs',"136":'CP 136 - Transformation papier/carton',"139":'CP 139 - Batellerie',"140":'CP 140 - Transport',"142":'CP 142 - Récupération matières premières',"143":'CP 143 - Pêche maritime',"144":'CP 144 - Agriculture',"145":'CP 145 - Horticulture',"146":'CP 146 - Entreprises forestières',"147":'CP 147 - Armurerie',"148":'CP 148 - Fourrure/Peau en poil',"149":'CP 149 - Secteurs connexes métal',"149.01":'CP 149.01 - Électriciens installation',"149.02":'CP 149.02 - Carrosserie',"149.03":'CP 149.03 - Métaux précieux',"149.04":'CP 149.04 - Commerce du métal',"150":'CP 150 - Poterie',"152":'CP 152 - Enseignement libre',"200":'CP 200 - Auxiliaire employés',"201":'CP 201 - Commerce de détail indépendant',"202":'CP 202 - Commerce détail alimentaire',"203":'CP 203 - Carrières petit granit (empl.)',"204":'CP 204 - Carrières porphyre (empl.)',"205":'CP 205 - Charbonnages (empl.)',"207":'CP 207 - Industrie chimique (empl.)',"209":'CP 209 - Fabrications métalliques (empl.)',"210":'CP 210 - Sidérurgie (empl.)',"211":'CP 211 - Pétrole (empl.)',"214":'CP 214 - Textile/Bonneterie (empl.)',"215":'CP 215 - Habillement/Confection (empl.)',"216":'CP 216 - Notaires (empl.)',"217":'CP 217 - Casino (empl.)',"218":'CP 218 - CNT auxiliaire employés',"219":'CP 219 - Organismes contrôle agréés',"220":'CP 220 - Industrie alimentaire (empl.)',"221":'CP 221 - Industrie papetière (empl.)',"222":'CP 222 - Transformation papier/carton (empl.)',"223":'CP 223 - Sports',"224":'CP 224 - Métaux non-ferreux (empl.)',"225":'CP 225 - Enseignement libre (empl.)',"226":'CP 226 - Commerce international/Transport',"227":'CP 227 - Secteur audio-visuel',"301":'CP 301 - Ports',"302":'CP 302 - Hôtellerie',"303":'CP 303 - Cinématographie',"304":'CP 304 - Spectacle',"306":'CP 306 - Assurances',"307":'CP 307 - Courtage assurances',"308":'CP 308 - Prêts hypothécaires',"309":'CP 309 - Sociétés de bourse',"310":'CP 310 - Banques',"311":'CP 311 - Grandes surfaces',"312":'CP 312 - Grands magasins',"313":'CP 313 - Pharmacies',"314":'CP 314 - Coiffure/Soins de beauté',"315":'CP 315 - Aviation commerciale',"316":'CP 316 - Marine marchande',"317":'CP 317 - Gardiennage',"318":'CP 318 - Aides familiales/seniors',"319":'CP 319 - Éducation/Hébergement',"320":'CP 320 - Pompes funèbres',"321":'CP 321 - Grossistes médicaments',"322":'CP 322 - Intérimaire/Titres-services',"322.01":'CP 322.01 - Titres-services',"323":'CP 323 - Gestion immeubles/Domestiques',"324":'CP 324 - Diamant',"325":'CP 325 - Institutions publiques crédit',"326":'CP 326 - Gaz/Électricité',"327":'CP 327 - Travail adapté/Ateliers sociaux',"328":'CP 328 - Transport urbain/régional',"329":'CP 329 - Socio-culturel',"330":'CP 330 - Santé',"331":'CP 331 - Aide sociale (Flandre)',"332":'CP 332 - Aide sociale (francophone)',"333":'CP 333 - Attractions touristiques',"336":'CP 336 - Professions libérales'},
  REDUCTIONS:{base:157.29,married1:258.33,children:[0,52.50,141.67,318.33,514.17,618.33],childX:618.33,handicap:52.50,isolated:52.50},
  // ── Cotisation Spéciale Sécurité Sociale — retenue MENSUELLE (provisions) ──
  // Source: socialsecurity.be/employer/instructions/dmfa + montants-socio-juridiques
  // Basée sur la rémunération TRIMESTRIELLE, retenue mensuellement = 1/3 du montant trimestriel
  // ISOLÉ / conjoint SANS revenus prof. (barème 1)
  CSS_SINGLE:[
    {f:0,t:1945.38,a:0},                              // T <= 5836.14: 0€
    {f:1945.39,t:2190.18,p:.076,b:1945.38},            // 5836.14 < T <= 6570.54: 7,6% tranche, min 0€
    {f:2190.19,t:6038.82,a:18.60,p2:0.011,b2:2190.18,max:60.94}, // 6570.54 < T <= 18116.46: 18.60 + 1,1% tranche, max 60.94€/mois
    {f:6038.83,t:Infinity,a:60.94}                     // T > 18116.46: 60.94€/mois (182.82€/trim)
  ],
  // MÉNAGE 2 REVENUS (conjoint a aussi des revenus prof.) (barème 2)
  CSS_MARRIED:[
    {f:0,t:1945.38,a:0},                              // T <= 5836.14: 0€
    {f:1945.39,t:2190.18,p:.076,b:1945.38,min:9.30},  // 5836.14 < T <= 6570.54: 7,6% tranche, min 9.30€/mois
    {f:2190.19,t:6038.82,a:18.60,p2:0.011,b2:2190.18,max:51.64}, // 6570.54 < T <= 18116.46: 18.60 + 1,1% tranche, max 51.64€/mois
    {f:6038.83,t:Infinity,a:51.64}                     // T > 18116.46: 51.64€/mois (154.92€/trim)
  ],
  // ── SOURCES OFFICIELLES À SURVEILLER ──
  SOURCES_VEILLE:{
    federal:[
      {nom:"ONSS",url:"onss.be",desc:"Instructions trimestrielles, cotisations, DmfA"},
      {nom:"SPF Finances",url:"finances.belgium.be",desc:"Barèmes PP, Annexe III, circulaires fiscales"},
      {nom:"Fisconetplus",url:"eservices.minfin.fgov.be/fisconetplus",desc:"Base de données fiscales — circulaires, rulings, addenda PP"},
      {nom:"SPF Emploi",url:"emploi.belgique.be",desc:"Droit du travail, réglementation, CCT"},
      {nom:"Moniteur belge",url:"ejustice.just.fgov.be",desc:"Publication officielle lois, AR, CCT rendues obligatoires"},
      {nom:"CNT",url:"cnt-nar.be",desc:"CCT interprofessionnelles, avis"},
      {nom:"ONEM",url:"onem.be",desc:"Chômage, crédit-temps, interruption carrière"},
      {nom:"INAMI",url:"inami.fgov.be",desc:"Assurance maladie-invalidité, incapacité de travail"},
      {nom:"SFP/MyPension",url:"sfpd.fgov.be",desc:"Pensions, Wijninckx, DB2P"},
      {nom:"Sigedis/DB2P",url:"sigedis.be",desc:"Pensions complémentaires, base de données 2ème pilier"},
      {nom:"Fedris",url:"fedris.be",desc:"Accidents du travail, maladies professionnelles, tarification AT"},
      {nom:"ONVA",url:"onva.be",desc:"Vacances annuelles ouvriers, pécules, taux 10,27%"},
      {nom:"BCSS/KSZ",url:"ksz-bcss.fgov.be",desc:"Banque Carrefour SS, flux DRS, formulaires électroniques"},
      {nom:"CAPAC",url:"capac.fgov.be",desc:"Allocations chômage, formulaires C4, chômage temporaire"},
      {nom:"INASTI",url:"inasti.be",desc:"Cotisations indépendants, statut mixte dirigeants"},
      {nom:"SPF Économie",url:"économie.fgov.be",desc:"Index santé, indices prix, index-pivot"},
      {nom:"Statbel",url:"statbel.fgov.be",desc:"Statistiques emploi, enquêtes structure salaires"},
      {nom:"BNB",url:"nbb.be",desc:"Bilan social, centrale des bilans, données macro"},
      {nom:"BCE",url:"kbo-bce-search.économie.fgov.be",desc:"Registre entreprises, NACE, données sociétés"},
      {nom:"FLA",url:"federallearningaccount.be",desc:"Federal Learning Account — obligation formation employeurs"},
      {nom:"Belcotax",url:"belcotaxonweb.be",desc:"Fiches fiscales 281.xx"},
      {nom:"Chambre/Sénat",url:"lachambre.be",desc:"Projets de loi EN COURS — alertes précoces"},
    ],
    regional:[
      {nom:"Actiris",url:"actiris.brussels",desc:"Bruxelles — aides emploi, Activa, réductions groupes-cibles"},
      {nom:"FOREM",url:"forem.be",desc:"Wallonie — aides emploi, Impulsion, sesam"},
      {nom:"VDAB",url:"vdab.be",desc:"Flandre — aides emploi, doelgroepverminderingen"},
    ],
    secsoc:[
      {nom:"Veille sectorielle",url:"socialsecurity.be",desc:"Alertes législatives, montants socio-juridiques, analyses"},
      {nom:"Analyses juridiques",url:"emploi.belgique.be",desc:"Analyses juridiques, guides pratiques"},
      {nom:"Acerta",url:"acerta.be",desc:"Juricible, publications juridiques, simulations"},
      {nom:"Liantis",url:"liantis.be",desc:"Actualités sociales, guides PME"},
      {nom:"UCM",url:"ucm.be",desc:"Union Classes Moyennes, analyses PME, cotisations"},
      {nom:"Groupe S",url:"groups.be",desc:"Secrétariat social, analyses sectorielles"},
    ],
    juridique:[
      {nom:"Droitbelge.be",url:"droitbelge.be",desc:"Jurisprudence, doctrine, fiches pratiques"},
      {nom:"SocialEye (Wolters Kluwer)",url:"wolterskluwer.com/fr-be",desc:"Base juridique sociale complète"},
      {nom:"Socialsecurity.be",url:"socialsecurity.be",desc:"Portail central SS — instructions ONSS, manuels admin"},
      {nom:"Salaires minimums",url:"salairesminimums.be",desc:"Barèmes sectoriels indexés par CP"},
    ],
  },
};

function calc(emp, per, co) {
  const r = {};
  const hr = (emp.monthlySalary||0) / (LEGAL.WD * LEGAL.WHD);
  r.base = emp.monthlySalary || 0;
  r.overtime = (per.overtimeH||0) * hr * 1.5;
  r.sunday = (per.sundayH||0) * hr * 2;
  r.night = (per.nightH||0) * hr * 1.25;
  r.bonus = per.bonus || 0;
  r.y13 = per.y13 || 0;
  r.sickPay = (per.sickG||0) * (r.base / LEGAL.WD);
  r.gross = r.base + r.overtime + r.sunday + r.night + r.bonus + r.y13 + r.sickPay;

  // ── HEURES SUP VOLONTAIRES BRUT=NET (Nouveau régime 01/04/2026 + Relance T1) ──
  // 360h/an (450h horeca), dont 240h (360h horeca) exonérées ONSS+PP = brut=net
  // Pas de sursalaire, pas de repos compensatoire. Accord écrit 1 an.
  // Heures relance (T1/2026 transitoire): 120h brut=net, déduites du quota 240h
  r.hsVolontBrutNet = (per.hsVolontBrutNet||0) * hr; // montant brut=net (pas de sursalaire)
  r.hsRelance = (per.hsRelance||0) * hr;
  r.hsBrutNetTotal = r.hsVolontBrutNet + r.hsRelance; // total brut=net (non soumis ONSS/PP)

  // ── MI-TEMPS MÉDICAL / REPRISE PROGRESSIVE (Art. 100§2 Loi coord. 14/07/1994) ──
  // Le travailleur reconnu en incapacité par le médecin-conseil de la mutuelle
  // reprend le travail à temps partiel avec l'accord du médecin du travail.
  //
  // Mécanisme:
  //   1. L'employeur paie le salaire PROPORTIONNEL aux heures prestées
  //   2. L'INAMI (mutuelle) verse un COMPLÉMENT d'indemnités au travailleur
  //   3. Le complément INAMI = 60% du brut normal × (heures non prestées / heures normales)
  //      mais plafonné et avec règle de cumul (max 20% de perte par rapport à avant l'incapacité)
  //
  // Impact sur la fiche de paie:
  //   - Brut = prorata des heures prestées (pas le brut normal!)
  //   - ONSS = calculé sur le brut prorata (pas sur le brut normal)
  //   - PP = calculé sur le brut prorata (barème temps partiel)
  //   - L'indemnité INAMI est hors fiche de paie (versée directement par la mutuelle)
  //   - Mention "pour mémoire" du complément INAMI sur la fiche
  //
  // Formulaires:
  //   - C3.2: déclaration de reprise au médecin-conseil
  //   - E10: évaluation médecin du travail (formulaire de réintégration)
  //   - DRS (eBox): déclaration reprise du travail à la mutuelle
  //
  // Durée: illimitée (aussi longtemps que le médecin-conseil autorise)
  // ONSS: sur brut prorata uniquement
  // PP: barème proportionnel temps partiel (fraction d'occupation)
  r.miTempsMed = per.miTempsMed || false;
  r.miTempsHeures = per.miTempsHeures || 0;
  r.miTempsFraction = 1; // fraction d'occupation
  r.miTempsINAMI = per.miTempsINAMI || 0;
  r.miTempsBrutOriginal = r.base; // brut avant prorata

  if (r.miTempsMed && r.miTempsHeures > 0 && (emp.whWeek || 38) > 0) {
    r.miTempsFraction = r.miTempsHeures / (emp.whWeek || 38);
    // Recalculér le brut au prorata des heures prestées
    r.base = Math.round((emp.monthlySalary || 0) * r.miTempsFraction * 100) / 100;
    // Recalculér les composantés proportionnelles
    r.sickPay = (per.sickG || 0) * (r.base / LEGAL.WD);
    r.gross = r.base + r.overtime + r.sunday + r.night + r.bonus + r.y13 + r.sickPay;
    // Estimation du complément INAMI si pas renseigné
    // Règle: 60% du brut limité (plafonné à ≈ 106,16€/j en 2026) × fraction non prestée
    if (r.miTempsINAMI === 0) {
      const brutJourNormal = (emp.monthlySalary || 0) / LEGAL.WD;
      const plafondINAMI = 106.16; // plafond journalier INAMI 2026 (adapté)
      const brutJourPlafonne = Math.min(brutJourNormal, plafondINAMI);
      const tauxINAMI = 0.60; // 60% (cohabitant) — peut être 65% (chef de famille) ou 55% (isolé)
      r.miTempsINAMI = Math.round(brutJourPlafonne * tauxINAMI * LEGAL.WD * (1 - r.miTempsFraction) * 100) / 100;
    }
  }

  // ── ATN Voiture de société (Art. 36 CIR 92) ──
  r.atnCar = 0; r.atnPct = 0; r.cotCO2 = 0;
  const carFuel = emp.carFuel || 'none';
  const carCO2 = parseInt(emp.carCO2) || 0;
  const carCatVal = parseFloat(emp.carCatVal) || 0;
  if (carFuel !== 'none' && carCatVal > 0) {
    if (carFuel === 'electrique') {
      r.atnPct = 4;
      r.atnCar = Math.max(1600/12, (carCatVal * (6/7) * 0.04) / 12);
      r.cotCO2 = 31.34; // minimum
    } else {
      const refCO2 = (carFuel === 'diesel') ? 84 : 102;
      const delta = carCO2 - refCO2;
      r.atnPct = Math.max(4, Math.min(18, 5.5 + (delta * 0.1)));
      r.atnCar = Math.max(1600/12, (carCatVal * (6/7) * (r.atnPct/100)) / 12);
      // Cotisation CO2 patronale (solidarité ONSS)
      if (carFuel === 'diesel') r.cotCO2 = Math.max(31.34, (carCO2 * 0.00714 * 71.4644) + 31.34);
      else r.cotCO2 = Math.max(31.34, (carCO2 * 0.00714 * 83.6644) + 31.34);
    }
  }

  // ── ATN Autres avantages en nature (AR 18/12/2024 — Forfaits 2026) ──
  r.atnGSM = emp.atnGSM ? 3.00 : 0;         // 36€/an = 3€/mois
  r.atnPC = emp.atnPC ? 6.00 : 0;            // 72€/an = 6€/mois
  r.atnInternet = emp.atnInternet ? 5.00 : 0; // 60€/an = 5€/mois
  r.atnChauffage = emp.atnChauffage ? 177.50 : 0; // 2.130€/an = 177,50€/mois
  r.atnElec = emp.atnElec ? 88.33 : 0;       // 1.060€/an = 88,33€/mois
  // ATN Logement gratuit (Art. 18 AR/CIR92 — Forfaits 2026)
  // Non-dirigeant: forfait fixe = RC indexé × 100/60
  // Dirigeant (statut=dirigeant): RC indexé × 100/60 × 3,80 (coeff. dirigeant)
  // Coefficient indexation RC 2026: 2,1763 (exercice d'imposition 2027)
  // Si meublé: + 5/3 du montant
  r.atnLogement = 0;
  if (emp.atnLogement && parseFloat(emp.atnLogementRC) > 0) {
    const rc = parseFloat(emp.atnLogementRC);
    const rcIndex = rc * 2.1763; // RC indexé 2026
    const isDirigeant = (emp.statut === 'dirigeant');
    if (isDirigeant) {
      // Dirigeant: RC indexé × 100/60 × coeff. 3,80 (si RC > 745€) ou × 1,25 (si RC ≤ 745€)
      r.atnLogement = rc <= 745
        ? (rcIndex * 100 / 60 * 1.25) / 12
        : (rcIndex * 100 / 60 * 3.80) / 12;
    } else {
      // Non-dirigeant: forfait fixe par RC non indexé
      r.atnLogement = (rcIndex * 100 / 60) / 12;
    }
  }
  r.atnAutresTot = r.atnGSM + r.atnPC + r.atnInternet + r.atnChauffage + r.atnElec + r.atnLogement;
  r.atnTotal = r.atnCar + r.atnAutresTot;

  // ── VÉLO DE SOCIÉTÉ (Loi 25/11/2021 + Art. 38§1er 14°a CIR 92) ──
  // Depuis 01/01/2024: l'ATN vélo de société = 0€ (exonéré IPP et ONSS)
  // Conditions: usage effectif pour déplacements domicile-travail (même partiel)
  // L'employeur supporte le coût du leasing (deductible 100%)
  // Types: vélo classique, vélo électrique (≤25km/h), speed pedelec (≤45km/h)
  // CUMULABLE avec l'indemnité vélo 0,27€/km (pour les km effectivement parcourus)
  // Le speed pedelec est fiscalement assimilé à un vélo (pas une moto)
  r.veloSociete = emp.veloSociete || false;
  r.veloType = emp.veloType || 'none';
  r.atnVelo = 0; // ATN = 0€ depuis 01/01/2024 (exonéré)
  r.veloLeasingMois = emp.veloLeasingMois || 0; // coût employeur
  r.veloValeur = emp.veloValeur || 0;

  // Indemnité vélo cumulable: 0,27€/km A/R même avec vélo de société
  // → déjà calculée dans r.transport si commType === 'bike'

  // ── CARTE CARBURANT / RECHARGE (Art. 36§2 CIR 92) ──
  // La carte carburant liée à une voiture de société est incluse dans l'ATN voiture
  // (pas d'ATN séparé) SAUF si la carte permet un usage privé illimité:
  //   → L'ATN voiture couvre déjà les frais de carburant
  //   → Si carte carburant SANS voiture de société = avantage imposable à 100%
  r.carteCarburant = emp.carteCarburant || false;
  r.carteCarburantMois = emp.carteCarburantMois || 0;
  // Si pas de voiture de société mais carte carburant → ATN = montant total
  r.atnCarteCarburant = (r.carteCarburant && !r.atnCar) ? r.carteCarburantMois : 0;
  // Si voiture de société + carte carburant → inclus dans ATN voiture (pas d'ATN supplémentaire)

  // ── BORNE DE RECHARGE DOMICILE (Art. 14536 CIR 92 + Loi 25/11/2021) ──
  // L'employeur peut installer une borne de recharge au domicile du travailleur
  // Pas d'ATN pour le travailleur si la borne sert à recharger la voiture de société
  // L'employeur déduit le coût à 100% (si borne intelligente bidirectionnelle)
  // L'électricité de recharge pour usage privé: ATN = coût réel ou forfait
  r.borneRecharge = emp.borneRecharge || false;
  r.borneRechargeCout = emp.borneRechargeCout || 0;
  // ATN borne: 0€ si voiture de société (fait partie du package)
  // ATN borne: coût réel si pas de voiture de société
  r.atnBorne = (r.borneRecharge && !r.atnCar) ? r.borneRechargeCout : 0;

  // Ajouter aux ATN autres si applicable
  r.atnAutresTot += r.atnCarteCarburant + r.atnBorne;
  r.atnTotal = r.atnCar + r.atnAutresTot;

  // ── ONSS Travailleur ──
  const isOuvrier = (emp.statut === 'ouvrier');
  const onssBase = isOuvrier ? r.gross * LEGAL.ONSS_DETAIL_2026.majoration_ouvrier : r.gross;
  r.onssW = onssBase * LEGAL.ONSS_W;
  // ── Bonus à l'emploi 2026 — Volet A (bas salaires) + Volet B (très bas salaires) ──
  // Source: Instructions ONSS T1/2026
  const BE = LEGAL.BONUS_2026;
  r.empBonusA = 0; r.empBonusB = 0;
  if (isOuvrier) {
    // Ouvrier (déclaré à 108%)
    if (r.gross * 1.08 <= BE.O_A_S2) r.empBonusA = BE.O_A_MAX;
    else if (r.gross * 1.08 <= BE.O_A_S1) r.empBonusA = Math.max(0, BE.O_A_MAX - BE.O_A_COEFF * (r.gross * 1.08 - BE.O_A_S2));
    if (r.gross * 1.08 <= BE.O_B_S2) r.empBonusB = BE.O_B_MAX;
    else if (r.gross * 1.08 <= BE.O_B_S1) r.empBonusB = Math.max(0, BE.O_B_MAX - BE.O_B_COEFF * (r.gross * 1.08 - BE.O_B_S2));
  } else {
    // Employé (déclaré à 100%)
    if (r.gross <= BE.A_S2) r.empBonusA = BE.A_MAX;
    else if (r.gross <= BE.A_S1) r.empBonusA = Math.max(0, BE.A_MAX - BE.A_COEFF * (r.gross - BE.A_S2));
    if (r.gross <= BE.B_S2) r.empBonusB = BE.B_MAX;
    else if (r.gross <= BE.B_S1) r.empBonusB = Math.max(0, BE.B_MAX - BE.B_COEFF * (r.gross - BE.B_S2));
  }
  r.empBonus = Math.min(r.empBonusA + r.empBonusB, r.onssW); // ne peut dépasser cotisation perso
  r.onssNet = r.onssW - r.empBonus;

  // ── ONSS Employeur ──
  const sectInfo = LEGAL.ONSS_SECTEUR[emp.cp] || LEGAL.ONSS_SECTEUR['default'];
  r.onssE_rate = sectInfo.e;
  r.onssE = onssBase * sectInfo.e;
  r.onssE_note = sectInfo.note;
  r.onssE_type = sectInfo.type || 'marchand';
  // Cotisations spéciales patronales
  r.onss_ffe = onssBase * (emp.staffCount >= 20 ? LEGAL.ONSS_DETAIL_2026.ffe_grand : LEGAL.ONSS_DETAIL_2026.ffe_petit);
  r.onss_chomTemp = onssBase * LEGAL.ONSS_DETAIL_2026.chomage_temp;
  r.onss_amiante = onssBase * LEGAL.ONSS_DETAIL_2026.amiante;

  // ── Réduction structurelle ONSS T1/2026 ──
  // Formule: Ps = R × µ × (J/D) — R = F + α(S0-S) + γ(S2-S) + δ(W-S1)
  // S = salaire trimestriel de référence, W = salaire trimestriel réel
  // Source: ONSS Instructions administratives + Easypay Group 09/01/2026
  const RS = LEGAL.RED_STRUCT_2026;
  const salTrim = r.gross * 3; // salaire trimestriel
  const salRef = salTrim; // temps plein = salaire réel (proratisé si TP partiel)
  // Fraction de prestation (µ) — Art. 353bis/5 Loi-programme 24/12/2002
  // Temps partiel: fraction = heures prestées / heures temps plein
  const fractionPrest = emp.regime === 'full' ? 1 : (emp.whWeek || 38) / 38;
  r.redStructCat = r.onssE_type === 'non-marchand' ? 2 :
    (emp.statut === 'eta' ? 3 : (emp.statut === 'eta_handi' ? 4 : 1));
  // cat 1=marchand, 2=non-marchand, 3=ETA, 4=ETA handicape
  let redR = 0;
  if (r.redStructCat === 1) {
    // Catégorie 1: secteur marchand privé
    const compBas = salRef < RS.CAT1_S0 ? RS.CAT1_alpha * (RS.CAT1_S0 - salRef) : 0;
    const compTBas = salRef < RS.CAT1_S2 ? RS.CAT1_gamma * (RS.CAT1_S2 - salRef) : 0;
    redR = RS.CAT1_F + compBas + compTBas;
  } else if (r.redStructCat === 2) {
    // Catégorie 2: Maribel social / non-marchand
    const compBas = salRef < RS.CAT2_S0 ? RS.CAT2_alpha * (RS.CAT2_S0 - salRef) : 0;
    const compTBas = salRef < RS.CAT2_S2 ? RS.CAT2_gamma * (RS.CAT2_S2 - salRef) : 0;
    const compHaut = salRef > RS.CAT2_S1 ? RS.CAT2_delta * (salRef - RS.CAT2_S1) : 0;
    redR = RS.CAT2_F + compBas + compTBas + compHaut;
  } else if (r.redStructCat === 3) {
    // Catégorie 3: Entreprises de travail adapté (ETA)
    const compBas = salRef < RS.CAT3_S0 ? RS.CAT3_alpha * (RS.CAT3_S0 - salRef) : 0;
    const compTBas = salRef < RS.CAT3_S2 ? RS.CAT3_gamma * (RS.CAT3_S2 - salRef) : 0;
    redR = RS.CAT3_F + compBas + compTBas;
  } else if (r.redStructCat === 4) {
    // Catégorie 3bis: ETA travailleurs moins valides
    const compBas = salRef < RS.CAT3B_S0 ? RS.CAT3B_alpha * (RS.CAT3B_S0 - salRef) : 0;
    const compTBas = salRef < RS.CAT3B_gamma ? RS.CAT3B_gamma * (RS.CAT3B_S2 - salRef) : 0;
    redR = RS.CAT3B_F + compBas + compTBas;
  }
  // Appliquer la fraction de prestation (temps partiel)
  redR = Math.max(0, redR * fractionPrest);
  // Plancher: la réduction ne peut pas être négative
  // Plafond: la réduction ne peut pas excéder les cotisations patronales dues
  r.redStruct = Math.min(redR, r.onssE * 3); // montant trimestriel de réduction (plafonné)
  r.redStructMois = Math.round(r.redStruct / 3 * 100) / 100; // mensualisé
  r.redStructFraction = fractionPrest;
  // Appliquer réduction sur cotisation patronale effective
  r.onssE = Math.max(0, r.onssE - r.redStructMois);

  // ATN ajouté au revenu imposable (pas à l'ONSS, pas au brut payé)
  r.taxGross = r.gross - r.onssNet + r.atnCar + r.atnAutresTot;

  // ── TRAVAILLEUR FRONTALIER / TRANSFRONTALIER ──
  // Règlement (CE) 883/2004 + Conventions bilatérales CPDI
  //
  // PRINCIPE ONSS (Art. 11-16 Règl. 883/2004):
  //   → Lieu de TRAVAIL détermine le pays ONSS (lex loci laboris)
  //   → Travaille en Belgique = ONSS belge, même si réside en FR/NL/DE/LU
  //   → Exception: télétravail frontalier > 25% → accord cadre multi-État
  //
  // PRINCIPE PP / IMPÔT (Conventions préventives double imposition):
  //
  // 1. BELGIQUE ↔ FRANCE (Convention 10/03/1964 + Avenants):
  //   - Ancien régime frontalier (abrogé 01/01/2012): le frontalier FR travaillant
  //     en BE payait l'impôt en France → exonération PP en Belgique
  //   - RÉGIME ACTUEL: PP retenu en Belgique (pays de travail)
  //     Le travailleur FR déclare en France mais obtient un crédit d'impôt
  //     pour l'impôt belge payé (Art. 15 + Art. 19 Convention)
  //   - Formulaire 276 Front.: attestation de résidence fiscale française
  //
  // 2. BELGIQUE ↔ PAYS-BAS (Convention 05/06/2001):
  //   - PP retenu en Belgique. Le travailleur NL déclare aux Pays-Bas
  //     avec crédit d'impôt belge (méthode exemption avec progression)
  //   - Depuis 2003: plus de régime frontalier spécial
  //   - Le NL résident peut opter pour "kwalificerend buitenlands belastingplichtige"
  //
  // 3. BELGIQUE ↔ ALLEMAGNE (Convention 11/04/1967 + Protocole 2002):
  //   - PP retenu en Belgique. Crédit d'impôt en Allemagne.
  //   - Pas de régime frontalier spécial
  //
  // 4. BELGIQUE ↔ LUXEMBOURG (Convention 17/09/1970):
  //   - PP retenu en Belgique pour travail presté en Belgique
  //   - Particularité: règle des 24 jours de tolérance (accord amiable 2015)
  //     → max 24j/an de télétravail depuis le Luxembourg sans changer l'imposition
  //
  // IMPACT SUR LE CALCUL:
  //   - ONSS: toujours belge si le travail est presté en Belgique
  //   - PP: normalement retenu en Belgique (pas d'exonération)
  //   - Exception rare: exonération PP si formulaire 276 Front. + ancien régime FR
  //   - Formulaire A1: obligatoire pour les détachements > 1 pays
  //   - Limosa: déclaration obligatoire pour travailleurs détachés VERS la Belgique
  //
  r.frontalier = emp.frontalier || false;
  r.frontalierPays = emp.frontalierPays || '';
  r.frontalierExoPP = emp.frontalierExoPP || false;

  if (r.frontalier) {
    // ONSS: toujours belge (lex loci laboris) — pas de changement
    // PP: normalement retenu en Belgique
    // Si exonération PP (ancien régime FR pré-2012 — cas résiduel très rare):
    if (r.frontalierExoPP) {
      r.frontalierPPExo = r.tax; // montant PP qui serait retenu
      // r.tax reste calculé normalement pour info mais n\'est pas retenu
      // → c\'est au travailleur de déclarer dans son pays de résidence
    }
    // Le travailleur frontalier a droit aux mêmes avantages sociaux belges
    // (chèques-repas, transport, etc.) puisqu\'il travaille en Belgique
  }

  // ── TRAVAILLEUR PENSIONNÉ — CUMUL PENSION / TRAVAIL ──
  // Réforme majeure: depuis 01/01/2015, cumul ILLIMITÉ pour:
  //   - Pension légale de retraite (pas anticipée) à l'âge légal (66 ans en 2026, 67 en 2030)
  //   - Pension anticipée après 45 ans de carrière
  //   - Pension de survie si le bénéficiaire a ≥ 65 ans
  //
  // Plafonds de cumul (si cumul LIMITÉ — AR 20/12/2006 + index):
  //   - Pension anticipée < 65 ans (salarié):
  //     Sans enfant à charge: 10.613€/an brut (2026)
  //     Avec enfant à charge: 13.266€/an brut (2026)
  //   - Pension de survie < 65 ans:
  //     Sans enfant à charge: 22.509€/an brut (2026)
  //     Avec enfant à charge: 28.136€/an brut (2026)
  //   → En cas de dépassement: pension réduite du % de dépassement (Art. 64 AR 21/12/1967)
  //
  // IMPACT ONSS:
  //   - Cotisation patronale: normale (pas de réduction spéciale)
  //   - Cotisation travailleur: cotisation de solidarité 0% (pas d'ONSS perso)
  //     si pension + revenu > plafond → retenue normale 13,07%
  //   → EN PRATIQUE: ONSS normal 13,07% s\'applique (la solidarité est passée)
  //   → Le pensionne n\'est PLUS exonéré d'ONSS travailleur depuis 2024
  //
  // IMPACT PP:
  //   - Barème normal\'appliqué (même formule-clé)
  //   - MAIS: quotité exemptée peut être différente si le pensionne
  //     cumule pension + revenu → art. 154bis CIR
  //   - La pension elle-même est imposée séparément par le SFP (précompte pension)
  //
  // FLEXI-JOB PENSIONNÉ:
  //   - Plafond 12.000€/an NE s\'applique PAS aux pensionnes → cumul illimité
  //   - C'est le principal avantage du statut pensionne pour les flexi-jobs
  //
  // COTISATION SPÉCIALE 1,5% (solidarité pensionne):
  //   - Si le pensionne gagne > plafond, cotisation spéciale de solidarité
  //   - Retenue par l\'employeur et versée à l'ONSS
  //   - Art. 68 Loi 30/03/1994
  //
  // SIGEDIS / SFP: l\'employeur déclare les revenus via DmfA.
  //   Le SFP (Service fédéral des Pensions) vérifie le cumul automatiquement.

  r.pensionne = emp.pensionne || false;
  r.pensionType = emp.pensionType || 'none';
  r.pensionCumulIllimite = emp.pensionCumulIllimite || false;
  r.pensionPlafond = 0;
  r.pensionDepassement = false;

  if (r.pensionne) {
    const age = emp.pensionAge || 0;
    const carriere = emp.pensionCarriere || 0;
    const depEnfants = emp.depChildren > 0;

    // Déterminer si cumul illimité
    if (r.pensionType === 'légal' && age >= 66) {
      r.pensionCumulIllimite = true; // Âge légal atteint (66 en 2026)
    }
    if (r.pensionType === 'anticipee' && carriere >= 45) {
      r.pensionCumulIllimite = true; // 45 ans de carrière
    }
    if (r.pensionType === 'survie' && age >= 65) {
      r.pensionCumulIllimite = true;
    }

    if (!r.pensionCumulIllimite) {
      // Plafonds de cumul annuels (indexés 2026)
      if (r.pensionType === 'anticipee') {
        r.pensionPlafond = depEnfants ? 13266 : 10613;
      } else if (r.pensionType === 'survie') {
        r.pensionPlafond = depEnfants ? 28136 : 22509;
      }
      // Vérifier si dépassement estimé
      const revenuAnnuelEstime = r.gross * 12;
      if (r.pensionPlafond > 0 && revenuAnnuelEstime > r.pensionPlafond) {
        r.pensionDepassement = true;
        r.pensionDepassPct = Math.round((revenuAnnuelEstime - r.pensionPlafond) / r.pensionPlafond * 100);
      }
    }

    // Cotisation spéciale solidarité pensionne (Art. 68 Loi 30/03/1994)
    // Si le total pension + revenus activité > seuil → retenue 0% à 2%
    // En pratique: déjà incluse dans les cotisations ONSS standard
    // Le SFP vérifie a posteriori via DmfA/SIGEDIS

    // ONSS: normal (13,07% trav + taux patronal sectoriel)
    // Pas de changement dans le calcul — tout est standard
  }

  // ── PRÉCOMPTE PROFESSIONNEL 2026 — FORMULE-CLÉ COMPLÈTE SPF FINANCES ──
  // Annexe III AR/CIR 92 — Moniteur belge — Tranches annuelles
  const PP = LEGAL.PP2026;
  const annualGross = r.taxGross * 12;

  // Étape 1: Frais professionnels forfaitaires (30%, max 5 930 €)
  const isSalarie = (emp.regime !== 'dirigeant');
  const fpPct = isSalarie ? PP.FP_PCT : PP.FP_DIR_PCT;
  const fpMax = isSalarie ? PP.FP_MAX : PP.FP_DIR_MAX;
  r.profExp_annual = Math.min(annualGross * fpPct, fpMax);
  r.profExp = r.profExp_annual / 12;

  // Étape 2: Revenu annuel net imposable
  const revNetImposable = annualGross - r.profExp_annual;

  // Étape 3: Barème 1 (isolé) ou Barème 2 (quotient conjugal)
  const isBareme2 = (emp.civil === 'married_1'); // conjoint sans revenus
  let revPrincipal = revNetImposable;
  let revConjoint = 0;
  if (isBareme2) {
    revConjoint = Math.min(revNetImposable * PP.QC_PCT, PP.QC_MAX);
    revPrincipal = revNetImposable - revConjoint;
  }

  // Étape 4: Calcul impôt progressif annuel (sur revenu principal)
  const calcImpotAnnuel = (rev) => {
    let impot = 0; let reste = Math.max(0, rev);
    let prev = 0;
    for (const tr of PP.TRANCHES) {
      const tranche = Math.min(reste, tr.lim - prev);
      impot += tranche * tr.rate;
      reste -= tranche;
      prev = tr.lim;
      if (reste <= 0) break;
    }
    return impot;
  };

  let impotAnnuel = calcImpotAnnuel(revPrincipal);
  if (isBareme2 && revConjoint > 0) {
    impotAnnuel += calcImpotAnnuel(revConjoint);
  }

  // Étape 5: Déduction quotité exemptée d'impôt
  const quotiteExempt = PP.EXEMPT * (isBareme2 ? 2 : 1);
  const reductionExempt = calcImpotAnnuel(quotiteExempt);
  impotAnnuel -= reductionExempt;

  // Étape 6: Réductions annuelles charges de famille
  let redFam = 0;
  const ch = emp.depChildren || 0;
  if (ch > 0 && ch <= 5) redFam += PP.RED.enfants[ch];
  else if (ch > 5) redFam += PP.RED.enfants[5] + (ch - 5) * PP.RED.enfantX;
  if (emp.handiChildren > 0) redFam += emp.handiChildren * PP.RED.handicap;
  if (emp.civil === 'single' && ch === 0) redFam += PP.RED.isolée;
  if ((emp.civil === 'single' || emp.civil === 'widowed') && ch > 0) redFam += PP.RED.veuf_enfant;
  // Ascendants ≥ 65 ans à charge (Art. 132 CIR 92 — revenus nets < 3.820€)
  const depAsc = emp.depAscendant || 0;
  const depAscHandi = emp.depAscendantHandi || 0;
  if (depAsc > 0) redFam += depAsc * PP.RED.ascendant65;
  if (depAscHandi > 0) redFam += depAscHandi * PP.RED.ascendant65_handi;
  // Conjoint handicape (Art. 132 CIR — supplément quotité exemptée)
  if (emp.conjointHandicap) redFam += PP.RED.handicap;
  // Autres personnes à charge (Art. 136 CIR — max 3.820€ revenus nets)
  const depAutres = emp.depAutres || 0;
  if (depAutres > 0) redFam += depAutres * PP.RED.isolée; // même réduction qu'isolé par personne
  impotAnnuel -= redFam;

  // Étape 7: Précompte mensuel = impôt annuel / 12
  r.baseTax = Math.max(0, impotAnnuel) / 12;
  r.famRed = redFam / 12;
  r.taxNet = revNetImposable / 12;
  r.tax = Math.max(0, r.baseTax);
  // ── Bonus à l'emploi FISCAL (réduction précompte professionnel) ──
  // 33,14% du volet A + 52,54% du volet B (depuis 01/04/2024)
  r.empBonusFiscA = r.empBonusA * 0.3314;
  r.empBonusFiscB = r.empBonusB * 0.5254;
  r.empBonusFisc = r.empBonusFiscA + r.empBonusFiscB;
  r.tax = Math.max(0, r.tax - r.empBonusFisc);

  // Spécial SS contribution (Art. 106-112 Loi-programme 30/12/1988)
  // Barème trimestriel — retenue mensuelle = 1/3 du montant trimestriel
  // Différent pour isolés vs ménages avec 2 revenus
  // Source: socialsecurity.be + montants-socio-juridiques 2026
  r.css = 0;
  const grossTrim = r.gross * 3; // salaire trimestriel
  const grossTrimOuv = isOuvrier ? grossTrim * 1.08 : grossTrim;
  // Calcul trimestriel puis division par 3
  if (emp.civil === 'married_2' || emp.civil === 'cohabit') {
    // MÉNAGE 2 REVENUS
    if (grossTrimOuv <= 5836.14) r.css = 0;
    else if (grossTrimOuv <= 6570.54) r.css = Math.max(9.30, (grossTrimOuv - 5836.14) * 0.076) / 3;
    else if (grossTrimOuv <= 18116.46) r.css = Math.min(51.64, 18.60 + (grossTrimOuv - 6570.54) * 0.011) / 3;
    else r.css = 51.64 / 3;
    // Plafond mensuel ménage 2 revenus = 51.64€/trim = 17.21€/mois
    r.css = Math.min(r.css, 51.64 / 3);
  } else {
    // ISOLÉ / conjoint SANS revenus
    if (grossTrimOuv <= 5836.14) r.css = 0;
    else if (grossTrimOuv <= 6570.54) r.css = (grossTrimOuv - 5836.14) * 0.076 / 3;
    else if (grossTrimOuv <= 18116.46) r.css = Math.min(60.94, 18.60 + (grossTrimOuv - 6570.54) * 0.011) / 3;
    else r.css = 60.94 / 3;
    // Plafond mensuel isolé = 60.94€/trim = 20.31€/mois
    r.css = Math.min(r.css, 60.94 / 3);
  }
  r.css = Math.round(r.css * 100) / 100;
  r.cssTrimMax = (emp.civil === 'married_2' || emp.civil === 'cohabit') ? 154.92 : 182.82;
  r.cssAnnuelMax = (emp.civil === 'married_2' || emp.civil === 'cohabit') ? 619.68 : 731.28;

  r.mvDays = per.days || Math.round(LEGAL.WD);
  r.mvWorker = r.mvDays * (emp.mvW || 0);
  r.mvEmployer = r.mvDays * (emp.mvE || 0);
  r.transport = 0; r.transportDetail = '';
  const cDist = parseFloat(emp.commDist) || 0;
  const cMonth = parseFloat(emp.commMonth) || 0;
  const cType = emp.commType || 'none';
  const wDays = per.days || 21;
  if (cType === 'train' && cMonth > 0) {
    // SNCB: intervention obligatoire 75% abonnement (CCT 19/9 du 26/03/2004)
    r.transport = cMonth * 0.75;
    r.transportDetail = `Train: 75% × ${fmt(cMonth)} = ${fmt(r.transport)}`;
  } else if (cType === 'bus' && cMonth > 0) {
    // Transport en commun autre: intervention = prix abo SNCB même distance (CCT 19/9)
    r.transport = cMonth * 0.75;
    r.transportDetail = `Bus/Tram: 75% × ${fmt(cMonth)} = ${fmt(r.transport)}`;
  } else if (cType === 'bike' && cDist > 0) {
    // Vélo: 0,27 €/km A/R (2026) — exonéré ONSS et IPP
    r.transport = cDist * 2 * wDays * 0.27;
    r.transportDetail = `Vélo: ${cDist}km × 2 × ${wDays}j × 0,27€ = ${fmt(r.transport)}`;
  } else if (cType === 'car' && cDist > 0) {
    // Voiture privée: pas d'obligation légale sauf CCT sectorielle
    // Si employeur intervient: exonération ONSS max 490€/an (2026) = 40,83€/mois
    // Calcul forfaitaire courant: barème SNCB pour distance équivalente
    r.transport = Math.min(40.83, cDist * 0.15 * wDays); // estimation
    r.transportDetail = `Voiture: ${cDist}km, interv. max exonérée ${fmt(r.transport)}/mois`;
  } else if (cType === 'carpool' && cDist > 0) {
    r.transport = Math.min(40.83, cDist * 0.15 * wDays);
    r.transportDetail = `Covoiturage: idem voiture`;
  } else if (cType === 'mixed' && cMonth > 0) {
    // Combiné: train + vélo possible
    r.transport = cMonth * 0.75 + (cDist > 0 ? cDist * 2 * wDays * 0.27 : 0);
    r.transportDetail = `Combiné: train ${fmt(cMonth * 0.75)} + vélo ${fmt(cDist * 2 * wDays * 0.27)}`;
  }
  r.expense = emp.expense || 0;
  r.garnish = per.garnish || 0;
  r.advance = per.advance || 0;
  r.otherDed = per.otherDed || 0;
  // ── PP VOLONTAIRE (Art. 275§1 CIR 92 + AR/PP Art. 88) ──
  // Le travailleur peut demander par écrit à l\'employeur de retenir un PP supplémentaire
  // au-delà du minimum légal. Récupérable via déclaration IPP si trop-retenu.
  // L'employeur est tenu de reverser l'intégralité au SPF Finances.
  // Base: AR 09/01/2024 fixant les barèmes de PP — dispense n'affecte pas ce montant.
  r.ppVolontaire = per.ppVolontaire || 0;

  // ══════════════════════════════════════════════════════════════
  //  ÉLÉMENTS FISCAUX COMPLETS — Art. CIR 92 / Loi ONSS 27/06/1969
  // ══════════════════════════════════════════════════════════════

  // ── 1. DOUBLE PÉCULE VACANCES (Employés — payé par employeur) ──
  // Art. 19 §2 AR 28/11/1969 — ONSS sur 2ème partie (7%) uniquement
  // Double pécule = 92% du brut (85% = 1ère partie + 7% = 2ème partie)
  // 2ème partie soumise ONSS trav 13,07% + cotisation spéciale 1%
  r.doublePecule = per.doublePecule || 0;
  r.dpOnss = 0; r.dpCotisSpec = 0;
  if (r.doublePecule > 0) {
    const dp2 = r.doublePecule * (7/92); // extraire la 2ème partie
    r.dpOnss = dp2 * TX_ONSS_W;      // ONSS travailleur sur 2è partie
    r.dpCotisSpec = dp2 * 0.01;    // cotisation spéciale 1%
  }

  // ── 2. PÉCULE VACANCES DE DÉPART (Art. 46 Loi 12/04/1965) ──
  // Payé lors de la sortie de service — simple + double anticipé
  // Soumis ONSS 13,07% sur totalité
  r.peculeDepart = per.peculeDepart || 0;
  r.pdOnss = r.peculeDepart > 0 ? r.peculeDepart * TX_ONSS_W : 0;

  // ── 3. PRIME D'ANCIENNETÉ (Art. 19 §2 14° AR ONSS) ──
  // Exonérée ONSS et IPP si: 1× entre 25-35 ans anc. et 1× ≥ 35 ans anc.
  // Plafond 2026: max 1× brut mensuel ou fraction (prorata)
  // Montant max exonéré: employé = 1 mois brut, ouvrier = idem
  r.primeAnciennete = per.primeAnciennete || 0;
  const ancAns = emp.anciennete || 0;
  const primeAncExo = (ancAns >= 25) ? Math.min(r.primeAnciennete, emp.monthlySalary) : 0;
  r.primeAncTaxable = Math.max(0, r.primeAnciennete - primeAncExo);
  r.primeAncExoneree = primeAncExo;

  // ── 4. PRIME DE NAISSANCE / MARIAGE / ÉVÉNEMENT (Circ. ONSS 2024/1) ──
  // Exonérée ONSS si ≤ plafond (naissance: coutume, mariage: idem)
  // Considéré comme avantage social si modique et lié à événement
  r.primeNaissance = per.primeNaissance || 0;

  // ── 5. PRIME D'INNOVATION (Art. 38 §1er 25° CIR 92) ──
  // Exonérée IPP si ≤ 1 mois brut et ≤ 1× par travailleur
  // Soumise ONSS mais exonérée fiscalement
  r.primeInnovation = per.primeInnovation || 0;

  // ── 6. INDEMNITÉ TÉLÉTRAVAIL (Circ. 2021/C/20 du 26/02/2021) ──
  // Max 154,74€/mois (montant 2026 — indexé chaque année)
  // Exonérée ONSS et IPP si structurel (min 1 jour/semaine régulier)
  // Couvre: chauffage, électricité, petit materiel, amortissement mobilier
  r.indemTeletravail = Math.min(per.indemTeletravail || 0, FORF_BUREAU);

  // ── 7. INDEMNITÉ FRAIS DE BUREAU (AR/CIR92 Art. 31) ──
  // Frais propres de l\'employeur — exonérés si justifiés ou forfaitaires
  // Forfait bureau: max 10% brut (tolérance admin. — non cumulable télétravail)
  r.indemBureau = per.indemBureau || 0;

  // ── 8. PENSION COMPLÉMENTAIRE — Retenue personnelle (Loi 28/04/2003 LPC) ──
  // Retenue sur salaire = cotisation personnelle du travailleur
  // Déductible fiscalement (Art. 145/1 CIR — réduction 30% avec plafond)
  // Soumise ONSS travailleur (base de calcul ONSS)
  // Cotisation Wijninckx — 12,5% depuis 2026 (Loi 18/12/2025 M.B. 30/12/2025)
  // Applicable si pension légale + compl. > pension max secteur public (97.548€/an)
  r.pensionCompl = per.pensionCompl || 0;

  // ── 9. RETENUE SYNDICALE (Art. 23 Loi 12/04/1965) ──
  // Volontaire — transmise au syndicat. Pas ONSS, réduction fiscale partielle
  r.retSyndicale = per.retSyndicale || 0;

  // ── 10. PENSION ALIMENTAIRE (Art. 1409-1412 Code judiciaire) ──
  // Saisie prioritaire — avant les autres saisies, sans barème
  r.saisieAlim = per.saisieAlim || 0;

  // ── 11. RÉDUCTION PP HEURES SUPPLÉMENTAIRES (Art. 154bis CIR 92) ──
  // Travailleur: réduction PP sur sursalaire (50% ou 100%)
  // Max 180h/an (2026 — Art.154bis §3 CIR — Accord Arizona structurel)
  // Horeca: 360h | Construction+enregistrément: 180h
  // Employeur: dispense versement PP 32,19% (Art. 275/1 CIR)
  // Applicable sur heures au-delà de 9h/j ou 38h/sem (ou limité secteur)
  const hsfisc = per.heuresSupFisc || 0;
  r.heuresSupFisc = hsfisc;
  const sursalaire = hsfisc * hr * 0.5; // sursalaire = 50% du taux horaire normal
  // Réduction travailleur: 66,81% du PP sur le sursalaire (taux barème 1 Art.154bis)
  // ou 57,75% selon barème 2
  r.redPPHeuresSup = sursalaire > 0 ? Math.round(sursalaire * 0.6681 * 100) / 100 : 0;
  r.tax = Math.max(0, r.tax - r.redPPHeuresSup);

  // ── 12. DISPENSE VERSEMENT PP NUIT/ÉQUIPES (Art. 275/5 CIR 92) ──
  // Employeur: dispense de versement PP = 22,8% (travail en équipe/nuit)
  // Ne change pas le net du travailleur, réduit le coût employeur
  r.dispensePPNuit = (per.nightH || 0) > 0 ? r.tax * 0.228 : 0;

  // ── 13. PP À TAUX EXCEPTIONNEL — Double pécule & 13è mois ──
  // (AR 09/01/2024 annexe III — Barèmes précompte professionnel)
  // Double pécule vacances: taxé à taux fixe (pas barème progressif)
  //   Taux = basé sur rémunération annuelle brute:
  //   ≤ 17.280€: 0% | ≤ 32.280€: 19,17% | ≤ 43.380€: 23,22% | > 43.380€: 30,28%
  // 13è mois: taux fixe idem (annexe III AR)
  // Indemnité de départ/préavis: taux fixe selon rémunération annuelle
  // NB: ces taux s\'appliquent sur le MONTANT EXCEPTIONNEL, pas le salaire mensuel
  r.ppTauxExcep = 0; r.ppTauxExcepRate = 0;
  const typeSpec = per.typeSpecial || 'normal';
  if (typeSpec === 'doublePecule' || typeSpec === 'y13' || typeSpec === 'départ' || typeSpec === 'préavis') {
    const annBrut = r.base * 12;
    if (annBrut <= 17280) r.ppTauxExcepRate = 0;
    else if (annBrut <= 32280) r.ppTauxExcepRate = 0.1917;
    else if (annBrut <= 43380) r.ppTauxExcepRate = 0.2322;
    else r.ppTauxExcepRate = 0.3028;
    // Appliquer sur le montant exceptionnel
    const montantExcep = (typeSpec === 'doublePecule' ? r.doublePecule : 0)
      + (typeSpec === 'y13' ? r.y13 : 0)
      + (typeSpec === 'départ' ? r.peculeDepart : 0)
      + (typeSpec === 'préavis' ? (per.indemPreavis || 0) : 0);
    r.ppTauxExcep = montantExcep * r.ppTauxExcepRate;
    r.tax += r.ppTauxExcep;
  }

  // ── 14. JOURS FÉRIÉS PAYÉS (Loi 04/01/1974 + AR 18/04/1974) ──
  // 10 jours fériés légaux/an (Belgique) — payés par l\'employeur
  // Ouvrier: salaire journalier normal (inclus dans les jours prestés si travaillés)
  // Employé: salaire mensuel normal (pas d'impact sur calcul mensuel)
  // Jour férié travaillé: supplément 200% (déjà couvert par sundayH si encodé)
  r.joursFeries = per.joursFeries || 0; // nombre encodé dans le mois

  // ── 15. PETIT CHÔMAGE / CONGÉ DE CIRCONSTANCE (AR 28/08/1963) ──
  // Salaire normal maintenu pour événements familiaux:
  // Mariage travailleur: 2 jours | Décès conjoint/enfant: 3 jours
  // Naissance enfant (co-parent): 15 jours | Communion: 1 jour
  // Déménagement: 1 jour | Comparution tribunal: nécessaire
  r.petitChomage = per.petitChomage || 0; // nombre jours
  r.petitChomageVal = r.petitChomage * (r.base / LEGAL.WD); // valeur = salaire/jour

  // ── 16. ÉCO-CHÈQUES (CCT 98 du 20/02/2009 — CNT) ──
  // Max 250€/an par travailleur temps plein (prorata temps partiel)
  // Exonérés ONSS et IPP si conditions respectées (pas en remplacement rémun.)
  // Uniquement électroniques depuis 2024
  // Non inclus dans le brut, pas de retenue — coût employeur pur
  r.ecoCheques = per.ecoCheques || 0;

  // ── 17. CADEAUX & AVANTAGES SOCIAUX (Circ. ONSS + Art. 38/11 CIR) ──
  // Exonérés ONSS+IPP si: Noël/Nouvel An ≤ 40€ + 40€/enfant | Mariage ≤ 245€
  // Saint-Nicolas ≤ 40€/enfant | Retraite ≤ 40€/année service (max 40 ans)
  r.cadeaux = per.cadeaux || 0;

  // ── 18. BUDGET MOBILITÉ (Loi 17/03/2019 modifié 01/01/2022) ──
  // Alternative à la voiture de société — 3 piliers:
  // Pilier 1: voiture plus écologique (ATN réduit)
  // Pilier 2: mobilité durable (transport en commun, vélo, logement) — exonéré ONSS+IPP
  // Pilier 3: solde en cash — cotisation spéciale 38,07% (employeur + travailleur)
  // Montant = TCO annuel voiture de société (1/5 × catalogue × coeff. âge + carburant + CO2)
  r.budgetMobilité = per.budgetMobilité || 0;
  r.budgetMobPilier2 = per.budgetMobP2 || 0; // part exonérée
  r.budgetMobPilier3 = per.budgetMobP3 || 0; // part cash → cotisation 38,07%
  r.budgetMobCotis38 = r.budgetMobPilier3 * 0.3807;

  // ── 19. RÉDUCTIONS GROUPES-CIBLES EMPLOYEUR (AR Groupes-cibles) ──
  // Réductions ONSS patronales ciblées — calculées AUTOMATIQUEMENT
  //
  // ═══ PREMIER ENGAGEMENT (AR 16/05/2003 + Réforme 01/04/2026) ═══
  // Art. 336-353 Loi-programme 24/12/2002
  // Source: ONSS instructions T1/2026 + SPF Emploi
  //
  // AVANT 01/04/2026:
  //   1er employé: exonération totale ONSS patronal (durée illimitée depuis 2016)
  //   2è employé: forfait trimestriel 1.550€ T1-T5, 1.050€ T6-T9, 450€ T10-T13
  //   3è employé: forfait trimestriel 1.050€ T1-T5, 1.050€ T6-T9, 450€ T10-T13
  //   4è employé: forfait trimestriel 1.050€ T1-T5, 1.050€ T6-T9, 450€ T10-T13
  //   5è employé: forfait trimestriel 1.050€ T1-T5, 1.050€ T6-T9, 450€ T10-T13
  //   6è employé: forfait trimestriel 1.050€ T1-T5, 1.050€ T6-T9, 450€ T10-T13
  //
  // APRÈS 01/04/2026 (Réforme budget fédéral):
  //   1er employé: max 3.100€ → réduit à 2.000€/trimestre (plafonné)
  //   2è employé: inchangé
  //   3è employé: inchangé
  //   4è-5è-6è: RÉINTRODUITS (supprimés en 2025, rétablis 04/2026)
  //
  // Paramètre: emp.nrEngagement = rang d'engagement (1 = 1er, 2 = 2è, etc.)
  // Paramètre: emp.engagementTrimestre = trimestre courant depuis engagement (1-13+)

  const PREMIER_ENG = {
    // Montants trimestriels par rang et par période (trimestres depuis engagement)
    // Format: [T1-T5, T6-T9, T10-T13, T14+]
    1: { label: '1er employé', amounts: [2000, 2000, 2000, 2000], note: 'Illimité (plafonné 2.000€/trim. depuis 04/2026)' },
    2: { label: '2è employé', amounts: [1550, 1050, 450, 0], note: '13 trimestres max' },
    3: { label: '3è employé', amounts: [1050, 1050, 450, 0], note: '13 trimestres max' },
    4: { label: '4è employé', amounts: [1050, 1050, 450, 0], note: 'Réintroduit 04/2026' },
    5: { label: '5è employé', amounts: [1050, 1050, 450, 0], note: 'Réintroduit 04/2026' },
    6: { label: '6è employé', amounts: [1050, 1050, 450, 0], note: 'Réintroduit 04/2026' },
  };

  r.redGCPremier = 0; r.redGCPremierLabel = ''; r.redGCPremierNote = '';
  const nrEng = emp.nrEngagement || 0;
  const engTrim = emp.engagementTrimestre || 1;
  if (nrEng >= 1 && nrEng <= 6) {
    const pe = PREMIER_ENG[nrEng];
    let trimIdx = 0;
    if (engTrim <= 5) trimIdx = 0;
    else if (engTrim <= 9) trimIdx = 1;
    else if (engTrim <= 13) trimIdx = 2;
    else trimIdx = 3;
    const trimAmount = pe.amounts[trimIdx];
    // Mensualiser le montant trimestriel
    r.redGCPremier = Math.round(trimAmount / 3 * 100) / 100;
    // Pour le 1er employé: ne peut pas dépasser la cotisation patronale effective
    if (nrEng === 1) r.redGCPremier = Math.min(r.redGCPremier, r.onssE + r.redStructMois);
    r.redGCPremierLabel = pe.label;
    r.redGCPremierNote = `${pe.label}: ${fmt(trimAmount)}/trim. (T${engTrim}) — ${pe.note}`;
  }

  // Travailleurs âgés ≥ 55 ans (AR 19/12/2001 — Activation 55+)
  // Réduction trimestrielle: 1.150€ si ≥ 55 ans + salaire < 14.640,83€/trim.
  r.redGCAge = per.redGCAge || 0;
  // Jeunes < 26 ans peu qualifiés (AR Activation jeunes)
  // Réduction trimestrielle: 1.500€ (très peu qualifié) ou 1.150€ (peu qualifié)
  r.redGCJeune = per.redGCJeune || 0;
  // Travailleurs handicapes
  r.redGCHandicap = per.redGCHandicap || 0;
  r.redGCTotal = r.redGCPremier + r.redGCAge + r.redGCJeune + r.redGCHandicap;

  // ── 20. COTISATION SPÉCIALE ONSS MODÉRATION SALARIALE (Loi 1996) ──
  // Déjà incluse dans le taux ONSS_E global via ONSS_SECTEUR
  // 5,67% sur la masse salariale (employeur) — pas travailleur

  // ── 21. ALLOCATION DE TRAVAIL ONEM — ACTIVATION (AR 19/12/2001 + Régional) ──
  // Mécanisme: le travailleur reçoit une allocation de l'ONEM via CAPAC/syndicat.
  // L'employeur DÉDUIT ce montant du salaire net à payer.
  // Le travailleur touche: salaire net (employeur) + allocation ONEM = rémunération totale.
  // → Le coût réel de l\'employeur baisse du montant de l'allocation.
  //
  // Types d'allocations de travail:
  // Activa.brussels (Actiris): max €350/mois × 12 mois — DE ≥ 12 mois, résid. Bruxelles
  // Activa.brussels Jeunes: €350/mois × 6 mois — DE < 30 ans, ≥ 6 mois
  // Impulsion Wallonie: €500/mois × 24-36 mois — via FOREM/SPW
  // SINE (économie sociale): variable
  //
  // Traitement fiscal: l'allocation de travail est un revenu de remplacement pour le travailleur
  // → Soumise au précompte professionnel (retenue par ONEM/CAPAC)
  // → NON soumise ONSS (pas de rémunération au sens ONSS)
  // → L'employeur ne la déclare PAS en DmfA (c\'est l'ONEM qui déclare)
  //
  // Sur la fiche de paie: mention "pour mémoire" — déduit du coût employeur
  const allocType = per.allocTravailType || 'none';
  r.allocTravail = per.allocTravail || 0;
  r.allocTravailType = allocType;
  // Montants standards par type (si pas de montant custom)
  if (r.allocTravail === 0 && allocType !== 'none') {
    const ALLOC_MONTANTS = {
      'activa_bxl': 350,       // Activa.brussels: €350/mois
      'activa_jeune': 350,     // Activa Jeunes: €350/mois
      'impulsion_wal': 500,    // Impulsion Wallonie: €500/mois
      'impulsion55': 500,      // Impulsion 55+: €500/mois
      'sine': 500,             // SINE: €500/mois (variable)
      'vdab': 0,               // Flandre: pas d'allocation trav. (prime directe employeur)
    };
    r.allocTravail = ALLOC_MONTANTS[allocType] || 0;
  }
  r.allocTravailLabel = {
    'activa_bxl': 'Activa.brussels (Actiris)',
    'activa_jeune': 'Activa Jeunes <30 (Actiris)',
    'impulsion_wal': 'Impulsion Wallonie (FOREM)',
    'impulsion55': 'Impulsion 55+ (FOREM)',
    'sine': 'SINE (économie sociale)',
    'vdab': 'Groupe-cible flamand (VDAB)',
  }[allocType] || '';

  // ── 14. FLEXI-JOB (Art. 3 Loi 16/11/2015 — modifié 01/01/2024) ──
  // Conditions: emploi principal min. 4/5 (T-3) OU pensionne
  // Secteurs: horeca CP302, commerce CP201/202/311, soins CP318/330/331/332,
  //   boulangerie CP118.03, agriculture CP144/145, intérim CP322, sport, culture...
  // Travailleur: 0% ONSS, 0% PP (exonéré si ≤ 12.000€/an)
  // Employeur: 28% cotisation patronale spéciale (Art.38§3ter Loi 29/06/1981)
  // Flexi-salaire min: 12,29€/h + 7,67% flexi-pécule vacances (2026)
  // Plafond IPP: 12.000€/an (pensionnes: illimité)
  // Dimona: type "FLX" | DmfA: code "050"
  r.isFlexiJob = (emp.contract === 'flexi');
  if (r.isFlexiJob) {
    const flexiMinH = 12.29;
    const flexiH = per.days * ((emp.whWeek || 10) / 5);
    const flexiTauxH = Math.max(flexiMinH, (emp.monthlySalary || 0) / ((emp.whWeek || 10) * 4.33));
    r.flexiSalaireH = flexiTauxH;
    r.flexiHeures = flexiH;
    r.flexiBrut = Math.round(flexiH * flexiTauxH * 100) / 100;
    r.flexiPecule = Math.round(r.flexiBrut * PV_SIMPLE * 100) / 100;
    r.flexiOnssPatronal = Math.round((r.flexiBrut + r.flexiPecule) * 0.28 * 100) / 100;
    r.gross = r.flexiBrut + r.flexiPecule;
    r.base = r.flexiBrut;
    r.onssW = 0; r.onssNet = 0; r.empBonus = 0; r.empBonusA = 0; r.empBonusB = 0;
    r.tax = 0; r.css = 0; r.ppVolontaire = 0; r.ppTauxExcep = 0; r.ppTauxExcepRate = 0;
    r.onssE = r.flexiOnssPatronal; r.redStructMois = 0; r.redStruct = 0;
    r.totalDed = per.advance || 0;
    r.net = r.gross - r.totalDed;
    r.costTotal = r.gross + r.flexiOnssPatronal;
    r.flexiNet = r.net;
    return r;
  }

  // ── 15. ÉTUDIANT (Art. 17bis AR ONSS) ──
  // Max 650h/an (2026 — Annexe III PP + Art.17bis AR 28/11/1969): cotisation solidarité 2,71% (trav) + 5,42% (empl)
  // Au-delà: ONSS normal. Pas de PP si ≤ 7.340€/an net imposable
  r.isStudent = (emp.contract === 'étudiant');
  if (r.isStudent) {
    r.studentOnssW = Math.round(r.gross * 0.0271 * 100) / 100; // 2,71%
    r.studentOnssE = Math.round(r.gross * 0.0542 * 100) / 100; // 5,42%
    r.onssW = r.studentOnssW; r.onssNet = r.studentOnssW;
    r.onssE = r.studentOnssE;
    r.empBonus = 0; r.empBonusA = 0; r.empBonusB = 0;
    r.redStructMois = 0; r.redStruct = 0;
    // PP = 0 si revenu annuel net ≤ 7.340€
    if (r.gross * 12 <= 7340) { r.tax = 0; r.css = 0; }
  }

  // ── 16. FRAIS PROFESSIONNELS FORFAITAIRES (Art. 51 CIR 92) ──
  // Déjà calculé ci-dessus: 30% avec plafond (employés et ouvriers)

  // ── 17. RÉDUCTIONS FAMILIALES (Art. 136-140 CIR 92) ──
  // Déjà calculé ci-dessus: quotité exemptée par enfant + isolé + handicap

  // ── 18. DISPENSE VERSEMENT PP RECHERCHE (Art. 275/3 CIR 92) ──
  // 80% du PP pour les chercheurs (diplôme Master/Doctorat)
  // Uniquement côté employeur — ne change pas le net travailleur

  // ══════════════════════════════════════════════════════════════
  //  PÉCULE DE VACANCES — CALCUL AUTOMATIQUE (Sprint 2)
  // ══════════════════════════════════════════════════════════════
  // Source: Loi 28/06/1971 + AR 30/03/1967 + ONSS Instructions 2026
  //
  // EMPLOYÉS (payé par l\'employeur):
  //   Simple: 100% du brut mensuel normal (payé pendant les vacances)
  //   Double: 92% du brut mensuel → payé avant les vacances (généralement mai/juin)
  //     - 1ère partie (85%): soumise PP normal
  //     - 2ème partie (7%): soumise ONSS 13,07% + cotisation spéciale 1%
  //   → Le simple pécule = salaire normal du mois de vacances (déjà dans le brut)
  //
  // OUVRIERS (payé par la Caisse de Vacances / ONVA):
  //   Total: 15,38% du brut annuel N-1 (à 108%)
  //   Simple: 6,80% (7,69% de 108% - cotisation solidarité)
  //   Double: 8,58% (reste)
  //   → Versé via l'ONVA ou la Caisse sectorielle, PAS par l\'employeur
  //   → L'employeur paie la cotisation vacances 15,84% trimestrielle à l'ONSS
  //
  r.peculeVacCalc = {
    type: isOuvrier ? 'ouvrier' : 'employé',
    brutRef: isOuvrier ? (r.gross * 1.08 * 12) : (emp.monthlySalary || 0), // brut annuel N-1 à 108% pour ouvriers
    simple: 0,
    double: 0,
    total: 0,
    onss2emePartie: 0,
    cotisSpec1pct: 0,
    ppExcep: 0,
    moisPaiement: isOuvrier ? 'Mai (Caisse de Vacances)' : 'Mai/Juin (Employeur)'
  };
  if (!isOuvrier) {
    // Employé: simple = 1 mois brut (déjà inclus dans salaire normal du mois de vacances)
    r.peculeVacCalc.simple = emp.monthlySalary || 0;
    // Double = 92% du brut mensuel (LOIS_BELGES)
    r.peculeVacCalc.double = (emp.monthlySalary || 0) * LOIS_BELGES.remuneration.peculeVacances.double.pct;
    r.peculeVacCalc.total = r.peculeVacCalc.simple + r.peculeVacCalc.double;
    // 2ème partie du double pécule (7/92 du double) → ONSS 13,07% + cotis spéciale 1%
    const dp2 = r.peculeVacCalc.double * (7/92);
    r.peculeVacCalc.onss2emePartie = Math.round(dp2 * TX_ONSS_W * 100) / 100;
    r.peculeVacCalc.cotisSpec1pct = Math.round(dp2 * 0.01 * 100) / 100;
    // PP exceptionnel sur le double pécule
    const annBrutDP = (emp.monthlySalary || 0) * 12;
    if (annBrutDP <= 17280) r.peculeVacCalc.ppExcepRate = 0;
    else if (annBrutDP <= 32280) r.peculeVacCalc.ppExcepRate = 0.1917;
    else if (annBrutDP <= 43380) r.peculeVacCalc.ppExcepRate = 0.2322;
    else r.peculeVacCalc.ppExcepRate = 0.3028;
    r.peculeVacCalc.ppExcep = Math.round(r.peculeVacCalc.double * (r.peculeVacCalc.ppExcepRate || 0) * 100) / 100;
  } else {
    // Ouvrier: 15,38% du brut annuel N-1 × 108%
    r.peculeVacCalc.simple = Math.round(r.peculeVacCalc.brutRef * 0.0680 * 100) / 100;
    r.peculeVacCalc.double = Math.round(r.peculeVacCalc.brutRef * LOIS_BELGES.remuneration.peculeVacances.ouvrierDouble.pct * 100) / 100;
    r.peculeVacCalc.total = Math.round(r.peculeVacCalc.brutRef * (PV_SIMPLE*2+0.001) * 100) / 100;
  }

  // ══════════════════════════════════════════════════════════════
  //  13ÈME MOIS / PRIME DE FIN D'ANNÉE — CALCUL PAR CP (Sprint 2)
  // ══════════════════════════════════════════════════════════════
  // Source: CCT sectorielles + AR rendant les CCT obligatoires
  //
  // La prime de fin d'année n\'est PAS une obligation légale mais conventionnelle.
  // Son montant et ses conditions varient par commission paritaire:
  //
  // CP 200 (employés): 100% du brut mensuel (convention quasi-universelle)
  // CP 124 (construction): calculé en % du brut × jours prestés
  // CP 302 (horeca): prime = brut mensuel × coefficient (Fonds social)
  // CP 330 (soins santé): prime = montant fixe indexé par échelon
  //
  r.y13Calc = {
    cp: emp.cp || '200',
    moisPaiement: 'Décembre',
    montant: 0,
    onss: 0,
    ppExcep: 0,
    ppExcepRate: 0,
    coutEmployeur: 0,
    méthode: ''
  };
  const cpNum = parseInt(emp.cp) || 200;
  if (cpNum === 124) {
    // Construction: 8,33% du brut annuel (via Fonds social)
    r.y13Calc.montant = Math.round((emp.monthlySalary || 0) * 12 * 0.0833 * 100) / 100;
    r.y13Calc.methode = 'CP 124 — 8,33% brut annuel (Fonds social FBTP)';
  } else if (cpNum === 302) {
    // Horeca: via Fonds social — environ 1 mois brut
    r.y13Calc.montant = emp.monthlySalary || 0;
    r.y13Calc.methode = 'CP 302 — ±1 mois brut (Fonds social Horeca)';
  } else if (cpNum >= 330 && cpNum <= 332) {
    // Non-marchand santé/social: montant fixe indexé ≈ 1 mois
    r.y13Calc.montant = emp.monthlySalary || 0;
    r.y13Calc.methode = 'CP 330-332 — Montant fixe indexé (CCT sectorielle)';
  } else {
    // CP 200 et autres: 1 mois brut (convention quasi-universelle)
    r.y13Calc.montant = emp.monthlySalary || 0;
    r.y13Calc.methode = 'CP ' + cpNum + ' — 100% brut mensuel (CCT sectorielle)';
  }
  // ONSS sur 13ème mois: 13,07% travailleur
  r.y13Calc.onss = Math.round(r.y13Calc.montant * TX_ONSS_W * 100) / 100;
  // PP exceptionnel (taux fixe selon rémunération annuelle brute)
  const annBrut13 = (emp.monthlySalary || 0) * 12;
  if (annBrut13 <= 17280) r.y13Calc.ppExcepRate = 0;
  else if (annBrut13 <= 32280) r.y13Calc.ppExcepRate = 0.1917;
  else if (annBrut13 <= 43380) r.y13Calc.ppExcepRate = 0.2322;
  else r.y13Calc.ppExcepRate = 0.3028;
  r.y13Calc.ppExcep = Math.round(r.y13Calc.montant * r.y13Calc.ppExcepRate * 100) / 100;
  r.y13Calc.netEstime = Math.round((r.y13Calc.montant - r.y13Calc.onss - r.y13Calc.ppExcep) * 100) / 100;
  r.y13Calc.coutEmployeur = Math.round(r.y13Calc.montant * (1 + (LEGAL.ONSS_SECTEUR[emp.cp]?.e || 0.25)) * 100) / 100;

  // ══════════════════════════════════════════════════════════════
  //  TOTALISATION
  // ══════════════════════════════════════════════════════════════

  // Total retenues sur le net
  r.totalDed = r.onssNet + r.tax + r.css + r.mvWorker
    + r.garnish + r.advance + r.otherDed + r.ppVolontaire
    + r.atnCar + r.atnAutresTot
    + r.dpOnss + r.dpCotisSpec       // ONSS double pécule
    + r.pdOnss                        // ONSS pécule départ
    + r.pensionCompl                  // retenue pension complémentaire
    + r.retSyndicale                  // retenue syndicale
    + r.saisieAlim                    // pension alimentaire
    + r.budgetMobCotis38;             // budget mobilité pilier 3

  // Net à payer
  r.net = r.gross - r.totalDed + r.expense + r.transport
    + r.doublePecule - r.dpOnss - r.dpCotisSpec    // double pécule net
    + r.peculeDepart - r.pdOnss                      // pécule départ net
    + r.primeAncExoneree                              // prime ancienneté exonérée
    + r.primeNaissance                                // prime naissance (exo)
    + r.indemTeletravail                              // indemnité télétravail (exo)
    + r.indemBureau                                   // frais bureau (exo)
    + r.petitChomageVal                               // petit chômage (salaire maintenu)
    + r.budgetMobPilier2                             // budget mobilité pilier 2 (exo)
    + r.hsBrutNetTotal;                                // HS volontaires brut=net (exo ONSS+PP)

  // ONSS employeur déjà calculé ci-dessus (onssE, onssE_rate, onssE_note)
  r.insAT = r.gross * 0.0087;
  // Cotisation vacances annuelles ouvriers (Art. 38 Loi 29/06/1981)
  // 15,84% sur brut × 108% — payé via ONSS, versé à la Caisse de vacances
  // Inclus dans le taux ONSS sectoriel ouvrier mais à afficher séparément
  r.cotisVacOuv = isOuvrier ? onssBase * LEGAL.ONSS_DETAIL_2026.vacances_annuelles_ouvrier : 0;
  // Cotisation patronale pension complémentaire (estimation si retenue personnelle existe)
  r.pensionComplEmpl = r.pensionCompl > 0 ? r.pensionCompl * 2 : 0; // ratio courant 2:1
  r.cotisWijninckx = (r.pensionComplEmpl + r.pensionCompl) * 12 > 32472 ? ((r.pensionComplEmpl + r.pensionCompl) * 12 - 32472) / 12 * 0.125 : 0;
  // Dispenses PP employeur (ne changent pas le net travailleur mais réduisent le coût)
  // Art 275/1 CIR: dispense heures sup = 32,19% du PP retenu sur le sursalaire
  r.dispensePPHSup = sursalaire > 0 ? sursalaire * 0.3219 : 0;
  r.dispensePPTotal = r.dispensePPNuit + r.dispensePPHSup;
  r.costTotal = r.gross + r.onssE + r.mvEmployer + r.expense + r.transport + r.insAT + r.cotCO2
    + r.cotisVacOuv                                     // vacances ouvriers 15,84%
    + r.pensionComplEmpl + r.cotisWijninckx              // pension complémentaire
    + r.doublePecule + r.peculeDepart + r.primeAnciennete + r.primeNaissance + r.primeInnovation
    + r.indemTeletravail + r.indemBureau
    + r.ecoCheques + r.cadeaux                           // éco-chèques + cadeaux
    + r.budgetMobCotis38                                 // budget mobilité pilier 3
    + r.veloLeasingMois                                   // leasing vélo
    + r.borneRechargeCout                                 // borne de recharge
    + r.carteCarburantMois                                // carte carburant
    - r.dispensePPTotal                                   // dispenses PP
    - r.redGCTotal                                        // réductions groupes-cibles
    - r.allocTravail;                                     // allocation travail ONEM (déduit du coût)
  return r;
}

function calcPrecompteExact(brutMensuel, options) {
  const opts = options || {};
  const situation = opts.situation || 'isolé';
  const enfants = +(opts.enfants || 0);
  const enfantsHandicapes = +(opts.enfantsHandicapes || 0);
  const handicape = !!opts.handicape;
  const conjointHandicape = !!opts.conjointHandicape;
  const conjointRevenus = !!opts.conjointRevenus;
  const conjointRevenuLimite = !!opts.conjointRevenuLimite;
  const conjointPensionLimitee = !!opts.conjointPensionLimitee;
  const parentIsole = !!opts.parentIsole;
  const personnes65 = +(opts.personnes65 || 0);
  const autresCharges = +(opts.autresCharges || 0);
  const dirigeant = !!opts.dirigeant;
  const taxeCom = +(opts.taxeCom || 7) / 100;
  const regime = +(opts.regime || 100) / 100;
  const isBareme2 = situation === 'marie_1r' || (situation === 'cohabitant' && !conjointRevenus);

  const brut = brutMensuel * regime;
  if (brut <= 0) return { pp: 0, rate: 0, forfait: 0, reduction: 0, bonusEmploi: 0, detail: {} };

  // 1. ONSS travailleur 13.07%
  const onss = Math.round(brut * TX_ONSS_W * 100) / 100;
  const imposable = brut - onss;

  // 2. Annualisation
  const annuel = imposable * 12;

  // 3. Frais professionnels forfaitaires 2026
  let forfaitAn = 0;
  if (dirigeant) {
    forfaitAn = Math.min(annuel * LOIS_BELGES.pp.fraisPro.dirigeant.pct, LOIS_BELGES.pp.fraisPro.dirigeant.max);
  } else {
    forfaitAn = Math.min(annuel * LOIS_BELGES.pp.fraisPro.salarie.pct, LOIS_BELGES.pp.fraisPro.salarie.max);
  }

  // 4. Revenu net imposable annuel
  const baseAnnuelle = Math.max(0, annuel - forfaitAn);

  // 5. Quotient conjugal (barème 2 uniquement)
  let qcAttribue = 0;
  let baseApresQC = baseAnnuelle;
  if (isBareme2) {
    qcAttribue = Math.min(baseAnnuelle * LOIS_BELGES.pp.quotientConjugal.pct, LOIS_BELGES.pp.quotientConjugal.max);
    baseApresQC = baseAnnuelle - qcAttribue;
  }

  // 6. Impôt progressif — Tranches PP SPF 2026 (Formule-clé Annexe III)
  const calcImpotProgressif = (base) => {
    if (base <= 0) return 0;
    const T=LOIS_BELGES.pp.tranches;let imp=0,prev=0;for(const t of T){const s=Math.min(base,t.max)-Math.max(prev,t.min);if(s>0)imp+=s*t.taux;prev=t.max;}return imp;
  };
  let impot = calcImpotProgressif(baseApresQC);

  // Impôt sur quotient conjugal (même barème progressif)
  if (isBareme2 && qcAttribue > 0) {
    impot += calcImpotProgressif(qcAttribue);
  }

  // 7. Réduction quotité exemptée
  const qeBase = isBareme2 ? LOIS_BELGES.pp.quotiteExemptee.bareme2 : LOIS_BELGES.pp.quotiteExemptee.bareme1;
  const redQE = qeBase;

  // 8. Réduction enfants à charge (montants annuels 2026)
  const tabEnfants = LOIS_BELGES.pp.reductionsEnfants;
  const suppEnfant = LOIS_BELGES.pp.reductionEnfantSupp;
  const enfTotal = enfants + enfantsHandicapes; // handicapes comptent double fiscalement
  const enfFiscaux = enfTotal + enfantsHandicapes; // double comptage
  let redEnfants = 0;
  if (enfFiscaux > 0) {
    if (enfFiscaux <= 8) redEnfants = tabEnfants[enfFiscaux];
    else redEnfants = tabEnfants[8] + (enfFiscaux - 8) * suppEnfant;
  }

  // 9. Réduction parent isolé avec enfants
  let redParentIsole = 0;
  if (parentIsole && enfTotal > 0) redParentIsole = LOIS_BELGES.pp.reductionParentIsolé;

  // 10. Réduction bénéficiaire handicape
  let redHandicape = 0;
  if (handicape) redHandicape = LOIS_BELGES.pp.reductionHandicape;

  // 11. Réduction conjoint handicape (barème 2)
  let redConjHandicape = 0;
  if (isBareme2 && conjointHandicape) redConjHandicape = LOIS_BELGES.pp.reductionConjointHandicape;

  // 12. Réduction conjoint revenu limité
  let redConjRevLimite = 0;
  if (conjointRevenuLimite) redConjRevLimite = LOIS_BELGES.pp.reductionConjointRevenuLimite;

  // 13. Réduction conjoint pension limitée
  let redConjPension = 0;
  if (conjointPensionLimitee) redConjPension = LOIS_BELGES.pp.reductionConjointPensionLimitee;

  // 14. Réduction personnes 65+ à charge
  let redP65 = personnes65 * LOIS_BELGES.pp.reductionPersonne65;

  // 15. Réduction autres personnes à charge
  let redAutres = autresCharges * LOIS_BELGES.pp.reductionAutreCharge;

  // Total réductions annuelles
  const totalReductions = redQE + redEnfants + redParentIsole + redHandicape + redConjHandicape + redConjRevLimite + redConjPension + redP65 + redAutres;

  // 6b. Impôt annuel après réductions
  const impotApresReduc = Math.max(0, impot - totalReductions);

  // 16. Taxe communale
  const impotAvecTaxeCom = Math.round(impotApresReduc * (1 + taxeCom) * 100) / 100;

  // Bonus emploi fiscal (33.14% réduction sur bonus social ONSS)
  const bonusEmploi = 0; // calculé séparément si nécessaire

  // PP mensuel
  const ppMensuel = Math.round(impotAvecTaxeCom / 12 * 100) / 100;

  // Taux effectif
  const taux = brut > 0 ? Math.round(ppMensuel / brut * 10000) / 100 : 0;

  return {
    pp: ppMensuel,
    rate: taux,
    forfait: Math.round(forfaitAn / 12 * 100) / 100,
    reduction: Math.round(totalReductions / 12 * 100) / 100,
    bonusEmploi,
    detail: {
      brut, onss, imposable, annuel, forfaitAn,
      baseAnnuelle, qcAttribue, baseApresQC,
      impotBrut: Math.round(impot * 100) / 100,
      redQE, redEnfants, redParentIsole, redHandicape,
      redConjHandicape, redConjRevLimite, redConjPension, redP65, redAutres,
      totalReductions: Math.round(totalReductions * 100) / 100,
      impotApresReduc: Math.round(impotApresReduc * 100) / 100,
      impotAvecTaxeCom,
      ppMensuel, taux,
      situation, enfants, enfantsHandicapes, dirigeant, isBareme2
    }
  };
}

function calcCSSS(brutMensuel, situation) {
  const brut = brutMensuel;
  const onss = Math.round(brut * TX_ONSS_W * 100) / 100;
  const imposable = brut - onss;
  const annuel = imposable * 12;
  const isolé = !situation || situation === 'isolé';
  const baremes = isolé ? LOIS_BELGES.csss.isolé : LOIS_BELGES.csss.menage2revenus;
  // Seuils CSSS dynamiques depuis LOIS_BELGES
  const s0=baremes[0].max, s1=baremes[1].max, s2=baremes[2]?.max||60181.95;
  const t1=baremes[1].taux, t2=baremes[2]?.taux||0.011;
  const base2=baremes[2]?.montant||9.30;
  const plafond=baremes[baremes.length-1].montantFixe||51.64;
  if (annuel <= s0) return 0;
  if (annuel <= s1) return Math.round((annuel - s0) * t1 / 12 * 100) / 100;
  if (isolé && baremes.length > 4) {
    const s3=baremes[3]?.min||37344.02, t3=baremes[3]?.taux||0.013;
    if (annuel <= s3) return Math.round((base2 + (annuel - s1) * t2) / 12 * 100) / 100;
    if (annuel <= baremes[4]?.min||60181.95) return Math.round((base2 + (s3 - s1) * t2 + (annuel - s3) * t3) / 12 * 100) / 100;
  } else {
    if (annuel <= s2) return Math.round((base2 + (annuel - s1) * t2) / 12 * 100) / 100;
  }
  return Math.round(plafond / 12 * 100) / 100;
}

function calcBonusEmploi(brutMensuel) {
  if (brutMensuel <= 0) return 0;
  const onss = Math.round(brutMensuel * TX_ONSS_W * 100) / 100;
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
}