"use client";

import { ArrowLeft, ArrowRight, Check, Clock, Info, Pause, SkipForward } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Answer, AversionLevel, Question, QuestionContext } from "@/types/assessment";
import { AVERSION_LABEL, DIMENSION_LABEL, type DimensionId } from "@/types/assessment";
import type { StoredSession } from "@/lib/storage/migrations";
import { QUESTION_BY_ID } from "@/data/assessment";
import { changeAnswer, nextQuestion, progressInfo, questionOptions, questionPrompt, recordAnswer } from "@/lib/assessment/adaptive-engine";
import { buildProfile, COVERAGE_TARGET } from "@/lib/assessment/profile-builder";
import { btn, Card } from "@/components/ui/primitives";
import { ChoiceGroup, inputClass } from "@/components/ui/choices";

const STAGES: DimensionId[] = ["interets", "quotidien", "environnement", "motivations", "competences", "transition", "aversions"];

/** Mélange déterministe (même ordre à chaque rendu pour une même session et une même question). */
function seededShuffle<T>(items: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)), ((h >>> 0) % 10000) / 10000);
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; }
  return a;
}

export function describeAnswer(q: Question, a: Answer | undefined, ctx: QuestionContext): string {
  if (!a || a.kind === "skipped") return "Question passée";
  const opts = questionOptions(q, ctx);
  if (a.kind === "single") return opts.find((o) => o.id === a.value)?.label ?? "—";
  if (a.kind === "multi") return a.values.map((v) => opts.find((o) => o.id === v)?.label ?? v).join(" · ") || "—";
  if (a.kind === "text") return a.text || "—";
  return `${Object.keys(a.values).length} points renseignés`;
}

function QuestionBody({ question, ctx, initial, seed, canSkip, onSubmit, onSkip, onBack, backLabel }: {
  question: Question; ctx: QuestionContext; initial?: Answer; seed: string; canSkip: boolean;
  onSubmit: (a: Answer) => void; onSkip: () => void; onBack: () => void; backLabel: string;
}) {
  const options = useMemo(() => {
    const raw = questionOptions(question, ctx);
    if (!question.shuffle) return raw;
    const fixed = raw.filter((o) => o.exclusive);
    return [...seededShuffle(raw.filter((o) => !o.exclusive), seed + question.id), ...fixed];
  }, [question, ctx, seed]);

  const [sel, setSel] = useState<string[]>(initial?.kind === "single" ? [initial.value] : initial?.kind === "multi" ? initial.values : []);
  const [matrix, setMatrix] = useState<Partial<Record<string, AversionLevel>>>(initial?.kind === "matrix" ? initial.values : {});
  const [text, setText] = useState(initial?.kind === "text" ? initial.text : "");

  const kind = question.kind;
  const valid = kind === "text" ? true : kind === "matrix" ? (question.items ?? []).every((i) => matrix[i.id] !== undefined) : sel.length > 0;
  const submit = () => {
    if (!valid) return;
    if (kind === "matrix") onSubmit({ kind: "matrix", values: matrix });
    else if (kind === "text") text.trim() ? onSubmit({ kind: "text", text: text.trim() }) : onSkip();
    else if (kind === "multi") onSubmit({ kind: "multi", values: sel });
    else onSubmit({ kind: "single", value: sel[0]! });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" && (t as HTMLInputElement).type === "text" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (!/^[1-9]$/.test(e.key) || (kind !== "single" && kind !== "multi" && kind !== "forced" && kind !== "scale")) return;
      const o = options[Number(e.key) - 1];
      if (!o) return;
      if (kind === "multi") setSel((cur) => (cur.includes(o.id) ? cur.filter((x) => x !== o.id) : question.maxSelect && cur.length >= question.maxSelect ? cur : o.exclusive ? [o.id] : [...cur.filter((x) => !options.find((p) => p.id === x)?.exclusive), o.id]));
      else setSel([o.id]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [options, kind, question.maxSelect]);

  const choiceOptions = options.map((o) => ({ id: o.id, label: o.label, hint: o.hint }));
  const onMulti = (v: string[]) => {
    const exclusive = options.filter((o) => o.exclusive).map((o) => o.id);
    const added = v.find((x) => !sel.includes(x));
    if (added && exclusive.includes(added)) return setSel([added]);
    setSel(v.filter((x) => !exclusive.includes(x) || v.length === 1));
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="enter">
      <Card>
        <h2 className="text-xl font-bold leading-snug sm:text-2xl" id="q-title">{questionPrompt(question, ctx)}</h2>
        {question.help && <p className="mt-2 text-sm text-muted">{question.help}</p>}
        <div className="mt-6" aria-labelledby="q-title">
          {kind === "forced" && (
            <ChoiceGroup legend="Votre choix" hideLegend name={question.id} value={sel} onChange={setSel} options={choiceOptions} columns={2} />
          )}
          {(kind === "single" || kind === "scale") && (
            <ChoiceGroup legend="Votre choix" hideLegend name={question.id} value={sel} onChange={setSel} options={choiceOptions} />
          )}
          {kind === "multi" && (
            <ChoiceGroup legend="Vos choix" hideLegend multiple max={question.maxSelect} name={question.id} value={sel} onChange={onMulti} options={choiceOptions} columns={options.length > 8 ? 2 : 1} />
          )}
          {kind === "text" && (
            <div>
              <label htmlFor="free-text" className="sr-only">Votre réponse</label>
              <textarea id="free-text" rows={4} maxLength={500} className={`${inputClass} resize-y`} placeholder={question.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
              <p className="mt-1 text-xs text-muted">{text.length}/500 — facultatif, conservé sur votre appareil.</p>
            </div>
          )}
          {kind === "matrix" && (
            <div className="space-y-4">
              <p className="text-sm text-muted" aria-live="polite">{Object.keys(matrix).length} sur {question.items?.length} renseignés</p>
              {question.items?.map((it) => (
                <fieldset key={it.id} className="rounded-xl border border-line p-3">
                  <legend className="px-1 text-[15px] font-semibold">{it.label}</legend>
                  <div className="mt-1 grid gap-2 sm:grid-cols-4">
                    {([3, 2, 1, 0] as AversionLevel[]).map((lv) => {
                      const checked = matrix[it.id] === lv;
                      return (
                        <label key={lv} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-accent ${checked ? (lv === 3 ? "border-danger bg-danger-soft font-semibold text-danger" : "border-brand bg-brand-soft font-semibold text-brand-dark") : "border-line bg-card hover:border-brand/60"}`}>
                          <input type="radio" className="sr-only" name={`${question.id}-${it.id}`} checked={checked} onChange={() => setMatrix((m) => ({ ...m, [it.id]: lv }))} />
                          {checked && <Check aria-hidden className="h-4 w-4 shrink-0" strokeWidth={3} />}
                          {AVERSION_LABEL[lv]}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btn("ghost")} onClick={onBack}><ArrowLeft aria-hidden className="h-4 w-4" />{backLabel}</button>
        <div className="flex flex-wrap gap-3">
          {canSkip && kind !== "text" && <button type="button" className={btn("secondary")} onClick={onSkip}><SkipForward aria-hidden className="h-4 w-4" />Passer</button>}
          <button type="submit" className={btn("primary")} disabled={!valid}>Continuer<ArrowRight aria-hidden className="h-4 w-4" /></button>
        </div>
      </div>
      {!valid && kind !== "text" && <p className="mt-2 text-right text-xs text-muted" role="status">{kind === "matrix" ? "Renseignez chaque ligne, ou passez la question." : "Sélectionnez une réponse pour continuer, ou passez la question."}</p>}
    </form>
  );
}

export function QuestionFlow({ session, update, initialIndex, onBackToOnboarding, onReview }: {
  session: StoredSession; update: (fn: (s: StoredSession) => StoredSession) => void;
  initialIndex: number | null; onBackToOnboarding: () => void; onReview: () => void;
}) {
  const { onboarding, engine } = session;
  const [viewIdx, setViewIdx] = useState<number | null>(initialIndex);
  const effectiveIdx = viewIdx !== null && viewIdx < engine.asked.length ? viewIdx : null;

  const next = useMemo(() => nextQuestion(onboarding, engine), [onboarding, engine]);
  const progress = useMemo(() => progressInfo(onboarding, engine), [onboarding, engine]);

  useEffect(() => { if (effectiveIdx === null && next.done) onReview(); }, [effectiveIdx, next.done, onReview]);

  const question = effectiveIdx !== null ? QUESTION_BY_ID[engine.asked[effectiveIdx]!] : next.question;
  const askedBefore = effectiveIdx !== null ? engine.asked.slice(0, effectiveIdx) : engine.asked;
  const ctx = useMemo<QuestionContext>(() => ({ onboarding, answers: engine.answers, asked: askedBefore, profile: buildProfile(onboarding, engine.answers, askedBefore) }), [onboarding, engine.answers, askedBefore]);

  if (!question) return <p className="text-muted" role="status">Préparation de vos résultats…</p>;

  const number = (effectiveIdx ?? engine.asked.length) + 1;
  const existing = effectiveIdx !== null ? engine.answers[question.id] : undefined;
  const why = effectiveIdx !== null ? question.why : next.reason;

  const advance = () => setViewIdx(effectiveIdx !== null && effectiveIdx + 1 < engine.asked.length ? effectiveIdx + 1 : null);
  const submit = (a: Answer) => {
    if (effectiveIdx === null) update((s) => ({ ...s, phase: "questions", engine: recordAnswer(s.engine, question.id, a) }));
    else update((s) => ({ ...s, engine: changeAnswer(s.onboarding, s.engine, question.id, a) }));
    advance();
  };
  const back = () => {
    if (effectiveIdx === null) return engine.asked.length ? setViewIdx(engine.asked.length - 1) : onBackToOnboarding();
    if (effectiveIdx === 0) return onBackToOnboarding();
    setViewIdx(effectiveIdx - 1);
  };

  const cov = progress.coverage;
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold text-accent" aria-live="polite">Question {number}{effectiveIdx !== null ? " (modification)" : ""}</p>
        <p className="flex items-center gap-1.5 text-muted"><Clock aria-hidden className="h-4 w-4" />environ {progress.remainingMinutes} min restantes</p>
      </div>
      <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Étapes du bilan">
        {STAGES.map((d) => {
          const done = cov[d] >= COVERAGE_TARGET[d];
          const current = question.dimension === d;
          return (
            <li key={d} aria-current={current ? "step" : undefined} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${current ? "border-brand bg-brand text-white" : done ? "border-brand/30 bg-brand-soft text-brand-dark" : "border-line bg-card text-muted"}`}>
              {done && !current && <Check aria-hidden className="h-3 w-3" strokeWidth={3} />}
              {DIMENSION_LABEL[d]}{done && !current && <span className="sr-only"> (suffisamment documenté)</span>}
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-muted">Le nombre de questions s’adapte à vos réponses : cette indication est une estimation, pas un pourcentage d’avancement.</p>

      <div className="mt-5" key={question.id}>
        {why && <p className="mb-3 flex items-start gap-2 rounded-xl bg-brand-soft/60 px-3 py-2 text-sm text-brand-dark"><Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /><span>{why}</span></p>}
        <QuestionBody
          question={question} ctx={ctx} initial={existing} seed={session.startedAt}
          canSkip={!question.mandatory} onSubmit={submit} onSkip={() => submit({ kind: "skipped" })} onBack={back}
          backLabel={effectiveIdx === 0 || (effectiveIdx === null && engine.asked.length === 0) ? "Retour à l’accueil du bilan" : "Question précédente"}
        />
      </div>

      <p className="mt-8 text-sm text-muted">
        <Pause aria-hidden className="mr-1 inline h-4 w-4" />Besoin d’une pause ? Votre progression est enregistrée automatiquement sur cet appareil. <Link href="/" className="font-medium text-brand underline underline-offset-4">Quitter et reprendre plus tard</Link>.
      </p>
    </div>
  );
}
