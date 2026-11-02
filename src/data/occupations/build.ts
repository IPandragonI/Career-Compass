import type { Confidence, ConstraintMap, EntryLevel, Occupation, Scale, WorkEnvironment } from "@/types/occupation";
import type { ConstraintId, FamilyId, InterestId, MotivationId, SkillId } from "@/data/taxonomy";
import { ENV_IDS } from "@/data/taxonomy";

/**
 * Format compact d’écriture des fiches métiers (voir README, section « Format des données »).
 * L’ordre des chiffres de `env` suit ENV_IDS :
 * terrain, bureau, effort physique, équipe, public, déplacements, routine, technique, analyse.
 * « ? » = inconnu (jamais assimilé à 0).
 */
const LEVELS: Record<string, EntryLevel> = {
  aucun: "aucun",
  cap: "cap-bep",
  bac: "bac",
  bac2: "bac+2",
  bac3: "bac+3",
  bac5: "bac+5",
  doc: "doctorat",
};

export interface OccInput {
  id: string;
  name: string;
  fam: FamilyId;
  /** Secteurs séparés par des espaces. */
  sec: string;
  /** Domaine ROME (lettre). */
  rome: string;
  desc: string;
  /** Tâches séparées par « | ». */
  tasks: string;
  /** « nature:3 donnees:2 » */
  int: string;
  sk: string;
  env: string;
  mot: string;
  lvl: keyof typeof LEVELS;
  /** Niveau minimal si différent du niveau typique. */
  min?: keyof typeof LEVELS;
  /** Durée de formation depuis zéro, en mois (estimation). */
  mo: number | null;
  /** Voies de formation séparées par « | ». */
  routes: string;
  /** Prérequis ou remarques séparés par « | ». */
  pre?: string;
  /** Alternance possible : 1, 0 ou ? */
  wk?: "1" | "0" | "?";
  /** Postes débutants accessibles : 1, 0 ou ? */
  entry?: "1" | "0" | "?";
  /** Contraintes : « night-shifts ~repetitive !sales-targets ». */
  con?: string;
  earn?: 1 | 2 | 3;
  stab?: 1 | 2 | 3;
  /** Évolutions séparées par « | ». */
  career?: string;
  dd?: string;
  alias?: string;
  conf?: Confidence;
}

const split = (s: string | undefined, sep: string) =>
  s
    ? s
        .split(sep)
        .map((x) => x.trim())
        .filter(Boolean)
    : [];

export function o(x: OccInput): Occupation {
  const envVals = x.env.trim().split(/\s+/);
  const workEnvironment = Object.fromEntries(
    ENV_IDS.map((id, idx) => {
      const v = envVals[idx];
      return [id, v === undefined || v === "?" ? null : (Number(v) as Scale)];
    }),
  ) as WorkEnvironment;

  const interestTags: Occupation["interestTags"] = {};
  for (const t of split(x.int, " ")) {
    const [k, w] = t.split(":");
    interestTags[k as InterestId] = Number(w) as 1 | 2 | 3;
  }

  const constraints: ConstraintMap = {};
  for (const t of split(x.con, " ")) {
    if (t.startsWith("!")) constraints[t.slice(1) as ConstraintId] = "no";
    else if (t.startsWith("~")) constraints[t.slice(1) as ConstraintId] = "sometimes";
    else constraints[t as ConstraintId] = "yes";
  }

  const tri = (v: string | undefined) => (v === "1" ? true : v === "0" ? false : null);

  return {
    id: x.id,
    name: x.name,
    aliases: split(x.alias, "|"),
    familyId: x.fam,
    sectorIds: split(x.sec, " "),
    subsectorIds: [],
    romeDomain: x.rome,
    description: x.desc,
    dailyTasks: split(x.tasks, "|"),
    interestTags,
    skillTags: split(x.sk, " ") as SkillId[],
    workEnvironment,
    motivationTags: split(x.mot, " ") as MotivationId[],
    constraints,
    training: {
      typicalLevel: LEVELS[x.lvl]!,
      minLevel: LEVELS[x.min ?? x.lvl]!,
      months: x.mo,
      routes: split(x.routes, "|"),
      prerequisites: split(x.pre, "|"),
      notes: [],
      workStudyPossible: tri(x.wk),
      entryRoles: tri(x.entry),
    },
    careerPaths: split(x.career, "|"),
    relatedOccupationIds: [],
    dedupeGroup: x.dd ?? null,
    earnings: x.earn ?? null,
    stability: x.stab ?? null,
    sourceReferences: [
      { sourceId: "rome", note: `Domaine ROME ${x.rome} (repère éditorial, à vérifier)` },
      {
        sourceId: "onisep",
        note: "Rechercher ce métier sur l’Onisep",
        url: `https://www.onisep.fr/recherche?context=metier&text=${encodeURIComponent(x.name)}`,
      },
      { sourceId: "editorial" },
    ],
    provenance: {
      classification: "editorial",
      description: "editorial",
      environment: "estimated",
      training: "estimated",
      constraints: "estimated",
    },
    lastVerifiedAt: null,
    confidence: x.conf ?? "moyenne",
  };
}
