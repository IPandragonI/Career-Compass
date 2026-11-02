import type { Question } from "@/types/assessment";
import { QUESTIONS_CORE } from "./questions-core";
import { QUESTIONS_FOLLOWUP } from "./questions-followup";

export const ALL_QUESTIONS: Question[] = [...QUESTIONS_CORE, ...QUESTIONS_FOLLOWUP];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  ALL_QUESTIONS.map((x) => [x.id, x]),
);

/**
 * Version du questionnaire : à incrémenter quand l’interprétation des réponses change
 * de façon incompatible (voir lib/storage/migrations.ts).
 */
export const QUESTIONNAIRE_VERSION = 1;
