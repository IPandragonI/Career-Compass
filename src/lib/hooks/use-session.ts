"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createStore, KEYS } from "@/lib/storage/local-storage";
import { newSession, type StoredSession } from "@/lib/storage/migrations";

/**
 * Session d’évaluation persistée dans le navigateur.
 * `hydrated` reste faux au premier rendu (identique côté serveur) pour éviter tout écart d’hydratation.
 */
export function useSession() {
  const store = useMemo(() => createStore(), []);
  const [session, setSession] = useState<StoredSession>(() => newSession());
  const [hydrated, setHydrated] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const skipSave = useRef(true);

  useEffect(() => {
    const loaded = store.loadSession();
    if (loaded) {
      setSession(loaded);
      setHasSaved(loaded.phase !== "accueil" || Object.keys(loaded.engine.answers).length > 0 || Object.keys(loaded.onboarding).length > 0);
    }
    setHydrated(true);
  }, [store]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipSave.current) { skipSave.current = false; return; }
    store.saveSession(session);
  }, [session, hydrated, store]);

  const update = useCallback((fn: (s: StoredSession) => StoredSession) => setSession((prev) => fn(prev)), []);

  const restart = useCallback(() => {
    store.resetSession();
    skipSave.current = true;
    setSession(newSession());
    setHasSaved(false);
  }, [store]);

  const eraseAll = useCallback(() => {
    store.eraseAll();
    skipSave.current = true;
    setSession(newSession());
    setHasSaved(false);
  }, [store]);

  return { session, update, hydrated, hasSaved, restart, eraseAll };
}

/* ───── Listes persistées (favoris, comparaison), synchronisées entre composants ───── */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => { listeners.delete(cb); window.removeEventListener("storage", cb); };
}

function useStoredList(key: "favorites" | "compare") {
  const raw = useSyncExternalStore(
    subscribe,
    () => { try { return window.localStorage.getItem(KEYS[key]) ?? "[]"; } catch { return "[]"; } },
    () => "[]",
  );
  const ids = useMemo<string[]>(() => { try { const v = JSON.parse(raw); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; } }, [raw]);
  const toggle = useCallback((id: string, max = 50) => {
    const store = createStore();
    const cur = store.loadList(key);
    store.saveList(key, cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-max));
    emit();
  }, [key]);
  const clear = useCallback(() => { createStore().saveList(key, []); emit(); }, [key]);
  return { ids, toggle, clear };
}

export const useFavorites = () => useStoredList("favorites");
export const useCompare = () => {
  const l = useStoredList("compare");
  return { ...l, toggle: (id: string) => l.toggle(id, 3) };
};

/** Résultats mis en cache : renvoie l’identifiant des catégories pour le filtre de l’explorateur. */
export function useSavedSession() {
  const [s, setS] = useState<StoredSession | null>(null);
  useEffect(() => { setS(createStore().loadSession()); }, []);
  return s;
}
