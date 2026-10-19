# Publication sur Google Play · version 1.0.0

Tout ce qu'il faut pour publier **Waselni** (`com.aymen.waselni`) sur Google Play, sur le même modèle qu'AgriPedia et
Halal & Mosque Finder : application **Expo**, fichier pour Google Play construit avec **EAS Build**.

| Dossier / fichier | Contenu |
|---|---|
| `textes/fr.md`, `textes/en.md`, `textes/ar.md` | Nom, description courte, description complète, notes de version (limites vérifiées par `scripts/check_texts.py` et la CI) |
| `../assets/images/play-icon-512.png` | Icône de la fiche (512 × 512) |

À faire avant la fiche : la **bannière** (1024 × 500) et **au moins 2 captures** de téléphone par langue (on peut les
prendre sur un téléphone avec l'APK de test : accueil, trajets, détail d'un trajet, messagerie, suivi d'un contrat,
vérification d'identité).

## Récapitulatif (à copier-coller)

| Élément | Valeur |
|---|---|
| Nom du paquet | `com.aymen.waselni` |
| Version / code de version | `1.0.0` / `1` (`app.json` › `expo.version`, `expo.android.versionCode`) |
| Nom sur Google Play | `Waselni : envoi de colis` (fr), voir `textes/` pour en et ar |
| Catégorie | **Voyages et infos locales** (ou **Shopping**) |
| E-mail de contact | `contact@waselni.fr` (ou `aymenkssi@gmail.com`) |
| Site web | `https://waselni.fr` |
| Politique de confidentialité | `https://waselni.fr/privacy` |
| Autorisations | appareil photo (photo d'un document ou du colis, à la demande), Internet |
| Annonces | non |
| Public cible | 18 ans et plus |

### Ordre de publication

1. Vérifier que `https://waselni.fr/privacy` mentionne l'application mobile (mêmes données que le site) et que la
   **suppression de compte** peut se demander depuis le site (exigence Google Play, voir « Sécurité des données »).
2. Construire le `.aab` avec EAS (étape 1) et un APK de test pour vérifier l'application sur un téléphone.
3. Créer l'application dans la Play Console (étape 2), remplir la fiche (étape 3) et les déclarations (étape 4).
4. Test interne, puis test fermé si le compte l'exige (étape 5), puis production (étape 6).

---

## 0. Avant de commencer (une seule fois)

**Compte Expo** (gratuit) : https://expo.dev/signup, puis sur l'ordinateur qui lance les builds : `npx eas-cli login`.
Au premier build, accepter la création du projet EAS (`eas init` est proposé automatiquement).

## 1. Construire l'APK (test) et le fichier pour Google Play (.aab)

```bash
cd waselni-apk
git pull && yarn install
npx eas-cli build --platform android --profile preview      # APK : installable directement sur un téléphone
npx eas-cli build --platform android --profile production   # .aab : le fichier à envoyer sur Google Play
```

- Le lien de téléchargement (et un QR code pour l'APK) s'affiche à la fin du build, et sur https://expo.dev › projet
  › **Builds**.
- Au premier build, laisser EAS **créer la clé de signature** et la garder sur le compte Expo (elle servira pour toutes
  les mises à jour ; Google Play gère ensuite la clé finale avec « Signature d'application Play »).
- Google Play refuse un code de version déjà envoyé (même en test interne) : **avant chaque nouveau build production,
  augmenter `android.versionCode` de 1**, et `version` (1.0.1, 1.1.0…) quand la nouvelle version est publiée.
- Sans EAS : chaque exécution de la CI GitHub (onglet **Actions** › **CI**) publie aussi un APK de test dans l'artefact
  `waselni-apk` (signé avec une clé de debug : pour essayer l'application, pas pour Google Play).

## 2. Créer l'application dans la Play Console

https://play.google.com/console › **Créer une application** :

| Champ | Valeur |
|---|---|
| Nom de l'application | `Waselni : envoi de colis` |
| Langue par défaut | Français – fr-FR |
| Application ou jeu | Application |
| Sans frais ou payante | Sans frais |
| Déclarations | Cocher les règles du programme pour les développeurs et les lois d'exportation des États-Unis |

## 3. Fiche du Store

**Développer la présence sur le Store** › **Fiche principale du Store**.

1. Pour chaque langue (**Gérer les traductions** › **Ajouter vos propres traductions** : `en-US`, `ar`, en plus de `fr-FR`) :
   **Nom**, **description courte**, **description complète** depuis `textes/<langue>.md`, bannière et captures.
2. **Icône** : `assets/images/play-icon-512.png`.
3. **Paramètres du Store** : catégorie **Voyages et infos locales**.
4. **Coordonnées** : e-mail, site `https://waselni.fr`.

## 4. Contenu de l'application (déclarations)

| Rubrique | Réponse |
|---|---|
| Règles de confidentialité | `https://waselni.fr/privacy` |
| Annonces | **Non** |
| Accès à l'application | **Certaines fonctionnalités sont limitées** : fournir un compte de test (e-mail + mot de passe, **sans 2FA**) d'un transporteur **déjà vérifié**, pour que l'examinateur puisse tout essayer |
| Public cible | **18 ans et plus** |
| Classification du contenu | **Tous les autres types d'applications** ; **Oui** aux échanges entre utilisateurs (messagerie) ; **Non** au reste |
| Actualités, santé, finance, gouvernement | Non (pas d'application financière : le paiement se fait sur le site) |
| Autorisations | Appareil photo uniquement |

### Sécurité des données

Les données sont celles du compte Waselni, envoyées au serveur `waselni.fr` (**chiffrées en transit : oui**) :

| Type de données | Collectée | Partagée | Finalité |
|---|---|---|---|
| Nom, adresse e-mail, numéro de téléphone, adresse postale | Oui | Non | Gestion du compte, fonctionnement de l'application |
| Photos et fichiers (pièces d'identité, justificatifs, photos des colis, pièces jointes) | Oui | Non | Fonctionnement de l'application, prévention des fraudes et sécurité |
| Messages dans l'application | Oui | Non | Fonctionnement de l'application |
| Contenu généré (annonces, avis) | Oui | Non | Fonctionnement de l'application |

- **Suppression des données** : l'application propose « Supprimer mon compte » (Profil), qui envoie la demande par e-mail.
  Google Play exige aussi **un lien web** où demander la suppression sans l'application : indiquer une page du site
  (par exemple `https://waselni.fr/contact`, catégorie « Suppression de compte ») et la mentionner dans `/privacy`.
- Pas de localisation, pas d'identifiant publicitaire, pas de SDK d'analyse.

## 5. Tester avant la production

1. **Tester et publier** › **Test interne** › **Créer une version** : importer le fichier `.aab` d'EAS, nom `1.0.0 (1)`,
   notes de version (bloc ci-dessous), ajouter votre Gmail dans les testeurs et installer l'app depuis le lien de test.
2. **Comptes récents** : si l'accès à la production est verrouillé, faire d'abord un **test fermé** avec **au moins
   12 testeurs** pendant **14 jours d'affilée**, puis **Demander l'accès à la production**.

```
<fr-FR>
Première version de l'application Waselni : recherche de trajets et de demandes, publication d'annonces, messagerie, propositions et suivi des envois, vérification d'identité et double authentification.
</fr-FR>
<en-US>
First release of the Waselni app: search trips and requests, post ads, messaging, offers and shipment tracking, identity verification and two-factor authentication.
</en-US>
<ar>
الإصدار الأول من تطبيق وصلني: البحث عن الرحلات والطلبات، نشر الإعلانات، الرسائل، العروض وتتبع الإرسال، التحقق من الهوية والمصادقة الثنائية.
</ar>
```

## 6. Publier en production

**Production** › **Créer une version** (ou **Promouvoir la version**) › **Pays et régions** › **Envoyer pour examen**.
