/* ===========================================================================
   Event-loop-lag engine — the interactive for Ch.14 (Performance & profiling).

   The lesson: a Node process has ONE thread for your JS. Event-loop "lag" is
   how late the loop runs its next scheduled work because it was busy. As long
   as each request's *synchronous* CPU time stays below the gap between
   arrivals, the loop keeps up and lag ≈ 0. The moment per-request CPU exceeds
   that gap, a queue builds on the loop itself — lag and tail latency (p99)
   climb without bound while the loop is pinned at 100% utilization.

   We model the loop as a single-server FIFO queue for CPU time (a D/D/1 queue):
     arrival_i  = i * interval         (interval = 1000 / arrivalsPerSec)
     cpuStart_i = max(arrival_i, finish_{i-1})
     finish_i   = cpuStart_i + cpuMs
     wait_i     = cpuStart_i - arrival_i      ← the loop lag this request sees
     latency_i  = wait_i + cpuMs + ioMs       (ioMs runs OFF the loop)

   Pure & deterministic. The qualitative truth it encodes — synchronous work
   raises event-loop delay far above the idle baseline, and ELU climbs to ~1.0
   under a CPU block — is captured from a real Node via perf_hooks in
   scripts/node-truth-performance.mjs and asserted in scripts/test-performance.ts
   (idle max ≈ resolution; blocked max ≫ idle; ELU idle ≈ 0, busy ≈ 1).
   =========================================================================== */

export type LagVerdict = "healthy" | "strained" | "overloaded";

/** A workload profile: how often requests arrive and how much off-loop I/O each does. */
export interface LagWorkload {
  id: string;
  /** Tab label. */
  title: string;
  blurb: string;
  /** Requests per second arriving at the server. */
  arrivalsPerSec: number;
  /** Off-loop wait per request (DB/network) — does NOT occupy the event loop. */
  ioMs: number;
  /** The synchronous, on-loop CPU cost this profile starts at. */
  defaultCpuMs: number;
}

export interface LagRequest {
  i: number;
  arrivalMs: number;
  /** Event-loop lag this request waited through before its CPU ran. */
  waitMs: number;
  cpuMs: number;
  ioMs: number;
  latencyMs: number;
}

export interface LagResult {
  reqs: LagRequest[];
  lagMeanMs: number;
  lagMaxMs: number;
  p50Ms: number;
  p99Ms: number;
  /** Effective completed requests per second over the window. */
  throughputPerSec: number;
  /** Event-loop utilization 0–100 (busy fraction of the window). */
  eluPct: number;
  verdict: LagVerdict;
}

export const WORKLOADS: LagWorkload[] = [
  {
    id: "async-io",
    title: "Async I/O handler",
    blurb: "The handler awaits the DB/network and does almost no CPU on the loop. The loop stays free; lag stays flat no matter the load.",
    arrivalsPerSec: 200,
    ioMs: 40,
    defaultCpuMs: 2,
  },
  {
    id: "light-sync",
    title: "Light sync work",
    blurb: "A little synchronous work per request (small JSON, a hash). Fine until arrivals get close to the per-request CPU time.",
    arrivalsPerSec: 100,
    ioMs: 0,
    defaultCpuMs: 8,
  },
  {
    id: "heavy-sync",
    title: "Heavy sync work",
    blurb: "A big synchronous task per request (sync crypto, a huge JSON.parse, a bad regex). It pins the loop — every other request queues behind it.",
    arrivalsPerSec: 50,
    ioMs: 0,
    defaultCpuMs: 120,
  },
];

const WINDOW_MS = 1000;
/** Cap the simulated request count so recompute stays instant. */
const MAX_REQS = 600;

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

const round = (n: number): number => Math.round(n * 10) / 10;

/**
 * Run the single-threaded loop as a FIFO CPU queue for one second of traffic.
 * `cpuMs` is the synchronous on-loop cost per request (the knob that matters).
 */
export function simulateLoop(w: LagWorkload, cpuMs: number, windowMs: number = WINDOW_MS): LagResult {
  const interval = 1000 / w.arrivalsPerSec;
  const n = Math.min(MAX_REQS, Math.max(1, Math.floor(windowMs / interval)));
  const reqs: LagRequest[] = [];

  let prevFinish = 0;
  for (let i = 0; i < n; i++) {
    const arrivalMs = i * interval;
    const cpuStart = Math.max(arrivalMs, prevFinish);
    const finish = cpuStart + cpuMs;
    const waitMs = cpuStart - arrivalMs;
    const latencyMs = waitMs + cpuMs + w.ioMs;
    reqs.push({ i, arrivalMs, waitMs, cpuMs, ioMs: w.ioMs, latencyMs });
    prevFinish = finish;
  }

  const waits = reqs.map((r) => r.waitMs);
  const latencies = reqs.map((r) => r.latencyMs).sort((a, b) => a - b);
  const lagMeanMs = waits.reduce((s, x) => s + x, 0) / waits.length;
  const lagMaxMs = Math.max(...waits);

  // The loop can finish at most one request every cpuMs; throughput is bounded
  // by both the arrival rate and the loop's service rate.
  const serviceRate = cpuMs > 0 ? 1000 / cpuMs : Infinity;
  const throughputPerSec = Math.round(Math.min(w.arrivalsPerSec, serviceRate));
  const eluPct = Math.round(Math.min(1, (n * cpuMs) / windowMs) * 100);

  const verdict: LagVerdict = lagMaxMs <= 16 ? "healthy" : lagMaxMs <= 100 ? "strained" : "overloaded";

  return {
    reqs,
    lagMeanMs: round(lagMeanMs),
    lagMaxMs: round(lagMaxMs),
    p50Ms: round(percentile(latencies, 50)),
    p99Ms: round(percentile(latencies, 99)),
    throughputPerSec,
    eluPct,
    verdict,
  };
}

/** Slider bounds for the on-loop CPU cost (ms). */
export const CPU_MS_MIN = 0;
export const CPU_MS_MAX = 200;
