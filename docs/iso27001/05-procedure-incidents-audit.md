# Procédure de Gestion des Incidents de Sécurité
## Aureus IA SPRL — SMSI ISO 27001:2022

**Version :** 1.0 | **Date :** 27/02/2026

---

## 1. Classification des incidents

| Niveau | Critères | Exemples | SLA réponse | Escalade |
|--------|----------|----------|-------------|----------|
| **P1 — Critique** | Fuite données personnelles, indisponibilité totale, compromission admin | Data breach NISS, ransomware, API down | 15 min | DG + RSSI + DPO |
| **P2 — Haute** | Fonctionnalité critique impactée, tentative intrusion réussie | Calcul paie KO, accès non autorisé détecté | 1h | RSSI + CTO |
| **P3 — Moyenne** | Fonctionnalité secondaire impactée, vulnérabilité détectée | Export PDF KO, CVE haute dans dépendance | 4h | CTO |
| **P4 — Basse** | Anomalie mineure, alerte informative | Pic rate limiting, 404 inhabituel | 24h | Lead Dev |

## 2. Processus de réponse (PICERL)

### Phase 1 — Préparation
- [ ] Équipe incident formée et joignable
- [ ] Outils de diagnostic disponibles (Supabase Dashboard, Vercel logs, GitHub)
- [ ] Runbooks à jour pour chaque scénario
- [ ] Canaux de communication définis (Slack #incidents, email)

### Phase 2 — Identification
- [ ] Source de détection : monitoring, alerte automatique, signalement utilisateur
- [ ] Confirmation de l'incident (pas un faux positif)
- [ ] Classification (P1/P2/P3/P4)
- [ ] Ouverture du ticket incident (numéro INC-YYYY-NNN)

### Phase 3 — Containment (Confinement)
- [ ] Actions immédiates pour limiter la propagation
- [ ] Isolation du système/compte compromis si nécessaire
- [ ] Préservation des preuves (logs, snapshots)
- [ ] Communication interne : équipe informée

### Phase 4 — Éradication
- [ ] Cause racine identifiée
- [ ] Vulnérabilité corrigée / patchée
- [ ] Vecteur d'attaque neutralisé
- [ ] Indicateurs de compromission (IoC) documentés

### Phase 5 — Recovery (Restauration)
- [ ] Systèmes restaurés et opérationnels
- [ ] Données vérifiées (intégrité)
- [ ] Monitoring renforcé post-incident
- [ ] Communication clients si impact

### Phase 6 — Lessons Learned
- [ ] Post-mortem rédigé (sous 5 jours ouvrables)
- [ ] Actions correctives identifiées et planifiées
- [ ] Mise à jour registre des risques si nécessaire
- [ ] Mise à jour des runbooks/procédures

## 3. Notification RGPD

**Si données personnelles impactées :**
- APD (Autorité de Protection des Données) : notification sous **72 heures** (Art. 33 RGPD)
- Personnes concernées : notification **sans délai indu** si risque élevé (Art. 34)
- Formulaire : https://www.autoriteprotectiondonnees.be/citoyen/agir/introduire-une-plainte

**Contenu notification APD :**
1. Nature de la violation (catégories et nombre de personnes)
2. Coordonnées DPO
3. Conséquences probables
4. Mesures prises ou proposées

## 4. Registre des incidents

| Champ | Description |
|-------|-------------|
| ID | INC-2026-001 |
| Date détection | ISO 8601 |
| Source | Monitoring / Utilisateur / Audit |
| Classification | P1 / P2 / P3 / P4 |
| Description | Résumé factuel |
| Impact | Systèmes / données / utilisateurs affectés |
| Actions containment | Ce qui a été fait immédiatement |
| Cause racine | Analyse technique |
| Actions correctives | Fix appliqué + mesures préventives |
| Date résolution | ISO 8601 |
| Notification RGPD | Oui/Non — référence si oui |
| Post-mortem | Lien vers document |
| Responsable | Nom |

---

# Checklist Audit Interne SMSI
## Fréquence : Semestrielle

### A. Gouvernance
- [ ] Politique de sécurité revue et à jour
- [ ] Registre des risques revu ce semestre
- [ ] SoA à jour (nouveaux contrôles ou changements)
- [ ] Revue de direction effectuée (PV signé)
- [ ] KPI sécurité suivis et dans les cibles

### B. Contrôle d'accès
- [ ] Revue des comptes actifs (pas de comptes orphelins)
- [ ] 2FA activé pour tous les admins
- [ ] Permissions RBAC vérifiées (least privilege)
- [ ] Logs d'accès aux données NISS revus
- [ ] Sessions timeout configuré (< 30 min inactivité)

### C. Protection des données
- [ ] Chiffrement au repos vérifié (Supabase encryption)
- [ ] TLS 1.3 vérifié (SSL Labs A+)
- [ ] Registre des traitements RGPD à jour
- [ ] Durées de rétention respectées (purge effectuée)
- [ ] Droits des personnes exercés et traités

### D. Développement sécurisé
- [ ] Dependabot alertes traitées (0 critique/haute)
- [ ] Dernière revue de code sécurité datée < 3 mois
- [ ] Tests automatisés passent (59+ tests paie)
- [ ] CSP headers vérifiés
- [ ] Rate limiting fonctionnel (test avec curl)

### E. Continuité
- [ ] Backup restauré avec succès (test restore)
- [ ] PCA/PRA revu et contacts à jour
- [ ] Supabase PITR actif et vérifié
- [ ] Rollback Vercel testé

### F. Incidents
- [ ] Registre incidents à jour
- [ ] Post-mortems rédigés pour tous P1/P2
- [ ] Actions correctives clôturées dans les délais
- [ ] Aucune notification APD en retard

### G. Personnel
- [ ] Formation sécurité annuelle effectuée
- [ ] NDA signés pour tous les collaborateurs
- [ ] Offboarding effectué pour les départs (accès révoqués)

**Résultat audit :** ___/40 points conformes
**Auditeur :** _________________ | **Date :** __/__/2026

---
*Document ISO 27001:2022 — Clauses 5.24-5.27 (Incidents) / 9.2 (Audit interne)*
