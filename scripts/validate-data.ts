import { OCCUPATIONS } from "../src/data/occupations";
import { SECTORS } from "../src/data/sectors/sectors";
import { SOURCES } from "../src/data/sources";
import { validateDataset } from "../src/lib/data/validation";

const errors = validateDataset(OCCUPATIONS, SECTORS, SOURCES.map((s) => s.id));
if (errors.length) {
  console.error(`${errors.length} problème(s) dans le jeu de données :`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log(`Jeu de données valide : ${OCCUPATIONS.length} métiers, ${SECTORS.length} secteurs, ${SOURCES.length} sources.`);
