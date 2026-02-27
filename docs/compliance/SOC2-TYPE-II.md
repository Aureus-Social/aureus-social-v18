# 🔐 AUREUS SOCIAL PRO — Préparation SOC 2 Type II

## Trust Service Criteria (TSC) — AICPA

### Scope
**Service :** Aureus Social Pro — Plateforme SaaS de gestion de paie belge
**Période :** 12 mois (audit continu)
**Type :** SOC 2 Type II (efficacité opérationnelle sur la durée)

---

### 1. SÉCURITÉ (CC6-CC8)

| Contrôle | Description | Implémentation Aureus | Evidence |
|----------|------------|----------------------|---------|
| CC6.1 | Contrôle d'accès logique | JWT + RBAC + RLS Supabase | Code middleware.js, RBAC config |
| CC6.2 | Authentification | Email/password + 2FA TOTP | auth module, recovery flow |
| CC6.3 | Gestion des autorisations | 5 niveaux rôles (superadmin→employé) | RBAC matrix documented |
| CC6.6 | Restrictions d'accès externe | Rate limiting IP + token, CORS strict | middleware.js, api-security.js |
| CC6.7 | Gestion des vulnérabilités | Dependabot, npm audit, CSP headers | GitHub alerts, middleware.js |
| CC6.8 | Monitoring & détection | Audit log, health check, error boundary | audit_log table, /api/health |
| CC7.1 | Détection d'anomalies | Brute force detection, rate limit alerts | authAttempts map, logs |
| CC7.2 | Réponse aux incidents | Procédure documentée, notification 72h | DPO-RGPD-PACK.md §4.2 |
| CC7.3 | Remédiation | Patch critique <24h, hotfix process | Git deploy pipeline |
| CC8.1 | Gestion des changements | Git PR, branch protection, deploy preview | GitHub settings |

### 2. DISPONIBILITÉ (A1)

| Contrôle | Description | Implémentation | SLA |
|----------|------------|---------------|-----|
| A1.1 | Gestion de la capacité | Vercel auto-scaling, Supabase pool | 99,9% uptime |
| A1.2 | Continuité d'activité | Failover EU secondary, backup 24h | RPO 24h, RTO 4h |
| A1.3 | Test de restauration | Restore backup trimestriel | 100% succès |
| A1.4 | Monitoring | /api/health endpoint, uptime monitoring | Checks 30s interval |

### 3. INTÉGRITÉ DU TRAITEMENT (PI1)

| Contrôle | Description | Implémentation | Evidence |
|----------|------------|---------------|---------|
| PI1.1 | Exactitude des calculs | 59 tests automatisés paie | test-paie.js, CI/CD |
| PI1.2 | Validation des entrées | NISS Modulo97, IBAN check, NACE mapping | Validation functions |
| PI1.3 | Détection d'erreurs | Error boundary, validation pre-paie | ErrorBoundary component |
| PI1.4 | Traçabilité | Audit log toutes actions critiques | audit_log table |

### 4. CONFIDENTIALITÉ (C1)

| Contrôle | Description | Implémentation |
|----------|------------|---------------|
| C1.1 | Classification des données | NISS=Confidentiel, Paie=Confidentiel, Contact=Interne |
| C1.2 | Chiffrement en transit | TLS 1.3 (HSTS preload, A+ rating) |
| C1.3 | Chiffrement au repos | Supabase AES-256, backup chiffré |
| C1.4 | Masquage données sensibles | NISS masqué dans UI/logs (XX.XX.XX-XXX.XX) |
| C1.5 | Contrôle d'accès données | RLS Supabase par tenant_id |
| C1.6 | Destruction sécurisée | Purge conforme RGPD Art.17 |

### 5. VIE PRIVÉE (P1-P8)

| Contrôle | Référence | Implémentation |
|----------|----------|---------------|
| P1.1 | Notice de confidentialité | Privacy policy sur l'app |
| P2.1 | Choix et consentement | Opt-in marketing, portabilité |
| P3.1 | Collecte conforme | Minimisation, finalité définie |
| P4.1 | Usage conforme | Registre traitements Art.30 |
| P5.1 | Accès individuel | Portail employé "Mes droits RGPD" |
| P6.1 | Divulgation à des tiers | DPA signés (Supabase, Vercel) |
| P7.1 | Qualité des données | Validation NISS, IBAN, email |
| P8.1 | Droits des personnes | Formulaire exercice droits Art.15-22 |

---

### 6. Contrôles organisationnels (CC1-CC5)

| Contrôle | Description | Status | Action requise |
|----------|------------|--------|---------------|
| CC1.1 | Intégrité et valeurs éthiques | ✅ | Code de conduite à formaliser |
| CC1.2 | Indépendance du conseil | ⏳ | Nommer advisory board |
| CC2.1 | Communication interne | ✅ | Procédures documentées |
| CC2.2 | Communication externe | ✅ | security.txt, disclosure policy |
| CC3.1 | Objectifs de sécurité | ✅ | Définis dans ISO doc |
| CC3.2 | Évaluation des risques | ✅ | Matrice 10 risques |
| CC3.3 | Identification du changement | ✅ | Changelog system |
| CC4.1 | Contrôles de monitoring | ✅ | Health check + audit log |
| CC5.1 | Sélection des contrôles | ✅ | DdA ISO 27001 |
| CC5.2 | Déploiement des contrôles | ✅ | Middleware + RBAC + RLS |

---

### 7. Evidence Collection (pour l'auditeur)

| Evidence | Source | Fréquence |
|----------|--------|-----------|
| Access logs | Supabase audit_log | Continu |
| Rate limit events | middleware.js logs | Continu |
| Code changes | GitHub commit history | Continu |
| Deployment logs | Vercel deploy log | Par deploy |
| Test results | test-paie.js output | Par deploy (CI) |
| Vulnerability scans | npm audit, dependabot | Hebdomadaire |
| Backup test | Restore test report | Trimestriel |
| Access review | RBAC user list export | Trimestriel |
| Incident reports | security_incidents table | Par incident |
| Risk assessment | Ce document | Annuel |

---

### 8. Roadmap vers certification

| Étape | Délai | Budget |
|-------|-------|--------|
| Gap analysis avec auditeur | M+1 | 3.000€ |
| Remédiation (policies, monitoring) | M+2-4 | 8.000€ |
| Readiness assessment | M+5 | 3.000€ |
| Audit Type II (12 mois observation) | M+6-18 | 15.000€ |
| Rapport final | M+19 | Inclus |
| **Total** | **19 mois** | **29.000€** |

**Auditeurs SOC 2 en Europe :** Deloitte, KPMG, EY, PwC, BDO, Mazars
**Note :** SOC 2 Type I (point-in-time) possible en 6 mois pour ~15.000€ comme étape intermédiaire
