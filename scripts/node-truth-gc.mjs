/* Ground truth for the GC engine: observe REAL V8 garbage-collection events while
   a workload (a) churns lots of short-lived objects (→ minor GC / Scavenge) and
   (b) retains a growing structure (→ promotion to old space → major GC /
   Mark-Sweep-Compact). Uses the perf_hooks 'gc' observer. The engine teaches:
   minors are frequent & cheap, majors are rarer — and minors >> majors here
   proves the generational hypothesis. Run: node scripts/node-truth-gc.mjs */
import { PerformanceObserver, constants } from "node:perf_hooks";

const KIND = {
  [constants.NODE_PERFORMANCE_GC_MAJOR]: "major",
  [constants.NODE_PERFORMANCE_GC_MINOR]: "minor",
  [constants.NODE_PERFORMANCE_GC_INCREMENTAL]: "incremental",
  [constants.NODE_PERFORMANCE_GC_WEAKCB]: "weakcb",
};
const counts = { major: 0, minor: 0, incremental: 0, weakcb: 0 };

const obs = new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    const k = e.detail ? e.detail.kind : e.kind; // detail.kind on modern Node
    counts[KIND[k] ?? "minor"]++;
  }
});
obs.observe({ entryTypes: ["gc"] });

// Workload: most allocations die immediately (garbage → Scavenge); 1 in 25 is
// retained, growing old space until a major GC must run.
const retained = [];
for (let i = 0; i < 3_000_000; i++) {
  const o = { a: i, b: "v" + (i & 1023), c: i * 1.5 };
  if (i % 25 === 0) retained.push(o);
}

// let the observer flush, then report
setTimeout(() => {
  // keep `retained` alive to here so old space really filled
  if (retained.length < 0) console.log("unreachable");
  console.log(
    JSON.stringify({
      minor: counts.minor,
      major: counts.major,
      incremental: counts.incremental,
      weakcb: counts.weakcb,
      retained: retained.length,
    }),
  );
}, 50);
