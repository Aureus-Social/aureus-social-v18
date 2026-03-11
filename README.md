# Aureus Social Pro

> Secrétariat social SaaS belge — Alternatif à SD Worx, Partena, Securex  
> Stack: Next.js 15 · React 19 · Supabase (Frankfurt) · Vercel

[![CI](https://github.com/Aureus-Social/aureus-social-v18/actions/workflows/ci.yml/badge.svg)](https://github.com/Aureus-Social/aureus-social-v18/actions/workflows/ci.yml)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Security Score](https://img.shields.io/badge/security-9%2F10-brightgreen)]()

---

## 🚀 Démarrage rapide

```bash
git clone https://github.com/Aureus-Social/aureus-social-v18.git
cd aureus-social-v18
npm install --legacy-peer-deps
cp .env.example .env.local   # remplir les variables
npm run dev
```

## 📦 Architecture

```
app/
├── (dashboard)/        # Layout principal + navigation
│   └── layout-client.js
├── api/                # Routes API Next.js
│   ├── agent/          # Agent IA Claude
│   ├── health/         # Monitoring endpoint
│   ├── backup/         # Backup manuel
│   └── cron/           # Jobs automatiques
├── lib/
│   ├── security/
│   │   ├── logger.js        # Logger prod (0 console.log)
│   │   └── secureStorage.js # AES-GCM 256-bit localStorage
│   ├── lazyModules.js   # Code splitting React.lazy()
│   ├── lois-belges.js   # 50+ paramètres droit social belge
│   └── calc-paie.js     # Moteur de calcul paie
├── pages/              # 104 pages/modules
└── modules/            # Groupes de modules
```

## 🔒 Sécurité

| Feature | Statut |
|---------|--------|
| AES-GCM 256-bit (données sensibles) | ✅ |
| Security Headers (CSP, HSTS, XFO) | ✅ |
| Rate limiting 100 req/min/IP | ✅ |
| Logger prod sans info leak | ✅ |
| RGPD Art. 32 compliance | ✅ |
| MFA Supabase | ⚠️ À activer |

## 🧪 Tests

```bash
npm run test          # Tous les tests Playwright
npm run test:smoke    # Smoke tests uniquement
npm run test:ui       # Interface interactive
```

## 🏗️ Déploiement

Déploiement automatique via Vercel sur push `main`.

```bash
git add -A && git commit -m "feat: ..." && git push origin main
```

## 📋 Variables d'environnement

Voir `.env.example` pour la liste complète.

**Variables obligatoires Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ENCRYPTION_KEY` (32+ chars)
- `ANTHROPIC_API_KEY` (pour /api/agent)

## 📊 Audit scores

| Domaine | Score |
|---------|-------|
| Sécurité | 9/10 |
| Performance | 7.5/10 |
| Backup & Résilience | 8/10 |
| Tests & CI/CD | 7/10 |
| RGPD | 8.5/10 |
| **Global** | **8.1/10** |

---

*Aureus IA SPRL — BCE 1028.230.781 — Saint-Gilles, Bruxelles*  
*info@aureus-ia.com · aureussocial.be*
