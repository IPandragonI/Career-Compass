import type { ConstraintId, EnvDimId, FamilyId, InterestId, MotivationId, SkillId } from "@/data/taxonomy";
import type { AversionLevel, DimensionId, TraitId } from "@/types/assessment";

export type EducationLevel = "aucune" | "professionnel" | "secondaire" | "bac+2" | "licence" | "master" | "doctorat" | "autre" | "nsp";

export type OccupationalStatus = "emploi" | "etudes" | "chomage" | "reconversion";

export type FieldRelation = "meme-domaine-autre-travail" | "competences-autre-secteur" | "metier-voisin" | "changer-tout" | "explorer";

export type TrainingChoice = "aucune" | "jours" | "mois" | "6-12" | "1-2ans" | "longue" | "nsp";

export const TRAINING_MONTHS: Record<TrainingChoice, number | null> = {
  aucune: 0,
  jours: 1,
  mois: 4,
  "6-12": 12,
  "1-2ans": 24,
  longue: 72,
  nsp: null,
};

export type SalaryFloor = "aucun" | "modeste" | "moyen" | "eleve";
export type YesNoUnsure = "oui" | "non" | "nsp";

/** Réponses d’accueil. Tout est optionnel : l’application doit fonctionner avec des trous. */
export interface Onboarding {
  educationLevel?: EducationLevel;
  /** Identifiant d’un domaine d’études suggéré, ou « custom ». */
  studyField?: string;
  studyFieldCustom?: string;
  studyCompleted?: "oui" | "non" | "en-cours";
  currentStudy?: string;
  status?: OccupationalStatus;
  fieldRelation?: FieldRelation[];

  /** Progressive disclosure : questions d’expérience affichées si « oui ». */
  hasExperience?: boolean;
  currentOccupation?: string;
  previousOccupation?: string;
  /** Secteurs d’expérience (identifiants de secteurs). */
  experienceSectorIds?: string[];
  /** Activités appréciées / détestées (clés d’intérêts). */
  enjoyedTasks?: InterestId[];
  dislikedTasks?: InterestId[];
  acquiredSkills?: SkillId[];
  autonomy?: "encadre" | "equilibre" | "autonome";

  jobNow?: "oui" | "bientot" | "non";
  training?: TrainingChoice;
  entryLevelOk?: YesNoUnsure;
  relocation?: "oui" | "region" | "non" | "nsp";
  needIncomeDuringTraining?: YesNoUnsure;

  salaryFloor?: SalaryFloor;
  stableRequired?: YesNoUnsure;
  seasonalOk?: YesNoUnsure;
  travelOk?: "oui" | "occasionnel" | "non";
  licence?: YesNoUnsure;

  /** Champs volontairement ignorés par la personne. */
  skipped?: string[];
  completedAt?: string;
}

export interface Evidence {
  questionId: string;
  /** Texte de la réponse, cité tel quel dans les explications. */
  label: string;
  w: number;
}

export interface InterestState {
  raw: number;
  /** Intensité normalisée 0–1. */
  norm: number;
  n: number;
  evidence: Evidence[];
}

export interface EnvState {
  /** Valeur préférée moyenne (0–4), `undefined` si aucune information. */
  pref?: number;
  /** Dispersion : une valeur élevée indique une préférence en fourchette. */
  spread: number;
  min?: number;
  max?: number;
  n: number;
  essential: boolean;
  evidence: Evidence[];
}

export interface MotivationState {
  raw: number;
  norm: number;
  n: number;
  essential: boolean;
  evidence: Evidence[];
}

export type SkillStatus = "demonstrated" | "self-reported" | "uncertain";

export interface SkillState {
  /** Preuve par l’expérience ou une mise en situation (0–1). */
  demo: number;
  /** Perception de soi (0–1), conservée séparément. */
  self: number;
  status: SkillStatus;
  evidence: Evidence[];
}

export interface AversionState {
  /** `undefined` = pas d’information. */
  level?: AversionLevel;
  evidence: Evidence[];
}

export interface Contradiction {
  id: string;
  title: string;
  description: string;
  severity: "info" | "attention";
  /** Une contradiction levée par une question de précision reste visible, marquée comme résolue. */
  resolved: boolean;
}

export interface Profile {
  interests: Record<InterestId, InterestState>;
  env: Record<EnvDimId, EnvState>;
  motivations: Record<MotivationId, MotivationState>;
  skills: Record<SkillId, SkillState>;
  aversions: Record<ConstraintId, AversionState>;
  traits: Partial<Record<TraitId, number>>;
  /** Affinité (0–1) avec des familles de métiers, issue des questions de précision. */
  families: Partial<Record<FamilyId, number>>;
  hobbies: string[];
  freeText: string[];
  education: {
    level: EducationLevel | undefined;
    levelRank: number | undefined;
    field: string | undefined;
    /** Formation en cours, saisie libre (utilisée uniquement pour repérer ce qui est déjà « évident » pour la personne). */
    current: string | undefined;
  };
  background: {
    sectorIds: string[];
    familyIds: string[];
    hasBackground: boolean;
    /** Métiers du jeu de données rapprochés des métiers saisis en texte libre. */
    matchedOccupationIds: string[];
  };
  transition: {
    maxTrainingMonths: number | null;
    /** Recherche d’emploi rapide : plafonne la durée de formation tolérée. */
    urgent: boolean;
    wantsToLeaveField: boolean;
    wantsToStay: boolean;
    exploreBroadly: boolean;
    needIncome: boolean;
    entryLevelOk: boolean | null;
    stableRequired: boolean;
    seasonalOk: boolean | null;
    relocation: Onboarding["relocation"];
    salaryFloor: SalaryFloor | undefined;
    travelOk: Onboarding["travelOk"];
    licence: YesNoUnsure | undefined;
  };
  contradictions: Contradiction[];
  /** Couverture de chaque dimension, de 0 à 1. */
  coverage: Record<DimensionId, number>;
  answeredCount: number;
  skippedCount: number;
}
