# CLAUDE.md — Aureus Social Pro

## Project Overview

Aureus Social Pro is a Belgian payroll management, HR administration, and social security declaration platform built with **Next.js 15**, **React 19**, and **Supabase**. The UI is primarily in **French** (Belgium). It is deployed on **Vercel** and targets Belgian HR professionals, accountants, and social secretariats.

**Production URLs:** `https://app.aureussocial.be`, `https://aureussocial.be`

---

## Quick Reference

```bash
npm run dev      # Start local dev server (Next.js)
npm run build    # Production build
npm start        # Start production server

# Tests (custom Node.js runner, no Jest/Vitest)
node tests/test-paie.js         # 59+ payroll calculation tests
node tests/test-api-routes.js   # 51 API security/validation tests
```

---

## Architecture

### Monolithic Main Component

The app centers on `app/AureusSocialPro.js` (~27,600 lines). A modularization plan exists in `ARCHITECTURE.js` to split this into 12+ lazy-loaded modules across 3 sprints. The extracted modules live in `app/modules/` (99 feature modules) and `app/lib/` (22 utility modules).

### Directory Structure

```
aureus-social-v18/
├── app/
│   ├── page.js                    # Entry point — auth gate (login vs main app)
│   ├── layout.js                  # Root layout (fr lang, PWA, service worker)
│   ├── AureusSocialPro.js         # Main application component (~27.6k lines)
│   ├── LoginPage.js               # Auth UI (login, signup, reset, MFA)
│   ├── error.js / global-error.js # Error boundaries
│   ├── responsive.css             # Global responsive styles
│   ├── api/                       # 27 Next.js API route handlers
│   │   ├── v1/                    # REST API (employees, payroll, declarations, docs)
│   │   ├── admin/key-rotation/    # Encryption key rotation
│   │   ├── onss/                  # ONSS integration (dimona, status)
│   │   ├── agent/                 # Claude AI legal assistant
│   │   ├── cron/                  # Scheduled tasks (backup, reports)
│   │   ├── health/                # Health checks
│   │   ├── send-email/            # Resend email service
│   │   ├── invite/                # User invitations
│   │   ├── webhooks/              # Webhook dispatch (HMAC-SHA256 signed)
│   │   └── ...                    # baremes, bce, dms, esign, geocheck, etc.
│   ├── lib/                       # 22 utility modules
│   │   ├── supabase.js            # Singleton Supabase client
│   │   ├── calc-paie.js           # Core payroll engine
│   │   ├── calc-pp.js             # Précompte professionnel (income tax)
│   │   ├── calc-independant.js    # Self-employed calculations
│   │   ├── lois-belges.js         # Belgian law constants (ONSS rates, tax brackets)
│   │   ├── crypto.js              # AES-256-GCM encryption (NISS, IBAN)
│   │   ├── persistence.js         # Supabase save/load + localStorage
│   │   ├── api-security.js        # Rate limiting, audit logging
│   │   ├── xml-generators.js      # Dimona, DmfA, SEPA, Belcotax XML
│   │   ├── pdf-export.js          # Payslip, C4, attestation PDF generation
│   │   ├── onss-client.js         # ONSS OAuth2 + JWT client
│   │   ├── realtime.js            # Supabase realtime subscriptions
│   │   ├── failover.js            # Multi-region failover (Frankfurt → Amsterdam)
│   │   ├── csv-parsers.js         # CSV import for bulk operations
│   │   ├── multi-devise.js        # Multi-currency support
│   │   ├── module-registry.js     # Dynamic module loading
│   │   └── index.js               # Central re-exports
│   ├── modules/                   # 99 feature modules (lazy-loaded)
│   │   ├── PayrollHub.js          # Main payroll interface
│   │   ├── EmployeeHub.js         # Employee management
│   │   ├── ProceduresRH*.js       # 60+ Belgian HR procedure modules
│   │   ├── DPODashboard.js        # RGPD/DPO dashboard
│   │   ├── SecurityDashboard.js   # Security monitoring
│   │   ├── FloatingLegalAgent.js  # AI legal assistant (Claude)
│   │   ├── TwoFactorSetup.js      # MFA/TOTP setup
│   │   └── ...
│   └── sprint11/landing/          # Landing page
├── lib/security/                  # Shared security utilities
│   ├── auth.js                    # Session management, audit logging, RBAC
│   └── encryption.js              # AES-256-GCM with PBKDF2 key derivation
├── middleware.js                  # Global middleware (rate limit, CORS, CSP, security headers)
├── tests/
│   ├── test-paie.js               # Payroll unit tests (59+ tests)
│   ├── test-api-routes.js         # API security tests (51 tests)
│   └── extracted-logic.js         # Extracted logic for testing
├── supabase-migration.sql         # Database schema + RLS policies
├── docs/                          # Compliance documentation
│   ├── compliance/                # Bug bounty, DPO, ISO27001, SOC2 summaries
│   ├── iso27001/                  # 7 ISO 27001 policy documents
│   ├── rgpd/                      # RGPD DPO documentation
│   └── soc2/                      # SOC 2 control matrix
├── public/                        # Static assets, PWA files, service worker
├── .github/workflows/             # CI/CD (test-paie + OWASP ZAP scans)
├── ARCHITECTURE.js                # Modularization roadmap
├── next.config.js                 # Next.js config (strict mode, image opt)
├── vercel.json                    # Vercel deployment config + security headers
└── package.json                   # Dependencies (minimal: Next, React, Supabase)
```

### Key Design Patterns

- **Dependency injection**: `calc-paie.js` and `xml-generators.js` require `initCalcEngine(deps)` / `initXML(deps)` before use
- **Singleton Supabase client**: `app/lib/supabase.js` with auto-refresh tokens and realtime
- **useReducer state management**: The main app uses `useReducer` with action dispatch `d({ type: 'SET_CLIENTS', data })` — no Redux/Zustand
- **Inline styles**: Most UI uses inline CSS objects, with `responsive.css` for global responsive rules
- **Persistence layer**: Auto-saves to localStorage + Supabase with 2s cooldown and retry logic
- **Module registry**: `LazyModuleLoader.js` for code splitting feature modules

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.1 (App Router) |
| UI | React 19 (no TypeScript, pure JS) |
| Database | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Styling | Inline styles + responsive.css (no Tailwind, no CSS modules) |
| Email | Resend API |
| AI | Anthropic Claude (legal assistant) |
| ONSS | Belgian social security REST API (OAuth2 JWT) |
| Deployment | Vercel |
| CI/CD | GitHub Actions |
| PWA | Service worker + manifest.json + offline support |

### Dependencies (minimal)

```json
{
  "next": "^15.1.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@supabase/supabase-js": "^2.47.0",
  "web-push": "^3.6.7"
}
```

No testing framework, no state management library, no UI component library, no TypeScript.

---

## Development Conventions

### File Naming

- **Components**: PascalCase (`AureusSocialPro.js`, `LoginPage.js`, `PayrollHub.js`)
- **Utilities/libs**: kebab-case (`calc-paie.js`, `xml-generators.js`, `api-security.js`)
- **API routes**: `route.js` inside directory (Next.js App Router convention)
- **Modules with versions**: PascalCase + version suffix (`AbsencesContratsV3.js`, `PrimesAvantagesV2.js`)

### Code Style

- **Language**: JavaScript only (no TypeScript)
- **Components**: `'use client'` directive for all client components
- **Exports**: `export default function` for components, named exports for utilities
- **Constants**: `SCREAMING_SNAKE_CASE` for immutable values (e.g., `TX_ONSS_W = 0.1307`)
- **Abbreviations**: Common domain terms abbreviated — `emp` (employee), `brut` (gross), `pp` (précompte professionnel), `dims` (dimona declarations)
- **Section headers**: Box-drawing comments `// ═══ SECTION NAME ═══`
- **UI language**: French for all user-facing text, comments mix French and English
- **Error messages**: French for user-facing, English for technical logs
- **No semicolons rule**: Not enforced, mixed usage throughout

### React Patterns

- **State**: `useState` + `useReducer` (no external state management)
- **Effects**: `useEffect` for data fetching and subscriptions
- **No TypeScript types**: No PropTypes either — validation is runtime-only
- **Error boundaries**: `error.js` and `global-error.js` at app root
- **Conditional rendering**: Ternary operators and `&&` short-circuit

### API Route Pattern

All API routes follow this structure:

```javascript
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    // ... validation, business logic ...
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

Standard HTTP status codes: 400 (validation), 401 (auth), 403 (forbidden), 404, 429 (rate limit), 500.

---

## Environment Variables

### Required

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase instance URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key |

### Server-Side (Conditional)

| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Admin operations (backups, cron, invites) |
| `CRON_SECRET` | Cron job authentication (timing-safe comparison) |
| `ENCRYPTION_KEY` | AES-256-GCM key for sensitive fields |
| `ENCRYPTION_KEY_NEW` | New key during key rotation |
| `RESEND_API_KEY` | Email service (falls back to console logging) |
| `ANTHROPIC_API_KEY` | Claude AI legal agent |
| `ONSS_CLIENT_ID` | ONSS OAuth2 client ID |
| `ONSS_PRIVATE_KEY` | ONSS OAuth2 private key (PEM) |

### Optional

| Variable | Purpose |
|---|---|
| `IP_WHITELIST` | CIDR blocks for `/api/v1/*` and `/api/cron` (comma-separated) |
| `ALLOWED_ORIGIN` | Additional CORS origin |
| `NEXT_PUBLIC_SUPABASE_SECONDARY_URL` | Read replica for failover |
| `NEXT_PUBLIC_SUPABASE_SECONDARY_KEY` | Secondary Supabase key |

Never commit `.env`, `.env.local`, `.env.*`, or `.onss-credentials/`.

---

## Security Architecture

### Middleware (`middleware.js`)

Applied to all routes:
- **Rate limiting**: 60 req/min per IP (in-memory Map, auto-cleanup at 10k entries)
- **IP whitelisting**: CIDR-based, configurable via `IP_WHITELIST` env var
- **CORS**: Whitelist of allowed origins (aureussocial.be, localhost:3000, Vercel URL)
- **Security headers**: HSTS, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, CSP, Permissions-Policy
- **CSP**: Restricts scripts, styles, connections, frames

### API Security (`app/lib/api-security.js`)

- **Token-based rate limit**: 120 req/min per Bearer token
- **IP-based rate limit**: 30 req/min per IP (unauthenticated)
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Audit logging**: Action, details, IP, user-agent logged to Supabase

### Authentication

- Supabase Auth with email/password + MFA (TOTP)
- Session timeout: 15 minutes with 2-minute warning
- Activity detection: mouse, keyboard, scroll, touch
- GeoIP verification on login
- Bearer tokens for API access (v1 routes)
- `CRON_SECRET` with `crypto.timingSafeEqual()` for cron/admin routes

### Data Protection

- **AES-256-GCM** encryption for NISS and IBAN fields (RGPD Art. 32)
- PBKDF2 key derivation (100,000 iterations)
- Encrypted format: `salt(hex):iv(hex):ciphertext(hex)` (or `iv:ciphertext:tag`)
- Masking: `maskValue("85.07.15-123-45", 4)` → `"***********3-45"`
- Key rotation via `/api/admin/key-rotation` (atomic re-encryption)

### Row Level Security (RLS)

All Supabase tables have RLS enabled. Policies enforce tenant isolation via `auth.uid()`:
- `app_state`, `payroll_history`, `email_log`, `activity_log` — user-scoped
- `user_roles` — admin visibility within organization
- `audit_log` — admin read-only, append-only

### Roles

```
admin | gestionnaire | comptable | readonly | client | employee
```

---

## Database

### Key Tables (from `supabase-migration.sql`)

- `app_state` — Per-user encrypted application state
- `user_roles` — RBAC with organization_id
- `employees` — Employee records with tenant isolation
- `payroll_history` — Payroll calculation history
- `email_log` — Email delivery log
- `activity_log` — Append-only user activity (no DELETE/UPDATE)
- `audit_log` — System audit trail (admin read-only)
- `documents` — DMS document storage
- `leave_requests` — Leave tracking
- `declaration_queue` — ONSS declaration queue

### GDPR

- Auto-purge of audit logs older than 2 years
- Data export via GDPR Portal module
- DPO dashboard for compliance tracking

---

## Testing

### Test Framework

Custom Node.js-based test runner (no Jest/Vitest). Tests execute as plain scripts.

### Running Tests

```bash
node tests/test-paie.js         # Belgian payroll calculations (59+ tests)
node tests/test-api-routes.js   # API security and validation (51 tests)
```

### Test Coverage

**`test-paie.js`** — Payroll engine:
- ONSS contributions (13.07% employee, 108% worker coefficient)
- Précompte professionnel (income tax) with 2026 Belgian brackets
- Bonus à l'emploi (employment bonus, degressive scale)
- CSSS (complementary social contributions)
- Edge cases: negative salary, extreme values, part-time
- 10 end-to-end scenarios (employee types × situations × children)
- Cross-validation: net + deductions = gross (±1€ tolerance)
- Holiday pay (pécule de vacances)

**`test-api-routes.js`** — Security:
- CORS domain whitelist validation
- NISS checksum validation (mod-97)
- HTML sanitization (XSS vectors)
- DMS file type/category validation
- CIDR IP matching
- Timing-safe comparison
- E-signature email validation

### CI/CD

**`.github/workflows/test-paie.yml`**: Runs `node tests/test-paie.js` on push/PR to main (Node.js 20, ubuntu-latest).

**`.github/workflows/owasp-zap.yml`**: OWASP ZAP security scans (baseline + API) on push/PR + weekly Monday 3am UTC. Non-blocking (reports only). Rules in `.zap/rules.tsv`.

---

## Key Business Logic

### Payroll Calculation (`app/lib/calc-paie.js`)

The `calc()` function computes Belgian payroll from gross to net:
- Input: `brut` (gross), `situation` (isole/marie1/marie2), `enfants`, `statut` (employe/ouvrier), `whWeek`
- Output: ONSS worker/employer, précompte professionnel, CSSS, bonus emploi, net, total cost
- Uses `BAREMES` for salary scales by CP (commission paritaire): 200, 124, 302, 330, 140
- `LOIS_BELGES` / `LEGAL` constants for rates, brackets, thresholds

### XML Declarations (`app/lib/xml-generators.js`)

Generates official Belgian social security XML:
- **Dimona**: Employee start/end declarations
- **DmfA**: Quarterly employer declarations
- **SEPA**: ISO 20022 payment files
- **Belcotax**: Annual tax declarations

### Persistence (`app/lib/persistence.js`)

Dual-write strategy:
1. Immediate save to localStorage (offline-first)
2. Async save to Supabase with 2s cooldown and retry (max 3 attempts)

---

## Important Notes for AI Assistants

### Do

- Run `node tests/test-paie.js` after modifying any payroll calculation logic
- Run `node tests/test-api-routes.js` after modifying API routes or security middleware
- Preserve French UI text when modifying user-facing components
- Follow the existing inline-styles pattern (no Tailwind/CSS modules)
- Use `Response.json()` in API routes (not `NextResponse.json()` — both work, but codebase uses `Response.json()`)
- Keep dependency injection pattern for `calc-paie.js` and `xml-generators.js`
- Add `'use client'` directive to any new client-side components
- Use kebab-case for new utility files, PascalCase for new component/module files
- Validate NISS with mod-97 checksum when handling national numbers
- Encrypt sensitive fields (NISS, IBAN) with the crypto module before storage

### Do Not

- Do not add TypeScript — the project is pure JavaScript
- Do not add UI libraries (Tailwind, MUI, etc.) — use inline styles
- Do not add state management libraries (Redux, Zustand) — use React hooks
- Do not install test frameworks (Jest, Vitest) — use the existing custom runner
- Do not commit `.env` files, `.onss-credentials/`, or any secrets
- Do not modify security headers without understanding the CSP implications
- Do not bypass rate limiting or timing-safe comparisons in security code
- Do not use `git add -A` — stage specific files to avoid committing secrets
- Do not add semicolons enforcement — the codebase has mixed usage

### Architecture Awareness

- `AureusSocialPro.js` is the monolithic core (~27.6k lines). Modularization is underway.
- New features should be built as separate modules in `app/modules/` when possible
- The `app/lib/index.js` re-exports shared utilities — add new exports there
- `tests/extracted-logic.js` contains logic extracted from the monolith for testing
- Patch/fix scripts at the root (`fix-*.js`, `patch-*.js`) are temporary automation tools tracked in `.gitignore`

### Belgian Payroll Domain Knowledge

- **ONSS**: Office National de Sécurité Sociale (social security)
- **Dimona**: Declaration of employment start/end (mandatory)
- **DmfA**: Quarterly employer declaration
- **CP/PC**: Commission Paritaire / Paritair Comité (joint committee — industry sector classification)
- **Précompte professionnel (PP)**: Withholding tax on employment income
- **NISS**: Numéro d'Identification de Sécurité Sociale (national ID number, 11 digits, mod-97 checksum)
- **Pécule de vacances**: Holiday pay (simple + double)
- **Bonus à l'emploi**: Tax credit for low-income workers (degressive)
- **CSSS**: Cotisation Spéciale de Sécurité Sociale (special social security contribution)
