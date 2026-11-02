"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Onboarding as OnboardingData } from "@/types/profile";
import {
  AUTONOMY_OPTIONS,
  EDUCATION_LEVELS,
  FIELD_RELATION_OPTIONS,
  SALARY_OPTIONS,
  STATUS_OPTIONS,
  STUDY_FIELDS,
  TRAINING_OPTIONS,
} from "@/data/assessment/onboarding-options";
import { INTERESTS, SKILLS } from "@/data/taxonomy";
import { SECTORS } from "@/data/sectors/sectors";
import { normalize } from "@/lib/data/normalization";
import { btn, Card } from "@/components/ui/primitives";
import { Chips, ChoiceGroup, Field, inputClass } from "@/components/ui/choices";

export const ONBOARDING_STEPS = ["Parcours", "Votre domaine", "Expérience", "Formation et évolution", "Contraintes pratiques"] as const;

const YES_NO = [
  { id: "oui", label: "Oui" },
  { id: "non", label: "Non" },
  { id: "nsp", label: "Je ne sais pas encore" },
];

export function Onboarding({
  value,
  onChange,
  step,
  setStep,
  onDone,
}: {
  value: OnboardingData;
  onChange: (v: OnboardingData) => void;
  step: number;
  setStep: (n: number) => void;
  onDone: () => void;
}) {
  const set = <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => onChange({ ...value, [k]: v });
  const [q, setQ] = useState("");
  const fields = useMemo(() => STUDY_FIELDS.filter((f) => !q || normalize(f.label).includes(normalize(q))), [q]);
  const isStudent = value.status === "etudes";
  const last = step === ONBOARDING_STEPS.length - 1;
  const hasExp = value.hasExperience ?? (!isStudent && value.status !== undefined ? true : undefined);

  const next = () => (last ? onDone() : setStep(step + 1));

  return (
    <div className="enter" key={step}>
      <p className="text-sm font-semibold text-accent" aria-live="polite">
        Étape {step + 1} sur {ONBOARDING_STEPS.length} — {ONBOARDING_STEPS[step]}
      </p>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {ONBOARDING_STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand" : "bg-line"}`} />
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">
        Tout est facultatif. Vous pouvez passer une question ou une étape : les résultats resteront utiles, avec davantage d’incertitude.
      </p>

      <Card className="mt-5 space-y-7">
        {step === 0 && (
          <>
            <ChoiceGroup
              legend="Quel est votre plus haut niveau de qualification terminé ?"
              name="edu"
              value={value.educationLevel ? [value.educationLevel] : []}
              onChange={([v]) => set("educationLevel", v as OnboardingData["educationLevel"])}
              options={EDUCATION_LEVELS.map((l) => ({ id: l.id, label: l.label }))}
              columns={2}
            />
            <div>
              <Field label="Quel domaine avez-vous étudié ?" htmlFor="field-search" hint="Cherchez dans la liste ou choisissez « Autre ».">
                <input
                  id="field-search"
                  type="search"
                  className={inputClass}
                  placeholder="Ex. : informatique, santé, droit…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </Field>
              <div className="mt-3">
                <ChoiceGroup
                  legend="Domaines d’études suggérés"
                  hideLegend
                  name="field"
                  columns={2}
                  value={value.studyField ? [value.studyField] : []}
                  onChange={([v]) => set("studyField", v)}
                  options={[...fields.map((f) => ({ id: f.id, label: f.label })), { id: "custom", label: "Autre domaine (à préciser)" }]}
                />
              </div>
              {value.studyField === "custom" && (
                <div className="mt-3">
                  <Field label="Votre domaine" htmlFor="field-custom">
                    <input
                      id="field-custom"
                      className={inputClass}
                      maxLength={80}
                      value={value.studyFieldCustom ?? ""}
                      onChange={(e) => set("studyFieldCustom", e.target.value)}
                    />
                  </Field>
                </div>
              )}
            </div>
            <ChoiceGroup
              legend="Avez-vous terminé ces études ?"
              name="complete"
              columns={3}
              value={value.studyCompleted ? [value.studyCompleted] : []}
              onChange={([v]) => set("studyCompleted", v as OnboardingData["studyCompleted"])}
              options={[
                { id: "oui", label: "Oui" },
                { id: "non", label: "Non, interrompues" },
                { id: "en-cours", label: "Encore en cours" },
              ]}
            />
            <ChoiceGroup
              legend="Votre situation actuelle ?"
              name="status"
              columns={2}
              value={value.status ? [value.status] : []}
              onChange={([v]) => set("status", v as OnboardingData["status"])}
              options={STATUS_OPTIONS}
            />
            {(value.status === "etudes" || value.studyCompleted === "en-cours") && (
              <Field label="Que préparez-vous actuellement ?" htmlFor="current-study">
                <input
                  id="current-study"
                  className={inputClass}
                  maxLength={100}
                  value={value.currentStudy ?? ""}
                  onChange={(e) => set("currentStudy", e.target.value)}
                />
              </Field>
            )}
          </>
        )}

        {step === 1 && (
          <ChoiceGroup
            multiple
            legend="Quel rapport souhaitez-vous avoir avec votre domaine actuel ?"
            help="Plusieurs réponses possibles. Aucune n’est prioritaire : « changer » n’est pas meilleur que « rester »."
            name="rel"
            value={value.fieldRelation ?? []}
            onChange={(v) => set("fieldRelation", v as OnboardingData["fieldRelation"])}
            options={FIELD_RELATION_OPTIONS}
          />
        )}

        {step === 2 && (
          <>
            <ChoiceGroup
              legend="Avez-vous une expérience professionnelle (emploi, stage, alternance, bénévolat) ?"
              name="hasexp"
              columns={2}
              value={hasExp === undefined ? [] : [hasExp ? "oui" : "non"]}
              onChange={([v]) => set("hasExperience", v === "oui")}
              options={[
                { id: "oui", label: "Oui" },
                { id: "non", label: "Pas vraiment" },
              ]}
            />
            {hasExp && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Métier actuel ou le plus récent" htmlFor="cur">
                    <input
                      id="cur"
                      className={inputClass}
                      maxLength={80}
                      value={value.currentOccupation ?? ""}
                      onChange={(e) => set("currentOccupation", e.target.value)}
                    />
                  </Field>
                  <Field label="Un métier précédent (facultatif)" htmlFor="prev">
                    <input
                      id="prev"
                      className={inputClass}
                      maxLength={80}
                      value={value.previousOccupation ?? ""}
                      onChange={(e) => set("previousOccupation", e.target.value)}
                    />
                  </Field>
                </div>
                <Chips
                  legend="Dans quels secteurs avez-vous travaillé ?"
                  options={SECTORS.map((s) => ({ id: s.id, label: s.name }))}
                  value={value.experienceSectorIds ?? []}
                  onChange={(v) => set("experienceSectorIds", v)}
                />
                <Chips
                  legend="Quelles activités avez-vous aimées ?"
                  options={INTERESTS.map((i) => ({ id: i.id, label: i.label }))}
                  value={value.enjoyedTasks ?? []}
                  onChange={(v) => set("enjoyedTasks", v as OnboardingData["enjoyedTasks"])}
                />
                <Chips
                  tone="danger"
                  legend="Lesquelles vous ont déplu ?"
                  options={INTERESTS.map((i) => ({ id: i.id, label: i.label }))}
                  value={value.dislikedTasks ?? []}
                  onChange={(v) => set("dislikedTasks", v as OnboardingData["dislikedTasks"])}
                />
                <Chips
                  legend="Quelles compétences avez-vous réellement acquises ?"
                  options={SKILLS.map((s) => ({ id: s.id, label: s.label }))}
                  value={value.acquiredSkills ?? []}
                  onChange={(v) => set("acquiredSkills", v as OnboardingData["acquiredSkills"])}
                />
                <ChoiceGroup
                  legend="Quel degré d’autonomie souhaitez-vous ?"
                  name="auto"
                  value={value.autonomy ? [value.autonomy] : []}
                  onChange={([v]) => set("autonomy", v as OnboardingData["autonomy"])}
                  options={[...AUTONOMY_OPTIONS]}
                />
              </>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <ChoiceGroup
              legend="Cherchez-vous un emploi rapidement ?"
              name="jobnow"
              columns={3}
              value={value.jobNow ? [value.jobNow] : []}
              onChange={([v]) => set("jobNow", v as OnboardingData["jobNow"])}
              options={[
                { id: "oui", label: "Oui, dès que possible" },
                { id: "bientot", label: "Dans quelques mois" },
                { id: "non", label: "Non, j’explore" },
              ]}
            />
            <ChoiceGroup
              legend="Quelle durée de formation supplémentaire envisageriez-vous au maximum ?"
              help="Une durée courte ne signifie pas que vous refusez d’apprendre : elle sert seulement à signaler les formations plus longues."
              name="training"
              columns={2}
              value={value.training ? [value.training] : []}
              onChange={([v]) => set("training", v as OnboardingData["training"])}
              options={TRAINING_OPTIONS}
            />
            <ChoiceGroup
              legend="Accepteriez-vous un poste de débutant·e dans un nouveau domaine ?"
              name="entry"
              columns={3}
              value={value.entryLevelOk ? [value.entryLevelOk] : []}
              onChange={([v]) => set("entryLevelOk", v as OnboardingData["entryLevelOk"])}
              options={YES_NO}
            />
            <ChoiceGroup
              legend="Auriez-vous besoin de conserver un revenu pendant une formation ?"
              name="income"
              columns={3}
              value={value.needIncomeDuringTraining ? [value.needIncomeDuringTraining] : []}
              onChange={([v]) => set("needIncomeDuringTraining", v as OnboardingData["needIncomeDuringTraining"])}
              options={YES_NO}
            />
            <ChoiceGroup
              legend="Seriez-vous prêt·e à déménager ?"
              name="reloc"
              columns={2}
              value={value.relocation ? [value.relocation] : []}
              onChange={([v]) => set("relocation", v as OnboardingData["relocation"])}
              options={[
                { id: "oui", label: "Oui, n’importe où" },
                { id: "region", label: "Dans une région précise" },
                { id: "non", label: "Non" },
                { id: "nsp", label: "Je ne sais pas" },
              ]}
            />
          </>
        )}

        {step === 4 && (
          <>
            <ChoiceGroup
              legend="Un niveau de revenu minimal ?"
              help="Information facultative et jamais transmise : elle sert uniquement à signaler les métiers souvent moins bien rémunérés."
              name="salary"
              value={value.salaryFloor ? [value.salaryFloor] : []}
              onChange={([v]) => set("salaryFloor", v as OnboardingData["salaryFloor"])}
              options={SALARY_OPTIONS}
            />
            <ChoiceGroup
              legend="Un emploi stable est-il indispensable ?"
              name="stable"
              columns={3}
              value={value.stableRequired ? [value.stableRequired] : []}
              onChange={([v]) => set("stableRequired", v as OnboardingData["stableRequired"])}
              options={YES_NO}
            />
            <ChoiceGroup
              legend="Accepteriez-vous un travail temporaire ou saisonnier ?"
              name="seasonal"
              columns={3}
              value={value.seasonalOk ? [value.seasonalOk] : []}
              onChange={([v]) => set("seasonalOk", v as OnboardingData["seasonalOk"])}
              options={YES_NO}
            />
            <ChoiceGroup
              legend="Des déplacements professionnels ?"
              name="travel"
              columns={3}
              value={value.travelOk ? [value.travelOk] : []}
              onChange={([v]) => set("travelOk", v as OnboardingData["travelOk"])}
              options={[
                { id: "oui", label: "Oui" },
                { id: "occasionnel", label: "Occasionnellement" },
                { id: "non", label: "Non" },
              ]}
            />
            <ChoiceGroup
              legend="Avez-vous le permis de conduire ?"
              name="licence"
              columns={3}
              value={value.licence ? [value.licence] : []}
              onChange={([v]) => set("licence", v as OnboardingData["licence"])}
              options={[
                { id: "oui", label: "Oui" },
                { id: "non", label: "Non" },
                { id: "nsp", label: "Je préfère ne pas répondre" },
              ]}
            />
          </>
        )}
      </Card>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button type="button" className={btn("ghost")} onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          <ArrowLeft aria-hidden className="h-4 w-4" />
          Retour
        </button>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={btn("secondary")} onClick={next}>
            Passer cette étape
          </button>
          <button type="button" className={btn("primary")} onClick={next}>
            {last ? "Commencer les questions" : "Continuer"}
            <ArrowRight aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
