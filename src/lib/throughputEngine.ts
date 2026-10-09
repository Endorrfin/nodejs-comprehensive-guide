/* ===========================================================================
   Connection-scaling model — the "Strengths" interactive (Ch.2).

   The C10k story to scale. To hold N concurrent, mostly-idle, I/O-bound
   connections, how do the two server architectures compare?

     • thread-per-request — one OS thread per concurrent connection. A thread
       costs roughly ~1 MiB committed (stack + per-thread bookkeeping), so N
       connections need N threads ≈ N MiB — and the scheduler thrashes long
       before you reach tens of thousands of them.
     • event-loop (Node) — ONE thread plus the OS notifier watch every socket.
       A connection costs a few KiB idle and ~20 KiB with a request in flight
       (socket + parser + req/res objects), so the same N connections fit in a
       fraction of the memory on one thread.

   CHANGED: S18 — the loop constant is now MEASURED, not guessed (was 64 KiB):
   scripts/node-truth-connmem.mjs on Node 24.21 → idle TCP socket ~3.6 KiB RSS,
   HTTP keep-alive connection with a request in flight ~22 KiB RSS (~4.6 KiB
   heap). The model rounds the BUSY case to ~20 KiB. It is still an
   order-of-magnitude model of the C10k problem, not a benchmark: a thread
   costs ~50× a busy connection, so thread-per-request memory balloons while
   the event loop stays flat — asserted in scripts/test-throughput.ts.
   =========================================================================== */

export type ModelId = "thread" | "loop";

export interface ModelMeta {
  id: ModelId;
  label: string;
  sub: string;
  color: string;
  /** Committed memory per concurrent connection, in MiB (order of magnitude). */
  perConnMiB: number;
  /** OS threads needed to hold one concurrent connection. */
  threadsPerConn: number;
}

const BASE_MIB = 30; // process base RSS — identical for both, cancels in the ratio

export const MODELS: Record<ModelId, ModelMeta> = {
  thread: {
    id: "thread",
    label: "thread-per-request",
    sub: "one OS thread per connection — ~1 MiB of stack each",
    color: "#FF7A00",
    perConnMiB: 1, // ~1 MiB committed per thread (stack + bookkeeping)
    threadsPerConn: 1,
  },
  loop: {
    id: "loop",
    label: "event loop (Node)",
    sub: "one thread + the kernel watch every socket — ~20 KiB per busy connection", // CHANGED: S18 (was ~64 KiB)
    color: "#6CC24A",
    perConnMiB: 20 / 1024, // CHANGED: S18 — ~20 KiB per busy connection (measured ~22 KiB; idle ~3.6 KiB)
    threadsPerConn: 0, // they all share the single loop thread
  },
};

export interface ModelResult {
  id: ModelId;
  /** Connections held concurrently (both models hold all N — the question is at
      what cost). */
  served: number;
  /** OS threads alive (the event loop is always 1). */
  threads: number;
  /** Approximate committed memory, MiB. */
  memMiB: number;
}

export function compute(model: ModelId, n: number): ModelResult {
  const m = MODELS[model];
  const threads = model === "loop" ? 1 : n * m.threadsPerConn;
  const memMiB = BASE_MIB + n * m.perConnMiB;
  return { id: model, served: n, threads, memMiB };
}

/** Slider stops (connection counts) used by the UI. */
export const N_STOPS = [100, 500, 1000, 2500, 5000, 10000, 20000] as const;

export const fmtMem = (miB: number): string =>
  miB >= 1024 ? `${(miB / 1024).toFixed(miB >= 10240 ? 1 : 2)} GiB` : `${Math.round(miB)} MiB`;

export const fmtN = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `${n}`);

/** Memory blow-up factor (thread ÷ loop) at a given N — grows toward ~50× (1 MiB ÷ 20 KiB). CHANGED: S18 (was ~16×) */
export function memRatio(n: number): number {
  return compute("thread", n).memMiB / compute("loop", n).memMiB;
}
