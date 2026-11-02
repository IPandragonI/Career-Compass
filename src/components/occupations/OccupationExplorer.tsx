"use client";

import { GitCompareArrows, Search, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Occupation } from "@/types/occupation";
import { CATEGORY_LABEL, type TransitionCategory } from "@/types/recommendation";
import { FAMILIES, INTERESTS, type InterestId } from "@/data/taxonomy";
import { OCCUPATIONS } from "@/data/occupations";
import { SECTORS } from "@/data/sectors/sectors";
import { buildProfile } from "@/lib/assessment/profile-builder";
import { classifyTransition, scoreOccupation } from "@/lib/assessment/scoring";
import { EMPTY_FILTERS, searchOccupations, type OccupationFilters } from "@/lib/data/search";
import { useCompare, useFavorites, useSession } from "@/lib/hooks/use-session";
import { btn, Badge, Card, Container } from "@/components/ui/primitives";
import { EnvBars, FavoriteButton, SectorBadges, TrainingLine } from "./OccupationParts";
import { inputClass } from "@/components/ui/choices";

const ENV_TOGGLES = [
  { id: "fieldwork", label: "Beaucoup de terrain" },
  { id: "physicalActivity", label: "Activité physique" },
  { id: "publicInteraction", label: "Contact avec le public" },
  { id: "teamwork", label: "Travail d’équipe" },
  { id: "technicalWork", label: "Très technique" },
  { id: "analyticalWork", label: "Très analytique" },
] as const;

const TRAINING_FILTERS = [
  { id: "", label: "Toutes durées", months: null },
  { id: "6", label: "6 mois ou moins", months: 6 },
  { id: "12", label: "1 an ou moins", months: 12 },
  { id: "24", label: "2 ans ou moins", months: 24 },
  { id: "36", label: "3 ans ou moins", months: 36 },
];

export function OccupationExplorer() {
  const [f, setF] = useState<OccupationFilters>(EMPTY_FILTERS);
  const [cat, setCat] = useState<TransitionCategory | "">("");
  const favs = useFavorites();
  const cmp = useCompare();
  const { session, hydrated } = useSession();

  const categories = useMemo(() => {
    if (!hydrated || Object.keys(session.engine.answers).length === 0) return null;
    const p = buildProfile(session.onboarding, session.engine.answers, session.engine.asked);
    const map = new Map<string, TransitionCategory>();
    for (const o of OCCUPATIONS) { const s = scoreOccupation(p, o); map.set(o.id, classifyTransition(p, s).category); }
    return map;
  }, [hydrated, session]);

  const list = useMemo(() => {
    let r = searchOccupations(OCCUPATIONS, f, favs.ids);
    if (cat && categories) r = r.filter((o) => categories.get(o.id) === cat);
    return r;
  }, [f, cat, categories, favs.ids]);

  const set = (patch: Partial<OccupationFilters>) => setF((cur) => ({ ...cur, ...patch }));
  const toggleIn = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const active = f.sectorIds.length + f.interestIds.length + f.familyIds.length + Object.keys(f.env).length + (f.maxMonths !== null ? 1 : 0) + (f.favoritesOnly ? 1 : 0) + (cat ? 1 : 0);
  const compared = cmp.ids.map((id) => OCCUPATIONS.find((o) => o.id === id)).filter((o): o is Occupation => !!o);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-bold sm:text-4xl">Explorer les métiers</h1>
      <p className="mt-2 max-w-3xl text-muted">{OCCUPATIONS.length} fiches rédigées à partir des repères de référentiels publics. Elles sont indépendantes de votre bilan : explorez librement.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[18rem_1fr]">
        <aside aria-label="Filtres" className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div>
            <label htmlFor="q" className="mb-1 block text-sm font-semibold">Recherche</label>
            <div className="relative"><Search aria-hidden className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" /><input id="q" type="search" className={`${inputClass} pl-9`} placeholder="Métier, tâche, secteur…" value={f.query} onChange={(e) => set({ query: e.target.value })} /></div>
          </div>
          <details open className="rounded-xl border border-line bg-card p-3"><summary className="cursor-pointer text-sm font-semibold">Secteurs</summary>
            <ul className="mt-2 max-h-56 space-y-1 overflow-auto pr-1 text-sm">{SECTORS.map((s) => <li key={s.id}><label className="flex min-h-9 cursor-pointer items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={f.sectorIds.includes(s.id)} onChange={() => set({ sectorIds: toggleIn(f.sectorIds, s.id) })} />{s.name}</label></li>)}</ul></details>
          <details className="rounded-xl border border-line bg-card p-3"><summary className="cursor-pointer text-sm font-semibold">Familles de métiers</summary>
            <ul className="mt-2 max-h-56 space-y-1 overflow-auto pr-1 text-sm">{FAMILIES.map((s) => <li key={s.id}><label className="flex min-h-9 cursor-pointer items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={f.familyIds.includes(s.id)} onChange={() => set({ familyIds: toggleIn(f.familyIds, s.id) })} />{s.label}</label></li>)}</ul></details>
          <details className="rounded-xl border border-line bg-card p-3"><summary className="cursor-pointer text-sm font-semibold">Centres d’intérêt</summary>
            <ul className="mt-2 space-y-1 text-sm">{INTERESTS.map((s) => <li key={s.id}><label className="flex min-h-9 cursor-pointer items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={f.interestIds.includes(s.id as InterestId)} onChange={() => set({ interestIds: toggleIn(f.interestIds, s.id as InterestId) })} />{s.label}</label></li>)}</ul></details>
          <fieldset className="rounded-xl border border-line bg-card p-3"><legend className="px-1 text-sm font-semibold">Conditions de travail (au moins « important »)</legend>
            <ul className="space-y-1 text-sm">{ENV_TOGGLES.map((t) => <li key={t.id}><label className="flex min-h-9 cursor-pointer items-center gap-2"><input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={f.env[t.id] !== undefined} onChange={() => { const env = { ...f.env }; if (env[t.id] !== undefined) delete env[t.id]; else env[t.id] = 3; set({ env }); }} />{t.label}</label></li>)}</ul></fieldset>
          <div>
            <label htmlFor="train" className="mb-1 block text-sm font-semibold">Durée de formation</label>
            <select id="train" className={inputClass} value={f.maxMonths === null ? "" : String(f.maxMonths)} onChange={(e) => set({ maxMonths: e.target.value ? Number(e.target.value) : null })}>{TRAINING_FILTERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select>
            <p className="mt-1 text-xs text-muted">Les métiers à durée inconnue restent affichés.</p>
          </div>
          {categories && (
            <div>
              <label htmlFor="cat" className="mb-1 block text-sm font-semibold">Catégorie de transition (selon votre bilan)</label>
              <select id="cat" className={inputClass} value={cat} onChange={(e) => setCat(e.target.value as TransitionCategory | "")}><option value="">Toutes</option>{(Object.keys(CATEGORY_LABEL) as TransitionCategory[]).map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}</select>
            </div>
          )}
          <label className="flex min-h-10 cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={f.favoritesOnly} onChange={() => set({ favoritesOnly: !f.favoritesOnly })} />Mes favoris uniquement</label>
          {active > 0 && <button className={btn("secondary", "w-full")} onClick={() => { setF({ ...EMPTY_FILTERS, query: f.query }); setCat(""); }}><X aria-hidden className="h-4 w-4" />Réinitialiser {active} filtre{active > 1 ? "s" : ""}</button>}
        </aside>

        <section aria-label="Résultats">
          <p className="mb-3 text-sm text-muted" role="status" aria-live="polite">{list.length} métier{list.length > 1 ? "s" : ""}</p>
          {list.length === 0 ? (
            <Card className="text-center"><p className="font-semibold">Aucun métier ne correspond à ces critères.</p><p className="mt-1 text-sm text-muted">Essayez de retirer un filtre ou de simplifier la recherche.</p></Card>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {list.map((o) => (
                <li key={o.id}><Card as="article" className="flex h-full flex-col gap-2 !p-4">
                  <h2 className="text-lg font-bold"><Link href={`/metiers/${o.id}/`} className="hover:text-brand hover:underline">{o.name}</Link></h2>
                  <SectorBadges occ={o} limit={2} />
                  {categories && <div><Badge tone="neutral">{CATEGORY_LABEL[categories.get(o.id) ?? "nouvelle"]}</Badge></div>}
                  <p className="line-clamp-3 text-sm text-muted">{o.description}</p>
                  <TrainingLine occ={o} />
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <FavoriteButton id={o.id} name={o.name} />
                    <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-line px-3 text-sm"><input type="checkbox" className="h-4 w-4 accent-[var(--color-brand)]" checked={cmp.ids.includes(o.id)} onChange={() => cmp.toggle(o.id)} /><GitCompareArrows aria-hidden className="h-4 w-4" />Comparer</label>
                  </div>
                </Card></li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {compared.length > 0 && (
        <section aria-label="Comparaison" className="mt-12 border-t border-line pt-8">
          <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Comparaison ({compared.length}/3)</h2><button className={btn("ghost")} onClick={cmp.clear}>Vider</button></div>
          {compared.length < 2 && <p className="mt-2 text-sm text-muted">Sélectionnez au moins un autre métier pour comparer.</p>}
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {compared.map((o) => (
              <Card key={o.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2"><h3 className="text-lg font-bold"><Link href={`/metiers/${o.id}/`} className="hover:underline">{o.name}</Link></h3><button className="rounded-full p-1.5 hover:bg-line" onClick={() => cmp.toggle(o.id)} aria-label={`Retirer ${o.name} de la comparaison`}><X aria-hidden className="h-4 w-4" /></button></div>
                <SectorBadges occ={o} />
                <TrainingLine occ={o} />
                <EnvBars occ={o} />
                <div><p className="text-sm font-semibold">Tâches</p><ul className="list-disc pl-5 text-sm text-muted">{o.dailyTasks.map((t) => <li key={t}>{t}</li>)}</ul></div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
