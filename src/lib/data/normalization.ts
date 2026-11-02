/** Normalisation de texte pour la recherche (minuscules, sans accents ni ponctuation). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/œ/g, "oe")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function slugify(text: string): string {
  return normalize(text).replace(/\s+/g, "-");
}
