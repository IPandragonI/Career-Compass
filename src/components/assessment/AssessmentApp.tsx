"use client";

import { ArrowRight, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { QUESTION_BY_ID } from "@/data/assessment";
import { buildProfile } from "@/lib/assessment/profile-builder";
import { useSession } from "@/lib/hooks/use-session";
import { btn, Card, Container, Eyebrow } from "@/components/ui/primitives";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Onboarding } from "./Onboarding";
import { describeAnswer, QuestionFlow } from "./QuestionFlow";
import type { QuestionContext } from "@/types/assessment";

export function AssessmentApp() {
  const router = useRouter();
  const { session, update, hydrated, hasSaved, restart, eraseAll } = useSession();
  const [startIdx, setStartIdx] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<null | "restart" | "erase">(null);

  const goReview = useCallback(() => update((s) => (s.phase === "revue" ? s : { ...s, phase: "revue" })), [update]);

  if (!hydrated)
    return (
      <Container narrow className="py-12">
        <p className="text-muted" role="status">
          Chargement de votre bilan…
        </p>
      </Container>
    );

  const phase = session.phase;
  return (
    <Container narrow className="py-8 sm:py-12">
      <Eyebrow>Mon bilan</Eyebrow>
      {phase === "accueil" && (
        <>
          <h1 className="mb-1 text-3xl font-bold">Faisons connaissance</h1>
          {hasSaved && <p className="mb-4 text-sm text-muted">Vos réponses précédentes ont été retrouvées sur cet appareil.</p>}
          <Onboarding
            value={session.onboarding}
            onChange={(v) => update((s) => ({ ...s, onboarding: v }))}
            step={session.onboardingStep}
            setStep={(n) => update((s) => ({ ...s, onboardingStep: n }))}
            onDone={() => {
              setStartIdx(null);
              update((s) => ({
                ...s,
                phase: "questions",
                onboarding: { ...s.onboarding, completedAt: s.onboarding.completedAt ?? new Date().toISOString() },
              }));
            }}
          />
        </>
      )}
      {phase === "questions" && (
        <>
          <h1 className="sr-only">Mon bilan : questionnaire adaptatif</h1>
          <QuestionFlow
            session={session}
            update={update}
            initialIndex={startIdx}
            onReview={goReview}
            onBackToOnboarding={() => update((s) => ({ ...s, phase: "accueil", onboardingStep: 4 }))}
          />
        </>
      )}
      {phase === "revue" || phase === "termine" ? (
        <Review
          session={session}
          onEdit={(i) => {
            setStartIdx(i);
            update((s) => ({ ...s, phase: "questions" }));
          }}
          onResults={() => {
            update((s) => ({ ...s, phase: "termine" }));
            router.push("/resultats/");
          }}
        />
      ) : null}

      {(hasSaved || phase !== "accueil") && (
        <div className="mt-12 border-t border-line pt-6">
          <h2 className="text-lg font-bold">Vos données</h2>
          <p className="mt-1 text-sm text-muted">
            Tout est enregistré uniquement dans ce navigateur. Aucun nom, e-mail ni identifiant n’est collecté.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button className={btn("secondary")} onClick={() => setConfirm("restart")}>
              <RotateCcw aria-hidden className="h-4 w-4" />
              Recommencer de zéro
            </button>
            <button className={btn("danger")} onClick={() => setConfirm("erase")}>
              <Trash2 aria-hidden className="h-4 w-4" />
              Effacer toutes mes données
            </button>
          </div>
          <ConfirmDialog
            open={confirm !== null}
            danger
            title={confirm === "restart" ? "Recommencer le bilan ?" : "Effacer toutes vos données ?"}
            message={
              confirm === "restart"
                ? "Vos réponses actuelles seront supprimées. Les résultats déjà calculés seront perdus."
                : "Vos réponses, résultats, avis et favoris seront supprimés de cet appareil. Pensez à exporter votre bilan avant."
            }
            confirmLabel={confirm === "restart" ? "Recommencer" : "Tout effacer"}
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (confirm === "restart") restart();
              else eraseAll();
              setConfirm(null);
              setStartIdx(null);
            }}
          />
        </div>
      )}
    </Container>
  );
}

function Review({
  session,
  onEdit,
  onResults,
}: {
  session: ReturnType<typeof useSession>["session"];
  onEdit: (i: number) => void;
  onResults: () => void;
}) {
  const rows = useMemo(
    () =>
      session.engine.asked.map((id, i) => {
        const q = QUESTION_BY_ID[id]!;
        const asked = session.engine.asked.slice(0, i);
        const ctx: QuestionContext = {
          onboarding: session.onboarding,
          answers: session.engine.answers,
          asked,
          profile: buildProfile(session.onboarding, session.engine.answers, asked),
        };
        return {
          i,
          q,
          prompt: q.buildPrompt ? q.buildPrompt(ctx) : q.prompt,
          text: describeAnswer(q, session.engine.answers[id], ctx),
          skipped: session.engine.answers[id]?.kind === "skipped",
        };
      }),
    [session],
  );
  return (
    <div className="enter">
      <h1 className="text-3xl font-bold">Relisez vos réponses</h1>
      <p className="mt-2 text-muted">
        Vous avez répondu à {rows.filter((r) => !r.skipped).length} questions. Modifiez ce que vous voulez : vos résultats seront
        recalculés.
      </p>
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.q.id}>
            <Card className="!p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{r.prompt}</p>
                <p className={`mt-1 text-sm ${r.skipped ? "italic text-muted" : "text-brand-dark"}`}>{r.text}</p>
              </div>
              <button
                className={btn("ghost", "!min-h-10 shrink-0 !px-3")}
                onClick={() => onEdit(r.i)}
                aria-label={`Modifier la réponse : ${r.prompt}`}
              >
                <Pencil aria-hidden className="h-4 w-4" />
                Modifier
              </button>
            </Card>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <button className={btn("primary")} onClick={onResults}>
          Voir mes résultats
          <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
