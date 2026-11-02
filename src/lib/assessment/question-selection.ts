import type { Answers, DimensionId, NextQuestionResult, Question, QuestionContext } from "@/types/assessment";
import type { Onboarding, Profile } from "@/types/profile";
import { ALL_QUESTIONS, QUESTION_BY_ID } from "@/data/assessment";
import { CONSTRAINT_BY_ID, ENV_BY_ID, INTEREST_BY_ID, MOTIVATION_BY_ID, SKILL_BY_ID, FAMILY_BY_ID } from "@/data/taxonomy";
import { buildProfile, COVERAGE_TARGET } from "./profile-builder";

export interface SelectionConfig {
  /** Nombre minimal de questions avant d’envisager l’arrêt par couverture. */
  minQuestions: number;
  /** Plafond de questions posées (principales + précisions). */
  maxQuestions: number;
  /** Budget de temps estimé, en secondes. */
  timeBudgetSec: number;
  /** Gain minimal en dessous duquel une question n’apporte plus rien d’utile. */
  gainEpsilon: number;
  /** Nombre de réponses avant d’autoriser les questions de précision. */
  followupAfter: number;
}

export const DEFAULT_CONFIG: SelectionConfig = {
  minQuestions: 26,
  maxQuestions: 46,
  timeBudgetSec: 24 * 60,
  gainEpsilon: 0.45,
  followupAfter: 7,
};

export function makeContext(onboarding: Onboarding, answers: Answers, asked: string[], profile?: Profile): QuestionContext {
  return { onboarding, answers, asked, profile: profile ?? buildProfile(onboarding, answers, asked) };
}

/** Libellé lisible d’une clé de profil (ex. « interest:nature »). */
const TRAIT_LABEL: Record<string, string> = {
  retrain: "votre ouverture à la formation",
  lowerPay: "votre rapport à une baisse de revenu",
  stabilityNeed: "votre besoin de stabilité",
  seasonalOk: "votre rapport aux contrats courts",
  selfEmployed: "votre attrait pour l’indépendance",
  uncertaintyOk: "votre aisance face à l’imprévu",
  responsibilityOk: "votre rapport aux responsabilités",
  relocation: "votre mobilité géographique",
};

export function keyLabel(key: string): string {
  const [kind, id = ""] = key.split(":");
  if (kind === "trait") return TRAIT_LABEL[id] ?? "votre rapport au changement";
  if (kind === "hobby") return "ce qui vous plaît en dehors du travail";
  const table: Record<string, Record<string, { label: string }>> = {
    interest: INTEREST_BY_ID,
    env: ENV_BY_ID,
    motivation: MOTIVATION_BY_ID,
    skill: SKILL_BY_ID,
    aversion: CONSTRAINT_BY_ID,
    family: FAMILY_BY_ID,
  };
  return table[kind ?? ""]?.[id]?.label ?? key;
}

/** Besoin d’information (0–1) pour une clé : 1 = aucune donnée, 0 = bien documentée. */
function need(key: string, p: Profile, answers: Answers): number {
  const [kind, id = ""] = key.split(":");
  switch (kind) {
    case "interest": {
      const s = p.interests[id as keyof Profile["interests"]];
      return s ? Math.max(0, 1 - s.n / 2) : 0;
    }
    case "env": {
      const s = p.env[id as keyof Profile["env"]];
      return s ? Math.max(0, 1 - s.n / 2) : 0;
    }
    case "motivation": {
      const s = p.motivations[id as keyof Profile["motivations"]];
      return s ? 0.5 * Math.max(0, 1 - s.n) : 0;
    }
    case "skill": {
      const s = p.skills[id as keyof Profile["skills"]];
      return s ? (s.evidence.length === 0 ? 0.55 : s.status === "uncertain" ? 0.3 : 0.08) : 0;
    }
    case "aversion": {
      const s = p.aversions[id as keyof Profile["aversions"]];
      return s && s.level === undefined ? 0.45 : 0;
    }
    case "trait":
      return p.traits[id as keyof Profile["traits"]] === undefined ? 0.9 : 0;
    case "family":
      return p.families[id as keyof Profile["families"]] === undefined ? 0.2 : 0.05;
    case "hobby":
      return answers["q-hobbies"] ? 0 : 0.5;
    default:
      return 0;
  }
}

export interface QuestionScore {
  question: Question;
  gain: number;
  topKeys: string[];
}

export function scoreQuestion(q: Question, ctx: QuestionContext, config: SelectionConfig): QuestionScore {
  const p = ctx.profile;
  const needs = q.informs
    .map((k) => ({ k, n: need(k, p, ctx.answers) }))
    .sort((a, b) => b.n - a.n);
  let gain = needs.slice(0, 8).reduce((s, x) => s + x.n, 0);

  // Contradiction à lever : forte valeur d’information.
  const unresolved = p.contradictions.filter((c) => !c.resolved).map((c) => c.id);
  const resolvesActive = (q.resolves ?? []).filter((id) => unresolved.includes(id)).length;
  gain += resolvesActive * 2.5;

  // Question de précision pertinente : on la préfère à une question générique redondante.
  if (q.tier === "followup" && (q.resolves?.length ? resolvesActive > 0 : true)) gain += 1.4;

  gain += (q.priority ?? 0) * 0.3;

  // Redondance : même sujet déjà abordé.
  const sameTopic = ctx.asked.filter((id) => QUESTION_BY_ID[id]?.topic === q.topic).length;
  gain *= Math.pow(0.55, sameTopic);

  // Variété : éviter d’enchaîner la même dimension.
  const recent = ctx.asked.slice(-2).filter((id) => QUESTION_BY_ID[id]?.dimension === q.dimension).length;
  gain *= Math.pow(0.88, recent);

  // Question obligatoire : sa priorité monte au fil du questionnaire.
  if (q.mandatory) gain += Math.max(0, ctx.asked.length - 14) * 0.6;

  // Prise en compte du temps : à gain égal, une question courte est préférée.
  gain /= Math.sqrt(q.seconds / 25);

  return { question: q, gain, topKeys: needs.filter((x) => x.n > 0).slice(0, 3).map((x) => x.k) };
}

export function elapsedEstimate(asked: string[], answers: Answers): number {
  return asked.reduce((s, id) => {
    const a = answers[id];
    const q = QUESTION_BY_ID[id];
    if (!q) return s;
    return s + (a && a.kind === "skipped" ? 5 : q.seconds);
  }, 0);
}

export function dimensionsSatisfied(p: Profile): boolean {
  return (Object.keys(COVERAGE_TARGET) as DimensionId[]).every((d) => p.coverage[d] >= COVERAGE_TARGET[d]);
}

export function mandatoryDone(answers: Answers): boolean {
  return ALL_QUESTIONS.filter((q) => q.mandatory).every((q) => !!answers[q.id]);
}

/** Choisit la prochaine question de façon déterministe et explicable. */
export function selectNext(
  onboarding: Onboarding,
  asked: string[],
  answers: Answers,
  config: SelectionConfig = DEFAULT_CONFIG,
): NextQuestionResult {
  const ctx = makeContext(onboarding, answers, asked);
  const elapsed = elapsedEstimate(asked, answers);
  const mand = mandatoryDone(answers);

  if (asked.length >= config.maxQuestions && mand) return { question: null, reason: "Plafond de questions atteint.", done: true, doneReason: "plafond" };
  if (elapsed >= config.timeBudgetSec && mand && asked.length >= config.minQuestions - 6) {
    return { question: null, reason: "Budget de temps atteint.", done: true, doneReason: "budget-temps" };
  }

  const candidates = ALL_QUESTIONS.filter((q) => {
    if (asked.includes(q.id)) return false;
    if (q.tier === "followup" && asked.length < config.followupAfter) return false;
    if (q.when && !q.when(ctx)) return false;
    if (q.buildOptions && q.buildOptions(ctx).length === 0) return false;
    return true;
  });

  if (candidates.length === 0) return { question: null, reason: "Plus aucune question pertinente.", done: true, doneReason: "epuise" };

  const scored = candidates
    .map((q, idx) => ({ ...scoreQuestion(q, ctx, config), idx }))
    .sort((a, b) => b.gain - a.gain || a.idx - b.idx);
  const best = scored[0]!;

  if (mand && asked.length >= config.minQuestions && dimensionsSatisfied(ctx.profile) && best.gain < config.gainEpsilon * 4) {
    return { question: null, reason: "Les dimensions essentielles sont suffisamment documentées.", done: true, doneReason: "couverture" };
  }
  if (mand && asked.length >= config.minQuestions && best.gain < config.gainEpsilon) {
    return { question: null, reason: "Les questions restantes apporteraient peu d’information nouvelle.", done: true, doneReason: "couverture" };
  }

  const why = best.topKeys.length
    ? `Cette question précise : ${best.topKeys.map(keyLabel).map((s) => s.toLowerCase()).join(", ")}.`
    : "Cette question complète votre profil.";
  return { question: best.question, reason: best.question.why ?? why, done: false };
}
