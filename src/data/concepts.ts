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
  stub({
    id: "async-model",
    group: "runtime",
    order: 7,
    title: "Async model",
    full: "Async model — callbacks → promises → async/await",
    tagline: "Callbacks, promises, async/await, and micro- vs macro-task ordering.",
    readMins: 9,
    mentalModel: "await pauses the function, not the thread — the loop keeps running other work.",
    keyPoints: [
      "Three styles: callbacks → promises → async/await (sugar over promises).",
      "Microtasks (promises, nextTick) run before macrotasks (timers, I/O, immediate).",
      "async/await does not create parallelism — it sequences awaited promises.",
      "Run independent work concurrently with Promise.all; always handle rejections.",
    ],
    seeAlso: ["event-loop", "errors", "streams"],
  }),
  stub({
    id: "v8-gc",
    group: "runtime",
    order: 8,
    title: "V8, JIT, memory & GC",
    tagline: "Hidden classes, JIT tiers, generational GC, and stop-the-world pauses.",
    readMins: 10,
    mentalModel:
      "Most objects die young. The scavenger sweeps the nursery (young space); survivors graduate to old space, collected by mark-sweep-compact.",
    keyPoints: [
      "V8 compiles JS through tiers (Ignition interpreter → Maglev/TurboFan JIT).",
      "Hidden classes + inline caches make property access fast — keep object shapes stable.",
      "Generational GC: young space (fast scavenge) → promote survivors → old space (mark-sweep-compact).",
      "Major GC is largely concurrent/incremental but still has stop-the-world pauses.",
    ],
    seeAlso: ["event-loop", "performance", "concurrency"],
  }),
  stub({
    id: "concurrency",
    group: "runtime",
    order: 9,
    title: "Concurrency",
    full: "Concurrency — worker_threads, cluster, child_process",
    tagline: "Real parallelism, the 4-thread pool, and when to reach for each.",
    readMins: 10,
    mentalModel:
      "Threads share memory (compute); processes don't (isolation). Network async needs neither — the kernel does the waiting.",
    keyPoints: [
      "worker_threads: real in-process JS parallelism; share memory via SharedArrayBuffer.",
      "cluster: fork N processes sharing a port — scale a server across cores.",
      "child_process: run separate programs/scripts; talk over IPC/streams.",
      "The libuv thread pool (default 4, UV_THREADPOOL_SIZE) backs fs, dns.lookup, crypto, zlib.",
    ],
    seeAlso: ["event-loop", "v8-gc", "production"],
  }),
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
