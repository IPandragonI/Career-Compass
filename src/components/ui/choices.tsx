"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

export interface ChoiceOption {
  id: string;
  label: string;
  hint?: string;
}

/**
 * Groupe de choix accessible : de vrais <input> radio/checkbox (navigation clavier et lecteurs d’écran natifs),
 * présentés comme de grandes cartes tactiles. L’état sélectionné est indiqué par une coche, pas seulement par la couleur.
 */
export function ChoiceGroup({
  legend,
  name,
  options,
  value,
  onChange,
  multiple = false,
  max,
  columns = 1,
  hideLegend = false,
  help,
}: {
  legend: ReactNode;
  name: string;
  options: ChoiceOption[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
  max?: number;
  columns?: 1 | 2 | 3;
  hideLegend?: boolean;
  help?: ReactNode;
}) {
  const reached = multiple && max !== undefined && value.length >= max;
  const toggle = (id: string) => {
    if (!multiple) return onChange([id]);
    if (value.includes(id)) return onChange(value.filter((v) => v !== id));
    if (reached) return;
    onChange([...value, id]);
  };
  const cols = columns === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : "";
  return (
    <fieldset>
      <legend className={hideLegend ? "sr-only" : "mb-1 text-base font-semibold"}>{legend}</legend>
      {help && <p className="mb-3 text-sm text-muted">{help}</p>}
      {multiple && max !== undefined && (
        <p className="mb-2 text-xs text-muted" aria-live="polite">
          {value.length} sur {max} choix maximum
        </p>
      )}
      <div className={`grid gap-2.5 ${cols}`}>
        {options.map((o, i) => {
          const checked = value.includes(o.id);
          const disabled = multiple && !checked && reached;
          return (
            <label
              key={o.id}
              className={`group relative flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${checked ? "border-brand bg-brand-soft" : "border-line bg-card hover:border-brand/60"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type={multiple ? "checkbox" : "radio"}
                name={name}
                value={o.id}
                checked={checked}
                disabled={disabled}
                onChange={() => toggle(o.id)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 ${multiple ? "rounded-md" : "rounded-full"} ${checked ? "border-brand bg-brand text-white" : "border-line bg-card"}`}
              >
                {checked && <Check className="h-4 w-4" strokeWidth={3} />}
              </span>
              <span className="flex-1">
                <span className="block text-[15px] font-medium leading-snug">{o.label}</span>
                {o.hint && <span className="mt-0.5 block text-sm text-muted">{o.hint}</span>}
              </span>
              {i < 9 && (
                <kbd aria-hidden className="hidden rounded border border-line px-1.5 text-xs text-muted lg:block">
                  {i + 1}
                </kbd>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-base font-semibold">
        {label}
      </label>
      {hint && <p className="mb-2 text-sm text-muted">{hint}</p>}
      {children}
    </div>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-xl border border-line bg-card px-3.5 py-2 text-[15px] placeholder:text-muted/70 focus:border-brand";

/** Pastilles multi-sélection, plus compactes que des cartes (secteurs, compétences…). */
export function Chips({
  legend,
  options,
  value,
  onChange,
  tone = "brand",
}: {
  legend: string;
  options: ChoiceOption[];
  value: string[];
  onChange: (v: string[]) => void;
  tone?: "brand" | "danger";
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-base font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const checked = value.includes(o.id);
          return (
            <label
              key={o.id}
              className={`inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent ${checked ? (tone === "danger" ? "border-danger bg-danger-soft text-danger" : "border-brand bg-brand-soft text-brand-dark") : "border-line bg-card hover:border-brand/60"}`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => onChange(checked ? value.filter((v) => v !== o.id) : [...value, o.id])}
              />
              {checked && <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />}
              {o.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
