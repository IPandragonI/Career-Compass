import type {
  EducationLevel,
  FieldRelation,
  OccupationalStatus,
  SalaryFloor,
  TrainingChoice,
} from "@/types/profile";
import type { FamilyId } from "@/data/taxonomy";

export const EDUCATION_LEVELS: { id: EducationLevel; label: string; rank: number | undefined; hint?: string }[] = [
  { id: "aucune", label: "Pas de diplôme ou scolarité inachevée", rank: 0 },
  { id: "professionnel", label: "Diplôme professionnel (CAP, BEP, titre pro)", rank: 1 },
  { id: "secondaire", label: "Baccalauréat ou équivalent", rank: 2 },
  { id: "bac+2", label: "Bac +2 (BTS, DUT, BUT 2 ans, DEUG)", rank: 3 },
  { id: "licence", label: "Bac +3 (licence, BUT, bachelor)", rank: 4 },
  { id: "master", label: "Bac +5 (master, ingénieur, école)", rank: 5 },
  { id: "doctorat", label: "Doctorat", rank: 6 },
  { id: "autre", label: "Autre qualification", rank: undefined },
  { id: "nsp", label: "Je préfère ne pas répondre", rank: undefined },
];

export const STATUS_OPTIONS: { id: OccupationalStatus; label: string }[] = [
  { id: "etudes", label: "Je suis en études" },
  { id: "emploi", label: "Je travaille actuellement" },
  { id: "chomage", label: "Je suis à la recherche d’un emploi" },
  { id: "reconversion", label: "J’envisage une reconversion" },
];

export const FIELD_RELATION_OPTIONS: { id: FieldRelation; label: string; hint: string }[] = [
  { id: "meme-domaine-autre-travail", label: "Rester dans mon domaine, mais changer de type de travail", hint: "Même secteur, activité différente." },
  { id: "competences-autre-secteur", label: "Utiliser mes compétences dans un autre secteur", hint: "Mêmes savoir-faire, autre univers." },
  { id: "metier-voisin", label: "Évoluer vers un métier voisin", hint: "Un métier qui partage une partie de mes acquis." },
  { id: "changer-tout", label: "Changer à la fois de métier et de secteur", hint: "Repartir sur une page presque blanche." },
  { id: "explorer", label: "Explorer largement avant de décider", hint: "Je ne sais pas encore." },
];

export const TRAINING_OPTIONS: { id: TrainingChoice; label: string }[] = [
  { id: "aucune", label: "Aucune formation supplémentaire" },
  { id: "jours", label: "Quelques jours ou semaines" },
  { id: "mois", label: "Quelques mois" },
  { id: "6-12", label: "Six à douze mois" },
  { id: "1-2ans", label: "Un à deux ans" },
  { id: "longue", label: "Une formation plus longue est envisageable" },
  { id: "nsp", label: "Je ne sais pas encore" },
];

export const SALARY_OPTIONS: { id: SalaryFloor; label: string }[] = [
  { id: "aucun", label: "Pas de minimum particulier" },
  { id: "modeste", label: "Un revenu modeste me suffit si le travail me plaît" },
  { id: "moyen", label: "Un revenu moyen est nécessaire" },
  { id: "eleve", label: "J’attends un revenu confortable" },
];

/** Domaines d’études suggérés. Chacun est relié à des secteurs et familles pour détecter la proximité. */
export interface StudyField {
  id: string;
  label: string;
  sectorIds: string[];
  familyIds: FamilyId[];
}

export const STUDY_FIELDS: StudyField[] = [
  { id: "informatique", label: "Informatique, numérique", sectorIds: ["numerique"], familyIds: ["numerique-dev", "data-geo"] },
  { id: "ingenierie", label: "Ingénierie, mécanique, électronique, automatisme", sectorIds: ["ingenierie", "industrie", "maintenance"], familyIds: ["ingenierie", "industrie", "maintenance"] },
  { id: "sciences-vie-terre", label: "Sciences de la vie et de la Terre, biologie", sectorIds: ["recherche", "environnement", "animaux-soins"], familyIds: ["recherche", "environnement"] },
  { id: "physique-chimie", label: "Physique, chimie, matériaux", sectorIds: ["recherche", "industrie", "instrumentation-mesure"], familyIds: ["recherche", "industrie"] },
  { id: "maths-stats", label: "Mathématiques, statistiques", sectorIds: ["numerique", "recherche", "finance-assurance"], familyIds: ["data-geo", "finance", "recherche"] },
  { id: "geographie", label: "Géographie, aménagement, urbanisme", sectorIds: ["geo-amenagement", "environnement", "fonction-publique"], familyIds: ["data-geo", "public", "environnement"] },
  { id: "agri-environnement", label: "Agriculture, agronomie, environnement", sectorIds: ["agriculture-foret", "environnement", "agroalimentaire"], familyIds: ["agriculture", "environnement"] },
  { id: "batiment-tp", label: "Bâtiment, travaux publics, architecture", sectorIds: ["construction-btp"], familyIds: ["construction", "ingenierie"] },
  { id: "sante", label: "Santé, paramédical", sectorIds: ["sante"], familyIds: ["sante"] },
  { id: "social", label: "Social, médico-social, psychologie", sectorIds: ["social"], familyIds: ["social"] },
  { id: "education", label: "Éducation, enseignement, formation", sectorIds: ["education-formation"], familyIds: ["education"] },
  { id: "droit-science-po", label: "Droit, sciences politiques, administration", sectorIds: ["droit-justice", "fonction-publique"], familyIds: ["finance", "public"] },
  { id: "eco-gestion", label: "Économie, gestion, comptabilité", sectorIds: ["gestion-admin", "finance-assurance"], familyIds: ["gestion", "finance"] },
  { id: "commerce-marketing", label: "Commerce, vente, marketing", sectorIds: ["commerce-vente", "marketing-communication"], familyIds: ["commerce"] },
  { id: "communication-lettres", label: "Communication, lettres, langues, journalisme", sectorIds: ["marketing-communication", "medias-edition"], familyIds: ["communication"] },
  { id: "arts-design", label: "Arts, design, architecture d’intérieur", sectorIds: ["design-creation", "artisanat"], familyIds: ["creation", "artisanat"] },
  { id: "hotellerie-tourisme", label: "Hôtellerie, restauration, tourisme", sectorIds: ["hotellerie-tourisme"], familyIds: ["tourisme"] },
  { id: "transport-logistique", label: "Transport, logistique, automobile", sectorIds: ["transport-logistique", "automobile-mobilite"], familyIds: ["transport"] },
  { id: "sport", label: "Sport, activité physique (STAPS)", sectorIds: ["sport-loisirs"], familyIds: ["sport"] },
  { id: "histoire-culture", label: "Histoire, patrimoine, culture", sectorIds: ["culture-patrimoine"], familyIds: ["culture"] },
  { id: "securite", label: "Sécurité, défense, secours", sectorIds: ["securite-secours"], familyIds: ["securite"] },
  { id: "artisanat", label: "Artisanat, métiers d’art", sectorIds: ["artisanat"], familyIds: ["artisanat"] },
  { id: "aucun", label: "Aucun domaine particulier", sectorIds: [], familyIds: [] },
];

export const STUDY_FIELD_BY_ID: Record<string, StudyField> = Object.fromEntries(STUDY_FIELDS.map((f) => [f.id, f]));

export const AUTONOMY_OPTIONS = [
  { id: "encadre", label: "Un cadre clair avec des consignes précises" },
  { id: "equilibre", label: "Un équilibre entre cadre et initiative" },
  { id: "autonome", label: "Une grande autonomie dans l’organisation de mon travail" },
] as const;
