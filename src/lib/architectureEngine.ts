/* ===========================================================================
   Architecture "trace a call" engine — the hero interactive for Ch.5
   (Top-level architecture). It walks one call DOWN the layer stack and back
   UP, showing WHERE the work actually runs and WHETHER the single JS thread
   is free or blocked.

   The layer stack (top → bottom), matching the static ArchitectureStack figure:
     js       → your JavaScript
     core     → Node core API in JS (fs · http · net · streams · crypto)
     bindings → C++ bindings (node::, N-API) — the JS↔native bridge
     v8 | libuv | deps   → the native row (one cell lights up per step)
     os       → epoll · kqueue · IOCP · threads · filesystem · network

   Three scenarios deliberately end at three different destinations, which is
   the whole mental model of the chapter:
     • fs.readFile   → libuv THREAD POOL  (no async file primitive)
     • https.get     → OS KERNEL          (non-blocking socket, no thread held)
     • JSON.parse    → V8                 (CPU on the one thread — blocks the loop)

   Pure & deterministic. Invariants (pool vs kernel vs v8 routing, loop
   free/blocked, start/end in JS) are asserted in scripts/test-architecture.ts,
   which also checks the native deps named in the diagram (v8, uv, openssl,
   zlib, llhttp, ares) are real keys of process.versions.
   =========================================================================== */

export type LayerId = "js" | "core" | "bindings" | "v8" | "libuv" | "deps" | "os";

/** Where the actual work executes — drives the accent colour of a step. */
export type Lane = "pool" | "kernel" | "v8";

/** Direction of travel through the stack (for the moving token + arrows). */
export type Dir = "down" | "run" | "up";

export interface Step {
  layer: LayerId;
  dir: Dir;
  /** Short headline shown on the step (mono). */
  title: string;
  /** One sentence: what happens at this layer. */
  detail: string;
  /** Is the single JS/event-loop thread free to do other work right now? */
  loop: "free" | "blocked";
  /** Set on the native-row steps so the UI can tint the right destination. */
  lane?: Lane;
}

export interface ArchScenario {
  id: string;
  title: string;
  /** The code expression shown at the top of the sim. */
  call: string;
  blurb: string;
  /** Where this call ultimately runs. */
  destination: Lane;
  steps: Step[];
  takeaway: string;
}

/** The fixed stack, top → bottom. The native row (v8|libuv|deps) renders side
    by side; everything else is a full-width band. */
export const LAYERS: { id: LayerId; label: string; sub: string; row: "band" | "native" }[] = [
  { id: "js", label: "Your JavaScript", sub: "application code — single-threaded", row: "band" },
  { id: "core", label: "Node core API (JS)", sub: "fs · http · net · streams · crypto", row: "band" },
  { id: "bindings", label: "C++ bindings", sub: "node:: · N-API — JS ↔ native bridge", row: "band" },
  { id: "v8", label: "V8", sub: "executes JS · heap & GC", row: "native" },
  { id: "libuv", label: "libuv", sub: "event loop · async I/O · thread pool", row: "native" },
  { id: "deps", label: "OpenSSL · zlib · llhttp · c-ares", sub: "TLS · compress · HTTP · DNS", row: "native" },
  { id: "os", label: "Operating system", sub: "epoll · kqueue · IOCP · threads · fs · net", row: "band" },
];

/** Native deps named in the diagram — asserted present in process.versions. */
export const NATIVE_DEPS = ["v8", "uv", "openssl", "zlib", "llhttp", "ares"] as const;

const fs: ArchScenario = {
  id: "fs",
  title: "fs.readFile()",
  call: "fs.readFile('data.json', cb)",
  blurb: "A file read — no non-blocking OS primitive exists, so it rides the libuv thread pool.",
  destination: "pool",
  takeaway:
    "Reading a file has no non-blocking OS call, so libuv runs it on the thread pool (default 4). Your JS thread is never blocked — it registers a callback and the event loop keeps serving other work until the read completes.",
  steps: [
    { layer: "js", dir: "down", title: "fs.readFile(path, cb)", detail: "You register a callback and the call returns immediately — the JS thread keeps running.", loop: "free" },
    { layer: "core", dir: "down", title: "fs.js → validate args", detail: "The JS core library (fs) checks the arguments and calls into its C++ binding.", loop: "free" },
    { layer: "bindings", dir: "down", title: "binding submits the request", detail: "node's fs binding hands the read request to libuv.", loop: "free" },
    { layer: "libuv", dir: "run", lane: "pool", title: "no async file primitive → pool", detail: "There is no non-blocking OS call for file reads, so libuv schedules read() on one of its 4 thread-pool threads.", loop: "free" },
    { layer: "os", dir: "run", lane: "pool", title: "pool thread blocks on read()", detail: "The pool thread makes a blocking read() syscall and waits for the disk — but the event loop is untouched.", loop: "free" },
    { layer: "libuv", dir: "up", lane: "pool", title: "done → callback queued (poll)", detail: "When the read returns, libuv places your callback on the loop's poll queue.", loop: "free" },
    { layer: "core", dir: "up", title: "loop dequeues on next tick", detail: "On the next poll phase the event loop picks up the completed I/O.", loop: "free" },
    { layer: "js", dir: "up", title: "cb(err, data) runs", detail: "Back in JavaScript — single-threaded again — your callback runs with the file contents.", loop: "free" },
  ],
};

const net: ArchScenario = {
  id: "net",
  title: "https.get()",
  call: "https.get(url, cb)",
  blurb: "A network request — a non-blocking socket the OS watches, holding no thread at all.",
  destination: "kernel",
  takeaway:
    "Network I/O uses the OS kernel's event notifier (epoll/kqueue/IOCP), not the pool — so it holds no thread. One loop thread arms thousands of sockets at once; this is exactly why Node scales to thousands of concurrent connections.",
  steps: [
    { layer: "js", dir: "down", title: "https.get(url, cb)", detail: "You register a response callback; the call returns immediately.", loop: "free" },
    { layer: "core", dir: "down", title: "http/net open a socket", detail: "The net core library asks its binding to create and connect a TCP socket.", loop: "free" },
    { layer: "bindings", dir: "down", title: "binding registers the socket", detail: "node's TCP binding hands the socket to libuv.", loop: "free" },
    { layer: "libuv", dir: "run", lane: "kernel", title: "arm socket on the OS notifier", detail: "libuv registers the socket with epoll/kqueue/IOCP and holds NO pool thread — one loop thread watches them all.", loop: "free" },
    { layer: "os", dir: "run", lane: "kernel", title: "kernel waits, threadless", detail: "The OS will notify the loop when bytes arrive; no thread is parked on the connection.", loop: "free" },
    { layer: "libuv", dir: "up", lane: "kernel", title: "readable → loop wakes (poll)", detail: "On readiness the kernel signals the loop, which wakes in its poll phase.", loop: "free" },
    { layer: "deps", dir: "up", lane: "kernel", title: "llhttp parses the bytes", detail: "The HTTP parser (llhttp, via undici) turns the incoming bytes into a response.", loop: "free" },
    { layer: "js", dir: "up", title: "cb(res) runs", detail: "Back in JS — your response callback fires with the result.", loop: "free" },
  ],
};

const cpu: ArchScenario = {
  id: "cpu",
  title: "JSON.parse()",
  call: "JSON.parse(hugeString)",
  blurb: "Pure CPU work — it runs inside V8 on the one thread and never reaches libuv or the OS.",
  destination: "v8",
  takeaway:
    "CPU-bound JavaScript runs inside V8 on the single thread and blocks the entire event loop until it finishes — no I/O, no timers, no new connections. There is nothing to offload to libuv; move heavy compute to a worker_thread (see Concurrency).",
  steps: [
    { layer: "js", dir: "down", title: "JSON.parse(hugeString)", detail: "A synchronous call — it must produce a value before the next line can run.", loop: "blocked" },
    { layer: "v8", dir: "run", lane: "v8", title: "V8 parses on the JS thread", detail: "V8 does the work itself, on the one JS thread. There is no I/O to wait for, so it never touches libuv or the OS.", loop: "blocked" },
    { layer: "js", dir: "up", title: "value returns — loop was frozen", detail: "While V8 was busy the event loop could not advance: every other request waited. This is 'blocking the loop'.", loop: "blocked" },
  ],
};

export const ARCH_SCENARIOS: ArchScenario[] = [fs, net, cpu];

/** The ordered list of layers a scenario visits (for tests / summaries). */
export function pathLayers(s: ArchScenario): LayerId[] {
  return s.steps.map((st) => st.layer);
}

/** Does this scenario ever run work on the given lane? */
export function usesLane(s: ArchScenario, lane: Lane): boolean {
  return s.steps.some((st) => st.lane === lane);
}

/** Is the event loop ever blocked during this scenario? */
export function blocksLoop(s: ArchScenario): boolean {
  return s.steps.some((st) => st.loop === "blocked");
}
