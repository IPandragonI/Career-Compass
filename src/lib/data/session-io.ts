import { migrateSession, type StoredSession } from "@/lib/storage/migrations";

/** Format d’export : un simple fichier JSON, lisible et réimportable (aucune donnée n’est envoyée nulle part). */
export interface ExportEnvelope {
  app: "career-compass";
  exportVersion: 1;
  exportedAt: string;
  session: StoredSession;
  favorites: string[];
}

export function buildExport(session: StoredSession, favorites: string[], now = new Date().toISOString()): string {
  const envelope: ExportEnvelope = { app: "career-compass", exportVersion: 1, exportedAt: now, session, favorites };
  return JSON.stringify(envelope, null, 2);
}

export type ImportResult = { ok: true; session: StoredSession; favorites: string[] } | { ok: false; error: string };

/** Lit un fichier d’export en le validant et en le migrant ; ne lève jamais d’exception. */
export function parseImport(text: string): ImportResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Ce fichier n’est pas un JSON valide." };
  }
  if (typeof raw !== "object" || raw === null || (raw as Record<string, unknown>).app !== "career-compass") {
    return { ok: false, error: "Ce fichier n’a pas été exporté par Career Compass." };
  }
  const env = raw as Record<string, unknown>;
  const session = migrateSession(env.session);
  if (!session) return { ok: false, error: "Ce bilan est dans un format trop récent ou illisible." };
  const favorites = Array.isArray(env.favorites) ? env.favorites.filter((x): x is string => typeof x === "string") : [];
  return { ok: true, session, favorites };
}
