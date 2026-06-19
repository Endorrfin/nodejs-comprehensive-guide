/* Correctness checks for the HTTP request-lifecycle engine.
   Run: node --experimental-strip-types scripts/test-http.ts

   (1) engine invariants — the three scenarios differ on the socket's fate
       (reuse vs handshake vs timeout-abort), and HTTP I/O never blocks the loop;
   (2) LIVE anchor — a real http.Server's default timeouts equal DEFAULT_TIMEOUTS,
       and http.globalAgent carries the Node-19 keep-alive pool defaults.
   The keep-alive socket-REUSE behaviour itself is demonstrated against a real
   server in scripts/node-truth-http.mjs.                                       */
import http from "node:http";
import {
  HTTP_SCENARIOS,
  DEFAULT_TIMEOUTS,
  AGENT_DEFAULTS,
  usesHandshake,
  reusesPooledSocket,
  abortsOnTimeout,
  type HttpScenario,
} from "../src/lib/httpEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};

const get = (id: string): HttpScenario => HTTP_SCENARIOS.find((s) => s.id === id)!;
const ka = get("keepalive");
const close = get("close");
const to = get("timeout");

// Each scenario begins at the client and never blocks the event-loop thread.
for (const s of HTTP_SCENARIOS) {
  check(`${s.id}: first actor is client`, s.steps[0].actor === "client");
  check(`${s.id}: HTTP I/O never blocks the loop`, s.steps.every((st) => st.loop === "free"));
  check(`${s.id}: has a parser step (llhttp)`, s.steps.some((st) => st.actor === "parser"));
}

// keep-alive → reuse a pooled socket, no handshake, 200.
check("keepalive: reusesSocket = true", ka.reusesSocket === true);
check("keepalive: reuses a pooled socket", reusesPooledSocket(ka));
check("keepalive: performs NO handshake", !usesHandshake(ka));
check("keepalive: not aborted", !abortsOnTimeout(ka));
check("keepalive: outcome 200", ka.outcome === "200");

// connection: close → fresh handshake, no reuse, 200.
check("close: reusesSocket = false", close.reusesSocket === false);
check("close: performs a handshake", usesHandshake(close));
check("close: does NOT reuse a socket", !reusesPooledSocket(close));
check("close: outcome 200", close.outcome === "200");

// slow client → headersTimeout aborts with 408, socket not reused.
check("timeout: aborts on a timeout", abortsOnTimeout(to));
check("timeout: outcome 408", to.outcome === "408");
check("timeout: reusesSocket = false", to.reusesSocket === false);
check("timeout: has a timer actor step", to.steps.some((st) => st.actor === "timer"));

// timeout triad ordering: idle keep-alive < complete-headers ≤ whole-request.
const t = DEFAULT_TIMEOUTS;
check("triad: keepAliveTimeout < headersTimeout", t.keepAliveTimeout < t.headersTimeout);
check("triad: headersTimeout ≤ requestTimeout", t.headersTimeout <= t.requestTimeout);
check("triad: serverTimeout disabled (0)", t.serverTimeout === 0);

// ---- LIVE anchor: real http.Server + globalAgent on this Node -------------
const srv = http.createServer();
check("live: server.keepAliveTimeout === 5000", srv.keepAliveTimeout === t.keepAliveTimeout, `= ${srv.keepAliveTimeout}`);
check("live: server.headersTimeout === 60000", srv.headersTimeout === t.headersTimeout, `= ${srv.headersTimeout}`);
check("live: server.requestTimeout === 300000", srv.requestTimeout === t.requestTimeout, `= ${srv.requestTimeout}`);
check("live: server.timeout === 0", srv.timeout === t.serverTimeout, `= ${srv.timeout}`);
srv.close();

const ga = http.globalAgent as unknown as {
  keepAlive: boolean;
  maxSockets: number;
  maxFreeSockets: number;
  options?: { scheduling?: string };
};
check("live: globalAgent.keepAlive === true (Node ≥19)", ga.keepAlive === AGENT_DEFAULTS.keepAlive);
check("live: globalAgent.maxFreeSockets === 256", ga.maxFreeSockets === AGENT_DEFAULTS.maxFreeSockets, `= ${ga.maxFreeSockets}`);
check("live: globalAgent.scheduling === 'lifo'", ga.options?.scheduling === AGENT_DEFAULTS.scheduling, `= ${ga.options?.scheduling}`);
check("live: globalAgent.maxSockets === Infinity", ga.maxSockets === Infinity, `= ${ga.maxSockets}`);

// the parsers named in the chapter are real components of this runtime
const versions = process.versions as Record<string, string>;
check("live: process.versions.llhttp present", typeof versions.llhttp === "string", `= ${versions.llhttp}`);
check("live: process.versions.nghttp2 present (HTTP/2)", typeof versions.nghttp2 === "string", `= ${versions.nghttp2}`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
