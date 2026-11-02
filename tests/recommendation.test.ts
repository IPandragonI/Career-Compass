import { describe, expect, it } from "vitest";
import { ALL_PERSONAS, FIELD_TECH, OFFICE_LEAVER, STRONG_DEALBREAKERS, STUDENT_PEOPLE, UNCLEAR, ANALYST_OFFICE } from "./personas";
import { simulate } from "@/lib/assessment/simulate";
import { buildProfile } from "@/lib/assessment/profile-builder";
import { recommend } from "@/lib/assessment/recommendation-engine";
import { constraintState } from "@/lib/assessment/constraints";
import { OCCUPATIONS, OCCUPATION_BY_ID } from "@/data/occupations";
import type { Persona } from "@/lib/assessment/simulate";

const run = (p: Persona) => {
  const sim = simulate(p);
  const profile = buildProfile(p.onboarding, sim.state.answers, sim.state.asked);
  return { profile, res: recommend(profile) };
};

describe("moteur de recommandation", () => {
  it("produit 6 à 12 pistes réparties sur plusieurs directions pour chaque profil", () => {
    for (const p of ALL_PERSONAS) {
      const { res } = run(p);
      expect(res.recommendations.length).toBeGreaterThanOrEqual(4);
      expect(res.recommendations.length).toBeLessThanOrEqual(12);
      expect(res.directions.length).toBeGreaterThanOrEqual(2);
      expect(res.directions.length).toBeLessThanOrEqual(5);
    }
  });

  it("les recommandations changent quand les réponses pertinentes changent", () => {
    const a = run(STUDENT_PEOPLE).res.recommendations.map((r) => r.occupationId);
    const b = run(FIELD_TECH).res.recommendations.map((r) => r.occupationId);
    const common = a.filter((x) => b.includes(x));
    expect(common.length).toBeLessThanOrEqual(1);
    expect(run(ANALYST_OFFICE).res.recommendations[0]?.occupationId).not.toBe(run(OFFICE_LEAVER).res.recommendations[0]?.occupationId);
  });

  it("respecte les points de blocage forts : aucun métier incompatible n’est recommandé", () => {
    const { profile, res } = run(STRONG_DEALBREAKERS);
    expect(res.excludedCount).toBeGreaterThan(0);
    for (const r of [...res.recommendations, ...res.discoveries]) {
      const occ = OCCUPATION_BY_ID[r.occupationId]!;
      for (const [id, st] of Object.entries(profile.aversions)) {
        if (st.level === 3) expect(constraintState(occ, id as never)).not.toBe("yes");
      }
    }
  });

  it("n’exclut pas un métier dont la contrainte est simplement inconnue, mais l’indique", () => {
    const { res } = run(STRONG_DEALBREAKERS);
    const withUnknown = res.recommendations.some((r) => r.unknowns.length > 0);
    expect(withUnknown).toBe(true);
  });

  it("signale les écarts avec les préférences de cadre plutôt que de les masquer", () => {
    const { res } = run(OFFICE_LEAVER);
    // Quiconque veut du terrain ne reçoit pas un métier 100 % bureau en tête sans alerte.
    for (const r of res.recommendations.slice(0, 3)) {
      const occ = OCCUPATION_BY_ID[r.occupationId]!;
      if ((occ.workEnvironment.deskWork ?? 0) >= 4) expect(r.warnings.length).toBeGreaterThan(0);
    }
  });

  it("évite les quasi-doublons (même groupe de dédoublonnage)", () => {
    for (const p of ALL_PERSONAS) {
      const groups = run(p)
        .res.recommendations.map((r) => OCCUPATION_BY_ID[r.occupationId]!.dedupeGroup)
        .filter(Boolean);
      expect(new Set(groups).size).toBe(groups.length);
    }
  });

  it("couvre plusieurs familles de métiers", () => {
    const { res } = run(UNCLEAR);
    const families = new Set(res.recommendations.map((r) => OCCUPATION_BY_ID[r.occupationId]!.familyId));
    expect(families.size).toBeGreaterThanOrEqual(2);
  });

  it("ne classe pas automatiquement les pistes proches en premier pour qui veut changer de secteur", () => {
    const { res } = run(OFFICE_LEAVER);
    expect(res.recommendations.some((r) => r.category === "nouvelle" || r.category === "adjacent")).toBe(true);
  });

  it("sans parcours déclaré, toutes les pistes sont de nouvelles directions (ou exploratoires)", () => {
    const { res } = run(STUDENT_PEOPLE);
    for (const r of res.recommendations) expect(["nouvelle", "ambitieuse"]).toContain(r.category);
  });

  it("ne plante pas avec des fiches incomplètes (valeurs inconnues)", () => {
    const { profile } = run(FIELD_TECH);
    const sparse = OCCUPATIONS.slice(0, 5).map((o) => ({
      ...o,
      workEnvironment: Object.fromEntries(Object.keys(o.workEnvironment).map((k) => [k, null])) as typeof o.workEnvironment,
      training: { ...o.training, months: null },
      constraints: {},
      earnings: null,
      stability: null,
    }));
    expect(() => recommend(profile, {}, sparse)).not.toThrow();
  });

  it("chaque recommandation est expliquée à partir de réponses réelles de la personne", () => {
    const { res, profile } = run(FIELD_TECH);
    for (const r of res.recommendations) {
      expect(r.reasons.length).toBeGreaterThan(0);
      for (const reason of r.reasons) {
        for (const e of reason.evidence) {
          const known = e.questionId === "onboarding" || profile.answeredCount > 0;
          expect(known).toBe(true);
          expect(e.label.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("n’invente pas de statistique : aucun pourcentage dans les textes de résultats", () => {
    const { res } = run(FIELD_TECH);
    const texts = res.recommendations.flatMap((r) => [...r.reasons.map((x) => x.text), ...r.warnings.map((w) => w.text)]);
    for (const t of texts) expect(t).not.toMatch(/\d+\s?%/);
  });

  it("le bilan est plus prudent lorsqu’il y a peu de réponses", () => {
    const { res } = run(UNCLEAR);
    expect(res.recommendations.every((r) => r.fit !== "Piste particulièrement intéressante" || r.composite >= 0.6)).toBe(true);
    expect(res.recommendations.some((r) => r.evidenceConfidence !== "bonne")).toBe(true);
  });
});
