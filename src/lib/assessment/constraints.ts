import type { ConstraintState, Occupation } from "@/types/occupation";
import type { ConstraintId } from "@/data/taxonomy";

/**
 * État d’une condition de travail pour un métier. Les conditions déclarées dans la fiche
 * priment ; sinon on dérive de l’échelle de conditions de travail UNIQUEMENT quand la valeur
 * est connue. Sinon : « unknown » (jamais « non »).
 */
export type DerivedState = ConstraintState | "unknown";

export function constraintState(occ: Occupation, id: ConstraintId): DerivedState {
  const explicit = occ.constraints[id];
  if (explicit) return explicit;
  const env = occ.workEnvironment;
  const tri = (v: number | null, yes: number, some: number): DerivedState =>
    v === null ? "unknown" : v >= yes ? "yes" : v >= some ? "sometimes" : "no";
  switch (id) {
    case "desk-all-day":
      return tri(env.deskWork, 4, 3);
    case "heavy-physical":
      return tri(env.physicalActivity, 4, 3);
    case "customer-contact":
      return tri(env.publicInteraction, 4, 3);
    case "frequent-travel":
      return tri(env.travel, 4, 3);
    case "repetitive":
      return tri(env.routine, 4, 3);
    case "works-alone":
      return env.teamwork === null ? "unknown" : env.teamwork <= 0 ? "yes" : env.teamwork <= 1 ? "sometimes" : "no";
    case "long-training": {
      const m = occ.training.months;
      return m === null ? "unknown" : m >= 48 ? "yes" : m >= 30 ? "sometimes" : "no";
    }
    default:
      return "unknown";
  }
}
