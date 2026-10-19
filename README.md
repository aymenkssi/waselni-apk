# Waselni (Android)

Application Android de **Waselni** (https://waselni.fr) : mise en relation des expéditeurs de colis avec des voyageurs et
des transporteurs qui font le même trajet. Elle utilise le même compte et les mêmes données que le site.

## Fonctionnalités

- Trajets et demandes d'envoi : liste, filtres (pays de départ, d'arrivée, route / avion), détail, annonces correspondantes
- Inscription (expéditeur, transporteur particulier ou pro, les deux), connexion avec double authentification, mot de passe oublié
- Publication d'un trajet ou d'une demande d'envoi (avec photos du colis)
- Messagerie (texte, photos et documents), propositions de prix, contrats et suivi de l'envoi, avis après livraison
- Vérification d'identité (pièce d'identité + justificatif de domicile) et vérification pro (SIRET / Kbis) par photo ou PDF
- Profil, profils publics, signalement, activation de la 2FA, français / anglais / arabe (RTL), mode sombre

Le paiement PayPal reste sur le site (bouton « Payer sur waselni.fr » depuis le contrat).

## Développement

```bash
yarn install
yarn start                 # Expo (application Expo Go ou build de développement)
yarn typecheck && yarn lint && yarn test
npx expo export --platform web
```

L'application appelle `https://waselni.fr/api`. Pour un serveur de test, changer `expo.extra.siteUrl` dans `app.json`.

## Builds

```bash
npx eas-cli build --platform android --profile preview      # APK à installer sur un téléphone
npx eas-cli build --platform android --profile production   # .aab pour Google Play
```

La CI GitHub (onglet **Actions**) compile aussi un APK de test à chaque push (artefact `waselni-apk`).
Publication sur Google Play : `play-store/README.md`.
