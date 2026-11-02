import type { Occupation } from "@/types/occupation";
import type { Profile } from "@/types/profile";
import type { FitLabel, Recommendation, Results, TransitionCategory } from "@/types/recommendation";
import type { FamilyId } from "@/data/taxonomy";
import { ENV_IDS } from "@/data/taxonomy";
import { OCCUPATIONS, similarity } from "@/data/occupations";
import { buildDirection, buildNextSteps, buildReasons, buildSummary, buildToInvestigate, buildWarnings, evidenceConfidence } from "./explanation-builder";
import { classifyTransition, DEFAULT_WEIGHTS, scoreOccupation, type OccupationScore } from "./scoring";

export interface EngineOptions {
  weights?: typeof DEFAULT_WEIGHTS;
  maxDirections?: number;
  maxRecommendations?: number;
  /** Seuil de similarité au-delà duquel deux métiers sont traités comme quasi-doublons. */
  duplicateThreshold?: number;
}

interface Scored {
  s: OccupationScore;
  category: TransitionCategory;
  categoryReason: string;
  adjusted: number;
}

const wordsOf = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 4);

function fitLabel(composite: number, hasStrongWarning: boolean): FitLabel {
  if (hasStrongWarning) return "Piste possible sous certaines conditions";
  if (composite >= 0.6) return "Piste particulièrement intéressante";
  if (composite >= 0.5) return "Piste à explorer";
  return "Piste possible sous certaines conditions";
}

function envVector(occs: Occupation[]): number[] {
  return ENV_IDS.map((id) => {
    const vals: number[] = occs.map((o) => o.workEnvironment[id]).filter((v): v is NonNullable<typeof v> => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 2;
  });
}
const cosineish = (a: number[], b: number[]) => 1 - a.reduce((s, x, i) => s + Math.abs(x - (b[i] ?? 0)), 0) / (a.length * 4);

export function recommend(profile: Profile, options: EngineOptions = {}, occupations: Occupation[] = OCCUPATIONS): Results {
  const dupThreshold = options.duplicateThreshold ?? 0.62;
  const maxDirections = options.maxDirections ?? 5;
  const maxRecs = options.maxRecommendations ?? 12;

  // 1–2. Scores, catégories et deal-breakers (un métier mal renseigné ne fait jamais planter le calcul).
  const all: Scored[] = [];
  for (const occ of occupations) {
    try {
      const s = scoreOccupation(profile, occ, options.weights);
      const { category, reason } = classifyTransition(profile, s);
      // Ajustement transparent selon l’intention déclarée, sans jamais privilégier automatiquement le proche.
      let adjusted = s.composite;
      const near = category === "proche" || category === "adjacent";
      if (profile.transition.wantsToLeaveField && near) adjusted *= 0.94;
      else if (profile.transition.wantsToStay && near) adjusted *= 1.04;
      all.push({ s, category, categoryReason: reason, adjusted });
    } catch {
      /* fiche inutilisable : ignorée */
    }
  }
  const eligible = all.filter((x) => !x.s.dealBreakers.excluded).sort((a, b) => b.adjusted - a.adjusted || a.s.occupation.id.localeCompare(b.s.occupation.id));
  const excludedCount = all.length - eligible.length;

  const toRec = (x: Scored): Recommendation => {
    const warnings = buildWarnings(profile, x.s);
    return {
      occupationId: x.s.occupation.id,
      composite: x.adjusted,
      dimensions: x.s.dimensions,
      fit: fitLabel(x.adjusted, warnings.some((w) => w.severity === "forte")),
      category: x.category,
      categoryReason: x.categoryReason,
      reasons: buildReasons(profile, x.s, x.categoryReason),
      transferableSkills: x.s.transferable,
      warnings,
      unknowns: x.s.dealBreakers.unknowns,
      toInvestigate: buildToInvestigate(x.s.occupation, x.s),
      evidenceConfidence: evidenceConfidence(profile, x.s.occupation),
      excluded: false,
    };
  };

  // 3. Familles les plus prometteuses (moyenne des 3 meilleurs métiers, pondérée par le soutien).
  const byFamily = new Map<FamilyId, Scored[]>();
  for (const x of eligible) {
    const list = byFamily.get(x.s.occupation.familyId) ?? [];
    list.push(x);
    byFamily.set(x.s.occupation.familyId, list);
  }
  const famScore = new Map<FamilyId, number>();
  for (const [id, list] of byFamily) {
    const top = list.slice(0, 3);
    const support = Math.min(1, top.length / 2);
    famScore.set(id, (top.reduce((s, x) => s + x.adjusted, 0) / top.length) * (0.85 + 0.15 * support));
  }
  const famOccs = (id: FamilyId) => byFamily.get(id)!.map((x) => x.s.occupation);
  const famSimilarity = (a: FamilyId, b: FamilyId) => {
    const oa = famOccs(a), ob = famOccs(b);
    const sa = new Set(oa.flatMap((o) => o.sectorIds)), sb = new Set(ob.flatMap((o) => o.sectorIds));
    const inter = [...sa].filter((x) => sb.has(x)).length;
    const jac = inter / Math.max(1, sa.size + sb.size - inter);
    return 0.5 * cosineish(envVector(oa), envVector(ob)) + 0.5 * jac;
  };

  // 4. Sélection diversifiée des directions (type MMR).
  const ranked = [...famScore.entries()].sort((a, b) => b[1] - a[1]);
  const directionsIds: FamilyId[] = [];
  if (ranked.length) {
    directionsIds.push(ranked[0]![0]);
    const best = ranked[0]![1];
    while (directionsIds.length < maxDirections) {
      let pick: [FamilyId, number] | null = null;
      for (const [id, sc] of ranked) {
        if (directionsIds.includes(id)) continue;
        if (sc < best * (directionsIds.length < 3 ? 0.62 : 0.85)) continue;
        const redundancy = Math.max(...directionsIds.map((d) => famSimilarity(id, d)));
        const mmr = sc - 0.3 * Math.max(0, redundancy - 0.4);
        if (!pick || mmr > pick[1]) pick = [id, mmr];
      }
      if (!pick) break;
      directionsIds.push(pick[0]);
    }
  }

  // 5. Choix des métiers : suppression des quasi-doublons, plafond par direction.
  const chosen: Scored[] = [];
  const isDup = (c: Scored) =>
    chosen.some((x) => (x.s.occupation.dedupeGroup && x.s.occupation.dedupeGroup === c.s.occupation.dedupeGroup) || similarity(x.s.occupation, c.s.occupation) >= dupThreshold + 0.2);
  const perDirection = new Map<FamilyId, Scored[]>();
  for (const fid of directionsIds) {
    for (const c of byFamily.get(fid)!) {
      if ((perDirection.get(fid)?.length ?? 0) >= 3) break;
      if (c.adjusted < (famScore.get(fid) ?? 0) * 0.82 && (perDirection.get(fid)?.length ?? 0) >= 1) continue;
      if (isDup(c)) continue;
      if (c.category === "ambitieuse" && chosen.filter((x) => x.category === "ambitieuse").length >= 2) continue;
      chosen.push(c);
      perDirection.set(fid, [...(perDirection.get(fid) ?? []), c]);
    }
  }
  // Compléter jusqu'à 8 avec les meilleurs candidats restants des directions retenues.
  if (chosen.length < 8) {
    for (const c of eligible) {
      if (chosen.length >= 8) break;
      if (chosen.includes(c) || !directionsIds.includes(c.s.occupation.familyId) || isDup(c)) continue;
      if ((perDirection.get(c.s.occupation.familyId)?.length ?? 0) >= 4) continue;
      if (c.category === "ambitieuse" && chosen.filter((x) => x.category === "ambitieuse").length >= 2) continue;
      chosen.push(c);
      perDirection.set(c.s.occupation.familyId, [...(perDirection.get(c.s.occupation.familyId) ?? []), c]);
    }
  }
  chosen.sort((a, b) => b.adjusted - a.adjusted);
  const finalChosen = chosen.slice(0, maxRecs);

  // 6. Découvertes inattendues : bonnes correspondances peu « évidentes ».
  const hint = new Set(profile.freeText.flatMap(wordsOf));
  const median = finalChosen.length ? finalChosen[Math.floor(finalChosen.length / 2)]!.adjusted : 0.5;
  const obviousness = (x: Scored) => {
    const o = x.s.occupation;
    let v = 0;
    if (o.sectorIds.some((id) => profile.background.sectorIds.includes(id))) v += 0.5;
    if (wordsOf(`${o.name} ${o.aliases.join(" ")}`).some((w) => hint.has(w))) v += 0.5;
    if (x.category === "proche") v += 0.3;
    return Math.min(1, v);
  };
  const discoveries: Scored[] = [];
  const usedFamilies = new Set<string>();
  const pool = eligible
    .filter((x) => !finalChosen.includes(x) && (x.category === "nouvelle" || x.category === "adjacent") && x.adjusted >= median * 0.9 && !x.s.dealBreakers.warnings.some((w) => w.severity === "forte"))
    .sort((a, b) => b.adjusted * (1 - 0.5 * obviousness(b)) - a.adjusted * (1 - 0.5 * obviousness(a)));
  for (const c of pool) {
    if (discoveries.length >= 3) break;
    if (usedFamilies.has(c.s.occupation.familyId) || isDup(c) || discoveries.some((d) => similarity(d.s.occupation, c.s.occupation) >= dupThreshold)) continue;
    discoveries.push(c);
    usedFamilies.add(c.s.occupation.familyId);
  }

  const recommendations = finalChosen.map(toRec);
  const recById = new Map(recommendations.map((r) => [r.occupationId, r]));
  const directions = directionsIds
    .map((fid) => {
      const recs = (perDirection.get(fid) ?? []).map((c) => recById.get(c.s.occupation.id)).filter((r): r is Recommendation => !!r);
      return recs.length ? buildDirection(profile, fid, recs, famScore.get(fid) ?? 0) : null;
    })
    .filter((d): d is NonNullable<typeof d> => d !== null);

  const notes = [
    "Ces résultats sont exploratoires : ils sont calculés localement à partir de vos réponses et d’un jeu de données éditorial, sans validation scientifique.",
  ];
  if (profile.answeredCount < 15) notes.push("Vous avez répondu à peu de questions : les pistes sont larges et peu fiables. Compléter le bilan les améliorera.");
  if (excludedCount) notes.push(`${excludedCount} métier(s) ont été écartés car incompatibles avec ce que vous avez indiqué fortement vouloir éviter.`);

  return {
    generatedAt: new Date().toISOString(),
    recommendations,
    directions,
    discoveries: discoveries.map(toRec),
    excludedCount,
    nextSteps: buildNextSteps(directions, recommendations),
    summary: buildSummary(profile),
    notes,
  };
}
