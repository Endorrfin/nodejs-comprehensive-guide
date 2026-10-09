/* ===========================================================================
   Seven principles instead of a hundred facts (S17).
   The layer the 21 chapters are DERIVED from: reason from a principle out loud
   ("one thread, therefore…") and an unfamiliar interview question turns into a
   chain of consequences. Every claim here restates something a chapter already
   verified — no new facts live in this file.
   `chapters` is the single source for the "Built on principles" line on each
   chapter page (computed, never duplicated) and is validated by qa-integrity.
   Pure data (no imports) so node --experimental-strip-types can load it.
   =========================================================================== */

export interface Principle {
  id: string;
  /** 1..7 — rendered as ①…⑦. */
  n: number;
  title: string;
  /** The one-sentence statement (inline md). */
  line: string;
  /** Consequences, each read as "Therefore, …" (inline md). */
  therefore: string[];
  /** Interview questions whose answers fall out of the principle. */
  questions: string[];
  /** Chapter ids where the principle is developed. */
  chapters: string[];
}

export const PRINCIPLES: Principle[] = [
  {
    id: "one-thread",
    n: 1,
    title: "One thread runs your JavaScript.",
    line: "While one piece of your code executes, no other piece of your JS runs.",
    therefore: [
      "sync CPU work (a huge `JSON.parse`, sync crypto, a catastrophic regex) stalls **every** request, not just its own.",
      "code between two `await`s is atomic, so plain objects need no locks — but an invariant that **spans** an `await` can still race, and there is no parallel speed-up either.",
      "your latency is the sum of everything queued ahead of you on the loop.",
    ],
    questions: [
      "Why does one slow endpoint raise p99 for all endpoints?",
      "Do you need locks in Node?",
      "Why is a ReDoS a denial of service for the whole process?",
    ],
    chapters: ["what-is-node", "weaknesses", "event-loop", "async-model", "modules", "performance", "security", "summary"],
  },
  {
    id: "waiting-is-cheap",
    n: 2,
    title: "Waiting is cheap; computing is expensive.",
    line: "A pending I/O costs a callback and a socket — orders of magnitude less than a ~1 MiB thread. A busy thread costs everyone.",
    therefore: [
      "Node wins on I/O-bound, high-concurrency work: APIs, gateways, BFFs, real-time.",
      "it loses on CPU-bound work, so offload that to `worker_threads` or another service.",
      "concurrency (overlapping waits) is not parallelism (computing at the same time).",
    ],
    questions: [
      "How does one thread serve 10k connections?",
      "When would you not pick Node?",
      "Concurrency vs parallelism — what does Node give you for free?",
    ],
    chapters: ["what-is-node", "strengths", "competitors", "concurrency", "summary"],
  },
  {
    id: "three-places",
    n: 3,
    title: "Every operation lands in one of three places.",
    line: "**V8 on your thread** (JS, JSON, regex) blocks. The **libuv pool** (fs, crypto, zlib, `dns.lookup`; 4 threads by default) queues invisibly. The **kernel** (sockets via epoll / kqueue / IOCP) holds no thread at all.",
    therefore: [
      "knowing where a call lands tells you whether it **blocks**, **queues** or is **free**.",
      "6 × `pbkdf2` on a pool of 4 run in two waves (4, then 2), and a slow `dns.lookup` can delay your `fs` calls.",
      "raising `UV_THREADPOOL_SIZE` helps pool-bound work only — sockets never touch the pool.",
    ],
    questions: [
      "Why does `fs.readFile` get slower while you hash passwords?",
      "Does an HTTP request use the thread pool?",
      "Trace what happens when you call `fs.readFile`.",
    ],
    chapters: ["what-is-node", "architecture", "event-loop", "concurrency", "summary"],
  },
  {
    id: "microtasks-first",
    n: 4,
    title: "Microtasks drain before the loop moves on.",
    line: "After every callback, Node drains all `process.nextTick` callbacks, then all Promise reactions, and only then moves to the next callback or phase (in CommonJS; an ESM top level is already a microtask drain, so the order there flips).",
    therefore: [
      "`await` continuations run before any timer or I/O callback.",
      "a recursive `nextTick` or an endless Promise chain **starves** I/O.",
      "`setTimeout(0)` vs `setImmediate` is a race in the main module, but inside an I/O callback `setImmediate` always runs first.",
    ],
    questions: [
      "Predict the output: sync · `setTimeout` · `setImmediate` · `nextTick` · Promise.",
      "Can Promises starve the event loop?",
      "Why can the same snippet print differently as `.cjs` and `.mjs`?",
    ],
    chapters: ["event-loop", "async-model", "modules", "summary"],
  },
  {
    id: "data-must-flow",
    n: 5,
    title: "Memory stays bounded only if data flows.",
    line: "Stream in chunks, honour backpressure, and let objects die young.",
    therefore: [
      "`readFile` buffers the whole file per request (and refuses past 2 GiB); a stream holds about one `highWaterMark` — so use a stream plus `pipeline()`.",
      "ignoring `write() === false` means an unbounded buffer — `false` is advisory, not a wall.",
      "a leak is whatever you keep **reachable** (caches, listeners, closures); GC can't free it, and an old space that only grows is the symptom.",
    ],
    questions: [
      "How would you upload 10 GB through Node?",
      "How do you find a memory leak?",
      "What does `highWaterMark` actually limit?",
    ],
    chapters: ["streams", "v8-gc", "summary"],
  },
  {
    id: "errors-have-channels",
    n: 6,
    title: "Every error travels on a channel — and an unheard one kills the process.",
    line: "Four channels: `throw`, a rejected Promise, an err-first callback and the `'error'` event. `try/catch` covers only `throw` and `await`.",
    therefore: [
      "an **operational** error is handled and you continue; a **programmer** error means fail fast and restart clean.",
      "an unhandled rejection exits the process (the default since Node 15), and an `'error'` event with no listener crashes it.",
      "never swallow an error — log it with context, or let it kill the process so the supervisor restarts it.",
    ],
    questions: [
      "Why didn't my `try/catch` catch it?",
      "What do you do in an `uncaughtException` handler?",
      "How does Express 5 differ from 4 when an async handler throws?",
    ],
    chapters: ["errors", "express", "summary"],
  },
  {
    id: "design-for-death",
    n: 7,
    title: "Every process will be killed — design for it, and watch it.",
    line: "Deploys and autoscaling send `SIGTERM`, then `SIGKILL` after the grace period; an OOM kill skips straight to `SIGKILL`.",
    therefore: [
      "graceful shutdown = fail readiness → stop intake → drain → close resources → exit 0, with a force-exit timer as the backstop.",
      "keep processes stateless (state lives in a DB or Redis) and scale by adding processes — so patching and upgrading are just one more rolling restart.",
      "measure, don't guess: watch event-loop lag, ELU and p99, and keep readiness separate from liveness.",
    ],
    questions: [
      "What happens to in-flight requests during a deploy?",
      "How do you scale Node across cores?",
      "Which metric tells you the event loop is saturated?",
    ],
    chapters: ["production", "http", "performance", "security", "modern-node", "summary"],
  },
];

/** ①…⑦ */
export const CIRCLED = ["", "①", "②", "③", "④", "⑤", "⑥", "⑦"];

/** Principles a chapter is built on, in principle order (derived, never stored on the chapter). */
export function principlesForChapter(chapterId: string): Principle[] {
  return PRINCIPLES.filter((p) => p.chapters.includes(chapterId));
}
