import Link from "next/link";
import type { Sector } from "@/types/occupation";
import { OCCUPATIONS } from "@/data/occupations";
import { Card } from "@/components/ui/primitives";

export function SectorCard({ sector }: { sector: Sector }) {
  const occs = OCCUPATIONS.filter((o) => o.sectorIds.includes(sector.id));
  return (
    <Card as="article" className="flex h-full flex-col gap-2">
      <h2 className="text-lg font-bold">
        <Link href={`/secteurs/${sector.id}/`} className="hover:text-brand hover:underline">
          {sector.name}
        </Link>
      </h2>
      <p className="text-sm text-muted">{sector.description}</p>
      <p className="mt-auto pt-2 text-sm font-medium">
        {occs.length} métier{occs.length > 1 ? "s" : ""} · {sector.subsectors.length} sous-secteurs
      </p>
    </Card>
  );
}
