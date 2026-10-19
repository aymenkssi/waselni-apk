# Consignes pour Claude

- Répondre en français.
- Ne jamais pousser directement sur `main` : travailler sur une branche, puis **ouvrir la pull request vers `main` sans demander** (ou mettre à jour la PR ouverte de la branche). Si la PR précédente a été fusionnée, repartir de `main` à jour.

## Vérifications avant chaque push

```bash
yarn typecheck && yarn lint && yarn test
python3 play-store/scripts/check_texts.py     # si play-store/textes/ a changé
npx expo export --platform web                # tous les écrans se construisent
```

La CI GitHub Actions (`ci.yml`) refait ces vérifications puis compile l'APK Android (`expo prebuild` + Gradle) ;
vérifier qu'elle est verte avant de considérer le travail fini.

## Points d'attention

- Application Android du site **Waselni** (https://waselni.fr), même structure qu'AgriPedia et Halal & Mosque Finder :
  **Expo / React Native** (SDK 57, TypeScript, expo-router). APK et .aab :
  `npx eas-cli build --platform android --profile preview` (APK) / `--profile production` (.aab).
- L'application n'a pas de serveur à elle : elle appelle l'API du site (`https://waselni.fr/api`, dépôt `Waselni_V2.0`,
  `backend/server.py`). Adresse réglable dans `app.json` › `expo.extra.siteUrl` (serveur de test).
  Toute évolution qui demande une nouvelle route se fait d'abord dans `Waselni_V2.0`.
- Client HTTP : `lib/api.ts` (jeton d'accès + rafraîchissement automatique sur 401). Session : `lib/session.ts`
  (Keystore Android via `expo-secure-store`, jamais AsyncStorage pour les jetons sur téléphone). État de connexion :
  `contexts/AuthContext.tsx`.
- Mêmes règles métier que le site (`lib/roles.ts`, `lib/validation.ts`) : un transporteur doit avoir son identité vérifiée
  pour publier un trajet ou contacter un expéditeur ; « Expéditeur + transporteur pro » = transporteur pro.
- La logique sans interface va dans `lib/` avec ses tests Jest (`__tests__/`).
- Textes de l'interface : `constants/translations.ts` (fr, en, ar, mêmes clés et mêmes paramètres ; un test le vérifie,
  ainsi que l'existence de chaque clé utilisée par `t('…')` / `tn('…')`).
- Couleurs : via `useTheme().colors` (mode sombre), jamais codées en dur dans les écrans.
- Arabe : mise en page RTL manuelle (`useRow()`, `align`, `HScroll`), comme dans les autres applications.
- Pas de `Intl` ni de `String.normalize` (moteur Hermes) : dates, prix et accents passent par `lib/format.ts` et `lib/text.ts`.
- Icônes : `node scripts/make-icons.js <chemin vers puppeteer-core>` (à partir de `assets/images/logo-source.png`).
- Publication Google Play : voir `play-store/README.md`.
- Avant chaque build envoyé à Google Play : augmenter `android.versionCode` dans `app.json`.

## Liens

- Site et API : https://waselni.fr (confidentialité : `/privacy`, conditions : `/terms`)
- Contact : aymenkssi@gmail.com
