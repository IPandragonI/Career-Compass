// Génère out/sw-manifest.json (liste des fichiers à mettre en cache) et date le service worker.
// Lancé automatiquement après `next build` (script « postbuild »).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const OUT = "out";
if (!existsSync(OUT)) {
  console.error("Dossier out/ introuvable : lancez d’abord `npm run build`.");
  process.exit(1);
}

const files = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
})(OUT);

const skip = new Set(["sw.js", "sw-manifest.json"]);
const urls = new Set(["/"]);
const hash = createHash("sha1");
for (const f of files.sort()) {
  const rel = relative(OUT, f).split(sep).join("/");
  if (skip.has(rel)) continue;
  hash.update(rel).update(readFileSync(f));
  if (rel === "index.html") continue;
  if (rel.endsWith("/index.html")) urls.add("/" + rel.slice(0, -"index.html".length));
  else if (!rel.endsWith(".txt") && !rel.endsWith(".map")) urls.add("/" + rel);
}
const build = hash.digest("hex").slice(0, 12);
writeFileSync(join(OUT, "sw-manifest.json"), JSON.stringify([...urls].sort()));
const swPath = join(OUT, "sw.js");
writeFileSync(swPath, readFileSync(swPath, "utf8").replace("__BUILD__", build));
console.log(`Service worker : ${urls.size} fichiers mis en cache, build ${build}.`);
