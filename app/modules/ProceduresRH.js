'use client';
import { useState, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE PROCÉDURES RH — EMBAUCHE & MISE À L'EMPLOI
// 8 procédures complètes A→Z : checklist, formulaires, calculs, base légale
// Aureus Social Pro — v18 — Février 2026
// ═══════════════════════════════════════════════════════════════════════════════

// ─── DATA : 8 PROCÉDURES COMPLÈTES ─────────────────────────────────────────

const PROCEDURES_EMBAUCHE = [

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  1. PREMIER ENGAGEMENT (1er au 6e travailleur)                          ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
{
  id:'premier_engagement', icon:'🥇', categorie:'embauche',
  titre:'Premier engagement (1er au 6e travailleur)',
  resume:"Exonération ONSS patronale pour les 6 premiers travailleurs. Le 1er bénéficie d'une exonération quasi-totale ILLIMITÉE dans le temps.",
  baseLegale:[
    'Loi-programme 10/02/1998, art. 15-20',
    'AR 16/05/2003 modifiant le régime premiers engagements',
    'Loi 26/12/2013, art. 2-8 (réforme premiers engagements)',
    'AR 28/06/2016 (adaptation montants)',
  ],
  qui:"Tout employeur du secteur privé n'ayant JAMAIS occupé simultanément plus de N-1 travailleurs (N = rang de l'engagement). Les intérimaires, flexi-jobs et travailleurs occasionnels COMPTENT dans le calcul.",
  duree:'Illimitée pour le 1er travailleur / 13 trimestres pour le 2e au 6e',
  avantages:[
    {rang:'1er travailleur', detail:"Exonération TOTALE des cotisations patronales de base (±25% du brut) — ILLIMITÉE dans le temps. Économie de ±10.500€/an pour un brut de 3.500€."},
    {rang:'2e travailleur', detail:"-1.550€/trimestre pendant 13 trimestres consécutifs = 20.150€ d'économie totale"},
    {rang:'3e travailleur', detail:"-1.050€/trimestre pendant 13 trimestres = 13.650€ d'économie totale"},
    {rang:'4e travailleur', detail:"-1.050€/trimestre pendant 13 trimestres = 13.650€ d'économie totale"},
    {rang:'5e travailleur', detail:"-1.000€/trimestre pendant 13 trimestres = 13.000€ d'économie totale"},
    {rang:'6e travailleur', detail:"-1.000€/trimestre pendant 13 trimestres = 13.000€ d'économie totale"},
  ],
  etapes:[
    {
      n:1, titre:"Vérifier l'éligibilité employeur",
      detail:"Contrôler via le répertoire ONSS que l'employeur n'a JAMAIS dépassé N-1 travailleurs occupés simultanément.\n\nATTENTION : comptent dans le calcul :\n• Travailleurs sous contrat (CDI, CDD, remplacement)\n• Intérimaires mis à votre disposition\n• Flexi-jobs\n• Travailleurs occasionnels horeca/agriculture\n• Étudiants (hors contingent 600h selon certaines interprétations)\n\nNe comptent PAS :\n• Les dirigeants d'entreprise indépendants\n• Les stagiaires non rémunérés",
      delai:'Avant engagement — indispensable',
      formulaire: null,
      ou:'www.socialsecurity.be → Répertoire employeur → Historique occupation',
      obligatoire: true
    },
    {
      n:2, titre:"Inscription ONSS (nouvel employeur)",
      detail:"Si vous êtes un NOUVEL employeur sans numéro ONSS :\n\n1. Rendez-vous sur le portail de la sécurité sociale\n2. Identification via eID ou itsme\n3. Compléter le formulaire d'identification employeur\n4. Renseigner : numéro d'entreprise BCE, siège social, commission paritaire, activité NACE\n5. Vous recevez un numéro ONSS (format : XXX-XXXXXXX-XX)\n\nCe numéro est indispensable pour la DIMONA, la DmfA et toute communication avec l'ONSS.",
      delai:'Avant le 1er jour de travail',
      formulaire:"Formulaire d'identification employeur ONSS",
      ou:'www.socialsecurity.be → Inscription employeur',
      obligatoire: true
    },
    {
      n:3, titre:"Affilier un Secrétariat Social (recommandé)",
      detail:"Pas obligatoire légalement mais FORTEMENT recommandé. Le secrétariat social agréé gère pour vous :\n• Calcul et versement des salaires\n• Déclarations DIMONA, DmfA, précompte professionnel\n• Documents sociaux (fiches de paie, C4, attestations)\n• Conseil juridique social\n\nSecrétariats sociaux agréés : consultez la liste officielle sur socialsecurity.be.\n\nAlternative : utiliser Aureus Social Pro pour gérer en interne.",
      delai:'Avant le 1er engagement',
      formulaire:"Convention d'affiliation secrétariat social",
      ou:'Secrétariat social agréé (liste sur socialsecurity.be)',
      obligatoire: false
    },
    {
      n:4, titre:"Contrat de travail écrit",
      detail:"Rédiger le contrat en 2 exemplaires originaux signés par les deux parties.\n\nMentions OBLIGATOIRES :\n• Identité complète des parties (nom, adresse, N° national)\n• Date de début d'exécution\n• Fonction / description de poste\n• Lieu de travail\n• Rémunération brute (mensuelle ou horaire)\n• Durée du travail (temps plein 38h/sem ou temps partiel avec horaire fixe/variable)\n• Durée du contrat (CDI = pas de date de fin / CDD = date de fin)\n\nMentions RECOMMANDÉES :\n• Période d'essai (supprimée depuis 2014 mais clause informative)\n• Avantages extra-légaux (chèques-repas, éco-chèques, assurance groupe)\n• Clause de non-concurrence (si applicable)\n• Commission paritaire applicable",
      delai:'Au plus tard le 1er jour de travail (avant le début des prestations)',
      formulaire:'Contrat de travail CDI/CDD',
      ou:'Modèle Aureus Social Pro → Contrats Légaux / Secrétariat social',
      obligatoire: true
    },
    {
      n:5, titre:"DIMONA IN — Déclaration immédiate d'emploi",
      detail:"Déclaration électronique OBLIGATOIRE à effectuer AVANT le début du travail effectif.\n\nContenu de la déclaration :\n• Type : IN (entrée en service)\n• NISS du travailleur (numéro national)\n• Date de début\n• Type de contrat (CDI/CDD)\n• Commission paritaire\n• Numéro ONSS employeur\n\nModes de déclaration :\n• En ligne : www.socialsecurity.be → DIMONA\n• Via batch (fichier XML) pour les secrétariats sociaux\n• Par téléphone : 02 511 51 51 (en dernier recours)\n\n⚠️ SANCTION en cas de non-déclaration ou déclaration tardive :\n• Amende administrative : 2.500€ à 12.500€ par travailleur\n• Poursuites pénales possibles\n• Présomption de travail au noir",
      delai:'AVANT le début du travail effectif (même jour au plus tard)',
      formulaire:'DIMONA type IN (électronique)',
      ou:'www.socialsecurity.be → DIMONA → Nouvelle déclaration IN',
      obligatoire: true
    },
    {
      n:6, titre:"Règlement de travail",
      detail:"OBLIGATOIRE dès le 1er travailleur (Loi 08/04/1965).\n\nContenu MINIMUM obligatoire :\n• Horaires de travail (début, fin, pauses)\n• Modes de mesurage et de contrôle du travail\n• Mode de paiement de la rémunération, périodicité\n• Délais de préavis ou renvoi à la loi\n• Droits et obligations du personnel de surveillance\n• Sanctions disciplinaires, montants des amendes\n• Noms des membres du conseil d'entreprise et du CPPT\n• Dates des vacances annuelles collectives\n• Adresse du service médical et premiers secours\n• Adresse de l'Inspection du Travail compétente\n• Texte des CCT d'entreprise applicables\n• Clause relative au harcèlement moral et sexuel\n\nProcédure d'adoption :\n1. Rédiger le règlement\n2. Afficher pendant 15 jours pour consultation du personnel\n3. Consigner les observations dans un registre\n4. Si pas d'observations → le règlement entre en vigueur\n5. Si observations → tentative de conciliation via Inspection\n6. Déposer au bureau régional du SPF ETCS dans les 8 jours",
      delai:"Dès l'engagement du 1er travailleur / Dépôt dans les 8 jours",
      formulaire:'Règlement de travail + registre des observations',
      ou:'SPF Emploi, Travail et Concertation sociale (ETCS) — Bureau régional Contrôle des lois sociales',
      obligatoire: true
    },
    {
      n:7, titre:"Service Externe de Prévention et Protection (SEPP)",
      detail:"Affiliation OBLIGATOIRE dès le 1er travailleur (Code du bien-être au travail, Livre II).\n\nLe SEPP assure :\n• Surveillance médicale (examens d'embauche, périodiques)\n• Analyse des risques\n• Conseils en prévention\n\nVisite médicale d'embauche OBLIGATOIRE si :\n• Poste de sécurité (conduite d'engins, travail en hauteur)\n• Poste de vigilance (surveillance d'écrans, contrôle aérien)\n• Activité à risque défini (exposition agents chimiques, biologiques, bruit)\n• Contact avec denrées alimentaires\n\nSEPP agréés en Belgique :\n• Mensura (www.mensura.be)\n• Liantis (www.liantis.be)\n• Cohezio (www.cohezio.be)\n• Idewe (www.idewe.be)\n• CESI (www.cesi.be)\n• SPMT-ARISTA (www.spmt-arista.be)\n\nCoût annuel : ±80€ à 180€/travailleur selon le tarif (A/B/C/D).",
      delai:"Avant le 1er jour de travail",
      formulaire:"Convention d'affiliation SEPP + fiche de poste",
      ou:'Mensura / Liantis / Cohezio / Idewe / CESI / SPMT-ARISTA',
      obligatoire: true
    },
    {
      n:8, titre:"Assurance accidents du travail",
      detail:"OBLIGATOIRE (Loi 10/04/1971 sur les accidents du travail).\n\nSouscrire une police d'assurance AT auprès d'un assureur agréé par Fedris.\n\nCouverture :\n• Accidents pendant le travail et sur le chemin du travail\n• Incapacité temporaire : 90% de la rémunération plafonnée\n• Incapacité permanente : rente viagère\n• Frais médicaux, prothèses, réadaptation\n• Décès : rente aux ayants droit\n\n⚠️ SANCTION en l'absence d'assurance :\n• Fedris (ex-FAT) indemnise la victime\n• Puis se retourne contre l'employeur pour récupérer TOUS les frais\n• + Amende pénale + majoration de prime\n• + Responsabilité civile personnelle du dirigeant\n\nAssureurs principaux : Ethias, AG Insurance, AXA, Baloise, Allianz, Generali, Zurich.\n\nPrime annuelle : ±0,5% à 5% de la masse salariale selon le secteur d'activité.",
      delai:"Avant le 1er jour de travail — IMPÉRATIF",
      formulaire:"Police d'assurance accidents du travail",
      ou:'Assureur agréé Fedris : Ethias / AG / AXA / Baloise / Allianz',
      obligatoire: true
    },
    {
      n:9, titre:"DmfA — Activer la réduction premier engagement",
      detail:"La réduction est demandée via la DmfA (déclaration multiFonctionnelle trimestrielle).\n\nCodes réduction à utiliser :\n• 0100 = 1er travailleur → exonération TOTALE, ILLIMITÉE\n• 0101 = 2e travailleur → -1.550€/trimestre pendant 13 trim.\n• 0102 = 3e travailleur → -1.050€/trimestre pendant 13 trim.\n• 0103 = 4e travailleur → -1.050€/trimestre pendant 13 trim.\n• 0104 = 5e travailleur → -1.000€/trimestre pendant 13 trim.\n• 0105 = 6e travailleur → -1.000€/trimestre pendant 13 trim.\n\nPas de formulaire séparé à remplir — tout se fait dans la DmfA.\n\nIMPORTANT : la réduction démarre au trimestre de l'engagement.\n\nLa DmfA doit être introduite au plus tard le dernier jour du mois suivant le trimestre :\n• T1 (jan-mars) → deadline 30 avril\n• T2 (avr-juin) → deadline 31 juillet\n• T3 (juil-sept) → deadline 31 octobre\n• T4 (oct-déc) → deadline 31 janvier",
      delai:'1ère DmfA trimestrielle après engagement',
      formulaire:'DmfA — codes réduction 0100 à 0105',
      ou:'Portail sécurité sociale → DmfA électronique',
      obligatoire: true
    },
    {
      n:10, titre:"Caisse d'allocations familiales — Information",
      detail:"Depuis la régionalisation (01/01/2019), l'employeur n'a plus de démarche à effectuer.\n\nLe travailleur s'adresse directement à sa caisse régionale :\n\n🟡 Wallonie : Famiwal, Parentia, Infino, KidsLife\n🟠 Flandre : Fons, Infino, KidsLife, MyFamily\n🔵 Bruxelles : Famiris, Parentia, Infino, KidsLife\n\nObligation employeur : informer le travailleur de ses droits aux allocations familiales dans le cadre de l'accueil.",
      delai:"Information au travailleur lors de l'accueil",
      formulaire: null,
      ou:'Caisse allocations familiales régionale du travailleur',
      obligatoire: false
    },
    {
      n:11, titre:"Documents sociaux obligatoires",
      detail:"L'employeur doit tenir à jour et conserver les documents suivants :\n\n📋 Documents à établir :\n• Registre général du personnel (dans les 7 jours)\n• Compte individuel par travailleur (annuel)\n• Fiche de paie mensuelle\n• Décompte annuel des rémunérations\n\n📋 Documents à remettre au travailleur :\n• Copie du contrat de travail signé\n• Copie du règlement de travail\n• Fiche de paie à chaque paiement\n• Fiche fiscale 281.10 (annuelle, avant 1er mars)\n\n📋 Conservation :\n• Documents sociaux : 5 ans après la fin du contrat\n• Documents fiscaux : 7 ans\n• Registre du personnel : 5 ans après la dernière inscription",
      delai:"Dans les 7 jours suivant l'engagement",
      formulaire:'Registre du personnel, compte individuel, fiche de paie',
      ou:'Tenu en interne ou via secrétariat social / Aureus Social Pro',
      obligatoire: true
    },
    {
      n:12, titre:"Suivi trimestriel de la réduction ONSS",
      detail:"Chaque trimestre :\n\n✅ Vérifier que le code réduction est bien appliqué dans la DmfA\n✅ Contrôler le montant de la réduction sur le décompte ONSS\n✅ S'assurer que le nombre de travailleurs n'a pas dépassé le seuil\n✅ Conserver toutes les preuves pendant 7 ans minimum\n\nEn cas de doute ou d'erreur :\n• Contacter l'ONSS : 02 511 51 51\n• Introduire une rectification de DmfA\n• Conserver l'historique des corrections\n\n💡 RAPPEL : la réduction du 1er travailleur est ILLIMITÉE — ne jamais oublier de la déclarer, même après des années !",
      delai:'Chaque trimestre — vérification systématique',
      formulaire:'Décompte trimestriel ONSS + vérification DmfA',
      ou:'Portail sécurité sociale → Décompte trimestriel',
      obligatoire: true
    },
  ],
  alertes:[
    "⚠️ TRANSFERT AUTOMATIQUE : si le 1er travailleur quitte l'entreprise, la réduction se transfère automatiquement au travailleur qui le remplace. Ne pas oublier de mettre à jour la DmfA.",
    "⚠️ REPRISE D'ENTREPRISE : en cas de reprise (cession, fusion), les travailleurs repris COMPTENT — pas de remise à zéro du compteur.",
    "⚠️ INTÉRIMAIRES : même si vous n'êtes pas leur employeur juridique, les intérimaires comptent dans le calcul du nombre max de travailleurs occupés.",
    "⚠️ CUMUL : la réduction premier engagement est cumulable avec la réduction structurelle mais PAS avec les autres réductions groupe-cible pour le même travailleur.",
    "⚠️ CONTRÔLE ONSS : l'ONSS peut vérifier rétroactivement sur 7 ans. Conserver TOUS les documents justificatifs.",
  ],
  simulation:{
    titre:"Économie ONSS — 1er travailleur à 3.500€ brut/mois",
    lignes:[
      {label:'Brut mensuel',montant:'3.500,00€'},
      {label:'ONSS patronal normal (25,07%)',montant:'877,45€/mois'},
      {label:'Avec exonération 1er engagement',montant:'≈ 0,00€/mois'},
      {label:'Économie mensuelle',montant:'877,45€/mois',vert:true},
      {label:'Économie annuelle',montant:'10.529,40€/an',vert:true},
      {label:'Économie sur 5 ans',montant:'52.647,00€',vert:true},
      {label:'Économie sur 10 ans',montant:'105.294,00€',vert:true},
    ],
  },
},

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  2. ACTIVA — Demandeur d'emploi longue durée                           ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
{
  id:'activa', icon:'💼', categorie:'embauche',
  titre:'Plan Activa — Demandeur d\'emploi longue durée',
  resume:"Réduction ONSS patronale + allocation de travail déduite du salaire net pour l'engagement d'un demandeur d'emploi inscrit depuis ≥12 mois (régionalisé depuis 2017).",
  baseLegale:[
    'AR 19/12/2001 — promotion de mise à l\'emploi des demandeurs d\'emploi',
    'Loi 22/12/1995, art. 7§1 (mesures de mise à l\'emploi)',
    'Ordonnance bruxelloise 23/06/2017 (Activa.brussels)',
    'Décret wallon 02/02/2017 (aides à l\'emploi — impulsions)',
    'Décret flamand 04/03/2016 (GESCO → réforme)',
  ],
  qui:"Demandeurs d'emploi inoccupés inscrits depuis ≥12 mois (≥6 mois si <30 ans en Wallonie/Bruxelles). Le travailleur doit obtenir sa carte Activa de l'ONEM AVANT l'engagement. Depuis la régionalisation, les conditions varient selon la Région.",
  duree:'6 à 30 mois selon durée d\'inoccupation, âge et Région',
  avantages:[
    {rang:'Réduction ONSS patronale', detail:'-1.000€ à -1.500€/trimestre pendant 6 à 12 trimestres'},
    {rang:'Allocation de travail (ONEM)', detail:'500€/mois déduit du salaire net — payé par l\'ONEM, pas par l\'employeur'},
    {rang:'Bruxelles — Activa.brussels', detail:'Prime à l\'emploi complémentaire : 5.000€ à 15.750€ sur 30 mois via Actiris'},
    {rang:'Wallonie — Impulsion -25 ans', detail:'Aide de 500€/mois pendant 36 mois max pour DE <25 ans inscrit ≥6 mois au Forem'},
    {rang:'Wallonie — Impulsion 25+', detail:'Aide de 500€/mois pendant 24 mois max pour DE ≥25 ans inscrit ≥12 mois'},
    {rang:'Cumul possible', detail:'Cumulable avec la réduction structurelle ONSS (pas avec premier engagement)'},
  ],
  etapes:[
    {
      n:1, titre:"Vérifier l'éligibilité du candidat",
      detail:"Le travailleur doit être inscrit comme demandeur d'emploi inoccupé depuis au moins :\n\n📍 BRUXELLES (Activa.brussels) :\n• ≥12 mois inscription chez Actiris (règle générale)\n• ≥6 mois si <30 ans\n• Domicilié en Région bruxelloise\n\n📍 WALLONIE (Impulsions) :\n• ≥6 mois inscription au Forem si <25 ans\n• ≥12 mois inscription au Forem si 25-57 ans\n• ≥18 mois si ≥58 ans\n\n📍 FLANDRE :\n• Réforme 2016 : remplacement par le système VOP (Vlaamse Ondersteuningspremie) et parcours d'activation VDAB\n\nDemander au candidat son attestation d'inscription auprès de l'organisme régional.",
      delai:'Avant engagement — vérification indispensable',
      formulaire: null,
      ou:'Actiris (BXL) / Forem (WAL) / VDAB (VL) — historique inscription',
      obligatoire: true
    },
    {
      n:2, titre:"Le travailleur demande sa carte Activa à l'ONEM",
      detail:"C'est le TRAVAILLEUR LUI-MÊME qui doit demander la carte Activa.\n\nProcédure :\n1. Le travailleur se rend chez son organisme de paiement :\n   • Syndicat : FGTB (ABVV), CSC (ACV), CGSLB (ACLVB)\n   • Ou : CAPAC (Caisse Auxiliaire de Paiement)\n2. Il demande le formulaire C63\n3. L'organisme transmet la demande à l'ONEM\n4. L'ONEM vérifie les conditions et délivre la carte Activa\n\nLa carte Activa mentionne :\n• Identité du travailleur\n• Durée de l'avantage (nombre de mois)\n• Montant de l'allocation de travail (ex: 500€/mois)\n• Date de validité\n\n⏱️ Délai de traitement : 2 à 4 semaines — anticiper !",
      delai:'AVANT l\'engagement — prévoir 2 à 4 semaines de traitement',
      formulaire:'Formulaire C63 — Demande de carte Activa',
      ou:'ONEM via organisme de paiement (FGTB / CSC / CGSLB / CAPAC)',
      obligatoire: true
    },
    {
      n:3, titre:"Réceptionner et vérifier la carte Activa",
      detail:"À la réception, vérifier IMPÉRATIVEMENT :\n\n✅ Identité du travailleur — correspond au candidat sélectionné\n✅ Durée d'octroi — nombre de mois de l'avantage\n✅ Montant de l'allocation de travail — montant mensuel\n✅ Date de validité — l'engagement DOIT avoir lieu AVANT l'expiration\n✅ Code réduction ONSS applicable\n\nCONSERVER une copie du recto et du verso — c'est votre preuve vis-à-vis de l'ONSS.\n\nSi la carte est expirée : le travailleur doit en redemander une (nouveau C63).",
      delai:'Dès réception — avant signature du contrat',
      formulaire:'Carte Activa (délivrée par ONEM) — vérification',
      ou: null,
      obligatoire: true
    },
    {
      n:4, titre:"Contrat de travail — CDI obligatoire ou CDD ≥ durée Activa",
      detail:"Le contrat de travail DOIT être :\n\n✅ CDI (durée indéterminée) → FORTEMENT RECOMMANDÉ\n✅ OU CDD (durée déterminée) d'une durée AU MOINS ÉGALE à la durée de la carte Activa\n\n❌ Un CDD inférieur à la durée de la carte Activa = PERTE TOTALE de l'avantage\n\nMentions obligatoires : fonction, rémunération brute, horaire, date de début, lieu de travail.\n\nATTENTION : le temps partiel est accepté mais l'allocation de travail est réduite proportionnellement au régime de travail.",
      delai:'Au plus tard le 1er jour de travail',
      formulaire:'Contrat de travail (CDI recommandé)',
      ou:'Modèle Aureus Social Pro / Secrétariat social',
      obligatoire: true
    },
    {
      n:5, titre:"DIMONA IN",
      detail:"Déclaration immédiate d'emploi OBLIGATOIRE — même procédure que tout engagement.\nÀ effectuer AVANT le début effectif du travail.\nVoir procédure Premier Engagement → étape 5 pour les détails complets.",
      delai:'AVANT le 1er jour de travail',
      formulaire:'DIMONA type IN',
      ou:'www.socialsecurity.be → DIMONA',
      obligatoire: true
    },
    {
      n:6, titre:"Formulaire C63 — Compléter la partie employeur",
      detail:"Compléter la PARTIE EMPLOYEUR du formulaire C63 :\n\n• Numéro ONSS employeur\n• Numéro d'entreprise BCE\n• Date d'entrée en service effective\n• Type de contrat (CDI / CDD + date fin)\n• Régime de travail (temps plein / partiel + fraction)\n• Rémunération brute mensuelle\n• Commission paritaire applicable\n• Fonction du travailleur\n\nRenvoyer le C63 complété à :\n→ Bureau de chômage de l'ONEM du domicile du travailleur\n\nCela déclenche officiellement l'activation de l'allocation de travail.",
      delai:'Dans les 4 jours ouvrables suivant l\'engagement',
      formulaire:'C63 — partie employeur',
      ou:'Bureau de chômage ONEM du domicile du travailleur',
      obligatoire: true
    },
    {
      n:7, titre:"DmfA — Code réduction Activa dans la déclaration ONSS",
      detail:"Lors de la déclaration trimestrielle ONSS (DmfA), appliquer le code réduction :\n\n• Code 3400 = allocation de travail + réduction cotisations patronales\n• Code 3401 = réduction cotisations patronales uniquement\n\nInformations à renseigner dans la DmfA :\n• Code réduction (3400 ou 3401)\n• Numéro de la carte Activa\n• Date de début et de fin de la période couverte\n• Montant de la réduction demandée\n\nLe système ONSS calcule automatiquement la réduction applicable.",
      delai:'Chaque DmfA trimestrielle',
      formulaire:'DmfA — code réduction 3400 ou 3401',
      ou:'Portail sécurité sociale → DmfA électronique',
      obligatoire: true
    },
    {
      n:8, titre:"Déduction mensuelle de l'allocation de travail sur la fiche de paie",
      detail:"Chaque mois, le calcul de la paie se fait comme suit :\n\n1. Calculer le salaire brut normal\n2. Calculer les retenues habituelles (ONSS travailleur, PP, CSSS)\n3. Obtenir le salaire NET\n4. DÉDUIRE l'allocation de travail (ex: 500€) du net à verser\n5. Verser au travailleur : NET - allocation de travail\n\nL'ONEM verse directement l'allocation de travail au travailleur via son organisme de paiement.\n\nRésultat pour l'employeur : économie directe de 500€/mois sur le coût salarial.\nRésultat pour le travailleur : il reçoit le même montant total (salaire employeur + allocation ONEM).",
      delai:'Chaque mois — à intégrer dans le calcul de paie',
      formulaire:'Fiche de paie avec mention allocation de travail Activa',
      ou: null,
      obligatoire: true
    },
    {
      n:9, titre:"Formulaire C78 — Attestation mensuelle employeur",
      detail:"Chaque mois, l'employeur doit compléter le formulaire C78 :\n\n📋 Informations à renseigner :\n• Mois concerné\n• Jours effectivement prestés\n• Jours d'absence et motif (maladie, congé, férié, etc.)\n• Rémunération brute du mois\n• Régime de travail appliqué\n\n📮 Envoyer à :\n→ Organisme de paiement du travailleur (syndicat FGTB/CSC/CGSLB ou CAPAC)\n\n⚠️ CRITIQUE : sans le C78, le travailleur NE REÇOIT PAS son allocation de travail de l'ONEM. Conséquence : le travailleur revient vers vous car il manque une partie de sa rémunération.\n\nConseil : automatiser l'envoi du C78 dans le processus de clôture mensuelle de la paie.",
      delai:'Chaque mois — AVANT le 5 du mois suivant',
      formulaire:'Formulaire C78 — Attestation mensuelle Activa',
      ou:'Organisme de paiement du travailleur (FGTB/CSC/CGSLB/CAPAC)',
      obligatoire: true
    },
    {
      n:10, titre:"Bruxelles — Demander la prime Activa.brussels (si applicable)",
      detail:"En Région bruxelloise UNIQUEMENT, l'employeur peut bénéficier d'une prime complémentaire via Actiris :\n\n💰 Montants Activa.brussels :\n• DE < 30 ans, inscrit ≥6 mois : 5.000€ sur 12 mois\n• DE 30-56 ans, inscrit ≥12 mois : 10.000€ sur 24 mois\n• DE ≥57 ans, inscrit ≥12 mois : 15.750€ sur 30 mois\n\nProcédure :\n1. Introduire la demande de prime auprès d'Actiris dans les 3 mois suivant l'engagement\n2. Joindre : copie du contrat, copie de la carte Activa, attestation Actiris\n3. Actiris verse la prime trimestriellement sur le compte de l'employeur\n\n⚠️ Conditions : le travailleur doit être domicilié en Région bruxelloise + inscrit chez Actiris.",
      delai:'Dans les 3 mois suivant l\'engagement',
      formulaire:'Demande de prime Activa.brussels',
      ou:'Actiris — www.actiris.brussels → Employeurs → Aides à l\'emploi → Activa.brussels',
      obligatoire: false
    },
    {
      n:11, titre:"Suivi trimestriel + anticipation fin de période",
      detail:"Chaque trimestre :\n✅ Vérifier la réduction ONSS sur le décompte\n✅ Contrôler le montant exact de la réduction appliquée\n✅ S'assurer que le C78 est envoyé chaque mois\n\nAnticipation FIN de la période Activa :\n📅 3 mois avant la fin :\n• Informer la direction que le coût salarial va augmenter\n• Adapter le budget : le coût augmente de ±500€/mois (allocation) + ±500€/trim (ONSS)\n• Le travailleur GARDE son emploi (CDI oblige)\n• Vérifier si d'autres aides sont disponibles (Groupe-cible, réduction structurelle)",
      delai:'Trimestriel + anticipation 3 mois avant fin',
      formulaire:'Décompte trimestriel ONSS',
      ou: null,
      obligatoire: true
    },
  ],
  alertes:[
    "⚠️ CARTE ACTIVA OBLIGATOIRE : elle DOIT être obtenue AVANT l'engagement. Un engagement avant l'obtention de la carte = perte totale de l'avantage.",
    "⚠️ Le C78 MENSUEL est CRITIQUE — sans lui le travailleur ne reçoit pas son allocation ONEM.",
    "⚠️ CDD < durée carte Activa = PERTE de l'avantage. Privilégier systématiquement le CDI.",
    "⚠️ BRUXELLES : ne pas oublier la prime complémentaire Activa.brussels (jusqu'à 15.750€) — demande dans les 3 mois !",
    "⚠️ Licenciement pendant la période Activa : l'employeur peut devoir rembourser une partie proportionnelle des aides.",
    "⚠️ Le temps partiel réduit proportionnellement l'allocation de travail et la réduction ONSS.",
  ],
  simulation:{
    titre:"Économie totale Activa — Brut 2.800€/mois — DE inscrit 18 mois — Bruxelles",
    lignes:[
      {label:'Réduction ONSS : 1.250€/trim × 8 trimestres',montant:'10.000,00€',vert:true},
      {label:'Allocation travail : 500€/mois × 24 mois',montant:'12.000,00€',vert:true},
      {label:'Prime Activa.brussels (30-56 ans)',montant:'10.000,00€',vert:true},
      {label:'ÉCONOMIE TOTALE sur 24 mois',montant:'32.000,00€',vert:true},
    ],
  },
},

// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  3. ARTICLE 60 §7 CPAS — Mise à l'emploi                               ║
// ╚═══════════════════════════════════════════════════════════════════════════╝
{
  id:'art60', icon:'🏛️', categorie:'embauche',
  titre:"Article 60 §7 CPAS — Mise à l'emploi",
  resume:"Le CPAS met un bénéficiaire du revenu d'intégration (RIS) à disposition d'un employeur-utilisateur. Le CPAS reste l'employeur juridique et supporte l'essentiel du coût salarial.",
  baseLegale:[
    'Loi organique des CPAS 08/07/1976, art. 60 §7',
    'Loi 26/05/2002 sur le droit à l\'intégration sociale',
    'AR 11/07/2002 portant règlement général en matière de droit à l\'intégration sociale',
    'Circulaire ministérielle 06/09/2002 — mise à l\'emploi art. 60§7',
  ],
  qui:"Bénéficiaires du Revenu d'Intégration Sociale (RIS) ou de l'aide sociale équivalente. La décision de mise à l'emploi appartient au CPAS — l'employeur-utilisateur ne peut pas imposer un candidat.",
  duree:"Minimum = durée nécessaire pour ouvrir le droit aux allocations de chômage : 12 mois (si <36 ans) à 24 mois (si ≥50 ans). Maximum = pas de limite légale mais renouvelable.",
  avantages:[
    {rang:'Coût quasi-nul pour l\'employeur', detail:"Le CPAS prend en charge le salaire brut complet. L'employeur-utilisateur rembourse un montant convenu (partiel, voire 0€ selon la convention)."},
    {rang:'Pas de gestion administrative', detail:"Le CPAS est l'employeur juridique → DIMONA, ONSS, DmfA, fiche de paie = tout est géré par le CPAS."},
    {rang:'Exonération ONSS pour le CPAS', detail:"Le CPAS bénéficie d'une exonération quasi-totale des cotisations patronales + subside fédéral SPP Intégration Sociale."},
    {rang:'Main-d\'œuvre qualifiée', detail:"Le CPAS propose des profils variés : administratif, technique, logistique, accueil, entretien, informatique."},
    {rang:'Tremplin vers un engagement propre', detail:"Après la période Art. 60, possibilité d'engager le travailleur directement avec des aides Activa / premier engagement."},
  ],
  etapes:[
    {
      n:1, titre:"Contacter le CPAS de la commune",
      detail:"Prendre contact avec le service 'Mise à l'emploi' ou 'Insertion socioprofessionnelle' ou 'Article