# Career Compass

Application web **front-end seule** d’orientation professionnelle adaptative, entièrement en français.
Next.js 15 (App Router, export statique) · React 19 · TypeScript strict · Tailwind CSS 4 · Lucide · Vitest.

Aucun backend, aucune base de données, aucun compte, aucune API payante. Les réponses restent dans le `localStorage` du navigateur.

## Démarrer

```bash
npm install
npm run dev          # développement : http://localhost:3000
npm test             # tests unitaires (Vitest)
npm run typecheck    # TypeScript strict
npm run data:validate  # validation du jeu de données
npm run build        # export statique dans out/
npx serve out        # prévisualiser le build
```

Le dossier `out/` est déployable tel quel sur n’importe quel hébergement statique.

## Architecture

```
src/
  app/                  routes : / · /bilan · /resultats · /metiers · /metiers/[slug] · /secteurs · /secteurs/[slug] · /favoris · /a-propos
  components/           layout, ui, assessment, results, occupations, sectors
  data/
    taxonomy.ts         intérêts, cadre de travail, motivations, compétences, contraintes, familles (ids ≠ libellés FR)
    assessment/         banque de questions (principales + précisions), options d’accueil, version du questionnaire
    occupations/        fiches métiers (format compact, voir build.ts) et calcul des métiers liés
    sectors/            31 secteurs
    sources.ts          sources de référence et leurs conditions
  lib/
    assessment/         profile-builder · question-selection · adaptive-engine · scoring ·
                        recommendation-engine · explanation-builder · constraints · simulate
    storage/            local-storage (injectable) · migrations (schéma versionné)
    data/               validation · search · normalization
    hooks/              useSession, favoris, comparaison (sans erreur d’hydratation)
  types/                assessment, profile, occupation, recommendation
tests/                  moteur, profil, recommandations, persistance, jeu de données
scripts/                validate-data.ts · calibrate.ts (simule 8 profils types)
```

La logique métier est indépendante de React et testable seule.

### Moteur adaptatif
À chaque étape, `selectNext` note les questions candidates (déterministe, sans hasard) :
besoin d’information par clé de profil (intérêt, cadre, motivation, compétence, trait, point de blocage),
bonus pour lever une contradiction détectée, pénalité de redondance par sujet, alternance des dimensions,
prise en compte de la durée estimée, montée en priorité de la question obligatoire des points de blocage.
Les questions de précision (ex. quel type de travail technique ?) n’apparaissent que si une réponse antérieure les justifie ;
on ne creuse pas le secteur actuel d’une personne qui veut le quitter. Arrêt : couverture suffisante, plafond (46 questions) ou budget de temps (24 min estimées).

### Recommandations
Six scores séparés (intérêts 30 %, cadre 20 %, motivations 20 %, compétences 10 %, accessibilité 15 %, contraintes 5 %) —
poids **configurables** (`DEFAULT_WEIGHTS`) et **non validés scientifiquement**. Un manque de données ramène vers la neutralité.
Points de blocage forts : exclusion si la contrainte est connue, avertissement si « parfois », mention « à vérifier » si inconnue.
Sélection diversifiée : familles retenues par un critère de type MMR, suppression des quasi-doublons, 4 catégories de transition
(proche, adjacente, nouvelle, exploratoire), découvertes peu évidentes. Chaque piste cite les réponses qui la justifient.

### Persistance
`cc:session` (schéma versionné + version du questionnaire), `cc:favorites`, `cc:compare`. Données invalides, JSON corrompu, version future,
stockage indisponible : traités sans plantage (voir `tests/storage.test.ts`). Effacement total disponible dans l’interface.

## Données et sources

107 métiers, 31 secteurs, 25 familles. **Honnêteté sur la provenance** : le jeu est une rédaction éditoriale qui s’appuie sur la structure
de référentiels publics (ROME de France Travail, Onisep, ESCO, RNCP) — ce n’est **pas** un import automatique de ces bases.

| Champ | Statut |
|---|---|
| Domaine ROME (lettre) | repère éditorial à vérifier (aucun code de fiche n’est reproduit) |
| Description, tâches, intérêts, compétences | rédaction éditoriale |
| Conditions de travail (échelle 0–4 ou inconnu), contraintes, durées de formation | estimations à vérifier |
| Dernière vérification | `null` : aucune fiche n’a été vérifiée individuellement |

Aucun salaire chiffré, aucune statistique d’emploi, aucune offre d’emploi n’est fabriqué. Les liens Onisep sont des **liens de recherche**.
Les versions exactes et licences des jeux ROME/ESCO n’ont pas été vérifiées ligne à ligne : voir `src/data/sources.ts`
et le dataset ROME sur data.gouv.fr avant toute réutilisation.

### Format des données
Les fiches s’écrivent avec `o({...})` (`src/data/occupations/build.ts`). Ordre des 9 chiffres de `env` :
terrain, bureau, effort physique, équipe, public, déplacements, routine, technique, analyse. Échelle : 0 négligeable · 1 marginal · 2 significatif · 3 important · 4 dominant ;
`?` = inconnu (jamais traité comme 0). `con` : `night-shifts` (oui), `~night-shifts` (parfois), `!night-shifts` (non) ; absent = inconnu.
Les contraintes liées au cadre (bureau permanent, effort physique, contact public, déplacements, routine, travail isolé, formation longue) sont dérivées des valeurs connues.

### Actualiser ou étendre le jeu
1. Ajouter ou modifier des fiches dans `src/data/occupations/part*.ts` (ou un nouveau fichier ajouté à `index.ts`).
2. Pour un import depuis ROME/ONISEP/ESCO : télécharger les jeux ouverts (data.gouv.fr, francetravail.io, esco.ec.europa.eu), noter version, date et licence dans `sources.ts`,
   puis écrire un script de transformation dans `scripts/` (non utilisé en production) qui produit des fiches au format `o({...})`.
3. Renseigner `lastVerifiedAt` uniquement après vérification réelle.
4. `npm run data:validate && npm test`.

## Durée du bilan
Avec les profils synthétiques de `scripts/calibrate.ts` : 28 à 44 questions, soit environ 13 à 18 minutes estimées (+ 2 à 4 minutes d’accueil).
Les durées sont des estimations par type de question, pas des mesures sur de vrais utilisateurs.

## Limites connues
- Pas de validation scientifique ; poids de score non étalonnés sur des données réelles.
- Jeu de données initial de 107 métiers (objectif initial de 300 non atteint, par choix de qualité) ; non exhaustif, non mis à jour en continu ; non vérifié fiche par fiche.
- Rémunération et stabilité : indications relatives éditoriales seulement.
- Pas de géolocalisation : la préférence géographique n’influence pas le calcul.
- Les simulations par profils synthétiques valident la cohérence du moteur, pas sa pertinence pour des personnes réelles.
- Pas d’audit d’accessibilité automatisé (axe/Lighthouse) ni de test sur lecteur d’écran ; navigation clavier, focus visibles, libellés et réduction des animations ont été prévus.
- Pas de ESLint configuré (`npm run typecheck` fait office de contrôle statique).
- Pas d’internationalisation, mais contenus et logique sont séparés (ids techniques ≠ libellés) pour permettre d’ajouter une langue.
