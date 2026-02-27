# 🏛️ AUREUS SOCIAL PRO — Préparation ISO 27001:2022

## Système de Management de la Sécurité de l'Information (SMSI)

### 1. Périmètre du SMSI (§4.3)

**Entité :** Aureus IA SPRL (BCE BE 1028.230.781)
**Activité :** Développement et exploitation de la plateforme SaaS Aureus Social Pro
**Périmètre :**
- Application web Aureus Social Pro (app.aureussocial.be)
- API REST v1
- Infrastructure Vercel + Supabase EU
- Processus de développement (CI/CD GitHub)
- Support client et gestion des incidents
- Données de paie, NISS, déclarations sociales

**Exclusions :** Sites marketing (aureusia.com), outils internes non connectés

---

### 2. Politique de sécurité de l'information (§5.2)

La Direction d'Aureus IA SPRL s'engage à :
- Protéger la confidentialité, l'intégrité et la disponibilité des données
- Se conformer aux exigences légales belges et européennes (RGPD, loi NISS)
- Améliorer continuellement le SMSI via le cycle PDCA
- Allouer les ressources nécessaires à la sécurité
- Sensibiliser l'ensemble du personnel

**Objectifs mesurables :**
| Objectif | Indicateur | Cible |
|----------|-----------|-------|
| Disponibilité | Uptime mensuel | ≥ 99,9% |
| Incidents | Temps moyen de résolution | < 4h (critique), < 24h (haute) |
| Vulnérabilités | Temps de patch critique | < 24h |
| Accès | Taux de revue des accès | 100% trimestriel |
| Formation | Personnel formé sécurité | 100% annuel |
| Backup | Test de restauration | 1x/trimestre réussi |

---

### 3. Évaluation des risques (§6.1.2)

#### Matrice de risques

| # | Actif | Menace | Vulnérabilité | Impact (1-5) | Probabilité (1-5) | Risque | Traitement |
|---|-------|--------|--------------|-------------|-------------------|--------|-----------|
| R1 | Base de données NISS | Fuite de données | Injection SQL | 5 | 1 | 5 | Supabase RLS + sanitize inputs |
| R2 | API v1 | DDoS / surcharge | Endpoints publics | 3 | 2 | 6 | Rate limiting 120/min |
| R3 | Comptes admin | Compromission credentials | Phishing | 5 | 2 | 10 | 2FA obligatoire + alerte connexion |
| R4 | Code source | Vol / sabotage | Accès GitHub | 4 | 1 | 4 | Branch protection + code review |
| R5 | Backup | Perte de données | Défaillance hébergeur | 5 | 1 | 5 | Multi-region + export JSON |
| R6 | Infrastructure | Indisponibilité | Panne Vercel/Supabase | 4 | 1 | 4 | Failover EU secondary |
| R7 | Sessions | Hijacking | XSS / CSRF | 4 | 2 | 8 | CSP strict + HttpOnly cookies |
| R8 | Fiches de paie | Erreur de calcul | Bug logiciel | 3 | 2 | 6 | 59 tests automatisés + validation |
| R9 | Personnel | Erreur humaine | Manque formation | 3 | 3 | 9 | Onboarding sécurité + procédures |
| R10 | Sous-traitants | Non-conformité | DPA insuffisant | 4 | 1 | 4 | DPA signés + audit annuel |

**Seuil d'acceptation :** Risque ≤ 4 = accepté, 5-8 = plan d'action, ≥ 9 = traitement immédiat

---

### 4. Déclaration d'Applicabilité (DdA) — Annexe A ISO 27001:2022

| Contrôle | Description | Applicable | Implémenté | Preuve |
|----------|------------|-----------|-----------|--------|
| A.5.1 | Politiques de sécurité | Oui | ✅ | Ce document |
| A.5.2 | Rôles et responsabilités | Oui | ✅ | RBAC multi-niveaux |
| A.5.3 | Séparation des tâches | Oui | ✅ | Rôles admin/gestionnaire/employé |
| A.6.1 | Screening du personnel | Oui | ⏳ | À implémenter |
| A.6.3 | Sensibilisation sécurité | Oui | ⏳ | Programme à créer |
| A.7.1 | Protection physique | N/A | — | 100% cloud |
| A.8.1 | Identification des actifs | Oui | ✅ | Inventaire ci-dessus |
| A.8.2 | Classification des données | Oui | ✅ | NISS=confidentiel, paie=confidentiel |
| A.8.3 | Étiquetage | Oui | ⏳ | Labels dans l'interface |
| A.8.5 | Authentification | Oui | ✅ | JWT + 2FA TOTP |
| A.8.7 | Protection contre malware | Oui | ✅ | CSP + sanitize inputs |
| A.8.8 | Gestion des vulnérabilités | Oui | ✅ | npm audit + dependabot |
| A.8.9 | Gestion de la configuration | Oui | ✅ | Git + env variables |
| A.8.12 | Prévention fuite données | Oui | ✅ | NISS masqué, export contrôlé |
| A.8.15 | Logging / Journalisation | Oui | ✅ | Audit log Supabase |
| A.8.16 | Monitoring | Oui | ✅ | Health check API |
| A.8.24 | Chiffrement | Oui | ✅ | TLS 1.3 + AES-256 at rest |
| A.8.25 | Dev sécurisé | Oui | ✅ | Branch protection, code review |
| A.8.28 | Codage sécurisé | Oui | ✅ | Sanitize, parameterized queries |
| A.8.29 | Tests de sécurité | Oui | ✅ | 59 tests paie + middleware tests |
| A.8.31 | Séparation environnements | Oui | ✅ | Dev/staging/prod séparés |
| A.8.32 | Gestion des changements | Oui | ✅ | Git PR + deploy preview |
| A.8.34 | Protection en test | Oui | ✅ | Données anonymisées en test |

---

### 5. Plan de continuité d'activité (§A.5.29-30)

**RPO** (Recovery Point Objective) : 24h (backup auto)
**RTO** (Recovery Time Objective) : 4h (failover + restore)

| Scénario | Impact | Action | Responsable | Délai |
|----------|--------|--------|------------|-------|
| Panne Vercel | App inaccessible | Failover DNS vers backup | CTO | 1h |
| Panne Supabase primaire | Données indisponibles | Bascule EU-Central | CTO | 2h |
| Corruption BDD | Données altérées | Restore backup JSON | CTO | 4h |
| Compromission compte | Accès non autorisé | Revoke tokens + audit | DPO + CTO | 1h |
| Cyberattaque DDoS | Service dégradé | WAF Vercel + rate limit | CTO | 30min |

---

### 6. Calendrier de certification

| Étape | Délai | Budget estimé |
|-------|-------|--------------|
| Audit interne (gap analysis) | M+1 | 2.000€ (consultant) |
| Remédiation des écarts | M+2-3 | 5.000€ |
| Audit de certification (Stage 1) | M+4 | 4.000€ |
| Audit de certification (Stage 2) | M+5 | 6.000€ |
| **Total** | **5 mois** | **17.000€** |

Organismes accrédités en Belgique : BSI, Bureau Veritas, DNV, SGS
