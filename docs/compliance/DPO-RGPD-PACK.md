# 🛡️ AUREUS SOCIAL PRO — Pack Conformité RGPD

## 1. Désignation DPO (Art. 37-39 RGPD)

### Obligation
Aureus IA SPRL traite des données à grande échelle de catégories spéciales (NISS, données salariales, données de santé via médecine du travail). La désignation d'un DPO est **obligatoire** (Art. 37.1.b et c).

### Modèle de désignation

```
D�CISION DU CONSEIL D'ADMINISTRATION
Aureus IA SPRL — BCE BE 1028.230.781

Objet : Désignation du Délégué à la Protection des Données

En application du Règlement (UE) 2016/679 (RGPD), articles 37 à 39,
le Conseil d'Administration de Aureus IA SPRL décide de désigner :

Nom : [NOM DU DPO]
Qualité : DPO externe certifié CIPP/E ou équivalent
Coordonnées : dpo@aureussocial.be
Date d'effet : [DATE]

Le DPO est désigné pour une durée de 2 ans renouvelable.
Il dispose de l'indépendance fonctionnelle requise par l'Art. 38.3 RGPD.

Fait à Bruxelles, le [DATE]
Signature : _________________________
```

### Notification à l'APD
Après désignation → notification obligatoire à l'Autorité de Protection des Données :
- **Formulaire en ligne** : https://www.autoriteprotectiondonnees.be/citoyen/agir/notifier-son-dpd
- Délai : immédiat après désignation
- Données requises : nom, coordonnées, BCE responsable de traitement

### DPO externes recommandés (Belgique)
| Prestataire | Certification | Tarif indicatif/an | Spécialité |
|-------------|--------------|-------------------|------------|
| DPO Consult BE | CIPP/E | 3.000-5.000€ | PME/SaaS |
| Privacy Affairs | CIPM | 4.000-8.000€ | Tech/Fintech |
| Privanova | ISO 27701 | 5.000-10.000€ | Enterprise |

Budget recommandé : **3.000-5.000€/an** pour un DPO externe partagé.

---

## 2. Registre des traitements (Art. 30 RGPD)

| # | Traitement | Finalité | Base légale | Catégories de données | Destinataires | Transferts hors UE | Durée conservation |
|---|-----------|----------|------------|----------------------|---------------|--------------------|--------------------|
| 1 | Gestion de la paie | Calcul et paiement des rémunérations | Art. 6.1.b (contrat) + Art. 6.1.c (obligation légale) | Identité, NISS, IBAN, salaire, situation familiale | ONSS, SPF Finances, banque | Non (Supabase EU-West) | 10 ans (Art. 315 CIR 92) |
| 2 | Déclarations sociales (DmfA, DIMONA) | Obligations envers l'ONSS | Art. 6.1.c (obligation légale) | NISS, prestations, cotisations | ONSS | Non | 10 ans |
| 3 | Déclarations fiscales (Belcotax) | Obligations envers le SPF | Art. 6.1.c (obligation légale) | Identité, revenus, PP retenu | SPF Finances | Non | 10 ans |
| 4 | Registre du personnel | Obligation AR 08/08/1980 | Art. 6.1.c (obligation légale) | Identité, contrat, dates E/S | Inspection sociale | Non | 5 ans après sortie |
| 5 | Portail employé | Accès fiches de paie, congés | Art. 6.1.b (contrat) | Email, fiches, soldes congés | Travailleur concerné | Non | Durée du contrat + 1 an |
| 6 | Médecine du travail | Surveillance santé | Art. 6.1.c + Art. 9.2.b (obligations employeur) | Données de santé (cat. spéciale) | SEPP/SIPP | Non | 40 ans (AR 28/05/2003) |
| 7 | Gestion des absences | Suivi maladie, accidents | Art. 6.1.b + Art. 9.2.b | Certificats médicaux, dates | Mutualité, assureur AT | Non | 5 ans |
| 8 | Logs applicatifs | Sécurité, audit trail | Art. 6.1.f (intérêt légitime) | IP, user-agent, timestamps | Administrateur système | Non | 1 an |
| 9 | Backup & restauration | Continuité d'activité | Art. 6.1.f (intérêt légitime) | Toutes les données ci-dessus | Hébergeur (Supabase EU) | Non | 30 jours rolling |
| 10 | Communication marketing | Newsletter, updates produit | Art. 6.1.a (consentement) | Email, nom | Plateforme email | Non | Jusqu'au retrait du consentement |

---

## 3. Analyse d'Impact (AIPD / DPIA) — Art. 35 RGPD

### Critères déclencheurs (CNIL/APD)
- ✅ Traitement à grande échelle de données sensibles (NISS)
- ✅ Données relatives à des personnes vulnérables (travailleurs)
- ✅ Croisement de données (identité + salaire + santé)

**→ AIPD obligatoire**

### Résumé AIPD Aureus Social Pro

| Risque identifié | Probabilité | Gravité | Mesure d'atténuation | Risque résiduel |
|-----------------|------------|---------|---------------------|----------------|
| Fuite de NISS | Faible | Élevée | Chiffrement AES-256, RLS Supabase, CSP strict | Faible |
| Accès non autorisé | Faible | Élevée | RBAC, 2FA, brute force protection, audit log | Faible |
| Perte de données | Très faible | Élevée | Backup auto 24h, export JSON, Supabase réplication | Très faible |
| Usage détourné | Très faible | Moyenne | Minimisation des données, registre Art.30 | Très faible |
| Sous-traitant non conforme | Faible | Moyenne | DPA signé avec Supabase (SCCs), hébergement EU | Faible |

---

## 4. Procédures obligatoires

### 4.1 Exercice des droits (Art. 15-22)
- **Formulaire** : Accessible via Portail Employé → "Mes droits RGPD"
- **Délai** : 30 jours calendrier (Art. 12.3)
- **Droits** : Accès (15), Rectification (16), Effacement (17), Limitation (18), Portabilité (20), Opposition (21)
- **Log** : Chaque demande loggée dans table `gdpr_requests`

### 4.2 Notification de violation (Art. 33-34)
- **Délai APD** : 72 heures max après constatation
- **Formulaire APD** : https://www.autoriteprotectiondonnees.be/citoyen/agir/notifier-une-fuite-de-donnees
- **Seuil notification personnes** : Si risque élevé pour les droits et libertés
- **Registre violations** : Table `security_incidents` avec timestamp, nature, données concernées, mesures prises

### 4.3 Sous-traitance (Art. 28)
- **Supabase Inc.** : DPA signé, SCCs (Standard Contractual Clauses), hébergement EU (eu-west-1)
- **Vercel Inc.** : DPA signé, edge functions EU, pas de stockage de données personnelles
- **Registre sous-traitants** : Maintenu dans table `data_processors`

---

## 5. Mesures techniques et organisationnelles (Art. 32)

| Mesure | Implémentation | Status |
|--------|---------------|--------|
| Chiffrement en transit | TLS 1.3 (HSTS preload) | ✅ |
| Chiffrement au repos | Supabase AES-256 | ✅ |
| Contrôle d'accès | RBAC multi-niveaux + RLS | ✅ |
| Authentification forte | 2FA TOTP disponible | ✅ |
| Protection brute force | Rate limiting + block 30min | ✅ |
| Audit trail | Toutes actions critiques loggées | ✅ |
| Backup | Auto 24h + export JSON manuel | ✅ |
| Minimisation | Seules données nécessaires collectées | ✅ |
| Pseudonymisation | NISS masqué dans les logs | ✅ |
| Tests de sécurité | Middleware CSP, XSS, CSRF | ✅ |
| Formation personnel | Documentation interne sécurité | ⏳ |
| DPO désigné | En cours de nomination | ⏳ |
