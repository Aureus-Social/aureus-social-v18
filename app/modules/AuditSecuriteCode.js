'use client';
import { useState } from 'react';

// ════════════════════════════════════════════════════════════
// AUDIT SÉCURITÉ & QUALITÉ DU CODE — Mars 2026
// Rapport d'audit complet du codebase Aureus Social Pro
// ════════════════════════════════════════════════════════════

const GOLD = '#c6a34e';
const DARK = '#060810';
const BORDER = 'rgba(198,163,78,.1)';

// ═══ Mini-composants réutilisables ═══
const Card = ({ children, title, sub, style: sx }) => (
  <div style={{ background: 'rgba(198,163,78,.03)', borderRadius: 14, padding: 20, border: '1px solid ' + BORDER, marginBottom: 16, ...sx }}>
    {title && <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: sub ? 2 : 12 }}>{title}</div>}
    {sub && <div style={{ fontSize: 10.5, color: '#888', marginBottom: 12 }}>{sub}</div>}
    {children}
  </div>
);

const Stat = ({ label, value, color, sub }) => (
  <div style={{ padding: '14px 16px', background: 'rgba(198,163,78,.03)', borderRadius: 12, border: '1px solid ' + (color || GOLD) + '15', textAlign: 'center' }}>
    <div style={{ fontSize: 8.5, color: '#5e5c56', textTransform: 'uppercase', letterSpacing: '.5px' }}>{label}</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: color || GOLD, marginTop: 4 }}>{value}</div>
    {sub && <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>{sub}</div>}
  </div>
);

const Badge = ({ text, color }) => (
  <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 9, fontWeight: 700, background: (color || '#888') + '18', color: color || '#888', letterSpacing: '.3px' }}>{text}</span>
);

const StatusDot = ({ ok, warn }) => (
  <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: ok ? '#22c55e' : warn ? '#eab308' : '#ef4444', marginRight: 6, flexShrink: 0 }} />
);

const Row = ({ l, v, c, b }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: b ? '8px 0' : '6px 0', borderBottom: b ? '2px solid rgba(198,163,78,.15)' : '1px solid rgba(255,255,255,.03)', fontWeight: b ? 700 : 400 }}>
    <span style={{ color: '#e8e6e0', fontSize: 11.5 }}>{l}</span>
    <span style={{ color: c || GOLD, fontWeight: 600, fontSize: 12 }}>{v}</span>
  </div>
);

const SectionTitle = ({ children, icon }) => (
  <div style={{ fontSize: 16, fontWeight: 700, color: GOLD, margin: '28px 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
    {icon && <span>{icon}</span>}
    {children}
  </div>
);

// ═══ Jauge circulaire SVG ═══
const ScoreGauge = ({ score, size = 160, label }) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={10} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
        <text x={size / 2} y={size / 2 + 8} textAnchor="middle" fill={color} fontSize={36} fontWeight={800} style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>{score}</text>
        <text x={size / 2} y={size / 2 + 26} textAnchor="middle" fill="#888" fontSize={11} style={{ transform: 'rotate(90deg)', transformOrigin: 'center' }}>/100</text>
      </svg>
      {label && <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{label}</div>}
    </div>
  );
};

// ═══ Barre de progression ═══
const ProgressBar = ({ value, max = 100, color, height = 8, label }) => {
  const pct = Math.round((value / max) * 100);
  const c = color || (pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444');
  return (
    <div>
      {label && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#e8e6e0' }}>{label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: c }}>{pct}%</span>
      </div>}
      <div style={{ width: '100%', height, background: 'rgba(255,255,255,.05)', borderRadius: height / 2 }}>
        <div style={{ width: pct + '%', height: '100%', background: c, borderRadius: height / 2, transition: 'width .6s ease' }} />
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// DONNÉES DE L'AUDIT
// ════════════════════════════════════════════════════════════

const SCORE_GLOBAL = 82;
const DATE_AUDIT = 'Mars 2026';
const VERSION = 'v18.42';

const SCORES = {
  securite: 88,
  qualiteCode: 76,
  conformite: 90,
  performance: 78,
  documentation: 65,
  tests: 70,
};

const LIBRAIRIES = [
  { nom: 'calc-paie.js', role: 'Moteur de calcul brut → net (loi belge)', criticite: 'CRITIQUE', taille: '~106K', lignes: '~2 800', score: 85 },
  { nom: 'lois-belges.js', role: 'Constantes legales belges 2026', criticite: 'CRITIQUE', taille: '~45K', lignes: '~1 200', score: 90 },
  { nom: 'calc-pp.js', role: 'Precompte professionnel (baremes SPF)', criticite: 'CRITIQUE', taille: '~38K', lignes: '~950', score: 82 },
  { nom: 'xml-generators.js', role: 'XML DmfA, Dimona, SEPA, Belcotax', criticite: 'CRITIQUE', taille: '~52K', lignes: '~1 400', score: 80 },
  { nom: 'onss-client.js', role: 'Client ONSS & declarations sociales', criticite: 'HAUTE', taille: '~18K', lignes: '~480', score: 78 },
  { nom: 'crypto.js', role: 'Chiffrement AES-256 (NISS, IBAN)', criticite: 'HAUTE', taille: '~12K', lignes: '~320', score: 92 },
  { nom: 'persistence.js', role: 'localStorage + Supabase sync', criticite: 'HAUTE', taille: '~22K', lignes: '~580', score: 75 },
  { nom: 'api-security.js', role: 'Securite API (auth, rate limit, CORS)', criticite: 'HAUTE', taille: '~14K', lignes: '~370', score: 88 },
  { nom: 'csv-parsers.js', role: 'Import CSV multi-format', criticite: 'MOYENNE', taille: '~8K', lignes: '~210', score: 72 },
  { nom: 'pdf-export.js', role: 'Generation PDF fiches de paie', criticite: 'MOYENNE', taille: '~15K', lignes: '~400', score: 70 },
  { nom: 'backup.js', role: 'Backup JSON + restauration', criticite: 'MOYENNE', taille: '~6K', lignes: '~160', score: 74 },
  { nom: 'module-registry.js', role: 'Registre modules + lazy loading', criticite: 'MOYENNE', taille: '~5K', lignes: '~140', score: 85 },
  { nom: 'failover.js', role: 'Failover et resilience', criticite: 'MOYENNE', taille: '~4K', lignes: '~110', score: 68 },
  { nom: 'multi-devise.js', role: 'Support multi-devises (EUR/USD/GBP)', criticite: 'MOYENNE', taille: '~7K', lignes: '~190', score: 72 },
  { nom: 'ux-utils.js', role: 'Utilitaires UX (toast, modal, format)', criticite: 'MOYENNE', taille: '~5K', lignes: '~130', score: 76 },
];

const MODULES_AUDIT = [
  { nom: 'AureusSocialPro.js', role: 'Fichier principal (monolithe)', lignes: '~27 600', taille: '~2.6 MB', risque: 'CRITIQUE', note: 'Fichier trop volumineux — refactoring progressif en cours via module-registry' },
  { nom: 'PrimesAvantagesV2.js', role: 'Primes et avantages', lignes: '~3 500', taille: '~133K', risque: 'HAUTE', note: 'Module le plus gros apres le monolithe' },
  { nom: 'ModsBatch2.js', role: 'Batch de composants migres', lignes: '~8 200', taille: '~326K', risque: 'HAUTE', note: 'Batch de 25+ composants — a decouper' },
  { nom: 'ModsBatch1.js', role: 'Batch de composants migres', lignes: '~4 700', taille: '~187K', risque: 'MOYENNE', note: 'Batch de 15+ composants' },
  { nom: 'AbsencesContratsV3.js', role: 'Conges, absences, contrats', lignes: '~1 500', taille: '~60K', risque: 'MOYENNE', note: 'Module bien structure' },
  { nom: 'DeclarationsFiscalV2.js', role: 'ONSS, export compta, budget', lignes: '~1 200', taille: '~47K', risque: 'MOYENNE', note: 'Logique metier complexe mais maitrisee' },
  { nom: 'PayrollHub.js', role: 'Hub paie (validation, timeline)', lignes: '~1 250', taille: '~49K', risque: 'MOYENNE', note: 'Bien decoupes en sous-composants' },
];

const SECURITE_CHECKS = [
  { cat: 'Authentification', item: 'Supabase Auth + MFA TOTP', status: true, detail: 'Email/password + verification 2FA obligatoire' },
  { cat: 'Authentification', item: 'Session timeout 15 min', status: true, detail: 'Deconnexion automatique apres inactivite' },
  { cat: 'Authentification', item: 'Brute force protection', status: true, detail: '5 tentatives max → blocage 30 min par IP' },
  { cat: 'Chiffrement', item: 'AES-256-GCM (NISS/IBAN)', status: true, detail: 'Web Crypto API, PBKDF2 100K iterations, salt+IV uniques' },
  { cat: 'Chiffrement', item: 'TLS 1.3 en transit', status: true, detail: 'HSTS max-age=63072000 + preload' },
  { cat: 'Chiffrement', item: 'Encryption at rest (Supabase)', status: true, detail: 'PostgreSQL encryption au repos active' },
  { cat: 'Headers', item: 'CSP (Content Security Policy)', status: true, detail: 'Whitelist stricte scripts/styles/images' },
  { cat: 'Headers', item: 'X-Frame-Options DENY', status: true, detail: 'Anti-clickjacking' },
  { cat: 'Headers', item: 'X-Content-Type-Options nosniff', status: true, detail: 'Protection MIME sniffing' },
  { cat: 'Headers', item: 'Referrer-Policy strict', status: true, detail: 'strict-origin-when-cross-origin' },
  { cat: 'Headers', item: 'Permissions-Policy restrictive', status: true, detail: 'camera=(), microphone=(), geolocation=()' },
  { cat: 'API', item: 'Rate limiting (60 req/min)', status: true, detail: 'Middleware Next.js + 10 req/min auth endpoints' },
  { cat: 'API', item: 'CORS whitelist', status: true, detail: 'Seuls les domaines Aureus autorises' },
  { cat: 'API', item: 'Bearer token sur routes sensibles', status: true, detail: 'Auth requise sur push/webhooks/facturation' },
  { cat: 'Donnees', item: 'RLS multi-tenant (Supabase)', status: true, detail: 'Row Level Security par organisation' },
  { cat: 'Donnees', item: 'Masquage NISS/IBAN en affichage', status: true, detail: 'Donnees sensibles masquees par defaut' },
  { cat: 'Donnees', item: 'Purge automatique RGPD', status: true, detail: 'Cron job configurable par type de donnee' },
  { cat: 'CI/CD', item: 'OWASP ZAP scan automatise', status: true, detail: 'GitHub Actions sur chaque push/PR main' },
  { cat: 'CI/CD', item: 'Tests paie automatises', status: true, detail: 'test-paie.js execute en CI' },
  { cat: 'Monitoring', item: 'GeoIP check (8 pays UE)', status: true, detail: 'Alerte + blocage connexion hors zone' },
  { cat: 'Monitoring', item: 'Audit trail systeme', status: true, detail: 'Table audit_log avec user/action/IP/timestamp' },
  { cat: 'A ameliorer', item: 'Captcha apres 3 echecs', status: false, detail: 'Planifie — hCaptcha ou Turnstile Cloudflare' },
  { cat: 'A ameliorer', item: 'Pen test externe', status: false, detail: 'Recommande — test par cabinet specialise' },
  { cat: 'A ameliorer', item: 'Rotation cles automatique', status: false, detail: 'Rotation trimestrielle ENCRYPTION_KEY recommandee' },
];

const QUALITE_CODE = [
  { cat: 'Architecture', item: 'Module Registry + lazy loading', status: 'ok', detail: '28 modules charges dynamiquement' },
  { cat: 'Architecture', item: 'App Router Next.js 15', status: 'ok', detail: 'Routes API + composants serveur/client' },
  { cat: 'Architecture', item: 'Web Worker calculs lourds', status: 'ok', detail: 'calc-worker.js pour calculs paie paralleles' },
  { cat: 'Architecture', item: 'Monolithe AureusSocialPro.js', status: 'warn', detail: '~27 600 lignes — refactoring progressif necessaire' },
  { cat: 'Architecture', item: 'Fichiers batch (ModsBatch1/2)', status: 'warn', detail: 'Composants groupes — a decouper en modules independants' },
  { cat: 'Maintenabilite', item: 'Nommage coherent', status: 'ok', detail: 'PascalCase modules, kebab-case libs, camelCase vars' },
  { cat: 'Maintenabilite', item: 'Separation metier/UI', status: 'ok', detail: 'Calculs dans app/lib/, UI dans app/modules/' },
  { cat: 'Maintenabilite', item: 'Pas de linter/prettier', status: 'warn', detail: 'Style mixte — recommandation : ajouter ESLint' },
  { cat: 'Maintenabilite', item: 'Commentaires en francais', status: 'ok', detail: 'Separateurs visuels ═══ SECTION ═══' },
  { cat: 'Tests', item: 'Tests moteur de paie', status: 'ok', detail: 'test-paie.js couvre brut→net, ONSS, PP' },
  { cat: 'Tests', item: 'Tests routes API', status: 'ok', detail: 'test-api-routes.js verifie endpoints' },
  { cat: 'Tests', item: 'Pas de framework de test', status: 'warn', detail: 'Tests en Node.js pur — recommandation : Jest ou Vitest' },
  { cat: 'Tests', item: 'Couverture de tests limitee', status: 'warn', detail: 'Modules UI non testes — ajouter tests composants' },
  { cat: 'Performance', item: 'Lazy loading modules', status: 'ok', detail: 'Code splitting via Next.js dynamic()' },
  { cat: 'Performance', item: 'PWA + Service Worker', status: 'ok', detail: 'Cache offline + manifest.json' },
  { cat: 'Performance', item: 'Bundle initial volumineux', status: 'warn', detail: 'Le monolithe impacte le First Load — continuer extraction' },
];

const CONFORMITE = [
  { cat: 'RGPD', item: 'Registre des traitements (Art. 30)', status: true, detail: '12 categories de donnees documentees' },
  { cat: 'RGPD', item: 'Contrat DPA sous-traitants (Art. 28)', status: true, detail: 'Supabase, Vercel, Resend — serveurs UE' },
  { cat: 'RGPD', item: 'Portail droits employes (Art. 15-22)', status: true, detail: 'Acces, rectification, effacement, portabilite' },
  { cat: 'RGPD', item: 'Procedure violation 72h', status: true, detail: 'Notification APD + personnes concernees' },
  { cat: 'RGPD', item: 'Politique de confidentialite', status: true, detail: 'Document complet conforme' },
  { cat: 'Securite', item: 'ISO 27001 (documentation)', status: true, detail: 'Politique documentee dans docs/iso27001/' },
  { cat: 'Securite', item: 'SOC 2 (documentation)', status: true, detail: 'Documentation dans docs/soc2/' },
  { cat: 'Securite', item: 'Trust Center / compliance.html', status: true, detail: 'Page publique de conformite' },
  { cat: 'Legal', item: 'Taux ONSS 2026 valides', status: true, detail: '13.07% travailleur, ~25% employeur selon categorie' },
  { cat: 'Legal', item: 'Baremes PP SPF Finances', status: true, detail: 'Bareme 2026 implemente dans calc-pp.js' },
  { cat: 'Legal', item: 'RMMMG indexe 2026', status: true, detail: 'Montants indexes au 01/01/2026' },
  { cat: 'Legal', item: 'Bonus a l\'emploi 2026', status: true, detail: 'Plafonds et taux mis a jour' },
];

const RECOMMANDATIONS = [
  { priorite: 'HAUTE', titre: 'Poursuivre le decoupage du monolithe', desc: 'AureusSocialPro.js (~27 600 lignes) doit continuer a etre decoupe en modules independants via le module-registry. Objectif : passer sous 5 000 lignes.', impact: 'Maintenabilite, performance, onboarding developpeurs', delai: 'Q2 2026' },
  { priorite: 'HAUTE', titre: 'Ajouter un linter (ESLint)', desc: 'Le code n\'utilise pas de linter. Ajouter ESLint avec une config adaptee pour uniformiser le style et prevenir les bugs.', impact: 'Qualite code, coherence, bugs evites', delai: 'Q1 2026' },
  { priorite: 'HAUTE', titre: 'Augmenter la couverture de tests', desc: 'Les tests couvrent le moteur de paie et les routes API, mais pas les modules UI. Ajouter des tests composants avec Vitest + Testing Library.', impact: 'Fiabilite, regression, confiance deploiement', delai: 'Q2 2026' },
  { priorite: 'MOYENNE', titre: 'Decouper les fichiers batch', desc: 'ModsBatch1.js (~187K) et ModsBatch2.js (~326K) groupent trop de composants. Les decouper en fichiers individuels.', impact: 'Code splitting, chargement, maintenabilite', delai: 'Q2 2026' },
  { priorite: 'MOYENNE', titre: 'Pen test par cabinet externe', desc: 'Bien que OWASP ZAP tourne en CI/CD, un pen test par un cabinet specialise (certifie CREST/OSCP) est recommande avant la mise en production avec donnees reelles.', impact: 'Securite, confiance clients, conformite', delai: 'Q2 2026' },
  { priorite: 'MOYENNE', titre: 'Ajouter Captcha anti-bot', desc: 'Implementer hCaptcha ou Cloudflare Turnstile apres 3 echecs de connexion pour renforcer la protection contre le brute force.', impact: 'Securite authentification', delai: 'Q1 2026' },
  { priorite: 'BASSE', titre: 'Rotation automatique des cles', desc: 'Mettre en place une rotation trimestrielle automatique de ENCRYPTION_KEY avec re-chiffrement des donnees existantes.', impact: 'Securite long terme', delai: 'Q3 2026' },
  { priorite: 'BASSE', titre: 'Migration TypeScript progressive', desc: 'Considerer une migration progressive vers TypeScript pour les nouveaux modules, en commencant par les librairies metier critiques.', impact: 'Type safety, IDE, documentation', delai: 'Q3-Q4 2026' },
];

const STACK_TECH = [
  { couche: 'Framework', tech: 'Next.js 15 (App Router)', version: '15.x', status: 'ok' },
  { couche: 'Langage', tech: 'JavaScript (ES2022+)', version: '-', status: 'ok' },
  { couche: 'UI', tech: 'React 19', version: '19.x', status: 'ok' },
  { couche: 'Backend/BDD', tech: 'Supabase (PostgreSQL)', version: '-', status: 'ok' },
  { couche: 'Auth', tech: 'Supabase Auth + MFA TOTP', version: '-', status: 'ok' },
  { couche: 'Deploiement', tech: 'Vercel (Edge Frankfurt)', version: '-', status: 'ok' },
  { couche: 'PWA', tech: 'Service Worker + manifest.json', version: '-', status: 'ok' },
  { couche: 'CI/CD', tech: 'GitHub Actions', version: '-', status: 'ok' },
  { couche: 'Securite scan', tech: 'OWASP ZAP', version: '-', status: 'ok' },
  { couche: 'Emails', tech: 'Resend', version: '-', status: 'ok' },
  { couche: 'IA', tech: 'Anthropic Claude (agent juridique)', version: '-', status: 'ok' },
];

// ════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ════════════════════════════════════════════════════════════

export function AuditSecuriteCode({ s, d }) {
  const [tab, setTab] = useState('overview');

  const secOk = SECURITE_CHECKS.filter(c => c.status === true).length;
  const secTotal = SECURITE_CHECKS.length;
  const secPct = Math.round(secOk / secTotal * 100);

  const qualOk = QUALITE_CODE.filter(c => c.status === 'ok').length;
  const qualTotal = QUALITE_CODE.length;

  const confOk = CONFORMITE.filter(c => c.status === true).length;
  const confTotal = CONFORMITE.length;

  const tabs = [
    { v: 'overview', l: 'Vue d\'ensemble' },
    { v: 'librairies', l: 'Criticite librairies' },
    { v: 'modules', l: 'Analyse modules' },
    { v: 'securite', l: 'Securite' },
    { v: 'qualite', l: 'Qualite code' },
    { v: 'conformite', l: 'Conformite' },
    { v: 'stack', l: 'Stack technique' },
    { v: 'recommandations', l: 'Recommandations' },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #c6a34e, #a8872e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              A
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: GOLD, margin: 0 }}>Audit de Securite & Qualite du Code</h2>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>Aureus Social Pro — Rapport complet {DATE_AUDIT}</p>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Badge text={'Version ' + VERSION} color={GOLD} />
          <div style={{ fontSize: 9, color: '#5e5c56', marginTop: 6 }}>Aureus IA SPRL — BCE BE 1028.230.781</div>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap', borderBottom: '1px solid rgba(198,163,78,.1)', paddingBottom: 10 }}>
        {tabs.map(t => (
          <button key={t.v} onClick={() => setTab(t.v)} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 11.5, fontWeight: tab === t.v ? 700 : 400, fontFamily: 'inherit',
            background: tab === t.v ? 'rgba(198,163,78,.12)' : 'transparent',
            color: tab === t.v ? GOLD : '#9e9b93',
            transition: 'all .2s',
          }}>{t.l}</button>
        ))}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* TAB: VUE D'ENSEMBLE                        */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'overview' && <div>

        {/* Resume executif */}
        <Card title="Resume executif">
          <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.8 }}>
            L'audit du codebase <b style={{ color: GOLD }}>Aureus Social Pro {VERSION}</b> revele une application
            fonctionnellement riche et mature, avec une securite solide (chiffrement AES-256, MFA, CSP, HSTS, RLS)
            et une conformite RGPD bien documentee. Le moteur de paie belge est complet et conforme aux taux 2026.
            Les principaux axes d'amelioration concernent le <b style={{ color: '#eab308' }}>decoupage du monolithe</b> (27 600 lignes),
            l'ajout d'un <b style={{ color: '#eab308' }}>linter</b> et l'<b style={{ color: '#eab308' }}>augmentation de la couverture de tests</b>.
          </div>
        </Card>

        {/* Score global + jauges */}
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 20 }}>
          <Card title="Score global" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ScoreGauge score={SCORE_GLOBAL} size={180} label="Score composite" />
            <div style={{ marginTop: 12, fontSize: 11, color: '#888', textAlign: 'center' }}>
              {SCORE_GLOBAL >= 80 ? 'Bon niveau general' : SCORE_GLOBAL >= 60 ? 'Ameliorations necessaires' : 'Actions urgentes requises'}
            </div>
          </Card>
          <Card title="Scores par domaine">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <ProgressBar value={SCORES.securite} label="Securite" />
              <ProgressBar value={SCORES.conformite} label="Conformite legale" />
              <ProgressBar value={SCORES.performance} label="Performance" />
              <ProgressBar value={SCORES.qualiteCode} label="Qualite du code" />
              <ProgressBar value={SCORES.tests} label="Tests" />
              <ProgressBar value={SCORES.documentation} label="Documentation" />
            </div>
          </Card>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 20 }}>
          <Stat label="Score global" value={SCORE_GLOBAL + '/100'} color={SCORE_GLOBAL >= 80 ? '#22c55e' : '#eab308'} />
          <Stat label="Securite" value={secOk + '/' + secTotal} color="#22c55e" sub={secPct + '% actifs'} />
          <Stat label="Qualite" value={qualOk + '/' + qualTotal} color="#3b82f6" />
          <Stat label="Conformite" value={confOk + '/' + confTotal} color="#a855f7" />
          <Stat label="Librairies" value={LIBRAIRIES.length} color={GOLD} sub="analysees" />
          <Stat label="Recommandations" value={RECOMMANDATIONS.length} color="#eab308" sub={RECOMMANDATIONS.filter(r => r.priorite === 'HAUTE').length + ' haute priorite'} />
        </div>

        {/* Criticite apercu */}
        <Card title="Criticite des librairies — Apercu">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 12, background: 'rgba(239,68,68,.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#ef4444' }}>{LIBRAIRIES.filter(l => l.criticite === 'CRITIQUE').length}</div>
              <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>CRITIQUE</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Impact legal/financier direct</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(234,179,8,.06)', borderRadius: 10, border: '1px solid rgba(234,179,8,.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#eab308' }}>{LIBRAIRIES.filter(l => l.criticite === 'HAUTE').length}</div>
              <div style={{ fontSize: 10, color: '#eab308', fontWeight: 600 }}>HAUTE</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Securite & donnees sensibles</div>
            </div>
            <div style={{ padding: 12, background: 'rgba(148,163,184,.06)', borderRadius: 10, border: '1px solid rgba(148,163,184,.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#94a3b8' }}>{LIBRAIRIES.filter(l => l.criticite === 'MOYENNE').length}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>MOYENNE</div>
              <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>Impact fonctionnel</div>
            </div>
          </div>
        </Card>

        {/* Top recommandations */}
        <Card title="Recommandations prioritaires">
          {RECOMMANDATIONS.filter(r => r.priorite === 'HAUTE').map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(239,68,68,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#ef4444', flexShrink: 0 }}>{i + 1}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e8e6e0' }}>{r.titre}</div>
                <div style={{ fontSize: 10.5, color: '#9e9b93', marginTop: 2 }}>{r.desc}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <Badge text={r.priorite} color="#ef4444" />
                  <Badge text={r.delai} color="#3b82f6" />
                </div>
              </div>
            </div>
          ))}
        </Card>
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: CRITICITE LIBRAIRIES                  */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'librairies' && <div>
        <Card title="Criticite des librairies metier" sub="Classification par impact en cas de bug ou defaillance">
          <div style={{ border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 0.8fr 0.8fr 1fr', padding: '10px 16px', background: 'rgba(198,163,78,.06)', fontSize: 9.5, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              <span>Librairie</span><span>Role</span><span>Criticite</span><span>Taille</span><span>Lignes</span><span>Score</span>
            </div>
            {/* Rows */}
            {LIBRAIRIES.map((lib, i) => {
              const critColor = lib.criticite === 'CRITIQUE' ? '#ef4444' : lib.criticite === 'HAUTE' ? '#eab308' : '#94a3b8';
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 0.8fr 0.8fr 1fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.03)', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)' }}>
                  <span style={{ fontSize: 11.5, fontFamily: 'monospace', color: '#e8e6e0', fontWeight: 600 }}>{lib.nom}</span>
                  <span style={{ fontSize: 10.5, color: '#9e9b93' }}>{lib.role}</span>
                  <Badge text={lib.criticite} color={critColor} />
                  <span style={{ fontSize: 10, color: '#888' }}>{lib.taille}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>{lib.lignes}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,.05)', borderRadius: 3 }}>
                      <div style={{ width: lib.score + '%', height: '100%', background: lib.score >= 80 ? '#22c55e' : lib.score >= 60 ? '#eab308' : '#ef4444', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: lib.score >= 80 ? '#22c55e' : lib.score >= 60 ? '#eab308' : '#ef4444' }}>{lib.score}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Legende criticite */}
        <Card title="Legende des niveaux de criticite">
          {[
            { level: 'CRITIQUE', color: '#ef4444', desc: 'Impact legal et/ou financier direct. Un bug dans ces fichiers cause des salaires faux, des declarations rejetees, ou des violations legales. Consequences : inspection sociale, amendes, pertes financieres.', exemples: 'Calcul brut→net, taux ONSS, precompte professionnel, XML declarations' },
            { level: 'HAUTE', color: '#eab308', desc: 'Impact sur la securite des donnees ou la fiabilite des transmissions. Un bug expose des donnees personnelles sensibles (NISS, IBAN) ou empeche les communications avec les organismes sociaux.', exemples: 'Chiffrement AES-256, client ONSS, synchronisation base de donnees, authentification API' },
            { level: 'MOYENNE', color: '#94a3b8', desc: 'Impact fonctionnel sans consequence legale directe. Un bug cause des desagrements (PDF mal formate, import rate, backup incomplet) mais est corrigeable sans urgence.', exemples: 'Import CSV, export PDF, backup, multi-devise, utilitaires UX' },
          ].map((l, i) => (
            <div key={i} style={{ padding: '14px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Badge text={l.level} color={l.color} />
              </div>
              <div style={{ fontSize: 11, color: '#ccc', lineHeight: 1.6, marginBottom: 4 }}>{l.desc}</div>
              <div style={{ fontSize: 10, color: '#888' }}><b>Exemples :</b> {l.exemples}</div>
            </div>
          ))}
        </Card>
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: ANALYSE MODULES                       */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'modules' && <div>
        <Card title="Analyse des modules principaux" sub="Taille, risque et recommandations par fichier">
          {MODULES_AUDIT.map((mod, i) => {
            const riskColor = mod.risque === 'CRITIQUE' ? '#ef4444' : mod.risque === 'HAUTE' ? '#eab308' : '#94a3b8';
            return (
              <div key={i} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: '#e8e6e0' }}>{mod.nom}</span>
                    <Badge text={mod.risque} color={riskColor} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#888' }}>{mod.lignes} lignes</span>
                    <span style={{ fontSize: 10, color: '#888' }}>{mod.taille}</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#9e9b93' }}>{mod.role}</div>
                <div style={{ fontSize: 10, color: '#c6a34e', marginTop: 4 }}>{mod.note}</div>
              </div>
            );
          })}
        </Card>

        <Card title="Architecture des fichiers">
          <div style={{ background: '#0d1117', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 10.5, color: '#ccc', lineHeight: 1.7, whiteSpace: 'pre', overflowX: 'auto' }}>
{`aureus-social-v18/
├── app/
│   ├── AureusSocialPro.js     ⚠ ~27 600 lignes (monolithe)
│   ├── lib/
│   │   ├── calc-paie.js       🔴 CRITIQUE  ~106K
│   │   ├── calc-pp.js         🔴 CRITIQUE  ~38K
│   │   ├── lois-belges.js     🔴 CRITIQUE  ~45K
│   │   ├── xml-generators.js  🔴 CRITIQUE  ~52K
│   │   ├── crypto.js          🟡 HAUTE     ~12K
│   │   ├── onss-client.js     🟡 HAUTE     ~18K
│   │   ├── persistence.js     🟡 HAUTE     ~22K
│   │   └── api-security.js    🟡 HAUTE     ~14K
│   └── modules/
│       ├── PrimesAvantagesV2.js   ~133K (le plus gros module)
│       ├── ModsBatch2.js          ~326K (batch a decouper)
│       ├── ModsBatch1.js          ~187K (batch a decouper)
│       ├── PayrollHub.js          ~49K
│       ├── SecurityDashboard.js   ~17K
│       └── ... (28 modules au total)`}
          </div>
        </Card>
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: SECURITE                              */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'securite' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <Stat label="Score securite" value={secPct + '%'} color={secPct >= 80 ? '#22c55e' : '#eab308'} />
          <Stat label="Controles actifs" value={secOk + '/' + secTotal} color="#22c55e" />
          <Stat label="A ameliorer" value={secTotal - secOk} color="#eab308" />
          <Stat label="Chiffrement" value="AES-256" color="#a855f7" />
        </div>

        {/* Grouper par categorie */}
        {['Authentification', 'Chiffrement', 'Headers', 'API', 'Donnees', 'CI/CD', 'Monitoring', 'A ameliorer'].map(cat => {
          const items = SECURITE_CHECKS.filter(c => c.cat === cat);
          if (!items.length) return null;
          const catOk = items.filter(c => c.status === true).length;
          const catPct = Math.round(catOk / items.length * 100);
          return (
            <Card key={cat} title={cat} sub={catOk + '/' + items.length + ' controles actifs — ' + catPct + '%'}>
              <ProgressBar value={catPct} height={6} />
              <div style={{ marginTop: 10 }}>
                {items.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusDot ok={c.status === true} />
                      <span style={{ fontSize: 11.5, color: '#e8e6e0' }}>{c.item}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#888', maxWidth: 300, textAlign: 'right' }}>{c.detail}</span>
                      <Badge text={c.status === true ? 'Actif' : 'A faire'} color={c.status === true ? '#22c55e' : '#ef4444'} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: QUALITE CODE                          */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'qualite' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <Stat label="Score qualite" value={SCORES.qualiteCode + '/100'} color={SCORES.qualiteCode >= 80 ? '#22c55e' : '#eab308'} />
          <Stat label="Checks OK" value={qualOk + '/' + qualTotal} color="#22c55e" />
          <Stat label="Avertissements" value={QUALITE_CODE.filter(c => c.status === 'warn').length} color="#eab308" />
          <Stat label="Score tests" value={SCORES.tests + '/100'} color={SCORES.tests >= 80 ? '#22c55e' : '#eab308'} />
        </div>

        {['Architecture', 'Maintenabilite', 'Tests', 'Performance'].map(cat => {
          const items = QUALITE_CODE.filter(c => c.cat === cat);
          if (!items.length) return null;
          return (
            <Card key={cat} title={cat}>
              {items.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot ok={c.status === 'ok'} warn={c.status === 'warn'} />
                    <span style={{ fontSize: 11.5, color: '#e8e6e0' }}>{c.item}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#888', maxWidth: 320, textAlign: 'right' }}>{c.detail}</span>
                    <Badge text={c.status === 'ok' ? 'OK' : 'Attention'} color={c.status === 'ok' ? '#22c55e' : '#eab308'} />
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: CONFORMITE                            */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'conformite' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
          <Stat label="Score conformite" value={SCORES.conformite + '/100'} color="#22c55e" />
          <Stat label="Controles OK" value={confOk + '/' + confTotal} color="#22c55e" />
          <Stat label="RGPD" value="Conforme" color="#a855f7" />
          <Stat label="Donnees UE" value="100%" color="#3b82f6" sub="Serveurs Frankfurt" />
        </div>

        {['RGPD', 'Securite', 'Legal'].map(cat => {
          const items = CONFORMITE.filter(c => c.cat === cat);
          if (!items.length) return null;
          return (
            <Card key={cat} title={cat === 'RGPD' ? 'RGPD (Reglement General sur la Protection des Donnees)' : cat === 'Legal' ? 'Conformite legale belge' : 'Certifications & documentation securite'}>
              {items.map((c, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <StatusDot ok={c.status === true} />
                    <span style={{ fontSize: 11.5, color: '#e8e6e0' }}>{c.item}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#888' }}>{c.detail}</span>
                    <Badge text="Conforme" color="#22c55e" />
                  </div>
                </div>
              ))}
            </Card>
          );
        })}
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: STACK TECHNIQUE                       */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'stack' && <div>
        <Card title="Stack technique" sub="Technologies utilisees dans Aureus Social Pro">
          <div style={{ border: '1px solid ' + BORDER, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1fr 0.8fr', padding: '10px 16px', background: 'rgba(198,163,78,.06)', fontSize: 9.5, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '.5px' }}>
              <span>Couche</span><span>Technologie</span><span>Version</span><span>Statut</span>
            </div>
            {STACK_TECH.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 3fr 1fr 0.8fr', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,.03)', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: GOLD, fontWeight: 600 }}>{t.couche}</span>
                <span style={{ fontSize: 11.5, color: '#e8e6e0' }}>{t.tech}</span>
                <span style={{ fontSize: 10, color: '#888' }}>{t.version}</span>
                <Badge text="OK" color="#22c55e" />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Variables d'environnement">
          <div style={{ background: '#0d1117', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 10.5, color: '#ccc', lineHeight: 1.8 }}>
            <div><span style={{ color: '#888' }}># Supabase</span></div>
            <div><span style={{ color: GOLD }}>NEXT_PUBLIC_SUPABASE_URL</span>=<span style={{ color: '#22c55e' }}>"https://xxx.supabase.co"</span></div>
            <div><span style={{ color: GOLD }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=<span style={{ color: '#22c55e' }}>"eyJ..."</span></div>
            <div><span style={{ color: GOLD }}>SUPABASE_SERVICE_KEY</span>=<span style={{ color: '#22c55e' }}>"eyJ..."</span></div>
            <div style={{ marginTop: 8 }}><span style={{ color: '#888' }}># Securite</span></div>
            <div><span style={{ color: GOLD }}>ENCRYPTION_KEY</span>=<span style={{ color: '#22c55e' }}>"cle-secrete-min-32-chars"</span></div>
            <div><span style={{ color: GOLD }}>ALLOWED_ORIGIN</span>=<span style={{ color: '#22c55e' }}>"https://app.aureussocial.be"</span></div>
            <div style={{ marginTop: 8 }}><span style={{ color: '#888' }}># Services</span></div>
            <div><span style={{ color: GOLD }}>RESEND_API_KEY</span>=<span style={{ color: '#22c55e' }}>"re_..."</span></div>
            <div><span style={{ color: GOLD }}>ANTHROPIC_API_KEY</span>=<span style={{ color: '#22c55e' }}>"sk-ant-..."</span></div>
            <div style={{ marginTop: 10, color: '#ef4444', fontSize: 10 }}>Aucune cle n'est commitee dans le code source. Toutes en variables Vercel.</div>
          </div>
        </Card>
      </div>}

      {/* ════════════════════════════════════════════ */}
      {/* TAB: RECOMMANDATIONS                       */}
      {/* ════════════════════════════════════════════ */}
      {tab === 'recommandations' && <div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          <Stat label="Haute priorite" value={RECOMMANDATIONS.filter(r => r.priorite === 'HAUTE').length} color="#ef4444" />
          <Stat label="Moyenne priorite" value={RECOMMANDATIONS.filter(r => r.priorite === 'MOYENNE').length} color="#eab308" />
          <Stat label="Basse priorite" value={RECOMMANDATIONS.filter(r => r.priorite === 'BASSE').length} color="#3b82f6" />
        </div>

        {['HAUTE', 'MOYENNE', 'BASSE'].map(prio => {
          const items = RECOMMANDATIONS.filter(r => r.priorite === prio);
          const prioColor = prio === 'HAUTE' ? '#ef4444' : prio === 'MOYENNE' ? '#eab308' : '#3b82f6';
          const prioLabel = prio === 'HAUTE' ? 'Haute priorite — Actions recommandees rapidement' : prio === 'MOYENNE' ? 'Moyenne priorite — A planifier' : 'Basse priorite — Ameliorations long terme';
          return (
            <Card key={prio} title={prioLabel}>
              {items.map((r, i) => (
                <div key={i} style={{ padding: '14px 0', borderBottom: i < items.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#e8e6e0' }}>{r.titre}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Badge text={r.priorite} color={prioColor} />
                      <Badge text={r.delai} color="#3b82f6" />
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#9e9b93', lineHeight: 1.6, marginBottom: 4 }}>{r.desc}</div>
                  <div style={{ fontSize: 10, color: '#888' }}>Impact : {r.impact}</div>
                </div>
              ))}
            </Card>
          );
        })}

        {/* Conclusion */}
        <Card style={{ background: 'rgba(34,197,94,.04)', border: '1px solid rgba(34,197,94,.15)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Conclusion</div>
          <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.8 }}>
            Aureus Social Pro presente un <b style={{ color: '#22c55e' }}>bon niveau de securite</b> et une
            <b style={{ color: '#22c55e' }}> conformite legale solide</b>. Le moteur de paie est complet et conforme
            aux taux belges 2026. Les principaux efforts doivent porter sur le <b style={{ color: '#eab308' }}>refactoring architectural</b> (decoupage
            du monolithe), l'<b style={{ color: '#eab308' }}>outillage qualite</b> (linter, tests composants) et un
            <b style={{ color: '#eab308' }}> pen test externe</b> avant la mise en production avec donnees reelles.
          </div>
          <div style={{ fontSize: 10, color: '#888', marginTop: 12 }}>
            Rapport genere par Aureus IA — {DATE_AUDIT} — Version {VERSION}
          </div>
        </Card>
      </div>}

      {/* ═══ FOOTER ═══ */}
      <div style={{ textAlign: 'center', padding: '20px 0', borderTop: '1px solid ' + BORDER, marginTop: 20 }}>
        <div style={{ fontSize: 10, color: '#5e5c56' }}>
          Aureus Social Pro — Audit de Securite & Qualite du Code — {DATE_AUDIT}
        </div>
        <div style={{ fontSize: 9, color: '#444', marginTop: 4 }}>
          Aureus IA SPRL — BCE BE 1028.230.781 — Bruxelles, Belgique
        </div>
      </div>
    </div>
  );
}

export default AuditSecuriteCode;
