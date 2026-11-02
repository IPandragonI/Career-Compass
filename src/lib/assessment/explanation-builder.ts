import type { Occupation } from "@/types/occupation";
import { ENTRY_LEVEL_LABEL } from "@/types/occupation";
import type { Profile } from "@/types/profile";
import type { CareerDirection, NextStep, ProfileSummary, Reason, ReasonEvidence, Recommendation, Warning } from "@/types/recommendation";
import { AVERSION_LABEL } from "@/types/assessment";
import type { InterestId } from "@/data/taxonomy";
import {
  CONSTRAINT_BY_ID,
  ENV_BY_ID,
  ENV_IDS,
  FAMILY_BY_ID,
  INTEREST_BY_ID,
  INTEREST_IDS,
  MOTIVATION_BY_ID,
  MOTIVATION_IDS,
  SKILL_BY_ID,
  SKILL_IDS,
} from "@/data/taxonomy";
import { SECTOR_BY_ID } from "@/data/sectors/sectors";
import { OCCUPATION_BY_ID } from "@/data/occupations";
import type { OccupationScore } from "./scoring";
import { COVERAGE_TARGET } from "./profile-builder";
import { t } from "@/lib/i18n/messages";

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const ev = (items: { questionId: string; label: string }[], n = 2): ReasonEvidence[] =>
  items
    .filter((x) => x.questionId !== "onboarding" || x.label)
    .slice(0, n)
    .map((x) => ({ questionId: x.questionId, label: x.label }));

export function buildReasons(p: Profile, s: OccupationScore, categoryReason: string): Reason[] {
  const occ = s.occupation;
  const reasons: Reason[] = [];

  const shared = (Object.entries(occ.interestTags) as [InterestId, number][])
    .map(([id, w]) => ({ id, w, u: p.interests[id].norm }))
    .filter((x) => x.u >= 0.25)
    .sort((a, b) => b.u * b.w - a.u * a.w)
    .slice(0, 2);
  if (shared.length) {
    const task = occ.dailyTasks[0] ? lower(occ.dailyTasks[0]) : "";
    reasons.push({
      kind: "interest",
      text: t.reasons.interest(
        shared.map((x) => lower(INTEREST_BY_ID[x.id].label)),
        task,
      ),
      evidence: ev(shared.flatMap((x) => p.interests[x.id].evidence)),
    });
  }

  const envHits = ENV_IDS.map((id) => ({ id, st: p.env[id], v: occ.workEnvironment[id] }))
    .filter(
      (x) =>
        x.st.pref !== undefined &&
        x.v !== null &&
        x.st.n > 0 &&
        Math.abs((x.st.pref ?? 0) - (x.v ?? 0)) <= Math.max(0.75, x.st.spread) &&
        ((x.st.pref ?? 2) >= 3 || (x.st.pref ?? 2) <= 1),
    )
    .sort((a, b) => b.st.n - a.st.n)
    .slice(0, 3);
  if (envHits.length) {
    const phrases = envHits.map((x) => ((x.st.pref ?? 0) >= 3 ? ENV_BY_ID[x.id].high : ENV_BY_ID[x.id].low));
    reasons.push({
      kind: "environment",
      text: t.reasons.environment(phrases),
      evidence: ev(envHits.flatMap((x) => x.st.evidence)),
    });
  }

  const mots = occ.motivationTags
    .filter((m) => p.motivations[m].norm >= 0.3)
    .sort((a, b) => p.motivations[b].norm - p.motivations[a].norm)
    .slice(0, 3);
  if (mots.length) {
    reasons.push({
      kind: "motivation",
      text: t.reasons.motivation(
        mots.map((m) => lower(MOTIVATION_BY_ID[m].label)),
        mots.some((m) => p.motivations[m].essential),
      ),
      evidence: ev(mots.flatMap((m) => p.motivations[m].evidence)),
    });
  }

  if (s.transferable.length) {
    const sk = s.transferable.slice(0, 3);
    const demo = sk.some((id) => p.skills[id].status === "demonstrated");
    reasons.push({
      kind: "skills",
      text: t.reasons.skills(
        sk.map((id) => lower(SKILL_BY_ID[id].label)),
        demo,
      ),
      evidence: ev(sk.flatMap((id) => p.skills[id].evidence)),
    });
  }

  if (occ.training.months !== null) {
    const eff = s.effMonths;
    reasons.push({
      kind: "training",
      text: t.reasons.training(ENTRY_LEVEL_LABEL[occ.training.typicalLevel].toLowerCase(), eff ?? occ.training.months),
      evidence: [],
    });
  }
  reasons.push({ kind: "context", text: categoryReason, evidence: [] });
  return reasons;
}

export function buildWarnings(p: Profile, s: OccupationScore): Warning[] {
  const out: Warning[] = [...s.dealBreakers.warnings];
  for (const g of s.envGaps) {
    const defined = g.essential || g.pref >= 3 || g.pref <= 1;
    if (!defined) continue;
    out.push({
      severity: g.essential || g.gap >= 3 ? "forte" : "attention",
      text: t.warnings.envGap(
        ENV_BY_ID[g.id as keyof typeof ENV_BY_ID].label,
        g.pref >= 2 ? ENV_BY_ID[g.id as keyof typeof ENV_BY_ID].high : ENV_BY_ID[g.id as keyof typeof ENV_BY_ID].low,
      ),
    });
  }
  for (const m of s.missingEssential) {
    out.push({ severity: "attention", text: t.warnings.missingEssential(MOTIVATION_BY_ID[m as keyof typeof MOTIVATION_BY_ID].label) });
  }
  const max = p.transition.maxTrainingMonths;
  if (max !== null && s.effMonths !== null && s.effMonths > max) {
    out.push({ severity: s.effMonths > max * 1.5 ? "forte" : "attention", text: t.warnings.trainingTooLong(s.effMonths, max) });
  }
  if (s.entryRefused) out.push({ severity: "attention", text: t.warnings.entryLevelRefused });
  if (s.urgentConflict && s.effMonths !== null) out.push({ severity: "attention", text: t.warnings.urgent(s.effMonths) });
  for (const n of s.constraintNotes) out.push({ severity: "attention", text: n });
  if (s.occupation.confidence === "faible") out.push({ severity: "info", text: t.warnings.lowConfidence });
  const rank = { forte: 0, attention: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

export function buildToInvestigate(occ: Occupation, s: OccupationScore): string[] {
  const out = [t.toInvestigate.officialSheet, t.toInvestigate.realOffers, t.toInvestigate.talk];
  if (s.dealBreakers.unknowns.length) out.push(...s.dealBreakers.unknowns.slice(0, 2));
  if (occ.training.workStudyPossible === null) out.push(t.toInvestigate.workStudy);
  if ((s.effMonths ?? 0) > 18) out.push(t.toInvestigate.compareTraining);
  return out;
}

export function evidenceConfidence(p: Profile, occ: Occupation): "faible" | "moyenne" | "bonne" {
  const d = occ.confidence === "elevee" ? 0.9 : occ.confidence === "moyenne" ? 0.65 : 0.4;
  const cov =
    (Object.keys(COVERAGE_TARGET) as (keyof typeof COVERAGE_TARGET)[])
      .filter((k) => COVERAGE_TARGET[k] > 0)
      .reduce((s, k) => s + p.coverage[k], 0) / 6;
  const v = d * (0.4 + 0.6 * cov);
  return v < 0.4 ? "faible" : v < 0.58 ? "moyenne" : "bonne";
}

export function buildDirection(p: Profile, familyId: CareerDirection["familyId"], recs: Recommendation[], score: number): CareerDirection {
  const occs = recs.map((r) => OCCUPATION_BY_ID[r.occupationId]!).filter(Boolean);
  const sectorIds = [...new Set(occs.flatMap((x) => x.sectorIds))].slice(0, 5);
  const fam = FAMILY_BY_ID[familyId];
  const why =
    recs[0]?.reasons.filter((r) => r.kind === "interest" || r.kind === "environment" || r.kind === "motivation").slice(0, 3) ?? [];
  const activities = [...new Set(occs.flatMap((x) => x.dailyTasks.slice(0, 2)))].slice(0, 5);
  const months = occs.map((x) => x.training.months).filter((m): m is number => m !== null);
  const training = months.length
    ? `Selon le métier : de ${Math.min(...months)} à ${Math.max(...months)} mois de formation depuis zéro (estimations éditoriales) ; la durée réelle dépend de votre parcours.`
    : "Durées de formation non renseignées : à vérifier.";
  const warnings = [...new Set(recs.flatMap((r) => r.warnings.filter((w) => w.severity !== "info").map((w) => w.text)))].slice(0, 4);
  const sectors = sectorIds.map((id) => SECTOR_BY_ID[id]).filter((x): x is NonNullable<typeof x> => !!x);
  const unknowns = [...new Set(recs.flatMap((r) => r.unknowns))].slice(0, 4);
  return {
    familyId,
    title: fam.label,
    why,
    activities,
    sectorIds,
    occupationIds: occs.map((x) => x.id),
    advantages: [...new Set(why.map((r) => r.text))].slice(0, 3),
    drawbacks: warnings.length ? warnings : sectors.flatMap((x) => x.constraints.slice(0, 1)).slice(0, 3),
    training,
    score,
    reality: {
      attractive: why.map((r) => r.text),
      disappointing: [...sectors.flatMap((x) => x.misconceptions.slice(0, 1)), ...sectors.flatMap((x) => x.constraints.slice(0, 1))].slice(
        0,
        4,
      ),
      unknowns: unknowns.length ? unknowns : ["Les conditions réelles varient beaucoup d’un employeur à l’autre."],
      constraints: warnings,
      questions: [
        `Ai-je déjà observé une journée réelle dans l’un de ces métiers (${occs[0]?.name ?? "métier"}) ?`,
        occs[0]?.dailyTasks[0]
          ? `Cette activité me plairait-elle vraiment au quotidien : ${lower(occs[0].dailyTasks[0])} ?`
          : "Les tâches quotidiennes correspondent-elles à mes attentes ?",
        "Suis-je prêt·e à accepter la formation et le niveau de rémunération de départ ?",
      ],
    },
  };
}

export function buildSummary(p: Profile): ProfileSummary {
  const topInterests = INTEREST_IDS.map((id) => ({ id, label: INTEREST_BY_ID[id].label, norm: p.interests[id].norm }))
    .filter((x) => x.norm >= 0.2)
    .sort((a, b) => b.norm - a.norm)
    .slice(0, 5)
    .map((x) => ({ id: x.id, label: x.label, level: (x.norm >= 0.5 ? "fort" : "moyen") as "fort" | "moyen" }));
  const environment = ENV_IDS.filter((id) => p.env[id].n > 0 && p.env[id].pref !== undefined)
    .map((id) => {
      const st = p.env[id];
      const pref = st.pref ?? 2;
      const range = st.spread >= 1 ? "préférence en fourchette, plutôt " : "";
      const text = pref >= 3 ? ENV_BY_ID[id].high : pref <= 1 ? ENV_BY_ID[id].low : "équilibre entre les deux";
      return {
        id,
        label: ENV_BY_ID[id].label,
        text: `${range}${text}${st.essential ? " (indispensable)" : ""}`,
        strength: Math.abs(pref - 2) + st.n * 0.1,
      };
    })
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 6)
    .map(({ strength: _s, ...rest }) => rest);
  const motivations = MOTIVATION_IDS.filter((id) => p.motivations[id].norm >= 0.25)
    .sort((a, b) => p.motivations[b].norm - p.motivations[a].norm)
    .slice(0, 6)
    .map((id) => ({ id, label: MOTIVATION_BY_ID[id].label, essential: p.motivations[id].essential }));
  const skills = SKILL_IDS.filter((id) => p.skills[id].status !== "uncertain")
    .sort((a, b) => Math.max(p.skills[b].demo, p.skills[b].self) - Math.max(p.skills[a].demo, p.skills[a].self))
    .slice(0, 8)
    .map((id) => ({ id, label: SKILL_BY_ID[id].label, status: p.skills[id].status }));
  const dealBreakers = (Object.keys(p.aversions) as (keyof typeof CONSTRAINT_BY_ID)[])
    .filter((id) => (p.aversions[id].level ?? 0) >= 2)
    .sort((a, b) => (p.aversions[b].level ?? 0) - (p.aversions[a].level ?? 0))
    .map((id) => ({
      id,
      label: `${CONSTRAINT_BY_ID[id].label} — ${AVERSION_LABEL[p.aversions[id].level!].toLowerCase()}`,
      level: p.aversions[id].level!,
    }));
  const t = p.transition;
  const constraints: string[] = [];
  if (t.maxTrainingMonths !== null)
    constraints.push(
      t.maxTrainingMonths === 0
        ? "Pas de formation supplémentaire envisagée"
        : `Formation envisagée : jusqu’à ${t.maxTrainingMonths} mois environ`,
    );
  if (t.needIncome) constraints.push("Besoin de maintenir un revenu pendant la formation");
  if (t.stableRequired) constraints.push("Emploi stable recherché");
  if (t.salaryFloor && t.salaryFloor !== "aucun") constraints.push("Niveau de revenu minimal indiqué");
  if (t.relocation === "non") constraints.push("Pas de mobilité géographique");
  if (p.education.current) constraints.unshift(`Études en cours : ${p.education.current}`);
  if (p.education.field) constraints.unshift(`Domaine d’études : ${p.education.field}`);
  const uncertainties: string[] = [];
  for (const k of Object.keys(COVERAGE_TARGET) as (keyof typeof COVERAGE_TARGET)[]) {
    if (COVERAGE_TARGET[k] > 0 && p.coverage[k] < COVERAGE_TARGET[k] * 0.8)
      uncertainties.push(
        `Peu d’informations sur : ${k === "interets" ? "vos centres d’intérêt" : k === "environnement" ? "votre cadre de travail idéal" : k === "motivations" ? "vos motivations" : k === "competences" ? "vos compétences" : k === "quotidien" ? "votre journée idéale" : k === "transition" ? "votre rapport au changement" : "vos points de blocage"}.`,
      );
  }
  if (p.skippedCount) uncertainties.push(`${p.skippedCount} question(s) passée(s) : les résultats en tiennent compte avec prudence.`);
  return {
    topInterests,
    environment,
    motivations,
    skills,
    dealBreakers,
    constraints,
    uncertainties,
    contradictions: p.contradictions.map((c) => ({
      id: c.id,
      title: c.title + (c.resolved ? " (précisé)" : ""),
      description: c.description,
    })),
  };
}

export function buildNextSteps(directions: CareerDirection[], recs: Recommendation[]): NextStep[] {
  const first = recs[0] ? OCCUPATION_BY_ID[recs[0].occupationId] : undefined;
  const steps: NextStep[] = [];
  if (first)
    steps.push({
      id: "fiche",
      title: `Explorer la fiche « ${first.name} »`,
      detail: "Lisez la présentation, les voies d’accès et les points de vigilance, puis comparez avec la fiche officielle.",
      href: `/metiers/${first.id}/`,
    });
  steps.push(
    {
      id: "comparer",
      title: "Comparer vos pistes côte à côte",
      detail: "Sélectionnez 2 à 3 métiers dans l’explorateur et comparez conditions de travail et formation.",
      href: "/metiers/",
    },
    {
      id: "metierscope",
      title: "Consulter les fiches officielles",
      detail: "France Travail propose des fiches métiers ; l’Onisep détaille formations et débouchés.",
      href: "https://candidat.francetravail.fr/metierscope/",
      external: true,
    },
    {
      id: "offres",
      title: "Lire de vraies offres d’emploi",
      detail:
        "Repérez les exigences réelles (diplôme, horaires, lieux) pour vos 2 ou 3 pistes principales. Nous n’affichons pas d’offres : elles changent chaque jour.",
      href: "https://www.francetravail.fr/",
      external: true,
    },
    {
      id: "pro",
      title: "Parler à une personne qui exerce le métier",
      detail: "Une conversation de 30 minutes apprend souvent plus que dix fiches : demandez une journée type et les points difficiles.",
    },
    {
      id: "immersion",
      title: "Tester par une immersion",
      detail: "Une période d’immersion en entreprise permet de vérifier si le quotidien vous convient.",
      href: "https://immersion-facile.beta.gouv.fr/",
      external: true,
    },
    {
      id: "formation",
      title: "Étudier les voies de formation",
      detail: "Comparez durée, coût, alternance et financement (compte personnel de formation).",
      href: "https://www.moncompteformation.gouv.fr/",
      external: true,
    },
    {
      id: "projet",
      title: "Lancer un mini-projet pratique",
      detail: directions[0]
        ? `Par exemple : un petit projet lié à « ${directions[0].title.toLowerCase()} » pour tester votre envie avant de vous engager.`
        : "Un petit projet concret permet de tester votre envie avant de vous engager.",
    },
  );
  return steps;
}
