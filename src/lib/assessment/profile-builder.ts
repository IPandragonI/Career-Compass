import type { Answer, Answers, AversionLevel, Effect, Option, Question, QuestionContext, TraitId } from "@/types/assessment";
import { AVERSION_LABEL, TRAIT_IDS } from "@/types/assessment";
import type {
  AversionState,
  Contradiction,
  EnvState,
  Evidence,
  InterestState,
  MotivationState,
  Onboarding,
  Profile,
  SkillState,
} from "@/types/profile";
import { TRAINING_MONTHS } from "@/types/profile";
import type { ConstraintId, EnvDimId, FamilyId, InterestId, MotivationId, SkillId } from "@/data/taxonomy";
import {
  CONSTRAINT_BY_ID,
  CONSTRAINT_IDS,
  ENV_IDS,
  INTEREST_BY_ID,
  INTEREST_IDS,
  MOTIVATION_IDS,
  SKILL_IDS,
} from "@/data/taxonomy";
import { EDUCATION_LEVELS, STUDY_FIELD_BY_ID } from "@/data/assessment/onboarding-options";
import { QUESTION_BY_ID } from "@/data/assessment";
import type { DimensionId } from "@/types/assessment";

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

interface Acc {
  interests: Record<InterestId, { raw: number; n: number; ev: Evidence[] }>;
  env: Record<EnvDimId, { obs: { v: number; w: number }[]; essential: boolean; ev: Evidence[] }>;
  motivations: Record<MotivationId, { raw: number; n: number; essential: boolean; ev: Evidence[] }>;
  skillsDemo: Record<SkillId, { raw: number; ev: Evidence[] }>;
  skillsSelf: Record<SkillId, { raw: number; ev: Evidence[] }>;
  aversionsExplicit: Partial<Record<ConstraintId, { level: AversionLevel; ev: Evidence[] }>>;
  aversionsImplicit: Partial<Record<ConstraintId, { levels: AversionLevel[]; ev: Evidence[] }>>;
  traits: Partial<Record<TraitId, number[]>>;
  families: Partial<Record<FamilyId, number>>;
  hobbies: string[];
  freeText: string[];
}

function emptyAcc(): Acc {
  const rec = <K extends string, V>(keys: readonly K[], f: () => V) =>
    Object.fromEntries(keys.map((k) => [k, f()])) as Record<K, V>;
  return {
    interests: rec(INTEREST_IDS, () => ({ raw: 0, n: 0, ev: [] as Evidence[] })),
    env: rec(ENV_IDS, () => ({ obs: [] as { v: number; w: number }[], essential: false, ev: [] as Evidence[] })),
    motivations: rec(MOTIVATION_IDS, () => ({ raw: 0, n: 0, essential: false, ev: [] as Evidence[] })),
    skillsDemo: rec(SKILL_IDS, () => ({ raw: 0, ev: [] as Evidence[] })),
    skillsSelf: rec(SKILL_IDS, () => ({ raw: 0, ev: [] as Evidence[] })),
    aversionsExplicit: {},
    aversionsImplicit: {},
    traits: {},
    families: {},
    hobbies: [],
    freeText: [],
  };
}

function applyEffect(acc: Acc, ef: Effect, qid: string, label: string, scale = 1, record = true) {
  const ev = (w: number): Evidence => ({ questionId: qid, label, w });
  switch (ef.k) {
    case "interest": {
      const a = acc.interests[ef.id];
      a.raw += ef.w * scale;
      a.n += 1;
      if (record && ef.w > 0 && scale > 0) a.ev.push(ev(ef.w * scale));
      break;
    }
    case "env": {
      const a = acc.env[ef.id];
      a.obs.push({ v: ef.v, w: (ef.w ?? 1) * scale });
      if (ef.essential) a.essential = true;
      if (record) a.ev.push(ev(ef.w ?? 1));
      break;
    }
    case "motivation": {
      const a = acc.motivations[ef.id];
      if (ef.essential) {
        a.essential = true;
        break; // l’indispensable ne s’ajoute pas au poids : il qualifie un choix déjà fait
      }
      a.raw += ef.w * scale;
      a.n += 1;
      if (record && ef.w > 0 && scale > 0) a.ev.push(ev(ef.w * scale));
      break;
    }
    case "skillDemo": {
      acc.skillsDemo[ef.id].raw += ef.w * scale;
      if (record && ef.w > 0) acc.skillsDemo[ef.id].ev.push(ev(ef.w));
      break;
    }
    case "skillSelf": {
      acc.skillsSelf[ef.id].raw += ef.w * scale;
      if (record && ef.w > 0) acc.skillsSelf[ef.id].ev.push(ev(ef.w));
      break;
    }
    case "aversion": {
      const cur = acc.aversionsImplicit[ef.id] ?? { levels: [], ev: [] };
      cur.levels.push(ef.level);
      if (ef.level > 0) cur.ev.push(ev(ef.level));
      acc.aversionsImplicit[ef.id] = cur;
      break;
    }
    case "trait": {
      (acc.traits[ef.id] ??= []).push(ef.v);
      break;
    }
    case "family": {
      acc.families[ef.id] = (acc.families[ef.id] ?? 0) + ef.w * scale;
      break;
    }
    case "hobby": {
      if (!acc.hobbies.includes(ef.text)) acc.hobbies.push(ef.text);
      break;
    }
  }
}

function resolveOptions(question: Question, ctx: QuestionContext): Option[] {
  if (question.buildOptions) return question.buildOptions(ctx);
  return question.options ?? [];
}

function applyAnswer(acc: Acc, question: Question, answer: Answer, ctx: QuestionContext) {
  switch (answer.kind) {
    case "skipped":
      return;
    case "single": {
      const o = resolveOptions(question, ctx).find((x) => x.id === answer.value);
      if (!o) return;
      for (const ef of o.effects) applyEffect(acc, ef, question.id, o.label);
      return;
    }
    case "multi": {
      const opts = resolveOptions(question, ctx);
      for (const v of answer.values) {
        const o = opts.find((x) => x.id === v);
        if (!o) continue;
        for (const ef of o.effects) applyEffect(acc, ef, question.id, o.label);
      }
      return;
    }
    case "matrix": {
      for (const [cid, level] of Object.entries(answer.values) as [ConstraintId, AversionLevel][]) {
        if (!(cid in CONSTRAINT_BY_ID)) continue;
        acc.aversionsExplicit[cid] = {
          level,
          ev: [{ questionId: question.id, label: `${CONSTRAINT_BY_ID[cid].label} : ${AVERSION_LABEL[level]}`, w: level }],
        };
      }
      return;
    }
    case "text": {
      const t = answer.text.trim();
      if (t) acc.freeText.push(t);
      return;
    }
  }
  // Comparaison forcée : les options non choisies reçoivent un léger contre-poids.
}

function applyForcedCounterweight(acc: Acc, question: Question, answer: Answer, ctx: QuestionContext) {
  if (question.kind !== "forced" || answer.kind !== "single") return;
  for (const o of resolveOptions(question, ctx)) {
    if (o.id === answer.value) continue;
    for (const ef of o.effects) {
      if (ef.k === "interest") applyEffect(acc, ef, question.id, o.label, -0.4, false);
      if (ef.k === "motivation" && !ef.essential) applyEffect(acc, ef, question.id, o.label, -0.3, false);
    }
  }
}

function applyOnboarding(acc: Acc, ob: Onboarding) {
  const qid = "onboarding";
  for (const t of ob.enjoyedTasks ?? []) {
    applyEffect(acc, { k: "interest", id: t, w: 2 }, qid, `Activité appréciée : ${INTEREST_BY_ID[t].label.toLowerCase()}`);
  }
  for (const t of ob.dislikedTasks ?? []) {
    applyEffect(acc, { k: "interest", id: t, w: -2 }, qid, `Activité peu appréciée : ${INTEREST_BY_ID[t].label.toLowerCase()}`, 1, false);
  }
  for (const s of ob.acquiredSkills ?? []) {
    applyEffect(acc, { k: "skillDemo", id: s, w: 2 }, qid, "Compétence acquise dans votre parcours");
  }
  if (ob.autonomy === "autonome") applyEffect(acc, { k: "motivation", id: "autonomie", w: 1.5 }, qid, "Grande autonomie souhaitée");
  if (ob.autonomy === "encadre") applyEffect(acc, { k: "motivation", id: "stabilite", w: 1 }, qid, "Cadre clair souhaité");
  if (ob.travelOk === "non") applyEffect(acc, { k: "aversion", id: "frequent-travel", level: 3 }, qid, "Pas de déplacements");
  if (ob.travelOk === "occasionnel") applyEffect(acc, { k: "aversion", id: "frequent-travel", level: 1 }, qid, "Déplacements occasionnels seulement");
  if (ob.stableRequired === "oui") applyEffect(acc, { k: "aversion", id: "unstable-employment", level: 3 }, qid, "Emploi stable indispensable");
  if (ob.seasonalOk === "oui") applyEffect(acc, { k: "trait", id: "seasonalOk", v: 0.9 }, qid, "");
  if (ob.seasonalOk === "non") applyEffect(acc, { k: "aversion", id: "unstable-employment", level: 2 }, qid, "Travail saisonnier ou temporaire refusé");
  if (ob.training === "aucune") applyEffect(acc, { k: "aversion", id: "long-training", level: 3 }, qid, "Aucune formation supplémentaire");
  else if (ob.training === "jours" || ob.training === "mois") applyEffect(acc, { k: "aversion", id: "long-training", level: 2 }, qid, "Formation courte seulement");
  else if (ob.training === "longue" || ob.training === "1-2ans") applyEffect(acc, { k: "trait", id: "retrain", v: 0.9 }, qid, "");
}

function weightedStats(obs: { v: number; w: number }[]) {
  const total = obs.reduce((s, o) => s + Math.max(o.w, 0), 0);
  if (total <= 0) return undefined;
  const mean = obs.reduce((s, o) => s + o.v * Math.max(o.w, 0), 0) / total;
  const variance = obs.reduce((s, o) => s + Math.max(o.w, 0) * (o.v - mean) ** 2, 0) / total;
  const values = obs.map((o) => o.v);
  return { mean, spread: Math.sqrt(variance), min: Math.min(...values), max: Math.max(...values) };
}

const avg = (xs: number[] | undefined) => (xs && xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : undefined);

/** Seuils de couverture suffisante, par dimension (utilisés par le moteur adaptatif). */
export const COVERAGE_TARGET: Record<DimensionId, number> = {
  interets: 0.7,
  environnement: 0.75,
  motivations: 0.8,
  competences: 0.75,
  quotidien: 0.66,
  transition: 0.7,
  loisirs: 0,
  aversions: 1,
};

export function buildProfile(onboarding: Onboarding, answers: Answers, asked?: string[]): Profile {
  const acc = emptyAcc();
  applyOnboarding(acc, onboarding);

  const order = (asked ?? Object.keys(answers)).filter((id) => id in answers);
  const dimCount: Record<DimensionId, number> = {
    interets: 0, environnement: 0, motivations: 0, competences: 0,
    quotidien: 0, transition: 0, loisirs: 0, aversions: 0,
  };
  let answeredCount = 0;
  let skippedCount = 0;

  // Profil partiel reconstruit au fil de l’eau pour les options dynamiques.
  const partial = () => finalize(acc, onboarding, dimCount, answeredCount, skippedCount, answers);
  for (const qid of order) {
    const question = QUESTION_BY_ID[qid];
    const answer = answers[qid];
    if (!question || !answer) continue;
    if (answer.kind === "skipped") {
      skippedCount++;
      continue;
    }
    answeredCount++;
    dimCount[question.dimension]++;
    const needsCtx = !!question.buildOptions;
    const ctx: QuestionContext = {
      onboarding,
      answers,
      asked: order,
      profile: needsCtx ? partial() : (undefined as never),
    };
    applyAnswer(acc, question, answer, ctx);
    applyForcedCounterweight(acc, question, answer, ctx);
  }
  return finalize(acc, onboarding, dimCount, answeredCount, skippedCount, answers);
}

function finalize(
  acc: Acc,
  ob: Onboarding,
  dimCount: Record<DimensionId, number>,
  answeredCount: number,
  skippedCount: number,
  answers: Answers,
): Profile {
  const interests = Object.fromEntries(
    INTEREST_IDS.map((id) => {
      const a = acc.interests[id];
      const st: InterestState = { raw: a.raw, norm: clamp(a.raw / 6, -1, 1), n: a.n, evidence: [...a.ev].sort((x, y) => y.w - x.w) };
      return [id, st];
    }),
  ) as Profile["interests"];

  const env = Object.fromEntries(
    ENV_IDS.map((id) => {
      const a = acc.env[id];
      const s = weightedStats(a.obs);
      const st: EnvState = {
        pref: s?.mean,
        spread: s?.spread ?? 0,
        min: s?.min,
        max: s?.max,
        n: a.obs.length,
        essential: a.essential,
        evidence: a.ev,
      };
      return [id, st];
    }),
  ) as Profile["env"];

  const motivations = Object.fromEntries(
    MOTIVATION_IDS.map((id) => {
      const a = acc.motivations[id];
      const st: MotivationState = { raw: a.raw, norm: clamp(a.raw / 5), n: a.n, essential: a.essential, evidence: [...a.ev].sort((x, y) => y.w - x.w) };
      return [id, st];
    }),
  ) as Profile["motivations"];

  const skills = Object.fromEntries(
    SKILL_IDS.map((id) => {
      const demo = clamp(acc.skillsDemo[id].raw / 4);
      const self = clamp(acc.skillsSelf[id].raw / 3.5);
      const status: SkillState["status"] = demo >= 0.4 ? "demonstrated" : self >= 0.4 ? "self-reported" : "uncertain";
      const st: SkillState = { demo, self, status, evidence: [...acc.skillsDemo[id].ev, ...acc.skillsSelf[id].ev] };
      return [id, st];
    }),
  ) as Profile["skills"];

  const aversions = Object.fromEntries(
    CONSTRAINT_IDS.map((id) => {
      const explicit = acc.aversionsExplicit[id];
      const implicit = acc.aversionsImplicit[id];
      let level: AversionLevel | undefined;
      if (explicit) level = explicit.level;
      else if (implicit && implicit.levels.length) level = Math.max(...implicit.levels) as AversionLevel;
      const st: AversionState = { level, evidence: explicit?.ev ?? implicit?.ev ?? [] };
      return [id, st];
    }),
  ) as Profile["aversions"];
  // Une clarification explicite (q-fu-aversion-clarify) prime sur la matrice.
  const clar = answers["q-fu-aversion-clarify"];
  if (clar && clar.kind === "single" && clar.value !== "none" && clar.value in aversions) {
    for (const id of CONSTRAINT_IDS) {
      const cur = aversions[id].level;
      if (cur === 3 && id !== clar.value) aversions[id] = { ...aversions[id], level: 2 };
    }
  } else if (clar && clar.kind === "single" && clar.value === "none") {
    for (const id of CONSTRAINT_IDS) {
      if (aversions[id].level === 3) aversions[id] = { ...aversions[id], level: 2 };
    }
  }

  const traits: Profile["traits"] = {};
  for (const t of TRAIT_IDS) {
    const v = avg(acc.traits[t]);
    if (v !== undefined) traits[t] = v;
  }

  const families: Profile["families"] = {};
  for (const [id, raw] of Object.entries(acc.families) as [FamilyId, number][]) families[id] = clamp(raw / 5);

  const level = EDUCATION_LEVELS.find((l) => l.id === ob.educationLevel);
  const field = ob.studyField ? STUDY_FIELD_BY_ID[ob.studyField] : undefined;
  const sectorIds = [...new Set([...(field?.sectorIds ?? []), ...(ob.experienceSectorIds ?? [])])];
  const familyIds = [...(field?.familyIds ?? [])];
  const hasBackground = sectorIds.length > 0 || !!ob.currentOccupation?.trim() || !!ob.previousOccupation?.trim();

  const rel = ob.fieldRelation ?? [];
  const wantsToLeaveField = rel.includes("changer-tout") || rel.includes("competences-autre-secteur");
  const wantsToStay = !wantsToLeaveField && (rel.includes("meme-domaine-autre-travail") || rel.includes("metier-voisin"));
  const retrain = traits.retrain;
  let maxTrainingMonths = ob.training ? TRAINING_MONTHS[ob.training] : null;
  if (maxTrainingMonths === null && retrain !== undefined) {
    maxTrainingMonths = retrain >= 0.85 ? 36 : retrain >= 0.6 ? 18 : retrain >= 0.3 ? 8 : 2;
  }

  const profile: Profile = {
    interests, env, motivations, skills, aversions, traits, families,
    hobbies: acc.hobbies,
    freeText: acc.freeText,
    education: { level: ob.educationLevel, levelRank: level?.rank, field: ob.studyField === "custom" ? ob.studyFieldCustom : field?.label },
    background: { sectorIds, familyIds, hasBackground },
    transition: {
      maxTrainingMonths,
      wantsToLeaveField,
      wantsToStay,
      exploreBroadly: rel.includes("explorer") || rel.length === 0,
      needIncome: ob.needIncomeDuringTraining === "oui",
      entryLevelOk: ob.entryLevelOk === "oui" ? true : ob.entryLevelOk === "non" ? false : null,
      stableRequired: ob.stableRequired === "oui" || (traits.stabilityNeed ?? 0) >= 0.85,
      seasonalOk: ob.seasonalOk === "oui" ? true : ob.seasonalOk === "non" ? false : traits.seasonalOk !== undefined ? traits.seasonalOk >= 0.6 : null,
      relocation: ob.relocation ?? (traits.relocation !== undefined ? (traits.relocation >= 0.8 ? "oui" : traits.relocation >= 0.3 ? "region" : "non") : undefined),
      salaryFloor: ob.salaryFloor,
      travelOk: ob.travelOk,
      licence: ob.licence,
    },
    contradictions: [],
    coverage: {} as Profile["coverage"],
    answeredCount,
    skippedCount,
  };
  profile.contradictions = detectContradictions(profile, answers);
  profile.coverage = computeCoverage(profile, dimCount, answers);
  return profile;
}

export function detectContradictions(p: Profile, answers: Answers): Contradiction[] {
  const out: Contradiction[] = [];
  const done = (qid: string) => !!answers[qid] && answers[qid]!.kind !== "skipped";
  const top = (id: InterestId, t = 0.4) => p.interests[id].norm >= t;
  const lvl = (id: ConstraintId) => p.aversions[id].level ?? 0;

  if ((top("numerique") || top("donnees") || top("analyse")) && p.env.deskWork.n > 0 && (p.env.deskWork.pref ?? 4) <= 1.2) {
    out.push({
      id: "c-desk-field",
      title: "Goût pour l’analyse ou le numérique, mais peu de bureau souhaité",
      description: "Ces activités se pratiquent souvent à l’écran. L’équilibre entre terrain et bureau mérite d’être précisé.",
      severity: "attention",
      resolved: done("q-fu-desk-field-balance"),
    });
  }
  if (p.motivations.stabilite.norm >= 0.5 && (p.motivations.variete.norm >= 0.5 || p.motivations.liberte.norm >= 0.5)) {
    out.push({
      id: "c-stab-var",
      title: "Besoin de stabilité et goût pour la variété",
      description: "Stabilité et variété peuvent coexister dans certains cadres, mais pas dans tous.",
      severity: "info",
      resolved: done("q-fu-stability-variety"),
    });
  }
  const trainingLong = p.transition.maxTrainingMonths !== null && p.transition.maxTrainingMonths >= 12;
  if (lvl("long-training") >= 2 && ((p.traits.retrain ?? 0) >= 0.6 || trainingLong)) {
    out.push({
      id: "c-training",
      title: "Réticence aux formations longues, mais ouverture à la reconversion",
      description: "Vos réponses sur la durée de formation ne vont pas toutes dans le même sens.",
      severity: "attention",
      resolved: done("q-fu-training-length"),
    });
  }
  if (top("aide", 0.5) && ((p.env.publicInteraction.pref ?? 4) <= 1 && p.env.publicInteraction.n > 0 || lvl("customer-contact") >= 2)) {
    out.push({
      id: "c-client",
      title: "Goût pour l’aide, mais contact avec le public peu souhaité",
      description: "Aider passe souvent par le contact. Il existe des formes de relation moins permanentes.",
      severity: "attention",
      resolved: done("q-fu-client-relation"),
    });
  }
  if ((p.env.fieldwork.pref ?? 0) >= 3 && p.env.fieldwork.n > 0 && ((p.env.physicalActivity.pref ?? 4) <= 1.5 && p.env.physicalActivity.n > 0 || lvl("heavy-physical") >= 2)) {
    out.push({
      id: "c-outdoor-physical",
      title: "Envie de terrain, mais peu d’effort physique",
      description: "Le travail extérieur est souvent physique ; certains métiers de terrain le sont peu.",
      severity: "attention",
      resolved: done("q-fu-outdoor-physical"),
    });
  }
  if (p.motivations.autonomie.norm >= 0.5 && lvl("works-alone") >= 2) {
    out.push({
      id: "c-autonomy-alone",
      title: "Autonomie recherchée, mais travailler seul·e déplaît",
      description: "L’autonomie n’exclut pas le collectif : on peut décider seul·e au sein d’une équipe.",
      severity: "info",
      resolved: false,
    });
  }
  return out;
}

function computeCoverage(p: Profile, dimCount: Record<DimensionId, number>, answers: Answers): Profile["coverage"] {
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const interets = mean(INTEREST_IDS.map((id) => Math.min(1, p.interests[id].n / 2)));
  const environnement = mean(ENV_IDS.map((id) => Math.min(1, p.env[id].n / 2)));
  const touched = MOTIVATION_IDS.filter((id) => p.motivations[id].n > 0).length;
  const totalN = MOTIVATION_IDS.reduce((s, id) => s + p.motivations[id].n, 0);
  const motivations = Math.min(1, touched / 8) * 0.6 + Math.min(1, totalN / 10) * 0.4;
  const skillTouched = SKILL_IDS.filter((id) => p.skills[id].demo > 0 || p.skills[id].self > 0 || p.skills[id].evidence.length > 0).length;
  const competences = Math.min(1, skillTouched / 10);
  const quotidien = Math.min(1, dimCount.quotidien / 3);
  const transition = Math.min(1, Object.keys(p.traits).length / 5);
  const hobbyA = answers["q-hobbies"];
  const loisirs = hobbyA ? 1 : 0;
  const mat = answers["q-aversions"];
  const aversions = mat ? (mat.kind === "matrix" ? 1 : 0.5) : 0;
  return { interets, environnement, motivations, competences, quotidien, transition, loisirs, aversions };
}
