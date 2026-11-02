import type { Answer, EngineState } from "@/types/assessment";
import type { Onboarding } from "@/types/profile";
import { QUESTIONNAIRE_VERSION, QUESTION_BY_ID } from "@/data/assessment";

/** Version du format de stockage. À incrémenter à chaque changement de structure. */
export const SCHEMA_VERSION = 2;

export type Phase = "accueil" | "questions" | "revue" | "termine";

export interface StoredResultsMeta {
  generatedAt: string;
  answersHash: string;
  occupationIds: string[];
  directionIds: string[];
}

export interface StoredSession {
  schemaVersion: number;
  questionnaireVersion: number;
  onboarding: Onboarding;
  engine: EngineState;
  phase: Phase;
  onboardingStep: number;
  startedAt: string;
  updatedAt: string;
  results?: StoredResultsMeta;
  /** Résultats du bilan précédent, pour comparer ce qui change quand on modifie ses réponses. */
  previousResults?: StoredResultsMeta;
  /** Retours locaux de la personne sur les pistes (jamais transmis) : 1 = me parle, -1 = ne me parle pas. */
  feedback?: Record<string, 1 | -1>;
}

export const newSession = (now = new Date().toISOString()): StoredSession => ({
  schemaVersion: SCHEMA_VERSION,
  questionnaireVersion: QUESTIONNAIRE_VERSION,
  onboarding: {},
  engine: { asked: [], answers: {} },
  phase: "accueil",
  onboardingStep: 0,
  startedAt: now,
  updatedAt: now,
});

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);

function sanitizeAnswer(a: unknown): Answer | null {
  if (!isObj(a)) return null;
  switch (a.kind) {
    case "skipped":
      return { kind: "skipped" };
    case "single":
      return typeof a.value === "string" ? { kind: "single", value: a.value } : null;
    case "multi":
      return Array.isArray(a.values) && a.values.every((v) => typeof v === "string")
        ? { kind: "multi", values: a.values as string[] }
        : null;
    case "text":
      return typeof a.text === "string" ? { kind: "text", text: a.text.slice(0, 600) } : null;
    case "matrix": {
      if (!isObj(a.values)) return null;
      const values: Record<string, 0 | 1 | 2 | 3> = {};
      for (const [k, v] of Object.entries(a.values)) if (v === 0 || v === 1 || v === 2 || v === 3) values[k] = v;
      return { kind: "matrix", values };
    }
    default:
      return null;
  }
}

function sanitizeEngine(raw: unknown): EngineState {
  const out: EngineState = { asked: [], answers: {} };
  if (!isObj(raw)) return out;
  const answers = isObj(raw.answers) ? raw.answers : {};
  const asked = Array.isArray(raw.asked) ? raw.asked : [];
  for (const id of asked) {
    if (typeof id !== "string" || !QUESTION_BY_ID[id] || out.asked.includes(id)) continue; // questions disparues : ignorées
    out.asked.push(id);
    const a = sanitizeAnswer(answers[id]);
    if (a) out.answers[id] = a;
  }
  return out;
}

/**
 * Migre et valide une session lue du stockage. Renvoie `null` si elle est inutilisable
 * (JSON invalide, version future inconnue) — l’appelant repart alors d’une session vide.
 */
export function migrateSession(raw: unknown): StoredSession | null {
  if (!isObj(raw)) return null;
  const version = typeof raw.schemaVersion === "number" ? raw.schemaVersion : 0;
  if (version > SCHEMA_VERSION) return null;
  const base = newSession();
  const phaseOk = (p: unknown): p is Phase => p === "accueil" || p === "questions" || p === "revue" || p === "termine";
  const session: StoredSession = {
    ...base,
    onboarding: isObj(raw.onboarding) ? (raw.onboarding as Onboarding) : {},
    engine: sanitizeEngine(raw.engine ?? { asked: raw.asked, answers: raw.answers }),
    phase: phaseOk(raw.phase) ? raw.phase : "accueil",
    onboardingStep: typeof raw.onboardingStep === "number" ? raw.onboardingStep : 0,
    startedAt: typeof raw.startedAt === "string" ? raw.startedAt : base.startedAt,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
  };
  // v0/v1 : pas de champ onboardingStep ; une session en cours reprend à l’étape 0.
  if (typeof raw.questionnaireVersion === "number" && raw.questionnaireVersion !== QUESTIONNAIRE_VERSION) {
    // Questionnaire modifié de façon incompatible : on conserve l’accueil, on repart des questions.
    session.engine = { asked: [], answers: {} };
    if (session.phase === "revue" || session.phase === "termine") session.phase = "questions";
  }
  const meta = (r: unknown): StoredResultsMeta | undefined => {
    if (!isObj(r) || typeof r.generatedAt !== "string" || typeof r.answersHash !== "string") return undefined;
    return {
      generatedAt: r.generatedAt,
      answersHash: r.answersHash,
      occupationIds: Array.isArray(r.occupationIds) ? (r.occupationIds as unknown[]).filter((x): x is string => typeof x === "string") : [],
      directionIds: Array.isArray(r.directionIds) ? (r.directionIds as unknown[]).filter((x): x is string => typeof x === "string") : [],
    };
  };
  session.results = meta(raw.results);
  session.previousResults = meta(raw.previousResults);
  if (isObj(raw.feedback)) {
    const fb: Record<string, 1 | -1> = {};
    for (const [k, v] of Object.entries(raw.feedback)) if (v === 1 || v === -1) fb[k] = v;
    session.feedback = fb;
  }
  return session;
}
