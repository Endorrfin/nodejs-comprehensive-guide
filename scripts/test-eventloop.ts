/* Quick correctness check for the event-loop engine.
   Run: node --experimental-strip-types scripts/test-eventloop.ts
   Asserts each scenario's simulated console output === its known-correct output. */
import { simulate, SCENARIOS } from "../src/lib/eventLoopEngine.ts";

let failed = 0;
for (const s of SCENARIOS) {
  const frames = simulate(s);
  const final = frames[frames.length - 1];
  const got = final.output;
  const ok = JSON.stringify(got) === JSON.stringify(s.expected);
  console.log(`${ok ? "PASS" : "FAIL"}  ${s.id}: ${s.title}`);
  console.log(`   frames=${frames.length}`);
  console.log(`   got     = [${got.join(", ")}]`);
  console.log(`   expected= [${s.expected.join(", ")}]`);
  if (!ok) failed++;
}
console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
