/* Interview bank — seeded subset (grows to 40 in S8). Tagged by chapter + level. */
export interface BankItem {
  id: string;
  chapter: string; // chapter id it maps to
  topic: string; // display label
  level: "senior" | "staff";
  q: string;
  a: string;
}

export const INTERVIEW: BankItem[] = [
  {
    id: "el-phases",
    chapter: "event-loop",
    topic: "Event Loop",
    level: "senior",
    q: "Walk me through the phases of the event loop.",
    a: "Six phases per tick in fixed order: timers → pending callbacks → idle/prepare (internal) → poll → check → close. After every callback and between phases, microtasks drain: the nextTick queue first, then the Promise queue.",
  },
  {
    id: "el-order",
    chapter: "event-loop",
    topic: "Event Loop",
    level: "senior",
    q: "nextTick vs Promise.then vs setImmediate vs setTimeout(0) — what order?",
    a: "Synchronous code first. Then microtasks: all nextTick, then all promises. Then macrotasks by phase: setTimeout(0) in timers, setImmediate in check. In the main module timeout-vs-immediate is non-deterministic; inside an I/O callback setImmediate runs first.",
  },
  {
    id: "el-starve",
    chapter: "event-loop",
    topic: "Event Loop",
    level: "staff",
    q: "How can you starve the event loop?",
    a: "Recursively scheduling process.nextTick (or promises) keeps a microtask queue non-empty, so the loop never advances — timers and I/O never run. Long synchronous CPU work also blocks the single thread.",
  },
  {
    id: "el-v8",
    chapter: "event-loop",
    topic: "Event Loop",
    level: "senior",
    q: "Is the event loop part of V8?",
    a: "No. V8 executes JavaScript and manages its heap. The event loop, timers, the thread pool and OS I/O notifications are all libuv. Node wires them together.",
  },
  {
    id: "async-await-parallel",
    chapter: "async-model",
    topic: "Async model",
    level: "senior",
    q: "Does async/await make code run in parallel?",
    a: "No. await pauses the async function until a promise settles; it sequences awaited work. For concurrency, start the promises first and await them together (Promise.all).",
  },
  {
    id: "async-microtask",
    chapter: "async-model",
    topic: "Async model",
    level: "staff",
    q: "Where do awaited continuations run relative to timers?",
    a: "A resolved await continuation is a microtask, so it runs before any timer/macrotask — at the next microtask checkpoint, after the current synchronous run.",
  },
  {
    id: "gc-generations",
    chapter: "v8-gc",
    topic: "V8 & GC",
    level: "senior",
    q: "Explain V8's generational garbage collection.",
    a: "Objects are allocated in young space and collected by a fast scavenger (Scavenge); survivors are promoted to old space, collected by mark-sweep-compact. The generational hypothesis: most objects die young.",
  },
  {
    id: "gc-shapes",
    chapter: "v8-gc",
    topic: "V8 & GC",
    level: "staff",
    q: "Why keep object shapes stable for performance?",
    a: "V8 uses hidden classes and inline caches keyed on an object's shape. Adding/removing properties in varying order creates new hidden classes, deopting inline caches and slowing property access.",
  },
  {
    id: "conc-threads-vs-proc",
    chapter: "concurrency",
    topic: "Concurrency",
    level: "senior",
    q: "worker_threads vs cluster vs child_process — when each?",
    a: "worker_threads for CPU-bound work sharing memory in-process; cluster to fork processes sharing a server port across cores; child_process to run separate programs and talk over IPC/streams.",
  },
  {
    id: "conc-pool",
    chapter: "concurrency",
    topic: "Concurrency",
    level: "staff",
    q: "What uses the libuv thread pool, and how big is it?",
    a: "fs operations, dns.lookup, crypto and zlib use the pool (default 4 threads, configurable via UV_THREADPOOL_SIZE). Most network I/O does NOT — the kernel handles it asynchronously without pool threads.",
  },
  {
    id: "streams-backpressure",
    chapter: "streams",
    topic: "Streams",
    level: "senior",
    q: "What is backpressure and how do you respect it?",
    a: "When a writable's buffer passes highWaterMark, write() returns false; you should stop writing and wait for the 'drain' event. pipeline()/pipe() handle this for you and (pipeline) also clean up on error.",
  },
  {
    id: "modules-cjs-esm",
    chapter: "modules",
    topic: "Modules",
    level: "senior",
    q: "Key differences between CommonJS and ESM?",
    a: "CJS require() is synchronous, cached, returns a value copy of module.exports, and has __dirname. ESM import is asynchronous, statically analyzable, exposes live read-only bindings, and uses import.meta.url; top-level await is ESM-only.",
  },
  {
    id: "errors-types",
    chapter: "errors",
    topic: "Errors",
    level: "staff",
    q: "How do you decide whether to crash on an error?",
    a: "Classify it: operational errors (bad input, network failures) are expected — handle and continue. Programmer errors (bugs, invariant violations) should fail fast: log and let the process crash so a supervisor restarts a clean state.",
  },
  {
    id: "http-timeouts",
    chapter: "http",
    topic: "HTTP",
    level: "staff",
    q: "Why might a healthy Node service return sporadic 502s behind a proxy?",
    a: "Often a timeout mismatch: the upstream proxy keep-alive outlives Node's keepAliveTimeout/headersTimeout, so Node closes a socket the proxy reuses. Align the timeout triad (keepAliveTimeout ≥ proxy idle, headersTimeout > keepAliveTimeout).",
  },
];

export const INTERVIEW_TOPICS: string[] = Array.from(new Set(INTERVIEW.map((i) => i.topic)));
