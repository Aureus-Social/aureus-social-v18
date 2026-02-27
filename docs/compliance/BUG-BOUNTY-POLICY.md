# 🔒 Aureus Social Pro — Programme de Divulgation Responsable

## Scope

### In Scope
- `app.aureussocial.be` — Application principale
- `api.aureussocial.be/v1/*` — API REST v1
- Application mobile (si applicable)

### Out of Scope
- `aureusia.com` — Site corporate (pas de données)
- Attaques DDoS / volumétriques
- Social engineering / phishing sur employés
- Vulnérabilités dans des dépendances tierces sans PoC d'exploitation

## Vulnérabilités recherchées

| Sévérité | Type | Récompense |
|----------|------|-----------|
| **Critique** | RCE, SQLi, accès BDD complet, bypass auth total | 500-2.000€ |
| **Haute** | IDOR sur données NISS/salaire, XSS stocké, SSRF | 200-500€ |
| **Moyenne** | CSRF sur actions critiques, information disclosure | 50-200€ |
| **Basse** | XSS reflété, headers manquants, open redirect | Hall of Fame |

## Règles d'engagement

1. **Ne pas** accéder, modifier ou supprimer des données d'autres utilisateurs
2. **Ne pas** exfiltrer de données personnelles (NISS, salaires, IBAN)
3. **Ne pas** effectuer d'attaques destructives ou de déni de service
4. **Ne pas** tester en production sans accord préalable (environnement staging disponible)
5. **Reporter** via `security@aureusia.com` avec :
   - Description détaillée de la vulnérabilité
   - Étapes de reproduction (PoC)
   - Impact potentiel
   - Suggestion de correction (optionnel)

## Processus

1. **Réception** : Accusé de réception sous 48h
2. **Triage** : Évaluation sévérité sous 5 jours ouvrables
3. **Correction** : Patch déployé selon sévérité (critique: 24h, haute: 7j, moyenne: 30j)
4. **Récompense** : Paiement après validation du fix
5. **Disclosure** : Publication coordonnée après 90 jours ou après fix (au plus tôt)

## Safe Harbor

Les chercheurs respectant ces règles ne feront l'objet d'aucune poursuite légale.
Nous nous engageons à ne pas initier de procédure judiciaire contre les chercheurs agissant de bonne foi.

## Hall of Fame

Les chercheurs ayant contribué à la sécurité d'Aureus Social Pro seront remerciés publiquement
(avec leur accord) sur notre page : `aureussocial.be/security/hall-of-fame`

## Contact

- Email : `security@aureusia.com`
- PGP : Disponible sur `aureussocial.be/.well-known/pgp-key.txt`
- Langue : FR, NL, EN
