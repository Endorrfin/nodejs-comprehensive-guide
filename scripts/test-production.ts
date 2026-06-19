/* Correctness checks for the graceful-shutdown engine (Ch.16).
   Run: node --experimental-strip-types scripts/test-production.ts

   (1) engine invariants — graceful drains (0 dropped, exit 0) while abrupt
       drops every in-flight request; the drain count is monotonic non-increasing;
   (2) LIVE anchor — on a real http.Server, server.close(cb) DRAINS an in-flight
       request (its callback fires only after the response ends), and Node
       exposes closeIdleConnections()/closeAllConnections().                    */
import http from "node:http";
import {
  SHUTDOWN_SCENARIOS,
  drainsInFlight,
  dropsInFlight,
  finalDropped,
  type ShutdownScenario,
} from "../src/lib/shutdownEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};
const get = (id: string): ShutdownScenario => SHUTDOWN_SCENARIOS.find((s) => s.id === id)!;
const graceful = get("graceful");
const abrupt = get("abrupt");

// ---- (1) engine invariants -------------------------------------------------
check("graceful: drains in-flight", drainsInFlight(graceful));
check("graceful: drops nothing", !dropsInFlight(graceful) && finalDropped(graceful) === 0);
check("graceful: exits 0", graceful.exitCode === 0);
check("graceful: starts at the signal, ends at the process", graceful.steps[0].actor === "signal" && graceful.steps[graceful.steps.length - 1].actor === "process");

// in-flight count never increases as we drain
let monotonic = true;
for (let i = 1; i < graceful.steps.length; i++) if (graceful.steps[i].inFlight > graceful.steps[i - 1].inFlight) monotonic = false;
check("graceful: in-flight is monotonically drained", monotonic, graceful.steps.map((s) => s.inFlight).join("→"));

check("abrupt: drops every in-flight request", dropsInFlight(abrupt) && finalDropped(abrupt) === abrupt.startInFlight, `dropped=${finalDropped(abrupt)}/${abrupt.startInFlight}`);
check("abrupt: does NOT drain", !drainsInFlight(abrupt));
check("abrupt: non-zero exit code", abrupt.exitCode !== 0);

// ---- (2) LIVE anchor: real server.close() drains an in-flight request -------
const server = http.createServer((_req, res) => { setTimeout(() => res.end("done"), 120); });
await new Promise<void>((r) => server.listen(0, () => r()));
const { port } = server.address() as { port: number };

const order: string[] = [];
const inflight = new Promise<string>((resolve, reject) => {
  http.get({ port }, (res) => { res.resume(); res.on("end", () => { order.push("response-ended"); resolve("200"); }); }).on("error", reject);
});
await new Promise((r) => setTimeout(r, 25)); // shut down WHILE the request is in flight
const closed = new Promise<void>((resolve) => server.close(() => { order.push("server-closed"); resolve(); }));
const code = await inflight;
await closed;

check("live: in-flight request completed during shutdown", code === "200");
check("live: server.close drained THEN closed (not dropped)", order[0] === "response-ended" && order[1] === "server-closed", order.join("→"));
check("live: server.closeIdleConnections() exists (Node ≥18.2)", typeof server.closeIdleConnections === "function");
check("live: server.closeAllConnections() exists", typeof server.closeAllConnections === "function");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
