"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Compass,
  Edit3,
  Lightbulb,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Recommendation, CareerDirection } from "@/types/recommendation";
import { CATEGORY_DESC, CATEGORY_LABEL } from "@/types/recommendation";
import { SECTOR_BY_ID } from "@/data/sectors/sectors";
import { OCCUPATION_BY_ID } from "@/data/occupations";
import { SKILL_BY_ID } from "@/data/taxonomy";
import { buildProfile } from "@/lib/assessment/profile-builder";
import { recommend } from "@/lib/assessment/recommendation-engine";
import { hashAnswers } from "@/lib/storage/local-storage";
import { useSession } from "@/lib/hooks/use-session";
import { btn, Badge, ButtonLink, Card, Container, Eyebrow, Meter } from "@/components/ui/primitives";
import { FavoriteButton, SectorBadges, TrainingLine } from "@/components/occupations/OccupationParts";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AbsenceExplorer } from "./AbsenceExplorer";
import { DataTools } from "./DataTools";
import { ResultsSummary } from "./ResultsSummary";

const fitTone = (fit: Recommendation["fit"]) =>
  fit === "Piste particulièrement intéressante" ? "brand" : fit === "Piste à explorer" ? "accent" : "warn";
const FIT_ICON = { brand: CheckCircle2, accent: Compass, warn: CircleHelp } as const;

function OccupationCard({
  rec,
  highlight,
  feedback,
  onFeedback,
}: {
  rec: Recommendation;
  highlight?: string;
  feedback?: 1 | -1;
  onFeedback?: (v: 1 | -1) => void;
}) {
  const occ = OCCUPATION_BY_ID[rec.occupationId];
  if (!occ) return null;
  const tone = fitTone(rec.fit);
  const Icon = FIT_ICON[tone];
  const warnings = rec.warnings.filter((w) => w.severity !== "info");
  return (
    <Card as="article" className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={tone} icon={<Icon aria-hidden className="h-3.5 w-3.5" />}>
          {rec.fit}
        </Badge>
        <Badge tone="neutral">{CATEGORY_LABEL[rec.category]}</Badge>
      </div>
      <div>
        <h3 className="text-xl font-bold">
          <Link href={`/metiers/${occ.id}/`} className="hover:text-brand hover:underline">
            {occ.name}
          </Link>
        </h3>
        <div className="mt-2">
          <SectorBadges occ={occ} />
        </div>
      </div>
      <p className="text-sm text-muted">{occ.description}</p>
      {highlight && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent">
          <Sparkles aria-hidden className="mr-1 inline h-4 w-4" />
          {highlight}
        </p>
      )}

      <div>
        <p className="text-sm font-semibold">Pourquoi cette piste ?</p>
        <ul className="mt-1 list-disc space-y-1.5 pl-5 text-sm">
          {rec.reasons
            .filter((r) => r.kind !== "context" && r.kind !== "training")
            .slice(0, 3)
            .map((r) => (
              <li key={r.text}>
                {r.text}
                {r.evidence.length > 0 && (
                  <span className="block text-xs text-muted">Vos réponses : {r.evidence.map((e) => `« ${e.label} »`).join(" ; ")}</span>
                )}
              </li>
            ))}
        </ul>
      </div>

      {warnings.length > 0 && (
        <div className="rounded-xl border border-warn/25 bg-warn-soft p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-warn">
            <AlertTriangle aria-hidden className="h-4 w-4" />À surveiller
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-warn">
            {warnings.slice(0, 3).map((w) => (
              <li key={w.text}>{w.text}</li>
            ))}
          </ul>
        </div>
      )}

      {rec.transferableSkills.length > 0 && (
        <p className="text-sm">
          <span className="font-semibold">Compétences transférables :</span>{" "}
          {rec.transferableSkills.map((s) => SKILL_BY_ID[s].label.toLowerCase()).join(", ")}
        </p>
      )}
      <TrainingLine occ={occ} />
      <p className="text-xs text-muted">
        <span className="font-semibold">{CATEGORY_LABEL[rec.category]} :</span> {rec.categoryReason}
      </p>

      <details className="group mt-auto rounded-xl border border-line">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold">
          <span>Détail, inconnues et vérifications</span>
          <ChevronDown aria-hidden className="h-4 w-4 transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 border-t border-line p-3 text-sm">
          <div>
            <p className="font-semibold">Indicateur exploratoire interne</p>
            <p className="mb-2 text-xs text-muted">
              Estimation calculée localement à partir de vos réponses : elle n’est pas validée scientifiquement et ne prédit ni votre
              réussite ni votre satisfaction. Fiabilité des données : {rec.evidenceConfidence}.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {rec.dimensions.map((d) => (
                <Meter key={d.id} value={d.score} label={d.label} caption={d.confidence < 0.35 ? "peu de données" : undefined} />
              ))}
            </div>
          </div>
          {rec.unknowns.length > 0 && (
            <div>
              <p className="font-semibold">Ce qui reste incertain</p>
              <ul className="list-disc pl-5">
                {rec.unknowns.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </div>
          )}
          {rec.warnings.some((w) => w.severity === "info") && (
            <div>
              <p className="font-semibold">Remarques</p>
              <ul className="list-disc pl-5">
                {rec.warnings
                  .filter((w) => w.severity === "info")
                  .map((w) => (
                    <li key={w.text}>{w.text}</li>
                  ))}
              </ul>
            </div>
          )}
          <div>
            <p className="font-semibold">À investiguer avant de décider</p>
            <ul className="list-disc pl-5">
              {rec.toInvestigate.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2">
        <FavoriteButton id={occ.id} name={occ.name} />
        {onFeedback && (
          <span className="no-print inline-flex items-center gap-1" role="group" aria-label={`Votre avis sur la piste ${occ.name}`}>
            <button
              type="button"
              aria-pressed={feedback === 1}
              onClick={() => onFeedback(1)}
              className={`inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-sm ${feedback === 1 ? "border-brand bg-brand-soft text-brand-dark" : "border-line text-muted hover:border-brand"}`}
            >
              <ThumbsUp aria-hidden className="h-4 w-4" />
              Me parle
            </button>
            <button
              type="button"
              aria-pressed={feedback === -1}
              onClick={() => onFeedback(-1)}
              className={`inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-sm ${feedback === -1 ? "border-danger bg-danger-soft text-danger" : "border-line text-muted hover:border-danger"}`}
            >
              <ThumbsDown aria-hidden className="h-4 w-4" />
              Pas pour moi
            </button>
          </span>
        )}
        <ButtonLink href={`/metiers/${occ.id}/`} variant="ghost" className="!min-h-10 !px-3">
          Voir la fiche
          <ArrowUpRight aria-hidden className="h-4 w-4" />
        </ButtonLink>
      </div>
    </Card>
  );
}

function DirectionCard({ d, index }: { d: CareerDirection; index: number }) {
  return (
    <Card as="article" className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-accent">Direction {index + 1}</p>
        <h3 className="text-xl font-bold">{d.title}</h3>
      </div>
      {d.why.length > 0 && (
        <div>
          <p className="text-sm font-semibold">Pourquoi elle apparaît</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
            {d.why.map((r) => (
              <li key={r.text}>{r.text}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold">Activités typiques</p>
          <ul className="mt-1 list-disc pl-5 text-muted">
            {d.activities.slice(0, 4).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold">Secteurs</p>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {d.sectorIds.map((s) => (
              <li key={s}>
                <Link href={`/secteurs/${s}/`}>
                  <Badge>{SECTOR_BY_ID[s]?.name ?? s}</Badge>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-semibold">Métiers représentatifs</p>
          <ul className="mt-1 list-disc pl-5">
            {d.occupationIds.map((id) => (
              <li key={id}>
                <Link href={`/metiers/${id}/`} className="text-brand underline underline-offset-4">
                  {OCCUPATION_BY_ID[id]?.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <p className="font-semibold text-brand-dark">Avantages possibles</p>
          <ul className="mt-1 list-disc pl-5">
            {d.advantages.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-semibold text-warn">Inconvénients possibles</p>
          <ul className="mt-1 list-disc pl-5">
            {d.drawbacks.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-sm">
        <span className="font-semibold">Formation :</span> {d.training}
      </p>
    </Card>
  );
}

function RealityCheck({ d }: { d: CareerDirection }) {
  const Block = ({ title, items }: { title: string; items: string[] }) =>
    items.length === 0 ? null : (
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    );
  return (
    <details className="group rounded-2xl border border-line bg-card">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 font-serif text-lg font-bold">
        <span>{d.title}</span>
        <ChevronDown aria-hidden className="h-5 w-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="grid gap-5 border-t border-line p-5 md:grid-cols-2">
        <Block title="Ce qui peut séduire" items={d.reality.attractive} />
        <Block title="Ce qui peut décevoir" items={d.reality.disappointing} />
        <Block title="Les plus grandes inconnues" items={d.reality.unknowns} />
        <Block
          title="Les contraintes principales"
          items={d.reality.constraints.length ? d.reality.constraints : ["Aucune contrainte forte détectée à partir de vos réponses."]}
        />
        <div className="md:col-span-2">
          <Block title="Questions à se poser avant de s’engager" items={d.reality.questions} />
        </div>
      </div>
    </details>
  );
}

export function ResultsView() {
  const { session, update, hydrated, eraseAll } = useSession();
  const [confirmErase, setConfirmErase] = useState(false);
  const setFeedback = (id: string, v: 1 | -1) =>
    update((s) => {
      const fb = { ...s.feedback };
      if (fb[id] === v) delete fb[id];
      else fb[id] = v;
      return { ...s, feedback: fb };
    });
  const profile = useMemo(
    () => buildProfile(session.onboarding, session.engine.answers, session.engine.asked),
    [session.onboarding, session.engine],
  );
  const results = useMemo(() => (profile.answeredCount > 0 ? recommend(profile) : null), [profile]);

  useEffect(() => {
    if (!hydrated || !results) return;
    const hash = hashAnswers(session);
    if (session.results?.answersHash === hash) return;
    // Le bilan précédent est conservé pour pouvoir comparer ce qui change quand on modifie ses réponses.
    update((s) => ({
      ...s,
      previousResults: s.results && s.results.answersHash !== hash ? s.results : s.previousResults,
      results: {
        generatedAt: results.generatedAt,
        answersHash: hash,
        occupationIds: results.recommendations.map((r) => r.occupationId),
        directionIds: results.directions.map((d) => d.familyId),
      },
    }));
  }, [hydrated, results, session, update]);

  if (!hydrated)
    return (
      <Container className="py-12">
        <p className="text-muted" role="status">
          Chargement de vos résultats…
        </p>
      </Container>
    );
  if (!results) {
    return (
      <Container narrow className="py-16 text-center">
        <Compass aria-hidden className="mx-auto h-10 w-10 text-accent" />
        <h1 className="mt-4 text-3xl font-bold">Pas encore de résultats</h1>
        <p className="mt-3 text-muted">
          Répondez à quelques questions pour obtenir des pistes personnalisées. Vous pouvez aussi explorer librement les métiers et les
          secteurs.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/bilan/">Commencer mon bilan</ButtonLink>
          <ButtonLink href="/metiers/" variant="secondary">
            Explorer les métiers
          </ButtonLink>
        </div>
      </Container>
    );
  }

  const s = results.summary;
  return (
    <Container className="py-10">
      <Eyebrow>Vos résultats</Eyebrow>
      <h1 className="text-3xl font-bold sm:text-4xl">Des pistes à explorer, pas un verdict</h1>
      <p className="mt-3 max-w-3xl text-muted">{results.notes.join(" ")}</p>
      <nav aria-label="Sections des résultats" className="no-print mt-5 flex flex-wrap gap-2 text-sm">
        {[
          ["resume", "En bref"],
          ["profil", "Votre profil"],
          ["directions", "Directions"],
          ["metiers", "Métiers"],
          ["decouvertes", "Découvertes"],
          ["realite", "Vérification"],
          ["etapes", "Prochaines étapes"],
        ].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line bg-card px-3 py-1.5 font-medium hover:border-brand">
            {l}
          </a>
        ))}
      </nav>

      <ResultsSummary results={results} previous={session.previousResults} />

      <section id="profil" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-bold">Votre profil professionnel</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="font-bold">Intérêts principaux</h3>
            {s.topInterests.length ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {s.topInterests.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-3">
                    <span>{i.label}</span>
                    <Badge tone={i.level === "fort" ? "brand" : "neutral"}>{i.level === "fort" ? "marqué" : "modéré"}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Pas assez d’éléments pour dégager des intérêts marqués.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-bold">Cadre de travail préféré</h3>
            {s.environment.length ? (
              <ul className="mt-2 space-y-1.5 text-sm">
                {s.environment.map((e) => (
                  <li key={e.id}>
                    <span className="font-medium">{e.label} :</span> {e.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Pas d’information.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-bold">Motivations</h3>
            {s.motivations.length ? (
              <ul className="mt-2 flex flex-wrap gap-2">
                {s.motivations.map((m) => (
                  <li key={m.id}>
                    <Badge tone={m.essential ? "accent" : "neutral"}>
                      {m.label}
                      {m.essential ? " · indispensable" : " · souhaitable"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Pas d’information.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-bold">Compétences</h3>
            {s.skills.length ? (
              <ul className="mt-2 space-y-1 text-sm">
                {s.skills.map((k) => (
                  <li key={k.id}>
                    {k.label} —{" "}
                    <span className="text-muted">
                      {k.status === "demonstrated" ? "démontrée par votre expérience" : "déclarée, à confirmer"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Compétences non établies : nous ne les inventons pas.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-bold">Points de blocage</h3>
            {s.dealBreakers.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {s.dealBreakers.map((b) => (
                  <li key={b.id}>{b.label}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted">Aucun point de blocage fort indiqué.</p>
            )}
          </Card>
          <Card>
            <h3 className="font-bold">Contraintes et incertitudes</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {[...s.constraints, ...s.uncertainties, ...s.contradictions.map((c) => `${c.title} — ${c.description}`)].map((t) => (
                <li key={t}>{t}</li>
              ))}
              {s.constraints.length + s.uncertainties.length + s.contradictions.length === 0 && (
                <li className="list-none text-muted">Rien de particulier à signaler.</li>
              )}
            </ul>
          </Card>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="/bilan/" variant="secondary" className="no-print">
            <Edit3 aria-hidden className="h-4 w-4" />
            Modifier mes réponses
          </ButtonLink>
        </div>
      </section>

      <section id="directions" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold">Directions professionnelles recommandées</h2>
        <p className="mt-1 text-sm text-muted">
          Des familles de métiers volontairement différentes, pour comparer des options plutôt que de vous enfermer dans une seule.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {results.directions.map((d, i) => (
            <DirectionCard key={d.familyId} d={d} index={i} />
          ))}
        </div>
      </section>

      <section id="metiers" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold">Métiers recommandés</h2>
        <details className="mt-2 text-sm text-muted">
          <summary className="cursor-pointer font-medium text-brand">Comment lire les catégories ?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {(Object.keys(CATEGORY_LABEL) as (keyof typeof CATEGORY_LABEL)[]).map((c) => (
              <li key={c}>
                <strong>{CATEGORY_LABEL[c]}</strong> — {CATEGORY_DESC[c]}
              </li>
            ))}
          </ul>
        </details>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {results.recommendations.map((r) => (
            <OccupationCard
              key={r.occupationId}
              rec={r}
              feedback={session.feedback?.[r.occupationId]}
              onFeedback={(v) => setFeedback(r.occupationId, v)}
            />
          ))}
        </div>
        <div className="mt-6">
          <AbsenceExplorer profile={profile} results={results} />
        </div>
      </section>

      <section id="decouvertes" className="mt-14 scroll-mt-24">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          <Lightbulb aria-hidden className="h-6 w-6 text-accent" />
          Découvertes inattendues
        </h2>
        <p className="mt-1 text-sm text-muted">
          Des métiers peu évidents au vu de votre parcours, qui correspondent pourtant à plusieurs de vos réponses.
        </p>
        {results.discoveries.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {results.discoveries.map((r) => (
              <OccupationCard
                key={r.occupationId}
                rec={r}
                highlight="Peu évident au vu de votre parcours, mais cohérent avec vos réponses."
              />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Aucune découverte suffisamment solide n’a été trouvée avec les réponses actuelles. Compléter le bilan ou parcourir l’
            <Link href="/metiers/" className="font-medium text-brand underline">
              explorateur de métiers
            </Link>{" "}
            peut aider.
          </p>
        )}
      </section>

      <section id="realite" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold">Vérification de la réalité</h2>
        <p className="mt-1 text-sm text-muted">
          Pour chaque direction : ce qui peut séduire, décevoir, ce qu’on ignore encore et les questions à régler avant de s’engager.
        </p>
        <div className="mt-4 space-y-3">
          {results.directions.map((d) => (
            <RealityCheck key={d.familyId} d={d} />
          ))}
        </div>
      </section>

      <section id="etapes" className="mt-14 scroll-mt-24">
        <h2 className="text-2xl font-bold">Vos prochaines étapes</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {results.nextSteps.map((st, i) => (
            <li key={st.id}>
              <Card className="!p-4 h-full">
                <p className="font-semibold">
                  <span className="mr-2 text-accent">{i + 1}.</span>
                  {st.title}
                </p>
                <p className="mt-1 text-sm text-muted">{st.detail}</p>
                {st.href &&
                  (st.external ? (
                    <a
                      href={st.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand underline underline-offset-4"
                    >
                      Ouvrir le site officiel
                      <ArrowUpRight aria-hidden className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      href={st.href}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-brand underline underline-offset-4"
                    >
                      Ouvrir
                      <ArrowUpRight aria-hidden className="h-4 w-4" />
                    </Link>
                  ))}
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14 space-y-4 border-t border-line pt-6">
        <DataTools session={session} />
        <div className="no-print">
          <p className="text-sm text-muted">
            Ces résultats sont calculés dans votre navigateur et enregistrés uniquement sur votre appareil. Vos avis (« Me parle », « Pas
            pour moi ») restent des notes personnelles : ils ne modifient pas le calcul.
          </p>
          <button className={btn("danger", "mt-3")} onClick={() => setConfirmErase(true)}>
            <Trash2 aria-hidden className="h-4 w-4" />
            Effacer mes données
          </button>
        </div>
        <ConfirmDialog
          open={confirmErase}
          title="Effacer toutes vos données ?"
          message="Vos réponses, résultats, avis et favoris seront supprimés de cet appareil. Cette action est définitive : pensez à exporter votre bilan avant."
          confirmLabel="Tout effacer"
          onCancel={() => setConfirmErase(false)}
          onConfirm={() => {
            eraseAll();
            setConfirmErase(false);
          }}
        />
      </section>
    </Container>
  );
}
