/* Correctness checks for the event-loop-lag engine (Ch.14).
   Run: node --experimental-strip-types scripts/test-performance.ts

   (1) engine invariants — a stable async handler keeps lag ≈ 0 and flat
       latency; a heavy synchronous handler pins the loop (ELU→100%) and lag /
       p99 explode; raising on-loop CPU never lowers lag (monotonic);
   (2) LIVE anchor — perf_hooks.monitorEventLoopDelay() returns a nanosecond
       histogram and a real synchronous block raises its max far above idle,
       while performance.eventLoopUtilization() climbs to ~1.0 when blocked.   */
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import { WORKLOADS, simulateLoop, type LagWorkload } from "../src/lib/eventLoopLagEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};
const get = (id: string): LagWorkload => WORKLOADS.find((w) => w.id === id)!;

// ---- (1) engine invariants -------------------------------------------------
const asyncIo = get("async-io");
const heavy = get("heavy-sync");

const aRes = simulateLoop(asyncIo, asyncIo.defaultCpuMs);
check("async-io: verdict healthy", aRes.verdict === "healthy", `lagMax=${aRes.lagMaxMs}`);
check("async-io: lag stays ≈ 0", aRes.lagMaxMs === 0, `= ${aRes.lagMaxMs}`);
check("async-io: latency is flat (p99 === p50)", aRes.p99Ms === aRes.p50Ms, `p50=${aRes.p50Ms} p99=${aRes.p99Ms}`);
check("async-io: ELU stays low (<50%)", aRes.eluPct < 50, `= ${aRes.eluPct}%`);

const hRes = simulateLoop(heavy, heavy.defaultCpuMs);
check("heavy-sync: verdict overloaded", hRes.verdict === "overloaded", `lagMax=${hRes.lagMaxMs}`);
check("heavy-sync: loop pinned (ELU 100%)", hRes.eluPct === 100, `= ${hRes.eluPct}%`);
check("heavy-sync: p99 ≫ p50 (queue builds)", hRes.p99Ms > hRes.p50Ms * 1.5, `p50=${hRes.p50Ms} p99=${hRes.p99Ms}`);
check("heavy-sync: lag is large (>100ms)", hRes.lagMaxMs > 100, `= ${hRes.lagMaxMs}`);

// monotonic: more on-loop CPU never reduces lag
const ladder = [0, 10, 40, 120, 200].map((c) => simulateLoop(heavy, c).lagMaxMs);
let monotonic = true;
for (let i = 1; i < ladder.length; i++) if (ladder[i] < ladder[i - 1]) monotonic = false;
check("lag is monotonic in on-loop CPU", monotonic, `[${ladder.join(", ")}]`);

// CPU below the arrival gap ⇒ no queue, lag 0
const belowGap = simulateLoop(asyncIo, 4); // interval = 1000/200 = 5ms; 4 < 5
check("CPU below arrival gap ⇒ lag 0", belowGap.lagMaxMs === 0, `= ${belowGap.lagMaxMs}`);

// ---- (2) LIVE anchor: monitorEventLoopDelay + eventLoopUtilization ----------
const ms = (ns: number): number => +(ns / 1e6).toFixed(2);
const sleep = (t: number): Promise<void> => new Promise((r) => setTimeout(r, t));
const burn = (t: number): void => { const end = Date.now() + t; while (Date.now() < end) {} };

async function delay(work: () => Promise<void>): Promise<{ mean: number; max: number }> {
  const h = monitorEventLoopDelay({ resolution: 10 });
  h.enable();
  await work();
  h.disable();
  return { mean: ms(h.mean), max: ms(h.max) };
}

const idle = await delay(async () => { for (let i = 0; i < 8; i++) await sleep(20); });
const blocked = await delay(async () => { for (let i = 0; i < 5; i++) { await sleep(20); burn(50); } });
check("live: monitorEventLoopDelay gives numeric mean/max", typeof idle.max === "number" && typeof blocked.max === "number");
check("live: blocked loop-delay max > idle", blocked.max > idle.max, `idle=${idle.max} blocked=${blocked.max}`);
check("live: blocked loop-delay max ≥ 25ms", blocked.max >= 25, `= ${blocked.max}`);
check("live: blocked mean > idle mean", blocked.mean > idle.mean, `idle=${idle.mean} blocked=${blocked.mean}`);

async function elu(work: () => Promise<void>): Promise<number> {
  const a = performance.eventLoopUtilization();
  await work();
  return +performance.eventLoopUtilization(a).utilization.toFixed(3);
}
const eluIdle = await elu(async () => { for (let i = 0; i < 8; i++) await sleep(20); });
const eluBusy = await elu(async () => { burn(150); });
check("live: ELU idle is low (<0.3)", eluIdle < 0.3, `= ${eluIdle}`);
check("live: ELU busy is high (>0.5) and > idle", eluBusy > 0.5 && eluBusy > eluIdle, `idle=${eluIdle} busy=${eluBusy}`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
