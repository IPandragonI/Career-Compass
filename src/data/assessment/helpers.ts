import type {
  AversionLevel,
  Effect,
  Option,
  Question,
  TraitId,
} from "@/types/assessment";
import type {
  ConstraintId,
  EnvDimId,
  FamilyId,
  InterestId,
  MotivationId,
  SkillId,
} from "@/data/taxonomy";

/* Constructeurs d’effets : écriture compacte pour le contenu du questionnaire. */
export const i = (id: InterestId, w = 2): Effect => ({ k: "interest", id, w });
export const e = (id: EnvDimId, v: number, w = 1, essential = false): Effect => ({
  k: "env",
  id,
  v,
  w,
  essential,
});
export const m = (id: MotivationId, w = 2, essential = false): Effect => ({
  k: "motivation",
  id,
  w,
  essential,
});
export const ss = (id: SkillId, w = 1.5): Effect => ({ k: "skillSelf", id, w });
export const sd = (id: SkillId, w = 2): Effect => ({ k: "skillDemo", id, w });
export const av = (id: ConstraintId, level: AversionLevel): Effect => ({
  k: "aversion",
  id,
  level,
});
export const tr = (id: TraitId, v: number): Effect => ({ k: "trait", id, v });
export const fam = (id: FamilyId, w = 2): Effect => ({ k: "family", id, w });
export const hobby = (text: string): Effect => ({ k: "hobby", text });

export function opt(id: string, label: string, effects: Effect[], extra: Partial<Option> = {}): Option {
  return { id, label, effects, ...extra };
}

function effectKey(ef: Effect): string | null {
  switch (ef.k) {
    case "interest":
      return `interest:${ef.id}`;
    case "env":
      return `env:${ef.id}`;
    case "motivation":
      return `motivation:${ef.id}`;
    case "skillSelf":
    case "skillDemo":
      return `skill:${ef.id}`;
    case "aversion":
      return `aversion:${ef.id}`;
    case "trait":
      return `trait:${ef.id}`;
    case "family":
      return `family:${ef.id}`;
    case "hobby":
      return "hobby";
  }
}

/** Calcule la liste des clés de profil qu’une question peut éclairer, à partir de ses options. */
export function informsFromOptions(options: Option[] | undefined): string[] {
  const keys = new Set<string>();
  for (const o of options ?? []) for (const ef of o.effects) {
    const k = effectKey(ef);
    if (k) keys.add(k);
  }
  return [...keys];
}

type QInput = Omit<Question, "informs" | "tier" | "seconds"> & {
  informs?: string[];
  seconds?: number;
  tier?: Question["tier"];
};

const DEFAULT_SECONDS: Record<Question["kind"], number> = {
  single: 25,
  multi: 35,
  forced: 15,
  scale: 18,
  matrix: 70,
  text: 40,
};

/** Fabrique une question en dérivant les clés `informs` et la durée estimée. */
export function q(input: QInput): Question {
  const informs = input.informs ?? informsFromOptions(input.options);
  return {
    ...input,
    tier: input.tier ?? "core",
    seconds: input.seconds ?? DEFAULT_SECONDS[input.kind],
    informs,
  };
}

export function followup(input: QInput): Question {
  return q({ ...input, tier: "followup" });
}
