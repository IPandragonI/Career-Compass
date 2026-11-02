import { describe, expect, it } from "vitest";
import { createStore, hashAnswers, KEYS, type StorageLike } from "@/lib/storage/local-storage";
import { migrateSession, newSession, SCHEMA_VERSION } from "@/lib/storage/migrations";
import { validateDataset } from "@/lib/data/validation";
import { OCCUPATIONS } from "@/data/occupations";
import { SECTORS } from "@/data/sectors/sectors";
import { SOURCES } from "@/data/sources";
import { EMPTY_FILTERS, searchOccupations } from "@/lib/data/search";

function memoryStorage(): StorageLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
}

describe("persistance", () => {
  it("sauvegarde puis restaure une session", () => {
    const st = memoryStorage();
    const store = createStore(st);
    const s = newSession();
    s.phase = "questions";
    s.onboarding = { educationLevel: "licence", training: "mois" };
    s.engine = { asked: ["q-free-day"], answers: { "q-free-day": { kind: "single", value: "tech" } } };
    expect(store.saveSession(s)).toBe(true);
    const loaded = createStore(st).loadSession();
    expect(loaded?.phase).toBe("questions");
    expect(loaded?.engine.answers["q-free-day"]).toEqual({ kind: "single", value: "tech" });
    expect(loaded?.onboarding.educationLevel).toBe("licence");
  });

  it("traite un JSON invalide sans planter", () => {
    const st = memoryStorage();
    st.setItem(KEYS.session, "{pas du json");
    expect(createStore(st).loadSession()).toBeNull();
    expect(st.data.has(KEYS.session)).toBe(false);
  });

  it("rejette une version de schéma future et nettoie les données invalides", () => {
    expect(migrateSession({ schemaVersion: SCHEMA_VERSION + 5 })).toBeNull();
    expect(migrateSession("n'importe quoi")).toBeNull();
    const s = migrateSession({
      schemaVersion: SCHEMA_VERSION,
      engine: { asked: ["q-free-day", "q-disparue"], answers: { "q-free-day": { kind: "single", value: 3 }, "q-disparue": { kind: "single", value: "a" } } },
    });
    expect(s?.engine.asked).toEqual(["q-free-day"]);
    expect(s?.engine.answers["q-free-day"]).toBeUndefined();
  });

  it("migre une ancienne session (schéma 0/1) sans la casser", () => {
    const old = { schemaVersion: 1, onboarding: { training: "mois" }, asked: ["q-free-day"], answers: { "q-free-day": { kind: "single", value: "tech" } }, phase: "questions" };
    const s = migrateSession(old);
    expect(s?.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s?.engine.answers["q-free-day"]).toEqual({ kind: "single", value: "tech" });
    expect(s?.onboarding.training).toBe("mois");
  });

  it("repart du début du questionnaire si sa version a changé", () => {
    const s = migrateSession({ schemaVersion: SCHEMA_VERSION, questionnaireVersion: 0, phase: "revue", engine: { asked: ["q-free-day"], answers: { "q-free-day": { kind: "single", value: "tech" } } } });
    expect(s?.engine.asked).toEqual([]);
    expect(s?.phase).toBe("questions");
  });

  it("la réinitialisation efface la session ; l’effacement total supprime aussi les favoris", () => {
    const st = memoryStorage();
    const store = createStore(st);
    store.saveSession(newSession());
    store.saveList("favorites", ["a", "b", "a"]);
    expect(store.loadList("favorites")).toEqual(["a", "b"]);
    store.resetSession();
    expect(store.loadSession()).toBeNull();
    expect(store.loadList("favorites")).toEqual(["a", "b"]);
    store.eraseAll();
    expect(st.data.size).toBe(0);
  });

  it("fonctionne sans stockage disponible", () => {
    const store = createStore(null);
    expect(store.loadSession()).toBeNull();
    expect(store.saveSession(newSession())).toBe(false);
    expect(store.loadList("favorites")).toEqual([]);
  });

  it("l’empreinte change quand une réponse change", () => {
    const a = newSession();
    const b = { ...a, engine: { asked: ["q-free-day"], answers: { "q-free-day": { kind: "single" as const, value: "tech" } } } };
    expect(hashAnswers(a)).not.toBe(hashAnswers(b));
  });
});

describe("jeu de données", () => {
  it("est valide et cohérent", () => {
    const errors = validateDataset(OCCUPATIONS, SECTORS, SOURCES.map((s) => s.id));
    expect(errors).toEqual([]);
  });

  it("contient un jeu large et varié", () => {
    expect(OCCUPATIONS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(OCCUPATIONS.map((o) => o.familyId)).size).toBeGreaterThanOrEqual(20);
  });

  it("la recherche ignore accents et casse, et les filtres s’appliquent", () => {
    expect(searchOccupations(OCCUPATIONS, { ...EMPTY_FILTERS, query: "ecologue" }).map((o) => o.id)).toContain("ecologue");
    expect(searchOccupations(OCCUPATIONS, { ...EMPTY_FILTERS, query: "GÉOMÈTRE" }).length).toBeGreaterThan(0);
    const short = searchOccupations(OCCUPATIONS, { ...EMPTY_FILTERS, maxMonths: 12 });
    expect(short.every((o) => o.training.months === null || o.training.months <= 12)).toBe(true);
    expect(searchOccupations(OCCUPATIONS, { ...EMPTY_FILTERS, query: "zzzzzz" })).toEqual([]);
  });
});
