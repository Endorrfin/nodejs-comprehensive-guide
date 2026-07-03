/* Correctness checks for the event-loop-lag engine (Ch.14).
   Run: node --experimental-strip-types scripts/test-performance.ts

   (1) engine invariants — a stable async handler keeps lag ≈ 0 and flat
       latency; a heavy synchronous handler pins the loop (ELU→100%) and lag /
       p99 explode; raising on-loop CPU never lowers lag (monotonic);
   (2) LIVE anchor — perf_hooks.monitorEventLoopDelay() returns a nanosecond
       histogram and a real synchronous block raises its max far above idle,
       while performance.eventLoopUtilization() climbs to ~1.0 when blocked.   */
import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import {
  WORKLOADS,
  simulateLoop,
  simulateOneBlock, // CHANGED: S15
  BLOCK_ARRIVALS_PER_SEC, // CHANGED: S15
  BLOCK_FAST_CPU_MS, // CHANGED: S15
  type LagWorkload,
} from "../src/lib/eventLoopLagEngine.ts";

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

// === ADDED: S15 — simulateOneBlock (Ch.3 "block the loop") invariants ========
const gap = 1000 / BLOCK_ARRIVALS_PER_SEC; // 10 ms between innocent arrivals

const b0 = simulateOneBlock(0);
check("block 0ms: nobody stalls", b0.stalled === 0 && b0.worstWaitMs === 0, `stalled=${b0.stalled}`);
check("block 0ms: flat latency (p99 === p50 === fast cost)", b0.p99Ms === b0.p50Ms && b0.p50Ms === BLOCK_FAST_CPU_MS, `p50=${b0.p50Ms} p99=${b0.p99Ms}`);
check("block 0ms: verdict healthy", b0.verdict === "healthy");

const b250 = simulateOneBlock(250);
check("block 250ms: only innocents reported (100/s window)", b250.reqs.length === BLOCK_ARRIVALS_PER_SEC, `n=${b250.reqs.length}`);
check("block 250ms: worst wait ≈ the block (within one gap)", b250.worstWaitMs > 250 - gap && b250.worstWaitMs <= 250, `= ${b250.worstWaitMs}`);
check("block 250ms: at least block/gap requests stall", b250.stalled >= Math.floor(250 / gap), `stalled=${b250.stalled}`);
check("block 250ms: p99 inherits the stall while p50 stays fast", b250.p99Ms > 100 && b250.p50Ms <= 2 * BLOCK_FAST_CPU_MS, `p50=${b250.p50Ms} p99=${b250.p99Ms}`);
check("block 250ms: verdict overloaded", b250.verdict === "overloaded");

// monotonic: a longer block never lowers the tail or the stall count
const bLadder = [0, 20, 60, 120, 250].map((b) => simulateOneBlock(b));
let bMono = true;
for (let i = 1; i < bLadder.length; i++) {
  if (bLadder[i].p99Ms < bLadder[i - 1].p99Ms || bLadder[i].stalled < bLadder[i - 1].stalled) bMono = false;
}
check("one-block: p99 + stalled monotonic in block length", bMono, `p99=[${bLadder.map((r) => r.p99Ms).join(", ")}]`);

// under one arrival gap the block hurts at most one request's frame budget
const bTiny = simulateOneBlock(8); // 8 < 10ms gap
check("block below one gap: at most 1 stalled, still healthy", bTiny.stalled <= 1 && bTiny.verdict === "healthy", `stalled=${bTiny.stalled} worst=${bTiny.worstWaitMs}`);
// === end ADDED: S15 ==========================================================

// ---- (2) LIVE anchor: monitorEventLoopDelay + eventLoopUtilization ----------
const ms = (ns: number): number => +(ns / 1e6).toFixed(2);
const sleep = (t: number): Promise<void> => new Promise((r) => setTimeout(r, t));
const burn = (t: number): void => { const end = Date.now() + t; while (Date.now() < end) { /* busy-wait */ } };

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
