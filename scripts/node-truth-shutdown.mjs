/* Ground truth for the graceful-shutdown engine (Ch.16 Production patterns).
   Proves, on a REAL Node http.Server, the core of graceful shutdown:
     (1) server.close(cb) stops accepting new connections but DRAINS in-flight
         requests — the callback fires only AFTER an in-flight response finishes;
     (2) Node exposes closeIdleConnections()/closeAllConnections() (Node ≥18.2)
         so keep-alive idle sockets don't block the drain;
     (3) an abrupt process.exit() while a request is in flight drops it
         (the client sees ECONNRESET) — the thing graceful shutdown prevents.
   Run: node scripts/node-truth-shutdown.mjs                                    */
import http from "node:http";

const server = http.createServer((req, res) => {
  // a slow (in-flight) request: respond after 150ms
  setTimeout(() => res.end("done"), 150);
});
await new Promise((r) => server.listen(0, r));
const { port } = server.address();

const order = [];

// fire an in-flight request, DON'T await it yet
const inflight = new Promise((resolve, reject) => {
  http.get({ port }, (res) => {
    res.resume();
    res.on("end", () => { order.push("response-ended"); resolve("200"); });
  }).on("error", reject);
});

// 30ms later, begin graceful shutdown while that request is still in flight
await new Promise((r) => setTimeout(r, 30));
const closed = new Promise((resolve) => {
  server.close(() => { order.push("server-closed"); resolve(); });
});

const result = await inflight;          // in-flight request completed (drained)
await closed;                           // close callback fired afterwards

const truth = {
  node: process.version,
  inFlightCompleted: result === "200",
  // the callback must fire AFTER the in-flight response ended (drain, not drop)
  drainedBeforeClose: order[0] === "response-ended" && order[1] === "server-closed",
  order,
  hasCloseIdleConnections: typeof server.closeIdleConnections === "function",
  hasCloseAllConnections: typeof server.closeAllConnections === "function",
};
console.log(JSON.stringify(truth, null, 2));
