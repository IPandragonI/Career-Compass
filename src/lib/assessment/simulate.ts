import type { Answer, AversionLevel, EngineState, Effect, Option } from "@/types/assessment";
import type { Onboarding } from "@/types/profile";
import type { ConstraintId } from "@/data/taxonomy";
import { emptyEngineState, nextQuestion, questionOptions, recordAnswer } from "./adaptive-engine";
import { makeContext } from "./question-selection";
import { buildProfile } from "./profile-builder";

/**
 * Simulation d’un parcours complet par une « personne synthétique » (tests, validation).
 * `likes` : poids d’affinité par clé (« interest:nature », « motivation:autonomie », …).
 * `envTarget` : valeur de conditions de travail visée (0–4) par dimension.
 */
export interface Persona {
  name: string;
  onboarding: Onboarding;
  likes: Record<string, number>;
  envTarget?: Partial<Record<string, number>>;
  aversions?: Partial<Record<ConstraintId, AversionLevel>>;
  skipRate?: number;
}

function effectAffinity(ef: Effect, persona: Persona): number {
  switch (ef.k) {
    case "interest":
      return (persona.likes[`interest:${ef.id}`] ?? 0) * Math.sign(ef.w) * Math.min(Math.abs(ef.w), 3);
    case "motivation":
      return (persona.likes[`motivation:${ef.id}`] ?? 0) * ef.w;
    case "family":
      return (persona.likes[`family:${ef.id}`] ?? 0) * ef.w;
    case "skillSelf":
    case "skillDemo":
      return (persona.likes[`skill:${ef.id}`] ?? 0) * ef.w * 0.5;
    case "env": {
      const t = persona.envTarget?.[ef.id];
      return t === undefined ? 0 : (2 - Math.abs(t - ef.v)) * (ef.w ?? 1) * 0.8;
    }
    case "aversion": {
      const a = persona.aversions?.[ef.id];
      return a === undefined ? 0 : -Math.abs(a - ef.level) + 1;
    }
    case "trait":
      return (persona.likes[`trait:${ef.id}`] ?? 0) * (ef.v - 0.5) * 2;
    default:
      return 0;
  }
}

const optScore = (o: Option, persona: Persona) => o.effects.reduce((s, ef) => s + effectAffinity(ef, persona), 0);

export function personaAnswer(
  persona: Persona,
  kind: string,
  options: Option[],
  maxSelect: number | undefined,
  items?: { id: ConstraintId }[],
): Answer {
  if (kind === "matrix") {
    const values: Partial<Record<ConstraintId, AversionLevel>> = {};
    for (const it of items ?? []) values[it.id] = persona.aversions?.[it.id] ?? 0;
    return { kind: "matrix", values };
  }
  if (kind === "text") return { kind: "text", text: "" };
  const ranked = [...options].sort((a, b) => optScore(b, persona) - optScore(a, persona));
  if (kind === "multi") {
    const picks = ranked.filter((o) => !o.exclusive && optScore(o, persona) > 0).slice(0, maxSelect ?? 3);
    if (!picks.length) {
      const none = options.find((o) => o.exclusive);
      return none ? { kind: "multi", values: [none.id] } : { kind: "multi", values: ranked.slice(0, 1).map((o) => o.id) };
    }
    return { kind: "multi", values: picks.map((o) => o.id) };
  }
  return { kind: "single", value: ranked[0]!.id };
}

export interface SimulationResult {
  state: EngineState;
  questionsAsked: number;
  estimatedSeconds: number;
  doneReason?: string;
}

export function simulate(persona: Persona, maxSteps = 80): SimulationResult {
  let state = emptyEngineState();
  let seconds = 0;
  let doneReason: string | undefined;
  let skipCounter = 0;
  for (let i = 0; i < maxSteps; i++) {
    const next = nextQuestion(persona.onboarding, state);
    if (next.done || !next.question) {
      doneReason = next.doneReason;
      break;
    }
    const q = next.question;
    const profile = buildProfile(persona.onboarding, state.answers, state.asked);
    const ctx = makeContext(persona.onboarding, state.answers, state.asked, profile);
    const options = questionOptions(q, ctx);
    skipCounter += persona.skipRate ?? 0;
    let ans: Answer;
    if (skipCounter >= 1 && !q.mandatory) {
      skipCounter -= 1;
      ans = { kind: "skipped" };
    } else ans = personaAnswer(persona, q.kind, options, q.maxSelect, q.items);
    seconds += ans.kind === "skipped" ? 5 : q.seconds;
    state = recordAnswer(state, q.id, ans);
  }
  return { state, questionsAsked: state.asked.length, estimatedSeconds: seconds, doneReason };
}
