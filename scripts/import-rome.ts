/**
 * OUTIL DE DÉVELOPPEMENT (jamais utilisé en production).
 *
 * Aide à étendre le jeu de métiers à partir du jeu ouvert ROME de France Travail :
 *   1. Téléchargez vous-même le fichier (data.gouv.fr ou francetravail.io) en acceptant sa licence,
 *      et notez sa version et sa date dans src/data/sources.ts.
 *   2. Lancez : npm run data:import-rome -- chemin/vers/fichier.csv
 *
 * Le script ne télécharge rien. Il lit un CSV (séparateur « ; » ou « , »), repère les colonnes dont l’en-tête
 * contient « code » et « libell », puis écrit scripts/out/rome-candidates.json : la liste des appellations avec
 * leur domaine (première lettre du code ROME) et un indicateur « déjà couvert » (rapprochement par nom).
 * Il affiche aussi la couverture du jeu actuel par domaine ROME.
 *
 * LIMITE : la disposition des colonnes du fichier officiel n’a pas été vérifiée ici. Il faut ensuite rédiger
 * les fiches à la main (format o({...}) de src/data/occupations/build.ts) : le script ne produit ni description,
 * ni conditions de travail, et ne reproduit aucun texte officiel.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { OCCUPATIONS } from "../src/data/occupations";
import { matchOccupationsByName } from "../src/lib/data/search";

const file = process.argv[2];
if (!file) {
  console.error("Usage : npm run data:import-rome -- chemin/vers/fichier.csv");
  process.exit(1);
}

const raw = readFileSync(file, "utf8");
const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
const lines = text.split(/\r?\n/).filter(Boolean);
const sep = (lines[0] ?? "").split(";").length > (lines[0] ?? "").split(",").length ? ";" : ",";
const split = (l: string) => l.split(sep).map((c) => c.replace(/^"|"$/g, "").trim());
const header = split(lines[0] ?? "").map((h) => h.toLowerCase());
const iCode = header.findIndex((h) => h.includes("code"));
const iLabel = header.findIndex((h) => h.includes("libell"));
if (iCode < 0 || iLabel < 0) {
  console.error("Colonnes « code » et « libellé » introuvables dans l’en-tête :", header.join(" | "));
  process.exit(1);
}

const seen = new Set<string>();
const candidates = lines.slice(1).flatMap((l) => {
  const cols = split(l);
  const code = cols[iCode] ?? "";
  const label = cols[iLabel] ?? "";
  if (!/^[A-N]\d{4}$/.test(code) || !label || seen.has(`${code}|${label}`)) return [];
  seen.add(`${code}|${label}`);
  return [{ romeCode: code, domain: code[0], label, covered: matchOccupationsByName(label, OCCUPATIONS, 1).length > 0 }];
});

mkdirSync("scripts/out", { recursive: true });
writeFileSync("scripts/out/rome-candidates.json", JSON.stringify(candidates, null, 2));

const byDomain: Record<string, { rome: number; ours: number }> = {};
for (const c of candidates) (byDomain[c.domain!] ??= { rome: 0, ours: 0 }).rome++;
for (const o of OCCUPATIONS) if (o.romeDomain) (byDomain[o.romeDomain] ??= { rome: 0, ours: 0 }).ours++;
console.log(`${candidates.length} appellations lues, ${candidates.filter((c) => c.covered).length} rapprochées de fiches existantes.`);
console.table(byDomain);
