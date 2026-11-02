"use client";

import { useEffect, useRef } from "react";
import { btn } from "./primitives";

/**
 * Boîte de confirmation basée sur l’élément natif <dialog> : piège de focus, fermeture par Échap
 * et retour du focus à l’élément déclencheur sont gérés par le navigateur.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  danger = true,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-labelledby="dlg-title"
      aria-describedby="dlg-msg"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onClose={() => open && onCancel()}
      className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-line bg-card p-6 text-ink shadow-xl backdrop:bg-ink/40"
    >
      <h2 id="dlg-title" className="text-xl font-bold">
        {title}
      </h2>
      <p id="dlg-msg" className="mt-2 text-sm text-muted">
        {message}
      </p>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" autoFocus className={btn("secondary")} onClick={onCancel}>
          Annuler
        </button>
        <button type="button" className={btn(danger ? "danger" : "primary")} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
