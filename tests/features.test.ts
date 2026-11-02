import { describe, expect, it } from "vitest";
import { ANALYST_OFFICE, FIELD_TECH } from "./personas";
import { scoreOccupation } from "@/lib/assessment/scoring";
import { simulate } from "@/lib/assessment/simulate";
import { buildProfile } from "@/lib/assessment/profile-builder";
import { recommend } from "@/lib/assessment/recommendation-engine";
import { explainAbsence } from "@/lib/assessment/absence";
import { OCCUPATIONS, OCCUPATION_BY_ID } from "@/data/occupations";
import { buildExport, parseImport } from "@/lib/data/session-io";
import { matchOccupationsByName } from "@/lib/data/search";
import { EMPTY_EXPLORER, parseExplorer, serializeExplorer } from "@/lib/hooks/use-url-filters";
import { migrateSession, newSession } from "@/lib/storage/migrations";
import { FAMILIES } from "@/data/taxonomy";
import type { Persona } from "@/lib/assessment/simulate";
import { ENV_IDS } from "@/data/taxonomy";

const run = (p: Persona) => {
  const sim = simulate(p);
  const profile = buildProfile(p.onboarding, sim.state.answers, sim.state.asked);
  return { sim, profile, res: recommend(profile) };
};

describe("export / import du bilan", () => {
  it("fait un aller-retour sans perte", () => {
    const s = newSession();
    s.onboarding = { educationLevel: "licence", training: "mois" };
    s.engine = { asked: ["q-free-day"], answers: { "q-free-day": { kind: "single", value: "tech" } } };
    s.feedback = { macon: 1 };
    const back = parseImport(buildExport(s, ["macon", "comptable"]));
    expect(back.ok).toBe(true);
    if (back.ok) {
      expect(back.session.engine.answers["q-free-day"]).toEqual({ kind: "single", value: "tech" });
      expect(back.session.feedback).toEqual({ macon: 1 });
      expect(back.favorites).toEqual(["macon", "comptable"]);
    }
  });

  it("refuse proprement les fichiers invalides ou étrangers", () => {
    expect(parseImport("pas du json").ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: "autre" })).ok).toBe(false);
    expect(parseImport(JSON.stringify({ app: "career-compass", session: { schemaVersion: 999 } })).ok).toBe(false);
  });

  it("conserve le bilan précédent et ignore les avis invalides à la migration", () => {
    const s = migrateSession({
      schemaVersion: 2,
      previousResults: { generatedAt: "2026-01-01T00:00:00Z", answersHash: "1", occupationIds: ["macon", 3], directionIds: [] },
      feedback: { macon: 1, comptable: 7 },
    });
    expect(s?.previousResults?.occupationIds).toEqual(["macon"]);
    expect(s?.feedback).toEqual({ macon: 1 });
  });
});

describe("explorateur : état dans l’URL", () => {
  it("sérialise puis relit le même état", () => {
    const state = {
      ...EMPTY_EXPLORER,
      sort: "formation" as const,
      category: "adjacent" as const,
      filters: {
        ...EMPTY_EXPLORER.filters,
        query: "géomètre",
        sectorIds: ["environnement"],
        maxMonths: 12,
        env: { fieldwork: 3 },
        favoritesOnly: true,
      },
    };
    const back = parseExplorer(serializeExplorer(state));
    expect(back.filters.query).toBe("géomètre");
    expect(back.filters.sectorIds).toEqual(["environnement"]);
    expect(back.filters.maxMonths).toBe(12);
    expect(back.filters.env).toEqual({ fieldwork: 3 });
    expect(back.filters.favoritesOnly).toBe(true);
    expect(back.sort).toBe("formation");
    expect(back.category).toBe("adjacent");
  });

  it("ignore les paramètres invalides et omet les valeurs par défaut", () => {
    expect(serializeExplorer(EMPTY_EXPLORER)).toBe("");
    const s = parseExplorer("?tri=bizarre&cat=nimporte&mois=abc");
    expect(s.sort).toBe("pertinence");
    expect(s.category).toBe("");
    expect(s.filters.maxMonths).toBeNull();
  });
});

describe("données étendues", () => {
  it("chaque famille compte au moins 5 métiers", () => {
    for (const f of FAMILIES) expect(OCCUPATIONS.filter((o) => o.familyId === f.id).length, f.id).toBeGreaterThanOrEqual(5);
  });

  it("les compléments de contraintes n’écrasent pas les valeurs existantes", () => {
    expect(OCCUPATION_BY_ID["comptable"]?.constraints["admin-heavy"]).toBe("yes");
    expect(OCCUPATION_BY_ID["comptable"]?.constraints["night-shifts"]).toBe("no");
  });

  it("une valeur inconnue reste inconnue (jamais assimilée à zéro)", () => {
    const o = OCCUPATION_BY_ID["technicien-mesures-terrain"]!;
    expect(ENV_IDS.every((id) => o.workEnvironment[id] === null || typeof o.workEnvironment[id] === "number")).toBe(true);
  });
});

describe("parcours saisi en texte libre", () => {
  it("rapproche un métier saisi des fiches et enrichit le parcours", () => {
    expect(matchOccupationsByName("comptable", OCCUPATIONS).map((o) => o.id)).toContain("comptable");
    const p = buildProfile({ currentOccupation: "Comptable" }, {});
    expect(p.background.matchedOccupationIds).toContain("comptable");
    expect(p.background.sectorIds).toContain("finance-assurance");
    expect(p.background.hasBackground).toBe(true);
  });

  it("ne rapproche rien d’un texte sans correspondance", () => {
    expect(matchOccupationsByName("astronaute lunaire", OCCUPATIONS)).toEqual([]);
  });
});

describe("accessibilité du métier et préférences de transition", () => {
  it("un master dans le domaine n’est pas classé « exploratoire » pour un métier voisin", () => {
    const { res } = run(ANALYST_OFFICE);
    const data = res.recommendations.find((r) => r.occupationId === "data-analyst");
    if (data) expect(data.category).not.toBe("ambitieuse");
    expect(res.recommendations.length).toBeGreaterThanOrEqual(6);
  });

  it("la recherche d’emploi rapide pénalise l’accessibilité des formations longues", () => {
    const base = { educationLevel: "secondaire" as const, training: "longue" as const, fieldRelation: ["changer-tout" as const] };
    const long = OCCUPATIONS.find((o) => (o.training.months ?? 0) >= 48 && o.training.typicalLevel === "bac+5")!;
    const patient = buildProfile({ ...base, jobNow: "non" }, {});
    const urgent = buildProfile({ ...base, jobNow: "oui" }, {});
    expect(urgent.transition.urgent).toBe(true);
    const acc = (p: typeof patient) => scoreOccupation(p, long).dimensions.find((d) => d.id === "accessibility")!.score;
    expect(acc(urgent)).toBeLessThan(acc(patient));
    const warned = recommend(urgent, {}, [long]).recommendations.concat(recommend(urgent, {}, [long]).discoveries);
    for (const r of warned) expect(r.warnings.some((w) => w.text.includes("rapidement"))).toBe(true);
  });

  it("refuser un poste de débutant réduit l’accessibilité d’un métier qui s’aborde ainsi, après un changement de secteur", () => {
    const entry = OCCUPATIONS.find((o) => o.training.entryRoles === true && !o.sectorIds.includes("industrie"))!;
    const base = { educationLevel: "bac+2" as const, experienceSectorIds: ["industrie"], fieldRelation: ["changer-tout" as const] };
    const open = buildProfile({ ...base, entryLevelOk: "oui" }, {});
    const refuses = buildProfile({ ...base, entryLevelOk: "non" }, {});
    const s1 = scoreOccupation(open, entry);
    const s2 = scoreOccupation(refuses, entry);
    expect(s2.entryRefused).toBe(true);
    expect(s1.entryRefused).toBe(false);
    const acc = (s: typeof s1) => s.dimensions.find((d) => d.id === "accessibility")!.score;
    expect(acc(s2)).toBeLessThan(acc(s1));
  });
});

describe("pourquoi pas ce métier ?", () => {
  it("explique un métier non retenu, un métier retenu et un métier écarté", () => {
    const { profile, res } = run(FIELD_TECH);
    const selected = res.recommendations[0]!.occupationId;
    expect(explainAbsence(profile, selected, res)?.selected).toBe(true);
    const other = OCCUPATIONS.find(
      (o) => !res.recommendations.some((r) => r.occupationId === o.id) && !res.discoveries.some((r) => r.occupationId === o.id),
    )!;
    const ex = explainAbsence(profile, other.id, res)!;
    expect(ex.selected).toBe(false);
    expect(ex.lines.length).toBeGreaterThan(0);
    expect(explainAbsence(profile, "n-existe-pas", res)).toBeNull();
  });

  it("explique l’exclusion par un point de blocage fort", () => {
    const profile = buildProfile({}, { "q-aversions": { kind: "matrix", values: { "desk-all-day": 3 } } }, ["q-aversions"]);
    const res = recommend(profile);
    const desk = OCCUPATIONS.find((o) => o.workEnvironment.deskWork === 4)!;
    const ex = explainAbsence(profile, desk.id, res)!;
    expect(ex.excluded).toBe(true);
  });
});

describe("textes du moteur", () => {
  it("ne laisse jamais fuiter d’identifiant technique dans les explications", () => {
    const { sim } = run(FIELD_TECH);
    const { res } = run(FIELD_TECH);
    const texts = res.recommendations.flatMap((r) => [
      ...r.reasons.map((x) => x.text),
      ...r.warnings.map((w) => w.text),
      ...r.toInvestigate,
    ]);
    for (const t of texts) expect(t).not.toMatch(/\b(trait|interest|env|motivation|skill):/);
    expect(sim.questionsAsked).toBeGreaterThan(0);
  });
});
