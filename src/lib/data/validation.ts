import type { Occupation, Sector } from "@/types/occupation";
import { CONSTRAINT_IDS, ENV_IDS, FAMILIES, INTEREST_IDS, MOTIVATION_IDS, SKILL_IDS } from "@/data/taxonomy";

/** Valide la cohérence du jeu de données. Renvoie la liste des problèmes (vide = valide). */
export function validateDataset(occupations: Occupation[], sectors: Sector[], sourceIds: string[]): string[] {
  const errors: string[] = [];
  const sectorIds = new Set(sectors.map((s) => s.id));
  const familyIds = new Set<string>(FAMILIES.map((f) => f.id));
  const ids = new Set<string>();
  const byId = new Map(occupations.map((o) => [o.id, o]));
  for (const o of occupations) {
    const at = `[${o.id}]`;
    if (!/^[a-z0-9-]+$/.test(o.id)) errors.push(`${at} identifiant invalide`);
    if (ids.has(o.id)) errors.push(`${at} identifiant en double`);
    ids.add(o.id);
    if (!o.name.trim() || o.description.trim().length < 20) errors.push(`${at} nom ou description manquants`);
    if (!familyIds.has(o.familyId)) errors.push(`${at} famille inconnue : ${o.familyId}`);
    if (!o.sectorIds.length) errors.push(`${at} aucun secteur`);
    for (const s of o.sectorIds) if (!sectorIds.has(s)) errors.push(`${at} secteur inconnu : ${s}`);
    if (o.dailyTasks.length < 2) errors.push(`${at} moins de 2 tâches`);
    if (!Object.keys(o.interestTags).length) errors.push(`${at} aucun intérêt`);
    for (const [k, w] of Object.entries(o.interestTags)) {
      if (!INTEREST_IDS.includes(k as never)) errors.push(`${at} intérêt inconnu : ${k}`);
      if (![1, 2, 3].includes(w as number)) errors.push(`${at} poids d’intérêt invalide : ${k}`);
    }
    for (const s of o.skillTags) if (!SKILL_IDS.includes(s)) errors.push(`${at} compétence inconnue : ${s}`);
    for (const m of o.motivationTags) if (!MOTIVATION_IDS.includes(m)) errors.push(`${at} motivation inconnue : ${m}`);
    for (const d of ENV_IDS) {
      const v = o.workEnvironment[d];
      if (v !== null && !(Number.isInteger(v) && v >= 0 && v <= 4)) errors.push(`${at} échelle invalide pour ${d} : ${String(v)}`);
    }
    for (const c of Object.keys(o.constraints)) if (!CONSTRAINT_IDS.includes(c as never)) errors.push(`${at} contrainte inconnue : ${c}`);
    if (o.training.months !== null && (o.training.months < 0 || o.training.months > 120))
      errors.push(`${at} durée de formation invraisemblable`);
    if (!o.training.routes.length) errors.push(`${at} aucune voie d’accès`);
    for (const r of o.relatedOccupationIds) if (!byId.has(r)) errors.push(`${at} métier lié inconnu : ${r}`);
    if (!o.sourceReferences.length) errors.push(`${at} aucune référence de source`);
    for (const r of o.sourceReferences) if (!sourceIds.includes(r.sourceId)) errors.push(`${at} source inconnue : ${r.sourceId}`);
    if (o.lastVerifiedAt !== null && Number.isNaN(Date.parse(o.lastVerifiedAt))) errors.push(`${at} date de vérification invalide`);
  }
  const sids = new Set<string>();
  for (const s of sectors) {
    if (sids.has(s.id)) errors.push(`[secteur ${s.id}] en double`);
    sids.add(s.id);
    if (!occupations.some((o) => o.sectorIds.includes(s.id))) errors.push(`[secteur ${s.id}] aucun métier rattaché`);
  }
  return errors;
}
