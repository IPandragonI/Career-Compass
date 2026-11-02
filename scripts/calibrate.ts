import { ALL_PERSONAS } from "../tests/personas";
import { simulate } from "../src/lib/assessment/simulate";
import { buildProfile } from "../src/lib/assessment/profile-builder";
import { recommend } from "../src/lib/assessment/recommendation-engine";
import { OCCUPATION_BY_ID } from "../src/data/occupations";

for (const p of ALL_PERSONAS) {
  const sim = simulate(p);
  const profile = buildProfile(p.onboarding, sim.state.answers, sim.state.asked);
  const res = recommend(profile);
  console.log(
    `\n=== ${p.name}\n  questions=${sim.questionsAsked} (~${Math.round(sim.estimatedSeconds / 60)} min) fin=${sim.doneReason}  exclus=${res.excludedCount}`,
  );
  console.log("  directions:", res.directions.map((d) => d.title).join(" | "));
  for (const r of res.recommendations) {
    console.log(
      `   ${r.composite.toFixed(2)} [${r.category}] ${OCCUPATION_BY_ID[r.occupationId]!.name} — ${r.fit.replace("Piste ", "")} (${r.warnings.filter((w) => w.severity !== "info").length} alertes)`,
    );
  }
  console.log("  découvertes:", res.discoveries.map((r) => OCCUPATION_BY_ID[r.occupationId]!.name).join(" | "));
}
