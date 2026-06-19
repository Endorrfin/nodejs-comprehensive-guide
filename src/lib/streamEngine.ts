/* ===========================================================================
   Backpressure engine — a faithful, deterministic model of a fast producer
   writing into a Writable with a slow consumer (the "Streams" chapter hero sim).

   The mechanism (verified against real Node 22, scripts/node-truth-streams.mjs):
   - Each write() appends a chunk to an internal buffer and returns a boolean:
     TRUE while the buffer stays below highWaterMark, FALSE once a write brings
     the buffered amount to >= highWaterMark.  (Node truth: hwm=4 → writes
     1,2,3 return true; write #4 returns false at buffered=4.)
   - FALSE is only ADVISORY: further writes are still accepted and queued, so a
     producer that ignores it grows the buffer without bound (memory blows up).
   - A producer that RESPECTS it stops on false and waits for the 'drain' event,
     which Node emits once the buffer falls back below highWaterMark. The buffer
     then oscillates just under the mark — memory stays bounded. This is exactly
     what pipe()/pipeline() do for you automatically.

   simulate(scenario, opts) returns Frame[] the UI steps through; summarize()
   exposes the invariants asserted in scripts/test-streams.ts.
   =========================================================================== */

export type Mode = "ignore" | "respect";

export interface StreamScenario {
  id: string;
  title: string;
  blurb: string;
  /** producer attempts this many writes per tick (it is the FAST side) */
  produceRate: number;
  /** consumer flushes this many chunks per tick (the SLOW side) */
  consumeRate: number;
  total: number; // chunks the producer wants to write in all
  hwms: number[]; // selectable highWaterMark values (in chunks)
  defaultHwm: number;
  takeawayRespect: string;
  takeawayIgnore: string;
  codeRespect: string;
  codeIgnore: string;
}

export type StreamEvent = "start" | "write" | "pause" | "consume" | "drain" | "done" | "tick";

export interface StreamFrame {
  step: number;
  tick: number;
  event: StreamEvent;
  mode: Mode;
  hwm: number;
  buffer: number; // chunks buffered right now
  produced: number;
  consumed: number;
  total: number;
  paused: boolean; // producer is parked waiting for 'drain'
  lastWriteOk: boolean | null; // return value of the most recent write() this frame
  wroteThisFrame: number;
  drains: number; // 'drain' events so far
  maxBuffer: number; // high-water mark actually reached (the memory cost)
  caption: string;
}

export interface SimOpts {
  mode: Mode;
  hwm: number;
}

const CAP = 600;

export function simulate(s: StreamScenario, opts: SimOpts): StreamFrame[] {
  const { mode, hwm } = opts;
  const frames: StreamFrame[] = [];

  let buffer = 0;
  let produced = 0;
  let consumed = 0;
  let paused = false;
  let drains = 0;
  let maxBuffer = 0;
  let tick = 0;
  let lastWriteOk: boolean | null = null;

  const snap = (event: StreamEvent, caption: string, wrote: number): void => {
    if (buffer > maxBuffer) maxBuffer = buffer;
    frames.push({
      step: frames.length,
      tick,
      event,
      mode,
      hwm,
      buffer,
      produced,
      consumed,
      total: s.total,
      paused,
      lastWriteOk,
      wroteThisFrame: wrote,
      drains,
      maxBuffer,
      caption,
    });
    if (frames.length > CAP) throw new Error("backpressure sim exceeded frame cap");
  };

  snap(
    "start",
    `A fast producer (${s.produceRate}/tick) feeds a slow consumer (${s.consumeRate}/tick) through a buffer with highWaterMark = ${hwm}. ${
      mode === "respect"
        ? "It pauses when write() returns false and resumes on 'drain'."
        : "It ignores write()'s return value and keeps writing."
    }`,
    0,
  );

  let guard = 0;
  while (consumed < s.total && guard++ < CAP) {
    tick++;

    // ---- producer half-tick -------------------------------------------------
    let wrote = 0;
    let hitFalse = false;
    lastWriteOk = null;
    if (!paused) {
      while (produced < s.total && wrote < s.produceRate) {
        buffer++;
        produced++;
        wrote++;
        lastWriteOk = buffer < hwm; // write() return AFTER appending this chunk
        if (!lastWriteOk) {
          hitFalse = true;
          if (mode === "respect") {
            paused = true;
            break; // stop the burst — wait for 'drain'
          }
          // ignore mode: keep writing past the mark (buffer grows unbounded)
        }
      }
    }

    if (wrote > 0) {
      let cap = `Tick ${tick}: producer wrote ${wrote} chunk${wrote > 1 ? "s" : ""}; buffer = ${buffer}/${hwm}. `;
      if (hitFalse && mode === "respect") cap += `write() returned false (buffer ≥ hwm) → producer PAUSES.`;
      else if (hitFalse && mode === "ignore") cap += `write() returned false — but the producer ignores it and keeps going (memory grows).`;
      else cap += `write() returned true — keep writing.`;
      snap(hitFalse && mode === "respect" ? "pause" : "write", cap, wrote);
    } else if (paused) {
      snap("pause", `Tick ${tick}: producer is parked, waiting for 'drain'.`, 0);
    } else {
      snap("tick", `Tick ${tick}: producer has written all ${s.total} chunks; only draining remains.`, 0);
    }

    // ---- consumer half-tick -------------------------------------------------
    const flushed = Math.min(s.consumeRate, buffer);
    buffer -= flushed;
    consumed += flushed;

    let drained = false;
    if (paused && buffer < hwm) {
      paused = false;
      drains++;
      drained = true;
    }

    let cap = `Tick ${tick}: consumer flushed ${flushed} chunk${flushed === 1 ? "" : "s"} → buffer = ${buffer}/${hwm}, consumed ${consumed}/${s.total}. `;
    if (drained) cap += `Buffer fell below hwm → 'drain' fires → producer RESUMES.`;
    snap(drained ? "drain" : "consume", cap, 0);
  }

  lastWriteOk = null;
  snap(
    "done",
    mode === "respect"
      ? `Done. Peak buffer was ${maxBuffer} — bounded at the highWaterMark (${hwm}). Memory stayed flat; this is what pipeline() gives you for free.`
      : `Done. Peak buffer hit ${maxBuffer} — far past the highWaterMark (${hwm}). The whole backlog sat in memory at once. With a real ${s.total > 50 ? "GB-sized" : "large"} source this is how a stream OOMs.`,
    0,
  );

  return frames;
}

/** Invariants asserted in scripts/test-streams.ts. */
export interface StreamSummary {
  maxBuffer: number;
  drains: number;
  finalConsumed: number;
  finalBuffer: number;
  /** index (1-based) of the first write() that returned false, or null */
  firstFalseAt: number | null;
}

export function summarize(s: StreamScenario, opts: SimOpts): StreamSummary {
  const frames = simulate(s, opts);
  const last = frames[frames.length - 1];
  // first write() === false: replay the per-write semantics deterministically
  let buf = 0;
  let firstFalseAt: number | null = null;
  for (let i = 1; i <= s.total; i++) {
    buf++;
    if (buf >= opts.hwm && firstFalseAt === null) firstFalseAt = i;
    // (replay assumes an uninterrupted burst — matches node-truth-streams.mjs)
  }
  return {
    maxBuffer: last.maxBuffer,
    drains: last.drains,
    finalConsumed: last.consumed,
    finalBuffer: last.buffer,
    firstFalseAt,
  };
}

/* ---------------------------------------------------------------- scenarios */
export const STREAM_SCENARIOS: StreamScenario[] = [
  {
    id: "file-copy",
    title: "Copy a big file",
    blurb:
      "A fast Readable (disk/source) pushes chunks into a slow Writable (network/sink). Toggle whether the producer respects backpressure, and resize the buffer.",
    produceRate: 3,
    consumeRate: 1,
    total: 18,
    hwms: [3, 6, 9],
    defaultHwm: 6,
    takeawayRespect:
      "Respecting backpressure keeps the buffer pinned just under highWaterMark — memory is bounded no matter how large the source. write()===false → stop; 'drain' → resume. pipeline()/pipe() automate exactly this AND clean up on error.",
    takeawayIgnore:
      "Ignoring write()'s false return lets the producer race ahead of the consumer, so the entire backlog piles up in the buffer. The buffer (RAM) grows with the source size — a multi-GB file becomes a multi-GB heap and the process OOMs.",
    codeRespect: `// Respect backpressure by hand (what pipe/pipeline do for you)
function pump() {
  let ok = true;
  while (ok && (chunk = src.read()) !== null) {
    ok = dst.write(chunk);           // false ⇒ buffer full
  }
  if (!ok) dst.once('drain', pump);  // resume when it empties
}
// In practice, just:  await pipeline(src, dst);`,
    codeIgnore: `// ❌ Ignoring backpressure — the classic stream OOM
src.on('data', (chunk) => {
  dst.write(chunk);                  // return value ignored!
  // producer never pauses; if dst is slower than src,
  // the buffer (RAM) grows until the process dies.
});`,
  },
];
