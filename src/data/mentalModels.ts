/* "Draw from memory" gallery — seeded (grows with figures in later sessions). */
export interface ModelCard {
  id: string;
  title: string;
  chapter: string; // chapter id
  prompt: string; // what to draw/recall
  answer: string; // the recap to check against
}

export const MODELS: ModelCard[] = [
  {
    id: "loop-phases",
    title: "The six event-loop phases",
    chapter: "event-loop",
    prompt: "Draw one tick of the event loop: name the six phases in order and say where microtasks run.",
    answer:
      "timers → pending callbacks → idle/prepare (internal) → poll → check → close. Microtasks (nextTick, then Promise) drain after EVERY callback and between phases — they are not a phase.",
  },
  {
    id: "microtask-priority",
    title: "Microtask priority",
    chapter: "event-loop",
    prompt: "Order these: sync code, setTimeout(0), setImmediate, Promise.then, process.nextTick.",
    answer:
      "Sync first → process.nextTick → Promise.then → then macrotasks: setTimeout(0) (timers) and setImmediate (check), whose relative order is non-deterministic in the main module.",
  },
  {
    id: "pool-vs-kernel",
    title: "Thread pool vs kernel async",
    chapter: "concurrency",
    prompt: "Where do fs.readFile ×N and http.get ×N execute? Draw the pool and the kernel paths.",
    answer:
      "fs/crypto/dns.lookup/zlib go to the libuv thread pool (default 4 threads — extras queue). Network I/O (http/sockets) is handled by the OS (epoll/kqueue/IOCP) without pool threads; one thread can watch thousands of sockets.",
  },
  {
    id: "gc-generations",
    title: "GC generations",
    chapter: "v8-gc",
    prompt: "Draw V8's heap: where are objects born, and how do they get collected?",
    answer:
      "Young space (nursery): fast Scavenge copies live objects between semi-spaces; survivors are promoted to old space, collected by mark-sweep-compact (mostly concurrent/incremental, with short stop-the-world pauses).",
  },
  {
    id: "backpressure",
    title: "Backpressure",
    chapter: "streams",
    prompt: "A fast producer writes to a slow consumer. Draw what bounds memory.",
    answer:
      "write() returns false once buffered bytes exceed highWaterMark; the producer pauses and resumes on the 'drain' event. pipeline() wires this automatically and cleans up on error.",
  },
];
