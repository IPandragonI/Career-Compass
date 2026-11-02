"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { OCCUPATION_BY_ID } from "@/data/occupations";
import { useFavorites } from "@/lib/hooks/use-session";
import { ButtonLink, Card, Container } from "@/components/ui/primitives";
import { FavoriteButton, SectorBadges, TrainingLine } from "./OccupationParts";

export function FavoritesList() {
  const { ids } = useFavorites();
  const occs = ids.map((id) => OCCUPATION_BY_ID[id]).filter((o): o is NonNullable<typeof o> => !!o);
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Mes favoris</h1>
      <p className="mt-2 text-muted">Les métiers que vous avez enregistrés, conservés sur cet appareil.</p>
      {occs.length === 0 ? (
        <Card className="mt-6 text-center"><Heart aria-hidden className="mx-auto h-8 w-8 text-accent" /><p className="mt-3 font-semibold">Aucun favori pour l’instant</p><p className="mt-1 text-sm text-muted">Enregistrez des métiers depuis vos résultats ou l’explorateur.</p><div className="mt-4"><ButtonLink href="/metiers/">Explorer les métiers</ButtonLink></div></Card>
      ) : (
        <ul className="mt-6 grid gap-3 md:grid-cols-2">{occs.map((o) => <li key={o.id}><Card as="article" className="!p-4 flex h-full flex-col gap-2"><h2 className="text-lg font-bold"><Link href={`/metiers/${o.id}/`} className="hover:text-brand hover:underline">{o.name}</Link></h2><SectorBadges occ={o} /><p className="line-clamp-2 text-sm text-muted">{o.description}</p><TrainingLine occ={o} /><div className="mt-auto pt-2"><FavoriteButton id={o.id} name={o.name} /></div></Card></li>)}</ul>
      )}
    </Container>
  );
}
