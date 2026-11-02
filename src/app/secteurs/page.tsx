import type { Metadata } from "next";
import { SECTORS } from "@/data/sectors/sectors";
import { SectorCard } from "@/components/sectors/SectorCard";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Secteurs professionnels" };

export default function SecteursPage() {
  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Secteurs professionnels</h1>
      <p className="mt-2 max-w-3xl text-muted">Parcourez un univers avant de regarder les métiers un par un. Un même métier peut appartenir à plusieurs secteurs.</p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{SECTORS.map((s) => <li key={s.id}><SectorCard sector={s} /></li>)}</ul>
    </Container>
  );
}
