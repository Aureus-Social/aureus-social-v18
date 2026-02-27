# Plan de Décomposition — Monolithe → Modules
## Aureus Social Pro — Architecture Microservices

**Version :** 1.0 | **Date :** 27/02/2026

---

## État actuel

```
AureusSocialPro.js — 32,632 lignes (MONOLITHE)
├── Moteur de calcul paie (~4,000 lignes)
│   ├── calcPaie()
│   ├── calcPrecompteExact() (140 lignes, 16 paramètres)
│   ├── calcBonusEmploi()
│   ├── calcCotisationsONSS()
│   ├── calcCSS() (Cotisation Spéciale SS)
│   └── Barèmes 229 CP
├── Gestion employés (~3,000 lignes)
├── Déclarations (DmfA, DIMONA, Belcotax) (~3,500 lignes)
├── Interface utilisateur (~15,000 lignes)
├── État / Reducer (~2,000 lignes)
├── Constantes belges (~2,500 lignes)
│   ├── LOIS_BELGES (barèmes PP)
│   ├── BAREMES_CP (commissions paritaires)
│   └── PRECOMPTE_SCALES
├── Utilitaires (~1,500 lignes)
└── Module admin / RBAC (~1,000 lignes)
```

**Problèmes :**
- Chargement initial : 32K lignes = ~1.5MB de JS parsé au démarrage
- Time to Interactive : >3 secondes sur mobile
- Difficulté de maintenance : une modification peut impacter tout le fichier
- Tests : un test doit charger tout le fichier
- Mémoire : toutes les constantes chargées même si non utilisées

---

## Architecture cible

```
app/
├── core/                          # Noyau applicatif (toujours chargé)
│   ├── engine/
│   │   ├── calcPaie.js            # Moteur de calcul (~800 lignes)
│   │   ├── calcPrecompte.js       # PP calculation (~200 lignes)
│   │   ├── calcONSS.js            # Cotisations ONSS (~150 lignes)
│   │   ├── calcBonusEmploi.js     # Bonus emploi fiscal (~100 lignes)
│   │   ├── calcCSS.js             # Cotisation spéciale SS (~50 lignes)
│   │   └── index.js               # Re-export tout
│   ├── constants/
│   │   ├── lois-belges.js         # Barèmes PP (~500 lignes)
│   │   ├── baremes-cp.js          # 229 CP (~1200 lignes)
│   │   ├── precompte-scales.js    # Tables PP (~300 lignes)
│   │   └── index.js
│   ├── state/
│   │   ├── reducer.js             # State management (~500 lignes)
│   │   ├── actions.js             # Action types
│   │   └── selectors.js           # Computed values
│   └── utils/
│       ├── validation.js          # NISS, IBAN, BCE validation
│       ├── formatting.js          # Dates, currency, numbers
│       ├── crypto.js              # Hash, signatures
│       └── i18n.js                # FR/NL/DE translations
│
├── modules/                       # Lazy-loaded (existant, amélioré)
│   ├── LazyModuleLoader.js        # Dynamic import router (CRÉÉ)
│   ├── EmployeeHub.js             # Already extracted
│   ├── PayrollHub.js              # Already extracted
│   ├── PrimesAvantagesV2.js       # Already extracted
│   ├── DeclarationsFiscalV2.js    # Already extracted
│   ├── AbsencesContratsV3.js      # Already extracted
│   ├── AutoAdminV3.js             # Already extracted
│   ├── DashboardCharts.js         # NEW
│   ├── SimulateurNetBrut.js       # NEW
│   ├── CalendrierSocial.js        # NEW
│   ├── ComparaisonPeriodes.js     # NEW
│   ├── AttestationsLegales.js     # NEW
│   ├── FormationSuivi.js          # NEW
│   ├── DPODashboard.js            # NEW
│   └── MarketplaceConnectors.js   # NEW
│
├── api/                           # API routes (déjà isolées)
│   ├── v1/employees/
│   ├── v1/payroll/
│   ├── v1/declarations/
│   ├── v1/docs/
│   └── health/
│
├── lib/                           # Shared utilities
│   ├── supabase.js
│   ├── ux-utils.js                # Toast, Command Palette, etc.
│   ├── api-security.js            # Rate limiting, audit
│   ├── pdf-export.js              # Branded PDF
│   ├── realtime.js                # Supabase realtime
│   └── backup.js                  # Export/restore
│
└── AureusSocialPro.js             # Shell (reduced to ~5K lines)
    ├── AppInner (routing, sidebar)
    ├── Reducer (state management)
    └── Module rendering (via LazyModuleLoader)
```

---

## Plan de migration en 6 phases

### Phase 1 — Extraction du moteur de calcul (Priorité CRITIQUE)
**Durée :** 16h | **Risque :** Élevé (core business logic)

```
Extraire de AureusSocialPro.js:
  - calcPaie()          → core/engine/calcPaie.js
  - calcPrecompteExact()→ core/engine/calcPrecompte.js  
  - calcONSS()          → core/engine/calcONSS.js
  - calcBonusEmploi()   → core/engine/calcBonusEmploi.js
  - calcCSS()           → core/engine/calcCSS.js

Tests: Exécuter 59 tests existants AVANT et APRÈS extraction
Validation: Calcul paie identique au centime près
```

### Phase 2 — Extraction des constantes (Priorité HAUTE)
**Durée :** 8h | **Risque :** Faible

```
Extraire:
  - LOIS_BELGES         → core/constants/lois-belges.js
  - BAREMES_CP          → core/constants/baremes-cp.js
  - PRECOMPTE_SCALES    → core/constants/precompte-scales.js
  - NACE_CODES          → core/constants/nace-codes.js
  - Tous les tableaux   → core/constants/tables.js

Impact: Lazy-load des barèmes = startup time réduit de ~40%
```

### Phase 3 — Extraction du state management (Priorité HAUTE)
**Durée :** 12h | **Risque :** Moyen

```
Extraire:
  - mainReducer()       → core/state/reducer.js
  - Tous les dispatch   → core/state/actions.js
  - Computed values     → core/state/selectors.js
  - Context providers   → core/state/providers.js

Impact: Reducer testable indépendamment, type-safe
```

### Phase 4 — Lazy loading de tous les modules UI (Priorité MOYENNE)
**Durée :** 8h | **Risque :** Faible

```
Remplacer tous les imports statiques par LazyModuleLoader:
  AVANT: import {DashboardRHV2} from './modules/EmployeeHub';
  APRÈS: <LazyModule moduleId="dashboard-rh" {...props} />

Impact: Chargement initial réduit de 32K → ~5K lignes
         Time to Interactive : 3s → <1s
```

### Phase 5 — API microservices (Priorité BASSE)
**Durée :** 24h | **Risque :** Moyen

```
Créer des API routes dédiées:
  /api/v1/engine/calc-paie      → Calcul paie serverless
  /api/v1/engine/calc-pp        → Calcul PP serverless
  /api/v1/engine/simulate       → Simulation net/brut
  /api/v1/reports/masse-sal     → Rapport masse salariale
  /api/v1/reports/bilan-social  → Bilan social

Impact: Calculs côté serveur = moins de charge client
         API réutilisable par des intégrations tierces
```

### Phase 6 — Clean up monolithe (Priorité BASSE)
**Durée :** 16h | **Risque :** Faible

```
AureusSocialPro.js réduit à:
  - Shell applicatif (sidebar, routing, topbar)
  - Context providers
  - Module renderer (LazyModuleLoader)
  - Cible: ~5,000 lignes (de 32,632)

Impact: Maintenance 6x plus facile
         Code review possible par module
         Onboarding développeur: jours → heures
```

---

## Métriques cibles

| Métrique | Actuel | Après Phase 4 | Après Phase 6 |
|----------|--------|---------------|---------------|
| Fichier principal | 32,632 lignes | ~15,000 lignes | ~5,000 lignes |
| JS chargé au startup | ~1.5 MB | ~400 KB | ~200 KB |
| Time to Interactive | ~3s (desktop) | ~1.2s | ~0.8s |
| First Contentful Paint | ~2s | ~0.8s | ~0.5s |
| Modules lazy-loaded | 5 | 35 | 45+ |
| Tests indépendants | Non | Partiellement | Oui |

---

## État actuel de la décomposition

### Déjà extrait (modules existants)
- ✅ EmployeeHub.js (DashboardRH, Registre, Portail, Intérimaires)
- ✅ PayrollHub.js (Validation, Timeline, STC, Coûts, Simulations)
- ✅ PrimesAvantagesV2.js (10 sous-modules)
- ✅ DeclarationsFiscalV2.js (ONSS, Chômage, Compta, Budget)
- ✅ AbsencesContratsV3.js (Congés, Bilan, Analytics, Import, Contrats)
- ✅ AutoAdminV3.js (RBAC, Pointage, Évaluations, Formations, Fiduciaire)
- ✅ SecurityDashboard.js
- ✅ FloatingLegalAgent.js
- ✅ SmartOpsCenter.js
- ✅ OnboardingHub.js
- ✅ BaremesCP.js

### Nouveaux modules v20.3
- ✅ DashboardCharts.js
- ✅ SimulateurNetBrut.js
- ✅ CalendrierSocial.js
- ✅ ComparaisonPeriodes.js
- ✅ AttestationsLegales.js
- ✅ FormationSuivi.js
- ✅ DPODashboard.js
- ✅ LazyModuleLoader.js (routeur dynamique)
- ✅ MarketplaceConnectors.js (Item #37)

### Reste à extraire (dans AureusSocialPro.js)
- ⏳ Moteur de calcul (Phase 1)
- ⏳ Constantes belges (Phase 2)
- ⏳ State management (Phase 3)
- ⏳ Interface shell (Phase 6)

---

*Effort total estimé : 84h (10.5 jours) — exécutable en sprints de 2 semaines*
