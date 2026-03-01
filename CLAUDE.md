# CLAUDE.md — Aureus Social Pro

## Projet

**Aureus Social Pro** est un logiciel SaaS de gestion de paie et de secretariat social pour la Belgique, developpe par Aureus IA SPRL. Il couvre le calcul des salaires, les declarations ONSS (DmfA, Dimona), la fiscalite belge (precompte professionnel, Belcotax), la gestion RH, et la conformite RGPD/SOC2/ISO27001.

- **URL production** : `https://aureussocial.be` / `https://app.aureussocial.be`
- **Langue principale** : francais (Belgique), interface `lang="fr"`
- **Couleur theme** : or `#c6a34e` sur fond sombre `#060810`

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | **Next.js 15** (App Router) |
| Langage | **JavaScript** (pas de TypeScript) |
| UI | **React 19**, inline styles, pas de CSS framework |
| CSS | `app/responsive.css` pour le responsive, reste en inline styles |
| Backend/BDD | **Supabase** (PostgreSQL + Auth + Realtime + RLS) |
| Auth | Supabase Auth (email/password + MFA TOTP) |
| Deploiement | **Vercel** |
| PWA | Service Worker (`public/sw.js`) + `manifest.json` |
| CI/CD | GitHub Actions (`test-paie.yml`, `owasp-zap.yml`) |
| Package manager | **npm** |

## Commandes

```bash
npm run dev      # Serveur de developpement (port 3000)
npm run build    # Build production Next.js
npm run start    # Demarrer le serveur production

# Tests
node tests/test-paie.js       # Tests du moteur de paie belge
node tests/test-api-routes.js  # Tests des routes API
```

> **Pas de linter ni de prettier configures.** Le code n'utilise pas ESLint/Prettier.

## Structure du projet

```
aureus-social-v18/
├── app/                          # Next.js App Router
│   ├── layout.js                 # Layout racine (HTML, meta, Service Worker)
│   ├── page.js                   # Point d'entree : auth check → Login ou App
│   ├── LoginPage.js              # Page de connexion (email/password + MFA)
│   ├── AureusSocialPro.js        # FICHIER PRINCIPAL (~27 600 lignes)
│   ├── error.js                  # Error boundary Next.js
│   ├── global-error.js           # Global error boundary
│   ├── responsive.css            # Styles responsive (media queries)
│   │
│   ├── api/                      # Routes API Next.js
│   │   ├── admin/                # Administration
│   │   ├── agent/                # Agent IA legal
│   │   ├── baremes/              # Baremes salariaux
│   │   ├── bce/                  # Banque-Carrefour des Entreprises
│   │   ├── cron/                 # Taches planifiees
│   │   ├── dms/                  # Document Management System
│   │   ├── esign/                # Signature electronique
│   │   ├── geocheck/             # Verification geolocalisation IP
│   │   ├── health/               # Health check
│   │   ├── invite/               # Invitations
│   │   ├── lois-update/          # Mise a jour des lois
│   │   ├── monitoring/           # Monitoring applicatif
│   │   ├── onss/                 # Declarations ONSS
│   │   ├── push/                 # Notifications push
│   │   ├── save-beacon/          # Sauvegarde via Beacon API
│   │   ├── scan-paie/            # Scanner fiches de paie
│   │   ├── send-email/           # Envoi d'emails (Resend)
│   │   ├── status/               # Page de statut
│   │   ├── v1/                   # API RESTful versionnee
│   │   │   ├── declarations/     #   Declarations sociales
│   │   │   ├── docs/             #   Documents
│   │   │   ├── employees/        #   Employes
│   │   │   └── payroll/          #   Calculs de paie
│   │   ├── veille-juridique/     # Veille juridique automatisee
│   │   └── webhooks/             # Webhooks entrants
│   │
│   ├── lib/                      # Librairies metier (cote client)
│   │   ├── index.js              # Re-exports centralises
│   │   ├── supabase.js           # Client Supabase singleton
│   │   ├── calc-paie.js          # Moteur de calcul de paie (~106K)
│   │   ├── calc-pp.js            # Precompte professionnel
│   │   ├── calc-independant.js   # Calcul independants
│   │   ├── lois-belges.js        # Base de donnees des lois belges
│   │   ├── crypto.js             # Chiffrement AES-256 (NISS/IBAN)
│   │   ├── persistence.js        # Sauvegarde Supabase + localStorage
│   │   ├── realtime.js           # Supabase Realtime subscriptions
│   │   ├── xml-generators.js     # Generateurs XML (DmfA, Dimona, SEPA, Belcotax)
│   │   ├── csv-parsers.js        # Parseurs CSV
│   │   ├── pdf-export.js         # Export PDF
│   │   ├── onss-client.js        # Client ONSS
│   │   ├── multi-devise.js       # Support multi-devises
│   │   ├── module-registry.js    # Registre des modules + lazy loading
│   │   ├── marketplace-import.js # Import comptable (BOB50, Winbooks, Exact)
│   │   ├── ux-utils.js           # Utilitaires UX
│   │   ├── failover.js           # Failover et resilience
│   │   ├── backup.js             # Backup automatise
│   │   ├── api-security.js       # Securite API
│   │   ├── calc-worker-bridge.js # Bridge Web Worker
│   │   └── agent-simulateur.js   # Simulateur agent IA
│   │
│   └── modules/                  # Modules React (composants metier)
│       ├── PayrollHub.js         # Hub paie (validation, timeline, solde)
│       ├── EmployeeHub.js        # Gestion employes
│       ├── DeclarationsFiscalV2.js  # ONSS, export compta, budget
│       ├── PrimesAvantagesV2.js  # Primes et avantages (133K — le plus gros)
│       ├── AbsencesContratsV3.js # Conges, absences, contrats
│       ├── ProceduresRH*.js      # ~55 fichiers de procedures RH
│       ├── BaremesCP.js          # Baremes commissions paritaires
│       ├── SecurityDashboard.js  # Tableau de bord securite
│       ├── AccessManagement.js   # Gestion des acces/permissions
│       ├── CommissionsModule.js  # Commissions paritaires
│       ├── FloatingLegalAgent.js # Agent juridique flottant (IA)
│       ├── OnboardingHub.js      # Onboarding nouveaux employes
│       ├── PortalSystem.js       # Systeme de portails
│       ├── TransversalCP.js      # Commissions paritaires transversales
│       ├── AutoAdminV3.js        # Admin automatise (RBAC)
│       ├── SmartOpsCenter.js     # Centre d'operations
│       └── ...                   # (voir listing complet dans app/modules/)
│
├── lib/                          # Librairies cote serveur
│   └── security/
│       ├── auth.js               # Authentification cote serveur
│       └── encryption.js         # Chiffrement cote serveur
│
├── middleware.js                  # Middleware Next.js (rate limiting, CORS, CSP, IP whitelist)
├── public/                       # Assets statiques
│   ├── sw.js                     # Service Worker (offline, cache)
│   ├── manifest.json             # PWA manifest
│   ├── landing.html              # Landing page statique
│   ├── compliance.html           # Page conformite/trust center
│   ├── calc-worker.js            # Web Worker pour calculs lourds
│   └── ...                       # Icones, favicons
│
├── supabase/migrations/          # Migrations SQL Supabase
├── docs/                         # Documentation conformite
│   ├── compliance/               # Documents de conformite
│   ├── iso27001/                 # Politique ISO 27001
│   ├── rgpd/                     # Documentation RGPD
│   ├── security/                 # Politique de securite
│   └── soc2/                     # Documentation SOC 2
│
├── tests/                        # Tests
│   ├── test-paie.js              # Tests moteur de paie
│   └── test-api-routes.js        # Tests routes API
│
├── ARCHITECTURE.js               # Plan d'architecture de decoupage
├── next.config.js                # Configuration Next.js
├── vercel.json                   # Configuration Vercel (headers securite, rewrites)
├── jsconfig.json                 # Alias `@/*` vers racine
└── package.json                  # Dependances (Next.js 15, React 19, Supabase)
```

## Architecture critique

### Le fichier monolithique

`app/AureusSocialPro.js` est le fichier principal (~27 600 lignes, ~2.6 MB). Il contient :
- L'objet `LOIS_BELGES` (constantes legales belges pour l'annee en cours)
- Le state management centralise via `useReducer`
- La sidebar et le systeme de navigation
- L'orchestration de tous les modules

**Attention** : Ce fichier est extremement volumineux. Toute modification doit etre chirurgicale. Privilegier les modifications dans les modules extraits (`app/modules/`, `app/lib/`) plutot que dans ce fichier.

### Module Registry (lazy loading)

Les modules sont charges dynamiquement via `app/lib/module-registry.js`. Le manifeste definit des poids : `core`, `heavy`, `medium`, `light`. Utiliser `dynamic()` de Next.js ou le registre pour le lazy loading.

### Moteur de paie

Le moteur de calcul (`app/lib/calc-paie.js`, ~106K) est le coeur metier. Il implemente :
- Calcul brut → net selon la legislation belge
- Cotisations ONSS (travailleur + employeur)
- Precompte professionnel (baremes belges)
- Bonus a l'emploi, reductions groupes cibles
- Specifiques ouvriers (majoration 108%)

### Persistance des donnees

Modele dual : **localStorage** (sauvegarde immediate) + **Supabase** (sync cloud avec chiffrement AES-256). Voir `app/lib/persistence.js`.

## Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=        # URL du projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Cle anonyme Supabase
SUPABASE_SERVICE_KEY=            # Cle service (API routes)
ALLOWED_ORIGIN=                  # Origine CORS autorisee
IP_WHITELIST=                    # CIDR pour restreindre l'acces API (optionnel)
RESEND_API_KEY=                  # Cle API Resend pour les emails
ANTHROPIC_API_KEY=               # Cle API Anthropic (agent juridique IA)
```

## Conventions de code

### Nommage
- **Fichiers modules** : PascalCase (`PayrollHub.js`, `AbsencesContratsV3.js`)
- **Fichiers lib** : kebab-case (`calc-paie.js`, `xml-generators.js`)
- **Routes API** : kebab-case (`send-email`, `scan-paie`, `lois-update`)
- **Composants React** : PascalCase, export default ou named exports
- **Variables/fonctions** : camelCase
- **Constantes globales** : UPPER_SNAKE_CASE (`LOIS_BELGES`, `STORE_KEY`)

### Style de code
- JavaScript pur (pas de TypeScript)
- Inline styles React (pas de CSS-in-JS ni Tailwind)
- Pas de point-virgule obligatoire (style mixte dans le code existant)
- Commentaires en francais avec separateurs visuels (`// ═══ SECTION ═══`)
- Les sprints sont references en commentaires (`// ═══ SPRINT 37: ... ═══`)

### Patterns recurrents
- `'use client'` en haut de chaque composant React
- Les modules exportent souvent plusieurs composants nommes
- Les routes API utilisent le pattern Next.js App Router (`route.js` avec `export async function GET/POST`)
- L'authentification passe par Supabase Auth avec verification MFA
- Multi-tenant via RLS (Row Level Security) Supabase

## Securite

Le projet accorde une importance particuliere a la securite :

- **Middleware** (`middleware.js`) : rate limiting (60 req/min), CORS, CSP, IP whitelist CIDR, headers de securite (HSTS, X-Frame-Options, etc.)
- **Chiffrement** : AES-256 pour les donnees sensibles (NISS, IBAN) via `app/lib/crypto.js`
- **Auth** : Supabase Auth + MFA TOTP + verification GeoIP
- **RLS** : Row Level Security au niveau Supabase pour le multi-tenant
- **CI/CD securite** : OWASP ZAP scan automatise (`.github/workflows/owasp-zap.yml`)
- **Docs conformite** : ISO 27001, SOC 2, RGPD dans `docs/`
- **Ne jamais committer** : `.env*`, `.onss-credentials/`, cles privees

## Tests

Les tests s'executent avec Node.js directement (pas de framework de test) :

```bash
node tests/test-paie.js         # Verifie les calculs de paie belge
node tests/test-api-routes.js   # Verifie les routes API
```

La CI GitHub Actions execute `test-paie.js` sur chaque push/PR vers `main`.

## Regles pour les assistants IA

1. **Ne jamais modifier `AureusSocialPro.js` sauf absolue necessite** — Privilegier les modules dans `app/modules/` et `app/lib/`.
2. **Respecter la legislation belge** — Les constantes dans `LOIS_BELGES` doivent correspondre aux taux officiels (SPF Finances, ONSS, Moniteur Belge).
3. **Ne jamais committer de secrets** — Pas de cles API, tokens, credentials dans le code.
4. **Tester les calculs de paie** — Apres toute modification du moteur de paie, executer `node tests/test-paie.js`.
5. **Garder le francais** — L'interface et les commentaires sont en francais.
6. **Inline styles** — Ne pas introduire de framework CSS. Utiliser les inline styles React comme le reste du code.
7. **Pas de TypeScript** — Le projet est en JavaScript pur. Ne pas ajouter de fichiers `.ts` ou `.tsx`.
8. **Lazy loading** — Les nouveaux modules doivent etre charges dynamiquement via `dynamic()` ou le module registry.
9. **Securite d'abord** — Toute route API doit etre protegee par authentification. Les donnees sensibles doivent etre chiffrees.
10. **Verifier les effets de bord** — Le fichier monolithique a de nombreuses dependances internes. Verifier que les modifications ne cassent pas d'autres fonctionnalites.
