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
    case "skipped": return { kind: "skipped" };
    case "single": return typeof a.value === "string" ? { kind: "single", value: a.value } : null;
    case "multi": return Array.isArray(a.values) && a.values.every((v) => typeof v === "string") ? { kind: "multi", values: a.values as string[] } : null;
    case "text": return typeof a.text === "string" ? { kind: "text", text: a.text.slice(0, 600) } : null;
    case "matrix": {
      if (!isObj(a.values)) return null;
      const values: Record<string, 0 | 1 | 2 | 3> = {};
      for (const [k, v] of Object.entries(a.values)) if (v === 0 || v === 1 || v === 2 || v === 3) values[k] = v;
      return { kind: "matrix", values };
    }
    default: return null;
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
  if (isObj(raw.results) && typeof raw.results.generatedAt === "string" && typeof raw.results.answersHash === "string") {
    session.results = {
      generatedAt: raw.results.generatedAt,
      answersHash: raw.results.answersHash,
      occupationIds: Array.isArray(raw.results.occupationIds) ? (raw.results.occupationIds as string[]) : [],
      directionIds: Array.isArray(raw.results.directionIds) ? (raw.results.directionIds as string[]) : [],
    };
  }
  return session;
}
