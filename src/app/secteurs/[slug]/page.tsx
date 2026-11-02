import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SECTORS, SECTOR_BY_ID } from "@/data/sectors/sectors";
import { OCCUPATIONS } from "@/data/occupations";
import { INTEREST_BY_ID, SKILL_BY_ID } from "@/data/taxonomy";
import { Badge, Card, Container } from "@/components/ui/primitives";
import { TrainingLine } from "@/components/occupations/OccupationParts";

export const dynamicParams = false;
export function generateStaticParams() {
  return SECTORS.map((s) => ({ slug: s.id }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: SECTOR_BY_ID[slug]?.name ?? "Secteur", description: SECTOR_BY_ID[slug]?.description };
}

export default async function SectorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = SECTOR_BY_ID[slug];
  if (!s) notFound();
  const occs = OCCUPATIONS.filter((o) => o.sectorIds.includes(s.id));
  return (
    <Container className="py-10">
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
        <Link href="/secteurs/" className="underline underline-offset-4">
          Secteurs
        </Link>
      </nav>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{s.name}</h1>
      <p className="mt-3 max-w-3xl text-lg">{s.description}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Activités courantes</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {s.activities.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <h3 className="mt-4 font-semibold">Sous-secteurs</h3>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {s.subsectors.map((x) => (
              <li key={x.id}>
                <Badge>{x.name}</Badge>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Profils qui s’y retrouvent</h2>
          <p className="mt-2 text-sm font-semibold">Intérêts</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {s.interests.map((i) => (
              <li key={i}>
                <Badge tone="brand">{INTEREST_BY_ID[i].label}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold">Compétences</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {s.skills.map((i) => (
              <li key={i}>
                <Badge>{SKILL_BY_ID[i].label}</Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-semibold">Cadre typique</p>
          <p className="text-sm text-muted">{s.environment}</p>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Contraintes connues</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {s.constraints.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Idées reçues</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {s.misconceptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </Card>
      </div>
      <h2 className="mt-10 text-2xl font-bold">Métiers de ce secteur ({occs.length})</h2>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {occs.map((o) => (
          <li key={o.id}>
            <Card as="article" className="!p-4 h-full">
              <h3 className="text-lg font-bold">
                <Link href={`/metiers/${o.id}/`} className="hover:text-brand hover:underline">
                  {o.name}
                </Link>
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{o.description}</p>
              <div className="mt-2">
                <TrainingLine occ={o} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted">
        Description éditoriale du secteur, à recouper avec les sources officielles (voir « Méthode et sources »).
      </p>
    </Container>
  );
}
