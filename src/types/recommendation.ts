import type { FamilyId, SkillId } from "@/data/taxonomy";

export type TransitionCategory = "proche" | "adjacent" | "nouvelle" | "ambitieuse";

export const CATEGORY_LABEL: Record<TransitionCategory, string> = {
  proche: "Piste proche",
  adjacent: "Transition adjacente",
  nouvelle: "Nouvelle direction",
  ambitieuse: "Option exploratoire",
};

export const CATEGORY_DESC: Record<TransitionCategory, string> = {
  proche: "Réutilise une grande partie de vos compétences et de votre parcours.",
  adjacent: "Réutilise une partie de vos acquis mais change d’activité, de responsabilités ou de secteur.",
  nouvelle: "Très différente de votre parcours, mais cohérente avec vos intérêts et motivations.",
  ambitieuse: "Attrayante, mais demande une formation importante ou un changement notable : à investiguer.",
};

export type ScoreDimensionId = "interest" | "environment" | "motivation" | "skills" | "accessibility" | "constraints";

export interface DimensionScore {
  id: ScoreDimensionId;
  label: string;
  /** 0–1, avant retrait de la neutralité. */
  score: number;
  /** 0–1 : quantité d’information réellement disponible pour cette dimension. */
  confidence: number;
  /** Contribution pondérée au score global. */
  weighted: number;
}

export type FitLabel = "Piste particulièrement intéressante" | "Piste à explorer" | "Piste possible sous certaines conditions";

export interface ReasonEvidence {
  questionId: string;
  label: string;
}

export interface Reason {
  kind: "interest" | "environment" | "motivation" | "skills" | "training" | "context";
  text: string;
  evidence: ReasonEvidence[];
}

export interface Warning {
  severity: "info" | "attention" | "forte";
  text: string;
}

export interface Recommendation {
  occupationId: string;
  composite: number;
  dimensions: DimensionScore[];
  fit: FitLabel;
  category: TransitionCategory;
  categoryReason: string;
  reasons: Reason[];
  transferableSkills: SkillId[];
  warnings: Warning[];
  unknowns: string[];
  toInvestigate: string[];
  /** Fiabilité des données et des réponses utilisées pour cette piste. */
  evidenceConfidence: "faible" | "moyenne" | "bonne";
  excluded: boolean;
  excludedReason?: string;
}

export interface RealityCheck {
  attractive: string[];
  disappointing: string[];
  unknowns: string[];
  constraints: string[];
  questions: string[];
}

export interface CareerDirection {
  familyId: FamilyId;
  title: string;
  why: Reason[];
  activities: string[];
  sectorIds: string[];
  occupationIds: string[];
  advantages: string[];
  drawbacks: string[];
  training: string;
  reality: RealityCheck;
  score: number;
}

export interface NextStep {
  id: string;
  title: string;
  detail: string;
  href?: string;
  external?: boolean;
}

export interface ProfileSummary {
  topInterests: { id: string; label: string; level: "fort" | "moyen" }[];
  environment: { id: string; label: string; text: string }[];
  motivations: { id: string; label: string; essential: boolean }[];
  skills: { id: string; label: string; status: "demonstrated" | "self-reported" | "uncertain" }[];
  dealBreakers: { id: string; label: string; level: number }[];
  constraints: string[];
  uncertainties: string[];
  contradictions: { id: string; title: string; description: string }[];
}

export interface Results {
  generatedAt: string;
  recommendations: Recommendation[];
  directions: CareerDirection[];
  discoveries: Recommendation[];
  excludedCount: number;
  nextSteps: NextStep[];
  summary: ProfileSummary;
  notes: string[];
}
