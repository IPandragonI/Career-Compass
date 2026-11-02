import type { Occupation } from "@/types/occupation";
import { ENTRY_LEVEL_RANK } from "@/types/occupation";
import type { Profile } from "@/types/profile";
import type { DimensionScore, ScoreDimensionId, TransitionCategory, Warning } from "@/types/recommendation";
import type { ConstraintId, InterestId, SkillId } from "@/data/taxonomy";
import { CONSTRAINT_BY_ID, CONSTRAINT_IDS, ENV_BY_ID, ENV_IDS, INTEREST_IDS, MOTIVATION_BY_ID, MOTIVATION_IDS } from "@/data/taxonomy";
import { constraintState } from "./constraints";

/** Pondérations par défaut : choix d’ingénierie, pas des poids validés scientifiquement. */
export const DEFAULT_WEIGHTS: Record<ScoreDimensionId, number> = {
  interest: 0.3,
  environment: 0.2,
  motivation: 0.2,
  skills: 0.1,
  accessibility: 0.15,
  constraints: 0.05,
};

export const DIMENSION_LABELS: Record<ScoreDimensionId, string> = {
  interest: "Intérêts",
  environment: "Cadre de travail",
  motivation: "Motivations et valeurs",
  skills: "Compétences",
  accessibility: "Accessibilité",
  constraints: "Contraintes pratiques",
};

const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
type Part = { score: number; confidence: number };

export function interestAlignment(p: Profile, occ: Occupation): Part {
  const tags = Object.entries(occ.interestTags) as [InterestId, number][];
  const u = (id: InterestId) => p.interests[id].norm;
  const maxU = Math.max(0.0001, ...INTEREST_IDS.map(u));
  const totalW = tags.reduce((s, [, w]) => s + w, 0);
  const evidenceN = INTEREST_IDS.reduce((s, id) => s + Math.min(2, p.interests[id].n), 0);
  if (!totalW || maxU <= 0.0001) return { score: 0.5, confidence: 0.1 };
  const sA = tags.reduce((s, [id, w]) => s + w * u(id), 0) / totalW; // -1..1
  const top = [...INTEREST_IDS].sort((a, b) => u(b) - u(a)).slice(0, 3).filter((id) => u(id) > 0);
  const topSum = top.reduce((s, id) => s + u(id), 0);
  const c = topSum > 0 ? top.reduce((s, id) => s + u(id) * ((occ.interestTags[id] ?? 0) / 3), 0) / topSum : 0.3;
  let score = 0.4 * ((clamp(sA, -1, 1) + 1) / 2) + 0.6 * c;
  const fam = p.families[occ.familyId];
  if (fam !== undefined) score = 0.8 * score + 0.2 * clamp(0.3 + fam);
  return { score: clamp(score), confidence: clamp(evidenceN / 14) };
}

export function environmentAlignment(p: Profile, occ: Occupation): Part & { gaps: { id: string; gap: number; pref: number; value: number; essential: boolean }[] } {
  let num = 0;
  let den = 0;
  let comparable = 0;
  const gaps: { id: string; gap: number; pref: number; value: number; essential: boolean }[] = [];
  for (const id of ENV_IDS) {
    const st = p.env[id];
    const v = occ.workEnvironment[id];
    if (st.pref === undefined || v === null) continue;
    const tol = Math.max(0.5, st.spread);
    const gap = Math.abs(st.pref - v);
    const closeness = 1 - clamp((Math.max(0, gap - tol) / 4) * 1.7);
    const w = (st.essential ? 2 : 1) * Math.min(st.n, 3);
    num += w * closeness;
    den += w;
    comparable++;
    if (gap >= 2) gaps.push({ id, gap, pref: st.pref, value: v, essential: st.essential });
  }
  if (den === 0) return { score: 0.5, confidence: 0.1, gaps };
  return { score: num / den, confidence: clamp(comparable / 6), gaps };
}

export function motivationAlignment(p: Profile, occ: Occupation): Part & { missingEssential: string[] } {
  const norms = MOTIVATION_IDS.map((id) => ({ id, n: p.motivations[id].norm })).sort((a, b) => b.n - a.n);
  const top5 = norms.slice(0, 5);
  const topSum = top5.reduce((s, x) => s + Math.max(0, x.n), 0);
  if (topSum <= 0.0001) return { score: 0.5, confidence: 0.1, missingEssential: [] };
  const tags = new Set<string>(occ.motivationTags);
  const hit = top5.reduce((s, x) => s + (tags.has(x.id) ? Math.max(0, x.n) : 0), 0) / topSum;
  const extra = norms.filter((x) => !top5.includes(x) && tags.has(x.id)).reduce((s, x) => s + x.n, 0) / 3;
  const missingEssential = MOTIVATION_IDS.filter((id) => p.motivations[id].essential && !tags.has(id));
  const score = clamp(hit * 0.85 + clamp(extra) * 0.15 - missingEssential.length * 0.15);
  return { score, confidence: clamp(topSum / 2.2), missingEssential };
}

export function skillRelevance(p: Profile, occ: Occupation): Part & { transferable: SkillId[] } {
  const tags = occ.skillTags;
  if (!tags.length) return { score: 0.5, confidence: 0.1, transferable: [] };
  let sum = 0;
  let known = 0;
  const transferable: SkillId[] = [];
  for (const id of tags) {
    const s = p.skills[id];
    const cover = Math.max(s.demo, 0.6 * s.self);
    sum += cover;
    if (s.evidence.length) known++;
    if (s.demo >= 0.3 || s.self >= 0.45) transferable.push(id);
  }
  return { score: clamp(0.25 + (sum / tags.length) * 0.9), confidence: clamp(known / tags.length) * 0.8 + 0.1, transferable };
}

/** Estimation des mois de formation réellement nécessaires pour cette personne. */
export function effectiveTrainingMonths(p: Profile, occ: Occupation): number | null {
  const m = occ.training.months;
  if (m === null) return null;
  const rank = p.education.levelRank;
  let f = 1;
  if (rank !== undefined) {
    if (rank >= ENTRY_LEVEL_RANK[occ.training.typicalLevel]) f = 0.35;
    else if (rank >= ENTRY_LEVEL_RANK[occ.training.minLevel]) f = 0.65;
    else if (rank >= ENTRY_LEVEL_RANK[occ.training.typicalLevel] - 1) f = 0.85;
  }
  const bg = p.background.sectorIds.some((s) => occ.sectorIds.includes(s));
  if (bg) f *= 0.85;
  return Math.round(m * f);
}

export function accessibility(p: Profile, occ: Occupation): Part & { effMonths: number | null; levelGap: number | null } {
  const eff = effectiveTrainingMonths(p, occ);
  const max = p.transition.maxTrainingMonths;
  let train: number;
  if (eff === null) train = 0.6;
  else if (max === null) train = clamp(1 - eff / 80);
  else if (eff <= max) train = 1;
  else train = clamp(1 - (eff - max) / Math.max(max, 12));

  const rank = p.education.levelRank;
  const levelGap = rank === undefined ? null : ENTRY_LEVEL_RANK[occ.training.typicalLevel] - rank;
  const level = levelGap === null ? 0.7 : levelGap <= 0 ? 1 : levelGap === 1 ? 0.85 : levelGap === 2 ? 0.62 : 0.4;

  let score = 0.55 * train + 0.45 * level;
  if (p.transition.needIncome && (eff ?? 0) > 6) {
    score *= occ.training.workStudyPossible === true ? 1 : occ.training.workStudyPossible === false ? 0.8 : 0.92;
  }
  const conf = (eff === null ? 0.4 : 0.8) * (rank === undefined ? 0.7 : 1) + (max === null ? 0 : 0.1);
  return { score: clamp(score), confidence: clamp(conf), effMonths: eff, levelGap };
}

export function constraintCompat(p: Profile, occ: Occupation): Part & { notes: string[] } {
  const t = p.transition;
  const notes: string[] = [];
  let penalty = 0;
  let known = 0;
  if (t.salaryFloor && t.salaryFloor !== "aucun") {
    if (occ.earnings === null) notes.push("Niveau de rémunération typique non renseigné dans nos données.");
    else {
      known++;
      if (t.salaryFloor === "eleve" && occ.earnings === 1) { penalty += 0.5; notes.push("Rémunération généralement modeste, en deçà de ce que vous attendez."); }
      else if (t.salaryFloor === "eleve" && occ.earnings === 2) penalty += 0.2;
      else if (t.salaryFloor === "moyen" && occ.earnings === 1) { penalty += 0.3; notes.push("Rémunération souvent modeste, en début de carrière notamment."); }
    }
  }
  if (t.stableRequired) {
    if (occ.stability === null) notes.push("Stabilité de l’emploi non renseignée dans nos données.");
    else { known++; if (occ.stability === 1) { penalty += 0.5; notes.push("Emploi souvent peu stable (contrats courts, saisonnalité ou indépendance)."); } }
  }
  if (t.seasonalOk === false && occ.constraints["unstable-employment"] === "yes") { known++; penalty += 0.3; }
  if (t.licence === "non" && occ.training.prerequisites.some((x) => /permis/i.test(x))) { known++; penalty += 0.4; notes.push("Un permis de conduire est mentionné comme prérequis."); }
  if (t.relocation === "non" && occ.sectorIds.includes("environnement") && occ.confidence === "faible") penalty += 0;
  return { score: clamp(1 - penalty), confidence: known ? clamp(0.4 + known * 0.2) : 0.25, notes };
}

export interface DealBreakerResult {
  excluded: boolean;
  excludedReason?: string;
  penalty: number;
  warnings: Warning[];
  unknowns: string[];
}

export function evaluateDealBreakers(p: Profile, occ: Occupation): DealBreakerResult {
  const warnings: Warning[] = [];
  const unknowns: string[] = [];
  let penalty = 0;
  let excluded = false;
  let excludedReason: string | undefined;
  for (const id of CONSTRAINT_IDS) {
    const level = p.aversions[id].level;
    if (!level) continue;
    const state = constraintState(occ, id as ConstraintId);
    const label = CONSTRAINT_BY_ID[id].label.toLowerCase();
    if (level === 3) {
      if (state === "yes") { excluded = true; excludedReason ??= `Incompatible avec un point que vous jugez fortement indésirable : ${label}.`; }
      else if (state === "sometimes") { penalty += 0.15; warnings.push({ severity: "forte", text: `Ce métier implique parfois ${label}, que vous jugez fortement indésirable.` }); }
      else if (state === "unknown") unknowns.push(`À vérifier : ${label} (point que vous voulez éviter) — non précisé dans nos données.`);
    } else if (level === 2) {
      if (state === "yes") { penalty += 0.12; warnings.push({ severity: "attention", text: `Ce métier implique ${label}, que vous jugez plutôt indésirable.` }); }
      else if (state === "sometimes") { penalty += 0.04; warnings.push({ severity: "info", text: `Il peut arriver d’avoir à subir ${label}.` }); }
      else if (state === "unknown") unknowns.push(`À vérifier : ${label}.`);
    } else if (level === 1 && state === "yes") {
      warnings.push({ severity: "info", text: `Ce métier implique ${label}, que vous jugez acceptable avec modération.` });
    }
  }
  return { excluded, excludedReason, penalty, warnings, unknowns };
}

export interface OccupationScore {
  occupation: Occupation;
  dimensions: DimensionScore[];
  composite: number;
  dealBreakers: DealBreakerResult;
  envGaps: ReturnType<typeof environmentAlignment>["gaps"];
  missingEssential: string[];
  transferable: SkillId[];
  effMonths: number | null;
  levelGap: number | null;
  constraintNotes: string[];
}

export function scoreOccupation(p: Profile, occ: Occupation, weights: Record<ScoreDimensionId, number> = DEFAULT_WEIGHTS): OccupationScore {
  const interest = interestAlignment(p, occ);
  const env = environmentAlignment(p, occ);
  const mot = motivationAlignment(p, occ);
  const skills = skillRelevance(p, occ);
  const acc = accessibility(p, occ);
  const con = constraintCompat(p, occ);
  const parts: [ScoreDimensionId, Part][] = [
    ["interest", interest], ["environment", env], ["motivation", mot], ["skills", skills], ["accessibility", acc], ["constraints", con],
  ];
  const wTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const dimensions: DimensionScore[] = parts.map(([id, part]) => {
    const adj = 0.5 + (part.score - 0.5) * (0.4 + 0.6 * part.confidence); // un manque de données ramène vers la neutralité
    return { id, label: DIMENSION_LABELS[id], score: part.score, confidence: part.confidence, weighted: (weights[id] / wTotal) * adj };
  });
  const dealBreakers = evaluateDealBreakers(p, occ);
  const composite = clamp(dimensions.reduce((s, d) => s + d.weighted, 0) - dealBreakers.penalty);
  return {
    occupation: occ, dimensions, composite, dealBreakers,
    envGaps: env.gaps, missingEssential: mot.missingEssential, transferable: skills.transferable,
    effMonths: acc.effMonths, levelGap: acc.levelGap, constraintNotes: con.notes,
  };
}

export function classifyTransition(p: Profile, s: OccupationScore): { category: TransitionCategory; reason: string } {
  const occ = s.occupation;
  const bg = p.background;
  const sectorOverlap = occ.sectorIds.some((x) => bg.sectorIds.includes(x));
  const familyOverlap = (bg.familyIds as string[]).includes(occ.familyId);
  const skillOverlap = occ.skillTags.length ? s.transferable.length / occ.skillTags.length : 0;
  const max = p.transition.maxTrainingMonths;
  const eff = s.effMonths;
  const tooLong = eff !== null && (max === null ? eff > 36 : eff > max * 1.5 && eff > 6);
  const bigLevelGap = (s.levelGap ?? 0) >= 3;
  if (tooLong || bigLevelGap) {
    return { category: "ambitieuse", reason: tooLong ? `Elle demande environ ${eff} mois de formation, au-delà de ce que vous envisagez.` : "Elle demande un niveau de qualification nettement supérieur au vôtre." };
  }
  if (!bg.hasBackground) return { category: "nouvelle", reason: "Vous n’avez pas encore de parcours précis : toutes les pistes sont de nouvelles directions." };
  if ((sectorOverlap || familyOverlap) && skillOverlap >= 0.5) return { category: "proche", reason: "Elle reste dans un secteur que vous connaissez et réutilise une grande partie de vos compétences." };
  if (sectorOverlap || familyOverlap || skillOverlap >= 0.4) {
    return { category: "adjacent", reason: sectorOverlap || familyOverlap ? "Elle reste dans votre univers mais change l’activité ou les responsabilités." : "Elle réutilise une partie de vos compétences dans un autre univers." };
  }
  return { category: "nouvelle", reason: "Elle s’écarte de votre parcours mais correspond à vos intérêts et motivations." };
}

export { ENV_BY_ID, MOTIVATION_BY_ID };
