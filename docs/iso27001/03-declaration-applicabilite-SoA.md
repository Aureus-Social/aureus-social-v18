# Déclaration d'Applicabilité (SoA)
## Aureus IA SPRL — ISO 27001:2022

**Version :** 1.0 | **Date :** 27/02/2026 | **93 contrôles ISO 27002:2022**

---

## Légende
- ✅ Applicable et implémenté
- 🔄 Applicable, en cours d'implémentation
- ⏳ Applicable, planifié
- ❌ Non applicable (avec justification)

---

## 5 — Contrôles organisationnels (37 contrôles)

| # | Contrôle | Statut | Justification / Implémentation |
|---|----------|--------|-------------------------------|
| 5.1 | Politiques de sécurité | ✅ | doc 01-politique-securite-information.md |
| 5.2 | Rôles et responsabilités | ✅ | Définis dans politique (§6) |
| 5.3 | Séparation des tâches | ✅ | RBAC dans app (admin/manager/user/viewer) |
| 5.4 | Responsabilités de direction | ✅ | Engagement direction dans politique (§3) |
| 5.5 | Contact avec les autorités | ✅ | Procédure notification APD 72h, CERT.be |
| 5.6 | Contact avec groupes d'intérêt | ⏳ | Adhésion prévue Centre Cybersécurité Belgique |
| 5.7 | Renseignement sur les menaces | ✅ | Dependabot, veille CVE, alertes GitHub |
| 5.8 | Sécurité dans la gestion de projet | ✅ | Security review dans chaque sprint |
| 5.9 | Inventaire des actifs | ✅ | doc 02-registre-risques.md (actifs identifiés) |
| 5.10 | Utilisation acceptable des actifs | ✅ | Politique d'utilisation acceptable (PUA) |
| 5.11 | Restitution des actifs | ❌ | SaaS — pas d'actifs physiques distribués |
| 5.12 | Classification de l'information | ✅ | 4 niveaux : Public/Interne/Confidentiel/Strict |
| 5.13 | Étiquetage de l'information | 🔄 | Headers classification dans les exports PDF |
| 5.14 | Transfert d'information | ✅ | TLS 1.3 obligatoire, SEPA chiffré |
| 5.15 | Contrôle d'accès | ✅ | RBAC, 2FA, brute force protection |
| 5.16 | Gestion des identités | ✅ | Supabase Auth, UUID, sessions JWT |
| 5.17 | Authentification | ✅ | Email/password + 2FA TOTP |
| 5.18 | Droits d'accès | ✅ | Principe du moindre privilège, RLS Supabase |
| 5.19 | Sécurité fournisseurs | ✅ | Évaluation Vercel/Supabase/GitHub (SOC2 certifiés) |
| 5.20 | Sécurité dans les accords fournisseurs | ✅ | DPA signés (Supabase, Vercel) |
| 5.21 | Sécurité chaîne ICT | ✅ | Dependabot, npm audit, lock files |
| 5.22 | Surveillance fournisseurs | 🔄 | Monitoring status pages fournisseurs |
| 5.23 | Sécurité cloud | ✅ | Configuration Supabase RLS, Vercel headers |
| 5.24 | Planification gestion incidents | ✅ | Procédure incidents (politique §8) |
| 5.25 | Évaluation et décision incidents | ✅ | Classification Critique/Haute/Moyenne/Basse |
| 5.26 | Réponse aux incidents | ✅ | Runbook réponse incidents |
| 5.27 | Apprentissage des incidents | ✅ | Post-mortem obligatoire pour incidents Critique/Haute |
| 5.28 | Collecte de preuves | ⏳ | Procédure forensique numérique planifiée |
| 5.29 | Sécurité pendant les perturbations | ✅ | PCA/PRA documenté |
| 5.30 | Préparation ICT pour continuité | ✅ | Supabase PITR, Vercel instant rollback |
| 5.31 | Exigences légales et réglementaires | ✅ | RGPD, NIS2, loi belge (politique §9) |
| 5.32 | Droits de propriété intellectuelle | ✅ | Licences open source auditées |
| 5.33 | Protection des enregistrements | ✅ | Rétention conforme, audit trail |
| 5.34 | Vie privée et PII | ✅ | RGPD intégré, DPO Dashboard, AIPD |
| 5.35 | Revue indépendante sécurité | ⏳ | Audit externe prévu T2 2026 |
| 5.36 | Conformité aux politiques | ✅ | Audits internes semestriels |
| 5.37 | Procédures d'exploitation documentées | ✅ | Runbooks et procédures opérationnelles |

## 6 — Contrôles humains (8 contrôles)

| # | Contrôle | Statut | Justification / Implémentation |
|---|----------|--------|-------------------------------|
| 6.1 | Sélection des candidats | ✅ | Vérification antécédents pour rôles sensibles |
| 6.2 | Conditions d'emploi | ✅ | Clause confidentialité dans contrats |
| 6.3 | Sensibilisation, formation | 🔄 | Programme formation sécurité annuel en cours |
| 6.4 | Processus disciplinaire | ✅ | Sanctions définies (politique §11) |
| 6.5 | Responsabilités après fin/changement | ✅ | Procédure offboarding (révocation accès) |
| 6.6 | Accords confidentialité | ✅ | NDA signés avec tous les collaborateurs |
| 6.7 | Travail à distance | ✅ | VPN/HTTPS obligatoire, endpoint security |
| 6.8 | Signalement événements sécurité | ✅ | Canal de signalement interne + email sécurité |

## 7 — Contrôles physiques (14 contrôles)

| # | Contrôle | Statut | Justification / Implémentation |
|---|----------|--------|-------------------------------|
| 7.1 | Périmètres de sécurité physique | ❌ | 100% SaaS cloud — pas de datacenter propre |
| 7.2 | Contrôles d'entrée physiques | ❌ | Idem — fournisseurs cloud certifiés SOC2 |
| 7.3 | Sécurisation bureaux | ✅ | Bureau verrouillé, écran verrouillé politique |
| 7.4 | Surveillance physique | ❌ | Pas de datacenter — Supabase/Vercel certifiés |
| 7.5 | Protection contre menaces physiques | ❌ | Infrastructure cloud |
| 7.6 | Travail en zones sécurisées | ❌ | Infrastructure cloud |
| 7.7 | Bureau propre / écran verrouillé | ✅ | Politique clear desk, auto-lock 5 min |
| 7.8 | Emplacement des équipements | ❌ | Infrastructure cloud |
| 7.9 | Sécurité des actifs hors site | ✅ | Chiffrement disques laptops (FileVault/BitLocker) |
| 7.10 | Supports de stockage | ✅ | Pas de données sur supports amovibles |
| 7.11 | Services généraux | ❌ | Infrastructure cloud |
| 7.12 | Sécurité du câblage | ❌ | Infrastructure cloud |
| 7.13 | Maintenance des équipements | ✅ | Mises à jour OS automatiques |
| 7.14 | Élimination sécurisée | ✅ | Effacement cryptographique des disques |

## 8 — Contrôles technologiques (34 contrôles)

| # | Contrôle | Statut | Justification / Implémentation |
|---|----------|--------|-------------------------------|
| 8.1 | Terminaux utilisateur | ✅ | Politique endpoint, 2FA, session timeout |
| 8.2 | Droits d'accès privilégiés | ✅ | RBAC strict, admin séparé, audit log |
| 8.3 | Restriction d'accès aux informations | ✅ | RLS Supabase par tenant, RBAC par rôle |
| 8.4 | Accès au code source | ✅ | GitHub private repo, branch protection, 2FA |
| 8.5 | Authentification sécurisée | ✅ | bcrypt, 2FA TOTP, brute force protection |
| 8.6 | Gestion de la capacité | ✅ | Auto-scaling Vercel, monitoring Supabase |
| 8.7 | Protection contre les malwares | ✅ | CSP strict, input sanitization, WAF |
| 8.8 | Gestion des vulnérabilités techniques | ✅ | Dependabot, npm audit, code review |
| 8.9 | Gestion de la configuration | ✅ | Infrastructure as code, env variables chiffrées |
| 8.10 | Suppression d'information | ✅ | Procédure suppression RGPD, soft delete + purge |
| 8.11 | Masquage des données | ✅ | NISS masqué (XX.XX.XX-XXX.XX) en affichage |
| 8.12 | Prévention des fuites de données | 🔄 | DLP planifié — alertes export masse en place |
| 8.13 | Sauvegarde des informations | ✅ | Supabase PITR + export JSON + auto-backup |
| 8.14 | Redondance des installations | ✅ | Vercel multi-edge, Supabase HA (Pro) |
| 8.15 | Journalisation | ✅ | Audit log complet, activity log, error log |
| 8.16 | Activités de surveillance | 🔄 | Monitoring uptime, alertes errors |
| 8.17 | Synchronisation des horloges | ✅ | NTP serveurs cloud synchronisés |
| 8.18 | Utilisation de programmes utilitaires privilégiés | ✅ | Accès admin limité, sudo audit |
| 8.19 | Installation de logiciels | ✅ | CI/CD GitHub Actions, no manual deploy |
| 8.20 | Sécurité des réseaux | ✅ | HTTPS only, HSTS preload, WAF Vercel |
| 8.21 | Sécurité des services réseau | ✅ | TLS 1.3, Certificate Transparency |
| 8.22 | Segmentation des réseaux | ✅ | Isolation tenant RLS, API séparée |
| 8.23 | Filtrage web | ✅ | CSP strict, frame-ancestors 'none' |
| 8.24 | Utilisation de la cryptographie | ✅ | AES-256 repos, TLS 1.3 transit, bcrypt auth |
| 8.25 | Cycle de développement sécurisé | ✅ | Code review, tests auto, OWASP Top 10 |
| 8.26 | Exigences sécurité applicatives | ✅ | Input validation, output encoding, CSRF |
| 8.27 | Architecture système sécurisée | ✅ | Defense in depth, separation of concerns |
| 8.28 | Codage sécurisé | ✅ | OWASP guidelines, no eval(), parameterized queries |
| 8.29 | Tests de sécurité développement | 🔄 | Tests unitaires sécurité, pentest prévu |
| 8.30 | Développement externalisé | ❌ | Développement 100% interne |
| 8.31 | Séparation des environnements | ✅ | Dev/staging/production séparés |
| 8.32 | Gestion des changements | ✅ | Git PR, code review, staging test avant prod |
| 8.33 | Données de test | ✅ | Données anonymisées pour tests, pas de prod data |
| 8.34 | Protection pendant les audits | ✅ | Accès audit read-only, logs audit séparés |

---

## Résumé de conformité

| Catégorie | Total | ✅ Implémenté | 🔄 En cours | ⏳ Planifié | ❌ N/A |
|-----------|-------|-------------|-------------|------------|--------|
| 5 Organisationnels | 37 | 30 | 3 | 3 | 1 |
| 6 Humains | 8 | 7 | 1 | 0 | 0 |
| 7 Physiques | 14 | 5 | 0 | 0 | 9 |
| 8 Technologiques | 34 | 29 | 3 | 0 | 2 |
| **TOTAL** | **93** | **71 (76%)** | **7 (8%)** | **3 (3%)** | **12 (13%)** |

**Conformité applicable : 71/81 = 88%** (hors N/A)

---
*Document ISO 27001:2022 — Clause 6.1.3 / Annexe A — Déclaration d'applicabilité*
