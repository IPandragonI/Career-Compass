import type { Answer, Answers, DimensionId, EngineState, NextQuestionResult, Question, QuestionContext } from "@/types/assessment";
import type { Onboarding, Profile } from "@/types/profile";
import { QUESTION_BY_ID } from "@/data/assessment";
import { buildProfile, COVERAGE_TARGET } from "./profile-builder";
import { DEFAULT_CONFIG, elapsedEstimate, makeContext, selectNext, type SelectionConfig } from "./question-selection";

/** Moteur adaptatif pur (sans React) : toutes les transitions renvoient un nouvel état. */

export const emptyEngineState = (): EngineState => ({ asked: [], answers: {} });

export function nextQuestion(onboarding: Onboarding, state: EngineState, config: SelectionConfig = DEFAULT_CONFIG): NextQuestionResult {
  // La prochaine question ne tient compte que des questions déjà répondues ou sautées.
  const pendingFree = state.asked.filter((id) => !state.answers[id]);
  if (pendingFree.length) {
    const q = QUESTION_BY_ID[pendingFree[0]!];
    if (q) return { question: q, reason: q.why ?? "Question en attente.", done: false };
  }
  return selectNext(onboarding, state.asked, state.answers, config);
}

/** Enregistre une réponse (ou un saut) et renvoie le nouvel état. */
export function recordAnswer(state: EngineState, questionId: string, answer: Answer): EngineState {
  const asked = state.asked.includes(questionId) ? state.asked : [...state.asked, questionId];
  return { asked, answers: { ...state.answers, [questionId]: answer } };
}

/**
 * Après modification d’une réponse antérieure, retire les questions de précision qui ne
 * seraient plus posées avec les nouvelles réponses (les réponses principales sont conservées).
 */
export function reconcile(onboarding: Onboarding, state: EngineState): EngineState {
  const kept: string[] = [];
  const answers: Answers = {};
  for (const id of state.asked) {
    const q = QUESTION_BY_ID[id];
    if (!q) continue;
    if (q.tier === "followup" && q.when) {
      const ctx: QuestionContext = makeContext(onboarding, answers, kept, buildProfile(onboarding, answers, kept));
      if (!q.when(ctx)) continue;
    }
    kept.push(id);
    const a = state.answers[id];
    if (a) answers[id] = a;
  }
  return { asked: kept, answers };
}

export function changeAnswer(onboarding: Onboarding, state: EngineState, questionId: string, answer: Answer): EngineState {
  return reconcile(onboarding, recordAnswer(state, questionId, answer));
}

export function progressInfo(onboarding: Onboarding, state: EngineState, config: SelectionConfig = DEFAULT_CONFIG) {
  const profile = buildProfile(onboarding, state.answers, state.asked);
  const dims = Object.keys(COVERAGE_TARGET) as DimensionId[];
  const deficit = dims.reduce((s, d) => s + Math.max(0, COVERAGE_TARGET[d] - profile.coverage[d]), 0);
  const asked = state.asked.length;
  const remainingQ = Math.max(1, Math.min(config.maxQuestions - asked, Math.max(config.minQuestions - asked, Math.ceil(deficit / 0.1))));
  const remainingMin = Math.max(1, Math.round((remainingQ * 28) / 60));
  const elapsedMin = Math.round(elapsedEstimate(state.asked, state.answers) / 60);
  return { profile, remainingQuestions: remainingQ, remainingMinutes: remainingMin, elapsedMinutes: elapsedMin, coverage: profile.coverage };
}

export function questionOptions(q: Question, ctx: QuestionContext) {
  return q.buildOptions ? q.buildOptions(ctx) : (q.options ?? []);
}

export function questionPrompt(q: Question, ctx: QuestionContext): string {
  return q.buildPrompt ? q.buildPrompt(ctx) : q.prompt;
}

export type { Profile };
