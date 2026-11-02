"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import type { Occupation } from "@/types/occupation";
import { ENTRY_LEVEL_LABEL } from "@/types/occupation";
import { ENV_DIMS } from "@/data/taxonomy";
import { SECTOR_BY_ID } from "@/data/sectors/sectors";
import { formatMonths } from "@/lib/format";
import { useFavorites } from "@/lib/hooks/use-session";
import { Badge } from "@/components/ui/primitives";

export function FavoriteButton({ id, name }: { id: string; name: string }) {
  const { ids, toggle } = useFavorites();
  const on = ids.includes(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={on ? `Retirer ${name} des favoris` : `Ajouter ${name} aux favoris`}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-full border px-3 text-sm font-medium ${on ? "border-accent bg-accent-soft text-accent" : "border-line bg-card text-muted hover:border-accent hover:text-accent"}`}
    >
      <Heart aria-hidden className="h-4 w-4" fill={on ? "currentColor" : "none"} />
      <span>{on ? "Enregistré" : "Enregistrer"}</span>
    </button>
  );
}

export function SectorBadges({ occ, limit = 3 }: { occ: Occupation; limit?: number }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Secteurs">
      {occ.sectorIds.slice(0, limit).map((s) => (
        <li key={s}>
          <Link href={`/secteurs/${s}/`}>
            <Badge>{SECTOR_BY_ID[s]?.name ?? s}</Badge>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TrainingLine({ occ }: { occ: Occupation }) {
  return (
    <p className="text-sm text-muted">
      <span className="font-medium text-ink">{ENTRY_LEVEL_LABEL[occ.training.typicalLevel]}</span> · formation estimée :{" "}
      {formatMonths(occ.training.months)} <span className="text-xs">(estimation éditoriale)</span>
    </p>
  );
}

const LEVELS = ["négligeable", "marginal", "significatif", "important", "dominant"];

/** Barres de conditions de travail : la valeur est toujours écrite, et « inconnu » n’est jamais affiché comme 0. */
export function EnvBars({ occ }: { occ: Occupation }) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
      {ENV_DIMS.map((d) => {
        const v = occ.workEnvironment[d.id];
        return (
          <div key={d.id}>
            <dt className="flex justify-between text-sm">
              <span>{d.label}</span>
              <span className="font-semibold">{v === null ? "inconnu" : LEVELS[v]}</span>
            </dt>
            <dd className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
              {v === null ? (
                <div className="h-full w-full bg-[repeating-linear-gradient(45deg,var(--color-line),var(--color-line)_4px,transparent_4px,transparent_8px)]" />
              ) : (
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.max(4, (v / 4) * 100)}%` }} />
              )}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}
