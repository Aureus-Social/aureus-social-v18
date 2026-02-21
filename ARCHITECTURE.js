// ═══════════════════════════════════════════════════════════════════
// AUREUS SOCIAL PRO — Architecture de découpage en modules
// ═══════════════════════════════════════════════════════════════════
// Actuellement: 1 fichier de 29.379 lignes (2.4 MB)
// Objectif: 12 modules avec lazy loading
// Impact: chargement ~300ms au lieu de ~10s sur mobile
// ═══════════════════════════════════════════════════════════════════
//
// Phase 1 (Sprint D) — Extraire les modules sans JSX:
//   app/lib/lois-belges.js      — LOIS_BELGES + LOIS_BELGES_TIMELINE (~400 lignes)
//   app/lib/calc-paie.js        — calc() + helpers (~1200 lignes)
//   app/lib/calc-independant.js — calcIndependant() (~250 lignes)
//   app/lib/calc-pp.js          — calcPrecompteExact() + calcCSSS() + calcBonusEmploi() (~200 lignes)
//   app/lib/crypto.js           — Chiffrement AES-256 NISS/IBAN (~120 lignes)
//   app/lib/persistence.js      — Supabase save/load + localStorage (~200 lignes)
//   app/lib/xml-generators.js   — DmfA, Dimona, SEPA, Belcotax XML (~800 lignes)
//   app/lib/pdf-generators.js   — Fiches paie, C4, attestations (~1500 lignes)
//   app/lib/translations.js     — I18N fr/nl (~300 lignes)
//
// Phase 2 (Sprint E) — Extraire les composants React:
//   app/components/Dashboard.jsx        — KPI Dashboard (~2000 lignes)
//   app/components/EmployeeManager.jsx  — Gestion employés (~3000 lignes)
//   app/components/PayrollTab.jsx       — Onglet paie (~2000 lignes)
//   app/components/ClientPortal.jsx     — Portail client (~1500 lignes)
//   app/components/Documents.jsx        — Génération documents (~2000 lignes)
//   app/components/Settings.jsx         — Paramètres (~1000 lignes)
//   app/components/AdminPanel.jsx       — Panel admin Supabase (~1500 lignes)
//   app/components/OnboardingWizard.jsx — Onboarding (~800 lignes)
//   app/components/PilotProgram.jsx     — Programme pilote (~500 lignes)
//
// Phase 3 (Sprint F) — Optimisation:
//   - dynamic import() pour lazy loading
//   - React.memo() sur les composants lourds
//   - useMemo() pour les calculs coûteux
//   - Code splitting via Next.js
//   - Bundle analyzer pour vérifier les tailles
//
// TOTAL ESTIMÉ: 12-15 fichiers au lieu de 1
// GAIN PERF: ~80% réduction du temps de chargement initial
// ═══════════════════════════════════════════════════════════════════

module.exports = { ARCHITECTURE_VERSION: '1.0' };
