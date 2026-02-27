# Dossier DPO — Délégué à la Protection des Données
## Aureus IA SPRL — RGPD (UE 2016/679)

**Version :** 1.0 | **Date :** 27/02/2026

---

## 1. Obligation de désignation

### Aureus IA SPRL doit-elle désigner un DPO ?

| Critère (Art. 37 RGPD) | Applicable ? | Justification |
|------------------------|-------------|---------------|
| Autorité/organisme public | ❌ Non | Société privée |
| Suivi régulier et systématique à grande échelle | ✅ Oui | Traitement récurrent de données salariales pour de multiples entreprises clientes |
| Traitement à grande échelle de données sensibles | ⚠️ Potentiel | Données de santé limitées (certificats médicaux), mais traitement de NISS à grande échelle |

**Conclusion :** La désignation d'un DPO est **fortement recommandée** voire **obligatoire** dès que le nombre de clients dépasse un seuil significatif (traitement systématique de NISS et données salariales pour le compte de tiers).

---

## 2. Modèle de lettre de nomination (DPO externe)

```
LETTRE DE DÉSIGNATION DU DÉLÉGUÉ À LA PROTECTION DES DONNÉES
═══════════════════════════════════════════════════════════════

Aureus IA SPRL
BCE BE 1028.230.781
[Adresse siège social]
Bruxelles, Belgique

Objet : Désignation d'un Délégué à la Protection des Données
         conformément à l'article 37 du Règlement (UE) 2016/679

Madame, Monsieur,

Par la présente, Aureus IA SPRL désigne en qualité de Délégué à la
Protection des Données (DPO) externe :

   Nom : _________________________________
   Société : ______________________________
   Adresse : ______________________________
   Email : ________________________________
   Téléphone : ____________________________
   N° certification : ______________________ (IAPP/CIPP, ISO 17024, ou équivalent)

Cette désignation prend effet le __/__/2026 pour une durée de ___ an(s),
renouvelable par tacite reconduction.

MISSIONS DU DPO (Art. 39 RGPD) :

  a) Informer et conseiller le responsable du traitement et les employés
     sur leurs obligations RGPD ;
  
  b) Contrôler le respect du RGPD, des politiques internes et des
     dispositions nationales (Loi du 30/07/2018) ;
  
  c) Dispenser des conseils en matière d'analyse d'impact (AIPD) et
     en vérifier l'exécution (Art. 35) ;
  
  d) Coopérer avec l'Autorité de Protection des Données (APD) et
     faire office de point de contact (Art. 39.1.d-e) ;
  
  e) Tenir à jour le registre des activités de traitement (Art. 30) ;
  
  f) Superviser la gestion des violations de données et les
     notifications (Art. 33-34).

GARANTIES (Art. 38 RGPD) :

  - Le DPO est associé à toute question relative à la protection des
    données personnelles ;
  - Le DPO dispose des ressources nécessaires à l'exercice de ses missions ;
  - Le DPO ne reçoit aucune instruction en ce qui concerne l'exercice
    de ses missions ;
  - Le DPO fait directement rapport au niveau le plus élevé de la direction ;
  - Le DPO est soumis au secret professionnel.

NOTIFICATION À L'APD :

La désignation sera notifiée à l'Autorité de Protection des Données belge
conformément à l'article 37.7 du RGPD via :
https://www.autoriteprotectiondonnees.be/citoyen/agir/designez-votre-dpd

Fait à Bruxelles, le __/__/2026

Pour Aureus IA SPRL,             Le DPO,
_________________________        _________________________
[Nom], Directeur Général         [Nom], DPO
```

---

## 3. Profil DPO recherché

| Critère | Exigence |
|---------|----------|
| **Certification** | CIPP/E, CIPM, ISO 17024, ou équivalent reconnu |
| **Expérience** | Minimum 3 ans en protection des données |
| **Secteur** | Expérience paie/RH/fintech fortement souhaitée |
| **Juridiction** | Connaissance droit belge + RGPD |
| **Langue** | FR obligatoire, NL souhaité, EN apprécié |
| **Disponibilité** | Minimum 1 jour/mois + urgences |
| **Assurance** | RC professionnelle obligatoire |
| **Localisation** | Belgique (proximité APD) |

### Prestataires DPO recommandés en Belgique

| Cabinet | Spécialité | Contact |
|---------|-----------|---------|
| DPO Consult | PME/TPE, fintech | www.dpoconsult.be |
| Privacy Praxis | SaaS, données sensibles | www.privacypraxis.eu |
| Cresco Legal | Avocats + DPO | www.crescolegal.be |
| Deloitte DPO-as-a-Service | Grands comptes | www.deloitte.be |

**Budget estimé :** 200 — 500 €/mois (DPO externe TPE/PME)

---

## 4. Registre des Traitements (Art. 30 RGPD) — Complet

### En tant que RESPONSABLE du traitement

| # | Traitement | Finalité | Base légale | Catégories données | Personnes concernées | Durée rétention | Destinataires | Transfert hors UE |
|---|-----------|----------|-------------|-------------------|---------------------|----------------|---------------|-------------------|
| RT-01 | Gestion clients/prospects | Relation commerciale | Contrat (Art. 6.1.b) | Nom, email, téléphone, entreprise, BCE | Clients, prospects | Durée contrat + 3 ans | — | Non |
| RT-02 | Facturation | Comptabilité, obligations fiscales | Obligation légale (Art. 6.1.c) | Nom, adresse, BCE, montants | Clients | 7 ans (Art. 60 Code TVA) | Comptable | Non |
| RT-03 | Support technique | Assistance utilisateurs | Contrat (Art. 6.1.b) | Nom, email, tickets, logs d'accès | Utilisateurs plateforme | Durée contrat + 1 an | — | Non |
| RT-04 | Analytics plateforme | Amélioration du service | Intérêt légitime (Art. 6.1.f) | IP anonymisée, pages vues, actions | Utilisateurs | 13 mois | Vercel Analytics | Non (UE) |
| RT-05 | Sécurité informatique | Protection système | Intérêt légitime (Art. 6.1.f) | IP, user-agent, timestamps, tentatives auth | Utilisateurs, visiteurs | 1 an | — | Non |

### En tant que SOUS-TRAITANT (Art. 28 RGPD)

| # | Traitement | Responsable | Catégories données | Données sensibles | Durée rétention | Sous-traitants ultérieurs |
|---|-----------|-------------|-------------------|------------------|----------------|--------------------------|
| ST-01 | Calcul de paie | Clients (fiduciaires/PME) | Identité (nom, prénom, date naissance), NISS, IBAN, salaires, barèmes, situation familiale | Non* | Durée contrat client + archivage légal | Supabase (BDD), Vercel (hosting) |
| ST-02 | Déclarations sociales | Clients | NISS, cotisations ONSS, PP, prestations | Non | 10 ans (obligation ONSS) | Supabase |
| ST-03 | Registre du personnel | Clients | Identité complète, contrat, dates, nationalité | Non | 5 ans après sortie travailleur | Supabase |
| ST-04 | Fiches de paie | Clients | Salaires brut/net, déductions, primes | Non | 5 ans (AR 25/01/2001) | Supabase |
| ST-05 | Médecine du travail | Clients | Certificats médicaux, dates absence maladie | **Oui** (données de santé, Art. 9) | 40 ans | Supabase (chiffré) |
| ST-06 | Gestion des congés | Clients | Soldes congés, demandes, approbations | Non | Durée contrat travailleur | Supabase |
| ST-07 | GED documents | Clients | Documents RH variés | Potentiellement | Durée contrat + archivage légal | Supabase Storage |
| ST-08 | Portail employé | Clients | Identité limitée, fiches, soldes congés | Non | Durée contrat travailleur | Vercel + Supabase |

*\*Note : Le NISS est considéré comme identifiant national (Art. 87 RGPD) et requiert des mesures de protection renforcées.*

### Sous-traitants ultérieurs (Art. 28.2)

| Sous-traitant | Service | Localisation données | Certifications | DPA signé |
|--------------|---------|---------------------|---------------|----------|
| Supabase Inc. | Base de données PostgreSQL | UE (eu-west-1, AWS Ireland) | SOC 2 Type II | ✅ Oui |
| Vercel Inc. | Hébergement web, Edge Network | UE (fra1) + CDN global | SOC 2 Type II | ✅ Oui |
| GitHub Inc. | Code source (pas de données personnelles) | US | SOC 2 Type II | ✅ Oui |

---

## 5. Modèle AIPD (Analyse d'Impact — Art. 35)

### AIPD requise pour les traitements suivants :

| Traitement | Raison AIPD | Priorité |
|-----------|-------------|----------|
| ST-01 Calcul de paie (données NISS grande échelle) | Traitement systématique données identifiant national | Haute |
| ST-05 Médecine du travail | Données de santé (Art. 9) | Haute |

### Structure AIPD (à compléter par le DPO)

1. **Description du traitement** : finalité, nature, portée, contexte
2. **Nécessité et proportionnalité** : base légale, minimisation, durée rétention
3. **Risques pour les personnes** : accès non autorisé, perte, modification
4. **Mesures de sécurité** : chiffrement, RLS, RBAC, masquage NISS, audit trail
5. **Risque résiduel** : acceptable / nécessite consultation APD (Art. 36)

---

## 6. Procédure d'exercice des droits (Art. 15-22)

| Droit | Délai réponse | Implémentation technique |
|-------|--------------|-------------------------|
| **Accès** (Art. 15) | 1 mois | Export JSON complet des données du travailleur |
| **Rectification** (Art. 16) | 1 mois | Modification dans EmployeeHub + audit trail |
| **Effacement** (Art. 17) | 1 mois | Soft delete + purge après délai légal (sauf obligations conservation) |
| **Limitation** (Art. 18) | 1 mois | Flag "traitement limité" sur le profil |
| **Portabilité** (Art. 20) | 1 mois | Export CSV/JSON des données fournies par la personne |
| **Opposition** (Art. 21) | 1 mois | Évaluation intérêt légitime vs droits personne |

**Note :** Les droits d'effacement sont limités par les obligations légales de conservation (Art. 17.3.b) : conservation des fiches de paie 5 ans, des déclarations ONSS 10 ans.

---
*Document RGPD — Articles 30, 37-39, 35, 28 — Registre et DPO*
