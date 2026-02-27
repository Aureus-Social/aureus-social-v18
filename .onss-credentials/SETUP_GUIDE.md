# 🏛 AUREUS SOCIAL PRO — Configuration ONSS REST API
## Guide complet de connexion

**Prestataire:** AUREUS IA SPRL  
**BCE:** 1028.230.781  
**Identification ONSS:** DGIII/MAHI011/1028.230.781 (validée 26/02/2026)

---

## ✅ Ce qui est déjà fait automatiquement

1. ✅ Certificat RSA 2048-bit généré (valide jusqu'au 27/02/2028)
2. ✅ Clé privée encodée base64 pour Vercel
3. ✅ Client OAuth2 + JWT Client Assertion implémenté
4. ✅ API Dimona REST v2 intégrée (IN/OUT/UPDATE/CANCEL)
5. ✅ Retry mechanism conforme aux specs ONSS
6. ✅ Routes API backend déployées

---

## 🔧 Les 3 étapes manuelles restantes (5 min)

### Étape 1 : Activer le canal REST dans Chaman (2 min)

1. Va sur [Gestion des Accès](https://www.socialsecurity.be/site_fr/general/helpcentre/access.htm)
2. Connecte-toi avec ta **carte eID** en tant que GAP (Gestionnaire d'Accès Principal)
3. Dans Chaman, choisis **"Configurer un nouveau canal REST"**
4. Sélectionne les services :
   - ✅ **Dimona** (scope: `scope:dimona:declare scope:dimona:consult`)
   - ✅ **DmfA** (si disponible)
5. **Upload le certificat** : utilise le fichier `onss_certificate.pem` (inclus dans ce package)
6. **Note le Client ID** que Chaman te donne → tu en auras besoin à l'étape 3

### Étape 2 : Enregistrer premier mandat dans Mahis (2 min)

1. Va sur [Mahis](https://mahis.socialsecurity.be)
2. Connecte-toi avec eID
3. Crée un mandat pour ton premier client (peut être Aureus IA elle-même pour tester)
4. ⚠ **Deadline : 26/08/2026** — sinon l'identification expire

### Étape 3 : Ajouter les variables Vercel (1 min)

1. Va sur [Vercel Dashboard](https://vercel.com) → Projet Aureus Social → Settings → Environment Variables
2. Ajoute ces 2 variables :

| Variable | Valeur |
|----------|--------|
| `ONSS_CLIENT_ID` | Le Client ID obtenu de Chaman (étape 1) |
| `ONSS_PRIVATE_KEY` | Le contenu du fichier `PRIVATE_KEY_BASE64.txt` |

3. Redéploie le projet (ou push un commit)

---

## 🧪 Test de la connexion

Une fois configuré, teste depuis l'app :
- Va dans **Dimona** → onglet **🏛 Connexion ONSS** → **Tester la connexion**
- Ou appelle directement : `https://app.aureussocial.be/api/onss/status?test=true&env=simulation`

La première Dimona en simulation :
```
POST https://app.aureussocial.be/api/onss/dimona
{
  "type": "IN",
  "env": "simulation",
  "employer": { "enterpriseNumber": "1028230781" },
  "worker": { "niss": "85073100123", "firstName": "Jean", "lastName": "Test" },
  "occupation": { "startDate": "2026-03-01", "jointCommissionNbr": "200", "workerType": "OTH" }
}
```

---

## 📁 Fichiers inclus

| Fichier | Usage |
|---------|-------|
| `onss_certificate.pem` | Certificat à uploader dans Chaman |
| `onss_certificate.der` | Format DER (alternative) |
| `onss_public_key.pem` | Clé publique (référence) |
| `onss_private_key.pem` | ⚠ CLÉ PRIVÉE — NE JAMAIS PARTAGER |
| `PRIVATE_KEY_BASE64.txt` | Clé privée encodée base64 pour Vercel |

---

## 🔒 Sécurité

- La clé privée ne doit JAMAIS être commitée dans Git (déjà dans .gitignore)
- Le certificat est valide 2 ans (expire 27/02/2028)
- Les tokens OAuth2 expirent après 10 minutes
- L'environnement simulation n'affecte pas les vraies déclarations

## 📞 Contacts ONSS

- Identification : idfr@onss.fgov.be
- Contact Center : 02/509.59.59
- TRIMCOR : PrestatairesDGIII@onssrszlss.fgov.be
