/* Ground truth for the event-loop-lag engine (Ch.14 Performance).
   Proves, on a REAL Node, the two signals the chapter teaches:
     (1) perf_hooks.monitorEventLoopDelay() returns a nanosecond histogram
         (.mean/.max/.percentile) and a synchronous CPU block raises the
         measured delay FAR above the idle baseline;
     (2) performance.eventLoopUtilization() climbs toward ~1.0 while the loop
         is blocked and stays low while it only waits on async I/O.
   Run: node scripts/node-truth-performance.mjs                                */
import { monitorEventLoopDelay, performance } from "node:perf_hooks";

const ms = (ns) => +(ns / 1e6).toFixed(2);
const sleep = (t) => new Promise((r) => setTimeout(r, t));
const burn = (t) => { const end = Date.now() + t; while (Date.now() < end) {} };

// ---- (1) idle baseline vs blocked, via monitorEventLoopDelay ----------------
async function measure(label, work) {
  const h = monitorEventLoopDelay({ resolution: 10 });
  h.enable();
  await work();
  h.disable();
  return { label, mean: ms(h.mean), max: ms(h.max), p99: ms(h.percentile(99)) };
}

// idle: just wait on timers (async) — the loop is free, lag stays near resolution
const idle = await measure("idle", async () => { for (let i = 0; i < 12; i++) await sleep(20); });

// blocked: each timer callback busy-loops 50ms — the NEXT timer fires late,
// so the histogram records large delays
const blocked = await measure("blocked", async () => {
  for (let i = 0; i < 6; i++) { await sleep(20); burn(50); }
});

// ---- (2) event-loop utilization ---------------------------------------------
function eluOver(work) {
  const a = performance.eventLoopUtilization();
  return work().then(() => {
    const b = performance.eventLoopUtilization(a);
    return +b.utilization.toFixed(3); // 0 = idle, 1 = fully busy
  });
}
const eluIdle = await eluOver(async () => { for (let i = 0; i < 10; i++) await sleep(20); });
const eluBusy = await eluOver(async () => { burn(200); }); // 200ms straight on the loop

const truth = {
  node: process.version,
  monitorEventLoopDelay: {
    idle,
    blocked,
    blockedMaxFarAboveIdle: blocked.max > idle.max * 3,
  },
  eventLoopUtilization: {
    idle: eluIdle,        // ~0
    busy: eluBusy,        // ~1
    busyMuchHigher: eluBusy > eluIdle + 0.5,
  },
};
console.log(JSON.stringify(truth, null, 2));
