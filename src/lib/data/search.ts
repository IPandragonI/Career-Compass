import type { Occupation } from "@/types/occupation";
import { ENTRY_LEVEL_RANK } from "@/types/occupation";
import type { FamilyId, InterestId } from "@/data/taxonomy";
import { SECTOR_BY_ID } from "@/data/sectors/sectors";
import { INTEREST_BY_ID } from "@/data/taxonomy";
import { normalize } from "./normalization";

/** Rapproche un métier saisi en texte libre des fiches (noms et alias), sans chercher dans les descriptions. */
export function matchOccupationsByName(text: string, list: Occupation[], limit = 2): Occupation[] {
  const terms = normalize(text)
    .split(" ")
    .filter((w) => w.length >= 4);
  if (!terms.length) return [];
  return list
    .map((o) => {
      const names = [o.name, ...o.aliases].map(normalize);
      const hits = terms.filter((t) => names.some((n) => n.split(" ").some((w) => w.startsWith(t.slice(0, Math.max(5, t.length - 2))))));
      return { o, score: hits.length / terms.length };
    })
    .filter((x) => x.score >= 0.99)
    .slice(0, limit)
    .map((x) => x.o);
}

export interface OccupationFilters {
  query: string;
  sectorIds: string[];
  interestIds: InterestId[];
  familyIds: FamilyId[];
  /** Durée de formation maximale en mois (inconnue = incluse). */
  maxMonths: number | null;
  maxLevelRank: number | null;
  /** Conditions minimales : ex. terrain ≥ 3 (métiers à valeur inconnue exclus). */
  env: Partial<Record<string, number>>;
  favoritesOnly: boolean;
}

export const EMPTY_FILTERS: OccupationFilters = {
  query: "",
  sectorIds: [],
  interestIds: [],
  familyIds: [],
  maxMonths: null,
  maxLevelRank: null,
  env: {},
  favoritesOnly: false,
};

const indexCache = new WeakMap<Occupation, string>();
function haystack(o: Occupation): string {
  let h = indexCache.get(o);
  if (!h) {
    h = normalize(
      [
        o.name,
        ...o.aliases,
        o.description,
        ...o.dailyTasks,
        ...o.sectorIds.map((s) => SECTOR_BY_ID[s]?.name ?? ""),
        ...Object.keys(o.interestTags).map((i) => INTEREST_BY_ID[i as InterestId]?.label ?? ""),
      ].join(" "),
    );
    indexCache.set(o, h);
  }
  return h;
}

/** Recherche plein texte : tous les termes doivent apparaître ; les résultats sont classés par pertinence. */
export function searchOccupations(list: Occupation[], f: OccupationFilters, favorites: string[] = []): Occupation[] {
  const terms = normalize(f.query).split(" ").filter(Boolean);
  const scored: { o: Occupation; score: number }[] = [];
  for (const o of list) {
    if (f.favoritesOnly && !favorites.includes(o.id)) continue;
    if (f.sectorIds.length && !o.sectorIds.some((s) => f.sectorIds.includes(s))) continue;
    if (f.familyIds.length && !f.familyIds.includes(o.familyId)) continue;
    if (f.interestIds.length && !f.interestIds.some((i) => (o.interestTags[i] ?? 0) >= 2)) continue;
    if (f.maxMonths !== null && o.training.months !== null && o.training.months > f.maxMonths) continue;
    if (f.maxLevelRank !== null && ENTRY_LEVEL_RANK[o.training.typicalLevel] > f.maxLevelRank) continue;
    let ok = true;
    for (const [dim, min] of Object.entries(f.env)) {
      const v = o.workEnvironment[dim as keyof Occupation["workEnvironment"]];
      if (min !== undefined && (v === null || v < min)) {
        ok = false;
        break;
      }
    }
    if (!ok) continue;
    let score = 0;
    if (terms.length) {
      const h = haystack(o);
      const name = normalize(o.name);
      if (!terms.every((t) => h.includes(t))) continue;
      score = terms.reduce((s, t) => s + (name.includes(t) ? 3 : 1), 0);
    }
    scored.push({ o, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.o.name.localeCompare(b.o.name, "fr")).map((x) => x.o);
}
