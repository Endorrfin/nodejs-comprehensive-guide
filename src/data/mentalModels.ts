/* "Draw from memory" gallery (Ch.19). One card per load-bearing picture in the
   guide — read the prompt, sketch the answer, then reveal the real diagram +
   the recap to check against. `figure` keys resolve via lib/registry FIGURES. */
export interface ModelCard {
  id: string;
  title: string;
  chapter: string; // chapter id (group is derived from it)
  prompt: string; // what to draw / recall
  answer: string; // the recap to check against
  figure?: string; // optional figure registry key to reveal alongside the answer
}

export const MODELS: ModelCard[] = [
  // -------------------------------------------------------------- Foundations
  {
    id: "arch-layers",
    title: "The architecture layer cake",
    chapter: "architecture",
    figure: "architecture-stack",
    prompt: "Draw Node top to bottom: from your JavaScript down to the OS. Name each layer's one job.",
    answer:
      "Your JS → core JS API (fs, http, streams) → C++ bindings → native tier { V8, libuv, bundled C libs (OpenSSL, zlib, llhttp, c-ares, nghttp2) } → OS. The boundaries are the insight: each layer has exactly one job.",
  },
  {
    id: "v8-not-node",
    title: "V8 is not Node",
    chapter: "architecture",
    figure: "node-pieces",
    prompt: "What does V8 do, and what does it explicitly NOT do? Where does the event loop live?",
    answer:
      "V8 only compiles/executes JS and manages its heap + GC. It knows nothing about files, sockets, or the event loop. The loop, timers, async I/O and the thread pool are all libuv. Node = V8 + libuv + bindings + core JS.",
  },
  {
    id: "c10k",
    title: "Why Node holds 10k connections",
    chapter: "strengths",
    figure: "connection-scaling",
    prompt: "10k mostly-idle connections: how does the event loop hold them where thread-per-request can't?",
    answer:
      "Thread-per-request needs ~1 MiB of stack per connection → ~10 GiB + scheduler thrash at 10k. The event loop + OS notifier watch every socket on ONE thread at ~64 KiB each → a fraction of the memory. A thread costs ~16× a socket.",
  },
  {
    id: "blocking-loop",
    title: "One sync task stalls everyone",
    chapter: "weaknesses",
    figure: "blocking-loop",
    prompt: "A request handler runs a 250 ms synchronous task. Draw what happens to the other in-flight requests.",
    answer:
      "They all wait. There's one thread; a synchronous burst (CPU, a *Sync call, a catastrophic regex) blocks the loop, so every other request's callback is delayed by the full 250 ms. Throughput collapses to one-at-a-time.",
  },

  // ------------------------------------------------------------- Runtime core
  {
    id: "loop-phases",
    title: "The six event-loop phases",
    chapter: "event-loop",
    figure: "event-loop-ring",
    prompt: "Draw one tick of the event loop: name the six phases in order and say where microtasks run.",
    answer:
      "timers → pending callbacks → idle/prepare (internal) → poll → check → close. Microtasks (nextTick first, then Promise) drain after EVERY callback and between phases — they are not a phase.",
  },
  {
    id: "microtask-priority",
    title: "Microtask priority",
    chapter: "event-loop",
    figure: "microtask-ladder",
    prompt: "Order these: sync code, setTimeout(0), setImmediate, Promise.then, process.nextTick.",
    answer:
      "Sync first → process.nextTick → Promise.then → then macrotasks: setTimeout(0) (timers) and setImmediate (check), whose relative order is non-deterministic in the main module but immediate-first inside an I/O callback.",
  },
  {
    id: "await-suspend",
    title: "What await does to the stack",
    chapter: "async-model",
    figure: "await-timeline",
    prompt: "Draw what `await` does to the async function and the call stack while it waits.",
    answer:
      "await suspends the async function and unwinds its frame off the call stack, returning control to the caller/loop. When the awaited promise settles, the continuation is scheduled as a microtask and the function resumes — it never blocked the thread.",
  },
  {
    id: "pool-vs-kernel",
    title: "Thread pool vs kernel async",
    chapter: "concurrency",
    figure: "thread-pool-kernel",
    prompt: "Where do fs.readFile ×N and http.get ×N execute? Draw the pool and the kernel paths.",
    answer:
      "fs / crypto / zlib / dns.lookup go to the libuv thread pool (default 4 — extras queue). Network I/O (sockets) is handled by the OS notifier (epoll/kqueue/IOCP) with no pool thread; one thread can watch thousands of sockets.",
  },
  {
    id: "gc-generations",
    title: "GC generations",
    chapter: "v8-gc",
    figure: "gc-heap",
    prompt: "Draw V8's heap: where are objects born, and how does each generation get collected?",
    answer:
      "Young space (nursery): fast Scavenge copies live objects between two semi-spaces; survivors are promoted to old space, collected by mark-sweep-compact (mostly concurrent/incremental, short stop-the-world pauses). Minor GC ≫ major GC in frequency.",
  },
  {
    id: "jit-tiers",
    title: "V8's JIT tiers",
    chapter: "v8-gc",
    figure: "jit-tiers",
    prompt: "Name V8's compilation tiers in order, and say what triggers a deopt.",
    answer:
      "Ignition (bytecode interpreter) → Sparkplug (baseline) → Maglev (mid-tier, default in 22) → TurboFan (optimizing). Hot code tiers up on speculative type assumptions; if a hidden-class/shape assumption breaks, V8 deoptimizes back to a lower tier.",
  },
  {
    id: "backpressure",
    title: "Backpressure",
    chapter: "streams",
    figure: "stream-pipeline",
    prompt: "A fast producer writes to a slow consumer. Draw what keeps memory bounded.",
    answer:
      "write() returns false once buffered bytes exceed highWaterMark; the producer pauses and resumes on the 'drain' event. pipeline() wires this automatically and cleans up on error — bounded memory by design.",
  },
  {
    id: "cjs-vs-esm",
    title: "CJS vs ESM loading",
    chapter: "modules",
    figure: "module-load-compare",
    prompt: "How do CommonJS and ESM differ in how they load a diamond dependency graph?",
    answer:
      "CJS: synchronous, depth-first, executes on require(), cached by resolved path, interleaves load+eval. ESM: async parse → link (bindings) → evaluate as separate phases, live bindings, post-order evaluation. require(esm) is unflagged since 22.12 (but not for top-level-await graphs).",
  },

  // ---------------------------------------------------------- Building systems
  {
    id: "error-channels",
    title: "The four error channels",
    chapter: "errors",
    figure: "error-taxonomy",
    prompt: "Name the four ways errors surface in Node and why try/catch covers only one.",
    answer:
      "(1) synchronous throw, (2) rejected Promise / await, (3) error-first callback's first arg, (4) EventEmitter 'error' event. try/catch is synchronous-only, so it catches #1 and (with await) #2 — #3 and #4 need their own handling or they crash/are swallowed.",
  },
  {
    id: "http-lifecycle",
    title: "A request's life + keep-alive",
    chapter: "http",
    figure: "keep-alive-pool",
    prompt: "Trace a request from bytes to response, and draw what keep-alive reuses.",
    answer:
      "Socket bytes → llhttp parses → req/res objects → your handler → response streamed back → socket either closed or kept alive and returned to the Agent pool for reuse (skipping the next TCP/TLS handshake). The loop stays free throughout.",
  },
  {
    id: "eloop-lag",
    title: "Event-loop lag + the flame graph",
    chapter: "performance",
    figure: "flame-graph",
    prompt: "What is event-loop lag, and how does a flame graph show the hot path?",
    answer:
      "Lag = how late a timer fires vs its schedule — the queue waiting behind on-loop CPU. Measure it with perf_hooks.monitorEventLoopDelay + eventLoopUtilization. A flame graph's width = CPU samples; the widest tower is the hottest path to optimize.",
  },
  {
    id: "supply-chain",
    title: "The dependency tree is the attack surface",
    chapter: "security",
    figure: "supply-chain-trust",
    prompt: "Why is your transitive dependency tree the attack surface, and what bounds it?",
    answer:
      "Node trusts any code it runs, so every transitive package (and its install scripts) can act with your process's authority. No single control suffices: ignore-scripts, lockfile + audit, install cooldown/min-release-age, provenance, and the Permission Model each block a different attack class.",
  },
  {
    id: "shutdown",
    title: "The SIGTERM handshake",
    chapter: "production",
    figure: "shutdown-sequence",
    prompt: "Draw the graceful-shutdown sequence that drops zero in-flight requests.",
    answer:
      "On SIGTERM: fail readiness (so the LB stops sending new work) → stop accepting new connections → drain in-flight requests → close idle keep-alive sockets + server → exit(0), with a force-exit timer as a backstop. Abrupt exit drops in-flight requests as 502s.",
  },

  // ------------------------------------------------------------------ Mastery
  {
    id: "version-lifecycle",
    title: "The release-line lifecycle",
    chapter: "modern-node",
    figure: "version-timeline",
    prompt: "Draw the Node release-line lifecycle and mark which line you build new production on.",
    answer:
      "Current (~6 mo) → Active LTS (~12 mo, new features) → Maintenance (~18 mo, security fixes) → EOL. Build on the Active LTS line — June 2026 that's Node 24 (22 maintenance, 26 current, 18 & 20 EOL). From Node 27 (Oct 2026) every line becomes LTS.",
  },
];
