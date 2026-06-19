/* Correctness check for the backpressure engine.
   Run: node --experimental-strip-types scripts/test-streams.ts
   Asserts the engine reproduces the behaviour measured from real Node 22
   (scripts/node-truth-streams.mjs): write() flips to false exactly at
   buffered >= highWaterMark; RESPECTING backpressure bounds the buffer at the
   mark while IGNORING it lets the buffer grow past the mark; and chunks are
   conserved (everything produced is eventually consumed). */
import { STREAM_SCENARIOS, simulate, summarize } from "../src/lib/streamEngine.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const sc = STREAM_SCENARIOS[0];

for (const hwm of sc.hwms) {
  const respect = summarize(sc, { mode: "respect", hwm });
  const ignore = summarize(sc, { mode: "ignore", hwm });

  // write() flips to false exactly at buffered >= hwm  (Node truth: hwm=4 → at #4)
  ok(`hwm=${hwm} · first write()===false at index ${hwm}`, respect.firstFalseAt === hwm, `got ${respect.firstFalseAt}`);

  // RESPECT bounds the buffer at the mark; IGNORE overflows it
  ok(`hwm=${hwm} · respect bounds buffer ≤ hwm`, respect.maxBuffer <= hwm, `maxBuffer=${respect.maxBuffer}`);
  ok(`hwm=${hwm} · ignore overflows buffer > hwm`, ignore.maxBuffer > hwm, `maxBuffer=${ignore.maxBuffer}`);
  ok(`hwm=${hwm} · ignore peak > respect peak (memory cost)`, ignore.maxBuffer > respect.maxBuffer);

  // backpressure actually engages: at least one drain in respect mode
  ok(`hwm=${hwm} · respect emits ≥1 'drain'`, respect.drains >= 1, `drains=${respect.drains}`);

  // conservation: everything produced is consumed, buffer ends empty
  for (const m of ["respect", "ignore"] as const) {
    const sum = m === "respect" ? respect : ignore;
    ok(`hwm=${hwm} · ${m}: consumed all ${sc.total}`, sum.finalConsumed === sc.total, `consumed=${sum.finalConsumed}`);
    ok(`hwm=${hwm} · ${m}: buffer ends empty`, sum.finalBuffer === 0, `buffer=${sum.finalBuffer}`);
  }
}

// bigger highWaterMark ⇒ fewer pause/resume cycles (the memory-vs-throughput trade)
const dSmall = summarize(sc, { mode: "respect", hwm: sc.hwms[0] }).drains;
const dLarge = summarize(sc, { mode: "respect", hwm: sc.hwms[sc.hwms.length - 1] }).drains;
ok(`larger hwm ⇒ fewer 'drain' cycles (${dSmall} → ${dLarge})`, dLarge <= dSmall);

// frames are bounded and well-formed
const frames = simulate(sc, { mode: "respect", hwm: sc.defaultHwm });
ok("respect run produces a bounded frame list", frames.length > 5 && frames.length < 600, `${frames.length} frames`);
ok("last frame is the 'done' event", frames[frames.length - 1].event === "done");

console.log(
  "\nDocumented Node-22 defaults (scripts/node-truth-streams.mjs): byte writable highWaterMark = 65536 (64 KiB), objectMode = 16.",
);
console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
