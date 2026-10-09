/* ===========================================================================
   Glossary (S17) — every term the guide leans on, defined in 1–2 sentences.
   Definitions RESTATE what the owning chapter already says (and verified);
   version-sensitive facts appear only where the guide verified them.
   `chapter` = where the term is explained; `principle` = the ①…⑦ rule it
   falls out of (data/principles); `seeAlso` = other glossary terms (by `term`).
   Pure data (no imports) so node --experimental-strip-types can load it;
   validated by qa-integrity (refs resolve, terms + aka unique case-insensitively).
   =========================================================================== */

export interface Term {
  term: string;
  aka?: string[];
  /** 1–2 sentences, inline md. */
  def: string;
  chapter: string;
  principle?: number;
  seeAlso?: string[];
}

export const GLOSSARY: Term[] = [
  // ---------------------------------------------------------------- what-is-node
  {
    term: "Node.js",
    def: "A JavaScript **runtime**: the program that runs JS outside the browser with non-blocking I/O. Not a language, not a framework, not a web server — it pairs V8 with libuv through C++ bindings and a core JS library.",
    chapter: "what-is-node",
    seeAlso: ["V8", "libuv", "C++ bindings"],
  },
  {
    term: "V8",
    def: "Google's JavaScript engine: compiles and runs your JS and manages its memory (the heap and GC). V8 is not Node — it knows nothing about files, sockets or timers.",
    chapter: "what-is-node",
    principle: 3,
    seeAlso: ["JIT", "libuv"],
  },
  {
    term: "libuv",
    def: "The C library that supplies Node's **event loop**, an abstraction over the OS's async I/O (epoll / kqueue / IOCP), and a small **thread pool** for operations with no async OS primitive.",
    chapter: "what-is-node",
    principle: 3,
    seeAlso: ["Event loop", "Thread pool", "OS event notifier"],
  },
  {
    term: "C++ bindings",
    aka: ["bindings"],
    def: "The glue between the core JS library and the native parts: `fs.js` calls its C++ binding, which hands the work to libuv, V8 or a bundled C library.",
    chapter: "what-is-node",
    seeAlso: ["V8", "libuv"],
  },
  {
    term: "Non-blocking I/O",
    def: "Start an operation, register a callback, and immediately get on with other work instead of parking a thread until the disk or network answers. Node's defining design choice.",
    chapter: "what-is-node",
    principle: 2,
    seeAlso: ["Callback", "Event loop"],
  },
  {
    term: "OpenJS Foundation",
    def: "The foundation that stewards Node.js today. Node was created in 2009 by Ryan Dahl.",
    chapter: "what-is-node",
  },

  // ---------------------------------------------------------------- strengths
  {
    term: "C10k",
    def: "The problem of serving ~10,000 simultaneous connections without a thread per connection. Node's answer: non-blocking sockets multiplexed on one event-loop thread.",
    chapter: "strengths",
    principle: 2,
    seeAlso: ["Thread-per-request", "OS event notifier"],
  },
  {
    term: "Thread-per-request",
    def: "The classic server model: each connection gets its own OS thread (~1 MiB of stack reserved), which mostly sits blocked on I/O. At 10k connections that is ~10 GiB plus scheduler thrash.",
    chapter: "strengths",
    principle: 2,
    seeAlso: ["C10k"],
  },
  {
    term: "Concurrency",
    def: "Overlapping many waits at once on one thread — what the event loop gives you for free. Not the same as parallelism.",
    chapter: "strengths",
    principle: 2,
    seeAlso: ["Parallelism", "Event loop"],
  },
  {
    term: "Parallelism",
    def: "Doing work at literally the same time on several cores. Node's JS gets it only through `worker_threads`, `cluster` or more processes.",
    chapter: "strengths",
    principle: 2,
    seeAlso: ["Concurrency", "worker_threads", "cluster"],
  },
  {
    term: "I/O-bound",
    def: "Work that mostly **waits** (network, disk, databases). Node's sweet spot: APIs, gateways, BFFs and real-time services.",
    chapter: "strengths",
    principle: 2,
    seeAlso: ["CPU-bound"],
  },

  // ---------------------------------------------------------------- weaknesses
  {
    term: "CPU-bound",
    def: "Work that mostly **computes** (parsing, hashing, image processing). On the main thread it blocks everyone; offload it to `worker_threads` or another service.",
    chapter: "weaknesses",
    principle: 1,
    seeAlso: ["I/O-bound", "Blocking the event loop", "worker_threads"],
  },
  {
    term: "Blocking the event loop",
    def: "Any long synchronous work (a `*Sync` call, a huge `JSON.parse`, a tight loop) holds the one thread: no I/O callbacks, no timers, no new connections run until it finishes.",
    chapter: "weaknesses",
    principle: 1,
    seeAlso: ["Event-loop lag", "ReDoS", "Tail latency"],
  },
  {
    term: "ReDoS",
    aka: ["regular-expression denial of service", "catastrophic backtracking"],
    def: "A regex that backtracks exponentially on hostile input blocks the loop just like sync CPU work — a denial of service for the whole process. Bound input sizes and avoid vulnerable patterns.",
    chapter: "weaknesses",
    principle: 1,
    seeAlso: ["Blocking the event loop"],
  },
  {
    term: "Tail latency",
    aka: ["p99"],
    def: "The slowest slice of requests (p99 and above). In Node one blocking request raises p99 for **everyone**, because every other request waits behind it on the same thread.",
    chapter: "weaknesses",
    principle: 1,
    seeAlso: ["Event-loop lag", "Blocking the event loop"],
  },

  // ---------------------------------------------------------------- competitors
  {
    term: "Deno",
    def: "A JavaScript runtime also built on V8, with ESM-first, web-style modules and first-class TypeScript. Runs much existing Node code.",
    chapter: "competitors",
    seeAlso: ["Bun", "V8"],
  },
  {
    term: "Bun",
    def: "A runtime that bets on speed and all-in-one tooling (runtime, bundler, test runner, package manager), built on JavaScriptCore and written in Zig.",
    chapter: "competitors",
    seeAlso: ["Deno", "JavaScriptCore"],
  },
  {
    term: "JavaScriptCore",
    def: "Apple's JavaScript engine (Safari's). Bun uses it instead of V8.",
    chapter: "competitors",
    seeAlso: ["Bun", "V8"],
  },

  // ---------------------------------------------------------------- architecture
  {
    term: "process.versions",
    def: "An object listing the native pieces this Node was built from — `v8`, `uv` (libuv), `openssl`, `zlib`, `llhttp`, `ares` and more. The architecture diagram, printed by version.",
    chapter: "architecture",
    seeAlso: ["V8", "libuv", "llhttp"],
  },
  {
    term: "OS event notifier",
    aka: ["epoll", "kqueue", "IOCP"],
    def: "The kernel facility libuv uses to watch many sockets at once (epoll on Linux, kqueue on macOS, IOCP on Windows). The kernel signals readiness, so a socket in flight holds **no** thread.",
    chapter: "architecture",
    principle: 3,
    seeAlso: ["libuv", "Thread pool", "C10k"],
  },

  // ---------------------------------------------------------------- event-loop
  {
    term: "Event loop",
    def: "libuv's single-threaded loop that walks six phases in a fixed order (timers → pending → idle/prepare → poll → check → close), running the callbacks that are due. It lives in libuv, not V8.",
    chapter: "event-loop",
    principle: 1,
    seeAlso: ["Phase", "Microtask", "Tick"],
  },
  {
    term: "Tick",
    def: "One full trip of the event loop through its six phases.",
    chapter: "event-loop",
    seeAlso: ["Event loop", "Phase"],
  },
  {
    term: "Phase",
    def: "One stop on the loop's circuit, each with its own callback queue: timers, pending callbacks, idle/prepare (internal), poll, check, close callbacks.",
    chapter: "event-loop",
    seeAlso: ["Timers phase", "Poll phase", "Check phase"],
  },
  {
    term: "Timers phase",
    def: "The first phase: runs callbacks of expired `setTimeout` / `setInterval`. A timeout is a **minimum** delay, never a guarantee.",
    chapter: "event-loop",
    seeAlso: ["Phase", "setImmediate"],
  },
  {
    term: "Pending callbacks",
    def: "The phase that runs a few system callbacks deferred from the previous loop iteration, such as some TCP errors (`ECONNREFUSED`).",
    chapter: "event-loop",
    seeAlso: ["Phase"],
  },
  {
    term: "Poll phase",
    def: "Retrieves new I/O events and runs almost all I/O callbacks — most of your code (HTTP handlers, DB results) runs here. With nothing else due, the loop blocks here waiting for I/O.",
    chapter: "event-loop",
    seeAlso: ["Phase", "Check phase"],
  },
  {
    term: "Check phase",
    def: "Runs `setImmediate` callbacks, right after poll.",
    chapter: "event-loop",
    seeAlso: ["setImmediate", "Poll phase"],
  },
  {
    term: "Close callbacks",
    def: "The last phase: runs `'close'` events such as `socket.on('close', …)`.",
    chapter: "event-loop",
    seeAlso: ["Phase"],
  },
  {
    term: "setImmediate",
    def: "Schedules a callback for the **check** phase. Versus `setTimeout(0)` the order is a race in the main module, but inside an I/O callback `setImmediate` always runs first.",
    chapter: "event-loop",
    principle: 4,
    seeAlso: ["Check phase", "Timers phase"],
  },
  {
    term: "process.nextTick",
    aka: ["nextTick"],
    def: "Queues a callback on the nextTick queue, drained **before** the Promise queue at every checkpoint (in CommonJS). Sooner than a Promise and far sooner than a timer — recursive use starves I/O.",
    chapter: "event-loop",
    principle: 4,
    seeAlso: ["Microtask", "Starvation", "queueMicrotask"],
  },
  {
    term: "Microtask",
    def: "A callback from the nextTick queue or the Promise queue (`.then`, `await`, `queueMicrotask`). Both queues drain after every callback and between phases — microtasks are checkpoints, not a phase.",
    chapter: "event-loop",
    principle: 4,
    seeAlso: ["process.nextTick", "Macrotask", "Promise"],
  },
  {
    term: "Macrotask",
    aka: ["task"],
    def: "A callback that runs in a loop phase: timers, I/O callbacks, `setImmediate`, close events. All pending microtasks run before the next one.",
    chapter: "event-loop",
    principle: 4,
    seeAlso: ["Microtask", "Phase"],
  },
  {
    term: "queueMicrotask",
    def: "Queues a callback on the Promise (microtask) queue without creating a Promise — usually the right way to say \"soon\" instead of misusing `nextTick`.",
    chapter: "event-loop",
    principle: 4,
    seeAlso: ["Microtask", "process.nextTick"],
  },

  // ---------------------------------------------------------------- async-model
  {
    term: "Callback",
    def: "A function you hand to an API to be called when the work completes. The original async style in Node; promises and async/await are built on the same loop.",
    chapter: "async-model",
    seeAlso: ["Error-first callback", "Promise"],
  },
  {
    term: "Promise",
    def: "An object for a value that arrives later; its reactions (`.then`, `await` continuations) run as microtasks.",
    chapter: "async-model",
    principle: 4,
    seeAlso: ["async/await", "Microtask"],
  },
  {
    term: "async/await",
    def: "Syntax over promises: `await` suspends the function and its continuation resumes as a microtask. It frees the thread only while it waits — sync code after it still blocks.",
    chapter: "async-model",
    principle: 4,
    seeAlso: ["Promise", "Promise.all"],
  },
  {
    term: "Promise.all",
    def: "Runs independent async calls concurrently (total ≈ the slowest one) and rejects on the first rejection. Awaiting the same calls in series costs the sum.",
    chapter: "async-model",
    seeAlso: ["Promise.allSettled", "async/await"],
  },
  {
    term: "Promise.allSettled",
    def: "Like `Promise.all`, but waits for every call and reports each outcome — use it when one failure shouldn't cancel the rest.",
    chapter: "async-model",
    seeAlso: ["Promise.all"],
  },
  {
    term: "Starvation",
    def: "The loop can't advance to its next phase because microtasks keep arriving — a recursive `nextTick` or an endless Promise chain blocks I/O entirely.",
    chapter: "async-model",
    principle: 4,
    seeAlso: ["process.nextTick", "Microtask"],
  },

  // ---------------------------------------------------------------- v8-gc
  {
    term: "JIT",
    aka: ["just-in-time compilation"],
    def: "Compiling code while it runs: V8 starts in an interpreter and tiers hot functions up to optimizing compilers using the types and shapes it has observed.",
    chapter: "v8-gc",
    seeAlso: ["Ignition", "TurboFan", "Deoptimization"],
  },
  {
    term: "Ignition",
    def: "V8's bytecode interpreter — runs everything first.",
    chapter: "v8-gc",
    seeAlso: ["Sparkplug", "JIT"],
  },
  {
    term: "Sparkplug",
    def: "V8's baseline JIT: compiles bytecode to machine code near-instantly, without optimization.",
    chapter: "v8-gc",
    seeAlso: ["Ignition", "Maglev"],
  },
  {
    term: "Maglev",
    def: "V8's mid-tier optimizing JIT — fast to compile, good code. On by default since Node 22.",
    chapter: "v8-gc",
    seeAlso: ["Sparkplug", "TurboFan"],
  },
  {
    term: "TurboFan",
    def: "V8's top-tier optimizing compiler for the hottest code; speculates on observed types and shapes.",
    chapter: "v8-gc",
    seeAlso: ["Maglev", "Deoptimization"],
  },
  {
    term: "Deoptimization",
    aka: ["deopt"],
    def: "When a runtime value breaks an optimizer's assumption, V8 discards the optimized code and falls back to a lower tier. Repeated deopt churn is slower than never optimizing.",
    chapter: "v8-gc",
    seeAlso: ["TurboFan", "Hidden class"],
  },
  {
    term: "Hidden class",
    aka: ["shape", "map"],
    def: "V8's internal layout for an object: objects created the same way (same properties, same order) share one, so property access compiles to a fixed offset. Late or reordered properties create new shapes.",
    chapter: "v8-gc",
    seeAlso: ["Inline cache", "Deoptimization"],
  },
  {
    term: "Inline cache",
    def: "A per-access-site memo of the shapes seen there. Monomorphic (one shape) is fast; many shapes degrade it.",
    chapter: "v8-gc",
    seeAlso: ["Hidden class"],
  },
  {
    term: "Generational hypothesis",
    def: "The observation V8's heap is built on: **most objects die young**. Hence a small, often-collected young generation and a larger, rarely-collected old one.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Young generation", "Old generation"],
  },
  {
    term: "Young generation",
    aka: ["nursery", "new space"],
    def: "The small region where objects are born: two equal semi-spaces, collected very often and cheaply by the Scavenger.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Scavenge", "Promotion"],
  },
  {
    term: "Old generation",
    aka: ["old space"],
    def: "The larger region for objects that survived long enough; collected rarely by Mark-Sweep-Compact. An old space that only grows is the leak symptom.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Mark-Sweep-Compact", "Memory leak"],
  },
  {
    term: "Scavenge",
    aka: ["minor GC", "Scavenger"],
    def: "The minor GC: copies the few live objects out of the full semi-space and flips; dead objects cost nothing. Runs far more often than major GC.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Young generation", "Promotion"],
  },
  {
    term: "Promotion",
    def: "Moving an object that has survived scavenges from the young generation into old space.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Scavenge", "Old generation"],
  },
  {
    term: "Mark-Sweep-Compact",
    aka: ["major GC"],
    def: "The major GC for old space: mark everything reachable, sweep the rest, compact to fight fragmentation. Slower, so it runs rarely.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Old generation", "Stop-the-world"],
  },
  {
    term: "Orinoco",
    def: "The codename of V8's garbage collector, engineered to keep the main thread running by being parallel, incremental and concurrent.",
    chapter: "v8-gc",
    seeAlso: ["Stop-the-world"],
  },
  {
    term: "Stop-the-world",
    def: "A GC pause during which your JS doesn't run. GC shares the main thread, so long or frequent pauses show up as event-loop stalls and p99 spikes.",
    chapter: "v8-gc",
    principle: 1,
    seeAlso: ["Orinoco", "Tail latency"],
  },
  {
    term: "--max-old-space-size",
    def: "Caps old space in MB (modern Node derives the default from available and container memory). Raising it to \"fix\" a leak only delays the crash and lengthens major GCs.",
    chapter: "v8-gc",
    seeAlso: ["Old generation", "Memory leak"],
  },
  {
    term: "Heap snapshot",
    def: "A dump of every object on the heap with its retainers. Diff snapshots over time and sort by retained size to find what keeps a leak alive.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Memory leak"],
  },
  {
    term: "Memory leak",
    def: "Memory you keep **reachable** without meaning to (a cache that only grows, per-request listeners never removed, closures held by timers). GC can't free reachable objects; a rising retained floor is the symptom.",
    chapter: "v8-gc",
    principle: 5,
    seeAlso: ["Heap snapshot", "Old generation"],
  },

  // ---------------------------------------------------------------- concurrency
  {
    term: "Thread pool",
    aka: ["libuv thread pool", "worker pool"],
    def: "libuv's pool (4 threads by default) that runs operations with no async OS primitive: async `fs`, `crypto` (`pbkdf2`, `scrypt`), `zlib` and `dns.lookup`. Sockets never use it. Extra tasks queue invisibly.",
    chapter: "concurrency",
    principle: 3,
    seeAlso: ["UV_THREADPOOL_SIZE", "OS event notifier", "dns.lookup vs dns.resolve"],
  },
  {
    term: "UV_THREADPOOL_SIZE",
    def: "Environment variable that sizes the libuv pool (default 4, up to 1024). Helps pool-bound work only — sockets never touch the pool.",
    chapter: "concurrency",
    principle: 3,
    seeAlso: ["Thread pool"],
  },
  {
    term: "worker_threads",
    def: "Real parallel JS threads, each with its own V8 isolate and event loop. For CPU-bound JS; communicate by `postMessage` or a `SharedArrayBuffer`. Reuse a small pool rather than spawning per task.",
    chapter: "concurrency",
    principle: 2,
    seeAlso: ["postMessage", "SharedArrayBuffer", "cluster"],
  },
  {
    term: "postMessage",
    def: "How workers talk: a message is a structured-clone **copy**, not shared memory.",
    chapter: "concurrency",
    seeAlso: ["worker_threads", "SharedArrayBuffer"],
  },
  {
    term: "SharedArrayBuffer",
    def: "Memory genuinely shared between threads, coordinated with `Atomics`. The only way workers share state.",
    chapter: "concurrency",
    seeAlso: ["worker_threads", "postMessage"],
  },
  {
    term: "cluster",
    def: "Runs N Node processes that share one listening port — the built-in way to use every core for one HTTP server. No shared memory.",
    chapter: "concurrency",
    principle: 2,
    seeAlso: ["worker_threads", "child_process", "Stateless process"],
  },
  {
    term: "child_process",
    def: "Spawns a separate OS process (any program, not just Node) — for shelling out or full isolation.",
    chapter: "concurrency",
    seeAlso: ["cluster", "worker_threads"],
  },
  {
    term: "dns.lookup vs dns.resolve",
    aka: ["dns.lookup", "dns.resolve"],
    def: "`dns.lookup` calls the OS resolver (`getaddrinfo`) **on the thread pool**, so slow DNS can delay your `fs` calls; `dns.resolve*` uses c-ares over the network and stays off the pool.",
    chapter: "concurrency",
    principle: 3,
    seeAlso: ["Thread pool"],
  },

  // ---------------------------------------------------------------- streams
  {
    term: "Buffer",
    def: "A fixed-size chunk of raw bytes. Reading a whole file into one Buffer costs memory proportional to the file.",
    chapter: "streams",
    principle: 5,
    seeAlso: ["Stream"],
  },
  {
    term: "Stream",
    def: "Data processed chunk by chunk instead of all at once, so peak memory stays near one `highWaterMark` regardless of size. HTTP requests, responses, sockets, `fs` and `zlib` are all streams.",
    chapter: "streams",
    principle: 5,
    seeAlso: ["Readable", "Writable", "Backpressure"],
  },
  {
    term: "Readable",
    def: "A stream you read from — a source such as `fs.createReadStream` or an HTTP `req`. It is also an async iterable.",
    chapter: "streams",
    seeAlso: ["Writable", "Readable.from"],
  },
  {
    term: "Writable",
    def: "A stream you write to — a sink such as `fs.createWriteStream` or an HTTP `res`. `write()` returns `false` when its buffer is full.",
    chapter: "streams",
    seeAlso: ["Readable", "Backpressure"],
  },
  {
    term: "Duplex",
    def: "A stream with independent readable and writable sides — a TCP socket.",
    chapter: "streams",
    seeAlso: ["Transform"],
  },
  {
    term: "Transform",
    def: "A Duplex whose output is a function of its input — gzip, hashing, parsing.",
    chapter: "streams",
    seeAlso: ["Duplex", "pipeline()"],
  },
  {
    term: "Backpressure",
    def: "The contract that slows a fast producer down to a slow consumer: stop when `write()` returns `false`, resume on `'drain'`. Ignore it and the buffer grows without limit.",
    chapter: "streams",
    principle: 5,
    seeAlso: ["highWaterMark", "'drain'", "pipeline()"],
  },
  {
    term: "highWaterMark",
    def: "A stream's **soft** buffer limit: 64 KiB for byte streams, 16 objects in objectMode. `write()` turns `false` at or past it — advisory, not a wall.",
    chapter: "streams",
    principle: 5,
    seeAlso: ["Backpressure", "objectMode"],
  },
  {
    term: "'drain'",
    aka: ["drain event"],
    def: "The event a Writable emits once its buffer has emptied below `highWaterMark` — the signal to resume writing.",
    chapter: "streams",
    principle: 5,
    seeAlso: ["Backpressure", "highWaterMark"],
  },
  {
    term: "pipeline()",
    aka: ["stream.pipeline"],
    def: "Connects streams with backpressure **and** error propagation plus cleanup of every stage (`stream/promises` gives an awaitable version). Prefer it over bare `.pipe()`.",
    chapter: "streams",
    principle: 5,
    seeAlso: ["Backpressure", "Transform"],
  },
  {
    term: "objectMode",
    def: "A stream mode where each chunk is any JS value and `highWaterMark` counts objects (default 16), not bytes.",
    chapter: "streams",
    seeAlso: ["highWaterMark"],
  },
  {
    term: "Readable.from",
    def: "Turns any (async) iterable or generator into a Readable — a million rows without ever holding them all in RAM.",
    chapter: "streams",
    seeAlso: ["Readable", "pipeline()"],
  },

  // ---------------------------------------------------------------- modules
  {
    term: "CommonJS",
    aka: ["CJS"],
    def: "Node's original module system (`require` / `module.exports`): `require` is a synchronous, depth-first function call that runs the module and caches its exports.",
    chapter: "modules",
    principle: 1,
    seeAlso: ["ESM", "require.cache"],
  },
  {
    term: "ESM",
    aka: ["ES modules", "ECMAScript modules"],
    def: "The JavaScript-standard module system (`import` / `export`): an asynchronous, statically analyzed graph loaded in three phases, with live read-only bindings.",
    chapter: "modules",
    principle: 4,
    seeAlso: ["CommonJS", "Parse → link → evaluate", "Live binding"],
  },
  {
    term: "require.cache",
    def: "Where CommonJS stores each module's `module.exports`, keyed by resolved path; every later `require` of that path returns the cached value without re-running.",
    chapter: "modules",
    seeAlso: ["CommonJS"],
  },
  {
    term: "Live binding",
    def: "An ESM import is a live, read-only view of the exporter's variable, so it sees later mutations; a destructured `require` is a frozen snapshot copy.",
    chapter: "modules",
    seeAlso: ["ESM", "CommonJS"],
  },
  {
    term: "Parse → link → evaluate",
    aka: ["ESM phases"],
    def: "ESM's three phases: parse/construct the whole graph, link every import to its export's binding (no code runs yet), then evaluate module bodies in post-order, once each.",
    chapter: "modules",
    seeAlso: ["ESM", "Live binding", "Circular dependency"],
  },
  {
    term: "require(esm)",
    def: "Loading an ES module with `require()` — unflagged since Node 22.12. It throws `ERR_REQUIRE_ASYNC_MODULE` if the target (or a dependency) uses top-level await.",
    chapter: "modules",
    seeAlso: ["Top-level await", "ESM"],
  },
  {
    term: "Top-level await",
    def: "`await` at a module's top level — allowed in ESM only. It makes the module asynchronous, which is exactly why `require()` can't load it.",
    chapter: "modules",
    seeAlso: ["require(esm)", "ESM"],
  },
  {
    term: "TDZ",
    aka: ["temporal dead zone"],
    def: "The window before a `let` / `const` is initialized, when reading it throws. In an ESM cycle the imported name exists, but reading it before its module ran throws.",
    chapter: "modules",
    seeAlso: ["Circular dependency"],
  },
  {
    term: "Dual-package hazard",
    def: "Shipping both CJS and ESM builds can load one package twice as two instances with split state — failing `instanceof`, duplicated singletons.",
    chapter: "modules",
    seeAlso: ["CommonJS", "ESM"],
  },
  {
    term: "Circular dependency",
    def: "Modules that import each other. CommonJS hands back a **partial** exports object (you can read `undefined`); ESM links bindings first, so hoisted declarations resolve.",
    chapter: "modules",
    seeAlso: ["TDZ", "Parse → link → evaluate"],
  },
  {
    term: "node: prefix",
    def: "Import core modules as `node:fs`, `node:http` — explicit, and a rogue npm package named `fs` can't shadow them.",
    chapter: "modules",
  },
  {
    term: "cjs-module-lexer",
    def: "The static analyzer Node uses to expose a CommonJS module's **named** exports to `import`, best-effort — exports built dynamically can be missed.",
    chapter: "modules",
    seeAlso: ["CommonJS", "ESM"],
  },
  {
    term: "import.meta",
    def: "Per-module metadata in ESM: `import.meta.url`, and on recent Node `import.meta.dirname` / `filename` instead of CommonJS's `__dirname`.",
    chapter: "modules",
    seeAlso: ["ESM"],
  },

  // ---------------------------------------------------------------- errors
  {
    term: "Operational error",
    def: "An expected failure of a correct program — a timeout, a refused connection, bad user input. Handle it and continue.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["Programmer error", "Fail fast"],
  },
  {
    term: "Programmer error",
    def: "A bug — `undefined is not a function`, a broken invariant. You can't handle a bug in-process: fail fast and restart clean.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["Operational error", "Fail fast"],
  },
  {
    term: "Error-first callback",
    aka: ["err-first callback"],
    def: "The Node callback convention `(err, result)`: the error arrives as the first argument, never as a throw. Ignore `err` and the error is silently swallowed.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["Callback"],
  },
  {
    term: "'error' event",
    def: "How an EventEmitter (streams, sockets, servers) reports failure. An `'error'` with no listener is thrown — and crashes the process.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["uncaughtException"],
  },
  {
    term: "uncaughtException",
    def: "The process event for a throw nobody caught (e.g. inside a timer). A last-resort backstop: log, then exit — the process state is no longer trustworthy.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["unhandledRejection", "Fail fast"],
  },
  {
    term: "unhandledRejection",
    def: "The process event for a rejected Promise nobody handled. Since Node 15 an unhandled rejection terminates the process by default.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["uncaughtException", "Fail fast"],
  },
  {
    term: "Fail fast",
    def: "On a programmer error, log and crash instead of limping on with corrupted state; a supervisor restarts a clean process.",
    chapter: "errors",
    principle: 6,
    seeAlso: ["Programmer error", "uncaughtException"],
  },
  {
    term: "AsyncLocalStorage",
    def: "Keeps a value (a request id, a user) alive through the whole async call chain of one request, isolated from every other in-flight request. The sanctioned replacement for domains.",
    chapter: "errors",
    seeAlso: ["Domains"],
  },
  {
    term: "Error cause",
    aka: ["Error.cause"],
    def: "`new Error(msg, { cause })` wraps a low-level error with context while keeping the original attached.",
    chapter: "errors",
    principle: 6,
  },
  {
    term: "Domains",
    aka: ["domain module"],
    def: "An old API for grouping async error handling — **deprecated**. Never build new code on it; use AsyncLocalStorage for context.",
    chapter: "errors",
    seeAlso: ["AsyncLocalStorage"],
  },

  // ---------------------------------------------------------------- http
  {
    term: "llhttp",
    def: "The C library that parses HTTP/1.x bytes into `req` incrementally. Rejecting malformed input early makes it a first line of defense.",
    chapter: "http",
    seeAlso: ["Keep-alive", "headersTimeout"],
  },
  {
    term: "Keep-alive",
    def: "Reusing one TCP (and TLS) connection for many requests instead of a new handshake each time. On by default on the server, and on the client's global Agent since Node 19.",
    chapter: "http",
    principle: 2,
    seeAlso: ["http.Agent", "keepAliveTimeout", "Keep-alive 502 race"],
  },
  {
    term: "http.Agent",
    def: "The client-side connection pool: per-origin sockets reused across requests, tuned by `maxSockets`, `maxFreeSockets` and `scheduling`.",
    chapter: "http",
    seeAlso: ["Keep-alive", "maxSockets"],
  },
  {
    term: "maxSockets",
    def: "An Agent's cap on concurrent sockets per origin (host:port) — `Infinity` by default; size it to your real concurrency.",
    chapter: "http",
    seeAlso: ["http.Agent"],
  },
  {
    term: "keepAliveTimeout",
    def: "How long the server keeps an idle keep-alive socket open between requests (default 5 s).",
    chapter: "http",
    seeAlso: ["Keep-alive 502 race", "headersTimeout", "requestTimeout"],
  },
  {
    term: "headersTimeout",
    def: "The time allowed to receive the **complete** request headers (default 60 s) — the defense against Slowloris, which dribbles headers to hold sockets open.",
    chapter: "http",
    seeAlso: ["requestTimeout", "keepAliveTimeout"],
  },
  {
    term: "requestTimeout",
    def: "The time allowed to receive the **whole** request (default 300 s, on by default since Node 18).",
    chapter: "http",
    seeAlso: ["headersTimeout", "keepAliveTimeout"],
  },
  {
    term: "Keep-alive 502 race",
    def: "A load balancer keeps an upstream socket idle longer than Node's `keepAliveTimeout`; Node closes it just as the LB sends a request down it → 502. Keep the server's timeout above the LB's idle timeout.",
    chapter: "http",
    principle: 7,
    seeAlso: ["keepAliveTimeout", "Keep-alive"],
  },
  {
    term: "Head-of-line blocking",
    aka: ["HOL blocking"],
    def: "Over HTTP/1.1 a connection carries one request/response at a time, so the next waits for the current one. HTTP/2 removes it at the application layer, but TCP-level HOL remains.",
    chapter: "http",
    seeAlso: ["HTTP/2 multiplexing", "QUIC"],
  },
  {
    term: "HTTP/2 multiplexing",
    aka: ["nghttp2"],
    def: "Many independent streams on one connection (Node's `node:http2`, via the bundled nghttp2). One lost TCP packet still stalls them all.",
    chapter: "http",
    seeAlso: ["Head-of-line blocking", "QUIC"],
  },
  {
    term: "QUIC",
    aka: ["HTTP/3"],
    def: "The UDP-based transport under HTTP/3, with truly independent streams. Still experimental in Node core (`node:quic`), so most teams terminate HTTP/3 at the edge.",
    chapter: "http",
    seeAlso: ["HTTP/2 multiplexing"],
  },

  // ---------------------------------------------------------------- performance
  {
    term: "Event-loop lag",
    aka: ["event-loop delay"],
    def: "How late the loop runs work that was already due — the service's pulse and the leading indicator of tail-latency blow-ups.",
    chapter: "performance",
    principle: 7,
    seeAlso: ["monitorEventLoopDelay", "ELU", "Tail latency"],
  },
  {
    term: "monitorEventLoopDelay",
    def: "`perf_hooks.monitorEventLoopDelay()`: a nanosecond histogram (`.mean`, `.max`, `.percentile(99)`) of event-loop lag. It tells you the loop is blocked, not which function did it.",
    chapter: "performance",
    principle: 7,
    seeAlso: ["Event-loop lag", "Flame graph"],
  },
  {
    term: "ELU",
    aka: ["event-loop utilization"],
    def: "`performance.eventLoopUtilization()`: the busy fraction of the loop, 0 to 1. Near 1 means saturated — work is queueing on the loop.",
    chapter: "performance",
    principle: 7,
    seeAlso: ["Event-loop lag"],
  },
  {
    term: "Flame graph",
    aka: ["flamegraph"],
    def: "A CPU profile drawn as stacked frames, each box as wide as its share of samples — the widest tower is where the CPU goes.",
    chapter: "performance",
    seeAlso: ["--cpu-prof", "0x"],
  },
  {
    term: "--cpu-prof",
    def: "`node --cpu-prof app.js` writes a `.cpuprofile` from V8's sampling profiler; open it in Chrome DevTools. The first stop for a CPU spike.",
    chapter: "performance",
    seeAlso: ["Flame graph", "--prof"],
  },
  {
    term: "--prof",
    def: "`node --prof` plus `node --prof-process` prints a V8 tick summary by function — a quick, dependency-free profile.",
    chapter: "performance",
    seeAlso: ["--cpu-prof"],
  },
  {
    term: "Clinic.js",
    def: "A diagnosis suite: Doctor triages, Flame finds synchronous bottlenecks, Bubbleprof maps async delays — for when you don't yet know if it's CPU, I/O or the loop.",
    chapter: "performance",
    seeAlso: ["0x", "Flame graph"],
  },
  {
    term: "0x",
    def: "A one-command flamegraph generator for a Node process.",
    chapter: "performance",
    seeAlso: ["Flame graph", "Clinic.js"],
  },
  {
    term: "autocannon",
    def: "An HTTP load generator for measuring throughput and latency — reproduce production load before you profile.",
    chapter: "performance",
    principle: 7,
    seeAlso: ["Clinic.js"],
  },

  // ---------------------------------------------------------------- security
  {
    term: "Supply-chain attack",
    def: "Malicious code delivered through a dependency. Node trusts every line it runs, so your whole transitive tree is the attack surface; defend in layers.",
    chapter: "security",
    seeAlso: ["Lifecycle script", "Provenance", "Release cooldown"],
  },
  {
    term: "Lifecycle script",
    aka: ["postinstall", "install script"],
    def: "A package script npm runs on install (`preinstall`, `postinstall`) — the number-one worm execution vector.",
    chapter: "security",
    seeAlso: ["--ignore-scripts", "Supply-chain attack"],
  },
  {
    term: "--ignore-scripts",
    def: "`npm ci --ignore-scripts` installs without running any lifecycle scripts, cutting off the worm's execution vector.",
    chapter: "security",
    seeAlso: ["Lifecycle script", "Lockfile"],
  },
  {
    term: "Typosquatting",
    def: "Publishing a malicious package under a name one typo away from a popular one. Provenance helps against it.",
    chapter: "security",
    seeAlso: ["Provenance"],
  },
  {
    term: "Lockfile",
    def: "Pins exact versions plus integrity hashes; install with `npm ci` (never `npm install`) in CI so you get exactly what you reviewed.",
    chapter: "security",
    seeAlso: ["--ignore-scripts", "npm audit"],
  },
  {
    term: "npm audit",
    def: "Checks your dependency tree against known CVEs — a gate for **known** vulnerabilities, blind to brand-new malware.",
    chapter: "security",
    seeAlso: ["Lockfile", "Release cooldown"],
  },
  {
    term: "Provenance",
    def: "A signed attestation of **who** built a package and from which commit (Sigstore + CI OIDC). It proves origin, not intent — attested malware exists.",
    chapter: "security",
    seeAlso: ["Trusted Publishing", "Typosquatting"],
  },
  {
    term: "Trusted Publishing",
    def: "Publishing to npm from a CI pipeline whose identity is proven via OIDC (Sigstore), so the package carries provenance.",
    chapter: "security",
    seeAlso: ["Provenance"],
  },
  {
    term: "Release cooldown",
    aka: ["minimumReleaseAge"],
    def: "Refuse versions younger than N days (pnpm `minimumReleaseAge`, default 1 day in pnpm 11) — most malicious versions are caught and unpublished within hours.",
    chapter: "security",
    seeAlso: ["Supply-chain attack", "npm audit"],
  },
  {
    term: "Permission Model",
    def: "Runtime least privilege via `--permission` (stable since Node 23.5): denies fs, child processes, workers, addons and WASI unless granted by `--allow-*`. A seat belt, not a sandbox.",
    chapter: "security",
    seeAlso: ["Supply-chain attack"],
  },

  // ---------------------------------------------------------------- production
  {
    term: "SIGTERM",
    def: "The polite \"please stop\" signal orchestrators send on deploys and scale-down. Catch it and shut down gracefully.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Graceful shutdown", "SIGKILL", "Grace period"],
  },
  {
    term: "SIGKILL",
    def: "The uncatchable kill (exit 137) sent when the grace period runs out — and straight away on an OOM kill. In-flight requests die with the process.",
    chapter: "production",
    principle: 7,
    seeAlso: ["SIGTERM", "Grace period"],
  },
  {
    term: "Graceful shutdown",
    def: "On SIGTERM: fail readiness → stop intake (`server.close()`) → drain in-flight requests → close pools → exit 0, with a force-exit timer as the backstop.",
    chapter: "production",
    principle: 7,
    seeAlso: ["SIGTERM", "Readiness probe", "closeIdleConnections()", "Force-exit timer"],
  },
  {
    term: "Grace period",
    aka: ["terminationGracePeriodSeconds"],
    def: "How long the orchestrator waits between SIGTERM and SIGKILL (`terminationGracePeriodSeconds` in Kubernetes). Size it above your worst-case drain time.",
    chapter: "production",
    principle: 7,
    seeAlso: ["SIGTERM", "SIGKILL"],
  },
  {
    term: "Readiness probe",
    def: "\"Should I get traffic?\" Flip it to 503 first on shutdown so the load balancer stops routing to you. Separate from liveness.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Liveness probe", "Graceful shutdown"],
  },
  {
    term: "Liveness probe",
    def: "\"Am I alive?\" — restart the process if not. Conflating it with readiness breaks deploys.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Readiness probe"],
  },
  {
    term: "preStop hook",
    def: "A small sleep (≈5 s) before shutdown so Kubernetes' asynchronous endpoint removal settles before you stop accepting.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Readiness probe", "Graceful shutdown"],
  },
  {
    term: "closeIdleConnections()",
    def: "`server.closeIdleConnections()` (Node ≥ 18.2) drops idle keep-alive sockets, which otherwise hold `server.close()`'s drain open until SIGKILL.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Graceful shutdown", "Keep-alive"],
  },
  {
    term: "Force-exit timer",
    def: "`setTimeout(() => process.exit(1), …).unref()` armed on SIGTERM so one hung request can't hold shutdown until SIGKILL.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Graceful shutdown"],
  },
  {
    term: "Stateless process",
    def: "A process that keeps no request state between requests (it lives in a DB or Redis), so any replica can serve anything and killing one loses nothing.",
    chapter: "production",
    principle: 7,
    seeAlso: ["cluster"],
  },
  {
    term: "RED metrics",
    def: "Rate, Errors, Duration per route — the request-level dashboard; pair it with event-loop lag as the saturation signal.",
    chapter: "production",
    principle: 7,
    seeAlso: ["Event-loop lag"],
  },
  {
    term: "Cold start",
    def: "On serverless, the first request pays Node boot plus your init. Do expensive setup in module scope, outside the handler, where warm invocations reuse it.",
    chapter: "production",
  },

  // ---------------------------------------------------------------- express
  {
    term: "Middleware",
    def: "A function `(req, res, next)` in Express's ordered stack. Each one responds, calls `next()`, or passes an error — registration order **is** the control flow.",
    chapter: "express",
    seeAlso: ["next()", "Error-handling middleware"],
  },
  {
    term: "next()",
    def: "Hands the request to the next matching layer. `next(err)` switches to error mode, where only 4-argument middleware runs.",
    chapter: "express",
    principle: 6,
    seeAlso: ["Middleware", "next('route')", "Error-handling middleware"],
  },
  {
    term: "next('route')",
    def: "Skips the rest of the **current route's** handler sub-stack and resumes the outer stack, so a later route on the same path can answer.",
    chapter: "express",
    seeAlso: ["next()"],
  },
  {
    term: "Error-handling middleware",
    aka: ["4-arity middleware", "error middleware"],
    def: "Middleware with **four** parameters `(err, req, res, next)` — Express selects the error lane by arity. Register it last. Express 5 also forwards rejected async handlers here.",
    chapter: "express",
    principle: 6,
    seeAlso: ["next()", "finalhandler"],
  },
  {
    term: "Router",
    def: "A mountable mini-app with its own middleware stack; `app.use('/api', router)` composes it under a prefix.",
    chapter: "express",
    seeAlso: ["Mount path", "Middleware"],
  },
  {
    term: "Mount path",
    aka: ["baseUrl"],
    def: "Inside a mounted router the prefix is stripped: for `GET /api/v2/users/42` the router sees `req.url` `/users/42` and `req.baseUrl` `/api/v2`.",
    chapter: "express",
    seeAlso: ["Router"],
  },
  {
    term: "finalhandler",
    def: "Express's default end of the stack: a request no layer answered gets `404 Cannot GET …` (a miss is not an error); an unhandled error gets its `err.status` or 500.",
    chapter: "express",
    seeAlso: ["Error-handling middleware"],
  },
  {
    term: "path-to-regexp",
    def: "The route-pattern library. Express 5 uses v8, which tightened syntax: wildcards must be named (`/*splat`), optional segments use braces (`/users{/:id}`), no inline regexp.",
    chapter: "express",
    seeAlso: ["Router"],
  },
  {
    term: "Fastify",
    def: "An alternative Node framework built around encapsulated plugins and schema-first validation and serialization. Measure on your workload before switching.",
    chapter: "express",
    seeAlso: ["Middleware"],
  },

  // ---------------------------------------------------------------- modern-node
  {
    term: "Current",
    aka: ["Current release"],
    def: "A release line's first ~6 months: newest features, not yet for production.",
    chapter: "modern-node",
    principle: 7,
    seeAlso: ["Active LTS", "EOL"],
  },
  {
    term: "Active LTS",
    def: "The ~12-month phase of an LTS line that gets new features and fixes — the line to build production on.",
    chapter: "modern-node",
    principle: 7,
    seeAlso: ["Maintenance LTS", "Current"],
  },
  {
    term: "Maintenance LTS",
    def: "The ~18-month phase after Active LTS: critical and security fixes only.",
    chapter: "modern-node",
    principle: 7,
    seeAlso: ["Active LTS", "EOL"],
  },
  {
    term: "EOL",
    aka: ["end-of-life"],
    def: "A line that gets no more fixes — a CVE found later stays unpatched there. Never ship on EOL (Node 18 and 20 are EOL).",
    chapter: "modern-node",
    principle: 7,
    seeAlso: ["Maintenance LTS"],
  },
  {
    term: "Type stripping",
    def: "Node runs `.ts` by erasing type annotations (default since 24, stable in 24.12). It never **checks** types — keep `tsc --noEmit` in CI.",
    chapter: "modern-node",
  },
  {
    term: "node:test",
    def: "Node's built-in test runner (stable since 20) — often replaces Jest or Mocha.",
    chapter: "modern-node",
  },
  {
    term: "--watch",
    def: "`node --watch app.js` restarts on file changes (stable since 22) — replaces nodemon.",
    chapter: "modern-node",
  },
  {
    term: "fetch",
    aka: ["global fetch", "undici"],
    def: "The global `fetch()` HTTP client, built on undici (stable since 21) — replaces axios / node-fetch for most needs.",
    chapter: "modern-node",
    seeAlso: ["http.Agent"],
  },
  {
    term: "WebSocket client",
    aka: ["WebSocket"],
    def: "A global browser-compatible `WebSocket` client, stable since Node 22 — replaces the `ws` client.",
    chapter: "modern-node",
  },
  {
    term: "Experimental",
    aka: ["stability index"],
    def: "A stability-index tag meaning the API can change between minor releases and prints an `ExperimentalWarning` (e.g. `node:sqlite`, `fs.glob`, `node:quic`). Isolate it behind an adapter.",
    chapter: "modern-node",
    seeAlso: ["QUIC"],
  },
];

/** Anchor slug: lowercase, non-alphanumerics → "-". Used for id="term-<slug>". */
export function termSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** First letter for the A–Z rail; symbols/digits (`'drain'`, `--watch`, `0x`) go under "#". */
export function termLetter(term: string): string {
  const c = term.replace(/^[^a-z0-9]+/i, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(c) && !/^[^a-z0-9]/i.test(term) ? c : "#";
}

/** Alphabetical (case- and symbol-insensitive) order for the page. */
export function sortKey(term: string): string {
  return term.toLowerCase().replace(/^[^a-z0-9]+/, "");
}
