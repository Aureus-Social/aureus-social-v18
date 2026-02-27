# Politique de Sécurité de l'Information
## Aureus IA SPRL — BCE BE 1028.230.781

**Version :** 1.0  
**Date :** 27/02/2026  
**Classification :** Interne  
**Propriétaire :** Direction Générale  
**Prochaine révision :** 27/02/2027

---

## 1. Objet

La présente politique définit les principes, exigences et responsabilités en matière de sécurité de l'information pour Aureus IA SPRL, conformément à la norme ISO/IEC 27001:2022 et au Règlement Général sur la Protection des Données (RGPD — UE 2016/679).

## 2. Périmètre

Le Système de Management de la Sécurité de l'Information (SMSI) couvre :

- **Produit :** Aureus Social Pro (plateforme SaaS de gestion de paie belge)
- **Infrastructure :** Vercel (hébergement), Supabase (base de données PostgreSQL), GitHub (code source)
- **Données traitées :** Données d'identification (nom, NISS, IBAN), données salariales, données fiscales, données de santé limitées (certificats médicaux)
- **Utilisateurs :** Fiduciaires, secrétariats sociaux, PME belges
- **Localisation :** Données hébergées en UE (AWS eu-west-1 via Supabase)

## 3. Engagement de la Direction

La Direction d'Aureus IA SPRL s'engage à :

- Protéger la confidentialité, l'intégrité et la disponibilité des informations
- Allouer les ressources nécessaires au SMSI
- Communiquer l'importance de la sécurité à tout le personnel
- Assurer la conformité aux exigences légales, réglementaires et contractuelles
- Améliorer continuellement l'efficacité du SMSI

## 4. Objectifs de sécurité

| Objectif | Indicateur | Cible |
|----------|-----------|-------|
| Disponibilité plateforme | Uptime mensuel | ≥ 99,9% |
| Temps de réponse incidents | MTTR (Mean Time To Respond) | < 4 heures |
| Vulnérabilités critiques | Délai de correction | < 24 heures |
| Vulnérabilités hautes | Délai de correction | < 72 heures |
| Sensibilisation personnel | Formation annuelle complétée | 100% |
| Tests de restauration | Backup restore test | Trimestriel |
| Revue des accès | Audit des permissions | Mensuel |
| Conformité RGPD | Incidents de données personnelles | 0 violation |

## 5. Principes directeurs

### 5.1 Confidentialité
- Principe du moindre privilège (least privilege)
- Chiffrement des données au repos (AES-256) et en transit (TLS 1.3)
- Authentification multi-facteur (2FA) pour tous les accès administratifs
- Classification des données : Public, Interne, Confidentiel, Strictement Confidentiel

### 5.2 Intégrité
- Contrôle de version du code source (Git)
- Validation des entrées côté serveur et client
- Checksums sur les exports de données
- Audit trail immuable sur les actions critiques

### 5.3 Disponibilité
- Architecture haute disponibilité (Vercel Edge Network)
- Sauvegardes automatiques quotidiennes (Supabase Point-in-Time Recovery)
- Plan de continuité d'activité (PCA) testé semestriellement
- Monitoring 24/7 avec alertes automatiques

## 6. Rôles et responsabilités

| Rôle | Responsabilités |
|------|----------------|
| **Direction Générale** | Approbation politique, allocation ressources, revue annuelle SMSI |
| **Responsable Sécurité (RSSI)** | Mise en œuvre SMSI, gestion des risques, réponse aux incidents |
| **DPO** | Conformité RGPD, registre des traitements, AIPD, contact APD |
| **Développeurs** | Secure coding, revue de code, correction vulnérabilités |
| **Support** | Signalement incidents, application procédures, sensibilisation clients |

## 7. Gestion des risques

L'appréciation des risques est réalisée selon la méthodologie EBIOS RM (adaptée), avec :
- Identification des actifs informationnels
- Évaluation des menaces et vulnérabilités
- Calcul du niveau de risque (probabilité × impact)
- Traitement : accepter, réduire, transférer ou éviter
- Revue trimestrielle du registre des risques

## 8. Gestion des incidents

Tout incident de sécurité doit être :
1. **Détecté** et signalé immédiatement
2. **Classifié** (Critique / Haute / Moyenne / Basse)
3. **Contenu** — actions immédiates pour limiter l'impact
4. **Investigué** — analyse des causes racines
5. **Résolu** — correction et restauration
6. **Documenté** — rapport d'incident et leçons apprises
7. **Notifié** — APD dans les 72h si données personnelles (Art. 33 RGPD)

## 9. Conformité légale et réglementaire

- **RGPD** (Règlement UE 2016/679)
- **Loi du 30/07/2018** relative à la protection des personnes physiques (loi belge RGPD)
- **NIS2** (Directive UE 2022/2555) — applicable si qualification entité essentielle/importante
- **DORA** (Règlement UE 2022/2554) — si clients secteur financier
- **Code du bien-être au travail** (données de santé)
- **Loi du 29/06/1981** relative aux secrétariats sociaux (obligations sectorielles)
- **AR du 25/01/2001** relatif aux chantiers temporaires ou mobiles

## 10. Revue et amélioration continue

- Revue de direction du SMSI : **annuelle** (minimum)
- Audits internes : **semestriels**
- Audit externe de certification : **annuel** (une fois certifié)
- Indicateurs de performance (KPI) suivis mensuellement
- Non-conformités traitées selon procédure d'amélioration continue (PDCA)

## 11. Sanctions

Toute violation de la présente politique peut entraîner des mesures disciplinaires, y compris la résiliation du contrat de travail pour motif grave, conformément à la législation belge du travail.

## 12. Approbation

| Fonction | Nom | Date | Signature |
|----------|-----|------|-----------|
| Directeur Général | _________________ | __/__/2026 | _________ |
| RSSI | _________________ | __/__/2026 | _________ |
| DPO | _________________ | __/__/2026 | _________ |

---
*Document ISO 27001:2022 — Clause 5.2 — Politique de sécurité de l'information*
