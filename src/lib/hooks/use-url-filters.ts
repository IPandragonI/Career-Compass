"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TransitionCategory } from "@/types/recommendation";
import type { FamilyId, InterestId } from "@/data/taxonomy";
import { EMPTY_FILTERS, type OccupationFilters } from "@/lib/data/search";

export type SortKey = "pertinence" | "nom" | "formation";
export interface ExplorerState {
  filters: OccupationFilters;
  sort: SortKey;
  category: TransitionCategory | "";
}

export const EMPTY_EXPLORER: ExplorerState = { filters: EMPTY_FILTERS, sort: "pertinence", category: "" };

const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

/** Lit l’état de l’explorateur depuis une chaîne de recherche d’URL (fonction pure, testable). */
export function parseExplorer(search: string): ExplorerState {
  const p = new URLSearchParams(search);
  const env: Record<string, number> = {};
  for (const k of list(p.get("env"))) env[k] = 3;
  const months = p.get("mois");
  const sort = p.get("tri");
  return {
    filters: {
      ...EMPTY_FILTERS,
      query: p.get("q") ?? "",
      sectorIds: list(p.get("secteurs")),
      familyIds: list(p.get("familles")) as FamilyId[],
      interestIds: list(p.get("interets")) as InterestId[],
      maxMonths: months && /^\d+$/.test(months) ? Number(months) : null,
      env,
      favoritesOnly: p.get("favoris") === "1",
    },
    sort: sort === "nom" || sort === "formation" ? sort : "pertinence",
    category: (["proche", "adjacent", "nouvelle", "ambitieuse"].includes(p.get("cat") ?? "")
      ? p.get("cat")
      : "") as ExplorerState["category"],
  };
}

/** Sérialise l’état de l’explorateur ; les valeurs par défaut sont omises pour des URL courtes. */
export function serializeExplorer(s: ExplorerState): string {
  const p = new URLSearchParams();
  const f = s.filters;
  if (f.query) p.set("q", f.query);
  if (f.sectorIds.length) p.set("secteurs", f.sectorIds.join(","));
  if (f.familyIds.length) p.set("familles", f.familyIds.join(","));
  if (f.interestIds.length) p.set("interets", f.interestIds.join(","));
  if (Object.keys(f.env).length) p.set("env", Object.keys(f.env).join(","));
  if (f.maxMonths !== null) p.set("mois", String(f.maxMonths));
  if (f.favoritesOnly) p.set("favoris", "1");
  if (s.sort !== "pertinence") p.set("tri", s.sort);
  if (s.category) p.set("cat", s.category);
  const out = p.toString();
  return out ? `?${out}` : "";
}

/** État de l’explorateur synchronisé avec l’URL (partageable, compatible bouton retour). */
export function useUrlExplorer() {
  const [state, setState] = useState<ExplorerState>(EMPTY_EXPLORER);
  const ready = useRef(false);

  useEffect(() => {
    setState(parseExplorer(window.location.search));
    ready.current = true;
  }, []);

  const update = useCallback((patch: Partial<ExplorerState>) => {
    setState((cur) => {
      const next = { ...cur, ...patch };
      if (ready.current) window.history.replaceState(null, "", `${window.location.pathname}${serializeExplorer(next)}`);
      return next;
    });
  }, []);

  return { state, update };
}
