# CLAUDE.md — Aureus Social Pro

## Project Overview

**Aureus Social Pro** is a Belgian payroll management and social secretariat SaaS application built for HR professionals and accountants. It handles payroll calculations, ONSS (social security) declarations, tax withholding, employee management, legal compliance (GDPR/RGPD), and document generation — all under Belgian labor law.

- **Company**: Aureus IA SPRL
- **Domain**: `aureussocial.be` / `app.aureussocial.be`
- **Language**: French (primary), Dutch (secondary) — the UI and comments are predominantly in French
- **Deployment**: Vercel (Next.js)
- **Database**: Supabase (PostgreSQL with Row Level Security)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.1+ (App Router) |
| React | React 19 |
| Language | JavaScript (no TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (email/password + MFA/TOTP) |
| Styling | CSS custom properties + inline styles (no CSS framework) |
| Encryption | Web Crypto API (AES-256-GCM, PBKDF2) |
| Email | Resend API |
| AI | Anthropic API (legal agent/simulator) |
| Hosting | Vercel |
| PWA | Service Worker (`public/sw.js`) + manifest |

## Quick Commands

```bash
npm run dev      # Start development server (next dev)
npm run build    # Production build (next build)
npm run start    # Start production server (next start)

# Tests (no test runner framework — plain Node.js scripts)
node tests/test-paie.js          # Payroll calculation tests
node tests/test-api-routes.js    # API route security tests
```

## Repository Structure

```
aureus-social-v18/
├── app/                          # Next.js App Router
│   ├── page.js                   # Entry point — auth gate (login or main app)
│   ├── layout.js                 # Root layout (fr lang, PWA, service worker)
│   ├── LoginPage.js              # Login with MFA, signup, password reset
│   ├── AureusSocialPro.js        # ⚠️ MAIN MONOLITH (~27,600 lines)
│   ├── error.js                  # Error boundary
│   ├── global-error.js           # Global error boundary
│   ├── responsive.css            # Full design system (CSS variables, themes)
│   ├── api/                      # API routes (see section below)
│   ├── lib/                      # Shared utility modules
│   └── modules/                  # Extracted UI modules (lazy-loaded)
├── lib/
│   └── security/                 # Server-side security utilities
│       ├── auth.js               # Password validation, session timer, audit log
│       └── encryption.js         # AES-256-GCM encryption (server-side)
├── tests/                        # Test files (plain Node.js, no framework)
├── supabase/
│   └── migrations/               # SQL migration files
├── docs/                         # Compliance documentation
│   ├── compliance/               # Bug bounty, GDPR, ISO 27001, SOC2
│   ├── iso27001/                 # ISO 27001 ISMS documentation
│   ├── rgpd/                     # GDPR/RGPD documentation
│   ├── security/                 # Bug bounty program
│   └── soc2/                     # SOC2 Type II controls
├── public/                       # Static assets, PWA files, compliance PDFs
├── .github/workflows/            # CI/CD pipelines
├── middleware.js                  # Security middleware (rate limiting, CORS, CSP, headers)
├── ARCHITECTURE.js               # Module decomposition plan
├── supabase-migration.sql        # Main database schema with RLS
├── next.config.js                # Next.js configuration
├── vercel.json                   # Vercel deployment config (security headers, rewrites)
└── package.json                  # Dependencies (minimal — 4 deps)
```

## Architecture

### The Monolith: `app/AureusSocialPro.js`

The core application is a **single ~27,600-line React component** (`AureusSocialPro.js`). This is the historical monolith that contains most business logic, UI components, and state management in one file. An ongoing decomposition effort (documented in `ARCHITECTURE.js`) is splitting it into modules under `app/modules/`.

**When modifying business logic**: Check if the relevant code lives in `AureusSocialPro.js` or has been extracted to `app/modules/` or `app/lib/`.

### Module System (`app/modules/`)

Extracted modules are lazy-loaded via `app/modules/LazyModuleLoader.js` using React `lazy()` + `Suspense`. Key module groups:

- **EmployeeHub** — Employee registry, dashboard, portal, interim workers
- **PayrollHub** — Payroll validation, timeline, settlement, annual costs, simulators
- **PrimesAvantagesV2** — Bonuses, tax optimization, company cars, meal vouchers, flexi-jobs
- **ProceduresRH*** — ~60+ Belgian HR procedure modules (dismissal, maternity, sick leave, etc.)
- **SecurityDashboard / SecurityMonitoring** — Security operations
- **DPODashboard / GDPRPortal** — GDPR compliance
- **SimulateurNetBrut** — Net-to-gross salary simulator
- **SmartOpsCenter** — Operations center
- **StatusPage** — Public status page

### Library Modules (`app/lib/`)

| Module | Purpose |
|---|---|
| `supabase.js` | Singleton Supabase client |
| `lois-belges.js` | Belgian legal constants (ONSS rates, tax brackets, CSSS, etc.) |
| `calc-paie.js` | Core payroll calculation engine |
| `calc-pp.js` | Professional withholding tax (précompte professionnel) |
| `calc-independant.js` | Self-employed calculations |
| `crypto.js` | Client-side AES-256-GCM encryption (NISS, IBAN fields) |
| `persistence.js` | Supabase + localStorage state persistence |
| `xml-generators.js` | DmfA, Dimona, SEPA, Belcotax XML generation |
| `pdf-export.js` | PDF generation for payslips, attestations |
| `csv-parsers.js` | CSV import/export |
| `api-security.js` | API rate limiting (token + IP based) |
| `onss-client.js` | ONSS (social security) API client |
| `realtime.js` | Supabase realtime subscriptions |
| `failover.js` | Multi-region failover |
| `multi-devise.js` | Multi-currency support |
| `agent-simulateur.js` | AI-powered legal agent (Anthropic API) |
| `module-registry.js` | Dynamic module loading registry |
| `ux-utils.js` | UI utility functions |
| `index.js` | Barrel export for common modules |

## API Routes

All routes are under `app/api/`. The middleware (`middleware.js`) applies rate limiting, CORS, security headers, and IP whitelisting.

### Public API v1 (requires authentication)
| Route | Method | Purpose |
|---|---|---|
| `/api/v1/payroll` | POST | Calculate payslips |
| `/api/v1/employees` | GET/POST | Employee CRUD |
| `/api/v1/declarations` | GET/POST | Social declarations |
| `/api/v1/docs` | GET | Document generation |

### Internal APIs
| Route | Purpose |
|---|---|
| `/api/health` | Health check (public basic / deep with auth) |
| `/api/status` | Application status |
| `/api/baremes` | Legal rate tables |
| `/api/baremes/historique` | Historical rate tables |
| `/api/bce` | Belgian company registry lookup |
| `/api/onss/dimona` | Dimona declarations to ONSS |
| `/api/onss/status` | ONSS declaration status |
| `/api/send-email` | Email sending (via Resend) |
| `/api/push` | Web push notifications |
| `/api/invite` | User invitation |
| `/api/scan-paie` | Payslip scanning/OCR |
| `/api/agent` | AI legal agent |
| `/api/esign` | Electronic signatures |
| `/api/dms` | Document management |
| `/api/geocheck` | GeoIP login verification |
| `/api/save-beacon` | Save state on page close |
| `/api/webhooks` | Incoming webhooks |
| `/api/veille-juridique` | Legal watch/updates |
| `/api/lois-update` | Law update endpoint |
| `/api/monitoring` | Application monitoring |
| `/api/cron` | Scheduled tasks |
| `/api/admin/key-rotation` | Encryption key rotation |

## Database Schema (Supabase)

All tables have **Row Level Security (RLS)** enabled. Users can only access their own data.

| Table | Purpose |
|---|---|
| `app_state` | Main application state (JSONB, per user) |
| `user_roles` | Role management (admin, gestionnaire, readonly) |
| `email_log` | Email sending audit trail |
| `payroll_history` | Payroll calculation history |
| `activity_log` | User activity audit (append-only, GDPR Art. 30) |
| `audit_log` | System audit logs |
| `audit_logs` | Extended audit logs (from `lib/security/auth.js`) |

### Key patterns:
- All tables use `UUID` primary keys via `gen_random_uuid()`
- `user_id` references `auth.users(id)` with `ON DELETE CASCADE`
- `updated_at` triggers auto-update via `update_updated_at()` function
- Data retention: activity/audit logs purged after 2 years (GDPR compliance)
- Migrations in `supabase/migrations/` (RLS, multi-tenant, security)

## Environment Variables

Required variables (set in Vercel / `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL          # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     # Supabase anonymous key
SUPABASE_SERVICE_ROLE_KEY         # Service role key (server-side only)
ENCRYPTION_KEY                    # AES-256 encryption key (min 32 chars)
CRON_SECRET                       # Secret for cron/health deep checks
ALLOWED_ORIGIN                    # Additional allowed CORS origin
IP_WHITELIST                      # CIDR whitelist for admin/API routes (optional)
```

**Never commit `.env`, `.env.local`, or any credential files.** The `.onss-credentials/` directory contains private ONSS certificates and is gitignored.

## Security Considerations

This application handles sensitive payroll and personal data under Belgian and EU law. Security is critical.

### Middleware (`middleware.js`)
- **Rate limiting**: 60 req/min per IP on API routes
- **CORS**: Strict origin matching (exact match, not `startsWith`)
- **IP whitelisting**: CIDR-based for `/api/v1/` and `/api/cron` routes
- **Security headers**: HSTS, X-Frame-Options: DENY, CSP, nosniff, XSS protection
- **CSP**: Restricts script/connect sources to self + Supabase + approved CDNs

### Encryption
- **Client-side**: AES-256-GCM via Web Crypto API for NISS (national ID) and IBAN fields
- **Server-side**: AES-256-GCM with PBKDF2 key derivation from `ENCRYPTION_KEY`
- **Key derivation**: 100,000 PBKDF2 iterations with SHA-256

### Authentication
- Supabase Auth with email/password
- MFA/TOTP support (AAL2)
- GeoIP login verification
- Session timeout: 15 min inactivity (configurable)
- Password policy: min 12 chars, uppercase, lowercase, digit, special char

### Compliance
- **GDPR/RGPD**: Full compliance (DPO documentation, data retention, right to erasure via CASCADE)
- **ISO 27001**: ISMS documentation in `docs/iso27001/`
- **SOC2 Type II**: Control matrix in `docs/soc2/`
- **Bug Bounty**: Program documented in `docs/security/`

## Testing

Tests use **plain Node.js** scripts (no Jest, Mocha, etc.). They run with `node tests/<file>.js`.

### `tests/test-paie.js`
- Payroll calculation unit tests for Belgian 2026 tax year
- Loads and parses `AureusSocialPro.js` source directly (extracts functions via string parsing)
- Stubs browser globals (React, DOM, localStorage, etc.) for Node.js execution

### `tests/test-api-routes.js`
- API security tests (CORS validation, input validation, rate limiting)
- Tests both correct and vulnerable implementations

### CI/CD (`.github/workflows/`)
- **test-paie.yml**: Runs `node tests/test-paie.js` on push/PR to `main` (Node 20)
- **owasp-zap.yml**: OWASP ZAP security scans (baseline + API) weekly and on push/PR to `main`

## Coding Conventions

### General
- **JavaScript only** — no TypeScript in this project
- **No CSS framework** — inline styles + CSS custom properties in `responsive.css`
- **French naming** in domain-specific code (e.g., `calcPrecompteProfessionnel`, `brutMensuel`, `employeur`)
- **English naming** for technical/infrastructure code (e.g., `checkRateLimit`, `deriveKey`)
- Path aliases: `@/*` maps to project root (via `jsconfig.json`)
- All client components use `'use client'` directive
- `React.createElement` style (not JSX) in some extracted modules

### Design System
- Dark theme by default (`--au-bg: #0c0b09`), light theme via `[data-theme="light"]`
- Gold accent color: `--au-gold: #c6a34e`
- Font: Outfit (sans-serif), JetBrains Mono (code), Cormorant Garamond (serif)
- CSS variables prefixed with `--au-`
- Border radius: `--au-radius: 12px` (standard), `--au-radius-sm: 8px`, `--au-radius-lg: 20px`

### API Routes
- All API routes validate input and return JSON
- CORS headers applied by both middleware and individual routes
- Rate limiting: middleware-level (60/min/IP) + API security module (120/min/token, 30/min/IP)
- Authentication via Supabase tokens or `CRON_SECRET` for system endpoints

### Data Handling
- Sensitive fields (NISS, IBAN) encrypted at rest with AES-256-GCM
- State persisted to Supabase with localStorage fallback
- Debounced auto-save (500ms-2000ms depending on save frequency)
- All Supabase queries go through RLS — no service-role key on the client

## Belgian Payroll Domain Knowledge

Key domain concepts referenced throughout the codebase:

| Term | Meaning |
|---|---|
| ONSS | Office National de Sécurité Sociale (social security) |
| Précompte Professionnel (PP) | Professional withholding tax |
| CSSS | Cotisation Spéciale de Sécurité Sociale |
| DmfA | Déclaration multifonctionnelle (quarterly ONSS declaration) |
| Dimona | Declaration of employment start/end |
| NISS | Numéro d'Identification Sécurité Sociale (Belgian SSN) |
| Bonus emploi | Employment bonus (tax reduction for low wages) |
| Pécule de vacances | Holiday pay |
| Treizième mois | 13th month bonus |
| Barèmes | Legal wage scales |
| Commission Paritaire (CP) | Joint committee (sector-specific labor agreements) |
| CCT / CAO | Collective labor agreement |
| Belcotax | Tax filing XML format |
| SEPA | Payment XML format |
| C4 | Employment termination certificate |
| RCC | Régime de chômage avec complément d'entreprise (early retirement) |

## Important Warnings

1. **The monolith (`AureusSocialPro.js`) is ~27,600 lines.** Reading it entirely will consume significant context. Target specific functions by searching for their names.
2. **Belgian law changes annually.** Tax brackets, ONSS rates, and CSSS thresholds in `lois-belges.js` are for 2026. Always verify against the current year's `_meta.version`.
3. **Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ENCRYPTION_KEY` to the client.** These are server-only.
4. **CORS uses exact origin matching** (not `startsWith`). This was a fixed vulnerability — do not regress.
5. **Test files parse source code directly** rather than importing modules. When modifying `AureusSocialPro.js`, ensure the test extraction patterns still work.
6. **The `.onss-credentials/` directory** must never be committed to git. It contains private certificates for ONSS API communication.
