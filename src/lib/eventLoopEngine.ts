/* ===========================================================================
   Event Loop engine — a faithful (but simplified) model of the libuv loop.
   Pure & deterministic: simulate(scenario) returns an array of Frames that the
   UI steps/plays through. Correctness is asserted in scripts/test-eventloop.ts
   against the known-correct console output of each scenario.

   Modeled rules (the ones that matter for teaching):
   - Synchronous "main script" runs first.
   - After main AND after every callback, BOTH microtask queues drain:
     process.nextTick first, then Promise — they are NOT a loop phase.
   - Phases run in fixed order each iteration:
     timers → pending → idle/prepare → poll → check → close.
   - setTimeout/Interval → timers, setImmediate → check, I/O completion → poll.
   =========================================================================== */

export type TaskKind =
  | "sync"
  | "timer"
  | "io"
  | "immediate"
  | "close"
  | "nextTick"
  | "promise";

export interface SpawnSpec {
  kind: TaskKind;
  label: string;
  log: string;
  schedules?: SpawnSpec[];
}
export interface Task extends SpawnSpec {
  id: number;
}

export type MainOp = { op: "log"; log: string } | { op: "schedule"; spec: SpawnSpec };

export interface Scenario {
  id: string;
  title: string;
  blurb: string;
  code: string;
  main: MainOp[];
  expected: string[];
}

export type PhaseKey = "timers" | "pending" | "idle" | "poll" | "check" | "close";

export interface QueuesSnap {
  timers: Task[];
  pending: Task[];
  poll: Task[];
  check: Task[];
  close: Task[];
  nextTick: Task[];
  promise: Task[];
}

export interface Frame {
  step: number;
  zone: "main" | "phase" | "micro" | "done";
  phaseKey: PhaseKey | null;
  caption: string;
  acted: { kind: TaskKind; label: string; log: string } | null;
  queues: QueuesSnap;
  output: string[];
  iteration: number;
}

interface Phase {
  key: PhaseKey;
  q: keyof QueuesSnap | null;
  label: string;
}
export const PHASES: Phase[] = [
  { key: "timers", q: "timers", label: "timers" },
  { key: "pending", q: "pending", label: "pending callbacks" },
  { key: "idle", q: null, label: "idle, prepare" },
  { key: "poll", q: "poll", label: "poll" },
  { key: "check", q: "check", label: "check" },
  { key: "close", q: "close", label: "close callbacks" },
];

function queueOf(kind: TaskKind): keyof QueuesSnap {
  switch (kind) {
    case "timer":
      return "timers";
    case "io":
      return "poll";
    case "immediate":
      return "check";
    case "close":
      return "close";
    case "nextTick":
      return "nextTick";
    case "promise":
      return "promise";
    case "sync":
      return "timers"; // never enqueued — sync runs inline
  }
}

export function simulate(s: Scenario): Frame[] {
  const q: QueuesSnap = {
    timers: [],
    pending: [],
    poll: [],
    check: [],
    close: [],
    nextTick: [],
    promise: [],
  };
  const output: string[] = [];
  const frames: Frame[] = [];
  let nextId = 0;
  let iteration = 0;
  const CAP = 800;

  const clone = (): QueuesSnap => ({
    timers: [...q.timers],
    pending: [...q.pending],
    poll: [...q.poll],
    check: [...q.check],
    close: [...q.close],
    nextTick: [...q.nextTick],
    promise: [...q.promise],
  });

  const snap = (
    zone: Frame["zone"],
    phaseKey: PhaseKey | null,
    caption: string,
    acted: Frame["acted"],
  ): void => {
    frames.push({
      step: frames.length,
      zone,
      phaseKey,
      caption,
      acted,
      queues: clone(),
      output: [...output],
      iteration,
    });
    if (frames.length > CAP) throw new Error("event-loop sim exceeded frame cap");
  };

  const schedule = (spec: SpawnSpec): void => {
    const t: Task = { ...spec, id: nextId++ };
    (q[queueOf(spec.kind)] as Task[]).push(t);
  };

  const runTask = (t: Task): void => {
    output.push(t.log);
    if (t.schedules) for (const sp of t.schedules) schedule(sp);
  };

  const drainMicro = (): void => {
    while (q.nextTick.length || q.promise.length) {
      if (q.nextTick.length) {
        const t = q.nextTick.shift() as Task;
        runTask(t);
        snap("micro", null, `process.nextTick() → '${t.log}'  ·  microtask (highest priority)`, {
          kind: t.kind,
          label: t.label,
          log: t.log,
        });
      } else {
        const t = q.promise.shift() as Task;
        runTask(t);
        snap("micro", null, `Promise.then() → '${t.log}'  ·  microtask`, {
          kind: t.kind,
          label: t.label,
          log: t.log,
        });
      }
    }
  };

  // 1) main script — one frame per op
  for (const op of s.main) {
    if (op.op === "log") {
      output.push(op.log);
      snap("main", null, `Synchronous: console.log('${op.log}')`, {
        kind: "sync",
        label: "sync",
        log: op.log,
      });
    } else {
      schedule(op.spec);
      snap("main", null, `Schedule ${op.spec.label} → ${queueOf(op.spec.kind)} queue`, null);
    }
  }
  snap("main", null, "Main script done, call stack empty → drain microtasks before the loop.", null);
  drainMicro();

  const hasMacro = (): boolean =>
    q.timers.length > 0 ||
    q.pending.length > 0 ||
    q.poll.length > 0 ||
    q.check.length > 0 ||
    q.close.length > 0;

  // 2) the loop
  while (hasMacro()) {
    iteration++;
    for (const ph of PHASES) {
      const list = ph.q ? (q[ph.q] as Task[]) : null;

      let cap: string;
      if (ph.key === "idle") {
        cap = "idle, prepare — libuv internal bookkeeping (not your code).";
      } else if (!list || list.length === 0) {
        if (ph.key === "poll") {
          cap = q.check.length
            ? "poll — empty & setImmediate pending → don't block, continue to check."
            : q.timers.length
              ? "poll — empty; here the loop would wait for I/O or the nearest timer."
              : "poll — empty.";
        } else {
          cap = `${ph.label} — queue empty, skip.`;
        }
      } else {
        cap = `Enter ${ph.label} phase — run its callbacks (FIFO).`;
      }
      snap("phase", ph.key, `Iteration ${iteration} · ${cap}`, null);

      if (list) {
        while (list.length) {
          const t = list.shift() as Task;
          runTask(t);
          const verb =
            ph.key === "timers"
              ? "setTimeout/Interval callback"
              : ph.key === "check"
                ? "setImmediate callback"
                : ph.key === "poll"
                  ? "I/O callback"
                  : ph.key === "close"
                    ? "close callback"
                    : "callback";
          snap("phase", ph.key, `${ph.label} — ${verb} → '${t.log}'`, {
            kind: t.kind,
            label: t.label,
            log: t.log,
          });
          drainMicro(); // microtasks after EVERY callback
        }
      }
    }
  }

  snap("done", null, "No timers, I/O, immediates or close callbacks remain → the loop exits.", null);
  return frames;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "classic",
    title: "The classic order",
    blurb: "sync · setTimeout(0) · setImmediate · Promise · nextTick — predict the output.",
    code: `console.log('start');                          // sync
setTimeout(() => console.log('timeout'), 0);   // timers
setImmediate(() => console.log('immediate'));  // check
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');                            // sync`,
    main: [
      { op: "log", log: "start" },
      { op: "schedule", spec: { kind: "timer", label: "setTimeout(0) cb", log: "timeout" } },
      { op: "schedule", spec: { kind: "immediate", label: "setImmediate cb", log: "immediate" } },
      { op: "schedule", spec: { kind: "promise", label: "Promise.then cb", log: "promise" } },
      { op: "schedule", spec: { kind: "nextTick", label: "process.nextTick cb", log: "nextTick" } },
      { op: "log", log: "end" },
    ],
    expected: ["start", "end", "nextTick", "promise", "timeout", "immediate"],
  },
  {
    id: "io-immediate",
    title: "Inside I/O: setImmediate wins",
    blurb: "Within an I/O callback, setImmediate always runs before setTimeout(0).",
    code: `const fs = require('fs');
console.log('start');
fs.readFile(__filename, () => {
  console.log('read file done');             // poll phase
  setTimeout(() => console.log('timeout'), 0);
  setImmediate(() => console.log('immediate'));
});
console.log('end');`,
    main: [
      { op: "log", log: "start" },
      {
        op: "schedule",
        spec: {
          kind: "io",
          label: "fs.readFile cb",
          log: "read file done",
          schedules: [
            { kind: "timer", label: "setTimeout(0) cb", log: "timeout" },
            { kind: "immediate", label: "setImmediate cb", log: "immediate" },
          ],
        },
      },
      { op: "log", log: "end" },
    ],
    expected: ["start", "end", "read file done", "immediate", "timeout"],
  },
];
