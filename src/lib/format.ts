/** Formats français : durées, nombres, dates. */
const nf = new Intl.NumberFormat("fr-FR");
export const formatNumber = (n: number) => nf.format(n);

export function formatMonths(m: number | null): string {
  if (m === null) return "Durée non précisée";
  if (m <= 0) return "Aucune formation";
  if (m < 12) return `${m} mois`;
  const years = Math.floor(m / 12);
  const rest = m % 12;
  return rest ? `${years} an${years > 1 ? "s" : ""} et ${rest} mois` : `${years} an${years > 1 ? "s" : ""}`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "non vérifiée";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "non vérifiée" : new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

export const formatEuro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
