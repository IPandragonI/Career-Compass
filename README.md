# Career Compass

Application web **front-end seule** d’orientation professionnelle adaptative, entièrement en français.
Next.js 15 (App Router, export statique) · React 19 · TypeScript strict · Tailwind CSS 4 · Lucide · Vitest · ESLint · Prettier.

Aucun backend, aucune base de données, aucun compte, aucune API payante. Les réponses restent dans le `localStorage` du navigateur.

## Démarrer

```bash
npm install
npm run dev              # développement : http://localhost:3000
npm test                 # 65 tests (logique, données, persistance, composants)
npm run typecheck        # TypeScript strict
npm run lint             # ESLint
npm run format:check     # Prettier (npm run format pour corriger)
npm run data:validate    # validation du jeu de données
npm run calibrate        # simule 8 profils types et affiche leurs recommandations
npm run build            # export statique dans out/ + génération du service worker (postbuild)
npx serve out            # prévisualiser le build
```

Le dossier `out/` est déployable tel quel sur un hébergement statique **servi à la racine du domaine** (le service worker suppose la racine ; sinon adapter `public/sw.js` et `scripts/gen-sw-manifest.mjs`).

## Fonctionnalités

- **Bilan adaptatif** (accueil en 5 étapes facultatives, ~40 questions principales + 13 de précision, relecture et modification des réponses, pause/reprise).
- **Résultats** : « En bref » (3 pistes, directions, **comparaison avec le bilan précédent**), profil, directions, 8 à 12 métiers expliqués, découvertes, vérification de la réalité, prochaines étapes, **« Pourquoi pas ce métier ? »**, avis personnels « Me parle / Pas pour moi » (notes locales, sans effet sur le calcul).
- **Conserver son bilan** : **export / import JSON** (aller-retour validé et migré), **impression / PDF** via une feuille de style d’impression.
- **Explorateur** : recherche plein texte, filtres, tri, favoris, comparaison, **état dans l’URL** (partageable).
- **Hors ligne** : service worker qui met en cache tout le site statique après la première visite.
- **Accessibilité** : focus déplacé sur le titre de chaque question, boîte de dialogue native `<dialog>`, menu repliable sur mobile, raccourcis chiffrés non intrusifs, mouvement réduit respecté. Audit **axe-core** (WCAG 2 A/AA, bonnes pratiques) sans violation sur 10 pages, ordinateur et mobile.

## Architecture

```
src/
  app/                  routes : / · /bilan · /resultats · /metiers · /metiers/[slug] · /secteurs · /secteurs/[slug] · /favoris · /a-propos
  components/           layout, ui, assessment, results, occupations, sectors
  data/
    taxonomy.ts         intérêts, cadre de travail, motivations, compétences, contraintes, familles (ids ≠ libellés FR)
    assessment/         banque de questions (principales + précisions), options d’accueil, version du questionnaire
    occupations/        fiches (format compact, build.ts), extension + compléments de contraintes (part4), métiers liés calculés
    sectors/            31 secteurs
    sources.ts          sources de référence et leurs conditions
  lib/
    assessment/         profile-builder · question-selection · adaptive-engine · scoring · recommendation-engine ·
                        explanation-builder · absence · constraints · simulate
    i18n/messages.ts    catalogue des textes du moteur (explications, avertissements, notes)
    storage/            local-storage (injectable) · migrations (schéma versionné)
    data/               validation · search · normalization · session-io (export/import)
    hooks/              useSession, favoris, comparaison, état d’URL de l’explorateur
  types/                assessment, profile, occupation, recommendation
public/sw.js            service worker (daté à chaque build)
tests/                  moteur, profil, recommandations, persistance, fonctionnalités, composants (jsdom)
scripts/                validate-data · calibrate · import-rome · gen-sw-manifest
```

La logique métier est indépendante de React et testable seule.

### Moteur adaptatif

`selectNext` note les questions candidates de façon déterministe : besoin d’information par clé de profil, bonus pour lever une contradiction,
pénalité de redondance par sujet, alternance des dimensions, durée estimée, montée en priorité de la question obligatoire sur les points de blocage.
Les questions de précision n’apparaissent que si une réponse antérieure les justifie ; on ne creuse pas le secteur d’une personne qui veut le quitter.
Arrêt : couverture suffisante, plafond (46 questions) ou budget de temps (24 min estimées).
La matrice des points de blocage est **pré-remplie** d’après les réponses précédentes (à vérifier par la personne).

### Recommandations

Six scores séparés (intérêts 30 %, cadre 20 %, motivations 20 %, compétences 10 %, accessibilité 15 %, contraintes 5 %) —
poids **configurables** (`DEFAULT_WEIGHTS`) et **non validés scientifiquement**. Un manque de données ramène vers la neutralité.
Points de blocage forts : exclusion si la contrainte est connue, avertissement si « parfois », « à vérifier » si inconnue.
Accessibilité : durée de formation estimée selon le niveau et le recouvrement de compétences ; recherche d’emploi rapide (plafond 12 mois) ;
refus d’un poste de débutant (réserve sur les métiers qui s’abordent ainsi après un changement de secteur).
Les métiers saisis en texte libre sont rapprochés des fiches pour détecter le parcours.
Sélection diversifiée (type MMR), suppression des quasi-doublons, 4 catégories de transition, découvertes peu évidentes.

### Persistance

`cc:session` (schéma versionné, bilan précédent, avis), `cc:favorites`, `cc:compare`. Données invalides, JSON corrompu, version future,
stockage indisponible : traités sans plantage. Effacement total dans l’interface (avec confirmation accessible).

### Textes et langues

Les textes **du moteur** (explications, avertissements, notes) sont dans `src/lib/i18n/messages.ts`, les libellés dans `src/data/`.
Les textes des **composants** d’interface sont encore en français dans le JSX : ajouter une langue demanderait de les extraire aussi.

## Données et sources

135 métiers, 31 secteurs, 25 familles (au moins 5 métiers par famille). **Honnêteté sur la provenance** : le jeu est une rédaction éditoriale qui s’appuie
sur la structure de référentiels publics (ROME de France Travail, Onisep, ESCO, RNCP) — ce n’est **pas** un import automatique de ces bases.

| Champ                                                                    | Statut                                                      |
| ------------------------------------------------------------------------ | ----------------------------------------------------------- |
| Domaine ROME (lettre)                                                    | repère éditorial à vérifier (aucun code de fiche reproduit) |
| Description, tâches, intérêts, compétences                               | rédaction éditoriale                                        |
| Conditions de travail (0–4 ou inconnu), contraintes, durées de formation | estimations à vérifier                                      |
| Dernière vérification                                                    | `null` : aucune fiche n’a été vérifiée individuellement     |

Aucun salaire chiffré, aucune statistique d’emploi, aucune offre d’emploi n’est fabriqué. Les liens Onisep sont des **liens de recherche**.
Les versions exactes et licences des jeux ROME/ESCO n’ont pas été vérifiées : voir `src/data/sources.ts` et data.gouv.fr avant toute réutilisation.

### Format des données

Fiches : `o({...})` (`src/data/occupations/build.ts`). Ordre des 9 chiffres de `env` : terrain, bureau, effort physique, équipe, public, déplacements,
routine, technique, analyse. 0 négligeable · 1 marginal · 2 significatif · 3 important · 4 dominant ; `?` = inconnu (jamais 0).
`con` : `night-shifts` (oui), `~night-shifts` (parfois), `!night-shifts` (non) ; absent = inconnu. Les contraintes liées au cadre (bureau permanent, effort physique,
contact public, déplacements, routine, travail isolé, formation longue) sont dérivées des valeurs connues. `CONSTRAINT_PATCHES` (part4) ajoute des contraintes
éditoriales à des fiches existantes sans jamais écraser une valeur déjà renseignée.

### Actualiser ou étendre le jeu

1. Ajouter ou modifier des fiches dans `src/data/occupations/part*.ts`.
2. Pour partir du jeu ROME : télécharger le fichier (data.gouv.fr / francetravail.io) en acceptant sa licence, noter version et date dans `sources.ts`, puis
   `npm run data:import-rome -- fichier.csv` : produit `scripts/out/rome-candidates.json` (appellations, domaine, « déjà couvert ») et la couverture par domaine.
   **Limite** : la structure des colonnes du fichier officiel n’a pas été vérifiée (testé sur un CSV factice) ; les fiches restent à rédiger à la main.
3. Renseigner `lastVerifiedAt` uniquement après vérification réelle.
4. `npm run data:validate && npm test`.

## Durée du bilan

Profils synthétiques (`npm run calibrate`) : 28 à 44 questions, soit environ 13 à 18 minutes estimées (+ 2 à 4 minutes d’accueil).
Ce sont des estimations par type de question, pas des mesures sur de vraies personnes.

## Limites connues

- **Pas de validation par de vraies personnes** : les profils synthétiques valident la cohérence du moteur, pas sa pertinence. Les avis « Me parle / Pas pour moi » et
  l’export JSON permettent de recueillir des retours, mais aucune étude n’a été menée. Poids de score non étalonnés.
- Jeu de données initial de 135 métiers (objectif de 300 non atteint, par choix de qualité), non exhaustif, non vérifié fiche par fiche ; les contraintes ajoutées
  par relecture éditoriale restent des estimations.
- Rémunération et stabilité : indications relatives éditoriales seulement. Pas d’information géographique dans les fiches : la mobilité n’influence pas le calcul.
- Accessibilité : axe-core automatisé uniquement ; **pas de test avec un lecteur d’écran** ni d’audit manuel complet.
- Service worker : testé sur `localhost` (Chromium) ; comportement non vérifié sur d’autres navigateurs ou hébergements.
- Textes de l’interface non extraits dans un catalogue (voir « Textes et langues »).
