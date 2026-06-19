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
  {
    id: "what-is-node",
    group: "foundations",
    order: 1,
    title: "What is Node.js",
    full: "What is Node.js — a runtime, not a framework",
    tagline: "A JavaScript runtime built on V8, with non-blocking I/O via libuv.",
    readMins: 7,
    mentalModel:
      "Node = V8 (runs JS) + libuv (event loop + async I/O + a 4-thread pool) + C++ bindings. Your JS is single-threaded; the waiting is offloaded.",
    sections: [
      {
        kind: "prose",
        md: "**Node.js is a runtime that executes JavaScript outside the browser.** It is not a language, not a framework, and not a web server — it is the program that takes your JS and runs it on a server, a laptop, or a container, granting it the capabilities the browser deliberately withholds: reading files, opening network sockets, spawning child processes, talking to the OS. Created in **2009 by Ryan Dahl**, Node's defining idea was to pair Google's fast **V8** engine with an **event-driven, non-blocking I/O** model so a single process could handle huge numbers of concurrent connections. It's now stewarded by the **OpenJS Foundation** and runs much of the modern web's back end.",
      },
      { kind: "figure", fig: "node-pieces", caption: "Node in one line: V8 runs your JavaScript, libuv supplies the loop and async I/O, and the bindings + core JS API bridge them." },
      {
        kind: "prose",
        md: "Three pieces do the work. **V8** compiles and runs your JavaScript and manages its memory. **libuv** (C) supplies the **event loop**, an abstraction over the OS's async I/O (epoll / kqueue / IOCP), and a small **thread pool**. **C++ bindings** plus a **core JS library** (`fs`, `http`, `net`, `streams`) wire your code to those native parts. The defining design choice is **non-blocking I/O**: instead of dedicating a thread to each request that sits blocked while the disk or network responds, Node *starts* the operation, *registers a callback*, and immediately gets on with other work — picking your callback up when the result is ready.",
      },
      {
        kind: "callout",
        tone: "senior",
        title: "Runtime, not framework",
        md: "A frequent muddle. **Node is the platform**; **Express, NestJS, Fastify** are *libraries that run on top of it*. Node gives you `http`, `fs`, streams and the event loop; a framework gives you routing, DI and conventions. \"I use Node\" and \"I use Nest\" are statements about different layers — Nest runs *on* Node.",
      },
      {
        kind: "prose",
        md: "Why did it catch on? **One language end-to-end** — the same JavaScript (and types, and validation logic) on the browser and the server. **JSON and HTTP are native**, so building APIs is frictionless. And **npm** is the largest software registry in the world (millions of packages), which makes assembling a system fast. Companies adopted it precisely where its model fits — I/O-heavy, high-concurrency services and tooling — including Netflix, PayPal, LinkedIn and Uber as oft-cited case studies. Node is **actively developed** on a predictable LTS cadence; as of mid-2026 the Active LTS line is **Node 24** (Node 22 in maintenance, Node 26 the current line) — see [Modern Node](#/chapter/modern-node).",
      },
      {
        kind: "compare",
        a: "Node IS…",
        b: "Node is NOT…",
        rows: [
          ["Category", "a JavaScript runtime (V8 + libuv)", "a language or a framework"],
          ["Threading", "single-threaded JS, with I/O offloaded", "multi-threaded by default"],
          ["Sweet spot", "I/O-bound servers, real-time, tooling", "CPU-bound number crunching"],
          ["Frameworks", "the platform Express/Nest run on", "Express/Nest themselves"],
        ],
      },
      {
        kind: "code",
        lang: "js",
        code: `// A whole HTTP server — no framework, just the runtime.
const http = require('node:http');

http
  .createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ hello: 'world' }));
  })
  .listen(3000);

// Prove what Node is made of — the native pieces, by version:
//   $ node -p "process.versions"
//   { node, v8, uv, openssl, zlib, llhttp, ares, ... }`,
        note: "createServer returns a Writable-friendly server with a few lines; process.versions lists V8, libuv (uv) and the bundled C libraries Node ships — the exact components in the diagram above.",
      },
      {
        kind: "callout",
        tone: "tip",
        title: "The one mental model to carry",
        md: "Everything else in this guide hangs off a single sentence: **JavaScript runs on one thread; the waiting (I/O) is offloaded below it.** Next, see the pieces interact in [Top-level architecture](#/chapter/architecture), then how the one thread schedules work in [the Event Loop](#/chapter/event-loop).",
      },
    ],
    keyPoints: [
      "Node runs JavaScript outside the browser, on Google's V8 engine — it's a runtime, not a language or framework.",
      "libuv provides the event loop, asynchronous I/O, and a small (default 4) thread pool.",
      "Non-blocking by design: start I/O, register a callback, keep serving other work.",
      "JavaScript runs on a single thread; the waiting is offloaded — this one fact drives everything else.",
      "One language across the whole stack, with the largest package ecosystem (npm).",
      "Created 2009 by Ryan Dahl; governed by the OpenJS Foundation; even-numbered majors go LTS.",
    ],
    pitfalls: [
      {
        title: "Calling Node a language or a framework",
        body: "Node is a runtime: the program that executes JavaScript with server capabilities. The language is JavaScript (or TypeScript compiled to it); frameworks like Express/Nest are libraries that run on Node.",
      },
      {
        title: "Assuming Node is multi-threaded",
        body: "Your JavaScript runs on one thread. libuv uses a small thread pool for some blocking operations and the kernel for sockets, but application code is single-threaded unless you explicitly use worker_threads.",
      },
      {
        title: "Reaching for Node on CPU-bound work because it's 'fast'",
        body: "V8 is fast, but a long synchronous computation blocks the single thread and freezes the whole process. Node's speed is about I/O concurrency, not parallel compute — see Weaknesses.",
      },
    ],
    interview: [
      {
        q: "What is Node.js, in one paragraph?",
        a: "A JavaScript runtime built on V8 that executes JS outside the browser with non-blocking I/O. It pairs V8 (runs JS, manages memory) with libuv (event loop, async I/O over epoll/kqueue/IOCP, a small thread pool) and C++ bindings plus a JS core API (fs, http, streams). Application JS runs on a single thread; I/O is offloaded, so one process can handle thousands of concurrent connections.",
        level: "senior",
      },
      {
        q: "Is Node single-threaded or multi-threaded?",
        a: "Your JavaScript runs on a single thread (one event loop). Under it, libuv keeps a thread pool (default 4) for operations with no async OS primitive — file I/O, crypto, zlib, dns.lookup — and uses the kernel for network sockets. For parallel JS you opt into worker_threads. So: single-threaded JS, with offloaded and optional parallelism beneath.",
        level: "senior",
      },
      {
        q: "What problem was Node designed to solve?",
        a: "The C10k problem: serving many simultaneous connections without a thread per connection. By making I/O non-blocking and multiplexing it on one event-loop thread, Node holds each connection as a cheap socket rather than an expensive thread, so a single process scales to tens of thousands of concurrent, mostly-idle connections.",
        level: "senior",
      },
      {
        q: "What's the difference between Node and Express?",
        a: "Node is the runtime — it provides the engine, the event loop, and core modules like http and fs. Express (or Nest, Fastify) is a framework: a library running on Node that adds routing, middleware and structure. You can write a full server with Node's http module alone; frameworks just make it ergonomic.",
        level: "senior",
      },
    ],
    seeAlso: ["architecture", "event-loop", "strengths", "modern-node"],
    sources: [
      { title: "Node.js — About", url: "https://nodejs.org/en/about" },
      { title: "Node.js — Introduction to Node.js", url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs" },
      { title: "OpenJS Foundation — Node.js", url: "https://openjsf.org/projects" },
      { title: "Node.js — Release schedule (LTS)", url: "https://github.com/nodejs/release#release-schedule" },
    ],
  },
  {
    id: "strengths",
    group: "foundations",
    order: 2,
    title: "Strengths",
    full: "Strengths — where Node shines",
    tagline: "Where Node shines — I/O-bound, real-time, one language end-to-end.",
    readMins: 7,
    mentalModel: "Node shines when the bottleneck is waiting (network, disk, DB), not computing — one thread overlaps thousands of waits.",
    sections: [
      {
        kind: "prose",
        md: "Node's strengths all follow from one property: it's brilliant when the bottleneck is **waiting**, not **computing**. A web service spends most of its life idle — waiting on a database, an upstream API, a disk. The event loop plus the OS let a **single thread** overlap thousands of those waits, holding each connection as a cheap socket instead of an expensive thread. So Node's home turf is **I/O-bound, high-concurrency, network-facing** work: APIs, gateways, real-time systems, and tooling.",
      },
      { kind: "figure", fig: "connection-scaling", caption: "The C10k contrast: thread-per-request needs one ~1 MiB thread per connection; the event loop watches every socket on one thread via the kernel, at a fraction of the memory." },
      {
        kind: "prose",
        md: "This is the famous **C10k** insight. The old model gave every connection its **own thread or process** — but a thread costs roughly a megabyte of stack plus scheduler overhead, so you hit a wall in the low thousands. Node holds a connection as a **socket the kernel watches** plus a little JS state — a few kilobytes — so one box serves **tens of thousands** of concurrent, mostly-idle connections. A thread costs about **16×** a socket; drag the slider and watch the memory gap widen.",
      },
      { kind: "sim", sim: "throughput" },
      {
        kind: "prose",
        md: "Concurrency is the headline, but the rest of the list matters in practice: **one language end-to-end** — the same JavaScript, types and validation on client and server, which removes a whole translation layer and lets teams move fast; **JSON and HTTP are native**, so APIs and BFFs are frictionless; **real-time** (WebSockets, Server-Sent Events, streaming) is a natural fit for an event-driven runtime; **streaming with backpressure** processes data in bounded memory regardless of size (see [Streams](#/chapter/streams)); and the **npm ecosystem** plus fast iteration shorten the path from idea to running service.",
      },
      {
        kind: "table",
        caption: "Where Node fits well — and why.",
        head: ["Workload", "Why Node is a strong fit"],
        rows: [
          ["HTTP / JSON APIs & BFFs", "I/O-bound, JSON-native, one language with the front end"],
          ["Real-time (chat, presence, live dashboards)", "event-driven; WebSockets/SSE map cleanly onto the loop"],
          ["Streaming proxies / API gateways", "backpressure keeps memory bounded while relaying data"],
          ["CLI & build tooling", "fast startup, huge ecosystem, cross-platform"],
          ["Serverless / edge functions", "small, I/O-glue handlers that scale horizontally"],
          ["SSR / fullstack frameworks", "share rendering and types across client and server"],
        ],
      },
      {
        kind: "callout",
        tone: "senior",
        title: "Concurrency is not parallelism",
        md: "Node gives you massive **I/O concurrency** on **one** thread — many operations *in flight* at once. It does **not** give you CPU **parallelism** — many computations *executing* at once. The strength and the weakness are the same coin: the design that makes ten thousand idle sockets cheap is the design that makes one heavy `for`-loop catastrophic. Keep handlers I/O-bound and short; push CPU work to [worker_threads](#/chapter/concurrency).",
      },
      {
        kind: "compare",
        a: "Node's sweet spot",
        b: "Not Node's job",
        rows: [
          ["Bottleneck", "waiting on I/O (net, disk, DB)", "burning CPU in JS"],
          ["Shape", "many concurrent, short, async handlers", "long synchronous computation"],
          ["Examples", "APIs, gateways, real-time, tooling", "video transcode, ML training, crypto mining"],
          ["If you must", "—", "offload to worker_threads / native / another service"],
        ],
      },
    ],
    keyPoints: [
      "Node shines when the bottleneck is waiting (I/O), not computing.",
      "I/O concurrency: thousands of sockets on a single thread via the event loop and the kernel.",
      "Low memory per connection (~KB) vs thread-per-request (~MB) — the C10k win.",
      "Real-time (WebSockets, SSE, streaming) and JSON/HTTP APIs are a natural fit.",
      "One language front-to-back; huge npm ecosystem; fast iteration.",
      "Concurrency ≠ parallelism: the loop overlaps waits, it does not parallelize CPU work.",
    ],
    pitfalls: [
      {
        title: "Choosing Node for CPU-heavy work because it benchmarks 'fast'",
        body: "V8 is fast per-operation, but CPU-bound JS runs on the one thread and blocks everything. High single-op speed doesn't help when one request's computation stalls all the others — that's a job for Go/Rust/JVM or worker_threads.",
      },
      {
        title: "Assuming more cores speed up one Node process",
        body: "A single Node process uses one core for JS. To use all cores you run cluster or an orchestrator (≈one process per core), or offload CPU to worker_threads. Adding cores without that changes nothing for a single process.",
      },
      {
        title: "Treating high throughput as automatic",
        body: "Throughput holds only while handlers stay async and short. One synchronous call on the hot path (sync fs, big JSON.parse, a tight loop) collapses the whole event loop's concurrency — see Weaknesses.",
      },
    ],
    interview: [
      {
        q: "Why is Node good at I/O-bound workloads?",
        a: "Because I/O is mostly waiting, and Node overlaps waits instead of parking threads on them. The event loop registers a callback and moves on; libuv uses the kernel's async notifier (epoll/kqueue/IOCP) for sockets and a thread pool for blocking calls. One thread can therefore have thousands of operations in flight, holding each connection as a cheap socket rather than an expensive thread.",
        level: "senior",
      },
      {
        q: "How does a single thread serve thousands of connections?",
        a: "Network sockets are non-blocking: libuv arms them with the OS event notifier and the kernel signals readiness; the one loop thread multiplexes them all, holding no thread per connection. Memory per connection is a few KB of socket + JS state, versus ~1 MB per thread in a thread-per-request model — so the same box scales from thousands to tens of thousands.",
        level: "staff",
      },
      {
        q: "When would you pick Node over Go or Java for a service?",
        a: "When the work is I/O-bound and the team benefits from one language end-to-end: JSON/HTTP APIs, BFFs, real-time systems, streaming gateways, tooling. Node wins on developer velocity, ecosystem, and shared client/server code. I'd pick Go/Java/Rust instead when the service is CPU-bound or needs heavy parallel compute.",
        level: "senior",
      },
      {
        q: "What does 'one language end-to-end' actually buy you?",
        a: "Shared code and types across client and server — validation schemas, models, utilities, even rendering (SSR) — which removes a translation layer and a class of drift bugs. It also means one hiring pool, one toolchain, and one mental model, which is a real velocity multiplier on product teams.",
        level: "senior",
      },
    ],
    seeAlso: ["weaknesses", "event-loop", "concurrency", "what-is-node"],
    sources: [
      { title: "Dan Kegel — The C10K problem", url: "http://www.kegel.com/c10k.html" },
      { title: "Node.js — About (non-blocking I/O design)", url: "https://nodejs.org/en/about" },
      { title: "Node.js — Don't block the event loop", url: "https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop" },
      { title: "Node.js — Introduction to Node.js", url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs" },
    ],
  },
  {
    id: "weaknesses",
    group: "foundations",
    order: 3,
    title: "Weaknesses",
    full: "Weaknesses — where Node is weak, and why",
    tagline: "Where Node is weak and why — CPU-bound work on one thread.",
    readMins: 7,
    mentalModel: "One thread for JS: a long synchronous computation freezes everything — no I/O, no timers, no new connections. Offload or chunk it.",
    sections: [
      {
        kind: "prose",
        md: "Node's weaknesses are the **same design seen from the other side**. The single thread that makes I/O cheap makes **CPU expensive**: one long synchronous computation has nowhere else to run, so it **freezes the entire process**. This isn't a bug to patch — it's structural, and understanding exactly *why* is what separates a senior answer from \"Node is slow at math.\"",
      },
      { kind: "figure", fig: "blocking-loop", caption: "One synchronous CPU task owns the only thread for its whole duration. Every other in-flight request waits, each inheriting the full stall as added latency." },
      {
        kind: "prose",
        md: "The damage isn't that the CPU task itself is slow — it's that it adds its **entire duration to every other request**. While the thread is busy in a 250 ms `JSON.parse` or a synchronous hash, the loop runs **no** I/O callbacks, fires **no** timers, and accepts **no** new connections. On a busy server that one call spikes **p99 latency across the board** — a handful of heavy requests degrade everyone. The metric that catches it is **event-loop lag** (see [Performance](#/chapter/performance)).",
      },
      {
        kind: "callout",
        tone: "warn",
        title: "The cardinal sin: blocking the loop",
        md: "The usual culprits are **synchronous APIs on the hot path**: `fs.readFileSync`, the `*Sync` crypto/zlib calls, a huge `JSON.parse`/`JSON.stringify`, a tight `for` loop over a big array, or **catastrophic regex backtracking (ReDoS)** on attacker-controlled input. Each holds the one thread. Fixes: move heavy CPU to a [worker_thread](#/chapter/concurrency), **chunk** the work across ticks, stream instead of buffering, or precompute/cache. The async variants exist for exactly this reason — prefer them.",
      },
      {
        kind: "prose",
        md: "CPU is the headline weakness, but an honest list has more. **Parallel compute is awkward**: you reach for `worker_threads` or native addons, which is heavier and clumsier than Go's goroutines or the JVM's threads. **Async control flow is easy to get subtly wrong** — a [floating promise](#/chapter/async-model) or an unhandled rejection can crash the process or silently swallow an error. The **dynamic-typing** baggage of JavaScript (the `this` keyword, `==`, IEEE-754 number precision) bites without TypeScript. The **npm supply chain** is a large attack surface — your dependencies are your risk (see [Security](#/chapter/security)). And **CJS/ESM interop** plus fast ecosystem churn add friction (see [Modules](#/chapter/modules)).",
      },
      {
        kind: "table",
        caption: "The real weaknesses — and how seniors mitigate each.",
        head: ["Weakness", "Why it happens", "Mitigation"],
        rows: [
          ["CPU-bound work freezes the loop", "all JS shares one thread", "worker_threads, chunking, native, or a different tool"],
          ["No easy parallelism", "single-threaded by design", "worker pool (Piscina), cluster, offload service"],
          ["Subtle async bugs", "callbacks/promises are easy to misuse", "await everything, lint floating promises, AsyncLocalStorage"],
          ["Dynamic-typing footguns", "JS semantics (this, ==, number precision)", "TypeScript (strict), linting, BigInt/decimal libs"],
          ["Supply-chain risk", "huge transitive dependency trees", "lockfiles, npm audit, fewer deps, provenance"],
          ["GC pauses under load", "GC shares the main thread", "reduce retention/allocations; watch event-loop lag"],
        ],
      },
      {
        kind: "callout",
        tone: "senior",
        title: "A leak becomes a latency problem",
        md: "Because **garbage collection shares the event-loop thread**, a growing or leaking old space means longer, more frequent major GCs — which surface as **event-loop stalls and p99 spikes**, not just rising memory. It's the same lesson as blocking: anything that monopolizes the one thread — your CPU code *or* the GC cleaning up after it — hurts every request. Details in [V8 · GC](#/chapter/v8-gc).",
      },
      {
        kind: "table",
        caption: "Symptoms, and the cause they usually point to.",
        head: ["Symptom you'll see", "Usually the real cause"],
        rows: [
          ["p99 latency spikes under load", "a synchronous/CPU call blocking the loop"],
          ["'Node is slow at this'", "wrong tool for CPU-bound work — not a tuning issue"],
          ["Process crashes intermittently", "an unhandled promise rejection / uncaught exception"],
          ["Memory climbs until OOM", "a retained cache/listener — a leak, not load"],
        ],
      },
    ],
    keyPoints: [
      "CPU-bound work blocks the single thread — throughput collapses.",
      "A long synchronous task adds its full duration to every in-flight and incoming request (p99 spikes).",
      "Avoid sync APIs and unbounded loops/regex on the hot path; offload to worker_threads or chunk the work.",
      "Real parallelism is awkward (worker_threads / native) vs goroutines or JVM threads.",
      "Async control flow and error handling are easy to get subtly wrong (floating promises, unhandled rejections).",
      "GC shares the thread, so a leak or large heap becomes an event-loop-latency problem.",
      "The npm supply chain is a large attack surface; dynamic typing needs TypeScript discipline.",
    ],
    pitfalls: [
      {
        title: "Synchronous APIs on the hot path",
        body: "fs.readFileSync, *Sync crypto/zlib, and big JSON.parse/stringify each hold the one thread for their whole duration, stalling every other request. Use the async variants, stream, or offload — reserve *Sync calls for startup/CLI scripts.",
      },
      {
        title: "Unbounded loops and catastrophic regex (ReDoS)",
        body: "A tight loop over a large array, or a regex that backtracks exponentially on hostile input, blocks the loop just like sync I/O. Chunk long work across ticks, bound input sizes, and avoid vulnerable regex patterns on untrusted data.",
      },
      {
        title: "Floating promises and swallowed async errors",
        body: "Calling an async function without await/.catch() (or inside forEach) detaches it: rejections become unhandledRejection and ordering becomes a race. Await it, catch it, or collect into Promise.all; lint for no-floating-promises.",
      },
      {
        title: "Throwing more cores at one process",
        body: "A single Node process is one core for JS. Without cluster/an orchestrator (≈one process per core) or worker_threads, extra cores sit idle while the one event-loop thread saturates.",
      },
      {
        title: "Using worker_threads to 'speed up' I/O",
        body: "Network/DB/file I/O is already concurrent via the loop and kernel. Wrapping it in workers adds isolate startup and copying for zero gain — workers are for CPU-bound JS only.",
      },
    ],
    interview: [
      {
        q: "What is Node's biggest weakness, and why?",
        a: "CPU-bound work. All application JavaScript runs on one event-loop thread, so a long synchronous computation has nowhere else to go and blocks the entire process — no I/O, no timers, no new connections — until it finishes. It's structural: the same single-threaded model that makes I/O concurrency cheap makes parallel CPU work impossible without worker_threads.",
        level: "senior",
      },
      {
        q: "What happens to other requests during a 200 ms synchronous task?",
        a: "They all wait. The event loop can't advance while the thread is busy, so every in-flight request's callback and every queued timer is delayed by up to the full 200 ms, and new connections aren't accepted. One heavy synchronous call therefore adds latency across the board — visible as p99 spikes and event-loop lag.",
        level: "staff",
      },
      {
        q: "How do you handle CPU-bound work in Node?",
        a: "Get it off the event-loop thread: move it to a pool of worker_threads (e.g. Piscina), break it into chunks that yield between ticks (setImmediate), use a native addon, or hand it to a separate service/queue. Streaming and caching reduce the work in the first place. The goal is to keep the main thread doing only short, async, I/O-bound work.",
        level: "senior",
      },
      {
        q: "Why are unhandled promise rejections dangerous in Node?",
        a: "A promise you never await or .catch() (a floating promise) has nowhere to report failure, so its rejection becomes an unhandledRejection — which in modern Node terminates the process by default. Beyond crashes, floating promises make ordering a race and can swallow errors. Treat process.on('unhandledRejection') as a crash-and-restart backstop, not a handling strategy.",
        level: "staff",
      },
    ],
    seeAlso: ["strengths", "concurrency", "performance", "v8-gc"],
    sources: [
      { title: "Node.js — Don't block the event loop (or the worker pool)", url: "https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop" },
      { title: "Node.js — Worker threads", url: "https://nodejs.org/api/worker_threads.html" },
      { title: "OWASP — Regular expression Denial of Service (ReDoS)", url: "https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS" },
      { title: "Node.js — process 'unhandledRejection'", url: "https://nodejs.org/api/process.html#event-unhandledrejection" },
    ],
  },
  {
    id: "competitors",
    group: "foundations",
    order: 4,
    title: "Competitors",
    full: "Competitors — Deno, Bun, Go, Python, Java/.NET, Rust, Elixir",
    tagline: "Deno, Bun, Go, Python, Java, .NET, Rust, Elixir — when each wins.",
    readMins: 9,
    mentalModel:
      "Pick by bottleneck, not benchmark: I/O & ecosystem → Node; CPU & concurrency → Go/Rust/JVM; soft-real-time at scale → Elixir; ML → Python.",
    sections: [
      {
        kind: "prose",
        md: "The useful question is never *\"what's fastest?\"* but *\"what's my bottleneck?\"* Sort the field that way and it falls into tiers: the **JS-runtime cousins** (Deno, Bun) that share Node's event-loop model; the **CPU/concurrency tier** (Go, Rust, the JVM/.NET) with real threads; the **ecosystem play** (Python, for data/ML); and the **concurrency specialist** (Elixir on the BEAM). Node's enduring edge is the combination of a solid I/O model with the largest ecosystem and the deepest production track record — not raw numbers.",
      },
      { kind: "figure", fig: "competitor-map", caption: "A qualitative map: I/O concurrency + ecosystem velocity (→) vs CPU parallelism + raw performance (↑). The JS runtimes own the I/O sweet spot; the systems/JVM languages own raw compute." },
      {
        kind: "prose",
        md: "Pick the constraint that dominates *your* system and see what fits — then read the trade-off, because there's rarely a single right answer.",
      },
      { kind: "sim", sim: "runtime-picker" },
      {
        kind: "prose",
        md: "**The JS cousins.** **Deno** is Ryan Dahl's redo of Node: **TypeScript runs directly**, security is **opt-in by permission** (`--allow-net`, `--allow-read`), and it favors **web-standard APIs**; Deno 2.x added strong Node/npm compatibility. **Bun** bets on **speed and all-in-one tooling** — it's a runtime *and* bundler *and* test runner *and* package manager — built on Apple's **JavaScriptCore** (not V8) and written in Zig. Both run much existing Node code, but **Node still has the deepest ecosystem and the longest production track record**. (Web-verified, mid-2026: **Node 24** Active LTS, **Deno 2.8**, **Bun 1.3**.)",
      },
      {
        kind: "table",
        caption: "The JavaScript/TypeScript runtimes, side by side (current stable lines).",
        head: ["", "Node.js", "Deno", "Bun"],
        rows: [
          ["Engine", "V8", "V8", "JavaScriptCore"],
          ["TypeScript", "via tooling / type-stripping", "first-class, runs directly", "first-class, runs directly"],
          ["Module default", "CJS + ESM", "ESM (web-style URLs)", "ESM + CJS"],
          ["Security", "full access by default", "permissions opt-in", "full access by default"],
          ["Tooling", "npm + external tools", "built-in fmt/lint/test", "all-in-one: bundler/test/install"],
          ["Maturity / ecosystem", "deepest, largest (npm)", "growing; Node-compat", "growing; Node-compat"],
        ],
      },
      {
        kind: "prose",
        md: "**The other-language tier.** **Go** pairs **goroutines** (cheap, M:N-scheduled) with a **single static binary** and a GC — an excellent CPU+I/O balance and a favorite for cloud-native services. **Rust** offers **no GC, maximum performance and compile-time memory/data-race safety** — at the cost of a steeper learning curve. **Java / .NET** are mature, **truly multi-threaded**, strongly typed platforms built for large enterprise systems. **Python** owns **data science and ML** by ecosystem (NumPy, pandas, PyTorch) but its **GIL** limits CPU parallelism. **Elixir** on the **BEAM** runs **millions of isolated, supervised processes** — the standard-bearer for fault-tolerant, soft-real-time systems.",
      },
      {
        kind: "table",
        caption: "Across languages — model, concurrency, and where each wins.",
        head: ["Runtime", "Concurrency model", "Best at", "Watch out for"],
        rows: [
          ["Node.js", "event loop, 1 JS thread + pool", "I/O-bound APIs, real-time, tooling", "CPU-bound work blocks the loop"],
          ["Go", "goroutines (M:N), real threads", "concurrent CPU+I/O, static binaries", "less mature data/ML ecosystem"],
          ["Rust", "threads + async, no GC", "max performance, safety-critical", "steep learning curve (borrow checker)"],
          ["Java / .NET", "OS threads, mature schedulers", "large enterprise, CPU-heavy services", "heavier runtime & ceremony"],
          ["Python", "threads + GIL (async available)", "data science, ML, scripting", "GIL caps CPU parallelism"],
          ["Elixir (BEAM)", "millions of light processes", "fault-tolerant soft-real-time", "smaller talent pool / ecosystem"],
        ],
      },
      {
        kind: "callout",
        tone: "senior",
        title: "Engines and models, precisely",
        md: "Interviewers probe the details: **V8** powers Node and Deno; **JavaScriptCore** powers Bun. The **event loop** (Node/Deno/Bun) overlaps I/O on one thread; **goroutines** (Go) are M:N-scheduled over real threads; the **JVM/.NET** use OS threads directly; **Elixir** schedules millions of **BEAM processes** with per-process heaps and supervision; **CPython's GIL** serializes bytecode so threads don't run JS-style parallel CPU. Same word — \"concurrency\" — five different machines underneath.",
      },
      {
        kind: "callout",
        tone: "tip",
        title: "How to actually choose",
        md: "Start from the **bottleneck**, then weigh **team, ecosystem and operations** — they cost more than a benchmark. Don't rewrite a service in Go or Rust to fix what is really a **blocking-call bug** in Node. And remember the JS runtimes are increasingly **interoperable**, so \"Node vs Deno vs Bun\" is often a tooling/ergonomics choice, not an architectural one. See [Strengths](#/chapter/strengths), [Weaknesses](#/chapter/weaknesses) and [Modern Node](#/chapter/modern-node).",
      },
    ],
    keyPoints: [
      "Choose by bottleneck, not benchmark: I/O & ecosystem → Node; CPU & parallelism → Go/Rust/JVM; soft-real-time → Elixir; ML → Python.",
      "Deno & Bun are JS/TS runtimes sharing Node's model — Bun chases speed (JavaScriptCore), Deno web-standards & security (V8).",
      "Go: goroutines for easy concurrency, a single static binary, strong CPU+I/O balance.",
      "Python: unmatched ML/data ecosystem, but the GIL limits CPU parallelism.",
      "Java/.NET: mature, truly multi-threaded, strong for CPU-heavy enterprise services.",
      "Rust for max performance & safety (no GC); Elixir/BEAM for massive fault-tolerant concurrency.",
      "Mid-2026 stable lines: Node 24 LTS, Deno 2.8, Bun 1.3 (web-verified).",
    ],
    pitfalls: [
      {
        title: "Choosing on benchmark req/s alone",
        body: "Micro-benchmarks rarely reflect your real, polymorphic, I/O-bound workload, and they ignore ecosystem, hiring and ops. Pick on the dominant bottleneck and total cost of ownership, then validate with a realistic load test.",
      },
      {
        title: "Assuming Bun/Deno are 100% drop-in for Node",
        body: "Node compatibility is strong and improving, but gaps remain in some native addons, less-common core APIs, and edge behaviors. Verify your critical dependencies actually run before committing a production service.",
      },
      {
        title: "Rewriting in Go/Rust to fix a blocking-call bug",
        body: "If Node is 'slow', first check for synchronous/CPU work on the event loop. A worker_thread or an async API often fixes it for a fraction of a rewrite's cost. Switch languages for a genuine model mismatch, not a fixable bug.",
      },
      {
        title: "Picking Python for a CPU-parallel service",
        body: "The GIL serializes bytecode execution, so threads don't give you parallel CPU. You need multiprocessing, native extensions, or another runtime — Python's strength is the ecosystem, not parallel compute.",
      },
    ],
    interview: [
      {
        q: "Node vs Deno vs Bun — what actually differs?",
        a: "All three are event-loop JS/TS runtimes. Node (V8) has the deepest ecosystem and track record. Deno (V8) runs TypeScript directly, is secure-by-default via opt-in permissions, and favors web-standard APIs, with Node/npm compat added in 2.x. Bun (JavaScriptCore, written in Zig) optimizes for speed and bundles a bundler, test runner and package manager. The model is shared; the differences are engine, tooling, security defaults and maturity.",
        level: "senior",
      },
      {
        q: "When would you choose Go or Rust over Node?",
        a: "When the workload is CPU-bound or needs real parallelism. Go gives goroutines over real threads, a static binary, and an easy concurrency story — great for cloud-native, compute-plus-I/O services. Rust gives maximum performance with no GC and compile-time safety for hot paths or safety-critical code. Node would have to offload that work to worker_threads and still wouldn't match them.",
        level: "senior",
      },
      {
        q: "Why might Elixir beat Node for a real-time system?",
        a: "The BEAM runs millions of lightweight, isolated processes, each with its own heap and preemptive scheduling, plus supervision trees for fault tolerance. That gives per-connection isolation and graceful failure recovery that Node's shared single thread doesn't — so for massive, stateful, soft-real-time systems (chat, presence, telephony) Elixir is often the better fit.",
        level: "staff",
      },
      {
        q: "What is the GIL and how does it affect Python vs Node?",
        a: "CPython's Global Interpreter Lock lets only one thread execute Python bytecode at a time, so threads don't give parallel CPU — you use multiprocessing or native extensions instead. Node is also single-threaded for JS, but leans into async I/O rather than threads. Both serialize CPU work on one thread; the difference is Node's whole model is built around overlapping I/O, while Python's strength is its libraries.",
        level: "staff",
      },
      {
        q: "Is Bun a drop-in replacement for Node?",
        a: "Largely, not entirely. Bun targets Node compatibility and runs a lot of existing code and npm packages, and its all-in-one tooling is fast. But some native addons, certain core APIs and edge behaviors still differ, and it uses JavaScriptCore rather than V8. For production I'd treat compatibility as something to verify per-dependency, not assume.",
        level: "senior",
      },
    ],
    seeAlso: ["strengths", "weaknesses", "modern-node", "concurrency"],
    sources: [
      { title: "Node.js — Release schedule (LTS lines)", url: "https://github.com/nodejs/release#release-schedule" },
      { title: "Deno 2.8 — release blog", url: "https://deno.com/blog/v2.8" },
      { title: "Bun — official site", url: "https://bun.sh/" },
      { title: "Go — official site", url: "https://go.dev/" },
      { title: "Elixir — official site (the BEAM)", url: "https://elixir-lang.org/" },
      { title: "Python — What is the GIL? (docs glossary)", url: "https://docs.python.org/3/glossary.html#term-global-interpreter-lock" },
    ],
  },
  {
    id: "architecture",
    group: "foundations",
    order: 5,
    title: "Top-level architecture",
    full: "Top-level architecture — who does what",
    tagline: "V8 · libuv · C++ bindings · core JS libraries, and how they interact.",
    readMins: 8,
    mentalModel: "Layers: your JS → core JS API → C++ bindings → { V8, libuv, bundled C libs } → OS. Each layer has one job; the boundaries are the insight.",
    sections: [
      {
        kind: "prose",
        md: "Node looks like one thing — `node` — but it's a **stack of layers**, each with a single job. From the top: **your JavaScript** calls the **core JS API** (`fs`, `http`, `streams`); that calls down through **C++ bindings** to the native tier of **V8**, **libuv** and a set of **bundled C libraries**; which in turn talk to the **operating system**. The power of this picture isn't the boxes — it's the **boundaries**: knowing which layer can and can't do what is what makes the event loop, the thread pool and GC all make sense.",
      },
      { kind: "figure", fig: "architecture-stack", caption: "The layer cake: your JS → core JS API → C++ bindings → { V8 · libuv · bundled C libs } → OS. A call descends; the result ascends." },
      {
        kind: "prose",
        md: "**Who does what.** **V8** compiles and executes your JavaScript and manages its heap and garbage collection — and it knows **nothing** about files, sockets or the event loop (it's the same engine that runs in Chrome). **libuv** (C) owns the **event loop** itself (the six phases), the **async I/O abstraction** over the OS notifier (epoll / kqueue / IOCP), and the **thread pool** (default 4). The **bundled C libraries** handle specialized work — **OpenSSL** (TLS/crypto), **zlib** (compression), **llhttp** (HTTP/1 parsing), **c-ares** (`dns.resolve`), **nghttp2** (HTTP/2). And the **core JS library** is the JavaScript half of every API: `fs.js` wraps the fs binding; **streams**, **EventEmitter** and **timers** are implemented in JS.",
      },
      {
        kind: "callout",
        tone: "senior",
        title: "V8 is not Node",
        md: "The single most clarifying fact. **V8 is just the engine** — it executes JavaScript and manages memory, nothing more. It has no `fs`, no `http`, no event loop. **Node = V8 + libuv + the bindings + the core JS API.** So when someone asks \"is the event loop part of V8?\" the answer is **no** — the loop lives in **libuv**; `node` is the glue that wires them together.",
      },
      {
        kind: "prose",
        md: "Layers are static; the insight is **how a call flows through them** — and where it ends up. The same descent (JS → core → binding → native) leads to **three different destinations** depending on the work. Step each one below: `fs.readFile` is handed to the **thread pool**; `https.get` is armed on the **OS kernel** with no thread held; `JSON.parse` never leaves **V8** and **blocks** the loop. One stack, three endings.",
      },
      { kind: "sim", sim: "architecture" },
      {
        kind: "prose",
        md: "From that picture the **one rule** falls out, and with it the rest of this guide: **JavaScript runs on a single thread; the waiting is offloaded below it.** How that one thread schedules work is [the Event Loop](#/chapter/event-loop); *where* the waiting goes is [the thread pool vs the kernel](#/chapter/concurrency); how memory is reclaimed on that same thread is [V8 · GC](#/chapter/v8-gc); how data moves through it without blowing memory is [Streams & backpressure](#/chapter/streams).",
      },
      {
        kind: "table",
        caption: "The native pieces are real — run `node -p \"process.versions\"` and you'll see each one.",
        head: ["Component", "process.versions key", "Its job"],
        rows: [
          ["V8", "v8", "compile & execute JS; manage the heap and GC"],
          ["libuv", "uv", "the event loop, async I/O abstraction, thread pool"],
          ["OpenSSL", "openssl", "TLS and the crypto primitives"],
          ["zlib", "zlib", "gzip/deflate/brotli compression"],
          ["llhttp", "llhttp", "parse HTTP/1.x request & response bytes"],
          ["c-ares", "ares", "asynchronous DNS for dns.resolve*()"],
          ["nghttp2", "nghttp2", "HTTP/2 framing"],
          ["undici", "undici", "the modern HTTP/1.1 client behind global fetch"],
        ],
      },
      {
        kind: "callout",
        tone: "tip",
        title: "See it yourself",
        md: "`node -p \"process.versions\"` prints the exact native components Node bundles — `v8`, `uv`, `openssl`, `zlib`, `llhttp`, `ares` and more. It's the architecture diagram, printed by the runtime itself. (The keys in the table above were taken straight from a running Node and are asserted in this chapter's tests.)",
      },
    ],
    keyPoints: [
      "Node is a layer cake: your JS → core JS API → C++ bindings → { V8, libuv, bundled C libs } → OS.",
      "V8 executes JS and manages the heap; it knows nothing about files, sockets, or the event loop.",
      "libuv owns the event loop (6 phases), the async I/O abstraction, and the thread pool (default 4).",
      "Bundled C libraries do specialized work: OpenSSL (TLS), zlib (compress), llhttp (HTTP/1), c-ares (DNS), nghttp2 (HTTP/2).",
      "The core JS library wraps the bindings; streams, EventEmitter and timers are implemented in JS.",
      "One descent, three destinations: fs → thread pool, network → kernel, CPU → V8 (blocks the loop).",
      "The one rule: JavaScript is single-threaded; I/O is not.",
    ],
    pitfalls: [
      {
        title: "Thinking the event loop is part of V8",
        body: "V8 only executes JS and manages its heap. The event loop, timers, sockets and the thread pool are all libuv. Node wires the two together — confusing them is a classic interview miss.",
      },
      {
        title: "Believing Node is 'just C++ under the hood'",
        body: "Much of Node's core is JavaScript: fs.js, streams, EventEmitter and timers are JS that calls thin C++ bindings. The native tier is V8 + libuv + a few C libraries, not the whole runtime.",
      },
      {
        title: "Assuming all async work uses the thread pool",
        body: "Network I/O uses the OS kernel's notifier and holds no pool thread; only operations without an async OS primitive (file I/O, crypto, zlib, dns.lookup) use the pool. Mixing these up leads to wrong capacity planning — see Concurrency.",
      },
      {
        title: "Confusing the runtime with a framework",
        body: "Node provides http, fs, streams and the loop; Express/Nest/Fastify add routing and structure on top. Architecture questions are about the runtime layers, not the framework.",
      },
    ],
    interview: [
      {
        q: "Walk me through Node's architecture, top to bottom.",
        a: "Your JavaScript sits on top, calling the core JS API (fs, http, net, streams). That calls C++ bindings, which reach the native tier: V8 executes the JS and manages the heap/GC; libuv provides the event loop, the async I/O abstraction over epoll/kqueue/IOCP, and a thread pool; bundled C libraries (OpenSSL, zlib, llhttp, c-ares, nghttp2) do specialized work. At the bottom is the OS. The core JS library wraps the bindings, and streams/EventEmitter/timers are themselves JavaScript.",
        level: "senior",
      },
      {
        q: "What does V8 do versus libuv?",
        a: "V8 compiles and runs JavaScript and manages its memory (heap + GC); it knows nothing about I/O. libuv owns everything V8 doesn't: the event loop and its phases, the cross-platform async I/O abstraction, OS event notification, and the thread pool for blocking operations. Node is the glue that lets your JS in V8 drive I/O through libuv.",
        level: "senior",
      },
      {
        q: "Where does the event loop live — V8 or libuv?",
        a: "libuv. The loop, timers, the thread pool and the OS-notifier integration are all libuv (written in C). V8 just executes JavaScript when the loop hands it a callback. This is why the event loop isn't a JavaScript or V8 feature — it's part of the host runtime.",
        level: "senior",
      },
      {
        q: "Trace what happens when you call fs.readFile.",
        a: "fs.readFile (JS) validates args and calls its C++ binding, which submits the read to libuv. Since there's no non-blocking OS primitive for file reads, libuv runs read() on a thread-pool thread — your JS thread keeps running. When the read completes, libuv queues your callback in the poll phase; on the next tick the loop dequeues it and your cb(err, data) runs back in JavaScript. The thread was never blocked.",
        level: "staff",
      },
      {
        q: "Name some of the C libraries Node bundles, and what each does.",
        a: "Beyond V8 and libuv: OpenSSL for TLS and crypto, zlib for compression, llhttp for HTTP/1 parsing, c-ares for asynchronous DNS (dns.resolve), nghttp2 for HTTP/2, and undici as the HTTP/1.1 client behind global fetch. You can list them with node -p 'process.versions'.",
        level: "staff",
      },
    ],
    seeAlso: ["what-is-node", "event-loop", "concurrency", "v8-gc"],
    sources: [
      { title: "Node.js — About (the architecture)", url: "https://nodejs.org/en/about" },
      { title: "libuv — Design overview", url: "https://docs.libuv.org/en/v1.x/design.html" },
      { title: "Node.js — process.versions", url: "https://nodejs.org/api/process.html#processversions" },
      { title: "V8 — JavaScript engine", url: "https://v8.dev/" },
    ],
  },

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
  {
    id: "streams",
    group: "runtime",
    order: 10,
    title: "Streams & Buffers",
    full: "Streams, Buffers & backpressure",
    tagline: "Process data in chunks; backpressure keeps memory bounded no matter the size.",
    readMins: 12,
    mentalModel:
      "A stream moves data in chunks, not all at once. When a fast producer outruns a slow consumer the buffer fills to highWaterMark, write() returns false, and a backpressure-aware producer pauses until 'drain' — so memory stays bounded whether the source is 1 MB or 1 TB.",
    sections: [
      {
        kind: "prose",
        md: "A stream is how Node processes data that is **too big, or arrives too gradually, to hold all at once**. Instead of loading a whole file into memory and then writing it, a stream moves it in **chunks** — read a piece, handle it, release it, repeat. Two payoffs follow: **bounded memory** (you hold one chunk, not the whole 4 GB file) and **composability** (pipe a source through a gzip transform into a socket). This isn't a niche API — it *is* Node's I/O: an HTTP request is a Readable, the response is a Writable, TCP sockets are Duplex, `fs` and `zlib` and `crypto` all expose streams.",
      },
      {
        kind: "code",
        lang: "js",
        code: `const fs = require('node:fs');

// ❌ Buffers the ENTIRE file into RAM before sending — a 4 GB file needs 4 GB.
const data = fs.readFileSync('big.log');
res.end(data);

// ✅ Streams it in ~64 KiB chunks — constant memory, starts sending immediately.
fs.createReadStream('big.log').pipe(res);`,
        note: "Same result, completely different memory profile. readFile's peak memory grows with the file; the stream's peak memory is ~one highWaterMark, regardless of file size.",
      },
      {
        kind: "callout",
        tone: "senior",
        title: "Buffers are the cargo; streams are the conveyor belt",
        md: "A **`Buffer`** is a fixed-length chunk of **raw bytes allocated outside the V8 heap** (so big binary payloads don't pressure GC). Streams are the machinery that moves Buffers (or strings, or — in **objectMode** — arbitrary JS values) from a source to a sink. Don't confuse the two: the Buffer is *what* flows; the stream is *how* it flows, one chunk at a time.",
      },
      {
        kind: "table",
        caption: "The four stream types.",
        head: ["Type", "Direction", "You call / handle", "Example"],
        rows: [
          ["Readable", "source (read from)", "for await…of · .on('data') · .read()", "fs.createReadStream, req"],
          ["Writable", "sink (write to)", ".write(chunk) · .end()", "fs.createWriteStream, res"],
          ["Duplex", "both, independent sides", "read AND write", "net.Socket"],
          ["Transform", "Duplex: output = f(input)", "pipe data through it", "zlib.createGzip, crypto Hash"],
        ],
      },
      {
        kind: "prose",
        md: "Now the part interviews probe: what happens when the **producer is faster than the consumer**? Downloading at 100 MB/s but writing to a slow disk at 10 MB/s — where do the other 90 MB/s *go*? They pile up in the writable's internal **buffer**. If nothing pushes back, that buffer grows without bound until the process runs out of memory. The mechanism that prevents this is **backpressure**.",
      },
      { kind: "figure", fig: "stream-pipeline", caption: "Data flows forward in chunks; backpressure flows backward — a full sink makes write() return false, pausing the source. pipeline() wires both directions and cleans up on error." },
      {
        kind: "prose",
        md: "Every writable has a **`highWaterMark`** — a soft buffer-size limit (default **64 KiB / 65536 bytes** for byte streams, **16** for objectMode, verified on Node 22). Each `write(chunk)` returns a **boolean**: `true` while the buffer is below the mark, and **`false`** the moment a write brings the buffered amount to or past it. That `false` is the stream saying *\"I'm full — stop.\"* A well-behaved producer **stops writing** and waits for the **`'drain'`** event, which fires once the buffer has emptied below the mark. Crucially, `false` is only **advisory**: further writes are still accepted and queued — so a producer that ignores it grows the buffer without limit.",
      },
      {
        kind: "prose",
        md: "Toggle between **respecting** and **ignoring** backpressure below, and resize the `highWaterMark`. Watch the buffer (memory): respecting it pins the buffer just under the mark; ignoring it lets the whole backlog pile up.",
      },
      { kind: "sim", sim: "backpressure" },
      {
        kind: "prose",
        md: "Doing that `write()`/`'drain'` dance by hand is tedious and easy to get wrong — so you almost never should. **`pipe()`** forwards both data and backpressure for you; **`pipeline()`** does the same **and destroys every stream on error or completion**, giving you one error path and no leaked file descriptors. Reach for `pipeline` (its promise form lives in `node:stream/promises`).",
      },
      {
        kind: "code",
        lang: "js",
        code: `const { createReadStream, createWriteStream } = require('node:fs');
const { createGzip } = require('node:zlib');
const { pipeline } = require('node:stream/promises');

// Gzip a huge file with BOUNDED memory — backpressure AND cleanup handled.
await pipeline(
  createReadStream('big.log'),       // Readable  (source)
  createGzip(),                      // Transform (gzip)
  createWriteStream('big.log.gz'),   // Writable  (sink)
);
// One await, one error path. No 'drain' bookkeeping, no leaked fds.`,
        note: "stream/promises.pipeline rejects on ANY stream's error and destroys all of them — the cleanup .pipe() never did. This is the production default.",
      },
      {
        kind: "compare",
        a: ".pipe(dest)",
        b: "pipeline(...streams)",
        rows: [
          ["Backpressure", "forwarded for you", "forwarded for you"],
          ["On error", "does NOT destroy the chain — leaks fds/sockets", "destroys every stream, single error path"],
          ["Completion", "no unified 'done' signal", "callback fires / promise resolves when finished"],
          ["Use it", "throwaway scripts where you manage lifecycle", "production — essentially always"],
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "The classic stream OOM",
        md: "Two ways teams blow up memory with streams: (1) a **`'data'` handler that writes to a slower sink and ignores the `false` return** — the producer never pauses, the buffer balloons; (2) **collecting an entire stream into a string or array** (`chunks.push(c)` then `Buffer.concat`) — which throws away the whole point and reintroduces the unbounded memory you used a stream to avoid. If you find yourself accumulating, you probably want `pipeline` into the real sink instead. Also: attach an **`'error'` handler to every stream** — an unhandled stream `'error'` is an uncaught exception that crashes the process.",
      },
      {
        kind: "prose",
        md: "Modern Node makes streams much friendlier. A Readable is an **async iterable**, so `for await…of` consumes it *with backpressure built in*. **`Readable.from()`** turns any (async) iterable or generator into a stream. And an **async generator** can serve as a Transform inside `pipeline`. Together these let you express a streaming data pipeline as ordinary `for await` loops.",
      },
      {
        kind: "code",
        lang: "js",
        code: `const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

// A Readable straight from an async generator — a million rows, never all in RAM.
async function* rows() {
  for (let i = 0; i < 1e6; i++) yield { id: i };
}

await pipeline(
  Readable.from(rows()),                 // source
  async function* (source) {             // a Transform, written as a generator
    for await (const row of source) {    // for-await consumes WITH backpressure
      if (row.id % 2 === 0) yield JSON.stringify(row) + '\\n';
    }
  },
  process.stdout,                        // sink
);`,
        note: "for await…of pauses the source automatically when the consumer is slow — the async-iterator protocol is backpressure. Readable.from adapts any iterable; an async generator is the simplest Transform you can write.",
      },
      {
        kind: "callout",
        tone: "tip",
        title: "highWaterMark is a throughput/memory dial",
        md: "A **bigger** `highWaterMark` means fewer pause/resume cycles (higher throughput) at the cost of more memory per stream; a **smaller** one bounds memory tighter but pauses more often (you can see this trade in the simulator — bigger mark, fewer `'drain'` events). For pipelines of records, set **`objectMode: true`** and a sensible object `highWaterMark`. Tune only when a profiler points here — the 64 KiB default is right for the vast majority of byte streams.",
      },
    ],
    keyPoints: [
      "A stream processes data in chunks → bounded memory + composability; most Node I/O (http, sockets, fs, zlib) IS a stream.",
      "Four types: Readable (source), Writable (sink), Duplex (both), Transform (output = f(input)).",
      "A Buffer is fixed-length raw bytes off the V8 heap; streams move Buffers/strings, or arbitrary values in objectMode.",
      "Backpressure: write() returns false once buffered ≥ highWaterMark; stop and wait for the 'drain' event.",
      "Default highWaterMark is 64 KiB (65536 bytes) for byte streams, 16 for objectMode.",
      "pipeline() forwards data AND backpressure and destroys every stream on error — prefer it over pipe().",
      "for await…of and Readable.from give you backpressure-correct streaming with ordinary loops.",
    ],
    pitfalls: [
      {
        title: "Ignoring write()'s return value",
        body: "A 'data' handler (or any producer) that writes to a slower sink and never checks the false return never pauses — the buffer grows until the process OOMs. Respect false + 'drain', or just use pipeline().",
      },
      {
        title: "Using .pipe() in production without cleanup",
        body: ".pipe() forwards backpressure but does NOT destroy the source/destination when one errors, leaking file descriptors and sockets. Use stream.pipeline (or stream/promises) so every stream is torn down on error.",
      },
      {
        title: "Buffering the whole stream into memory",
        body: "Collecting chunks into an array/string and Buffer.concat-ing at the end defeats streaming and reintroduces unbounded memory. If you're accumulating, you probably want to pipeline into the real destination instead.",
      },
      {
        title: "Forgetting 'error' handlers",
        body: "An unhandled 'error' on any stream becomes an uncaught exception that crashes the process. Every stream needs error handling — pipeline() centralizes it into one rejection/callback.",
      },
      {
        title: "Mixing flowing and paused mode",
        body: "Adding a 'data' listener switches a Readable into flowing mode; also calling .read() or pausing/resuming inconsistently can drop or duplicate chunks. Pick one consumption model — ideally for await…of or pipeline.",
      },
    ],
    interview: [
      {
        q: "What is backpressure and how do you respect it?",
        a: "When a writable's buffered bytes reach highWaterMark, write() returns false — the signal that the consumer can't keep up. A correct producer stops writing and waits for the 'drain' event before continuing; otherwise the buffer grows unbounded and the process can OOM. In practice you let pipe()/pipeline() handle it rather than managing write()/'drain' by hand.",
        level: "senior",
      },
      {
        q: "Why prefer pipeline() over pipe()?",
        a: "Both forward data and backpressure, but .pipe() does NOT destroy the streams when one errors, so a mid-stream failure leaks file descriptors/sockets and has no unified completion signal. stream.pipeline() (and its promises form) destroys every stream on error or completion and gives you a single error path — the right default for production.",
        level: "staff",
      },
      {
        q: "What are the stream types and what is objectMode?",
        a: "Readable (source), Writable (sink), Duplex (both independent sides, e.g. a TCP socket), Transform (a Duplex whose output is a function of its input, e.g. gzip or a hash). By default streams carry Buffers/strings with a 64 KiB highWaterMark; in objectMode each chunk is an arbitrary JS value and highWaterMark counts objects (default 16).",
        level: "senior",
      },
      {
        q: "How does an HTTP server use streams, end to end?",
        a: "The request is a Readable (the body arrives in chunks) and the response is a Writable. Writing a large response respects backpressure to the TCP socket: if the client/network is slow, res.write() returns false and you should pause the source — which pipeline(fileStream, res) does automatically. This is why a single Node process can serve many slow clients without buffering whole responses in memory.",
        level: "staff",
      },
      {
        q: "How would you process a multi-GB file line by line without loading it?",
        a: "Stream it: createReadStream piped through a Transform (or readline) and into the sink via pipeline, so only ~one highWaterMark of data is resident at a time. With async generators you can write the transform as a for await…of loop and let Readable.from / pipeline handle backpressure and cleanup.",
        level: "senior",
      },
    ],
    seeAlso: ["event-loop", "http", "performance", "concurrency"],
    sources: [
      { title: "Node.js — Stream", url: "https://nodejs.org/api/stream.html" },
      { title: "Node.js — Backpressuring in Streams", url: "https://nodejs.org/en/learn/modules/backpressuring-in-streams" },
      { title: "Node.js — stream.pipeline() and stream/promises", url: "https://nodejs.org/api/stream.html#streampipelinesource-transforms-destination-callback" },
      { title: "Node.js — Buffer", url: "https://nodejs.org/api/buffer.html" },
    ],
  },
  {
    id: "modules",
    group: "runtime",
    order: 11,
    title: "Modules: CJS vs ESM",
    full: "Module system — CommonJS vs ES Modules",
    tagline: "require is sync, cached, value-copied; import is an async graph with live bindings.",
    readMins: 11,
    mentalModel:
      "CommonJS runs the dependency graph synchronously, depth-first, caching a value copy of module.exports. ESM parses and links the WHOLE graph first (live, read-only bindings), then evaluates it — which is why import is async, hoisted, statically analyzable, and handles cycles gracefully.",
    sections: [
      {
        kind: "prose",
        md: "Node has **two** module systems. **CommonJS** (`require` / `module.exports`) is the original, Node-specific system; **ES Modules** (`import` / `export`) is the JavaScript-language standard, shared with browsers. The temptation is to see them as the same idea with different keywords — but the real difference isn't syntax, it's the **loading model**. CommonJS is *synchronous and dynamic*; ESM is an *asynchronous, statically-analyzed graph*. Almost every interop surprise traces back to that one distinction.",
      },
      {
        kind: "table",
        caption: "The two systems, side by side. The loading model drives everything below it.",
        head: ["Aspect", "CommonJS — require()", "ES Modules — import"],
        rows: [
          ["Loading", "synchronous, depth-first", "async graph: parse → link → evaluate"],
          ["Exports are", "a value copy of module.exports", "live, read-only bindings"],
          ["Resolution", "runtime, dynamic strings", "static (hoisted, analyzable) + dynamic import()"],
          ["Cache key", "require.cache by resolved path", "module map by URL"],
          ["Top-level await", "not allowed", "allowed"],
          ["Dir / file", "__dirname, __filename, require, module", "import.meta.url / import.meta.dirname"],
          ["JSON", "require('./x.json')", "import x from './x.json' with { type: 'json' }"],
          ["Opt in via", '.cjs  or  "type":"commonjs"', '.mjs  or  "type":"module"'],
        ],
      },
      {
        kind: "prose",
        md: "**CommonJS** is the simpler mental model: `require(path)` is an ordinary **synchronous function call**. The first time you require a module, Node loads it, **runs its body to completion**, and stores the resulting `module.exports` in **`require.cache`**, keyed by resolved path. Every later `require` of the same path returns that **cached value** without re-running. Because it's synchronous and depth-first, resolution and evaluation **interleave** — a module's body runs the instant it's first required, in the middle of its parent's execution.",
      },
      {
        kind: "prose",
        md: "**ESM** is a graph processed in **three distinct phases**, none of which is your code running until the last one: **(1) parse / construct** — read every module, statically extract its `import`/`export` statements, and recursively fetch the whole graph; **(2) instantiate / link** — allocate each module's exported names and wire every `import` to the exporter's **live binding** (still no code run); **(3) evaluate** — run module bodies in post-order, once each. Separating *link* from *evaluate* is what gives ESM its superpowers: imports are **hoisted**, the graph is **statically analyzable** (tree-shaking, bundling), `import` can be **asynchronous** (and support top-level `await`), and **circular** references resolve through the pre-wired bindings.",
      },
      {
        kind: "prose",
        md: "Step the **same diamond graph** (`app` imports `left` and `right`; both import `base`) through each loader below. Watch *when* code runs: CommonJS interleaves resolution and evaluation and hits the cache on the second `base`; ESM finishes parsing and linking the entire graph **before any body evaluates**. Both end with the same post-order `base → left → right → app`, `base` exactly once — the difference is the *timing*.",
      },
      { kind: "sim", sim: "module-resolver" },
      {
        kind: "callout",
        tone: "senior",
        title: "Live bindings vs a value copy — the difference you can feel",
        md: "An ESM `import` is a **live, read-only view** of the exporter's variable; a CommonJS `require` hands back a **snapshot copy** of `module.exports` at require-time. So if a module mutates an exported `let` after you import it, **ESM sees the new value; a destructured `require` is frozen at the old one.** This isn't trivia — it changes how shared mutable state and circular dependencies behave.",
      },
      {
        kind: "code",
        lang: "js",
        code: `// counter.mjs — exports a LIVE binding
export let count = 0;
export function inc() { count++; }

// main.mjs
import { count, inc } from './counter.mjs';
console.log(count);   // 0
inc();
console.log(count);   // 1   ← the binding is LIVE — it reflects the mutation

// counter.cjs — the CommonJS shape
let count = 0;
module.exports = { count, inc: () => count++ };
// const { count, inc } = require('./counter.cjs');
// console.log(count); inc(); console.log(count);   // 0 then 0 — a value COPY`,
        note: "Verified on Node 22. ESM imports track the exporter's variable; require() gives you a snapshot, and destructuring it copies primitives by value.",
      },
      {
        kind: "compare",
        a: "require() — CommonJS",
        b: "import — ES Modules",
        rows: [
          ["Timing", "synchronous, runs on the spot", "async; bodies run after the graph links"],
          ["Binding", "value copy of module.exports", "live, read-only binding"],
          ["Circular dep", "sees a PARTIAL exports object", "hoisted bindings resolve (graceful)"],
          ["Dynamic path", "require(variable) — always", "only via import(variable)"],
          ["Cache", "require.cache by path", "module map by URL"],
        ],
      },
      {
        kind: "prose",
        md: "The two systems **interoperate**, with rules worth memorizing. `import` of a CommonJS module works: its `module.exports` becomes the **default** export, and Node uses static analysis (`cjs-module-lexer`) to expose **named** exports best-effort. Going the other way, **`require()` of an ES module is now unflagged and stabilized** in current LTS lines — it landed in **Node 22.12** — *unless* the target (or its deps) uses **top-level `await`**, which throws `ERR_REQUIRE_ASYNC_MODULE` because `require` can't be synchronous over an async module. Always prefer the **`node:` prefix** for built-ins (`require('node:fs')`, `import … from 'node:fs'`) so a rogue npm package named `fs` can't shadow core.",
      },
      {
        kind: "table",
        caption: "Interop quick reference (current LTS).",
        head: ["You want to load…", "…with require()", "…with import"],
        rows: [
          ["a CommonJS module", "✓ returns module.exports", "✓ default = module.exports; named via static analysis"],
          ["an ES module", "✓ unflagged since 22.12 — throws if it uses top-level await", "✓ native, asynchronous"],
        ],
      },
      {
        kind: "code",
        lang: "js",
        code: `// ESM-only conveniences
const res = await fetch(url);        // top-level await — no async wrapper needed
console.log(import.meta.url);        // the file:// URL of THIS module

// __dirname / __filename do NOT exist in ESM. Modern Node:
import.meta.dirname;                 // directory of this module (recent LTS)
import.meta.filename;
// portable fallback for older lines:
import { fileURLToPath } from 'node:url';
const __dirname = fileURLToPath(new URL('.', import.meta.url));`,
        note: "Top-level await is the feature that makes require(esm) refuse an async module. import.meta.dirname/​filename remove the usual fileURLToPath boilerplate on recent Node.",
      },
      {
        kind: "callout",
        tone: "warn",
        title: "Two real traps: the dual-package hazard & circular partial exports",
        md: "**Dual-package hazard:** shipping *both* a CJS and an ESM build means a dependency can get loaded **both** ways, producing **two separate instances** with separate state — two caches, two `EventEmitter`s, failing `instanceof`. Mitigate by keeping state in a single CJS core that the ESM wrapper re-exports, or shipping **ESM-only**. **Circular partial exports (CJS):** in a cycle, `require` returns whatever the other module has assigned **so far** — read a not-yet-defined export and you get `undefined` (Node even warns). ESM avoids this for hoisted declarations because it links bindings before evaluating. Call these in the quiz below.",
      },
      {
        kind: "prose",
        md: "Now read the queues and the cache and call each output — three places CJS and ESM quietly diverge.",
      },
      { kind: "sim", sim: "modules-quiz" },
    ],
    keyPoints: [
      "Two systems: CommonJS (require/module.exports) and standard ESM (import/export); the real difference is the loading model, not syntax.",
      "CJS require() is synchronous, depth-first, and cached in require.cache; it returns a value copy of module.exports.",
      "ESM loads in three phases — parse → link (live bindings) → evaluate — over the whole graph, asynchronously.",
      "ESM imports are LIVE read-only bindings; a destructured require() is a frozen snapshot copy.",
      "ESM-only: top-level await, import.meta.url. CJS-only by default: __dirname, __filename, require, module.",
      "require(esm) is unflagged/stabilized (landed in 22.12); it throws ERR_REQUIRE_ASYNC_MODULE only if the target uses top-level await.",
      "Circular deps: CJS exposes a partial exports object; ESM resolves hoisted bindings via linking.",
    ],
    pitfalls: [
      {
        title: "Treating import as require with new syntax",
        body: "The async graph, the parse/link/evaluate phases, live bindings, top-level await and cycle handling all behave differently. Porting a file by swapping keywords can change ordering and break circular dependencies.",
      },
      {
        title: "Destructuring a CJS require and expecting live updates",
        body: "const { x } = require('m') copies x's value at require-time. If the module later reassigns x, you won't see it (unlike an ESM live binding). Keep the namespace (const m = require('m'); use m.x) if you need the current value.",
      },
      {
        title: "The dual-package hazard",
        body: "Publishing both CJS and ESM builds can load a package twice as two instances with split state — failing instanceof, duplicated singletons/caches. Centralize state in one format, or ship ESM-only.",
      },
      {
        title: "Reaching for __dirname / require in ESM",
        body: "They don't exist in modules. Use import.meta.dirname/import.meta.filename (recent LTS) or fileURLToPath(import.meta.url); use import() for dynamic loading and createRequire if you truly need require.",
      },
      {
        title: "Assuming every CJS named export is importable",
        body: "Named imports from a CJS module are detected heuristically by cjs-module-lexer and can miss exports built dynamically. If a named import is undefined, import the default and destructure from it.",
      },
    ],
    interview: [
      {
        q: "What are the key differences between CommonJS and ES Modules?",
        a: "CJS require() is synchronous, depth-first and cached, returning a value copy of module.exports; __dirname/require exist. ESM import is an asynchronous, statically-analyzable graph loaded in three phases (parse → link → evaluate) with live read-only bindings, import.meta.url, and top-level await. The loading model — sync/dynamic vs async/static — is the root difference.",
        level: "senior",
      },
      {
        q: "Live bindings vs value copies — how do CJS and ESM differ on mutation and cycles?",
        a: "ESM imports are live read-only bindings to the exporter's variables, so they observe later mutations; require() returns a snapshot, and destructuring copies primitives. On circular deps, CJS hands back a partial exports object (you can read undefined for a not-yet-assigned member), while ESM links bindings before evaluation so hoisted declarations resolve — cycles are handled more gracefully.",
        level: "staff",
      },
      {
        q: "Can you require() an ES module now, and what is the dual-package hazard?",
        a: "Yes — require(esm) is unflagged and stabilized in current LTS (it landed in 22.12); it throws ERR_REQUIRE_ASYNC_MODULE only if the target uses top-level await. The dual-package hazard is shipping both CJS and ESM builds so a dependency loads both ways as two instances with separate state (split caches/singletons, failing instanceof). Mitigate by centralizing state in one format or shipping ESM-only.",
        level: "staff",
      },
      {
        q: "Why is import asynchronous, and what are ESM's three phases?",
        a: "Because resolving the graph may involve async work and the spec separates structure from execution. Phase 1 parse/construct reads modules and finds imports/exports; phase 2 instantiate/link allocates exports and wires live bindings; phase 3 evaluate runs bodies post-order, once each. Doing link before evaluate is what enables hoisting, static analysis/tree-shaking, top-level await, and graceful cycles.",
        level: "staff",
      },
      {
        q: "How do you get __dirname in an ES module?",
        a: "It isn't defined. Use import.meta.dirname (and import.meta.filename) on recent Node, or derive it portably with fileURLToPath(new URL('.', import.meta.url)). For dynamic requires use module.createRequire(import.meta.url); for dynamic loading use import().",
        level: "senior",
      },
    ],
    seeAlso: ["architecture", "modern-node", "async-model", "event-loop"],
    sources: [
      { title: "Node.js — Modules: CommonJS modules", url: "https://nodejs.org/api/modules.html" },
      { title: "Node.js — Modules: ECMAScript modules", url: "https://nodejs.org/api/esm.html" },
      { title: "Node.js 22.12.0 (LTS) — require(esm) unflagged", url: "https://nodejs.org/en/blog/release/v22.12.0" },
      { title: "Joyee Cheung — require(esm) in Node.js: from experiment to stability", url: "https://joyeecheung.github.io/blog/2025/12/30/require-esm-in-node-js-from-experiment-to-stability/" },
      { title: "MDN — JavaScript modules", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules" },
    ],
  },

  // ----------------------------------------------------------- Building systems
  {
    id: "errors",
    group: "systems",
    order: 12,
    title: "Error handling",
    full: "Error handling — operational vs programmer, fail fast, context",
    tagline: "Operational vs programmer errors; the four error channels; fail fast; AsyncLocalStorage.",
    readMins: 11,
    mentalModel:
      "Two kinds of error: operational (expected — handle and continue) and programmer (a bug — fail fast and restart clean). Errors travel four ways; try/catch only catches one of them. Never silently swallow.",
    sections: [
      {
        kind: "prose",
        md: "Robust Node services rest on **one distinction**: an error is either **operational** or a **programmer bug**, and the two demand opposite responses. An **operational error** is an *expected* runtime failure that's part of normal life for a healthy program — bad user input, a 404, `ECONNREFUSED`, a timeout, a full disk. You **anticipate and handle** these: validate, retry, return a 4xx/5xx, fall back. A **programmer error** is a *defect* — `undefined is not a function`, a broken invariant, a forgotten `await`. You **cannot recover** from a bug, because after it fires the process is in an **unknown, possibly corrupted state**. The correct response is to **fail fast**: log it and let the process crash so a supervisor restarts it clean.",
      },
      { kind: "figure", fig: "error-taxonomy", caption: "The decision that governs everything else: is this an expected operational failure (handle it) or a programmer bug (let it crash)?" },
      {
        kind: "compare",
        a: "Operational error",
        b: "Programmer error (bug)",
        rows: [
          ["What it is", "an expected runtime failure", "a defect in your code"],
          ["Examples", "bad input, 404, ECONNREFUSED, timeout", "undefined is not a function, bad invariant"],
          ["Predictable?", "yes — part of normal operation", "no — you didn't foresee it"],
          ["Response", "handle: validate · retry · 4xx/5xx · fallback", "fail fast: log & let it crash, then restart"],
          ["State afterward", "known & recoverable", "unknown & possibly corrupt — don't continue"],
        ],
      },
      {
        kind: "prose",
        md: "Before you can handle an error you have to **catch** it — and in Node an error can travel **four different ways**, only one of which `try/catch` sees. It can be **thrown** synchronously on the current call stack; it can **reject a Promise**; it can be **passed as the first argument** of an error-first callback (`(err, value) => …`); or it can be **emitted as an `'error'` event** on an EventEmitter. The classic senior mistake is assuming `try/catch` covers all four. It does not — it only catches a **synchronous throw on the stack it wraps**. Step the simulator to watch the same `throw` get caught in one context and crash the process in another.",
      },
      { kind: "sim", sim: "error-propagation" },
      {
        kind: "callout",
        tone: "senior",
        title: "try/catch is a synchronous tool",
        md: "`try { setTimeout(() => { throw e }, 0) } catch {}` will **never** catch that error. `setTimeout` returns immediately, the `try` block finishes, and the callback throws on a **later tick with an empty stack** — the `catch` is long gone, and the error becomes an `uncaughtException` that crashes the process. The fix is to move the `try/catch` **inside** the async callback, or — far better — use **`async/await`**, where `await` re-threads a rejection back onto your stack so the surrounding `catch` works again.",
      },
      {
        kind: "table",
        caption: "The four channels an error arrives by — and how you handle each.",
        head: ["Channel", "How the error arrives", "How you handle it"],
        rows: [
          ["throw (sync)", "thrown on the current call stack", "try/catch around the synchronous call"],
          ["Promise rejection", "the promise settles rejected", "await inside try/catch, or .catch() — never leave it floating"],
          ["Error-first callback", "passed as the first arg: (err, value)", "check if (err) on the first line, or promisify + await"],
          ["EventEmitter 'error'", "emitted as an 'error' event", "attach an 'error' listener — with none, the emitter throws"],
        ],
      },
      {
        kind: "prose",
        md: "The unifying move is to **collapse all four channels into one**: promises handled with `async/await` inside `try/catch`. Promisify (or use the `node:*/promises` APIs for) callback code so a dropped `err` becomes impossible; `await` every promise so none float; and attach an `'error'` listener to every socket, stream and server. The remaining trap is **`async/await` with concurrency**: `await`-ing in a `for` loop serializes; `Promise.all` runs in parallel but **rejects on the first failure** (and leaves the rest unawaited); `Promise.allSettled` waits for **all** and never rejects, so you inspect each result. See [the async model](#/chapter/async-model) for the ordering details.",
      },
      {
        kind: "code",
        lang: "js",
        code: `// ✘ error-first err silently dropped → wrong data, no trace
db.query(sql, (err, rows) => {
  render(rows);                 // err ignored; rows may be undefined
});

// ✘ floating promise → unhandledRejection → process crash (Node ≥15)
function handler() {
  saveToDb(record);             // not awaited, not .catch()-ed
}

// ✓ one channel, one pattern: promisified + awaited + try/catch
async function handler(record) {
  try {
    const rows = await db.query(sql);   // rejection re-thrown here
    return render(rows);
  } catch (err) {
    log.error({ err }, 'query failed'); // operational → handle & respond
    return reply.code(503).send('try again');
  }
}`,
        note: "Convert callbacks to promises (util.promisify or the node: promises APIs), await everything, and handle in one place. The bad cases above are the two most common ways production Node loses or swallows errors.",
      },
      {
        kind: "callout",
        tone: "warn",
        title: "Fail fast: log + crash, don't limp on",
        md: "`process.on('uncaughtException')` and `process.on('unhandledRejection')` are **last-resort backstops, not handlers**. Since **Node 15 an unhandled rejection terminates the process by default**, and an uncaught exception always has. Use the handlers only to **log the fatal error and exit** (flush logs, then `process.exit(1)`), and let your supervisor (**PM2 / systemd / Kubernetes**) restart a clean process — see [Production patterns](#/chapter/production). Trying to *resume* after a programmer error means running on a process whose state you no longer trust.",
      },
      {
        kind: "prose",
        md: "One hard problem remains: **carrying context across async boundaries**. A request id, a user, a trace span — you want them available deep inside async calls without threading an argument through every function. The modern, stable tool is **`AsyncLocalStorage`** (in `node:async_hooks`): it keeps a value alive **through the whole async call chain** of a request, isolated from every other in-flight request. It is the sanctioned replacement for **domains**, which are **deprecated** — never build new code on `domain`.",
      },
      {
        kind: "code",
        lang: "js",
        code: `import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

const als = new AsyncLocalStorage();

// one store per request — survives every await/callback inside run()
app.use((req, res, next) => {
  als.run({ reqId: randomUUID() }, () => next());
});

// anywhere downstream, no argument threading:
function log(msg) {
  const { reqId } = als.getStore() ?? {};
  console.log(JSON.stringify({ reqId, msg }));
}`,
        note: "AsyncLocalStorage carries request-scoped context across async hops so logs and traces can be correlated. It's the stable successor to the deprecated domain module.",
      },
      {
        kind: "callout",
        tone: "tip",
        title: "Two finishing touches",
        md: "**Preserve the cause chain** — when you wrap an error, keep the original: `throw new Error('load failed', { cause: err })` (Node 16.9+). And **model your domain with error classes** (e.g. `class ValidationError extends Error`) so handlers can branch on type and map cleanly to status codes, instead of string-matching messages. The whole chapter in one line: **handle operational errors, crash on bugs, and never let an error vanish.**",
      },
    ],
    keyPoints: [
      "Split errors into operational (expected — handle & continue) and programmer bugs (fail fast — crash & restart).",
      "Errors travel four ways: sync throw, Promise rejection, error-first callback arg, EventEmitter 'error'.",
      "try/catch catches only a synchronous throw on the stack it wraps — not a throw inside setTimeout/callbacks.",
      "async/await re-threads a rejection onto your stack, so try/catch works again — prefer it over raw callbacks.",
      "A floating promise → unhandledRejection → process exit by default (Node ≥15); await or .catch() everything.",
      "An EventEmitter 'error' with no listener throws; always attach an 'error' listener to sockets/streams/servers.",
      "uncaughtException/unhandledRejection handlers should log + exit; AsyncLocalStorage carries request context (domains are deprecated).",
    ],
    pitfalls: [
      {
        title: "Wrapping an async call in try/catch and expecting it to catch",
        body: "try/catch only guards the synchronous stack. setTimeout/setInterval callbacks, EventEmitter handlers and un-awaited promises throw on a later tick where the catch no longer exists. Move the try/catch inside the callback, or await the work.",
      },
      {
        title: "Floating promises (no await, no .catch)",
        body: "Calling an async function without awaiting or catching it detaches its outcome; a rejection becomes unhandledRejection and crashes the process by default. Await it, .catch() it, or collect into Promise.all/allSettled. Lint with no-floating-promises.",
      },
      {
        title: "Ignoring the err argument in an error-first callback",
        body: "Callback errors are passed, not thrown — ignore err and the failure is silently swallowed: no exception, no crash, just wrong behavior with no trace. Check if (err) first, or promisify and await so it can't be dropped.",
      },
      {
        title: "Forgetting an 'error' listener on streams and sockets",
        body: "EventEmitter throws an unlistened 'error' event synchronously, turning into an uncaughtException. Every server, socket and stream needs an 'error' handler — it's the most common surprise crash in networking code.",
      },
      {
        title: "Trying to recover from a programmer error",
        body: "After a bug the process state is untrustworthy. Catching uncaughtException and continuing risks corrupt data and zombie state. Log, exit non-zero, and let a supervisor restart a clean process — fail fast.",
      },
    ],
    interview: [
      {
        q: "Operational vs programmer errors — what's the difference and why does it matter?",
        a: "An operational error is an expected runtime failure (bad input, ECONNREFUSED, timeout, 404) that a correct program must handle — validate, retry, return a status, fall back. A programmer error is a bug (undefined is not a function, broken invariant) you didn't anticipate; after it fires the process state is unknown, so you can't safely recover. The distinction sets the response: handle operational errors, fail fast (crash and restart) on bugs.",
        level: "senior",
      },
      {
        q: "Why doesn't try/catch catch an error thrown inside setTimeout?",
        a: "Because try/catch only guards the synchronous call stack it wraps. setTimeout returns immediately, the try block completes, and the callback runs much later on a fresh, empty stack in the timers phase — the catch is no longer anywhere on the stack. The throw becomes an uncaughtException. Put the try/catch inside the callback, or wrap the work in a promise and await it so the rejection re-threads onto a stack the catch can see.",
        level: "senior",
      },
      {
        q: "What happens to an unhandled promise rejection in modern Node?",
        a: "Since Node 15 the default is to terminate the process (the unhandledRejection event fires and, unhandled, the process exits non-zero). A 'floating' promise — one you neither await nor .catch() — is the usual cause. The right fix is to await inside try/catch or attach .catch(); process.on('unhandledRejection') should only log and exit, acting as a crash backstop, not a handler.",
        level: "staff",
      },
      {
        q: "How do you propagate request context (like a request id) through async code?",
        a: "AsyncLocalStorage from node:async_hooks. You call als.run(store, fn) at the start of a request, and any code in that async call chain — across awaits and callbacks — reads it with als.getStore(), with per-request isolation. It's the stable replacement for the deprecated domain module, and it's how request-scoped logging, tracing and tenancy are implemented without threading a context argument everywhere.",
        level: "staff",
      },
      {
        q: "What's your strategy for uncaughtException and unhandledRejection in production?",
        a: "Treat both as fatal. Register handlers that log the error with full context, flush logs/metrics, and call process.exit(1) — do not resume. A process supervisor (PM2, systemd, Kubernetes) restarts a clean instance. For graceful handling during the crash window, stop accepting new work and let in-flight requests finish if possible, but the end state is always a fresh process. Resuming after a bug risks serving corrupt state.",
        level: "senior",
      },
    ],
    seeAlso: ["async-model", "production", "http", "concurrency"],
    sources: [
      { title: "Node.js — Error handling guide (operational vs programmer)", url: "https://nodejs.org/en/learn/asynchronous-work/error-handling-in-nodejs" },
      { title: "Node.js — process 'uncaughtException' & 'unhandledRejection'", url: "https://nodejs.org/api/process.html#event-uncaughtexception" },
      { title: "Node.js — AsyncLocalStorage (async_hooks)", url: "https://nodejs.org/api/async_context.html#class-asynclocalstorage" },
      { title: "Node.js — events: capturing 'error' events", url: "https://nodejs.org/api/events.html#error-events" },
      { title: "Node.js — domain (Deprecated, Stability 0)", url: "https://nodejs.org/api/domain.html" },
    ],
  },
  {
    id: "http",
    group: "systems",
    order: 13,
    title: "Networking & HTTP internals",
    full: "Networking & HTTP internals — sockets, parsing, keep-alive, timeouts",
    tagline: "Sockets on the kernel, the llhttp parser, keep-alive Agents, HTTP/1.1 vs 2, and the timeout triad.",
    readMins: 12,
    mentalModel:
      "A request is a stream of bytes on a kernel-watched socket; llhttp parses it incrementally into req/res; your handler streams a response back. Agents pool and reuse the TCP sockets so most requests skip the handshake.",
    sections: [
      {
        kind: "prose",
        md: "An HTTP request is, at bottom, **bytes arriving on a TCP socket**. Node's job is to turn those bytes into a `req`/`res` pair, run your handler, and stream the answer back — and to do it for thousands of connections at once on **one thread**. The connection itself is **non-blocking and watched by the OS kernel** (epoll/kqueue/IOCP), so it holds **no thread-pool slot**; this is the same kernel-async path from [the architecture chapter](#/chapter/architecture) and exactly why a single Node process scales to so many concurrent sockets (see [Concurrency](#/chapter/concurrency)). The bytes are parsed by the bundled **llhttp** parser, the response body is a [stream with backpressure](#/chapter/streams), and the socket is then either **reused or thrown away** — a choice that dominates real-world latency.",
      },
      { kind: "figure", fig: "keep-alive-pool", caption: "A keep-alive Agent keeps a small pool of open sockets per origin and hands them to new requests — so most requests skip the TCP (and TLS) handshake entirely." },
      {
        kind: "prose",
        md: "Trace one request end to end. The same journey ends three different ways depending on the `Connection` header and how fast the client is — reuse a pooled socket (fast, the modern default), open and discard a fresh one (slow), or stall until a timeout reclaims it. Step each one:",
      },
      { kind: "sim", sim: "http-lifecycle" },
      {
        kind: "callout",
        tone: "senior",
        title: "The socket holds no thread",
        md: "Notice the simulator says **event loop free** at every step. Network I/O does **not** use the libuv thread pool — libuv arms the socket on the kernel's notifier and one loop thread watches them all. The pool is for file I/O, crypto and zlib (see [Concurrency](#/chapter/concurrency)). So \"can Node handle 10k connections?\" is a question about **sockets and memory**, not threads — the connections are nearly free; it's your *handlers* that must stay async and short.",
      },
      {
        kind: "prose",
        md: "**Parsing: llhttp.** Incoming bytes hit **llhttp** (the C parser Node bundles — `process.versions.llhttp`), which reads the request **incrementally** as it streams in: the request line, then each header, emitting events Node assembles into an `IncomingMessage`. It's strict by design — malformed framing, smuggled headers and oversized header blocks are rejected, which is a **security boundary**, not just a convenience. Because parsing is incremental, a slow client can hold a half-parsed request open — which is precisely what the timeouts below exist to bound.",
      },
      {
        kind: "prose",
        md: "**Keep-alive & Agents.** Opening a TCP connection costs a round-trip (the handshake), and HTTPS adds a TLS handshake on top — pure latency before any data moves. **HTTP keep-alive** amortizes that by **reusing one connection for many requests**. On the **client** side Node manages this with an **`Agent`** that pools sockets per origin; since **Node 19 the global Agent defaults to `keepAlive: true`**, so `http.request`/`fetch` (backed by **undici**) reuse connections out of the box. You tune the pool with `maxSockets` (per origin), `maxFreeSockets`, `maxTotalSockets`, and `scheduling`. On the **server** side, keep-alive is on by default and an idle socket is closed after `keepAliveTimeout`.",
      },
      {
        kind: "table",
        caption: "http.Agent knobs (defaults from a real http.globalAgent on Node 22 — JSON shows Infinity as null).",
        head: ["Option", "Default", "What it controls"],
        rows: [
          ["keepAlive", "true (globalAgent, Node ≥19)", "reuse sockets instead of closing after each response"],
          ["maxSockets", "Infinity", "max concurrent sockets per origin (host:port)"],
          ["maxFreeSockets", "256", "max idle sockets kept open per origin for reuse"],
          ["maxTotalSockets", "Infinity", "max sockets across all origins combined"],
          ["scheduling", "'lifo'", "pick most-recently-used socket (keeps the pool warm, sheds idle ones)"],
        ],
      },
      {
        kind: "prose",
        md: "**HTTP/1.1 vs HTTP/2.** Over **HTTP/1.1**, a single connection carries **one request/response at a time** — the next must wait for the current response to finish. That's **head-of-line (HOL) blocking**, and it's why browsers open several parallel connections and why keep-alive matters so much. **HTTP/2** (Node's `node:http2`, via the bundled **nghttp2**) puts **many multiplexed streams on one connection**, plus header compression (HPACK) and server push — removing application-layer HOL. But HTTP/2 still rides **TCP**, so a single lost packet stalls *all* streams at the transport layer (**TCP-level HOL**). **HTTP/3** fixes that by running over **QUIC/UDP** with independent streams — but in Node core, **QUIC (`node:quic`, via nghttp3) is still experimental**, so most teams **terminate HTTP/3 at the edge** (CDN / load balancer) and run an **HTTP/2 (or 1.1) origin** in Node.",
      },
      {
        kind: "compare",
        a: "HTTP/1.1",
        b: "HTTP/2",
        rows: [
          ["Concurrency per connection", "one request at a time (HOL blocking)", "many multiplexed streams"],
          ["Headers", "plain text, repeated every request", "HPACK-compressed"],
          ["Connections needed", "several in parallel", "usually one"],
          ["Node module", "node:http (llhttp)", "node:http2 (nghttp2)"],
          ["Transport HOL", "n/a (one stream)", "still TCP-level (HTTP/3/QUIC removes it)"],
        ],
      },
      {
        kind: "prose",
        md: "**The timeout triad.** Three server timeouts bound how long a connection can tie up resources, and getting them wrong is a top cause of mysterious **502s**. `headersTimeout` (default **60 s**) caps the time to receive **complete** headers — the defense against **Slowloris**, where an attacker dribbles headers to hold sockets open. `requestTimeout` (default **300 s**, **enabled by default since Node 18**) caps the **whole** request. `keepAliveTimeout` (default **5 s**) closes an **idle** socket between requests. (`server.timeout`, a per-socket inactivity timeout, defaults to **0** = off.)",
      },
      { kind: "figure", fig: "timeout-triad", caption: "Where each timeout fires across a connection's life: headers must complete within headersTimeout, the whole request within requestTimeout, and an idle keep-alive socket closes after keepAliveTimeout." },
      {
        kind: "table",
        caption: "The timeout triad (defaults verified against http.createServer() on Node 22).",
        head: ["Timeout", "Default", "Bounds", "Misconfig symptom"],
        rows: [
          ["keepAliveTimeout", "5 s", "idle time between requests on a kept socket", "502 / ECONNRESET behind a load balancer"],
          ["headersTimeout", "60 s", "time to receive the COMPLETE request headers", "Slowloris holds sockets; or premature 408s"],
          ["requestTimeout", "300 s (on since Node 18)", "time to receive the ENTIRE request", "slow uploads cut off, or sockets held too long"],
        ],
      },
      {
        kind: "callout",
        tone: "warn",
        title: "The keep-alive 502 race",
        md: "The classic production bug: a load balancer (AWS ALB, nginx) keeps an upstream connection open for, say, **60 s**, but Node's `keepAliveTimeout` is **5 s**. Node closes the idle socket first; the LB then sends a request down a socket Node has already torn down → **`ECONNRESET`** → the client gets a **502**. Fix: set Node's **`keepAliveTimeout` (and `headersTimeout`) *greater* than the load balancer's idle timeout** so the LB always closes first. This single mismatch is behind a large share of intermittent 502s in containerized Node.",
      },
      {
        kind: "code",
        lang: "js",
        code: `import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

// Always handle malformed requests at the socket level (else they can crash you)
server.on('clientError', (err, socket) => {
  if (socket.writable) socket.end('HTTP/1.1 400 Bad Request\\r\\n\\r\\n');
});

// Set keep-alive ABOVE the upstream LB's idle timeout (e.g. ALB = 60s) to avoid 502s
server.keepAliveTimeout = 65_000;   // was 5_000
server.headersTimeout   = 66_000;   // must exceed keepAliveTimeout
server.listen(3000);

// Outgoing: keep-alive Agent reuses sockets (globalAgent already does since Node 19)
const agent = new http.Agent({ keepAlive: true, maxSockets: 50 });
http.get({ host: 'api.internal', agent }, (res) => res.resume());`,
        note: "Handle 'clientError', and raise keepAliveTimeout/headersTimeout above any upstream proxy's idle timeout. Reuse outgoing sockets with a keep-alive Agent (or just rely on the default global Agent / fetch).",
      },
      {
        kind: "callout",
        tone: "tip",
        title: "The picture to keep",
        md: "**Bytes → llhttp → req/res → your handler → streamed response → socket reused or closed.** The connection lives on the **kernel** (no thread); **keep-alive Agents** make the handshake a one-time cost; **HTTP/2** multiplexes where HTTP/1.1 blocks; and the **timeout triad** keeps slow/stalled clients from leaking resources. Next: [Performance & profiling](#/chapter/performance) to measure it, and [Production patterns](#/chapter/production) for graceful shutdown of in-flight requests.",
      },
    ],
    keyPoints: [
      "A request is bytes on a kernel-watched socket; the connection holds no thread-pool slot (network I/O is kernel-async).",
      "llhttp parses incoming bytes incrementally into req/res, and strictly rejects malformed framing (a security boundary).",
      "Keep-alive reuses one TCP connection for many requests, skipping the handshake; client Agents pool sockets per origin.",
      "Since Node 19 the global Agent defaults to keepAlive:true; tune maxSockets (∞), maxFreeSockets (256), scheduling ('lifo').",
      "HTTP/1.1 = one request per connection (HOL blocking); HTTP/2 (nghttp2) multiplexes streams over one connection.",
      "HTTP/2 still has TCP-level HOL; HTTP/3/QUIC fixes it but is experimental in Node core — terminate it at the edge.",
      "Timeout triad: keepAliveTimeout 5s, headersTimeout 60s, requestTimeout 300s — keep them above any LB idle timeout to avoid 502s.",
    ],
    pitfalls: [
      {
        title: "keepAliveTimeout shorter than the upstream load balancer",
        body: "If Node closes an idle keep-alive socket before the LB/proxy does, the LB reuses a dead socket and the client gets ECONNRESET → 502. Set Node's keepAliveTimeout (and headersTimeout above it) greater than the LB's idle timeout so the LB always closes first.",
      },
      {
        title: "Not reusing outgoing connections",
        body: "Creating connections without a keep-alive Agent pays a TCP (and TLS) handshake on every outbound request, adding latency and CPU. Since Node 19 the global Agent keeps connections alive by default; for custom Agents set keepAlive:true and size maxSockets to your concurrency.",
      },
      {
        title: "Assuming HTTP/2 removes all head-of-line blocking",
        body: "HTTP/2 removes application-layer HOL by multiplexing, but it still runs over TCP, so one lost packet stalls every stream at the transport layer. Only HTTP/3 over QUIC makes streams independent — and that's still experimental in Node core.",
      },
      {
        title: "Leaving server timeouts at defaults behind a proxy",
        body: "The default keepAliveTimeout (5s), headersTimeout (60s) and requestTimeout (300s) rarely match your infrastructure. Tune them to your load balancer and upload sizes; a too-low headersTimeout cuts off legitimate slow clients, a too-high one invites Slowloris.",
      },
      {
        title: "No 'clientError'/'error' handler on the server",
        body: "Malformed requests emit 'clientError', and socket failures emit 'error'; unhandled, they can crash the process. Attach handlers (respond 400 and close on clientError) — the same 'always attach an error listener' rule from the errors chapter.",
      },
    ],
    interview: [
      {
        q: "Walk me through what happens when an HTTP request hits a Node server.",
        a: "The kernel signals the socket readable and the event loop wakes in its poll phase (no thread is parked on the connection). The bundled llhttp parser reads the bytes incrementally into a request line and headers, Node builds IncomingMessage (req) and ServerResponse (res) and emits 'request', and your handler runs on the event-loop thread. The handler writes status/headers/body, which stream back out through the socket with backpressure. Finally the socket is either kept alive for reuse (and an idle timer starts) or closed, per the Connection header.",
        level: "senior",
      },
      {
        q: "What is HTTP keep-alive and why does it matter for performance?",
        a: "Keep-alive reuses a single TCP connection for multiple requests instead of opening a new one each time. That avoids a TCP handshake (one round-trip) and, on HTTPS, a TLS handshake (one or more) per request — pure latency and CPU you'd otherwise pay repeatedly. Node manages it client-side with an Agent that pools sockets per origin; since Node 19 the global Agent defaults to keepAlive:true, so http.request and fetch reuse connections by default.",
        level: "senior",
      },
      {
        q: "HTTP/1.1 vs HTTP/2 vs HTTP/3 — what changed, and what does Node support?",
        a: "HTTP/1.1 carries one request at a time per connection, so you get head-of-line blocking and open several connections. HTTP/2 (Node's node:http2 via nghttp2) multiplexes many streams over one connection with header compression, removing app-layer HOL — but it still rides TCP, so packet loss causes transport-level HOL. HTTP/3 runs over QUIC/UDP with independent streams to fix that; in Node core QUIC (node:quic) is still experimental, so HTTP/3 is usually terminated at the edge with an HTTP/2 or 1.1 origin in Node.",
        level: "staff",
      },
      {
        q: "A service behind a load balancer returns intermittent 502s. How do you reason about it?",
        a: "A prime suspect is the keep-alive race: if Node's keepAliveTimeout (default 5s) is shorter than the load balancer's idle timeout, Node closes an idle upstream socket the LB still thinks is usable; the LB sends a request into it, gets ECONNRESET, and returns 502. The fix is to set Node's keepAliveTimeout — and headersTimeout above it — greater than the LB's idle timeout so the LB always closes first. I'd confirm with connection metrics and packet/RST counts before and after.",
        level: "staff",
      },
      {
        q: "What is the role of llhttp, and why is strict parsing a security feature?",
        a: "llhttp is the C parser Node bundles to turn raw socket bytes into HTTP messages, incrementally as they arrive. Strictness matters because lax parsing enables request smuggling and header-injection attacks: ambiguous framing (conflicting Content-Length/Transfer-Encoding), oversized header blocks, or malformed lines can desync a proxy and origin. By rejecting malformed input early (and via headersTimeout against Slowloris), the parser is a first line of defense, not just a convenience.",
        level: "staff",
      },
    ],
    seeAlso: ["streams", "concurrency", "performance", "production"],
    sources: [
      { title: "Node.js — HTTP (Server timeouts, Agent, http.request)", url: "https://nodejs.org/api/http.html" },
      { title: "Node.js — HTTP/2 (node:http2)", url: "https://nodejs.org/api/http2.html" },
      { title: "Node.js — net (sockets)", url: "https://nodejs.org/api/net.html" },
      { title: "llhttp — the Node.js HTTP parser", url: "https://github.com/nodejs/llhttp" },
      { title: "Use Keep-Alive by default in global agents (Node 19, PR #43522)", url: "https://github.com/nodejs/node/pull/43522" },
    ],
  },
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
