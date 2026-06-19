/* ===========================================================================
   Thread-pool-vs-kernel engine — a faithful, simplified model of how Node
   dispatches asynchronous work (the "Concurrency" chapter, hero sim).

   Two paths, one event loop:
   - POOL lane  → the libuv thread pool (default 4 slots). fs, crypto, zlib and
     dns.lookup run BLOCKING C calls here, so they occupy a slot for their whole
     duration. More tasks than slots ⇒ the extras WAIT in a queue and complete
     in WAVES of `poolSize`.
   - KERNEL lane → the OS (epoll / kqueue / IOCP). Sockets/network I/O are
     non-blocking: one loop thread arms thousands of them at once and the kernel
     notifies on readiness — NO pool thread is held. So they all fly concurrently.

   Pure & deterministic: simulate(scenario, poolSize) returns Frame[] the UI
   steps through. poolWaveSizes() returns the pool-lane completion wave sizes,
   which are asserted in scripts/test-concurrency.ts against the structure
   measured from real Node 22 (crypto.pbkdf2 ×6):
       pool 2 → [2,2,2]   pool 4 → [4,2]   pool 6 → [6]
   (see scripts/node-truth-threadpool.mjs).
   =========================================================================== */

export type Lane = "pool" | "kernel";

export interface TaskSpec {
  id: number;
  lane: Lane;
  label: string; // e.g. "pbkdf2 #1" or "GET /a"
  cost: number; // ticks of work (slot-occupancy for pool; latency for kernel)
}

export interface Scenario {
  id: string;
  title: string;
  blurb: string;
  poolSize: number; // default slots (UI can override)
  poolSizes?: number[]; // selectable pool sizes for this scenario
  tasks: TaskSpec[];
  takeaway: string;
  code: string; // the program shown in the sim's left panel
}

export interface RunSlot {
  task: TaskSpec;
  remaining: number;
}
export interface DoneRec {
  task: TaskSpec;
  finish: number; // tick it completed
}

export type EventKind = "dispatch" | "tick" | "complete" | "done";

export interface Frame {
  step: number;
  now: number; // tick
  event: EventKind;
  caption: string;
  poolSize: number;
  queue: TaskSpec[]; // waiting pool tasks
  slots: (RunSlot | null)[]; // length === poolSize
  kernel: RunSlot[]; // network ops in flight
  done: DoneRec[]; // completed, in completion order
  justFinished: number[]; // task ids that finished on this frame (highlight)
}

const CAP = 400;

export function simulate(s: Scenario, poolSizeOverride?: number): Frame[] {
  const poolSize = poolSizeOverride ?? s.poolSize;
  const frames: Frame[] = [];

  const poolTasks = s.tasks.filter((t) => t.lane === "pool");
  const kernelTasks = s.tasks.filter((t) => t.lane === "kernel");

  const queue: TaskSpec[] = [...poolTasks];
  const slots: (RunSlot | null)[] = Array.from({ length: poolSize }, () => null);
  const kernel: RunSlot[] = kernelTasks.map((task) => ({ task, remaining: task.cost }));
  const done: DoneRec[] = [];
  let now = 0;

  const snap = (event: EventKind, caption: string, justFinished: number[]): void => {
    frames.push({
      step: frames.length,
      now,
      event,
      caption,
      poolSize,
      queue: [...queue],
      slots: slots.map((sl) => (sl ? { task: sl.task, remaining: sl.remaining } : null)),
      kernel: kernel.map((k) => ({ task: k.task, remaining: k.remaining })),
      done: [...done],
      justFinished,
    });
    if (frames.length > CAP) throw new Error("thread-pool sim exceeded frame cap");
  };

  // fill free slots from the queue (FIFO)
  const fillSlots = (): void => {
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i] && queue.length) {
        const task = queue.shift() as TaskSpec;
        slots[i] = { task, remaining: task.cost };
      }
    }
  };

  // ------------------------------------------------------------- dispatch (t=0)
  fillSlots();
  const kn = kernelTasks.length;
  const queued = queue.length;
  snap(
    "dispatch",
    `Dispatch. ${kn ? `${kn} network op${kn > 1 ? "s" : ""} armed on the kernel at once (no thread held). ` : ""}` +
      `${poolTasks.length ? `${Math.min(poolSize, poolTasks.length)} pool task${poolSize > 1 ? "s" : ""} take the ${poolSize} slot${poolSize > 1 ? "s" : ""}${queued ? `; ${queued} wait in the queue` : ""}.` : ""}`,
    [],
  );

  const anyRunning = (): boolean =>
    slots.some((sl) => sl !== null) || kernel.some((k) => k.remaining > 0) || queue.length > 0;

  // --------------------------------------------------------------- tick by tick
  while (anyRunning()) {
    now++;
    // advance running work by one tick
    for (const sl of slots) if (sl) sl.remaining--;
    for (const k of kernel) if (k.remaining > 0) k.remaining--;

    // collect completions this tick
    const justFinished: number[] = [];
    for (let i = 0; i < slots.length; i++) {
      const sl = slots[i];
      if (sl && sl.remaining <= 0) {
        done.push({ task: sl.task, finish: now });
        justFinished.push(sl.task.id);
        slots[i] = null;
      }
    }
    for (const k of kernel) {
      if (k.remaining === 0 && !done.some((d) => d.task.id === k.task.id)) {
        done.push({ task: k.task, finish: now });
        justFinished.push(k.task.id);
        k.remaining = -1; // mark consumed
      }
    }

    if (justFinished.length) {
      const poolDone = justFinished.filter((id) => poolTasks.some((t) => t.id === id)).length;
      const kerDone = justFinished.length - poolDone;
      const waiting = queue.length;
      const parts: string[] = [];
      if (poolDone) parts.push(`${poolDone} pool task${poolDone > 1 ? "s" : ""} finished`);
      if (kerDone) parts.push(`${kerDone} network op${kerDone > 1 ? "s" : ""} finished`);
      let cap = `Tick ${now}: ${parts.join(" · ")}.`;
      if (poolDone && waiting) cap += ` ${Math.min(poolDone, waiting)} queued task${Math.min(poolDone, waiting) > 1 ? "s" : ""} now claim${Math.min(poolDone, waiting) > 1 ? "" : "s"} the freed slot${poolDone > 1 ? "s" : ""}.`;
      else if (poolDone && !waiting) cap += ` Their slots go idle — the queue is empty.`;
      // free slots already cleared; refill from queue
      fillSlots();
      snap("complete", cap, justFinished);
    } else {
      snap("tick", `Tick ${now}: work in progress…`, []);
    }
  }

  snap("done", "Everything completed. Notice the pool finished in waves; the kernel ops all finished together.", []);
  return frames;
}

/** Pool-lane completion wave sizes (objects finishing on the same tick).
    Asserted against real Node in scripts/test-concurrency.ts. */
export function poolWaveSizes(s: Scenario, poolSizeOverride?: number): number[] {
  const frames = simulate(s, poolSizeOverride);
  const final = frames[frames.length - 1];
  const poolIds = new Set(s.tasks.filter((t) => t.lane === "pool").map((t) => t.id));
  const byFinish = new Map<number, number>();
  for (const d of final.done) {
    if (!poolIds.has(d.task.id)) continue;
    byFinish.set(d.finish, (byFinish.get(d.finish) ?? 0) + 1);
  }
  return [...byFinish.keys()].sort((a, b) => a - b).map((k) => byFinish.get(k) as number);
}

/** Kernel-lane completion wave sizes — should always be a single wave. */
export function kernelWaveSizes(s: Scenario, poolSizeOverride?: number): number[] {
  const frames = simulate(s, poolSizeOverride);
  const final = frames[frames.length - 1];
  const kerIds = new Set(s.tasks.filter((t) => t.lane === "kernel").map((t) => t.id));
  const byFinish = new Map<number, number>();
  for (const d of final.done) {
    if (!kerIds.has(d.task.id)) continue;
    byFinish.set(d.finish, (byFinish.get(d.finish) ?? 0) + 1);
  }
  return [...byFinish.keys()].sort((a, b) => a - b).map((k) => byFinish.get(k) as number);
}

const POOL_COST = 5;
const NET_COST = 6;

const poolTask = (n: number, label: string): TaskSpec => ({ id: n, lane: "pool", label, cost: POOL_COST });
const netTask = (n: number, label: string): TaskSpec => ({ id: n, lane: "kernel", label, cost: NET_COST });

/* ---------------------------------------------------------------- scenarios.
   Pool-lane wave sizes were captured from real Node 22 (crypto.pbkdf2 ×6) —
   see scripts/node-truth-threadpool.mjs:  pool2 → [2,2,2], pool4 → [4,2],
   pool6 → [6].  The "expectedWaves" map below is asserted in
   scripts/test-concurrency.ts.                                                */
export const SCENARIOS: Scenario[] = [
  {
    id: "saturate",
    title: "The pool saturates",
    blurb: "6 crypto.pbkdf2 hashes on a fixed pool — extras queue and finish in waves. Change the pool size and watch the waves change.",
    poolSize: 4,
    poolSizes: [2, 4, 6],
    takeaway:
      "The libuv pool is a fixed, shared resource (default 4). N CPU-bound pool tasks finish in ⌈N / poolSize⌉ waves — one slow pbkdf2 delays every other fs/crypto/zlib call in the process.",
    code: `const crypto = require('node:crypto');
// 6 CPU-bound hashes — each holds a pool thread
// for its whole duration (a blocking C call).
for (let i = 1; i <= 6; i++) {
  crypto.pbkdf2('pw', 's' + i, 1e6, 64, 'sha512', done);
}`,
    tasks: [
      poolTask(1, "pbkdf2 #1"),
      poolTask(2, "pbkdf2 #2"),
      poolTask(3, "pbkdf2 #3"),
      poolTask(4, "pbkdf2 #4"),
      poolTask(5, "pbkdf2 #5"),
      poolTask(6, "pbkdf2 #6"),
    ],
  },
  {
    id: "kernel",
    title: "The kernel needs no thread",
    blurb: "6 http.get requests — non-blocking sockets the OS watches. They all fly at once; the pool stays empty.",
    poolSize: 4,
    poolSizes: [2, 4],
    takeaway:
      "Network I/O is non-blocking: the kernel (epoll/kqueue/IOCP) watches every socket and the loop is notified on readiness. No pool thread is held, so thousands of connections scale on one thread — this is Node's core strength.",
    code: `const https = require('node:https');
// 6 network requests — non-blocking sockets the
// kernel watches; NO pool thread is held.
for (const p of ['/a','/b','/c','/d','/e','/f']) {
  https.get('https://api.example.com' + p, done);
}`,
    tasks: [
      netTask(1, "GET /a"),
      netTask(2, "GET /b"),
      netTask(3, "GET /c"),
      netTask(4, "GET /d"),
      netTask(5, "GET /e"),
      netTask(6, "GET /f"),
    ],
  },
  {
    id: "sidebyside",
    title: "Side by side",
    blurb: "4 pbkdf2 (pool) + 6 http.get (kernel) launched together — the reference 'live scheme'.",
    poolSize: 4,
    poolSizes: [2, 4],
    takeaway:
      "Same loop, two worlds. The 4 pool threads do blocking CPU work; meanwhile the kernel runs all 6 network ops concurrently with zero threads. Pick the pool only for CPU/file/compress work — never to 'speed up' network calls.",
    code: `// 4 pool tasks (CPU) + 6 network requests,
// launched together on ONE event loop.
for (let i = 1; i <= 4; i++)
  crypto.pbkdf2('pw', 's'+i, 1e6, 64, 'sha512', done);
for (const p of ['/a','/b','/c','/d','/e','/f'])
  https.get(host + p, done);`,
    tasks: [
      poolTask(1, "pbkdf2 #1"),
      poolTask(2, "pbkdf2 #2"),
      poolTask(3, "pbkdf2 #3"),
      poolTask(4, "pbkdf2 #4"),
      netTask(5, "GET /a"),
      netTask(6, "GET /b"),
      netTask(7, "GET /c"),
      netTask(8, "GET /d"),
      netTask(9, "GET /e"),
      netTask(10, "GET /f"),
    ],
  },
];
