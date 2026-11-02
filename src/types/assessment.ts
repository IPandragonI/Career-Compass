import type { ConstraintId, EnvDimId, FamilyId, InterestId, MotivationId, SkillId } from "@/data/taxonomy";
import type { Onboarding } from "@/types/profile";
import type { Profile } from "@/types/profile";

/** Traits liés à la transition et au risque (valeurs de 0 à 1). */
export const TRAIT_IDS = [
  "retrain", // prêt·e à se former
  "lowerPay", // accepte une baisse de revenu initiale
  "stabilityNeed", // besoin de stabilité
  "seasonalOk", // accepte missions, saisonnier, contrats courts
  "selfEmployed", // attrait pour l’indépendance / l’entrepreneuriat
  "uncertaintyOk", // à l’aise avec l’incertitude
  "responsibilityOk", // à l’aise avec les responsabilités
  "relocation", // mobilité géographique
] as const;
export type TraitId = (typeof TRAIT_IDS)[number];

export type AversionLevel = 0 | 1 | 2 | 3;
export const AVERSION_LABEL: Record<AversionLevel, string> = {
  3: "Fortement indésirable",
  2: "Plutôt indésirable",
  1: "Acceptable avec modération",
  0: "Pas un problème",
};

/** Effet d’une réponse sur le profil. Chaque effet garde la trace de la question d’origine. */
export type Effect =
  | { k: "interest"; id: InterestId; w: number }
  | { k: "env"; id: EnvDimId; v: number; w?: number; essential?: boolean }
  | { k: "motivation"; id: MotivationId; w: number; essential?: boolean }
  | { k: "skillSelf"; id: SkillId; w: number }
  | { k: "skillDemo"; id: SkillId; w: number }
  | { k: "aversion"; id: ConstraintId; level: AversionLevel }
  | { k: "trait"; id: TraitId; v: number }
  | { k: "family"; id: FamilyId; w: number }
  | { k: "hobby"; text: string };

export type DimensionId =
  "interets" | "environnement" | "motivations" | "competences" | "quotidien" | "transition" | "loisirs" | "aversions";

export const DIMENSION_LABEL: Record<DimensionId, string> = {
  interets: "Intérêts",
  environnement: "Cadre de travail",
  motivations: "Motivations",
  competences: "Compétences",
  quotidien: "Journée idéale",
  transition: "Évolution et risque",
  loisirs: "Au-delà du travail",
  aversions: "Ce que vous voulez éviter",
};

export type QuestionKind = "single" | "multi" | "forced" | "scale" | "matrix" | "text";

export interface Option {
  id: string;
  label: string;
  hint?: string;
  effects: Effect[];
  /** Option exclusive dans une question à choix multiples (ex. « Aucun »). */
  exclusive?: boolean;
}

export interface MatrixItem {
  id: ConstraintId;
  label: string;
}

/** Contexte donné aux conditions d’affichage des questions. */
export interface QuestionContext {
  onboarding: Onboarding;
  profile: Profile;
  answers: Answers;
  /** Identifiants des questions déjà posées. */
  asked: string[];
}

export interface Question {
  id: string;
  kind: QuestionKind;
  tier: "core" | "followup";
  dimension: DimensionId;
  /** Clés de profil sur lesquelles la question apporte de l’information (ex. « interest:nature »). */
  informs: string[];
  /** Les questions d’un même sujet sont considérées comme partiellement redondantes. */
  topic: string;
  prompt: string;
  help?: string;
  options?: Option[];
  /** Options construites à partir des réponses précédentes (questions de précision). */
  buildOptions?: (ctx: QuestionContext) => Option[];
  /** Prompt dynamique (ex. nom d’un loisir). */
  buildPrompt?: (ctx: QuestionContext) => string;
  items?: MatrixItem[];
  maxSelect?: number;
  shuffle?: boolean;
  placeholder?: string;
  /** Durée moyenne de réponse estimée, en secondes. */
  seconds: number;
  mandatory?: boolean;
  /** Priorité de base (plus élevé = posé plus tôt à gain égal). */
  priority?: number;
  /** Contradictions que cette question aide à lever. */
  resolves?: string[];
  /** Condition de pertinence. Absente = toujours pertinente. */
  when?: (ctx: QuestionContext) => boolean;
  /** Explication affichée à l’utilisateur : pourquoi cette question maintenant. */
  why?: string;
}

export type Answer =
  | { kind: "skipped" }
  | { kind: "single"; value: string }
  | { kind: "multi"; values: string[] }
  | { kind: "matrix"; values: Partial<Record<ConstraintId, AversionLevel>> }
  | { kind: "text"; text: string };

export type Answers = Record<string, Answer>;

export interface EngineState {
  /** Ordre de pose des questions. */
  asked: string[];
  answers: Answers;
}

export interface NextQuestionResult {
  question: Question | null;
  /** Raison déterministe du choix, utile pour l’explicabilité et les tests. */
  reason: string;
  done: boolean;
  doneReason?: "couverture" | "budget-temps" | "plafond" | "epuise";
}
