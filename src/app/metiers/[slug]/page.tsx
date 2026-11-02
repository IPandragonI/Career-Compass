import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, ShieldQuestion } from "lucide-react";
import { OCCUPATIONS, OCCUPATION_BY_ID } from "@/data/occupations";
import { SECTOR_BY_ID } from "@/data/sectors/sectors";
import { SOURCE_BY_ID, DATASET_VERSION } from "@/data/sources";
import {
  CONSTRAINT_BY_ID,
  FAMILY_BY_ID,
  INTEREST_BY_ID,
  MOTIVATION_BY_ID,
  SKILL_BY_ID,
  type ConstraintId,
  type InterestId,
} from "@/data/taxonomy";
import { ENTRY_LEVEL_LABEL } from "@/types/occupation";
import { formatDate, formatMonths } from "@/lib/format";
import { Badge, Card, Container } from "@/components/ui/primitives";
import { EnvBars, FavoriteButton, SectorBadges } from "@/components/occupations/OccupationParts";

export const dynamicParams = false;
export function generateStaticParams() {
  return OCCUPATIONS.map((o) => ({ slug: o.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = OCCUPATION_BY_ID[slug];
  return { title: o?.name ?? "Métier", description: o?.description };
}

const PROV: Record<string, string> = {
  classification: "Repère éditorial",
  editorial: "Rédaction éditoriale",
  estimated: "Estimation à vérifier",
};

export default async function OccupationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = OCCUPATION_BY_ID[slug];
  if (!o) notFound();
  const related = o.relatedOccupationIds.map((id) => OCCUPATION_BY_ID[id]).filter((x): x is NonNullable<typeof x> => !!x);
  const constraints = Object.entries(o.constraints);
  return (
    <Container className="py-10">
      <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
        <Link href="/metiers/" className="underline underline-offset-4">
          Métiers
        </Link>{" "}
        › {FAMILY_BY_ID[o.familyId].label}
      </nav>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">{o.name}</h1>
          <div className="mt-3">
            <SectorBadges occ={o} limit={5} />
          </div>
        </div>
        <FavoriteButton id={o.id} name={o.name} />
      </div>
      <p className="mt-5 max-w-3xl text-lg">{o.description}</p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Card as="section">
            <h2 className="text-xl font-bold">Une journée type : tâches courantes</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5">
              {o.dailyTasks.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
          <Card as="section">
            <h2 className="text-xl font-bold">Conditions de travail</h2>
            <p className="mb-3 mt-1 text-sm text-muted">
              Échelle de « négligeable » à « dominant ». « Inconnu » signifie que l’information manque, pas que la valeur est nulle.
              Estimations éditoriales.
            </p>
            <EnvBars occ={o} />
            {constraints.length > 0 && (
              <div className="mt-4">
                <p className="font-semibold">Conditions difficiles (estimation éditoriale)</p>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {(constraints as [ConstraintId, string][]).map(([k, v]) => (
                    <li key={k}>
                      {CONSTRAINT_BY_ID[k]?.label ?? k} : <strong>{v === "yes" ? "oui" : v === "sometimes" ? "parfois" : "non"}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
          <Card as="section">
            <h2 className="text-xl font-bold">Formation et voies d’accès</h2>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-semibold">Niveau d’entrée courant</dt>
                <dd>{ENTRY_LEVEL_LABEL[o.training.typicalLevel]}</dd>
              </div>
              <div>
                <dt className="font-semibold">Niveau minimal observé</dt>
                <dd>{ENTRY_LEVEL_LABEL[o.training.minLevel]}</dd>
              </div>
              <div>
                <dt className="font-semibold">Durée depuis zéro (estimation)</dt>
                <dd>{formatMonths(o.training.months)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Alternance</dt>
                <dd>
                  {o.training.workStudyPossible === null
                    ? "À vérifier"
                    : o.training.workStudyPossible
                      ? "Souvent possible"
                      : "Peu courante"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 font-semibold">Voies courantes</p>
            <ul className="list-disc pl-5 text-sm">
              {o.training.routes.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            {o.training.prerequisites.length > 0 && (
              <>
                <p className="mt-3 font-semibold">Prérequis</p>
                <ul className="list-disc pl-5 text-sm">
                  {o.training.prerequisites.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            )}
          </Card>
          {o.careerPaths.length > 0 && (
            <Card as="section">
              <h2 className="text-xl font-bold">Évolutions possibles</h2>
              <ul className="mt-3 list-disc pl-5">
                {o.careerPaths.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card as="section">
            <h2 className="text-xl font-bold">Intérêts et compétences</h2>
            <p className="mt-3 text-sm font-semibold">Intérêts associés</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {(Object.entries(o.interestTags) as [InterestId, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([k, w]) => (
                  <li key={k}>
                    <Badge tone={w === 3 ? "brand" : "neutral"}>{INTEREST_BY_ID[k].label}</Badge>
                  </li>
                ))}
            </ul>
            <p className="mt-4 text-sm font-semibold">Compétences utiles</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {o.skillTags.map((k) => (
                <li key={k}>
                  <Badge>{SKILL_BY_ID[k].label}</Badge>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm font-semibold">Ce que ce métier peut apporter</p>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {o.motivationTags.map((k) => (
                <li key={k}>
                  <Badge tone="accent">{MOTIVATION_BY_ID[k].label}</Badge>
                </li>
              ))}
            </ul>
          </Card>
          <Card as="section">
            <h2 className="text-xl font-bold">Rémunération et stabilité</h2>
            <p className="mt-2 text-sm text-muted">
              Nous n’affichons pas de fourchette de salaire précise : aucune donnée fiable n’est intégrée au jeu de données. Indication
              relative, éditoriale :
            </p>
            <ul className="mt-2 text-sm">
              <li>
                Rémunération typique : {o.earnings === null ? "inconnue" : ["", "plutôt modeste", "moyenne", "plutôt élevée"][o.earnings]}
              </li>
              <li>
                Stabilité de l’emploi :{" "}
                {o.stability === null ? "inconnue" : ["", "souvent peu stable", "moyenne", "plutôt forte"][o.stability]}
              </li>
            </ul>
          </Card>
          {related.length > 0 && (
            <Card as="section">
              <h2 className="text-xl font-bold">Métiers proches</h2>
              <ul className="mt-3 space-y-1.5">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/metiers/${r.id}/`} className="text-brand underline underline-offset-4">
                      {r.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
          <Card as="section">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <ShieldQuestion aria-hidden className="h-5 w-5 text-accent" />
              Sources et fiabilité
            </h2>
            <dl className="mt-3 space-y-1.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt>Classification</dt>
                <dd>{PROV[o.provenance.classification]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Description</dt>
                <dd>{PROV[o.provenance.description]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Conditions de travail</dt>
                <dd>{PROV[o.provenance.environment]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Formation</dt>
                <dd>{PROV[o.provenance.training]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Dernière vérification</dt>
                <dd>{formatDate(o.lastVerifiedAt)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Confiance</dt>
                <dd>{o.confidence}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Jeu de données</dt>
                <dd>{DATASET_VERSION}</dd>
              </div>
            </dl>
            <ul className="mt-3 space-y-1.5 text-sm">
              {o.sourceReferences.map((r, i) => {
                const s = SOURCE_BY_ID[r.sourceId];
                const href = r.url ?? s?.url;
                return (
                  <li key={i}>
                    {href && href.startsWith("http") ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand underline underline-offset-4"
                      >
                        {r.note ?? s?.name}
                        <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span>{r.note ?? s?.name}</span>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Ces informations sont éditoriales : vérifiez-les auprès des sources officielles avant toute décision.
            </p>
          </Card>
        </div>
      </div>
      <p className="mt-8 text-sm">
        Secteurs :{" "}
        {o.sectorIds.map((s, i) => (
          <span key={s}>
            {i > 0 && ", "}
            <Link href={`/secteurs/${s}/`} className="text-brand underline underline-offset-4">
              {SECTOR_BY_ID[s]?.name}
            </Link>
          </span>
        ))}
      </p>
    </Container>
  );
}
