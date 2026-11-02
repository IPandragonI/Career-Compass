import type { Occupation } from "@/types/occupation";
import { PART1 } from "./part1-tech";
import { PART2 } from "./part2-terrain";
import { PART3 } from "./part3-services";
import { CONSTRAINT_PATCHES, PART4 } from "./part4-extension";

const jaccard = <T>(a: T[], b: T[]) => {
  if (!a.length && !b.length) return 0;
  const sa = new Set(a);
  const inter = b.filter((x) => sa.has(x)).length;
  return inter / (sa.size + new Set(b).size - inter);
};

/** Similarité entre deux métiers : intérêts, secteurs, compétences, famille. */
export function similarity(a: Occupation, b: Occupation): number {
  return (
    0.4 * jaccard(Object.keys(a.interestTags), Object.keys(b.interestTags)) +
    0.25 * jaccard(a.sectorIds, b.sectorIds) +
    0.2 * jaccard(a.skillTags, b.skillTags) +
    0.15 * (a.familyId === b.familyId ? 1 : 0)
  );
}

/** Ajoute des contraintes éditoriales sans jamais écraser une valeur déjà renseignée. */
function applyPatches(list: Occupation[]): Occupation[] {
  return list.map((occ) => {
    const patch = CONSTRAINT_PATCHES[occ.id];
    if (!patch) return occ;
    const added: Occupation["constraints"] = {};
    for (const t of patch.split(" ")) {
      const id = t.replace(/^[!~]/, "") as keyof Occupation["constraints"];
      if (occ.constraints[id] !== undefined) continue;
      added[id] = t.startsWith("!") ? "no" : t.startsWith("~") ? "sometimes" : "yes";
    }
    return { ...occ, constraints: { ...occ.constraints, ...added } };
  });
}

function withRelations(list: Occupation[]): Occupation[] {
  return list.map((occ) => ({
    ...occ,
    relatedOccupationIds: list
      .filter((x) => x.id !== occ.id)
      .map((x) => ({ id: x.id, s: similarity(occ, x) }))
      .filter((x) => x.s >= 0.3)
      .sort((a, b) => b.s - a.s || a.id.localeCompare(b.id))
      .slice(0, 4)
      .map((x) => x.id),
  }));
}

export const OCCUPATIONS: Occupation[] = withRelations(applyPatches([...PART1, ...PART2, ...PART3, ...PART4]));
export const OCCUPATION_BY_ID: Record<string, Occupation> = Object.fromEntries(OCCUPATIONS.map((x) => [x.id, x]));
