"use client";

import { useMemo, useState } from "react";
import type { Profile } from "@/types/profile";
import type { Results } from "@/types/recommendation";
import { OCCUPATIONS } from "@/data/occupations";
import { explainAbsence } from "@/lib/assessment/absence";
import { Card } from "@/components/ui/primitives";
import { inputClass } from "@/components/ui/choices";

/** « Pourquoi pas ce métier ? » : une manière de contester ou de comprendre le classement. */
export function AbsenceExplorer({ profile, results }: { profile: Profile; results: Results }) {
  const [id, setId] = useState("");
  const explanation = useMemo(() => (id ? explainAbsence(profile, id, results) : null), [id, profile, results]);
  const sorted = useMemo(() => [...OCCUPATIONS].sort((a, b) => a.name.localeCompare(b.name, "fr")), []);
  return (
    <Card className="no-print">
      <h3 className="text-lg font-bold">Pourquoi pas ce métier ?</h3>
      <p className="mt-1 text-sm text-muted">
        Un métier qui vous intéresse n’apparaît pas ? Choisissez-le pour voir comment il est évalué à partir de vos réponses.
      </p>
      <label htmlFor="absence" className="mt-3 block text-sm font-semibold">
        Métier
      </label>
      <select id="absence" className={`${inputClass} mt-1`} value={id} onChange={(e) => setId(e.target.value)}>
        <option value="">Choisir un métier…</option>
        {sorted.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
      <div aria-live="polite">
        {explanation && (
          <div className="mt-4 text-sm">
            <ul className="list-disc space-y-1 pl-5">
              {explanation.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            {explanation.warnings.length > 0 && (
              <>
                <p className="mt-3 font-semibold">Points de vigilance</p>
                <ul className="list-disc space-y-1 pl-5 text-muted">
                  {explanation.warnings.slice(0, 5).map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </>
            )}
            <p className="mt-3 text-xs text-muted">
              Évaluation interne et exploratoire : elle peut se tromper, notamment si la fiche est incomplète.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
