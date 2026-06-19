/* Correctness check for the thread-pool engine.
   Run: node --experimental-strip-types scripts/test-concurrency.ts
   Asserts the engine's POOL-lane completion waves match the structure measured
   from real Node 22 (crypto.pbkdf2 ×6 at different UV_THREADPOOL_SIZE values —
   see scripts/node-truth-threadpool.mjs), and that KERNEL ops always finish in
   a single concurrent wave regardless of pool size. */
import { SCENARIOS, poolWaveSizes, kernelWaveSizes } from "../src/lib/threadPoolEngine.ts";

const eq = (a: number[], b: number[]): boolean => JSON.stringify(a) === JSON.stringify(b);
let failed = 0;
const check = (name: string, got: number[], want: number[]): void => {
  const ok = eq(got, want);
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
  console.log(`   got=[${got.join(",")}]  expected=[${want.join(",")}]`);
};

const saturate = SCENARIOS.find((s) => s.id === "saturate")!;

// Pool-lane waves — the headline fact, captured from real Node 22.
check("saturate · pool 2 → [2,2,2]", poolWaveSizes(saturate, 2), [2, 2, 2]);
check("saturate · pool 4 → [4,2]", poolWaveSizes(saturate, 4), [4, 2]);
check("saturate · pool 6 → [6]", poolWaveSizes(saturate, 6), [6]);

// Kernel lane: non-blocking, so all ops finish in ONE wave whatever the pool size.
const kernel = SCENARIOS.find((s) => s.id === "kernel")!;
check("kernel · pool 2 → one wave [6]", kernelWaveSizes(kernel, 2), [6]);
check("kernel · pool 4 → one wave [6]", kernelWaveSizes(kernel, 4), [6]);

// Side by side: 4 pool tasks fit in 4 slots (one wave); 6 kernel ops fly at once.
const sbs = SCENARIOS.find((s) => s.id === "sidebyside")!;
check("sidebyside · pool 4 → pool [4]", poolWaveSizes(sbs, 4), [4]);
check("sidebyside · pool 4 → kernel [6]", kernelWaveSizes(sbs, 4), [6]);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
