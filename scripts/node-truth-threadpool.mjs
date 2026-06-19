/* Ground truth for the thread-pool engine: run N equal-cost, CPU-bound,
   POOL-backed tasks (crypto.pbkdf2) and N network tasks, and observe when each
   completes. The pool has UV_THREADPOOL_SIZE slots (default 4), so pool tasks
   finish in WAVES of that size; network tasks need no pool thread and all fly
   at once. Run: UV_THREADPOOL_SIZE=4 node scripts/node-truth-threadpool.mjs
   The engine's scenarios must reproduce these wave sizes. */
import crypto from "node:crypto";
import { performance } from "node:perf_hooks";

const POOL = Number(process.env.UV_THREADPOOL_SIZE || "4");
const N = Number(process.env.N || "6");
const ITER = Number(process.env.ITER || "300000"); // tuned so each task ≈ tens of ms

function runPool() {
  return new Promise((resolve) => {
    const t0 = performance.now();
    const done = [];
    for (let i = 0; i < N; i++) {
      crypto.pbkdf2("pw", "salt" + i, ITER, 64, "sha512", () => {
        done.push({ i, t: performance.now() - t0 });
        if (done.length === N) resolve(done);
      });
    }
  });
}

/** Cluster completion times into waves: a boundary where the gap to the previous
    completion exceeds 40% of the single-task cost (≈ the first wave's finish time). */
function waves(done) {
  const sorted = [...done].sort((a, b) => a.t - b.t);
  const single = sorted[Math.min(POOL, sorted.length) - 1].t; // first wave finishes ≈ here
  const gap = single * 0.4;
  const out = [];
  let cur = [sorted[0]];
  for (let k = 1; k < sorted.length; k++) {
    if (sorted[k].t - sorted[k - 1].t > gap) {
      out.push(cur);
      cur = [sorted[k]];
    } else cur.push(sorted[k]);
  }
  out.push(cur);
  return { sizes: out.map((w) => w.length), times: sorted.map((d) => +d.t.toFixed(1)) };
}

const done = await runPool();
const w = waves(done);
console.log(JSON.stringify({ pool: POOL, n: N, waveSizes: w.sizes, times: w.times }));
