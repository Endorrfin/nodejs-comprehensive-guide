/* ===========================================================================
   SINGLE SOURCE OF TRUTH for guide content.
   Pages are rendered from this data; never hand-write page markup.
   Event Loop (ch.6) is the fully-built golden chapter; the rest are seeded
   stubs (tagline + mental model + key points) to be expanded in later sessions.
   =========================================================================== */

export type Tone = "tip" | "warn" | "senior";

export type Section =
  | { kind: "prose"; md: string }
  | { kind: "figure"; fig: string; caption?: string }
  | { kind: "sim"; sim: string }
  | { kind: "table"; head: string[]; rows: string[][]; caption?: string }
  | { kind: "code"; lang: string; code: string; note?: string }
  | { kind: "callout"; tone: Tone; title: string; md: string }
  | { kind: "compare"; a: string; b: string; rows: [string, string, string][] };

export interface InterviewQA {
  q: string;
  a: string;
  level?: "senior" | "staff";
}
export interface Pitfall {
  title: string;
  body: string;
}
export interface Source {
  title: string;
  url: string;
}

export interface Chapter {
  id: string;
  group: string;
  order: number;
  title: string;
  full?: string;
  tagline: string;
  readMins: number;
  mentalModel: string;
  sections: Section[];
  keyPoints: string[];
  pitfalls: Pitfall[];
  interview: InterviewQA[];
  seeAlso: string[];
  sources: Source[];
  stub?: boolean;
  /** For "chapters" that are really dedicated pages (interview bank, gallery). */
  link?: string;
  pdf?: string;
}

export interface Group {
  id: string;
  name: string;
  accent: string;
  blurb: string;
}

export const GROUPS: Group[] = [
  {
    id: "foundations",
    name: "Foundations & Mental Model",
    accent: "var(--grp-foundations)",
    blurb: "What Node is, why it exists, where it wins and loses, the big picture.",
  },
  {
    id: "runtime",
    name: "The Runtime Core",
    accent: "var(--grp-runtime)",
    blurb: "The heart: event loop, async, V8 & GC, concurrency, streams, modules.",
  },
  {
    id: "systems",
    name: "Building Real Systems",
    accent: "var(--grp-systems)",
    blurb: "Errors, HTTP internals, performance, security, production patterns.",
  },
  {
    id: "mastery",
    name: "Mastery",
    accent: "var(--grp-mastery)",
    blurb: "Modern Node, the interview bank, mental models, the whole picture.",
  },
];

const stub = (
  c: Omit<Chapter, "sections" | "pitfalls" | "interview" | "seeAlso" | "sources" | "stub"> &
    Partial<Pick<Chapter, "sections" | "seeAlso" | "interview" | "pitfalls" | "sources">>,
): Chapter => ({
  sections:
    c.sections ??
    [
      {
        kind: "prose",
        md: `This chapter is seeded with its mental model and key points; the full deep-dive (prose, diagrams, simulators, interview Q&A) lands in an upcoming session. The takeaways below are already accurate and exam-ready.`,
      },
    ],
  pitfalls: c.pitfalls ?? [],
  interview: c.interview ?? [],
  seeAlso: c.seeAlso ?? [],
  sources: c.sources ?? [],
  stub: true,
  ...c,
});

export const CHAPTERS: Chapter[] = [
  // ---------------------------------------------------------------- Foundations
  stub({
    id: "what-is-node",
    group: "foundations",
    order: 1,
    title: "What is Node.js",
    tagline: "A JavaScript runtime built on V8, with non-blocking I/O via libuv.",
    readMins: 6,
    mentalModel:
      "Node = V8 (runs JS) + libuv (event loop + async I/O + a 4-thread pool) + C++ bindings. Your JS is single-threaded; the waiting is offloaded.",
    keyPoints: [
      "Node runs JavaScript outside the browser, on Google's V8 engine.",
      "libuv provides the event loop, asynchronous I/O, and a small thread pool.",
      "Non-blocking by design: start I/O, register a callback, keep serving other work.",
      "One language across the whole stack, with the largest package ecosystem (npm).",
    ],
    seeAlso: ["architecture", "event-loop", "strengths"],
  }),
  stub({
    id: "strengths",
    group: "foundations",
    order: 2,
    title: "Strengths",
    tagline: "Where Node shines — I/O-bound, real-time, one language end-to-end.",
    readMins: 5,
    mentalModel: "Node shines when the bottleneck is waiting (network, disk, DB), not computing.",
    keyPoints: [
      "I/O concurrency: thousands of sockets on a single thread via the event loop.",
      "Real-time (WebSockets, streaming) and JSON/HTTP APIs are a natural fit.",
      "One language front-to-back; huge ecosystem; fast iteration.",
      "Low memory per connection vs thread-per-request models.",
    ],
    seeAlso: ["weaknesses", "event-loop", "what-is-node"],
  }),
  stub({
    id: "weaknesses",
    group: "foundations",
    order: 3,
    title: "Weaknesses",
    tagline: "Where Node is weak and why — CPU-bound work on one thread.",
    readMins: 5,
    mentalModel: "One thread for JS: a long computation freezes everything. Offload or chunk it.",
    keyPoints: [
      "CPU-bound work blocks the single thread — throughput collapses.",
      "A long synchronous task in one request adds latency to all in-flight requests.",
      "Async control flow and error handling are easy to get subtly wrong.",
      "Heavy numeric/compute needs worker_threads or native addons.",
    ],
    seeAlso: ["strengths", "concurrency", "performance"],
  }),
  stub({
    id: "competitors",
    group: "foundations",
    order: 4,
    title: "Competitors",
    tagline: "Deno, Bun, Go, Python, Java, .NET, Rust, Elixir — when each wins.",
    readMins: 7,
    mentalModel:
      "Pick by bottleneck: I/O & ecosystem → Node; CPU & concurrency → Go/Rust/JVM; soft-real-time at scale → Elixir.",
    keyPoints: [
      "Deno & Bun: JS/TS runtimes — Bun chases speed, Deno web-standards & security.",
      "Go: goroutines for easy concurrency, single static binary, strong for CPU+I/O.",
      "Python: ecosystem & ML, but the GIL limits CPU parallelism.",
      "Java/.NET: mature, truly multi-threaded, strong for CPU-heavy enterprise services.",
      "Rust/Elixir: Rust for max performance & safety; Elixir/BEAM for massive concurrency.",
    ],
    seeAlso: ["strengths", "weaknesses", "modern-node"],
  }),
  stub({
    id: "architecture",
    group: "foundations",
    order: 5,
    title: "Top-level architecture",
    full: "Top-level architecture — who does what",
    tagline: "V8 · libuv · C++ bindings · core JS libraries, and how they interact.",
    readMins: 7,
    mentalModel: "Layers: your JS → core JS API → C++ bindings → { V8, libuv } → OS.",
    keyPoints: [
      "V8 executes JS and manages the heap; it knows nothing about files or sockets.",
      "libuv owns the event loop (6 phases), the async I/O abstraction, and the thread pool.",
      "C++ bindings bridge JS ↔ libuv/OS; the core JS library wraps them (fs, http, streams).",
      "The one rule: JavaScript is single-threaded; I/O is not.",
    ],
    seeAlso: ["what-is-node", "event-loop", "concurrency"],
  }),

  // --------------------------------------------------------------- Runtime core
  {
    id: "event-loop",
    group: "runtime",
    order: 6,
    title: "Event Loop",
    full: "The Event Loop — the heart of Node",
    tagline: "Six libuv phases per tick, plus the microtask checkpoints between them.",
    readMins: 12,
    mentalModel:
      "One thread walks six phases in a circle (timers → pending → poll → check → close). After every callback it drains microtasks: nextTick first, then Promises. Don't memorize phases — know where your callback runs.",
    sections: [
      {
        kind: "prose",
        md: "Node.js runs your JavaScript on a **single thread**. That same thread executes your code *and* runs the **event loop** — the mechanism that lets a single-threaded runtime juggle thousands of concurrent connections without blocking. The loop itself lives in **libuv** (written in C), not in V8. V8 runs your JS and owns its heap; **libuv** owns the loop, the OS event notifications (epoll/kqueue/IOCP), and a small thread pool.",
      },
      {
        kind: "callout",
        tone: "senior",
        title: "The loop is not in V8",
        md: "A common misconception in interviews. V8 only knows how to execute JavaScript and manage its heap. The event loop, timers, sockets and the thread pool are all **libuv**. `node` is the glue between them.",
      },
      { kind: "figure", fig: "event-loop-ring", caption: "One tick of the event loop: six phases, with microtasks draining between every callback." },
      {
        kind: "prose",
        md: "Each turn of the loop is a **tick**, and every tick walks through six phases in a fixed order. Each phase owns a FIFO queue of callbacks; the loop runs callbacks in the current phase until that queue empties (or a system limit is hit), then moves to the next phase.",
      },
      {
        kind: "table",
        caption: "The six phases, in order.",
        head: ["#", "Phase", "What runs here", "Example"],
        rows: [
          ["1", "timers", "callbacks for expired setTimeout / setInterval", "setTimeout(fn, 100)"],
          ["2", "pending callbacks", "a few system callbacks deferred from the previous loop", "some TCP errors (ECONNREFUSED)"],
          ["3", "idle, prepare", "libuv internal only — never your code", "—"],
          ["4", "poll", "retrieve new I/O events; run almost all I/O callbacks; may block here", "fs.readFile, incoming sockets"],
          ["5", "check", "setImmediate callbacks", "setImmediate(fn)"],
          ["6", "close callbacks", "'close' events", "socket.on('close', …)"],
        ],
      },
      {
        kind: "callout",
        tone: "tip",
        title: "Most of your code runs in poll",
        md: "HTTP handlers, DB results, file reads — their callbacks fire in the **poll** phase, which is why the vast majority of loop time lives there.",
      },
      {
        kind: "prose",
        md: "Between phases — and after **every** callback — Node drains two **microtask** queues before continuing: first the **`process.nextTick`** queue, then the **Promise** queue (`.then` / `await` / `queueMicrotask`). Microtasks are **not** a loop phase; they run at every checkpoint. That is exactly why a flood of `nextTick` callbacks can *starve* the loop — the loop can't advance until the microtask queues are empty.",
      },
      { kind: "sim", sim: "event-loop" },
      {
        kind: "prose",
        md: "So the execution order of the classic puzzle is: **all synchronous code**, then **`nextTick`**, then **Promises**, then the loop's macrotasks (timers / poll / check). Step through it in the simulator above, then read the program below.",
      },
      {
        kind: "code",
        lang: "js",
        code: `console.log('start');                          // sync
setTimeout(() => console.log('timeout'), 0);   // timers phase
setImmediate(() => console.log('immediate'));  // check phase
Promise.resolve().then(() => console.log('promise'));
process.nextTick(() => console.log('nextTick'));
console.log('end');                            // sync`,
        note: "Output: start, end, nextTick, promise, then timeout / immediate. In the MAIN module the order of setTimeout(0) vs setImmediate is NOT guaranteed — it depends on loop timing.",
      },
      {
        kind: "compare",
        a: "setTimeout(fn, 0)",
        b: "setImmediate(fn)",
        rows: [
          ["Runs in phase", "timers (phase 1)", "check (phase 5)"],
          ["In the main module", "order vs setImmediate is non-deterministic", "order vs setTimeout is non-deterministic"],
          ["Inside an I/O callback", "runs on the NEXT tick", "runs first — same tick, right after poll"],
          ["Use it to", "defer by a real (minimum) delay", "run right after the current poll phase"],
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "Never block the loop",
        md: "A synchronous CPU task (a huge `JSON.parse`, sync crypto, a tight loop) freezes the **entire** process — no I/O, no timers, no new connections. Offload to a `worker_thread` or break the work into chunks. See **Concurrency**.",
      },
    ],
    keyPoints: [
      "The event loop is single-threaded and lives in libuv, not V8.",
      "Six phases per tick, fixed order: timers → pending → idle/prepare → poll → check → close.",
      "Microtasks (nextTick, then Promise) drain after every callback and between phases — they are not a phase.",
      "process.nextTick has higher priority than Promise microtasks.",
      "Most application callbacks run in the poll phase.",
      "setImmediate fires in check; inside an I/O callback it beats setTimeout(0).",
      "Blocking the thread blocks everything — keep callbacks short, offload CPU work.",
    ],
    pitfalls: [
      {
        title: "Treating microtasks as a phase",
        body: "They aren't. nextTick/Promise callbacks run at every checkpoint, so recursive nextTick can starve I/O entirely — the loop never advances to its next phase.",
      },
      {
        title: "Assuming setTimeout(0) runs before setImmediate",
        body: "In the main module the order is timing-dependent and not guaranteed. Determinism only holds inside an I/O callback, where setImmediate wins.",
      },
      {
        title: "Using process.nextTick to mean 'later'",
        body: "nextTick is sooner than a Promise and far sooner than a timer. To defer work, queueMicrotask or setImmediate is usually correct; misusing nextTick starves the loop.",
      },
      {
        title: "Confusing concurrency with parallelism",
        body: "The loop gives concurrency on one thread. CPU-bound work is still serial — it needs worker_threads for real parallelism.",
      },
    ],
    interview: [
      {
        q: "Walk me through the phases of the event loop.",
        a: "Six phases per tick in fixed order: timers (expired setTimeout/Interval), pending callbacks (a few deferred system callbacks), idle/prepare (internal), poll (retrieve & run I/O callbacks, may block), check (setImmediate), close callbacks. After every callback and between phases, microtasks drain: the nextTick queue first, then the Promise queue.",
        level: "senior",
      },
      {
        q: "nextTick vs Promise.then vs setImmediate vs setTimeout(0) — what order?",
        a: "Synchronous code first. Then microtasks: all nextTick, then all promises. Then macrotasks by phase: setTimeout(0) in timers, setImmediate in check. In the main module timeout-vs-immediate is non-deterministic; inside an I/O callback setImmediate runs first.",
        level: "senior",
      },
      {
        q: "How can you starve the event loop?",
        a: "Recursively scheduling process.nextTick (or, less aggressively, promises) keeps a microtask queue non-empty, so the loop never advances — timers and I/O never run. Any long synchronous CPU work also blocks the single thread.",
        level: "staff",
      },
      {
        q: "Why does setImmediate beat setTimeout(0) inside a file-read callback?",
        a: "The read callback runs in the poll phase. The next phase in the same tick is check (setImmediate), so the immediate fires first; the timer waits for the next tick's timers phase.",
        level: "staff",
      },
      {
        q: "Is the event loop part of V8?",
        a: "No. V8 executes JavaScript and manages its heap. The event loop, timers, the thread pool and OS I/O notifications are all libuv. Node wires them together.",
        level: "senior",
      },
    ],
    seeAlso: ["async-model", "concurrency", "v8-gc", "streams"],
    sources: [
      {
        title: "Node.js — The event loop, timers, and process.nextTick()",
        url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
      },
      { title: "libuv — Design overview", url: "https://docs.libuv.org/en/v1.x/design.html" },
      {
        title: "Node.js docs — process.nextTick()",
        url: "https://nodejs.org/api/process.html#processnexttickcallback-args",
      },
    ],
  },
  {
    id: "async-model",
    group: "runtime",
    order: 7,
    title: "Async model",
    full: "Async model — callbacks → promises → async/await",
    tagline: "Callbacks, promises, async/await, and micro- vs macro-task ordering.",
    readMins: 11,
    mentalModel:
      "await pauses the function, not the thread — its continuation becomes a microtask, so the loop keeps serving other work and resumes you at the next checkpoint.",
    sections: [
      {
        kind: "prose",
        md: "Node's whole value proposition is doing other work *while it waits*. The open question is how you **express** that waiting in code. Three styles evolved, each desugaring into the one before it: **callbacks** are the raw primitive libuv hands you; **promises** are objects representing a future value, turning nesting into a flat chain; **async/await** is syntax that makes promise-based code read like ordinary sequential code. They are not three engines — they are three *ergonomics* over the same event loop.",
      },
      {
        kind: "callout",
        tone: "senior",
        title: "It's sugar, not a second engine",
        md: "`async`/`await` compiles down to promises and the microtask queue. `await x` evaluates `x`, wraps it in a promise if it isn't one already, **suspends** the function, and schedules the remainder as a microtask. The thread is never blocked — which is exactly why one `await` in a request handler doesn't stop the server from handling other requests.",
      },
      {
        kind: "table",
        caption: "Same job, three ergonomics — all desugar to the layer above.",
        head: ["Aspect", "Callbacks", "Promises", "async/await"],
        rows: [
          ["Shape", "nested functions", "flat .then() chain", "linear, sync-looking"],
          ["Errors", "manual (err, …) per step", "one .catch()", "try / catch"],
          ["Compose", "awkward by hand", ".then / Promise.all", "await / Promise.all"],
          ["Returns", "nothing — it calls back", "a Promise", "a Promise"],
          ["Underneath", "the primitive", "wraps callbacks", "sugar over Promises"],
        ],
      },
      {
        kind: "code",
        lang: "js",
        code: `const fs = require('node:fs');
const fsp = require('node:fs/promises');

// 1) Callbacks — nesting grows with every step ('callback hell')
fs.readFile('config.json', 'utf8', (err, raw) => {
  if (err) return done(err);
  let cfg;
  try { cfg = JSON.parse(raw); } catch (e) { return done(e); }
  fetchUser(cfg.userId, (err, user) => {
    if (err) return done(err);          // error handling at every level
    done(null, user.name);
  });
});

// 2) Promises — a flat chain, one .catch for the whole pipeline
fsp.readFile('config.json', 'utf8')
  .then((raw) => JSON.parse(raw))
  .then((cfg) => fetchUser(cfg.userId))
  .then((user) => user.name)
  .catch((err) => { /* one place for every failure above */ });

// 3) async/await — reads top-to-bottom, errors via ordinary try/catch
async function getName() {
  try {
    const cfg  = JSON.parse(await fsp.readFile('config.json', 'utf8'));
    const user = await fetchUser(cfg.userId);
    return user.name;
  } catch (err) { /* the same failures, normal control flow */ }
}`,
        note: "All three register a continuation and return to the loop — identical at runtime. async/await only wins on readability and on putting every failure in one try/catch.",
      },
      {
        kind: "prose",
        md: "So where does the code *after* an `await` actually run? Not on a timer, not vaguely 'soon' — it runs at the very next **microtask checkpoint**. Recall from the [Event Loop](#/chapter/event-loop) that after the synchronous script, and after *every* callback, Node drains two microtask queues — **`process.nextTick` first, then promises** — completely, before it touches the next macrotask. `await` schedules its continuation onto that promise queue. Therefore an awaited continuation **always beats `setTimeout(0)`** and **always loses to synchronous code**.",
      },
      { kind: "figure", fig: "await-timeline", caption: "await suspends the function and queues its continuation as a single microtask — the one thread is freed, not blocked." },
      {
        kind: "table",
        caption: "The priority ladder. The whole microtask block (2–3) drains before any macrotask (4–5).",
        head: ["#", "Runs", "Queue / phase", "Scheduled by"],
        rows: [
          ["1", "All synchronous code", "the call stack", "plain statements; an async body up to its first await"],
          ["2", "process.nextTick callbacks", "nextTick queue (microtask)", "process.nextTick(fn)"],
          ["3", "Promise reactions", "microtask queue", "then / catch / finally · await · queueMicrotask(fn)"],
          ["4", "Timers", "timers phase (macrotask)", "setTimeout(fn, 0) · setInterval"],
          ["5", "setImmediate", "check phase (macrotask)", "setImmediate(fn)"],
        ],
      },
      {
        kind: "prose",
        md: "That gives a strict, predictable order. Step a real program through it below — **predict each line before you advance**. The three scenarios build up: micro-vs-macro, then `await`, then two async functions interleaving.",
      },
      { kind: "sim", sim: "async-order" },
      {
        kind: "callout",
        tone: "warn",
        title: "nextTick-vs-Promise order flips between CommonJS and ESM",
        md: "The simulator shows the canonical **CommonJS** 'main script' order, where `process.nextTick` drains before the Promise queue. In an **ES module**, the top-level body is *itself* evaluated during a microtask drain, so a top-level `Promise.then` can run **before** a top-level `process.nextTick`. Verified on Node 22. Lesson: never rely on nextTick-vs-promise ordering across module systems — and prefer `queueMicrotask` to `process.nextTick` for 'run right after this' work.",
      },
      {
        kind: "prose",
        md: "Now without the visual aid. Five snippets — read the queues and call the exact output. Each answer was captured from real Node, and each explanation tells you *why*.",
      },
      { kind: "sim", sim: "async-quiz" },
      {
        kind: "prose",
        md: "`await` is **sequential by default** — its great virtue and its classic trap. Awaiting inside a loop makes N independent calls run one after another, turning a 50 ms job into 50 × N ms. If the calls don't depend on each other, start them all and await together with `Promise.all`.",
      },
      {
        kind: "code",
        lang: "js",
        code: `// ❌ Serial: each await waits for the previous — total ≈ sum of latencies
async function serial(ids) {
  const users = [];
  for (const id of ids) {
    users.push(await fetchUser(id));     // N round-trips, strictly one at a time
  }
  return users;
}

// ✅ Concurrent: start them all, then await — total ≈ the slowest one
async function concurrent(ids) {
  return Promise.all(ids.map((id) => fetchUser(id)));
}`,
        note: "Reach for Promise.allSettled when one failure shouldn't cancel the rest; Promise.all rejects as soon as any single call rejects.",
      },
      {
        kind: "compare",
        a: "await in series",
        b: "Promise.all([...])",
        rows: [
          ["Execution", "one after another — each awaits the last", "all started up front, run concurrently"],
          ["Total latency", "≈ sum of every call", "≈ the slowest single call"],
          ["Use when", "each step needs the previous result", "the calls are independent"],
          ["On failure", "stops at the first throw", "rejects on the first rejection (allSettled keeps going)"],
        ],
      },
      {
        kind: "callout",
        tone: "tip",
        title: "Handle every rejection — including the ones you forgot to await",
        md: "`try/catch` around `await` catches throws *and* rejected awaits — but **not** a promise you never awaited (a 'floating' promise), whose rejection becomes an `unhandledRejection`. Await it, `.catch()` it, or hand it to `Promise.all`. Use `Promise.allSettled` when one failure shouldn't sink the batch, and treat `process.on('unhandledRejection')` as a crash-and-restart backstop, not a handling strategy. See [Error handling](#/chapter/errors).",
      },
    ],
    keyPoints: [
      "Three eras over one loop: callbacks → promises → async/await (sugar over promises).",
      "await pauses the function, not the thread; its continuation is a microtask scheduled at the next checkpoint.",
      "Microtasks drain fully before any macrotask: process.nextTick first, then promises, then timers/check.",
      "An awaited continuation beats setTimeout(0) but never beats synchronous code.",
      "async/await is sequential by default — use Promise.all for independent work (latency ≈ slowest, not sum).",
      "A promise you don't await or .catch() is a floating promise — its rejection is lost (unhandledRejection).",
      "CJS vs ESM: top-level nextTick-vs-promise ordering differs, because an ES module top level is already a microtask drain.",
    ],
    pitfalls: [
      {
        title: "await in a loop for independent work",
        body: "for (const x of xs) await f(x) runs strictly serially — N×latency. If the calls don't depend on each other, Promise.all(xs.map(f)) collapses it to ≈ one call's latency. Only keep the loop when each step truly needs the previous result.",
      },
      {
        title: "Floating promises",
        body: "Calling an async function without await/.catch() (or in a forEach, which ignores returned promises) detaches it: errors surface as unhandledRejection, and ordering becomes a race. Await it, catch it, or collect it into Promise.all.",
      },
      {
        title: "Thinking await yields fairly to I/O",
        body: "await only yields to the microtask queue, not to macrotasks. A tight loop of await null (or recursive promise chains) floods microtasks and starves timers and I/O — the same way recursive process.nextTick does.",
      },
      {
        title: "The explicit-Promise-construction antipattern",
        body: "Wrapping an already-promise-returning API in new Promise((res, rej) => …) invites double-resolve bugs and swallowed errors. Only construct a Promise to adapt a raw callback/event API; otherwise just return the existing promise.",
      },
      {
        title: "Assuming nextTick-before-promise everywhere",
        body: "True in CommonJS, but in an ES module the top level is already inside a microtask drain, so a top-level Promise.then can run before a top-level process.nextTick. Don't encode that ordering into logic.",
      },
    ],
    interview: [
      {
        q: "Is async/await just promises? What does await actually do?",
        a: "Yes — it's syntax over promises. await evaluates its operand, wraps a non-promise in a resolved promise, suspends the async function, and schedules the rest of the body as a microtask (one tick, since V8's await optimization). When the awaited promise settles, the continuation runs at the next microtask checkpoint. The thread is never blocked; the function is.",
        level: "senior",
      },
      {
        q: "process.nextTick vs Promise.then vs setTimeout(0) — what order, and why microtasks first?",
        a: "Synchronous code, then microtasks, then macrotasks. Within microtasks the nextTick queue drains before the promise queue (in CommonJS). setTimeout(0) is a timers-phase macrotask, so it runs after the entire microtask block. Microtasks run first because Node drains both microtask queues to empty after every callback and between phases — they are checkpoints, not a phase.",
        level: "senior",
      },
      {
        q: "You have 10 independent async calls. How do you run them, and what's the latency difference vs awaiting in a loop?",
        a: "Start them concurrently and join: await Promise.all(ids.map(fetch)). Awaiting in a loop is serial, so total ≈ sum of all 10 latencies; Promise.all overlaps them, so total ≈ the slowest one. If failures should not cancel the batch, use Promise.allSettled; for the first success, Promise.any; for the first to settle, Promise.race.",
        level: "senior",
      },
      {
        q: "Can promises or async/await starve the event loop?",
        a: "Yes. await only yields to the microtask queue. A recursive promise chain or a tight await-null loop keeps the microtask queue non-empty, so the loop never advances to timers or I/O — the same starvation pattern as recursive process.nextTick, just one priority tier lower. CPU-bound work between awaits still blocks the thread outright.",
        level: "staff",
      },
      {
        q: "Does try/catch catch all errors in an async function? What about Promise.all?",
        a: "try/catch catches synchronous throws and rejections of awaited promises. It does NOT catch a promise you didn't await (a floating promise) — that becomes an unhandledRejection. Promise.all rejects as soon as any input rejects, abandoning the others' results (they still run); use Promise.allSettled to get every outcome regardless of individual failures.",
        level: "staff",
      },
    ],
    seeAlso: ["event-loop", "errors", "concurrency", "streams"],
    sources: [
      {
        title: "V8 — Faster async functions and promises (the await microtask optimization)",
        url: "https://v8.dev/blog/fast-async",
      },
      {
        title: "MDN — Using microtasks in JavaScript with queueMicrotask()",
        url: "https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide",
      },
      {
        title: "Node.js — The event loop, timers, and process.nextTick()",
        url: "https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick",
      },
      {
        title: "MDN — async function",
        url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function",
      },
    ],
  },
  {
    id: "v8-gc",
    group: "runtime",
    order: 8,
    title: "V8, JIT, memory & GC",
    full: "V8 · JIT · memory & garbage collection",
    tagline: "Hidden classes, the four JIT tiers, generational GC, and where the pauses come from.",
    readMins: 12,
    mentalModel:
      "Most objects die young. A fast Scavenge copies the few survivors out of the nursery and flips; objects that live long enough are promoted to old space, collected by the slower Mark-Sweep-Compact. Meanwhile V8 tiers hot functions up — and deoptimizes them when your assumptions break.",
    sections: [
      {
        kind: "prose",
        md: "V8 does two invisible jobs for you: it **compiles and runs** your JavaScript, and it **manages memory** so you never call `free()`. Both are silent until they become your bottleneck — a function that won't optimize, or a garbage collector that stalls the event loop. This chapter is about making the invisible legible: the **compilation pipeline** (Ignition → Sparkplug → Maglev → TurboFan), the **object model** (hidden classes + inline caches) that decides whether your code is fast, and the **generational garbage collector** (Orinoco) that decides when it pauses.",
      },
      {
        kind: "prose",
        md: "V8 never waits to 'compile the whole program' — it starts fast and gets faster. Source is parsed to bytecode and run immediately by **Ignition**, the interpreter. As a function runs more, V8 *tiers it up* through progressively more optimizing compilers, trading compile time for faster machine code. Each tier is a bet that the function is worth optimizing and that its observed types will hold.",
      },
      {
        kind: "table",
        caption: "V8's compilation tiers (Node 22 ships V8 12.4 — Maglev is enabled by default on x64/arm64).",
        head: ["Tier", "Role", "Compiles", "Code quality"],
        rows: [
          ["Ignition", "bytecode interpreter — runs everything first", "—", "baseline"],
          ["Sparkplug", "baseline JIT, no optimization", "near-instant", "modest"],
          ["Maglev", "mid-tier optimizing JIT (default in Node 22)", "fast", "good"],
          ["TurboFan", "top-tier optimizing JIT for the hottest code", "slow", "peak"],
        ],
      },
      {
        kind: "callout",
        tone: "senior",
        title: "Optimization is speculative — and reversible",
        md: "Maglev and TurboFan optimize on **assumptions** gathered at lower tiers: 'this argument is always a small integer', 'this object always has this shape'. Violate an assumption at runtime — pass a string where a number always flowed, mutate an object's shape — and V8 **deoptimizes**: it throws away the optimized code and falls back to a lower tier. A hot path that keeps deopting is *slower* than one that never optimized. Keep the types and shapes at a call site **stable**.",
      },
      {
        kind: "prose",
        md: "Why do shapes matter so much? JavaScript objects look dynamic, but V8 backs them with **hidden classes** (a.k.a. *maps* or *shapes*): two objects created the same way share one hidden class, so V8 can compile a property access into a fixed memory offset. **Inline caches** then memoize each property-access site by the shapes it has seen. Same shape every time (**monomorphic**) → the IC hits and access is near-C-speed. A handful of shapes (**polymorphic**) is fine; many shapes (**megamorphic**) blows the cache back to a slow dictionary lookup.",
      },
      {
        kind: "code",
        lang: "js",
        code: `// ✅ One hidden class: same fields, same order, set up front
class Point { constructor(x, y) { this.x = x; this.y = y; } }
const a = new Point(1, 2);
const b = new Point(3, 4);   // a and b share a shape → inline caches hit

// ❌ Shape drift defeats the optimizer
const p = {}; p.x = 1; p.y = 2;
const q = {}; q.y = 2; q.x = 1;   // different insertion order → different shape
q.z = 3;                          // a late property mutates the shape again
delete p.x;                       // 'delete' drops the object to slow dictionary mode`,
        note: "Rule of thumb: initialize every field in the constructor, in the same order; don't add properties late or 'delete' them; don't mix types at a call site. Stable shapes are what let the JIT keep its optimized code.",
      },
      {
        kind: "prose",
        md: "The second invisible job is memory. V8's heap is **generational**, built on one empirical observation — the *generational hypothesis*: **most objects die young**. So the heap is split into a small **young generation** (the nursery), collected very often and cheaply, and a larger **old generation**, collected rarely. The whole collector — codenamed **Orinoco** — is engineered to keep the main thread running by being parallel, incremental and concurrent.",
      },
      { kind: "figure", fig: "gc-heap", caption: "The generational heap: objects are born in the young generation (two semi-spaces, collected by Scavenge) and promoted to the old generation (collected by Mark-Sweep-Compact)." },
      {
        kind: "prose",
        md: "The **minor GC** is the **Scavenger**. The young generation is two equal **semi-spaces**: allocation fills the active *From* space; when it's full, V8 copies the (few) live objects into the empty *To* space, abandons everything else in one stroke, and **flips** — *To* becomes the new active space. Its cost is proportional to **survivors, not garbage**, which is exactly why churning millions of short-lived objects stays cheap. An object that survives about **two** scavenges is **promoted** to old space. The Scavenge is parallel but **stop-the-world** — short enough to be negligible in most workloads.",
      },
      {
        kind: "prose",
        md: "The **major GC** collects old space with **Mark-Sweep-Compact**: *mark* every reachable object, *sweep* the dead, and *compact* survivors to one end so fragmentation doesn't waste space. This is the expensive one — its cost scales with the live old-space size. Orinoco hides most of it: marking runs **concurrently** on helper threads while your JS keeps executing (cutting main-thread marking time by ~60–70%), with **incremental** steps and concurrent sweeping. But it cannot be fully free — there are still brief **stop-the-world** pauses to finalize. Step through both collections below.",
      },
      { kind: "sim", sim: "gc" },
      {
        kind: "compare",
        a: "Minor GC — Scavenge",
        b: "Major GC — Mark-Sweep-Compact",
        rows: [
          ["Collects", "young generation (nursery)", "old generation"],
          ["Algorithm", "semi-space copy (From → To) + flip", "mark, sweep, then compact"],
          ["Cost scales with", "live survivors — cheap", "live old-space size — costly"],
          ["Frequency", "very frequent", "rare"],
          ["Pausing", "parallel, brief stop-the-world", "concurrent/incremental marking; short STW to finalize"],
          ["Triggered when", "the active semi-space fills", "old space crosses its limit"],
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "GC shares your thread — so a leak becomes a latency problem",
        md: "Marking is concurrent, but GC is *not* free and the finalizing pauses run on the **main thread** — the same thread as the event loop. A large, growing old space means longer, more frequent major GCs, which surface as **event-loop stalls** and p99 latency spikes. A memory **leak** in Node is almost always *'old space that never shrinks'*: module-level caches/`Map`s that only grow, `EventEmitter` listeners added per request and never removed, timers that keep closures alive. Diagnose with heap snapshots and **retained size**, not just heap-used graphs. See [Performance & profiling](#/chapter/performance).",
      },
      {
        kind: "table",
        caption: "The flags and APIs worth knowing (defaults now scale with available/container memory).",
        head: ["Flag / API", "What it does"],
        rows: [
          ["--max-old-space-size=N", "cap old space in MB; modern Node derives the default from available (and cgroup/container) memory"],
          ["--max-semi-space-size=N", "size one young semi-space in MB; a bigger nursery means fewer minor GCs at the cost of memory"],
          ["--trace-gc", "log every GC — kind, duration, before/after sizes — to stderr"],
          ["--expose-gc → global.gc()", "force a collection; for tests and diagnostics only, never production logic"],
          ["perf_hooks 'gc' · v8.getHeapStatistics()", "observe GC events and heap usage programmatically (used to verify this chapter's sim)"],
        ],
      },
      {
        kind: "callout",
        tone: "tip",
        title: "Measured, not guessed",
        md: "The minor-vs-major ratio in the simulator isn't invented: a short workload that churns garbage while retaining a growing array, observed with the `perf_hooks` GC observer on **Node 22**, produced **52 minor GCs to 1 major** — and **271 : 1** with `--max-semi-space-size=1`. Minor collections dominate; that is the generational hypothesis in numbers.",
      },
    ],
    keyPoints: [
      "V8 tiers hot code up: Ignition (interpreter) → Sparkplug → Maglev (default in Node 22) → TurboFan.",
      "Optimization is speculative; violating type/shape assumptions causes deoptimization back to a slower tier.",
      "Hidden classes + inline caches make property access fast — keep object shapes stable and monomorphic.",
      "The heap is generational because most objects die young: a small nursery + a large old space.",
      "Minor GC (Scavenge) copies survivors between two semi-spaces and flips; cost ∝ survivors, not garbage.",
      "Surviving ~2 scavenges promotes an object to old space, collected by Mark-Sweep-Compact.",
      "Major GC marks concurrently but still has short stop-the-world pauses on the main thread — a leak (old space that never shrinks) becomes a latency problem.",
    ],
    pitfalls: [
      {
        title: "Polymorphic / shape-drifting objects on a hot path",
        body: "Adding properties late, in varying order, deleting properties, or mixing value types at a call site creates new hidden classes and makes inline caches megamorphic — V8 deopts to slow dictionary lookups. Initialize all fields in the constructor, same order, same types.",
      },
      {
        title: "Reading micro-benchmarks as production truth",
        body: "A tiny loop will get fully optimized by TurboFan and may not represent real, polymorphic, GC-pressured code. Benchmark realistic shapes and data sizes, and watch for deopt/bailout traces (--trace-deopt).",
      },
      {
        title: "Treating 'heap used' as the leak signal",
        body: "Heap-used sawtooths up and down with GC — that's healthy. A leak shows as a rising floor and growing RETAINED size across snapshots. Compare snapshots and look at retainers, not a single gauge.",
      },
      {
        title: "Bumping --max-old-space-size to 'fix' a leak",
        body: "Raising the limit delays the crash and makes the eventual major GC longer (bigger old space = longer pauses). Find the retainer instead; the flag is for genuinely large working sets, not leaks.",
      },
      {
        title: "Calling global.gc() in production",
        body: "Forcing GC almost always hurts — you trigger stop-the-world pauses V8 would have scheduled more cheaply. It's a diagnostic tool (with --expose-gc), not a tuning knob.",
      },
    ],
    interview: [
      {
        q: "Explain V8's generational garbage collection.",
        a: "The heap is split by object age on the generational hypothesis that most objects die young. The young generation (two semi-spaces) is collected by a fast Scavenge: live objects are copied into the To-space and the rest abandoned, then the spaces flip; cost is proportional to survivors. Objects that survive ~2 scavenges are promoted to the old generation, collected by Mark-Sweep-Compact — mark live objects (concurrently, via Orinoco), sweep the dead, compact to avoid fragmentation. Minors are frequent and cheap; majors are rare and costly.",
        level: "senior",
      },
      {
        q: "Why keep object shapes stable, and what is a hidden class?",
        a: "V8 represents each object's structure as a hidden class (map/shape); objects built the same way share one, letting property access compile to a fixed offset cached by an inline cache. Stable, monomorphic shapes keep those caches hitting. Adding/removing/reordering properties or mixing types makes call sites polymorphic then megamorphic, blowing the cache to slow dictionary lookups and triggering deoptimization.",
        level: "staff",
      },
      {
        q: "What are V8's compilation tiers and what is deoptimization?",
        a: "Ignition interprets bytecode; Sparkplug is a near-instant baseline JIT; Maglev is a fast mid-tier optimizing JIT (default in Node 22 on x64/arm64); TurboFan is the peak optimizer for the hottest code. Optimizing tiers speculate on observed types/shapes. When a runtime value violates an assumption, V8 deoptimizes — discards the optimized code and falls back to a lower tier. Repeated deopt churn is slower than never optimizing.",
        level: "staff",
      },
      {
        q: "How does garbage collection interact with the event loop and tail latency?",
        a: "GC largely shares the main thread with your JS. Marking is concurrent, but finalizing pauses are stop-the-world on the main thread — so they show up as event-loop lag and p99 spikes. A large or leaking old space means longer, more frequent major GCs. Mitigate by reducing allocations/retention, not by forcing GC; watch event-loop lag and GC traces.",
        level: "staff",
      },
      {
        q: "A Node service's memory climbs until it OOMs. How do you find the leak?",
        a: "Confirm it's a leak (rising retained floor across heap snapshots, not just sawtoothing heap-used). Take snapshots over time and diff them; sort by retained size and inspect retainers — usually a module-level cache/Map that only grows, listeners added per request without removal, or closures held by timers. Fix the retainer; raising --max-old-space-size only delays the crash and lengthens pauses.",
        level: "senior",
      },
    ],
    seeAlso: ["event-loop", "performance", "concurrency", "async-model"],
    sources: [
      { title: "V8 — Maglev, V8's fastest optimizing JIT", url: "https://v8.dev/blog/maglev" },
      { title: "V8 — Trash talk: the Orinoco garbage collector", url: "https://v8.dev/blog/trash-talk" },
      { title: "V8 — Concurrent marking", url: "https://v8.dev/blog/concurrent-marking" },
      { title: "V8 — Orinoco: young generation garbage collection (parallel Scavenger)", url: "https://v8.dev/blog/orinoco-parallel-scavenger" },
      { title: "Node.js — Understanding and tuning memory", url: "https://nodejs.org/learn/diagnostics/memory/understanding-and-tuning-memory" },
    ],
  },
  {
    id: "concurrency",
    group: "runtime",
    order: 9,
    title: "Concurrency",
    full: "Concurrency — the thread pool, worker_threads, cluster, child_process",
    tagline: "The 4-thread pool, real parallelism, and which tool fits which bottleneck.",
    readMins: 12,
    mentalModel:
      "Two paths off the one JS thread: blocking work (fs/crypto/zlib/dns.lookup) goes to the libuv thread pool (default 4 slots); network sockets go to the kernel and hold no thread. For more CPU you add threads (worker_threads, shared memory) or processes (cluster/child_process, isolated) — but most 'I need concurrency' is really I/O the loop already handles.",
    sections: [
      {
        kind: "prose",
        md: "Your JavaScript runs on **one thread**. So how does Node do many things at once — and when do you need to reach for *real* parallelism? The honest first answer is: **usually you don't**. Most 'I need concurrency' is **I/O** — waiting on a socket, disk, or database — and the event loop plus the OS already overlap thousands of those on the single thread. You only need more execution units when you're **burning CPU in JavaScript**. This chapter covers the machinery: the **libuv thread pool** that hides blocking calls, and the three ways to get more — `worker_threads`, `cluster`, `child_process`.",
      },
      { kind: "figure", fig: "thread-pool-kernel", caption: "Two async paths off the one JS thread: blocking work goes to the 4-thread libuv pool; network sockets are watched by the OS kernel with no pool thread held." },
      {
        kind: "prose",
        md: "Some 'async' operations have **no non-blocking OS primitive** — reading a file, hashing a password, compressing a buffer, resolving a hostname with `getaddrinfo`. libuv runs those on a small **thread pool** so they don't block the loop. The pool defaults to **4 threads** (raise it with `UV_THREADPOOL_SIZE`, up to 1024). What uses it: most async **`fs`**, the async **`crypto`** functions (`pbkdf2`, `scrypt`, `randomBytes`, `randomFill`, `generateKeyPair`), all async **`zlib`**, and **`dns.lookup`**. Network I/O (TCP/HTTP sockets) does **not** — that's the kernel's job. The catch: the pool is **fixed and shared**, so one slow `pbkdf2` can delay every other file read in the whole process.",
      },
      {
        kind: "callout",
        tone: "senior",
        title: "dns.lookup uses the pool; dns.resolve() does not",
        md: "`dns.lookup()` (which `http`/`net` call by default for hostnames) wraps the OS's **blocking** `getaddrinfo`, so it runs on the **thread pool** — under a burst of connections to new hosts, slow DNS can quietly **exhaust all 4 threads** and stall unrelated `fs`/`crypto` work. The `dns.resolve*()` family instead uses **c-ares** over the network and holds **no** pool thread. For connection-heavy clients, prefer `dns.resolve` or a caching resolver, and consider raising `UV_THREADPOOL_SIZE`.",
      },
      {
        kind: "prose",
        md: "Step the pool against the kernel below. Watch a fixed pool finish CPU-bound tasks in **waves**, change `UV_THREADPOOL_SIZE` and see the waves change, then watch the kernel run every network op at once with **no** thread held.",
      },
      { kind: "sim", sim: "thread-pool" },
      {
        kind: "prose",
        md: "When the work really is **CPU-bound JavaScript** — parsing huge payloads, hashing, image or markdown processing, ML pre/post-processing — offload it to a **`worker_thread`**. Each worker is its **own V8 isolate with its own event loop**, so it runs truly in parallel on another core without blocking the main loop. Workers don't share variables; they communicate by **message passing** (`postMessage`, a structured-clone copy) or, for genuinely shared state, a **`SharedArrayBuffer`** coordinated with **`Atomics`**.",
      },
      {
        kind: "code",
        lang: "js",
        code: `// main.js — offload a CPU-bound hash without blocking the event loop
const { Worker } = require('node:worker_threads');

function hashInWorker(password) {
  return new Promise((resolve, reject) => {
    const w = new Worker('./hash-worker.js', { workerData: password });
    w.once('message', resolve);     // structured-clone copy back to main
    w.once('error', reject);
    w.once('exit', (code) => {
      if (code !== 0) reject(new Error('worker stopped, exit ' + code));
    });
  });
}

// hash-worker.js — runs on its own thread + isolate
const { workerData, parentPort } = require('node:worker_threads');
const crypto = require('node:crypto');
const hash = crypto.pbkdf2Sync(workerData, 'salt', 1e6, 64, 'sha512');
parentPort.postMessage(hash);       // send the result home`,
        note: "Note pbkdf2Sync here: inside a worker, blocking is fine — that's the point. A real service reuses a small POOL of workers (e.g. Piscina) rather than spawning one per task: a worker boots a fresh V8 isolate, which isn't free.",
      },
      {
        kind: "table",
        caption: "Three ways to get more execution — pick by what you actually need.",
        head: ["Tool", "Gives you", "Shares memory?", "Reach for it when"],
        rows: [
          ["worker_threads", "parallel JS threads, one isolate each", "yes — SharedArrayBuffer + Atomics", "CPU-bound JS: parsing, hashing, images, compression"],
          ["cluster", "N processes sharing one listening port", "no", "scale one HTTP server across all cores"],
          ["child_process", "spawn/exec separate programs", "no — IPC / streams", "run ffmpeg/git/python, or isolate risky work"],
        ],
      },
      {
        kind: "compare",
        a: "worker_threads",
        b: "child_process",
        rows: [
          ["Unit of execution", "a thread in the same process", "a separate OS process"],
          ["Memory", "own isolate; can SHARE via SharedArrayBuffer", "fully isolated; data copied over IPC"],
          ["Start-up cost", "lighter — a new V8 isolate", "heavier — a whole new process"],
          ["Best for", "CPU-bound JS/TS inside your app", "running other programs; strong isolation"],
          ["Crash blast radius", "can take down the whole process", "contained to the child"],
        ],
      },
      {
        kind: "prose",
        md: "To scale a **server** across cores, the classic tool is **`cluster`**: it forks N worker **processes** that all share one listening port, with the OS (or Node's round-robin) distributing incoming connections. Rule of thumb is **~one Node process per core**, with **stateless** handlers (shared state goes in Redis/DB, not process memory). In container-orchestrated setups, an external supervisor — **Kubernetes**, PM2 — often plays this role instead, running one process per container and scaling pods. Either way the model is *processes, not threads*: no shared memory, isolation by default.",
      },
      {
        kind: "callout",
        tone: "tip",
        title: "Decision guide: start from the bottleneck",
        md: "**Waiting** on network/disk/DB → it's **I/O**: keep it async, add nothing. **Burning CPU** in JS → **`worker_threads`** (a pool of them). **Saturating one core** serving traffic → **`cluster`** or an orchestrator (~one process per core). Need to run **another binary** → **`child_process`**. The classic mistake is spinning up workers to 'speed up' database or HTTP calls — that work was never on your thread to begin with; the kernel already runs it concurrently.",
      },
      {
        kind: "prose",
        md: "Finally, a few orderings the pool and the loop make **guaranteed** — and one they make a **race**. Call each before revealing it.",
      },
      { kind: "sim", sim: "concurrency-quiz" },
    ],
    keyPoints: [
      "JS is single-threaded; most concurrency you need is I/O the event loop already overlaps — reach for parallelism only for CPU-bound JS.",
      "The libuv thread pool (default 4, UV_THREADPOOL_SIZE up to 1024) backs async fs, crypto, zlib, and dns.lookup.",
      "Network sockets use the kernel (epoll/kqueue/IOCP), not the pool — one thread watches thousands of connections.",
      "dns.lookup() uses the pool (blocking getaddrinfo); dns.resolve*() uses the network (c-ares) and no pool thread.",
      "worker_threads give real parallel JS (own isolate); communicate by message-passing or share via SharedArrayBuffer + Atomics.",
      "cluster forks ~one process per core sharing a port; processes don't share memory — keep handlers stateless.",
      "child_process runs separate programs with isolation; heavier than a worker but contains crashes.",
    ],
    pitfalls: [
      {
        title: "Using worker_threads to 'speed up' I/O",
        body: "Network/DB/file calls are already concurrent via the loop and kernel (or pool). Wrapping them in workers adds isolate startup and structured-clone copying for zero throughput gain. Workers are for CPU-bound JS only.",
      },
      {
        title: "Blocking the thread pool with one slow task",
        body: "The pool is fixed and shared. A long pbkdf2/scrypt, a giant sync zlib, or DNS exhaustion ties up slots so unrelated fs/crypto calls stall. Size UV_THREADPOOL_SIZE for the workload, move heavy CPU to worker_threads, and prefer dns.resolve for connection-heavy clients.",
      },
      {
        title: "Spawning a worker (or child process) per task",
        body: "Each worker boots a fresh V8 isolate; each child boots a process. Under load that startup cost dominates. Reuse a bounded pool of long-lived workers (e.g. Piscina) and hand them tasks.",
      },
      {
        title: "Expecting workers or cluster to share variables",
        body: "Workers have separate isolates and cluster has separate processes — neither shares your JS heap. Data is copied (postMessage/IPC) unless you explicitly use SharedArrayBuffer (workers only). Shared application state belongs in Redis/DB.",
      },
      {
        title: "Assuming setTimeout(0) vs setImmediate is ordered, or pool order is FIFO at size > 1",
        body: "In the main module timeout-vs-immediate is a race (deterministic only inside an I/O callback). And pool tasks are FIFO-dispatched but run concurrently, so with the default 4 threads their completion order is not guaranteed — only a one-thread pool serializes them.",
      },
    ],
    interview: [
      {
        q: "worker_threads vs cluster vs child_process — when do you use each?",
        a: "worker_threads for CPU-bound JavaScript in-process: each worker is its own isolate running in parallel, sharing memory only via SharedArrayBuffer. cluster to scale a server across cores: it forks ~one process per core sharing a listening port, no shared memory. child_process to run a separate program (ffmpeg, git, python) or to isolate risky work in its own process. If the bottleneck is I/O, none of them — the event loop already handles it.",
        level: "senior",
      },
      {
        q: "What runs on the libuv thread pool, how big is it, and why does it matter?",
        a: "Most async fs, the async crypto functions (pbkdf2, scrypt, randomBytes, randomFill, generateKeyPair), all async zlib, and dns.lookup. It defaults to 4 threads (UV_THREADPOOL_SIZE, up to 1024). It matters because it's fixed and shared: one slow pool task delays every other pool task in the process, so a slow hash or DNS lookup can stall unrelated file reads.",
        level: "staff",
      },
      {
        q: "Why can DNS resolution stall a busy HTTP client, and how do you fix it?",
        a: "http/net resolve hostnames with dns.lookup, which wraps the blocking getaddrinfo and runs on the 4-thread pool. Under many connections to new hosts, slow lookups can exhaust the pool and block unrelated fs/crypto work. Fixes: use dns.resolve*() (c-ares, network-based, no pool thread) or a caching resolver, cache results, and raise UV_THREADPOOL_SIZE.",
        level: "staff",
      },
      {
        q: "How do worker_threads communicate, and what's the cost of message passing?",
        a: "By default via postMessage, which makes a structured-clone copy of the data — so large payloads cost serialization and memory. You can transfer an ArrayBuffer (zero-copy, ownership moves) or use a SharedArrayBuffer with Atomics for genuinely shared memory and lock-free coordination. Workers do not share ordinary variables; design around copies or shared buffers.",
        level: "staff",
      },
      {
        q: "If Node is single-threaded, how does it serve thousands of concurrent connections?",
        a: "Network I/O is non-blocking: libuv registers sockets with the OS event notifier (epoll/kqueue/IOCP) and the kernel signals readiness; one loop thread multiplexes them all, holding no thread per connection. Only blocking operations without an async OS primitive (files, crypto, compression, getaddrinfo) use the small thread pool. So concurrency for I/O is the kernel's job, not threads'.",
        level: "senior",
      },
    ],
    seeAlso: ["event-loop", "v8-gc", "production", "performance"],
    sources: [
      { title: "libuv — Thread pool work scheduling", url: "https://docs.libuv.org/en/v1.x/threadpool.html" },
      { title: "Node.js — Don't block the event loop (or the worker pool)", url: "https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop" },
      { title: "Node.js — Worker threads", url: "https://nodejs.org/api/worker_threads.html" },
      { title: "Node.js — Cluster", url: "https://nodejs.org/api/cluster.html" },
      { title: "Node.js — DNS implementation considerations (lookup vs resolve)", url: "https://nodejs.org/api/dns.html#implementation-considerations" },
    ],
  },
  stub({
    id: "streams",
    group: "runtime",
    order: 10,
    title: "Streams & Buffers",
    full: "Streams, Buffers & backpressure",
    tagline: "Process data in chunks; backpressure keeps memory bounded.",
    readMins: 10,
    mentalModel:
      "Producer faster than consumer → the buffer fills → write() returns false → pause until the 'drain' event.",
    keyPoints: [
      "Four stream types: Readable, Writable, Duplex, Transform.",
      "Backpressure: write() returns false past highWaterMark; wait for 'drain' before writing more.",
      "pipeline() propagates backpressure AND cleans up on error (prefer it over pipe()).",
      "Default highWaterMark is 64 KiB for byte streams in modern Node.",
    ],
    seeAlso: ["event-loop", "http", "performance"],
  }),
  stub({
    id: "modules",
    group: "runtime",
    order: 11,
    title: "Modules: CJS vs ESM",
    tagline: "require is sync, cached, value-copied; import is async with live bindings.",
    readMins: 8,
    mentalModel: "CJS = synchronous, cached, value copy. ESM = an async graph with live, read-only bindings.",
    keyPoints: [
      "CommonJS: require() is synchronous and cached; returns module.exports; __dirname exists.",
      "ESM: import is asynchronous & statically analyzable; live read-only bindings; uses import.meta.url.",
      "Modern Node allows require() of ESM; top-level await is ESM-only.",
      "Interop traps: named exports from CJS, __dirname in ESM, the dual-package hazard.",
    ],
    seeAlso: ["architecture", "modern-node", "async-model"],
  }),

  // ----------------------------------------------------------- Building systems
  stub({
    id: "errors",
    group: "systems",
    order: 12,
    title: "Error handling",
    tagline: "Operational vs programmer errors; fail fast; AsyncLocalStorage.",
    readMins: 9,
    mentalModel: "Recover from operational errors; crash on programmer bugs. Never silently swallow.",
    keyPoints: [
      "Separate operational errors (bad input, ECONNREFUSED) from programmer bugs.",
      "Fail fast on bugs; handle and operate through operational errors.",
      "Log + crash on unhandledRejection / uncaughtException; let a supervisor restart.",
      "AsyncLocalStorage carries request context across async boundaries (domains are dead).",
    ],
    seeAlso: ["async-model", "production", "http"],
  }),
  stub({
    id: "http",
    group: "systems",
    order: 13,
    title: "Networking & HTTP internals",
    tagline: "Sockets, the llhttp parser, keep-alive Agents, and the timeout triad.",
    readMins: 10,
    mentalModel: "A request is a stream of bytes parsed by llhttp; Agents pool and reuse the TCP sockets.",
    keyPoints: [
      "Sockets + the llhttp parser turn bytes into requests; responses stream back out.",
      "Keep-alive Agents reuse TCP connections; tune maxSockets and reuse.",
      "HTTP/1.1 head-of-line blocking vs HTTP/2 multiplexing over one connection.",
      "Mind the timeout triad: headersTimeout, requestTimeout, keepAliveTimeout (common 502 causes).",
    ],
    seeAlso: ["streams", "performance", "production"],
  }),
  stub({
    id: "performance",
    group: "systems",
    order: 14,
    title: "Performance & profiling",
    tagline: "Measure first: flamegraphs, --prof, clinic, and event-loop lag.",
    readMins: 9,
    mentalModel: "Find the bottleneck with a profiler; the event-loop-lag meter is your service's pulse.",
    keyPoints: [
      "Measure before optimizing: flamegraphs (--prof, clinic, 0x), not guesses.",
      "Watch event-loop lag — the key health signal for a Node service.",
      "Avoid sync APIs on the hot path; stream large payloads; cache hot work.",
      "Diagnose GC pressure & leaks with heap snapshots and retained-size analysis.",
    ],
    seeAlso: ["v8-gc", "event-loop", "concurrency"],
  }),
  stub({
    id: "security",
    group: "systems",
    order: 15,
    title: "Security & supply chain",
    tagline: "CVEs, the npm supply chain, the permission model, hardening.",
    readMins: 9,
    mentalModel: "Your dependencies are your attack surface. Least privilege + patch fast.",
    keyPoints: [
      "Supply chain is the top risk: lockfiles, npm audit, fewer deps, verify provenance.",
      "Validate all input; avoid eval / child_process with untrusted data; set security headers.",
      "The permission model (--permission) restricts fs/net/child_process access.",
      "Keep Node patched — security releases fix real, exploited CVEs.",
    ],
    seeAlso: ["production", "modern-node", "http"],
  }),
  stub({
    id: "production",
    group: "systems",
    order: 16,
    title: "Production patterns",
    tagline: "Graceful shutdown, scaling, serverless cold starts.",
    readMins: 9,
    mentalModel: "On SIGTERM: stop intake → finish in-flight → close resources → exit(0).",
    keyPoints: [
      "Graceful shutdown: stop accepting, drain in-flight, close DB/sockets, then exit (handle SIGTERM).",
      "Scale with cluster or an orchestrator (≈one Node per core); keep handlers stateless.",
      "Health checks, structured logs, metrics, and a supervisor (PM2/systemd/k8s).",
      "Serverless: cold starts, statelessness, reuse connections outside the handler.",
    ],
    seeAlso: ["concurrency", "errors", "security"],
  }),

  // -------------------------------------------------------------------- Mastery
  stub({
    id: "modern-node",
    group: "mastery",
    order: 17,
    title: "Modern Node (2026)",
    tagline: "Versions & capabilities — the batteries now included.",
    readMins: 7,
    mentalModel: "Modern Node = batteries included: test runner, fetch, watch mode, --env-file, permissions.",
    keyPoints: [
      "Built-in test runner (node:test) + watch mode reduce tooling dependencies.",
      "Global fetch, WebStreams, and --env-file are standard in recent lines.",
      "require(ESM), the permission model, and a built-in SQLite are part of the modern toolkit.",
      "LTS cadence: even-numbered majors go LTS — track the active LTS for production. (Verify exact versions in S8.)",
    ],
    seeAlso: ["modules", "security", "competitors"],
  }),
  stub({
    id: "interview",
    group: "mastery",
    order: 18,
    title: "40 Senior/Staff Questions",
    tagline: "A filterable interview bank, tagged by topic and level.",
    readMins: 4,
    mentalModel: "If you can answer these cold — with the diagram in your head — you're ready.",
    keyPoints: [
      "Curated senior/staff questions across every chapter.",
      "Filter by topic and difficulty; each links back to its chapter.",
    ],
    link: "/interview",
    seeAlso: ["event-loop", "v8-gc", "concurrency"],
  }),
  stub({
    id: "mental-models",
    group: "mastery",
    order: 19,
    title: "Mental Models",
    tagline: "The diagrams you must be able to draw from memory.",
    readMins: 4,
    mentalModel: "Hide the answer, draw it, then check. Repeat until the picture is automatic.",
    keyPoints: [
      "The six event-loop phases + microtask checkpoints.",
      "Thread pool vs kernel async; GC generations; backpressure.",
    ],
    link: "/mental-models",
    seeAlso: ["event-loop", "concurrency", "v8-gc"],
  }),
  stub({
    id: "summary",
    group: "mastery",
    order: 20,
    title: "Summary",
    tagline: "The whole picture on one page.",
    readMins: 4,
    mentalModel: "One thread runs JS; libuv + the OS do the waiting; never block the thread.",
    keyPoints: [
      "The single-threaded loop + offloaded I/O is the whole idea.",
      "Know the diagrams cold: 6 phases, thread-pool-vs-kernel, microtask priority, GC generations, backpressure.",
      "Strength = I/O concurrency; weakness = CPU on the main thread.",
    ],
    seeAlso: ["event-loop", "what-is-node", "mental-models"],
  }),
];

export const CHAPTER_BY_ID: Record<string, Chapter> = Object.fromEntries(
  CHAPTERS.map((c) => [c.id, c]),
);

export function chaptersInGroup(groupId: string): Chapter[] {
  return CHAPTERS.filter((c) => c.group === groupId).sort((a, b) => a.order - b.order);
}
