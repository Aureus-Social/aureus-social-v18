# Plan de Continuité et Reprise d'Activité (PCA/PRA)
## Aureus IA SPRL — SMSI ISO 27001:2022

**Version :** 1.0 | **Date :** 27/02/2026 | **Classification :** Confidentiel

---

## 1. Objectifs

| Métrique | Cible | Description |
|----------|-------|-------------|
| **RTO** (Recovery Time Objective) | < 1 heure | Durée maximale d'interruption acceptable |
| **RPO** (Recovery Point Objective) | < 5 minutes | Perte de données maximale acceptable |
| **MTTR** (Mean Time To Recover) | < 30 minutes | Temps moyen de restauration |

## 2. Analyse d'Impact Métier (BIA)

| Processus | Criticité | RTO | RPO | Impact financier (4h arrêt) |
|-----------|-----------|-----|-----|----------------------------|
| Calcul de paie | Critique | 1h | 5min | Pénalités retard ONSS, image |
| Déclarations (DmfA, DIMONA) | Critique | 2h | 5min | Amendes 50-2500€/infraction |
| Portail employé | Haute | 4h | 1h | Insatisfaction, tickets support |
| GED documents | Moyenne | 8h | 1h | Retard administratif |
| Dashboard/Analytics | Basse | 24h | 24h | Inconvénient mineur |

## 3. Scénarios de sinistre et réponses

### Scénario A — Panne Vercel (hébergement)
| Étape | Action | Responsable | Délai |
|-------|--------|-------------|-------|
| 1 | Vérifier status.vercel.com | On-call | 5 min |
| 2 | Activer page maintenance (DNS failover) | CTO | 15 min |
| 3 | Si > 30min, déployer sur Railway/Fly.io (backup) | CTO | 45 min |
| 4 | Communication clients email/Slack | Support | 30 min |
| 5 | Retour Vercel → vérifier intégrité → switch DNS | CTO | 15 min |

### Scénario B — Panne Supabase (base de données)
| Étape | Action | Responsable | Délai |
|-------|--------|-------------|-------|
| 1 | Vérifier status.supabase.com | On-call | 5 min |
| 2 | Activer mode lecture seule (cache local) | CTO | 15 min |
| 3 | Si > 1h, restaurer depuis backup sur Supabase secondary | CTO | 30 min |
| 4 | Vérifier intégrité données PITR | Lead Dev | 20 min |
| 5 | Communication clients + post-mortem | Support/CTO | 30 min |

### Scénario C — Compromission sécurité (data breach)
| Étape | Action | Responsable | Délai |
|-------|--------|-------------|-------|
| 1 | Isoler : révoquer tokens, rotate credentials | RSSI | Immédiat |
| 2 | Évaluer périmètre : quelles données, combien de personnes | RSSI | 2h |
| 3 | Containment : patcher vulnérabilité, bloquer vecteur | Lead Dev | 4h |
| 4 | Notification APD si données personnelles (Art. 33 RGPD) | DPO | < 72h |
| 5 | Notification personnes concernées si risque élevé (Art. 34) | DPO | < 7j |
| 6 | Forensique : analyse logs, timeline, root cause | RSSI | 48h |
| 7 | Post-mortem + actions correctives | Équipe | 5j |

### Scénario D — Erreur de déploiement majeure
| Étape | Action | Responsable | Délai |
|-------|--------|-------------|-------|
| 1 | Rollback immédiat via Vercel (1 clic) | Lead Dev | 2 min |
| 2 | Vérifier intégrité données | Lead Dev | 15 min |
| 3 | Analyser commit fautif | Lead Dev | 30 min |
| 4 | Fix + re-deploy via staging | Lead Dev | 2h |

### Scénario E — Perte de l'équipe clé (bus factor)
| Étape | Action | Responsable | Délai |
|-------|--------|-------------|-------|
| 1 | Documentation technique à jour | Continu | — |
| 2 | Credentials en coffre-fort numérique (1Password) | CTO | — |
| 3 | Procédure de succession documentée | DG | — |
| 4 | Contrat de maintenance avec prestataire externe | DG | — |

## 4. Infrastructure de secours

```
Production:
  App:  Vercel (Edge Network, 30+ PoP mondiaux)
  DB:   Supabase Pro (PostgreSQL, eu-west-1)
  DNS:  Cloudflare

Backup/Failover:
  App:  Railway.app ou Fly.io (pré-configuré, docker ready)
  DB:   Supabase secondary project (eu-central-1) [Item #35]
  DNS:  Cloudflare failover health checks

Sauvegardes:
  - Supabase PITR: continu (30 jours de rétention)
  - Export JSON chiffré: quotidien (app/lib/backup.js)
  - GitHub: code source complet + history
```

## 5. Tests de continuité

| Type de test | Fréquence | Dernier test | Prochain |
|-------------|-----------|-------------|----------|
| Test de restauration backup | Trimestriel | — | T1 2026 |
| Simulation panne Vercel | Semestriel | — | T2 2026 |
| Simulation data breach | Annuel | — | T3 2026 |
| Exercice de table (tabletop) | Annuel | — | T2 2026 |
| Revue PCA complète | Annuel | 27/02/2026 | 02/2027 |

## 6. Contacts d'urgence

| Rôle | Contact | Téléphone | Disponibilité |
|------|---------|-----------|---------------|
| CTO / On-call primaire | _______ | _______ | 24/7 |
| RSSI / On-call secondaire | _______ | _______ | 24/7 |
| DPO | _______ | _______ | Heures ouvrées |
| Support Supabase | support@supabase.io | — | 24/7 (Pro) |
| Support Vercel | support@vercel.com | — | 24/7 (Pro) |
| CERT.be | cert@cert.be | +32 2 790 33 33 | 24/7 |
| APD (incident RGPD) | contact@apd-gba.be | +32 2 274 48 00 | Heures ouvrées |

---
*Document ISO 27001:2022 — Clause A.5.29 / A.5.30 — Continuité d'activité*
