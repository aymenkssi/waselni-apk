# Publication sur Google Play · version 1.0.0

Dossier complet pour publier **Waselni** (`com.aymen.waselni`) sur Google Play : textes, images, réponses aux
déclarations de la Play Console et marche à suivre. Même modèle qu'AgriPedia et Halal & Mosque Finder (application
**Expo**, fichier pour Google Play construit avec **EAS Build**).

| Dossier / fichier | Contenu |
|---|---|
| `textes/fr.md`, `textes/en.md`, `textes/ar.md` | Nom, description courte, description complète, notes de version (limites vérifiées par `scripts/check_texts.py` et la CI) |
| `images/icon-512.png` | Icône de la fiche (512 × 512) |
| `images/feature-graphic-fr.png` (`-en`, `-ar`) | Bannière de la fiche (1024 × 500) |
| `images/screenshots-fr/` (`-en`, `-ar`) | 8 captures de téléphone (1080 × 1920) par langue |
| `scripts/` | Captures, composition des images, contrôle des textes |

Ordre des captures : accueil, liste des trajets, détail d'un trajet (transporteur Pro et avis), messagerie, suivi d'un
envoi, publication d'une demande, vérification d'identité, mode sombre.

## Récapitulatif (à copier-coller)

| Élément | Valeur |
|---|---|
| Nom du paquet | `com.aymen.waselni` |
| Version / code de version | `1.0.0` / `1` (`app.json` › `expo.version`, `expo.android.versionCode`) |
| Nom sur Google Play | `Waselni : envoi de colis` (fr) · `Waselni: send parcels abroad` (en) · `وصلني: إرسال الطرود` (ar) |
| Catégorie | **Voyages et infos locales** |
| E-mail de contact | `contact@waselni.fr` |
| Site web | `https://waselni.fr` |
| Politique de confidentialité | `https://waselni.fr/privacy` |
| Suppression du compte (URL) | `https://waselni.fr/account-deletion` |
| Autorisations | Appareil photo (à la demande), Internet |
| Annonces | Non |
| Achats dans l'application | Non (le paiement PayPal se fait sur le site) |
| Public cible | 18 ans et plus |

## Check-list avant l'envoi

- [ ] La PR du site « Suppression de compte » (`Waselni_V2.0`) est fusionnée **et déployée** : vérifier que
      https://waselni.fr/account-deletion s'ouvre, et que la politique de confidentialité contient les sections
      « Application mobile » et « Suppression du compte ».
- [ ] Un **compte de test** existe pour l'examinateur Google (voir étape 4, « Accès à l'application »).
- [ ] L'APK de test a été essayé sur un vrai téléphone (onglet **Actions** de GitHub, artefact `waselni-apk`).
- [ ] Le fichier `.aab` est construit avec EAS (étape 1).
- [ ] Compte développeur Google Play actif (frais d'inscription uniques de 25 $, vérification d'identité faite).

---

## 0. Avant de commencer (une seule fois)

1. **Compte développeur Google Play** : https://play.google.com/console/signup (compte **personnel** ou
   **organisation** ; une organisation demande un numéro D-U-N-S). Google vérifie l'identité du développeur avant la
   première publication.
2. **Compte Expo** (gratuit) : https://expo.dev/signup, puis sur l'ordinateur qui lance les builds :
   `npx eas-cli login`. Au premier build, accepter la création du projet EAS (`eas init` est proposé automatiquement).

## 1. Construire le fichier pour Google Play (.aab)

```bash
cd waselni-apk
git pull && yarn install
npx eas-cli build --platform android --profile production   # .aab : le fichier à envoyer sur Google Play
npx eas-cli build --platform android --profile preview      # APK : à installer sur un téléphone pour tester
```

- Le lien de téléchargement s'affiche à la fin du build, et sur https://expo.dev › projet › **Builds**.
- Au premier build, laisser EAS **créer la clé de signature** et la garder sur le compte Expo (elle servira pour toutes
  les mises à jour ; Google Play gère ensuite la clé finale avec « Signature d'application Play »).
- Google Play refuse un code de version déjà envoyé (même en test interne) : **avant chaque nouveau build production,
  augmenter `android.versionCode` de 1**, et `version` (1.0.1, 1.1.0…) quand la nouvelle version est publiée.

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

1. Pour chaque langue (**Gérer les traductions** › **Ajouter vos propres traductions** : `en-US`, `ar`, en plus de
   `fr-FR`) : **Nom**, **description courte**, **description complète** depuis `textes/<langue>.md` ; **bannière**
   `images/feature-graphic-<langue>.png` ; **captures de téléphone** : les 8 fichiers de `images/screenshots-<langue>/`,
   dans l'ordre.
2. **Icône** : `images/icon-512.png`.
3. **Paramètres du Store** : catégorie **Voyages et infos locales** ; tags proposés : « Voyages », « Livraison ».
4. **Coordonnées** : e-mail `contact@waselni.fr`, site `https://waselni.fr`.

## 4. Contenu de l'application (déclarations)

**Règles et programmes** › **Contenu de l'application** :

| Rubrique | Réponse |
|---|---|
| Règles de confidentialité | `https://waselni.fr/privacy` |
| Accès à l'application | **Tout ou partie des fonctionnalités sont soumises à des restrictions** › ajouter les identifiants du compte de test (ci-dessous) |
| Annonces | **Non, mon application ne contient pas d'annonces** |
| Classification du contenu | Questionnaire › catégorie **Tous les autres types d'applications** ; **Oui** : « les utilisateurs peuvent interagir ou échanger du contenu » (messagerie) ; **Non** à tout le reste (violence, contenu sexuel, langage, substances, jeux d'argent, partage de position) |
| Public cible | **18 ans et plus** uniquement ; l'application n'attire pas les enfants |
| Applications d'actualités | Non |
| Fonctionnalités financières | **Mon application ne propose aucune fonctionnalité financière** (le paiement se fait sur le site, via PayPal) |
| Santé | Non |
| Applications gouvernementales | Non |
| Sécurité des données | Voir ci-dessous |
| Suppression des données (dans « Sécurité des données ») | URL : `https://waselni.fr/account-deletion` |

### Compte de test pour l'examinateur

Créer sur le site un compte **« Expéditeur et transporteur »**, faire **valider son identité** dans l'admin, **sans
double authentification**, puis donner à Google :

```
Identifiant : <e-mail du compte de test>
Mot de passe : <mot de passe>
Remarques : compte expéditeur et transporteur vérifié. Les annonces se consultent sans compte ; la messagerie,
la publication et le suivi des envois demandent ce compte. Le paiement se fait sur le site waselni.fr.
```

Ne pas supprimer ce compte tant que l'application est publiée (les examinateurs y reviennent à chaque mise à jour).

### Sécurité des données

**Votre application collecte-t-elle ou partage-t-elle des données ?** Oui. **Chiffrées en transit ?** Oui (HTTPS).
**Les utilisateurs peuvent-ils demander la suppression ?** Oui (dans l'application : Profil › Supprimer mon compte ;
sur le web : `https://waselni.fr/account-deletion`). **Partage avec des tiers ?** Non.

Pour chaque type ci-dessous : **Collectées** : oui ; **Partagées** : non ; **Traitement éphémère** : non ;
**Obligatoire** sauf mention.

| Catégorie Play | Type de données | Finalités |
|---|---|---|
| Informations personnelles | Nom | Fonctionnement de l'application, Gestion du compte |
| Informations personnelles | Adresse e-mail | Fonctionnement de l'application, Gestion du compte, Communications du développeur |
| Informations personnelles | Numéro de téléphone | Fonctionnement de l'application, Gestion du compte |
| Informations personnelles | Adresse | Fonctionnement de l'application, Prévention des fraudes et sécurité (justificatif des transporteurs) |
| Informations personnelles | Autres informations (date de naissance, numéro de pièce d'identité, SIRET) | Prévention des fraudes et sécurité · **facultatif** (transporteurs seulement) |
| Photos et vidéos | Photos | Fonctionnement de l'application (photos du colis, photo de profil, pièces jointes), Prévention des fraudes et sécurité (documents d'identité) · **facultatif** |
| Fichiers et documents | Fichiers et documents | Prévention des fraudes et sécurité (pièce d'identité, justificatif, Kbis en PDF), Fonctionnement de l'application (pièces jointes) · **facultatif** |
| Messages | Autres messages dans l'application | Fonctionnement de l'application |
| Activité dans l'application | Autre contenu généré par l'utilisateur (annonces, avis) | Fonctionnement de l'application |

À ne **pas** déclarer : position (non utilisée), identifiants publicitaires, données d'analyse, informations
financières (aucune carte saisie dans l'application), contacts, audio.

## 5. Tester avant la production

1. **Tester et publier** › **Test interne** › **Créer une version** : importer le fichier `.aab` d'EAS, nom `1.0.0 (1)`,
   notes de version (bloc ci-dessous), ajouter votre Gmail dans les testeurs et installer l'app depuis le lien de test.
2. **Comptes personnels récents** : l'accès à la production demande d'abord un **test fermé** avec **au moins
   12 testeurs** inscrits pendant **14 jours d'affilée** (proches, membres de la communauté Waselni), puis
   **Demander l'accès à la production** (questionnaire sur le test).

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

**Production** › **Créer une version** (ou **Promouvoir la version** depuis le test) › **Pays et régions** : au minimum
France, Belgique, Tunisie, Algérie, Maroc (ou tous) › **Envoyer pour examen**. L'examen prend en général de quelques
heures à 7 jours.

## 7. Après la publication

- Ajouter le lien Google Play sur le site (pied de page ou page d'accueil) et sur les pages Facebook et Instagram.
- Répondre aux avis depuis la Play Console (**Notes et avis**).
- Pour chaque mise à jour : augmenter `android.versionCode`, `yarn typecheck && yarn lint && yarn test`, build EAS
  `production`, nouvelle version en test interne puis en production.

## Refaire les images

Il faut un serveur Waselni de test avec les comptes de démonstration utilisés par `scripts/capture-screens.js`
(nadia, karim, lina… mot de passe `DEMO_PASSWORD`), l'adresse de ce serveur dans `app.json` › `expo.extra.siteUrl`
le temps de l'export, et `puppeteer-core` (avec Chromium) :

```bash
mkdir -p play-store/build/fonts && cd play-store/build/fonts
npm pack @fontsource/figtree@5.2.8 @fontsource/noto-kufi-arabic@5.2.8
for f in *.tgz; do mkdir -p "${f%.tgz}" && tar -xzf "$f" -C "${f%.tgz}"; done
cd ../../..
npx expo export --platform web --output-dir play-store/build/web   # servir ce dossier sur http://localhost:3000
PUPPETEER_CORE=<chemin vers puppeteer-core> API_URL=<serveur>/api node play-store/scripts/capture-screens.js
PUPPETEER_CORE=<chemin vers puppeteer-core> node play-store/scripts/compose-images.js
```

Les captures cachent les chiffres de la page d'accueil (réglés dans l'admin du site) pour ne pas afficher de
statistiques sur la fiche.
