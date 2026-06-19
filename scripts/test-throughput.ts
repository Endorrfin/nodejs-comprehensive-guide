/* Structural checks for the connection-scaling model (Ch.2 Strengths sim).
   Run: node --experimental-strip-types scripts/test-throughput.ts

   These verify the MODEL's structure — the C10k lesson — not a benchmark:
   to hold the same N connections, the event loop uses one thread and a fraction
   of the memory, while thread-per-request needs N threads and balloons in
   memory, with the gap widening toward ~16× as connections grow. */
import { compute, memRatio, MODELS, N_STOPS } from "../src/lib/throughputEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};

// The event loop holds every connection on ONE thread; thread-per-request needs N.
for (const n of N_STOPS) {
  check(`loop holds ${n} on 1 thread`, compute("loop", n).threads === 1 && compute("loop", n).served === n);
  check(`thread needs ${n} threads`, compute("thread", n).threads === n);
}

// Memory grows monotonically for both, and the loop is always cheaper.
let monoThread = true;
let monoLoop = true;
for (let i = 1; i < N_STOPS.length; i++) {
  if (compute("thread", N_STOPS[i]).memMiB <= compute("thread", N_STOPS[i - 1]).memMiB) monoThread = false;
  if (compute("loop", N_STOPS[i]).memMiB <= compute("loop", N_STOPS[i - 1]).memMiB) monoLoop = false;
}
check("thread memory strictly grows with N", monoThread);
check("loop memory strictly grows with N", monoLoop);
for (const n of N_STOPS) check(`loop cheaper than thread at ${n}`, compute("loop", n).memMiB < compute("thread", n).memMiB);

// The blow-up factor widens with N, toward the per-connection ratio (~16×).
check("ratio grows 100 → 1k → 10k", memRatio(10000) > memRatio(1000) && memRatio(1000) > memRatio(100));
check("ratio large at 10k", memRatio(10000) > 8, `ratio≈${memRatio(10000).toFixed(1)}×`);
check("ratio never exceeds the ~16× asymptote", memRatio(20000) < 16, `ratio≈${memRatio(20000).toFixed(1)}×`);

// The headline contrast at 10k: loop stays in MiB; threads would need GiB.
check("loop < 1 GiB at 10k", compute("loop", 10000).memMiB < 1024, `${compute("loop", 10000).memMiB.toFixed(0)} MiB`);
check("thread > 8 GiB at 10k", compute("thread", 10000).memMiB > 8192, `${(compute("thread", 10000).memMiB / 1024).toFixed(1)} GiB`);

// Per-connection costs are the stated order of magnitude (1 MiB vs 64 KiB → 16×).
check("thread ~16× a socket per connection", Math.round(MODELS.thread.perConnMiB / MODELS.loop.perConnMiB) === 16);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
