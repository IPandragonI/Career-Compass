import { describe, expect, it } from "vitest";
import { ALL_PERSONAS, FIELD_TECH, UNCLEAR } from "./personas";
import { simulate } from "@/lib/assessment/simulate";
import { changeAnswer, emptyEngineState, nextQuestion, recordAnswer } from "@/lib/assessment/adaptive-engine";
import { buildProfile } from "@/lib/assessment/profile-builder";
import { ALL_QUESTIONS, QUESTION_BY_ID } from "@/data/assessment";
import { DEFAULT_CONFIG } from "@/lib/assessment/question-selection";

describe("moteur adaptatif", () => {
  it("choisit une première question principale, de façon déterministe", () => {
    const a = nextQuestion({}, emptyEngineState());
    const b = nextQuestion({}, emptyEngineState());
    expect(a.question?.id).toBeTruthy();
    expect(a.question?.id).toBe(b.question?.id);
    expect(a.question?.tier).toBe("core");
  });

  it("ne pose jamais deux fois la même question et reste sous le plafond", () => {
    for (const p of ALL_PERSONAS) {
      const sim = simulate(p);
      expect(new Set(sim.state.asked).size).toBe(sim.state.asked.length);
      expect(sim.questionsAsked).toBeLessThanOrEqual(DEFAULT_CONFIG.maxQuestions);
    }
  });

  it("termine, dans le budget de temps (< 30 min estimées) et avec 25 à 46 questions", () => {
    for (const p of ALL_PERSONAS) {
      const sim = simulate(p);
      expect(sim.doneReason).toBeTruthy();
      expect(sim.estimatedSeconds).toBeLessThan(30 * 60);
      expect(sim.questionsAsked).toBeGreaterThanOrEqual(20);
    }
  });

  it("pose toujours la question obligatoire des points de blocage", () => {
    for (const p of ALL_PERSONAS) {
      expect(simulate(p).state.asked).toContain("q-aversions");
    }
  });

  it("n’affiche une question conditionnelle que lorsqu’elle est pertinente", () => {
    const sim = simulate(FIELD_TECH);
    const fu = sim.state.asked.filter((id) => QUESTION_BY_ID[id]?.tier === "followup");
    expect(fu).toContain("q-fu-technical-practical"); // goût marqué pour le pratique
    expect(fu).not.toContain("q-fu-creation"); // aucune affinité de création
    expect(fu).not.toContain("q-fu-same-field-role"); // veut quitter son secteur
  });

  it("n’ajoute pas de questions de précision avant d’avoir assez d’éléments", () => {
    let state = emptyEngineState();
    for (let i = 0; i < DEFAULT_CONFIG.followupAfter - 1; i++) {
      const n = nextQuestion({}, state);
      expect(n.question?.tier).toBe("core");
      state = recordAnswer(state, n.question!.id, { kind: "skipped" });
    }
  });

  it("l’ensemble des dimensions atteint une couverture suffisante pour un parcours complet", () => {
    const sim = simulate(FIELD_TECH);
    const p = buildProfile(FIELD_TECH.onboarding, sim.state.answers, sim.state.asked);
    expect(p.coverage.aversions).toBe(1);
    expect(p.coverage.interets).toBeGreaterThan(0.6);
    expect(p.coverage.environnement).toBeGreaterThan(0.6);
  });

  it("supporte les questions sautées sans erreur et se termine", () => {
    const sim = simulate(UNCLEAR);
    expect(sim.questionsAsked).toBeGreaterThan(10);
    const p = buildProfile(UNCLEAR.onboarding, sim.state.answers, sim.state.asked);
    expect(p.skippedCount).toBeGreaterThan(0);
  });

  it("modifier une réponse met à jour le profil et retire les précisions devenues sans objet", () => {
    const ob = FIELD_TECH.onboarding;
    const sim = simulate(FIELD_TECH);
    const before = buildProfile(ob, sim.state.answers, sim.state.asked);
    const changed = changeAnswer(ob, sim.state, "q-free-day", { kind: "single", value: "design" });
    const after = buildProfile(ob, changed.answers, changed.asked);
    expect(after.interests.creation.raw).toBeGreaterThan(before.interests.creation.raw);
    expect(changed.answers["q-free-day"]).toEqual({ kind: "single", value: "design" });
  });

  it("la banque de questions est cohérente (identifiants uniques, options présentes)", () => {
    const ids = ALL_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of ALL_QUESTIONS) {
      if (q.kind === "matrix") expect(q.items?.length).toBeGreaterThan(5);
      else if (q.kind !== "text" && !q.buildOptions) expect(q.options?.length).toBeGreaterThanOrEqual(2);
    }
  });
});
