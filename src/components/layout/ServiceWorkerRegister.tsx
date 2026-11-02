"use client";

import { useEffect } from "react";

/** Enregistre le service worker (production uniquement) pour un usage hors ligne après la première visite. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* sans service worker, l’application fonctionne simplement en ligne */
    });
  }, []);
  return null;
}
