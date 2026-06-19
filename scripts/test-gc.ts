/* Correctness check for the generational-GC engine.
   Run: node --experimental-strip-types scripts/test-gc.ts
   The GC sim is a conceptual model, so we assert its INVARIANTS rather than a
   console transcript:
     - minors strictly outnumber majors (the generational hypothesis) — this is
       the shape measured from real Node 22: minor 52 : major 1, and 271 : 1
       with --max-semi-space-size=1 (see scripts/node-truth-gc.mjs);
     - at least one promotion and one major GC actually occur in the lifecycle;
     - conservation: every long-lived ('p') object allocated is still alive at
       the end (none lost, none duplicated). */
import { simulate, summary, SCENARIOS, type Scenario } from "../src/lib/gcEngine.ts";

let failed = 0;
const assert = (name: string, cond: boolean, detail: string): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}`);
  console.log(`   ${detail}`);
};

const livePermanents = (s: Scenario): number => {
  const f = simulate(s)[simulate(s).length - 1];
  return [...f.from, ...f.to, ...f.old].filter((c) => c.kind === "p").length;
};
const scriptPermanents = (s: Scenario): number => s.script.filter((a) => a.kind === "p").length;

for (const s of SCENARIOS) {
  const st = summary(s);
  console.log(`\n— ${s.id}: ${s.title} —`);
  console.log(
    `   alloc=${st.alloc} minor=${st.minor} major=${st.major} promoted=${st.promoted} reclaimed=${st.reclaimed}`,
  );
  assert(`${s.id}: minors ≥ majors`, st.minor >= st.major, `minor=${st.minor} major=${st.major}`);
  assert(
    `${s.id}: permanent objects conserved`,
    livePermanents(s) === scriptPermanents(s),
    `alive p=${livePermanents(s)} allocated p=${scriptPermanents(s)}`,
  );
}

// The "promote" scenario must exercise the full lifecycle.
const promote = SCENARIOS.find((s) => s.id === "promote")!;
const ps = summary(promote);
assert("promote: minors strictly outnumber majors", ps.minor > ps.major, `minor=${ps.minor} major=${ps.major}`);
assert("promote: at least one major GC ran", ps.major >= 1, `major=${ps.major}`);
assert("promote: objects were promoted", ps.promoted >= 1, `promoted=${ps.promoted}`);
assert("promote: a major GC reclaimed memory", ps.reclaimed >= 1, `reclaimed=${ps.reclaimed}`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
