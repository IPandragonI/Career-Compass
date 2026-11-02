"use client";

import { Download, Printer, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { StoredSession } from "@/lib/storage/migrations";
import { createStore } from "@/lib/storage/local-storage";
import { buildExport, parseImport } from "@/lib/data/session-io";
import { btn } from "@/components/ui/primitives";

/** Export / import du bilan en JSON et impression (ou « Enregistrer en PDF » via le navigateur). */
export function DataTools({ session }: { session: StoredSession }) {
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const exportJson = () => {
    const store = createStore();
    const blob = new Blob([buildExport(session, store.loadList("favorites"))], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `career-compass-bilan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: "Fichier exporté. Conservez-le : il contient vos réponses." });
  };

  const importJson = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const res = parseImport(text);
    if (!res.ok) return setMessage({ ok: false, text: res.error });
    const store = createStore();
    store.saveSession(res.session);
    store.saveList("favorites", res.favorites);
    setMessage({ ok: true, text: "Bilan importé. Rechargement…" });
    window.setTimeout(() => window.location.reload(), 400);
  };

  const print = () => {
    // Les sections repliées sont dépliées le temps de l’impression, puis restaurées.
    const closed = Array.from(document.querySelectorAll("details:not([open])"));
    closed.forEach((d) => d.setAttribute("open", ""));
    const restore = () => {
      closed.forEach((d) => d.removeAttribute("open"));
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    window.print();
  };

  return (
    <div className="no-print rounded-2xl border border-line bg-card p-5">
      <h2 className="text-lg font-bold">Conserver ou partager votre bilan</h2>
      <p className="mt-1 text-sm text-muted">
        Vos données ne sont stockées que dans ce navigateur : exportez-les pour les sauvegarder, les ouvrir sur un autre appareil ou les
        montrer à un·e conseiller·ère.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className={btn("secondary")} onClick={exportJson}>
          <Download aria-hidden className="h-4 w-4" />
          Exporter (JSON)
        </button>
        <button type="button" className={btn("secondary")} onClick={() => input.current?.click()}>
          <Upload aria-hidden className="h-4 w-4" />
          Importer un bilan
        </button>
        <button type="button" className={btn("secondary")} onClick={print}>
          <Printer aria-hidden className="h-4 w-4" />
          Imprimer / enregistrer en PDF
        </button>
        <input
          ref={input}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Choisir un fichier de bilan à importer"
          onChange={(e) => {
            void importJson(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {message && (
        <p role="status" className={`mt-3 text-sm font-medium ${message.ok ? "text-brand-dark" : "text-danger"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
