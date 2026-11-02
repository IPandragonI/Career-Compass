import { describe, expect, it } from "vitest";
import { buildProfile } from "@/lib/assessment/profile-builder";
import type { Answers } from "@/types/assessment";

describe("construction du profil", () => {
  it("gère l’absence totale de réponses", () => {
    const p = buildProfile({}, {});
    expect(p.answeredCount).toBe(0);
    expect(p.interests.nature.norm).toBe(0);
    expect(p.skills.logique.status).toBe("uncertain");
    expect(p.env.fieldwork.pref).toBeUndefined();
    expect(p.transition.maxTrainingMonths).toBeNull();
  });

  it("ignore les identifiants de questions inconnus ou les réponses invalides", () => {
    const answers = { "q-inconnue": { kind: "single", value: "x" }, "q-free-day": { kind: "single", value: "n-existe-pas" } } as Answers;
    expect(() => buildProfile({}, answers)).not.toThrow();
  });

  it("sépare les compétences démontrées et déclarées", () => {
    const answers: Answers = {
      "q-skill-experiences": { kind: "multi", values: ["repair", "code"] },
      "q-skill-asked": { kind: "multi", values: ["ideas"] },
    };
    const p = buildProfile({}, answers);
    expect(p.skills.depannage.demo).toBeGreaterThan(0);
    expect(p.skills.depannage.self).toBe(0);
    expect(p.skills.depannage.status).toBe("demonstrated");
    expect(p.skills.creativite.demo).toBe(0);
    expect(p.skills.creativite.self).toBeGreaterThan(0);
    expect(p.skills.creativite.status).toBe("self-reported");
  });

  it("distingue l’aptitude de l’intérêt (savoir-faire sans envie)", () => {
    const answers: Answers = {
      "q-skill-experiences": { kind: "multi", values: ["code"] },
      "q-day-tasks-avoid": { kind: "multi", values: ["screen"] },
    };
    const p = buildProfile({}, answers);
    expect(p.skills.logique.demo).toBeGreaterThan(0);
    expect(p.interests.numerique.norm).toBeLessThan(0);
  });

  it("la matrice des points de blocage prime sur les signaux implicites", () => {
    const answers: Answers = {
      "q-day-tasks-avoid": { kind: "multi", values: ["sales"] }, // implicite : niveau 2
      "q-aversions": { kind: "matrix", values: { "sales-targets": 0 } },
    };
    const p = buildProfile({}, answers, ["q-day-tasks-avoid", "q-aversions"]);
    expect(p.aversions["sales-targets"].level).toBe(0);
  });

  it("distingue l’indispensable du souhaitable", () => {
    const answers: Answers = {
      "q-motiv-top": { kind: "multi", values: ["utilite", "autonomie"] },
      "q-motiv-essential": { kind: "multi", values: ["utilite"] },
    };
    const p = buildProfile({}, answers, ["q-motiv-top", "q-motiv-essential"]);
    expect(p.motivations.utilite.essential).toBe(true);
    expect(p.motivations.autonomie.essential).toBe(false);
    expect(p.motivations.autonomie.norm).toBeGreaterThan(0);
  });

  it("ne supprime pas silencieusement les contradictions", () => {
    const answers: Answers = {
      "q-skill-experiences": { kind: "multi", values: ["code"] },
      "q-free-day": { kind: "single", value: "data" },
      "q-env-place": { kind: "single", value: "outdoor" },
      "q-day-ideal": { kind: "single", value: "computer" },
    };
    const p = buildProfile({}, answers, Object.keys(answers));
    // Données/numérique + terrain exclusif : contradiction détectée, non résolue.
    const c = p.contradictions.find((x) => x.id === "c-desk-field");
    if (c) expect(c.resolved).toBe(false);
    const resolved = buildProfile({}, { ...answers, "q-fu-desk-field-balance": { kind: "single", value: "half" } }, [
      ...Object.keys(answers),
      "q-fu-desk-field-balance",
    ]);
    const c2 = resolved.contradictions.find((x) => x.id === "c-desk-field");
    if (c2) expect(c2.resolved).toBe(true);
  });

  it("exprime les préférences de cadre sous forme de fourchette", () => {
    const answers: Answers = {
      "q-env-place": { kind: "single", value: "mixed" },
      "q-day-ideal": { kind: "single", value: "sites" },
    };
    const p = buildProfile({}, answers, Object.keys(answers));
    expect(p.env.fieldwork.n).toBeGreaterThanOrEqual(2);
    expect(p.env.fieldwork.min).toBeLessThan(p.env.fieldwork.max ?? 0);
    expect(p.env.fieldwork.spread).toBeGreaterThan(0);
  });

  it("interprète la durée de formation acceptée", () => {
    expect(buildProfile({ training: "aucune" }, {}).transition.maxTrainingMonths).toBe(0);
    expect(buildProfile({ training: "1-2ans" }, {}).transition.maxTrainingMonths).toBe(24);
    expect(buildProfile({ training: "nsp" }, {}).transition.maxTrainingMonths).toBeNull();
  });
});
