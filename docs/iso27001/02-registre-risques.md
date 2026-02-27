# Registre des Risques — Appréciation et Traitement
## Aureus IA SPRL — SMSI ISO 27001:2022

**Version :** 1.0 | **Date :** 27/02/2026 | **Méthodologie :** EBIOS RM (adaptée)

---

## Échelles d'évaluation

**Probabilité :** 1 (Rare) — 2 (Peu probable) — 3 (Possible) — 4 (Probable) — 5 (Quasi-certain)

**Impact :** 1 (Négligeable) — 2 (Mineur) — 3 (Modéré) — 4 (Majeur) — 5 (Critique)

**Niveau de risque :** P × I → Faible (1-6) | Moyen (7-12) | Élevé (13-19) | Critique (20-25)

---

## Registre des risques identifiés

### R01 — Fuite de données personnelles (NISS, IBAN, salaires)
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Confidentialité |
| **Actif** | Base de données Supabase (employés, paie) |
| **Menace** | Accès non autorisé (injection SQL, compromission credentials) |
| **Probabilité** | 2 (Peu probable) |
| **Impact** | 5 (Critique — RGPD Art.83: amende jusqu'à 4% CA, réputation) |
| **Risque brut** | 10 — Moyen |
| **Mesures existantes** | RLS Supabase, chiffrement AES-256, TLS 1.3, WAF Vercel |
| **Traitement** | Réduire |
| **Mesures additionnelles** | Audit pénétration annuel, SIEM, alertes accès NISS, DLP |
| **Risque résiduel** | 5 — Faible |
| **Propriétaire** | RSSI |

### R02 — Indisponibilité prolongée de la plateforme
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Disponibilité |
| **Actif** | Infrastructure Vercel + Supabase |
| **Menace** | Panne fournisseur cloud, DDoS, erreur déploiement |
| **Probabilité** | 2 |
| **Impact** | 4 (Majeur — clients ne peuvent pas calculer les paies) |
| **Risque brut** | 8 — Moyen |
| **Mesures existantes** | Vercel Edge Network, Supabase HA, monitoring uptime |
| **Traitement** | Réduire |
| **Mesures additionnelles** | Multi-region failover (Item #35), PCA testé, SLA contractuels |
| **Risque résiduel** | 4 — Faible |
| **Propriétaire** | CTO |

### R03 — Erreur de calcul de paie
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Intégrité |
| **Actif** | Moteur de calcul (calcPaie, calcPrecompteExact) |
| **Menace** | Bug logiciel, barèmes obsolètes, régression |
| **Probabilité** | 3 (Possible) |
| **Impact** | 4 (Majeur — erreurs ONSS/PP, pénalités client) |
| **Risque brut** | 12 — Moyen |
| **Mesures existantes** | 59 tests automatisés, paie parallèle migration, audit log |
| **Traitement** | Réduire |
| **Mesures additionnelles** | Tests barèmes mensuels auto, double calcul validation, alerte écarts |
| **Risque résiduel** | 6 — Faible |
| **Propriétaire** | Lead Dev |

### R04 — Compromission du code source
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Confidentialité / Intégrité |
| **Actif** | Dépôt GitHub (Aureus-Social/aureus-social-v18) |
| **Menace** | Compte GitHub compromis, dépendance malveillante |
| **Probabilité** | 2 |
| **Impact** | 4 |
| **Risque brut** | 8 — Moyen |
| **Mesures existantes** | 2FA GitHub, branch protection, Dependabot |
| **Traitement** | Réduire |
| **Mesures additionnelles** | SAST (CodeQL), SCA (Snyk), signed commits, revue obligatoire |
| **Risque résiduel** | 4 — Faible |
| **Propriétaire** | Lead Dev |

### R05 — Non-conformité RGPD
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Conformité |
| **Actif** | Tous traitements de données personnelles |
| **Menace** | Absence de base légale, rétention excessive, violation droits |
| **Probabilité** | 2 |
| **Impact** | 5 (Critique — amende APD, perte de confiance) |
| **Risque brut** | 10 — Moyen |
| **Mesures existantes** | Registre Art.30, DPO Dashboard, politique rétention |
| **Traitement** | Réduire |
| **Mesures additionnelles** | DPO externe agréé (#33), AIPD formelle, audit RGPD annuel |
| **Risque résiduel** | 5 — Faible |
| **Propriétaire** | DPO |

### R06 — Perte de données (backup failure)
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Disponibilité / Intégrité |
| **Actif** | Données clients (paie, employés, déclarations) |
| **Menace** | Corruption BDD, suppression accidentelle, ransomware |
| **Probabilité** | 1 |
| **Impact** | 5 |
| **Risque brut** | 5 — Faible |
| **Mesures existantes** | Supabase PITR, export JSON, auto-backup |
| **Traitement** | Réduire |
| **Mesures additionnelles** | Test restore trimestriel, backup chiffré externe, 3-2-1 rule |
| **Risque résiduel** | 3 — Faible |
| **Propriétaire** | CTO |

### R07 — Attaque par déni de service (DDoS)
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Disponibilité |
| **Actif** | Application web, API v1 |
| **Menace** | DDoS volumétrique, applicatif |
| **Probabilité** | 2 |
| **Impact** | 3 |
| **Risque brut** | 6 — Faible |
| **Mesures existantes** | Vercel WAF, rate limiting middleware, API rate limiter |
| **Traitement** | Accepter (risque faible) |
| **Risque résiduel** | 6 — Faible |
| **Propriétaire** | CTO |

### R08 — Usurpation d'identité administrateur
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Confidentialité |
| **Actif** | Comptes admin Aureus Social Pro |
| **Menace** | Phishing, credential stuffing, session hijacking |
| **Probabilité** | 3 |
| **Impact** | 4 |
| **Risque brut** | 12 — Moyen |
| **Mesures existantes** | 2FA, brute force protection, session timeout, RBAC |
| **Traitement** | Réduire |
| **Mesures additionnelles** | IP whitelisting admin, alerte connexion inhabituelle, MFA hardware |
| **Risque résiduel** | 6 — Faible |
| **Propriétaire** | RSSI |

### R09 — Dépendance fournisseur (vendor lock-in)
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Continuité |
| **Actif** | Supabase, Vercel |
| **Menace** | Fournisseur cesse activité, augmentation prix, changement conditions |
| **Probabilité** | 1 |
| **Impact** | 3 |
| **Risque brut** | 3 — Faible |
| **Mesures existantes** | PostgreSQL standard (portable), Next.js (déployable ailleurs) |
| **Traitement** | Accepter |
| **Risque résiduel** | 3 — Faible |
| **Propriétaire** | CTO |

### R10 — Non-respect des délais déclaratifs
| Attribut | Valeur |
|----------|--------|
| **Catégorie** | Conformité / Intégrité |
| **Actif** | Module déclarations (DIMONA, DmfA, Belcotax, PP) |
| **Menace** | Bug calendrier, défaut d'alerte, erreur utilisateur |
| **Probabilité** | 2 |
| **Impact** | 3 (amendes ONSS 50-2500€ par infraction) |
| **Risque brut** | 6 — Faible |
| **Mesures existantes** | Calendrier social (#19), alertes SmartAlerts, notifications |
| **Traitement** | Réduire |
| **Mesures additionnelles** | Rappel J-7/J-3/J-1, dashboard échéances, email automatique |
| **Risque résiduel** | 3 — Faible |
| **Propriétaire** | Product Owner |

---

## Matrice de risque (heatmap)

```
Impact →    1         2         3         4         5
Proba ↓  Néglig.   Mineur    Modéré    Majeur   Critique
  5                                              
  4                                              
  3                            R10      R03,R08   
  2                   R07      R09      R02,R04   R01,R05
  1                                    R06       
```

## Plan de traitement — Actions prioritaires

| Priorité | Action | Risque | Responsable | Échéance | Status |
|----------|--------|--------|-------------|----------|--------|
| 1 | Audit de pénétration externe | R01 | RSSI | T2 2026 | Planifié |
| 2 | Nomination DPO externe agréé | R05 | DG | T1 2026 | En cours |
| 3 | Multi-region failover Supabase | R02 | CTO | T2 2026 | Planifié |
| 4 | SAST/SCA pipeline CI/CD | R04 | Lead Dev | T1 2026 | Planifié |
| 5 | Alertes connexion inhabituelle | R08 | RSSI | T1 2026 | En cours |
| 6 | Test restore trimestriel | R06 | CTO | T1 2026 | Planifié |
| 7 | AIPD formelle | R05 | DPO | T2 2026 | Planifié |
| 8 | Tests barèmes automatisés mensuels | R03 | Lead Dev | Continu | Actif |

---

## Historique des révisions

| Version | Date | Auteur | Modifications |
|---------|------|--------|---------------|
| 1.0 | 27/02/2026 | RSSI | Création initiale — 10 risques identifiés |

---
*Document ISO 27001:2022 — Clause 6.1.2 / 8.2 — Appréciation des risques*
*Annexe A — Contrôles applicables selon ISO 27002:2022*
