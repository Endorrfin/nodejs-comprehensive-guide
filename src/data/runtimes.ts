/* ===========================================================================
   Data for the Competitors chapter (Ch.4): the runtime palette (shared by the
   positioning map + the decision widget) and the "pick by your bottleneck"
   recommendation cases.

   The recommendations are curated senior guidance, not a scoring algorithm —
   each names a best fit and a runner-up with a one-line why, plus an honest
   caveat so the trade-off stays visible.
   =========================================================================== */

/** Brand-ish accent per runtime — reused by the map and the picker so a name
    always has the same colour. */
export const RUNTIME_COLOR: Record<string, string> = {
  "Node.js": "#6CC24A",
  Deno: "#67E8F9",
  Bun: "#FBBF24",
  Go: "#38BDF8",
  Rust: "#FF7A00",
  Python: "#A3E635",
  "Java / .NET": "#A78BFA",
  Elixir: "#C084FC",
};

export interface Pick {
  runtime: string;
  why: string;
}

export interface BottleneckCase {
  id: string;
  /** The user's situation / dominant constraint. */
  label: string;
  best: Pick;
  alt: Pick;
  /** The honest counterpoint. */
  caveat: string;
}

export const BOTTLENECKS: BottleneckCase[] = [
  {
    id: "io",
    label: "I/O-bound API or web service",
    best: { runtime: "Node.js", why: "The event loop overlaps thousands of network/DB waits on one thread, and npm + one language end-to-end keep you fast." },
    alt: { runtime: "Deno", why: "Same non-blocking model with first-class TypeScript and a permissions sandbox." },
    caveat: "All three JS runtimes (Node/Deno/Bun) fit here — choose on ecosystem and tooling, not raw req/s.",
  },
  {
    id: "cpu",
    label: "CPU-bound compute & parallelism",
    best: { runtime: "Go", why: "Goroutines use every core without ceremony — no single-thread bottleneck to design around." },
    alt: { runtime: "Rust", why: "Peak throughput with no GC pauses when every microsecond counts." },
    caveat: "Node can offload to worker_threads, but parallel CPU work is precisely where it's weakest.",
  },
  {
    id: "realtime",
    label: "Millions of light, long-lived connections",
    best: { runtime: "Elixir", why: "The BEAM runs millions of cheap, isolated processes with built-in supervision — soft-real-time at scale." },
    alt: { runtime: "Go", why: "Goroutines scale to very high connection counts with a gentler ecosystem jump." },
    caveat: "Node serves many connections too, but per-connection isolation and fault-tolerance favour the BEAM.",
  },
  {
    id: "binary",
    label: "Ship one self-contained binary / CLI",
    best: { runtime: "Go", why: "Compiles to a single static binary with fast startup — trivial to distribute and run anywhere." },
    alt: { runtime: "Rust", why: "Also a single binary, with maximum performance and a small runtime." },
    caveat: "Deno and Bun can `compile` to a binary too if you'd rather stay in TypeScript.",
  },
  {
    id: "safety",
    label: "Max performance + memory safety, no GC",
    best: { runtime: "Rust", why: "No garbage collector (so no GC pauses), zero-cost abstractions, and compile-time data-race safety." },
    alt: { runtime: "Go", why: "Much easier to learn; accept a GC and its pauses in exchange for speed of delivery." },
    caveat: "The borrow checker is a real learning curve — reach for Rust when performance/safety truly justify it.",
  },
  {
    id: "ml",
    label: "Data science / ML / scientific",
    best: { runtime: "Python", why: "NumPy, pandas, PyTorch and the entire ML ecosystem live here — nothing else is close." },
    alt: { runtime: "Node.js", why: "Great for serving a trained model behind an API; do the training in Python." },
    caveat: "The GIL caps CPU parallelism, so the heavy lifting runs in native/C extensions under the hood.",
  },
  {
    id: "secure-ts",
    label: "TypeScript-first, secure-by-default, web standards",
    best: { runtime: "Deno", why: "Runs TS directly, sandboxes file/net/env by explicit permission, and ships web-standard APIs." },
    alt: { runtime: "Bun", why: "Also TS-native, optimised for speed and all-in-one tooling out of the box." },
    caveat: "Smaller ecosystem than Node — confirm your critical dependencies work before committing.",
  },
  {
    id: "enterprise",
    label: "Large enterprise services & big teams",
    best: { runtime: "Java / .NET", why: "Mature, statically-typed platforms with true multithreading, deep tooling and long-term support." },
    alt: { runtime: "Go", why: "Lighter and also strongly typed and concurrent — popular for cloud-native services." },
    caveat: "Heavier runtime and more ceremony than Node, but battle-tested for large, long-lived systems.",
  },
];
