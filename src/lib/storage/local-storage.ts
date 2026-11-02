import { migrateSession, newSession, SCHEMA_VERSION, type StoredSession } from "./migrations";

export const KEYS = {
  session: "cc:session",
  favorites: "cc:favorites",
  compare: "cc:compare",
  prefs: "cc:prefs",
} as const;

/** Sous-ensemble de l’API Storage, pour pouvoir injecter un faux stockage dans les tests. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function browserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    const probe = "cc:probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null; // navigation privée, stockage bloqué, quota…
  }
}

export interface Store {
  loadSession(): StoredSession | null;
  saveSession(s: StoredSession): boolean;
  resetSession(): void;
  loadList(key: "favorites" | "compare"): string[];
  saveList(key: "favorites" | "compare", ids: string[]): void;
  /** Efface TOUTES les données locales de l’application. */
  eraseAll(): void;
}

export function createStore(storage: StorageLike | null = browserStorage()): Store {
  const read = (key: string): unknown => {
    if (!storage) return null;
    try {
      const raw = storage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      try {
        storage.removeItem(key);
      } catch {
        /* ignoré */
      }
      return null; // JSON corrompu
    }
  };
  const write = (key: string, value: unknown): boolean => {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };
  return {
    loadSession: () => migrateSession(read(KEYS.session)),
    saveSession: (s) => write(KEYS.session, { ...s, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() }),
    resetSession: () => {
      try {
        storage?.removeItem(KEYS.session);
      } catch {
        /* ignoré */
      }
    },
    loadList: (key) => {
      const v = read(KEYS[key]);
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    },
    saveList: (key, ids) => {
      write(KEYS[key], [...new Set(ids)]);
    },
    eraseAll: () => {
      for (const k of Object.values(KEYS)) {
        try {
          storage?.removeItem(k);
        } catch {
          /* ignoré */
        }
      }
    },
  };
}

/** Empreinte simple des réponses, pour savoir si des résultats en cache sont à jour. */
export function hashAnswers(session: Pick<StoredSession, "onboarding" | "engine">): string {
  const s = JSON.stringify([session.onboarding, session.engine.asked, session.engine.answers]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return String(h >>> 0);
}

export { newSession };
