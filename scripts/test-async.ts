/* Correctness check for the async-ordering engine.
   Run: node --experimental-strip-types scripts/test-async.ts
   Asserts each scenario's simulated console output === its known-correct output
   (captured from real Node — see scripts/node-truth-async.mjs). */
import { simulate, SCENARIOS } from "../src/lib/asyncEngine.ts";

let failed = 0;
for (const s of SCENARIOS) {
  const frames = simulate(s);
  const final = frames[frames.length - 1];
  const got = final.output.map((o) => o.text);
  const ok = JSON.stringify(got) === JSON.stringify(s.expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${s.id}: ${s.title}`);
  console.log(`   frames=${frames.length}`);
  console.log(`   got     = [${got.join(" | ")}]`);
  console.log(`   expected= [${s.expected.join(" | ")}]`);
  if (!ok) failed++;
}
console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
