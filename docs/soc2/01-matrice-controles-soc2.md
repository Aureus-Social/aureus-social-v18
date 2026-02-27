# SOC 2 Type II — Matrice de Contrôles
## Aureus IA SPRL — Trust Services Criteria (TSC)

**Version :** 1.0 | **Date :** 27/02/2026 | **Période d'audit cible :** T3 2026 — T2 2027

---

## Vue d'ensemble

SOC 2 Type II évalue l'efficacité opérationnelle des contrôles sur une période (12 mois minimum). Ce document prépare Aureus IA pour un audit par un cabinet CPA agréé.

### Catégories TSC applicables

| Catégorie | Applicable | Justification |
|-----------|-----------|---------------|
| **Security** (CC) | ✅ Oui | Obligatoire pour tout SOC 2 |
| **Availability** (A) | ✅ Oui | SLA client sur disponibilité plateforme |
| **Processing Integrity** (PI) | ✅ Oui | Calculs de paie doivent être exacts |
| **Confidentiality** (C) | ✅ Oui | Données salariales/NISS confidentielles |
| **Privacy** (P) | ✅ Oui | Données personnelles RGPD |

---

## Security — Common Criteria (CC)

### CC1 — Control Environment

| # | Contrôle | Description | Implémentation Aureus | Evidence |
|---|----------|-------------|----------------------|----------|
| CC1.1 | Engagement éthique et intégrité | Code de conduite, valeurs organisation | Code de conduite signé par tous | doc signé |
| CC1.2 | Indépendance du Board | Surveillance des contrôles internes | Revue de direction semestrielle | PV revue |
| CC1.3 | Structure organisationnelle | Organigramme, rôles définis | RACI sécurité, RBAC app | doc RACI |
| CC1.4 | Compétence du personnel | Qualifications, formation | Formation sécurité annuelle | certificats |
| CC1.5 | Responsabilité individuelle | Accountability pour chaque rôle | Politique sécurité §6, audit trail | logs |

### CC2 — Communication & Information

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC2.1 | Informations nécessaires disponibles | Dashboard KPI sécurité, monitoring | screenshots dashboard |
| CC2.2 | Communication interne | Slack #security, email RSSI | captures Slack |
| CC2.3 | Communication externe | Status page, email clients | status page URL |

### CC3 — Risk Assessment

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC3.1 | Objectifs de sécurité définis | Politique sécurité §4 | document politique |
| CC3.2 | Identification des risques | Registre des risques (10 risques) | doc 02-registre-risques.md |
| CC3.3 | Évaluation de la fraude | Séparation des tâches, audit trail | config RBAC + logs |
| CC3.4 | Changements significatifs évalués | Revue sécurité dans chaque sprint | PR reviews GitHub |

### CC4 — Monitoring Activities

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC4.1 | Monitoring continu | Vercel Analytics, Supabase monitoring, error logs | dashboards |
| CC4.2 | Évaluation et correction | Audits semestriels, post-mortems | rapports audit |

### CC5 — Control Activities

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC5.1 | Contrôles IT sélectionnés | WAF, CSP, rate limiting, RBAC, 2FA | config middleware.js |
| CC5.2 | Contrôles sur les technologies | Dependabot, npm audit, code review | alertes GitHub |
| CC5.3 | Politiques déployées | Politiques documentées et communiquées | docs/iso27001/ |

### CC6 — Logical & Physical Access

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC6.1 | Accès logique protégé | Supabase Auth + RLS, JWT sessions | config Supabase |
| CC6.2 | Accès réseau sécurisé | HTTPS only, HSTS preload, WAF Vercel | headers scan |
| CC6.3 | Accès restreint aux données | Row Level Security par tenant_id | policies Supabase |
| CC6.4 | Accès physique | 100% cloud (Supabase/Vercel SOC2 certifiés) | certifs fournisseurs |
| CC6.5 | Utilisateurs authentifiés | Email/password + 2FA TOTP | config auth |
| CC6.6 | Provisioning/deprovisioning | Création/désactivation compte, offboarding | procédure + logs |
| CC6.7 | Accès données restreint | RBAC 4 niveaux (admin/manager/user/viewer) | config RBAC |
| CC6.8 | Prévention logiciels malveillants | CSP strict, input sanitization, no eval() | middleware.js + code |

### CC7 — System Operations

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC7.1 | Détection anomalies | Rate limiting alerts, error monitoring, uptime checks | dashboards |
| CC7.2 | Incidents surveillés et détectés | Alertes automatiques (email, Slack) | config alertes |
| CC7.3 | Évaluation des incidents | Procédure PICERL, classification P1-P4 | doc 05-procedure |
| CC7.4 | Réponse aux incidents | Runbooks, containment, notification | procédure incidents |
| CC7.5 | Restauration post-incident | Rollback Vercel, Supabase PITR | tests restore |

### CC8 — Change Management

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC8.1 | Changements autorisés | Git PR avec review obligatoire, branch protection | GitHub settings |
| CC8.2 | Tests avant déploiement | Staging environment, tests auto | CI/CD logs |
| CC8.3 | Changements d'urgence documentés | Hotfix procedure, post-deploy verification | git commits |

### CC9 — Risk Mitigation

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| CC9.1 | Évaluation des fournisseurs | Supabase (SOC2), Vercel (SOC2), GitHub (SOC2) | certifs vendors |
| CC9.2 | Conformité fournisseurs | DPA signés, SLA contractuels | contrats |

---

## Availability (A)

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| A1.1 | SLA définis | Uptime ≥ 99.9%, RTO < 1h, RPO < 5min | SLA doc, PCA |
| A1.2 | Monitoring disponibilité | Uptime monitoring 24/7, status page | dashboard |
| A1.3 | PCA/PRA testé | Plan continuité documenté, tests trimestriels | doc 04-PCA |

## Processing Integrity (PI)

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| PI1.1 | Traitement complet et exact | 59 tests auto calcul paie, validation ONSS/PP | test-paie.js |
| PI1.2 | Entrées validées | Validation NISS Modulo 97, IBAN, montants | code validation |
| PI1.3 | Erreurs détectées et corrigées | Alert écarts calcul, audit trail modifications | logs + alertes |

## Confidentiality (C)

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| C1.1 | Données confidentielles identifiées | Classification données (NISS=Strict, salaire=Confidentiel) | politique |
| C1.2 | Données chiffrées | AES-256 repos (Supabase), TLS 1.3 transit | config |
| C1.3 | Accès confidentiel restreint | RLS tenant, RBAC, masquage NISS affichage | code |

## Privacy (P)

| # | Contrôle | Implémentation | Evidence |
|---|----------|---------------|----------|
| P1.1 | Notice de confidentialité | Privacy policy publiée, notice traitement | doc publié |
| P1.2 | Consentement si nécessaire | Base légale documentée (exécution contrat, obligation légale) | registre |
| P1.3 | Données utilisées conformément | Registre traitements Art.30 (DPO Dashboard) | DPODashboard.js |
| P1.4 | Rétention limitée | Durées rétention définies, purge automatique | config retention |
| P1.5 | Droits des personnes | Accès, rectification, suppression, portabilité | procédure droits |
| P1.6 | Données communiquées | DPA sous-traitants, pas de transfert hors UE | contrats DPA |

---

## Résumé de préparation SOC 2

| Catégorie | Contrôles | Prêt | En cours | Total |
|-----------|-----------|------|----------|-------|
| CC (Security) | 27 | 24 | 3 | 27 |
| A (Availability) | 3 | 3 | 0 | 3 |
| PI (Processing Integrity) | 3 | 3 | 0 | 3 |
| C (Confidentiality) | 3 | 3 | 0 | 3 |
| P (Privacy) | 6 | 5 | 1 | 6 |
| **TOTAL** | **42** | **38 (90%)** | **4 (10%)** | **42** |

## Prochaines étapes

1. ⏳ Sélection cabinet CPA agréé AICPA (Deloitte, EY, BDO, Mazars Belgique)
2. ⏳ Période d'observation : 6-12 mois d'evidence collection
3. ⏳ Readiness assessment (pré-audit)
4. ⏳ Audit Type II formel
5. ⏳ Rapport SOC 2 Type II délivré

**Budget estimé :** 15.000 — 30.000 € (audit externe, dépend du cabinet)

---
*Basé sur AICPA Trust Services Criteria 2017 (TSP Section 100)*
