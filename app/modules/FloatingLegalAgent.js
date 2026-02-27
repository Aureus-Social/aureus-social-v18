"use client";
// ═══════════════════════════════════════════════════════════════
//  AUREUS SOCIAL PRO — Agent IA Juridique v30
//  Chat contextuel + Simulateur coût + FAQ juridique + Alertes
//  Drop-in replacement pour FloatingLegalAgent dans le monolithe
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from 'react';
import { simulerCoutEmployeur, calculerPreavis, checkAlertesLegales } from '../lib/agent-simulateur';

// ── Couleurs Aureus ──
const G = '#c6a34e', BG = '#0c0f1a', CARD = 'rgba(255,255,255,.05)';
const sev = { critique: '#ef4444', haute: '#f97316', moyenne: '#eab308', info: '#3b82f6' };

// ── Labels trilingues ──
const LB = {
  fr: { title: 'Agent IA Juridique', sub: 'Droit Social Belge', send: 'Envoyer', clear: 'Effacer',
    placeholder: 'Posez votre question en droit social belge...', thinking: 'Analyse en cours...',
    tabs: { chat: 'Chat', sim: 'Simulateur', faq: 'FAQ', alertes: 'Alertes' },
    simLabels: { brut: 'Salaire brut mensuel', statut: 'Statut', cp: 'Commission paritaire',
      premier: '1er engagement', cr: 'Chèques-repas', eco: 'Éco-chèques', tel: 'Télétravail',
      calc: 'Calculer', result: 'Résultat', cout: 'Coût employeur', net: 'Net approx', ratio: 'Ratio' },
  },
  nl: { title: 'Juridische AI Agent', sub: 'Belgisch Sociaal Recht', send: 'Verzenden', clear: 'Wissen',
    placeholder: 'Stel uw vraag over Belgisch sociaal recht...', thinking: 'Analyse bezig...',
    tabs: { chat: 'Chat', sim: 'Simulator', faq: 'FAQ', alertes: 'Meldingen' },
    simLabels: { brut: 'Bruto maandloon', statut: 'Statuut', cp: 'Paritair comité',
      premier: '1ste aanwerving', cr: 'Maaltijdcheques', eco: 'Ecocheques', tel: 'Thuiswerk',
      calc: 'Berekenen', result: 'Resultaat', cout: 'Werkgeverskost', net: 'Netto approx', ratio: 'Ratio' },
  },
  en: { title: 'Legal AI Agent', sub: 'Belgian Social Law', send: 'Send', clear: 'Clear',
    placeholder: 'Ask your Belgian social law question...', thinking: 'Analyzing...',
    tabs: { chat: 'Chat', sim: 'Simulator', faq: 'FAQ', alertes: 'Alerts' },
    simLabels: { brut: 'Monthly gross salary', statut: 'Status', cp: 'Joint committee',
      premier: '1st hire', cr: 'Meal vouchers', eco: 'Eco-vouchers', tel: 'Remote work',
      calc: 'Calculate', result: 'Result', cout: 'Employer cost', net: 'Net approx', ratio: 'Ratio' },
  },
};

// ── Quick actions trilingues ──
const QUICK = {
  fr: [
    { i: '💰', l: 'Simulation coût', p: 'Combien me coûte un employé à 3000€ brut en CP 200?' },
    { i: '⏱️', l: 'Calcul préavis', p: 'Calcule le préavis pour un employé avec 7 ans d\'ancienneté' },
    { i: '📋', l: 'Info CP', p: 'Quelles sont les règles spécifiques de la CP ' },
    { i: '🏢', l: 'Créer dossier', p: 'Crée un dossier pour ' },
    { i: '👤', l: 'Ajouter travailleur', p: 'Ajoute un travailleur ' },
    { i: '📊', l: 'Chèques-repas', p: 'Comment fonctionnent les chèques-repas? Montants max 2026?' },
    { i: '📄', l: 'Documents sortie', p: 'Quels documents dois-je fournir lors d\'un licenciement?' },
    { i: '💶', l: 'ONSS 2026', p: 'Quels sont les taux ONSS patronaux et travailleurs en 2026?' },
  ],
  nl: [
    { i: '💰', l: 'Kostensimulatie', p: 'Hoeveel kost een werknemer aan 3000€ bruto in PC 200?' },
    { i: '⏱️', l: 'Opzegtermijn', p: 'Bereken de opzegtermijn voor 7 jaar anciënniteit' },
    { i: '📋', l: 'Info PC', p: 'Wat zijn de regels van PC ' },
    { i: '🏢', l: 'Dossier aanmaken', p: 'Maak een dossier aan voor ' },
    { i: '👤', l: 'Werknemer toevoegen', p: 'Voeg een werknemer toe ' },
    { i: '📊', l: 'Maaltijdcheques', p: 'Hoe werken maaltijdcheques? Maximumbedragen 2026?' },
  ],
  en: [
    { i: '💰', l: 'Cost simulation', p: 'How much does an employee at 3000€ gross cost in JC 200?' },
    { i: '⏱️', l: 'Notice period', p: 'Calculate notice period for 7 years seniority' },
    { i: '📋', l: 'JC info', p: 'What are the rules of Joint Committee ' },
    { i: '💶', l: 'NSSO 2026', p: 'What are the employer and employee NSSO rates in 2026?' },
  ],
};

// ══════════════════════════════════════════════════════════════════════
//  LOCAL KB — Recherche par mots-clés (fallback si API indisponible)
// ══════════════════════════════════════════════════════════════════════
const LOCAL_KB = [
  { q: ['préavis','preavis','opzeg','notice','licenciement','ontslag'], a: '**Préavis — Loi 26/12/2013 (Statut unique)**\n\nPar l\'employeur: 0-3m→1sem, 3-6m→3sem, 1an→5sem, 2ans→7sem, 3→9, 4→12, 5→15, 6→18, 7→21, 8→24, 10→27, 15→39, 20→52, 25→65sem.\nPar le travailleur: ~moitié, max 13 semaines.\n\nMotif grave (art. 35): pas de préavis, notification 3j ouvrables.\nOutplacement obligatoire si préavis ≥30 semaines.\n\n📋 Loi 26/12/2013, art. 37/2-37/11' },
  { q: ['dimona','déclaration immédiate','aangifte','embauche'], a: '**Dimona — Déclaration Immédiate**\n\nIN: AVANT le 1er jour de travail\nOUT: Le dernier jour\nSTU: Étudiants | FLX: Flexi-jobs\n\nDonnées: NISS, matricule ONSS, dates, type, CP.\nSanction: 2.750€ à 13.750€/travailleur.\n\n📋 AR 5/11/2002, Code pénal social art. 181' },
  { q: ['onss','rsz','cotisation','patronal','sécurité sociale'], a: '**Cotisations ONSS 2026**\n\nTravailleur: 13,07% | Employeur: ~25,07%\nOuvriers: brut × 108% puis taux.\nPas de plafond ONSS en Belgique.\n\nRéductions: 1er engagement (exonération), bas salaires, travailleurs âgés.\nPaiement: provisions le 5 du mois + solde trimestriel.\n\n📋 Loi 27/06/1969' },
  { q: ['chèques-repas','maaltijdcheque','meal','repas'], a: '**Chèques-repas 2026**\n\nValeur max: 8,00€/jour | Part patronale max: 6,91€ | Part min travailleur: 1,09€\nExonéré ONSS + fiscal si: CCT/accord écrit, 1/jour presté, nominatif, validité 12 mois, format électronique.\n\n📋 AR 28/11/1969, art. 19bis §2' },
  { q: ['étudiant','student','jobiste','650h'], a: '**Travail étudiant 2026**\n\n650h/an à cotisations réduites (8,14% total).\nDimona STU obligatoire. 3j d\'essai auto. COE avant début.\nMin 15 ans. Max 20h/sem en période scolaire.\nVérif: student@work.be\n\n📋 Loi 3/7/1978, Titre VII' },
  { q: ['maladie','ziekte','sick','incapacité','garanti'], a: '**Maladie — Salaire garanti**\n\nEmployé: 30j à 100% (employeur), puis mutuelle 60%.\nOuvrier: J1-7→100%, J8-14→85,88%, J15-30→mix.\nCertificat 48h. Rechute <14j = continuation.\n\n📋 Loi 3/7/1978, art. 52-75' },
  { q: ['vacances','congé','verlof','pécule','vakantie'], a: '**Vacances annuelles 2026**\n\n20j/an. Simple pécule (salaire normal) + Double pécule (92% brut).\nEmployés: payé par employeur. Ouvriers: payé par ONVA.\nRetenue 13,07% sur double pécule.\n\n10 jours fériés légaux: 1/1, L.Pâques, 1/5, Ascension, L.Pentecôte, 21/7, 15/8, 1/11, 11/11, 25/12.\n\n📋 Lois coord. 28/06/1971' },
  { q: ['flexijob','flexi'], a: '**Flexi-job 2026**\n\n4/5 chez autre employeur (T-3) OU pensionné.\nONSS patron: 28% | Travailleur: 0% | PP: 0%.\nMax 12.000€/an exonéré.\n\n📋 Loi 16/11/2015' },
  { q: ['télétravail','thuiswerk','remote','homeworking'], a: '**Télétravail 2026**\n\nStructurel (CCT 85): avenant obligatoire.\nOccasionnel (Loi 5/3/2017): pas d\'avenant.\n\nIndemnités exonérées: Bureau ~154,74€/m + Internet 20€ + PC 20€ + Écran 20€.\n\n📋 CCT n°85, Loi 5/3/2017' },
  { q: ['premier','engagement','eerste','réduction'], a: '**Premiers engagements**\n\n1er: exonération quasi-totale ONSS (illimitée) ≈ 4.500€/an.\n2ème: -1.550€/trim (5 trim) | 3ème: -1.050€/trim (9 trim)\n4ème-6ème: -1.000€/trim (13 trim).\n\n📋 AR 16/5/2003' },
  { q: ['cct 90','bonus','prime','non récurrent'], a: '**Bonus CCT 90 — 2026**\n\nPlafond ONSS: ~4.020€ | Fiscal: ~3.496€.\nONSS employeur: 33,07% | Travailleur: 0% | PP: 0%.\nObjectifs collectifs, mesurables, min 3 mois.\n\n📋 CCT n°90, Loi 21/12/2007' },
  { q: ['contrat','contract','cdi','cdd','temps partiel'], a: '**Contrats de travail**\n\nCDI: forme libre. CDD: écrit AVANT début, sinon → CDI. Max 4×3m/2ans.\nTemps partiel: écrit, min 1/3 temps plein.\nEssai supprimé depuis 2014 (sauf étudiants 3j).\n\n📋 Loi 3/7/1978' },
  { q: ['motif grave','faute grave','dringende reden'], a: '**Motif grave — Art. 35**\n\nRend impossible la poursuite du contrat.\nProcédure: constatation → 3j notification → 3j motivation par recommandé.\nPas de préavis, pas d\'indemnité.\nPreuve à charge de l\'employeur.\n\n📋 Art. 35 Loi 3/7/1978' },
  { q: ['index','indexation','indexering','barème','rmmmg'], a: '**Indexation 2026**\n\nCP 200: indexation annuelle en janvier (~2%).\nRMMMG: 2.070,48€/mois (18 ans+).\nIndex santé lissé. Index-pivot → +2% fonction publique.\n\n📋 Loi 2/8/1971' },
  { q: ['saisie','cession','pension alimentaire'], a: '**Saisie sur salaire 2026**\n\n≤1.260€: insaisissable | 1.260-1.353€: 20% | 1.353-1.493€: 30% | 1.493-1.634€: 40% | >1.634€: illimité.\n+78€/enfant à charge.\nPension alimentaire: pas de quotité insaisissable.\n\n📋 Code judiciaire art. 1409-1412' },
  { q: ['inspection','contrôle','amende','sanction'], a: '**Inspection & Sanctions**\n\nNiveau 1: 10-100€ | Niveau 2: 50-500€ | Niveau 3: 100-1.000€ | Niveau 4: prison 6m-3ans + 600-6.000€.\n×8 décimes. ×nb travailleurs.\n\n📋 Code pénal social (Loi 6/6/2010)' },
  { q: ['voiture','société','atn','mobilité','company car'], a: '**Voiture de société — ATN 2026**\n\nATN = Val.catalogue × %CO2 × 6/7 × correction. Min 4%. Min 1.600€/an.\nDégressivité -6%/an (min 70%).\nBudget mobilité: 3 piliers (voiture éco/mobilité durable/cash-38,07%).\n\n📋 Art. 36 CIR 92, Loi 17/3/2019' },
  { q: ['heures sup','overtime','supplémentaire','38h'], a: '**Heures supplémentaires**\n\n38h/sem légal. Max 11h/jour, 50h/sem.\nSursalaire: +50% (ouvrable), +100% (dimanche/férié).\nMax 143h/an (360h avec volontariat).\nAvantage fiscal: -66,81%.\n\n📋 Loi 16/3/1971' },
  { q: ['précompte','bedrijfsvoorheffing','pp','impôt','fiscal'], a: '**Précompte professionnel 2026**\n\n0→16.310€: 26,75% | 16.310→28.790€: 42,80% | 28.790→49.820€: 48,15% | >49.820€: 53,50%.\nFrais pro: 30% (max 5.930€).\nDéclaration PP 274: mensuel (>50 trav) ou trimestriel.\n\n📋 CIR 92, art. 270-275' },
  { q: ['rgpd','gdpr','données','privacy'], a: '**RGPD Employeur**\n\nBase légale: exécution contrat (Art. 6.1.b).\nRegistre art. 30 obligatoire. DPO si >250 trav.\nRétention: fiches paie 5 ans, docs ONSS 7 ans.\nSanctions: 20M€ ou 4% CA.\n\n📋 RGPD 2016/679, Loi belge 30/7/2018' },
  { q: ['accident','travail','arbeidsongeval'], a: '**Accident du travail**\n\nAssurance AT obligatoire. Déclaration 8j.\nIT totale: 90%. IP: rente viagère.\nTrajet domicile-travail = couvert.\n\n📋 Loi 10/4/1971' },
  { q: ['crédit-temps','tijdskrediet','congé parental'], a: '**Crédit-temps 2026**\n\nSans motif: SUPPRIMÉ. Avec motif: max 51 mois.\nFin carrière (55+): mi-temps ou 4/5.\nCongé parental: 4m temps plein/8m mi-temps/20m 1/5, par enfant <12 ans.\n\n📋 CCT n°103' },
  { q: ['c4','chômage','werkloosheid','sortie'], a: '**Documents de sortie**\n\nC4: certificat chômage (obligatoire). C131A: attestation vacances.\nDécompte final. Attestation d\'occupation. Fiche 281.10.\nDimona OUT le dernier jour.\n\n📋 AR 25/11/1991' },
  { q: ['transport','déplacement','vélo','domicile'], a: '**Transport domicile-travail**\n\nTransport en commun: remboursement min 80% SNCB.\nVélo: 0,35€/km exonéré illimité.\nCumul vélo+train possible.\n\n📋 CCT n°19/9' },
  { q: ['non-concurrence','écolage','clause'], a: '**Clauses spéciales**\n\nNon-concurrence: salaire >39.422€/an, max 12 mois, indemnité 50%.\nÉcolage: formation >80h, salaire >41.969€, max 3 ans (100/66/33%).\n\n📋 Loi 3/7/1978' },
  { q: ['eco-chèque','écochèque','écologique'], a: '**Éco-chèques 2026**\n\nMax 250€/an. Exonéré ONSS + fiscal.\nFormat électronique. Validité 24 mois.\nAchats: appareils économes, vélo, bio, solaire.\n\n📋 CCT n°98' },
  { q: ['dmfa','trimestrielle','déclaration onss'], a: '**DmfA trimestrielle**\n\nT1→30/04, T2→31/07, T3→31/10, T4→31/01.\nContenu: rémunérations, cotisations, jours, réductions.\nFormat XML. Sanction: majorations de retard.\n\n📋 Loi 27/06/1969' },
  { q: ['belcotax','281','fiche fiscale'], a: '**Belcotax — Fiches 281**\n\n281.10: Salariés. 281.20: Dirigeants.\nDélai: 28/02 via Belcotax on web (XML).\nSanction: 50-1.250€/fiche.\n\n📋 Art. 57 CIR 92' },
  { q: ['pension','retraite','pensioen','âge'], a: '**Pension 2026**\n\nÂge légal: 66 ans (67 dès 2030).\nAnticipée: 63+42ans, 61+44ans, 60+44ans.\n2ème pilier: assurance groupe. 3ème: épargne-pension (30% sur 1.020€).\n\n📋 Loi 21/5/2015' },
  { q: ['harcèlement','bien-être','welzijn','psychosociaux','burnout'], a: '**Bien-être — Risques psychosociaux**\n\nAnalyse risques obligatoire. Personne de confiance + CPAP.\nPlaignant protégé contre licenciement.\nCPPT obligatoire dès 50 travailleurs.\n\n📋 Loi 4/8/1996, AR 10/4/2014' },
  { q: ['règlement','travail','arbeidsreglement'], a: '**Règlement de travail**\n\nObligatoire dès le 1er travailleur.\nMentions: horaires, paiement, préavis, sanctions, CPPT.\nModification: affichage 15j + registre remarques.\n\n📋 Loi 8/4/1965' },
  { q: ['intérim','uitzendarbeid','temporaire'], a: '**Intérim**\n\nMotifs: remplacement, surcroît, exceptionnel.\nMax 2 ans même poste. 3j essai. Égalité salariale.\nCP 322.\n\n📋 Loi 24/7/1987' },
  { q: ['registre','personnel','document','obligation sociale'], a: '**Documents sociaux obligatoires**\n\n1. Règlement de travail 2. Registre du personnel 3. Compte individuel 4. Fiche de paie 5. Dimona 6. Contrats écrits 7. Bilan social (20+ ETP).\nConservation: 5 ans min après fin contrat.\n\n📋 AR 8/8/1980' },
  { q: ['coût','employeur','combien coûte','werkgeverskost'], a: '**Coût employeur rapide**\n\nCoût ≈ Brut × 1,55-1,65 (sans avantages)\nCoût ≈ Brut × 1,70-1,85 (avec chèques-repas, éco, etc.)\n\nDétail: Brut + ONSS 25,07% + Pécule 15,38%/12 + 13ème/12 + AT + Médecine + Avantages.\n\n💡 Utilisez l\'onglet Simulateur pour un calcul précis!' },
];

function searchKB(query) {
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const entry of LOCAL_KB) {
    for (const keyword of entry.q) {
      if (q.includes(keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) return entry.a;
    }
  }
  return null;
}

function detectLang(t) {
  const nl = /\b(de|het|een|van|voor|met|werknemer|loon|opzeg|contract|paritair|verlof|ontslag)\b/gi;
  const fr = /\b(le|la|les|des|une|pour|avec|salaire|préavis|contrat|commission|congé|licenciement|travailleur)\b/gi;
  const nc = (t.match(nl) || []).length, fc = (t.match(fr) || []).length;
  if (nc > fc + 2) return 'nl'; if (fc > nc + 2) return 'fr';
  if (/[àâéèêëïîôùûüç]/.test(t)) return 'fr';
  if (/\b(the|is|are|employee|salary|notice|contract)\b/i.test(t)) return 'en';
  return 'fr';
}

// ── Styles constants ──
const btnStyle = (active) => ({
  padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
  fontSize: 11, fontWeight: active ? 700 : 400, fontFamily: 'inherit',
  background: active ? 'rgba(198,163,78,.18)' : 'transparent',
  color: active ? G : 'rgba(198,163,78,.4)', transition: 'all .2s',
});

// ══════════════════════════════════════════════════════════════════════
//  COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════
export default function FloatingLegalAgent({ onAction, state, supabase }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('chat');
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState('');
  const [loading, setLoading] = useState(false);
  const [lang, setLang] = useState('fr');
  const [unread, setUnread] = useState(0);
  const [alertes, setAlertes] = useState([]);

  // Simulateur state
  const [simParams, setSimParams] = useState({
    brutMensuel: 3000, statut: 'employe', cp: '200',
    premierEngagement: false, chequesRepasPatronal: 6.91,
    ecoChequesAn: 250, teletravail: false, treizieme: true,
  });
  const [simResult, setSimResult] = useState(null);

  const endRef = useRef(null);
  const inpRef = useRef(null);

  const lb = LB[lang] || LB.fr;
  const quick = QUICK[lang] || QUICK.fr;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, loading]);
  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inpRef.current?.focus(), 150); } }, [open]);

  // Check alertes when state changes
  useEffect(() => {
    if (state) {
      const company = state.selectedClient || state.company || {};
      const emps = state.emps || state.employees || [];
      const al = checkAlertesLegales(company, emps);
      setAlertes(al);
      if (al.filter(a => a.severity === 'critique').length > 0 && !open) {
        setUnread(prev => prev + al.filter(a => a.severity === 'critique').length);
      }
    }
  }, [state?.selectedClient, state?.emps]);

  // Parse actions from AI response
  const parseActions = useCallback((text) => {
    const match = text.match(/\|\|\|ACTION\|\|\|([\s\S]*?)\|\|\|END\|\|\|/);
    if (match) {
      try {
        const actionData = JSON.parse(match[1].trim());
        if (onAction) onAction(actionData);
      } catch (e) { console.warn('Action parse error:', e); }
      return text.replace(/\|\|\|ACTION\|\|\|[\s\S]*?\|\|\|END\|\|\|/, '').trim();
    }
    return text;
  }, [onAction]);

  // Send message
  const send = useCallback(async (text) => {
    if (!text.trim() || loading) return;
    const dl = detectLang(text); setLang(dl);
    const um = { role: 'user', content: text.trim() };
    const nm = [...msgs, um]; setMsgs(nm); setInp(''); setLoading(true);

    // Build context from app state
    const context = {};
    if (state) {
      if (state.selectedClient) context.company = state.selectedClient;
      if (state.emps) context.employees = state.emps.slice(0, 15).map(e => ({
        nom: e.nom, prenom: e.prenom, fonction: e.fn || e.fonction,
        salaireBrut: e.sal || e.salaireBrut, statut: e.statut, contrat: e.contrat,
      }));
      if (state.page) context.currentPage = state.page;
    }

    try {
      const res = await fetch('/api/agent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nm.map(m => ({ role: m.role, content: m.content })), lang: dl, context }),
      });
      const data = await res.json();

      if (data.text && !data.fallback) {
        const clean = parseActions(data.text);
        setMsgs([...nm, { role: 'assistant', content: clean }]);
      } else {
        throw new Error('fallback');
      }
    } catch (e) {
      // Fallback: local KB
      const kbAnswer = searchKB(text);
      if (kbAnswer) {
        setMsgs([...nm, { role: 'assistant', content: kbAnswer }]);
      } else {
        const fallbackMsg = lang === 'nl'
          ? 'Ik heb geen specifiek antwoord. Probeer trefwoorden: préavis, dimona, ONSS, chèques-repas, maladie, vacances, flexijob, indexation, contrat, C4...'
          : lang === 'en'
          ? 'I don\'t have a specific answer. Try keywords: notice period, dimona, NSSO, meal vouchers, sick leave, holidays, flexijob, indexation, contract...'
          : 'Je n\'ai pas de réponse spécifique. Essayez des mots-clés: **préavis, dimona, ONSS, chèques-repas, maladie, vacances, flexijob, index, contrat, C4, heures sup, bonus CCT 90, précompte, RGPD**...\n\n💡 Ou utilisez l\'onglet **Simulateur** pour calculer un coût employeur.';
        setMsgs([...nm, { role: 'assistant', content: fallbackMsg }]);
      }
    } finally { setLoading(false); }
  }, [msgs, loading, lang, state, parseActions]);

  // Simulateur
  const runSim = () => {
    const result = simulerCoutEmployeur(simParams);
    setSimResult(result);
  };

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════
  const critCount = alertes.filter(a => a.severity === 'critique').length;

  return <>
    {/* CSS Animations */}
    <style>{`
      @keyframes agentPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
      @keyframes agentSlideIn{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
      @keyframes dotPulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}
      .agent-msg a{color:${G};text-decoration:underline}
      .agent-msg strong,.agent-msg b{color:${G}}
      .agent-msg h1,.agent-msg h2,.agent-msg h3{color:${G};margin:8px 0 4px;font-size:13px}
      .sim-input{width:100%;padding:8px 10px;border-radius:8px;border:1px solid rgba(198,163,78,.15);background:rgba(255,255,255,.04);color:#e8e4dc;font-size:12px;font-family:inherit;outline:none}
      .sim-input:focus{border-color:rgba(198,163,78,.4)}
      .sim-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.03)}
      .sim-label{color:#9e9b93;font-size:11px}.sim-val{color:#e8e4dc;font-weight:600;font-size:11px}
    `}</style>

    {/* ── Bouton flottant ── */}
    <button onClick={() => setOpen(!open)} style={{
      position: 'fixed', bottom: 24, right: 24, width: 60, height: 60, borderRadius: 16,
      background: `linear-gradient(135deg, ${G}, #8b6914)`, border: 'none', cursor: 'pointer',
      boxShadow: '0 8px 30px rgba(198,163,78,.4)', zIndex: 9999, transition: 'all .3s',
      transform: open ? 'scale(0.9) rotate(45deg)' : 'scale(1) rotate(0deg)',
    }}>
      <span style={{ fontSize: open ? 26 : 28, color: '#0d0d0d', fontWeight: 700 }}>{open ? '✕' : '⚖️'}</span>
      {(unread > 0 || critCount > 0) && !open && <span style={{
        position: 'absolute', top: -4, right: -4, width: 22, height: 22, borderRadius: '50%',
        background: critCount > 0 ? '#ef4444' : '#f97316', color: '#fff', fontSize: 11, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #060810',
      }}>{critCount || unread}</span>}
    </button>

    {/* ── Fenêtre Agent ── */}
    {open && <div style={{
      position: 'fixed', bottom: 96, right: 24, width: 420, height: 600,
      background: BG, border: '1px solid rgba(198,163,78,.2)', borderRadius: 20,
      boxShadow: '0 20px 60px rgba(0,0,0,.7)', zIndex: 9998, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', animation: 'agentSlideIn .3s ease-out',
    }}>

      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid rgba(198,163,78,.12)',
        background: 'linear-gradient(135deg,rgba(198,163,78,.08),rgba(198,163,78,.02))',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: `linear-gradient(135deg,${G},#8b6914)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#0d0d0d',
            }}>⚖️</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: G }}>{lb.title}</div>
              <div style={{ fontSize: 9, color: 'rgba(198,163,78,.4)' }}>{lb.sub} — Aureus Social Pro</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {['fr', 'nl', 'en'].map(l => <button key={l} onClick={() => setLang(l)} style={{
              padding: '2px 7px', borderRadius: 5, border: 'none', fontSize: 9, fontWeight: 600,
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: .5, fontFamily: 'inherit',
              background: lang === l ? 'rgba(198,163,78,.2)' : 'transparent',
              color: lang === l ? G : 'rgba(198,163,78,.25)',
            }}>{l}</button>)}
          </div>
        </div>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {Object.entries(lb.tabs).map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              ...btnStyle(tab === k), flex: 1, position: 'relative',
            }}>
              {v}
              {k === 'alertes' && critCount > 0 && <span style={{
                position: 'absolute', top: 2, right: 4, width: 6, height: 6,
                borderRadius: '50%', background: '#ef4444',
              }} />}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ TAB: CHAT ═══ */}
      {tab === 'chat' && <>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {msgs.length === 0 && <div style={{ textAlign: 'center', padding: '16px 8px' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚖️</div>
            <div style={{ fontSize: 12, color: 'rgba(198,163,78,.5)', marginBottom: 14, lineHeight: 1.5 }}>
              {lb.placeholder}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {quick.map((q, i) => <button key={i} onClick={() => { setInp(q.p); inpRef.current?.focus(); }} style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '7px 8px',
                background: 'rgba(198,163,78,.04)', border: '1px solid rgba(198,163,78,.08)', borderRadius: 8,
                color: 'rgba(232,228,220,.6)', fontSize: 10.5, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}><span style={{ fontSize: 13 }}>{q.i}</span><span>{q.l}</span></button>)}
            </div>
          </div>}

          {msgs.map((m, i) => <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div className={m.role === 'assistant' ? 'agent-msg' : ''} style={{
              maxWidth: '88%', padding: m.role === 'user' ? '8px 12px' : '10px 14px',
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? `linear-gradient(135deg,${G},#a07d3e)` : CARD,
              color: m.role === 'user' ? '#0d0d0d' : '#e8e4dc', fontSize: 11.5, lineHeight: 1.6,
              fontFamily: 'inherit', border: m.role === 'user' ? 'none' : '1px solid rgba(198,163,78,.08)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {m.role === 'assistant' && <div style={{
                display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, paddingBottom: 6,
                borderBottom: '1px solid rgba(198,163,78,.08)',
              }}>
                <span style={{ fontSize: 9, color: G, fontWeight: 600, letterSpacing: .5, textTransform: 'uppercase' }}>Aureus Legal AI</span>
              </div>}
              {m.content}
            </div>
          </div>)}

          {loading && <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px' }}>
            {[0, 1, 2].map(i => <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: G,
              animation: `dotPulse 1.2s ease-in-out ${i * .2}s infinite`,
            }} />)}
            <span style={{ fontSize: 10, color: 'rgba(198,163,78,.35)', fontStyle: 'italic' }}>{lb.thinking}</span>
          </div>}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '10px 12px', borderTop: '1px solid rgba(198,163,78,.1)',
          display: 'flex', gap: 8, flexShrink: 0, background: 'rgba(0,0,0,.2)',
        }}>
          <input ref={inpRef} value={inp} onChange={e => setInp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(inp)}
            placeholder={lb.placeholder}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(198,163,78,.12)',
              background: 'rgba(255,255,255,.04)', color: '#e8e4dc', fontSize: 12, fontFamily: 'inherit', outline: 'none',
            }} />
          <button onClick={() => send(inp)} disabled={loading || !inp.trim()} style={{
            padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: inp.trim() ? `linear-gradient(135deg,${G},#e2c878)` : 'rgba(198,163,78,.1)',
            color: inp.trim() ? '#060810' : 'rgba(198,163,78,.3)', fontWeight: 700, fontSize: 11, fontFamily: 'inherit',
          }}>↑</button>
        </div>
      </>}

      {/* ═══ TAB: SIMULATEUR ═══ */}
      {tab === 'sim' && <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: G, marginBottom: 12 }}>
          💰 {lb.simLabels.cout}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>{lb.simLabels.brut} (€)</label>
            <input className="sim-input" type="number" value={simParams.brutMensuel}
              onChange={e => setSimParams(p => ({ ...p, brutMensuel: +e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>{lb.simLabels.statut}</label>
              <select className="sim-input" value={simParams.statut}
                onChange={e => setSimParams(p => ({ ...p, statut: e.target.value }))}>
                <option value="employe">Employé</option>
                <option value="ouvrier">Ouvrier</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>{lb.simLabels.cp}</label>
              <input className="sim-input" value={simParams.cp}
                onChange={e => setSimParams(p => ({ ...p, cp: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>{lb.simLabels.cr} (€)</label>
              <input className="sim-input" type="number" step="0.01" value={simParams.chequesRepasPatronal}
                onChange={e => setSimParams(p => ({ ...p, chequesRepasPatronal: +e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>{lb.simLabels.eco} (€/an)</label>
              <input className="sim-input" type="number" value={simParams.ecoChequesAn}
                onChange={e => setSimParams(p => ({ ...p, ecoChequesAn: +e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              { key: 'premierEngagement', label: lb.simLabels.premier },
              { key: 'teletravail', label: lb.simLabels.tel },
              { key: 'treizieme', label: '13ème mois' },
            ].map(({ key, label }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#9e9b93', cursor: 'pointer' }}>
                <input type="checkbox" checked={simParams[key]}
                  onChange={e => setSimParams(p => ({ ...p, [key]: e.target.checked }))}
                  style={{ accentColor: G }} />
                {label}
              </label>
            ))}
          </div>
          <button onClick={runSim} style={{
            padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg,${G},#e2c878)`, color: '#060810',
            fontWeight: 700, fontSize: 12, fontFamily: 'inherit',
          }}>{lb.simLabels.calc}</button>
        </div>

        {simResult && <div style={{
          background: 'rgba(198,163,78,.04)', border: '1px solid rgba(198,163,78,.12)',
          borderRadius: 12, padding: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: G, marginBottom: 10 }}>{lb.simLabels.result}</div>

          {/* Grand total */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
            {[
              { l: lb.simLabels.cout, v: `${simResult.coutMensuel.toLocaleString('fr-BE')}€`, c: G },
              { l: lb.simLabels.net, v: `${simResult.netApprox.toLocaleString('fr-BE')}€`, c: '#4ade80' },
              { l: lb.simLabels.ratio, v: `×${simResult.ratio}`, c: '#60a5fa' },
            ].map((k, i) => <div key={i} style={{
              padding: '10px 8px', background: 'rgba(0,0,0,.2)', borderRadius: 8, textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: .5 }}>{k.l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: k.c, marginTop: 3 }}>{k.v}</div>
            </div>)}
          </div>

          {/* Détail */}
          <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Détail mensuel</div>
          {[
            { l: 'Salaire brut', v: `${simResult.brutMensuel.toLocaleString('fr-BE')}€` },
            { l: `ONSS patronal (${simResult.tauxONSSEffectif}%)`, v: `+${simResult.onssPatronalNet.toLocaleString('fr-BE')}€`, c: '#f87171' },
            ...(simResult.reductionONSS > 0 ? [{ l: 'Réduction ONSS', v: `-${simResult.reductionONSS.toLocaleString('fr-BE')}€`, c: '#4ade80' }] : []),
            { l: 'Provision pécule vacances', v: `+${simResult.provisionPeculeVacances.toLocaleString('fr-BE')}€` },
            ...(simResult.provisionTreizieme > 0 ? [{ l: 'Provision 13ème mois', v: `+${simResult.provisionTreizieme.toLocaleString('fr-BE')}€` }] : []),
            { l: 'ONSS sur provisions', v: `+${simResult.onssProvisions.toLocaleString('fr-BE')}€` },
            { l: 'Assurance AT', v: `+${simResult.assuranceAT.toLocaleString('fr-BE')}€` },
            { l: 'Médecine du travail', v: `+${simResult.medecineTravail.toLocaleString('fr-BE')}€` },
            ...(simResult.chequesRepas > 0 ? [{ l: 'Chèques-repas', v: `+${simResult.chequesRepas.toLocaleString('fr-BE')}€` }] : []),
            ...(simResult.ecoChequeMois > 0 ? [{ l: 'Éco-chèques', v: `+${simResult.ecoChequeMois.toLocaleString('fr-BE')}€` }] : []),
            ...(simResult.forfaitTeletravail > 0 ? [{ l: 'Forfait télétravail', v: `+${simResult.forfaitTeletravail.toLocaleString('fr-BE')}€` }] : []),
          ].map((r, i) => <div key={i} className="sim-row">
            <span className="sim-label">{r.l}</span>
            <span className="sim-val" style={{ color: r.c || '#e8e4dc' }}>{r.v}</span>
          </div>)}

          <div style={{ marginTop: 8, padding: '8px 0', borderTop: '1px solid rgba(198,163,78,.15)' }}>
            <div className="sim-row">
              <span style={{ fontSize: 12, fontWeight: 700, color: G }}>COÛT TOTAL</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: G }}>{simResult.coutMensuel.toLocaleString('fr-BE')}€/mois</span>
            </div>
            <div className="sim-row" style={{ borderBottom: 'none' }}>
              <span className="sim-label">Annuel</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#e8e4dc' }}>{simResult.coutAnnuel.toLocaleString('fr-BE')}€/an</span>
            </div>
          </div>
        </div>}
      </div>}

      {/* ═══ TAB: FAQ ═══ */}
      {tab === 'faq' && <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: G, marginBottom: 12 }}>📚 FAQ — Droit Social Belge</div>
        {[
          { cat: '🏢 Embauche', items: ['dimona', 'contrat', 'règlement'] },
          { cat: '💰 Rémunération', items: ['onss', 'précompte', 'coût', 'chèques-repas', 'eco-chèque', 'index'] },
          { cat: '⏱️ Temps de travail', items: ['heures sup', 'télétravail', 'crédit-temps'] },
          { cat: '🚪 Licenciement', items: ['préavis', 'motif grave', 'c4'] },
          { cat: '📊 Avantages', items: ['voiture', 'cct 90', 'premier'] },
          { cat: '📋 Obligations', items: ['registre', 'inspection', 'rgpd'] },
          { cat: '🏥 Absences', items: ['maladie', 'vacances', 'accident'] },
          { cat: '💼 Divers', items: ['flexijob', 'étudiant', 'intérim', 'pension', 'saisie'] },
        ].map((cat, ci) => <div key={ci} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: G, marginBottom: 6, opacity: .8 }}>{cat.cat}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {cat.items.map((kw, ki) => {
              const entry = LOCAL_KB.find(e => e.q.includes(kw));
              if (!entry) return null;
              return <button key={ki} onClick={() => {
                const answer = entry.a;
                setMsgs(prev => [...prev, { role: 'user', content: kw }, { role: 'assistant', content: answer }]);
                setTab('chat');
              }} style={{
                padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(198,163,78,.06)',
                background: 'rgba(198,163,78,.03)', color: '#e8e4dc', fontSize: 11,
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
              }}>
                {entry.q[0].charAt(0).toUpperCase() + entry.q[0].slice(1)}
              </button>;
            })}
          </div>
        </div>)}
      </div>}

      {/* ═══ TAB: ALERTES ═══ */}
      {tab === 'alertes' && <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: G, marginBottom: 12 }}>
          🔔 Alertes Légales ({alertes.length})
        </div>
        {alertes.length === 0 && <div style={{
          textAlign: 'center', padding: 30, color: 'rgba(198,163,78,.3)', fontSize: 12,
        }}>
          ✅ Aucune alerte — Tout semble en ordre.
          <div style={{ fontSize: 10, marginTop: 8, color: '#5e5c56' }}>
            Les alertes se mettent à jour automatiquement quand vous sélectionnez un dossier client.
          </div>
        </div>}
        {alertes.map((al, i) => <div key={i} style={{
          padding: '10px 12px', borderRadius: 10, marginBottom: 8,
          border: `1px solid ${sev[al.severity] || sev.info}30`,
          background: `${sev[al.severity] || sev.info}08`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: sev[al.severity] || sev.info }}>{al.titre}</span>
            <span style={{
              padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700, textTransform: 'uppercase',
              background: `${sev[al.severity]}20`, color: sev[al.severity], letterSpacing: .5,
            }}>{al.severity}</span>
          </div>
          <div style={{ fontSize: 10.5, color: '#9e9b93', lineHeight: 1.5, marginBottom: 6 }}>{al.message}</div>
          {al.baseLegale && <div style={{ fontSize: 9.5, color: 'rgba(198,163,78,.5)' }}>📋 {al.baseLegale}</div>}
          {al.sanction && <div style={{ fontSize: 9.5, color: '#f87171', marginTop: 2 }}>💰 {al.sanction}</div>}
          {al.action && <div style={{ fontSize: 9.5, color: '#4ade80', marginTop: 2 }}>✅ {al.action}</div>}
        </div>)}
      </div>}

    </div>}
  </>;
}
