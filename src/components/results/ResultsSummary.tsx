import Link from "next/link";
import { GitCompare, Star } from "lucide-react";
import type { Results } from "@/types/recommendation";
import { CATEGORY_LABEL } from "@/types/recommendation";
import type { StoredResultsMeta } from "@/lib/storage/migrations";
import { OCCUPATION_BY_ID } from "@/data/occupations";
import { Badge, Card } from "@/components/ui/primitives";

const name = (id: string) => OCCUPATION_BY_ID[id]?.name ?? id;

/** « En bref » : trois pistes, directions en une ligne, et ce qui a changé depuis le bilan précédent. */
export function ResultsSummary({ results, previous }: { results: Results; previous?: StoredResultsMeta }) {
  const top = results.recommendations.slice(0, 3);
  const currentIds = results.recommendations.map((r) => r.occupationId);
  const added = previous ? currentIds.filter((id) => !previous.occupationIds.includes(id)) : [];
  const dropped = previous ? previous.occupationIds.filter((id) => !currentIds.includes(id) && OCCUPATION_BY_ID[id]) : [];
  return (
    <section id="resume" aria-labelledby="resume-title" className="mt-8 scroll-mt-24">
      <h2 id="resume-title" className="flex items-center gap-2 text-2xl font-bold">
        <Star aria-hidden className="h-6 w-6 text-accent" />
        En bref
      </h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h3 className="font-bold">Vos trois pistes les plus solides</h3>
          <ol className="mt-3 space-y-3">
            {top.map((r, i) => {
              const reason = r.reasons.find((x) => x.kind === "interest" || x.kind === "environment" || x.kind === "motivation");
              return (
                <li key={r.occupationId} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white"
                  >
                    {i + 1}
                  </span>
                  <div className="text-sm">
                    <p className="font-semibold">
                      <Link href={`/metiers/${r.occupationId}/`} className="text-brand underline underline-offset-4">
                        {name(r.occupationId)}
                      </Link>
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge tone="brand">{r.fit}</Badge>
                      <Badge>{CATEGORY_LABEL[r.category]}</Badge>
                    </div>
                    {reason && <p className="mt-1 text-muted">{reason.text}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
        <Card>
          <h3 className="font-bold">Directions explorées</h3>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm">
            {results.directions.map((d) => (
              <li key={d.familyId}>
                <a href="#directions" className="text-brand underline underline-offset-4">
                  {d.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {previous && (added.length > 0 || dropped.length > 0) && (
        <Card className="mt-4">
          <h3 className="flex items-center gap-2 font-bold">
            <GitCompare aria-hidden className="h-5 w-5 text-accent" />
            Ce qui a changé depuis votre bilan précédent
          </h3>
          <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold text-brand-dark">Nouvelles pistes</p>
              {added.length ? (
                <ul className="mt-1 list-disc pl-5">
                  {added.map((id) => (
                    <li key={id}>{name(id)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted">Aucune.</p>
              )}
            </div>
            <div>
              <p className="font-semibold text-warn">Pistes qui ont disparu</p>
              {dropped.length ? (
                <ul className="mt-1 list-disc pl-5">
                  {dropped.map((id) => (
                    <li key={id}>{name(id)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted">Aucune.</p>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">Comparaison avec les résultats calculés avant votre dernière modification de réponses.</p>
        </Card>
      )}
    </section>
  );
}
