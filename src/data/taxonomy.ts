/**
 * Taxonomies réutilisables : intérêts, conditions de travail, motivations,
 * compétences, contraintes et familles de métiers.
 * Les identifiants sont techniques ; les libellés français sont séparés.
 */

export const INTERESTS = [
  { id: "analyse", label: "Analyser et résoudre des problèmes complexes" },
  { id: "creation", label: "Concevoir et créer" },
  { id: "manuel", label: "Construire, réparer, manipuler des objets" },
  { id: "aide", label: "Aider, accompagner, enseigner, conseiller" },
  { id: "recherche", label: "Enquêter, observer, rechercher" },
  { id: "organisation", label: "Organiser, planifier, coordonner" },
  { id: "persuasion", label: "Convaincre, négocier, développer des projets" },
  { id: "nature", label: "Travailler avec la nature et le vivant" },
  { id: "machines", label: "Travailler avec des machines, véhicules, systèmes industriels" },
  { id: "numerique", label: "Travailler avec des outils numériques et des logiciels" },
  { id: "communication", label: "Communiquer, écrire, produire des contenus" },
  { id: "donnees", label: "Travailler avec des données, des mesures, des instruments" },
  { id: "operations", label: "Réaliser des opérations pratiques et entretenir du matériel" },
  { id: "gestion", label: "Gérer des ressources et prendre des décisions" },
] as const;

export const ENV_DIMS = [
  { id: "fieldwork", label: "Travail de terrain / extérieur", low: "plutôt en intérieur", high: "beaucoup sur le terrain" },
  { id: "deskWork", label: "Travail de bureau / sur écran", low: "peu de bureau", high: "surtout au bureau" },
  { id: "physicalActivity", label: "Activité physique", low: "plutôt sédentaire", high: "physiquement actif" },
  { id: "teamwork", label: "Travail en équipe", low: "plutôt en autonomie", high: "très collectif" },
  { id: "publicInteraction", label: "Contact avec le public", low: "peu de contact", high: "contact permanent" },
  { id: "travel", label: "Déplacements", low: "sédentaire", high: "déplacements fréquents" },
  { id: "routine", label: "Routine et prévisibilité", low: "très varié", high: "très régulier" },
  { id: "technicalWork", label: "Travail technique", low: "peu technique", high: "très technique" },
  { id: "analyticalWork", label: "Travail d’analyse", low: "peu d’analyse", high: "très analytique" },
] as const;

export const MOTIVATIONS = [
  { id: "utilite", label: "Utilité sociale" },
  { id: "environnement", label: "Impact environnemental" },
  { id: "concret", label: "Résultats tangibles" },
  { id: "defi", label: "Défi intellectuel" },
  { id: "creativite", label: "Créativité" },
  { id: "autonomie", label: "Autonomie" },
  { id: "stabilite", label: "Stabilité" },
  { id: "salaire", label: "Rémunération" },
  { id: "reconnaissance", label: "Reconnaissance" },
  { id: "apprentissage", label: "Apprentissage continu" },
  { id: "variete", label: "Variété" },
  { id: "responsabilite", label: "Responsabilités" },
  { id: "equipe", label: "Esprit d’équipe" },
  { id: "liberte", label: "Liberté et flexibilité" },
  { id: "voyage", label: "Voyage et découverte" },
  { id: "cause", label: "Contribution à une cause ou un secteur" },
] as const;

export const SKILLS = [
  { id: "logique", label: "Raisonnement logique" },
  { id: "technique", label: "Résolution de problèmes techniques" },
  { id: "spatial", label: "Raisonnement spatial" },
  { id: "analytique", label: "Pensée analytique" },
  { id: "depannage", label: "Dépannage pratique" },
  { id: "organisation", label: "Organisation" },
  { id: "communication", label: "Communication" },
  { id: "ecoute", label: "Écoute et relation à l’autre" },
  { id: "ecriture", label: "Rédaction et explication" },
  { id: "outils", label: "Apprentissage de nouveaux outils" },
  { id: "rigueur", label: "Rigueur et sens du détail" },
  { id: "adaptabilite", label: "Adaptabilité" },
  { id: "creativite", label: "Créativité" },
  { id: "coordination", label: "Coordination de projet" },
  { id: "decision", label: "Prise de décision" },
] as const;

/** Conditions de travail pouvant constituer des points de blocage. */
export const CONSTRAINTS = [
  { id: "desk-all-day", label: "Rester au bureau toute la journée" },
  { id: "repetitive", label: "Les tâches répétitives" },
  { id: "customer-contact", label: "Le contact permanent avec des clients ou usagers" },
  { id: "sales-targets", label: "Les objectifs commerciaux chiffrés" },
  { id: "heavy-physical", label: "Le travail physiquement éprouvant" },
  { id: "frequent-travel", label: "Les déplacements fréquents" },
  { id: "night-shifts", label: "Le travail de nuit ou en horaires décalés" },
  { id: "unstable-employment", label: "L’emploi instable (missions, saisonnier)" },
  { id: "long-training", label: "Les formations longues" },
  { id: "admin-heavy", label: "Une forte charge administrative" },
  { id: "works-alone", label: "Travailler seul·e" },
  { id: "manages-people", label: "Encadrer des personnes" },
  { id: "hierarchical", label: "Les environnements très hiérarchisés" },
] as const;

export const FAMILIES = [
  { id: "numerique-dev", label: "Développement et systèmes numériques", blurb: "Concevoir, faire fonctionner et sécuriser des logiciels et des infrastructures." },
  { id: "data-geo", label: "Données, cartographie et information géographique", blurb: "Collecter, traiter et représenter des données, notamment spatiales." },
  { id: "ingenierie", label: "Ingénierie et conception technique", blurb: "Concevoir et dimensionner des systèmes, des produits ou des ouvrages." },
  { id: "industrie", label: "Production et qualité industrielles", blurb: "Fabriquer, piloter des moyens de production et garantir la qualité." },
  { id: "maintenance", label: "Maintenance et interventions techniques", blurb: "Installer, diagnostiquer et réparer des équipements et des installations." },
  { id: "energie", label: "Énergie et transition", blurb: "Produire, installer et optimiser des énergies, notamment renouvelables." },
  { id: "environnement", label: "Environnement, nature et biodiversité", blurb: "Observer, protéger et gérer les milieux naturels et le vivant." },
  { id: "agriculture", label: "Agriculture, forêt et gestion des espaces", blurb: "Cultiver, élever, entretenir et valoriser les espaces ruraux et verts." },
  { id: "construction", label: "Construction, bâtiment et infrastructures", blurb: "Bâtir, rénover et entretenir des ouvrages et des réseaux." },
  { id: "transport", label: "Transport, mobilité et logistique", blurb: "Acheminer personnes et marchandises, gérer les flux et les stocks." },
  { id: "sante", label: "Santé et soin", blurb: "Prévenir, soigner et accompagner la santé des personnes." },
  { id: "social", label: "Accompagnement social et aide à la personne", blurb: "Soutenir des personnes dans leur vie quotidienne et leur insertion." },
  { id: "education", label: "Éducation, formation et transmission", blurb: "Transmettre des savoirs et accompagner des apprentissages." },
  { id: "recherche", label: "Recherche, laboratoire et mesure", blurb: "Produire des connaissances, analyser et mesurer avec rigueur." },
  { id: "securite", label: "Sécurité, prévention et secours", blurb: "Protéger les personnes, les biens et prévenir les risques." },
  { id: "gestion", label: "Organisation, gestion et coordination", blurb: "Planifier, coordonner des équipes, des projets et des ressources." },
  { id: "finance", label: "Finance, assurance et droit", blurb: "Gérer des risques, des comptes, des contrats et des règles." },
  { id: "commerce", label: "Commerce, vente et marketing", blurb: "Comprendre un marché, proposer et vendre des produits ou services." },
  { id: "communication", label: "Communication, médias et contenus", blurb: "Informer, raconter et produire des contenus pour des publics." },
  { id: "creation", label: "Création, design et arts visuels", blurb: "Imaginer et réaliser des objets, images et expériences." },
  { id: "artisanat", label: "Artisanat et métiers d’art", blurb: "Façonner, restaurer et transformer des matières avec un savoir-faire." },
  { id: "tourisme", label: "Tourisme, hôtellerie et loisirs de plein air", blurb: "Accueillir, guider et faire vivre des expériences." },
  { id: "sport", label: "Sport et activité physique", blurb: "Entraîner, animer et accompagner par la pratique physique." },
  { id: "culture", label: "Culture et patrimoine", blurb: "Conserver, interpréter et partager le patrimoine et la culture." },
  { id: "public", label: "Service public et territoires", blurb: "Mettre en œuvre des politiques publiques au service des territoires." },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];
export type EnvDimId = (typeof ENV_DIMS)[number]["id"];
export type MotivationId = (typeof MOTIVATIONS)[number]["id"];
export type SkillId = (typeof SKILLS)[number]["id"];
export type ConstraintId = (typeof CONSTRAINTS)[number]["id"];
export type FamilyId = (typeof FAMILIES)[number]["id"];

type Labeled = { id: string; label: string };
const index = <T extends Labeled>(xs: readonly T[]) =>
  Object.fromEntries(xs.map((x) => [x.id, x])) as Record<T["id"], T>;

export const INTEREST_BY_ID = index(INTERESTS);
export const ENV_BY_ID = index(ENV_DIMS);
export const MOTIVATION_BY_ID = index(MOTIVATIONS);
export const SKILL_BY_ID = index(SKILLS);
export const CONSTRAINT_BY_ID = index(CONSTRAINTS);
export const FAMILY_BY_ID = index(FAMILIES);

export const INTEREST_IDS = INTERESTS.map((x) => x.id) as InterestId[];
export const ENV_IDS = ENV_DIMS.map((x) => x.id) as EnvDimId[];
export const MOTIVATION_IDS = MOTIVATIONS.map((x) => x.id) as MotivationId[];
export const SKILL_IDS = SKILLS.map((x) => x.id) as SkillId[];
export const CONSTRAINT_IDS = CONSTRAINTS.map((x) => x.id) as ConstraintId[];
