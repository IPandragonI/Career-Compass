import type { Profile } from "@/types/profile";
import type { Results } from "@/types/recommendation";
import { OCCUPATIONS } from "@/data/occupations";
import { t } from "@/lib/i18n/messages";
import { buildWarnings } from "./explanation-builder";
import { scoreOccupation } from "./scoring";

export interface AbsenceExplanation {
  selected: boolean;
  excluded: boolean;
  lines: string[];
  warnings: string[];
}

const qualitative = (v: number) => (v >= 0.66 ? "élevée" : v >= 0.45 ? "moyenne" : "faible");

/** « Pourquoi pas ce métier ? » : explique l’absence d’un métier à partir des mêmes calculs que le classement. */
export function explainAbsence(profile: Profile, occupationId: string, results: Results): AbsenceExplanation | null {
  const occ = OCCUPATIONS.find((o) => o.id === occupationId);
  if (!occ) return null;
  const inList = [...results.recommendations, ...results.discoveries].some((r) => r.occupationId === occupationId);
  const scores = OCCUPATIONS.map((o) => scoreOccupation(profile, o))
    .filter((s) => !s.dealBreakers.excluded)
    .sort((a, b) => b.composite - a.composite);
  const mine = scoreOccupation(profile, occ);
  if (inList)
    return { selected: true, excluded: false, lines: [t.absence.selected], warnings: buildWarnings(profile, mine).map((w) => w.text) };
  if (mine.dealBreakers.excluded) {
    return { selected: false, excluded: true, lines: [t.absence.excluded(mine.dealBreakers.excludedReason ?? "")], warnings: [] };
  }
  const dims = [...mine.dimensions].sort((a, b) => b.score - a.score);
  const rank = scores.findIndex((s) => s.occupation.id === occupationId) + 1;
  const best = dims[0]!;
  const worst = dims[dims.length - 1]!;
  return {
    selected: false,
    excluded: false,
    lines: [
      t.absence.notExcluded,
      t.absence.rank(rank, scores.length),
      t.absence.strongest(best.label.toLowerCase(), qualitative(best.score)),
      t.absence.weakest(worst.label.toLowerCase(), qualitative(worst.score)),
    ],
    warnings: buildWarnings(profile, mine).map((w) => w.text),
  };
}
