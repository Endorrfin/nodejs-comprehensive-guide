/* ===========================================================================
   Async-ordering engine — a faithful, simplified model of how Node sequences
   synchronous code, microtasks and macrotasks (the "async model" chapter).

   Pure & deterministic: simulate(scenario) returns Frame[] the UI steps through.
   Correctness is asserted in scripts/test-async.ts against the KNOWN-CORRECT
   console output captured from real Node (CommonJS "main script" semantics).

   Modeled rules (the ones that matter for teaching):
   - The main script runs synchronously on the call stack, top to bottom.
   - Calling an async function runs its body synchronously UNTIL the first await;
     at the await it SUSPENDS — the remainder becomes a microtask (Promise queue)
     and control returns to the caller. (V8 schedules the continuation in a single
     microtask tick: see v8.dev/blog/fast-async.)
   - After the stack empties, microtasks drain: process.nextTick FIRST, then the
     Promise/queueMicrotask queue — fully — before any macrotask.
   - Then ONE macrotask runs (timers before check), microtasks drain again, repeat.
   NOTE: this is the canonical CommonJS model. In ES modules, top-level
   process.nextTick can run AFTER promises (module evaluation is itself a
   microtask) — covered as a pitfall in the chapter, not in this engine.
   =========================================================================== */

export type MicroKind = "nextTick" | "promise";
export type MacroKind = "timeout" | "immediate";
export type QueueKind = MicroKind | MacroKind;
export type ActKind = "sync" | QueueKind | "suspend" | "resume" | "call";

/** One straight-line segment of an async function body, between awaits. */
export interface Seg {
  logs: string[];
  line?: number; // source line highlighted while this segment runs
  awaitLine?: number; // source line of the await that follows this segment
}

export interface TaskSpec {
  kind: QueueKind;
  label: string; // chip label shown in a queue
  text: string; // what the callback logs
  line?: number; // source line of the callback
  schedules?: TaskSpec[]; // tasks this callback schedules when it runs
}

export type Op =
  | { op: "log"; text: string; line?: number }
  | { op: "schedule"; spec: TaskSpec }
  | { op: "call"; fn: string; segs: Seg[]; callLine?: number };

export interface Scenario {
  id: string;
  title: string;
  blurb: string;
  code: string;
  main: Op[];
  expected: string[];
  takeaway: string;
}

export interface Task {
  id: number;
  kind: QueueKind;
  label: string;
  text?: string;
  line?: number;
  fn?: string; // async-fn name (for await continuations)
  rest?: Seg[]; // remaining segments (await continuation)
  schedules?: TaskSpec[];
}

export interface OutLine {
  n: number;
  text: string;
}

export interface Frame {
  step: number;
  zone: "sync" | "micro" | "macro" | "done";
  caption: string;
  stack: string[];
  micro: { nextTick: Task[]; promise: Task[] };
  macro: { timeout: Task[]; immediate: Task[] };
  output: OutLine[];
  acted: { kind: ActKind; text: string } | null;
  line: number | null;
}

export function simulate(s: Scenario): Frame[] {
  const micro = { nextTick: [] as Task[], promise: [] as Task[] };
  const macro = { timeout: [] as Task[], immediate: [] as Task[] };
  const output: OutLine[] = [];
  const frames: Frame[] = [];
  const stack: string[] = [];
  let nextId = 0;
  const CAP = 600;

  const qOf = (k: QueueKind): Task[] =>
    k === "nextTick"
      ? micro.nextTick
      : k === "promise"
        ? micro.promise
        : k === "timeout"
          ? macro.timeout
          : macro.immediate;

  const snap = (
    zone: Frame["zone"],
    caption: string,
    acted: Frame["acted"],
    line: number | null,
  ): void => {
    frames.push({
      step: frames.length,
      zone,
      caption,
      acted,
      line,
      stack: [...stack],
      micro: { nextTick: [...micro.nextTick], promise: [...micro.promise] },
      macro: { timeout: [...macro.timeout], immediate: [...macro.immediate] },
      output: output.map((o) => ({ ...o })),
    });
    if (frames.length > CAP) throw new Error("async sim exceeded frame cap");
  };

  const emit = (text: string): void => {
    output.push({ n: output.length + 1, text });
  };

  const scheduleSpec = (spec: TaskSpec): void => {
    qOf(spec.kind).push({
      id: nextId++,
      kind: spec.kind,
      label: spec.label,
      text: spec.text,
      line: spec.line,
      schedules: spec.schedules,
    });
  };

  const scheduleCont = (fn: string, rest: Seg[]): void => {
    micro.promise.push({ id: nextId++, kind: "promise", label: `${fn}() ⟳`, fn, rest, line: rest[0]?.line });
  };

  // ---------------------------------------------------------------- 1) main
  stack.push("(main script)");
  snap("sync", "Main script is on the call stack — synchronous code runs top to bottom.", null, null);

  for (const o of s.main) {
    if (o.op === "log") {
      emit(o.text);
      snap("sync", `console.log('${o.text}') runs now — synchronously.`, { kind: "sync", text: o.text }, o.line ?? null);
    } else if (o.op === "schedule") {
      scheduleSpec(o.spec);
      const where =
        o.spec.kind === "nextTick"
          ? "the process.nextTick queue (microtask · highest priority)"
          : o.spec.kind === "promise"
            ? "the Promise / microtask queue"
            : o.spec.kind === "timeout"
              ? "the timers queue (macrotask)"
              : "the check queue (setImmediate · macrotask)";
      snap("sync", `Register a callback → ${where}. Nothing runs yet; the loop keeps going.`, { kind: o.spec.kind, text: o.spec.text }, o.spec.line ?? null);
    } else {
      stack.push(`${o.fn}()`);
      snap("sync", `Call ${o.fn}() — the async body runs synchronously until the first await.`, { kind: "call", text: `${o.fn}()` }, o.callLine ?? null);
      const seg0 = o.segs[0];
      for (const lg of seg0.logs) {
        emit(lg);
        snap("sync", `Inside ${o.fn}(): console.log('${lg}') — still synchronous.`, { kind: "sync", text: lg }, seg0.line ?? null);
      }
      if (o.segs.length > 1) {
        snap("sync", `await — ${o.fn}() suspends. The rest of the function becomes a microtask; control returns to the caller.`, { kind: "suspend", text: `${o.fn} await` }, seg0.awaitLine ?? null);
        stack.pop();
        scheduleCont(o.fn, o.segs.slice(1));
      } else {
        stack.pop();
      }
    }
  }
  stack.pop();
  snap("sync", "Main script finished — the call stack is empty. Drain microtasks before any macrotask.", null, null);

  // -------------------------------------------------------------- run a task
  const runTask = (t: Task, zone: "micro" | "macro"): void => {
    stack.push(t.label);
    if (t.rest) {
      const seg = t.rest[0];
      for (const lg of seg.logs) {
        emit(lg);
        snap(zone, `${t.fn}() resumes after its await (it was a queued microtask): console.log('${lg}').`, { kind: "resume", text: lg }, seg.line ?? null);
      }
      if (t.rest.length > 1) {
        snap(zone, `await again — ${t.fn}() suspends; the next part is queued as another microtask.`, { kind: "suspend", text: `${t.fn} await` }, seg.awaitLine ?? null);
        stack.pop();
        scheduleCont(t.fn as string, t.rest.slice(1));
        return;
      }
      stack.pop();
      return;
    }
    if (t.text !== undefined) {
      emit(t.text);
      const lbl =
        t.kind === "nextTick"
          ? "process.nextTick callback (microtask)"
          : t.kind === "promise"
            ? "Promise / queueMicrotask callback (microtask)"
            : t.kind === "timeout"
              ? "setTimeout callback (timers phase)"
              : "setImmediate callback (check phase)";
      snap(zone, `${lbl}: console.log('${t.text}').`, { kind: t.kind, text: t.text }, t.line ?? null);
    }
    if (t.schedules) for (const sp of t.schedules) scheduleSpec(sp);
    stack.pop();
  };

  const drainMicro = (): void => {
    while (micro.nextTick.length || micro.promise.length) {
      const t = micro.nextTick.length ? (micro.nextTick.shift() as Task) : (micro.promise.shift() as Task);
      runTask(t, "micro");
    }
  };

  snap("micro", "Microtask checkpoint — drain process.nextTick first, then the Promise queue, completely.", null, null);
  drainMicro();

  // ---------------------------------------------------------- 3) macrotasks
  const hasMacro = (): boolean => macro.timeout.length > 0 || macro.immediate.length > 0;
  if (hasMacro()) {
    snap("macro", "Microtasks empty → the event loop runs the next macrotask (timers before check), then drains microtasks again.", null, null);
  }
  while (hasMacro()) {
    const t = macro.timeout.length ? (macro.timeout.shift() as Task) : (macro.immediate.shift() as Task);
    runTask(t, "macro");
    drainMicro();
  }

  snap("done", "Call stack and every queue are empty → the program ends. That is the exact, predictable output order.", null, null);
  return frames;
}

/* ----------------------------------------------------------------- scenarios
   Each `expected` array was captured from real Node 22 (CommonJS). See
   scripts/test-async.ts (asserts the engine reproduces it) and
   scripts/node-truth-async.mjs (runs the real programs).                      */
export const SCENARIOS: Scenario[] = [
  {
    id: "micro-macro",
    title: "Microtasks beat macrotasks",
    blurb: "sync · nextTick · Promise · queueMicrotask · setImmediate — the priority ladder, in one shot.",
    takeaway:
      "All synchronous code first. Then microtasks (nextTick before promises). Then a macrotask. Source order ≠ run order.",
    code: `console.log('1: sync start');
setImmediate(() => console.log('6: setImmediate (macro)'));
Promise.resolve().then(() => console.log('4: promise.then (micro)'));
queueMicrotask(() => console.log('5: queueMicrotask (micro)'));
process.nextTick(() => console.log('3: nextTick (micro)'));
console.log('2: sync end');`,
    main: [
      { op: "log", text: "1: sync start", line: 0 },
      { op: "schedule", spec: { kind: "immediate", label: "setImmediate cb", text: "6: setImmediate (macro)", line: 1 } },
      { op: "schedule", spec: { kind: "promise", label: "Promise.then cb", text: "4: promise.then (micro)", line: 2 } },
      { op: "schedule", spec: { kind: "promise", label: "queueMicrotask cb", text: "5: queueMicrotask (micro)", line: 3 } },
      { op: "schedule", spec: { kind: "nextTick", label: "nextTick cb", text: "3: nextTick (micro)", line: 4 } },
      { op: "log", text: "2: sync end", line: 5 },
    ],
    expected: [
      "1: sync start",
      "2: sync end",
      "3: nextTick (micro)",
      "4: promise.then (micro)",
      "5: queueMicrotask (micro)",
      "6: setImmediate (macro)",
    ],
  },
  {
    id: "await-suspends",
    title: "await suspends the function",
    blurb: "The sync part of an async function runs now; everything after await is a microtask — it beats a timer.",
    takeaway:
      "await pauses the function, not the thread. Code after await is a microtask, so it runs before setTimeout but after all sync code.",
    code: `console.log('1: sync start');
setTimeout(() => console.log('5: setTimeout (macro)'), 0);
async function run() {
  console.log('2: async — sync part');
  await null;                  // suspend → the rest is a microtask
  console.log('4: after await (micro)');
}
run();
console.log('3: sync end');`,
    main: [
      { op: "log", text: "1: sync start", line: 0 },
      { op: "schedule", spec: { kind: "timeout", label: "setTimeout cb", text: "5: setTimeout (macro)", line: 1 } },
      {
        op: "call",
        fn: "run",
        callLine: 7,
        segs: [
          { logs: ["2: async — sync part"], line: 3, awaitLine: 4 },
          { logs: ["4: after await (micro)"], line: 5 },
        ],
      },
      { op: "log", text: "3: sync end", line: 8 },
    ],
    expected: [
      "1: sync start",
      "2: async — sync part",
      "3: sync end",
      "4: after await (micro)",
      "5: setTimeout (macro)",
    ],
  },
  {
    id: "interleave",
    title: "Two async functions interleave",
    blurb: "Each await splits a function into microtasks; two running functions take turns through the queue.",
    takeaway:
      "Concurrency, not parallelism: a() and b() interleave one microtask at a time. Their sync parts run first, then each resumption takes a turn.",
    code: `async function a() {
  console.log('a1');
  await null;
  console.log('a2');
  await null;
  console.log('a3');
}
async function b() {
  console.log('b1');
  await null;
  console.log('b2');
}
console.log('start');
a();
b();
console.log('end');`,
    main: [
      { op: "log", text: "start", line: 12 },
      {
        op: "call",
        fn: "a",
        callLine: 13,
        segs: [
          { logs: ["a1"], line: 1, awaitLine: 2 },
          { logs: ["a2"], line: 3, awaitLine: 4 },
          { logs: ["a3"], line: 5 },
        ],
      },
      {
        op: "call",
        fn: "b",
        callLine: 14,
        segs: [
          { logs: ["b1"], line: 8, awaitLine: 9 },
          { logs: ["b2"], line: 10 },
        ],
      },
      { op: "log", text: "end", line: 15 },
    ],
    expected: ["start", "a1", "b1", "end", "a2", "b2", "a3"],
  },
];
