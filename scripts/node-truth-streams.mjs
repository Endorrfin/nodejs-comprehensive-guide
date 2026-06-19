/* Ground truth for the backpressure engine (Ch.10 "Streams" hero sim).
   A fast producer writes chunks into a Writable with a slow _write (a slow
   consumer). We record, for each synchronous write(): its boolean return and
   the buffered byte count (writableLength) vs the highWaterMark — then how many
   'drain' events fire as the consumer catches up. The engine in
   src/lib/streamEngine.ts must reproduce these qualitative facts:
     - write() returns true while buffered < highWaterMark, false once buffered
       would meet/exceed it;
     - the buffer can exceed hWM (writes past the mark are still accepted/queued);
     - 'drain' fires after the buffer empties below the mark, exactly once per
       saturation episode.
   Run: node scripts/node-truth-streams.mjs                                    */
import { Writable } from "node:stream";

function burst({ hwm, objectMode, chunkBytes, n }) {
  return new Promise((resolve) => {
    const writes = [];
    let drains = 0;
    let firstFalseAt = null;
    const w = new Writable({
      objectMode,
      highWaterMark: hwm,
      write(_chunk, _enc, cb) {
        setTimeout(cb, 4); // slow consumer
      },
    });
    w.on("drain", () => {
      drains++;
    });
    // Synchronous burst — the producer ignores backpressure to expose the buffer growth.
    for (let i = 1; i <= n; i++) {
      const chunk = objectMode ? { i } : Buffer.alloc(chunkBytes);
      const ok = w.write(chunk);
      if (!ok && firstFalseAt === null) firstFalseAt = i;
      writes.push({ i, ok, buffered: w.writableLength, hwm: w.writableHighWaterMark });
    }
    w.end(() => resolve({ hwm: w.writableHighWaterMark, objectMode, firstFalseAt, drains, writes }));
  });
}

const objm = await burst({ hwm: 4, objectMode: true, n: 10 });
console.log("OBJECT MODE hwm=4, 10 writes of 1 object:");
console.log("  firstFalseAt =", objm.firstFalseAt, " (write() flips to false here)");
console.log(
  "  return/buffered:",
  objm.writes.map((x) => `${x.i}:${x.ok ? "T" : "F"}@${x.buffered}`).join(" "),
);

const bytes = await burst({ hwm: 16, objectMode: false, chunkBytes: 4, n: 10 });
console.log("\nBYTE MODE hwm=16, 10 writes of 4 bytes:");
console.log("  firstFalseAt =", bytes.firstFalseAt);
console.log(
  "  return/buffered:",
  bytes.writes.map((x) => `${x.i}:${x.ok ? "T" : "F"}@${x.buffered}`).join(" "),
);

// Default highWaterMark sanity (version-sensitive fact used in the chapter).
const d = new Writable({ write(_c, _e, cb) { cb(); } });
const dObj = new Writable({ objectMode: true, write(_c, _e, cb) { cb(); } });
console.log("\nDEFAULTS: byte writable hWM =", d.writableHighWaterMark, " objectMode writable hWM =", dObj.writableHighWaterMark);
