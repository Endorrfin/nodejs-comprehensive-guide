/* ===========================================================================
   HTTP request-lifecycle engine — the hero interactive for Ch.13
   (Networking & HTTP internals). It walks one HTTP request from the wire to
   your handler and back, and shows the one thing that dominates real-world
   latency: whether the TCP socket is REUSED (keep-alive) or re-handshaked.

   Actors (one lights up per step):
     client → the peer (browser, Agent, load balancer)
     socket → the TCP connection + the OS kernel (poll readiness)
     parser → llhttp, turning bytes into a request incrementally
     app    → your JS: the 'request' handler, IncomingMessage/ServerResponse
     timer  → the server's timeout triad firing

   Three scenarios deliberately differ on the socket's fate:
     • keep-alive   → socket reused from the Agent pool, no handshake (the win)
     • close        → Connection: close, socket destroyed, next request re-handshakes
     • timeout      → slow client, headers never complete → headersTimeout aborts (408)

   Pure & deterministic. The default timeouts + Agent pool numbers below were
   read from a real http.Server / http.globalAgent on Node 22 and are asserted
   live in scripts/test-http.ts (server defaults must equal DEFAULT_TIMEOUTS;
   globalAgent keep-alive on, maxFreeSockets 256, scheduling 'lifo').
   =========================================================================== */

export type HttpActor = "client" | "socket" | "parser" | "app" | "timer";

/** Semantic flag for tinting a step and for the tests. */
export type HttpNote = "reuse" | "handshake" | "abort";

export interface HttpStep {
  actor: HttpActor;
  /** Short mono headline. */
  title: string;
  /** One sentence: what happens here. */
  detail: string;
  note?: HttpNote;
  /** Is the single event-loop thread free right now? (HTTP I/O never blocks it.) */
  loop: "free" | "blocked";
}

export interface HttpScenario {
  id: string;
  /** Tab label. */
  title: string;
  /** The request line shown at the top of the sim. */
  call: string;
  blurb: string;
  /** Does this request travel on a reused (pooled) socket? */
  reusesSocket: boolean;
  /** What the client ultimately sees. */
  outcome: "200" | "408";
  steps: HttpStep[];
  takeaway: string;
}

/* ---- Real Node defaults (read from http.createServer() on Node 22) -------- */
export interface ServerTimeouts {
  /** Idle keep-alive socket close (ms). */
  keepAliveTimeout: number;
  /** Time allowed to receive the COMPLETE headers (ms). */
  headersTimeout: number;
  /** Time allowed to receive the ENTIRE request (ms); enabled by default since Node 18. */
  requestTimeout: number;
  /** Per-socket inactivity timeout (ms); 0 = disabled by default. */
  serverTimeout: number;
}
export const DEFAULT_TIMEOUTS: ServerTimeouts = {
  keepAliveTimeout: 5000,
  headersTimeout: 60000,
  requestTimeout: 300000,
  serverTimeout: 0,
};

/** http.globalAgent defaults (Node ≥19): keep-alive ON for outgoing requests. */
export const AGENT_DEFAULTS = {
  keepAlive: true,
  maxFreeSockets: 256,
  scheduling: "lifo" as const,
  /** maxSockets is Infinity by default (per origin). */
  maxSocketsIsInfinity: true,
};

const keepAlive: HttpScenario = {
  id: "keepalive",
  title: "Keep-alive (reuse)",
  call: "GET /api  ·  Connection: keep-alive",
  blurb: "The modern default. The Agent hands the request a socket it already opened — no new handshake.",
  reusesSocket: true,
  outcome: "200",
  takeaway:
    "A keep-alive Agent reuses an already-open TCP (and TLS) connection, so this request skips the handshake entirely — saving at least one round-trip (TLS adds another) and the CPU of a fresh negotiation. Since Node 19 http.globalAgent defaults to keepAlive:true; the freed socket then waits keepAliveTimeout (5 s) for the next request.",
  steps: [
    { actor: "client", title: "Agent picks a free socket", detail: "The keep-alive Agent has an idle socket to this origin in its pool, so it reuses it instead of dialing.", note: "reuse", loop: "free" },
    { actor: "socket", title: "request bytes arrive (poll)", detail: "The kernel marks the socket readable; the event loop wakes in its poll phase. No thread was parked on the wait.", loop: "free" },
    { actor: "parser", title: "llhttp parses incrementally", detail: "The bundled llhttp parser turns the incoming bytes into a method, URL and headers as they stream in.", loop: "free" },
    { actor: "app", title: "'request' → your handler", detail: "Node builds IncomingMessage (req) and ServerResponse (res) and emits 'request'; your handler runs on the event-loop thread.", loop: "free" },
    { actor: "app", title: "res.writeHead/​end → response", detail: "Your handler writes status + headers + body; the response streams back out through the same socket (backpressure-aware).", loop: "free" },
    { actor: "socket", title: "socket parked for reuse", detail: "Connection: keep-alive, so the socket returns to the pool and a keepAliveTimeout (5 s) idle timer starts — ready for the next request.", note: "reuse", loop: "free" },
  ],
};

const close: HttpScenario = {
  id: "close",
  title: "Connection: close",
  call: "GET /api  ·  Connection: close",
  blurb: "No pooling. Every request pays a fresh TCP (and TLS) handshake, then the socket is thrown away.",
  reusesSocket: false,
  outcome: "200",
  takeaway:
    "Without keep-alive, each request opens a brand-new socket: a TCP handshake (≥1 round-trip) plus, on HTTPS, a TLS handshake (≥1 more) before a single byte of your data moves — then the socket is destroyed and the next request repeats it all. This per-request handshake tax is exactly what keep-alive Agents exist to remove.",
  steps: [
    { actor: "client", title: "open a NEW TCP socket", detail: "No pooled socket is available, so the client performs a TCP handshake (SYN / SYN-ACK / ACK) to the origin.", note: "handshake", loop: "free" },
    { actor: "socket", title: "(TLS handshake on HTTPS)", detail: "For https, a TLS handshake (OpenSSL) negotiates keys — another round-trip or two before any request bytes flow.", note: "handshake", loop: "free" },
    { actor: "parser", title: "llhttp parses the request", detail: "Once bytes arrive, llhttp parses the request line and headers as before.", loop: "free" },
    { actor: "app", title: "'request' → your handler", detail: "Your handler runs and produces the response, identically to the keep-alive case.", loop: "free" },
    { actor: "socket", title: "Connection: close → destroy", detail: "The header says close, so after res.end the socket is sent FIN and destroyed. Nothing is pooled.", loop: "free" },
    { actor: "client", title: "next request re-handshakes", detail: "The following request to this origin starts over at the TCP (and TLS) handshake — the cost keep-alive avoids.", note: "handshake", loop: "free" },
  ],
};

const timeout: HttpScenario = {
  id: "timeout",
  title: "Slow client → timeout",
  call: "GET /api  ·  headers never complete",
  blurb: "A stalled or malicious client sends partial headers. The timeout triad bounds how long it can tie up the socket.",
  reusesSocket: false,
  outcome: "408",
  takeaway:
    "The timeout triad protects the server: headersTimeout (60 s) caps time to receive COMPLETE headers, requestTimeout (300 s, on by default since Node 18) caps the whole request, and keepAliveTimeout (5 s) caps an idle socket. When headers never complete, the server aborts with 408 instead of leaking the connection — and getting keepAliveTimeout shorter than an upstream load balancer's idle timeout is a classic cause of spurious 502/ECONNRESET.",
  steps: [
    { actor: "client", title: "opens socket, sends partial request", detail: "The client (or a Slowloris-style attacker) connects and dribbles in a few header bytes, then stalls.", loop: "free" },
    { actor: "socket", title: "bytes trickle in", detail: "The kernel delivers the partial data; the socket stays open, holding a slot.", loop: "free" },
    { actor: "parser", title: "llhttp still awaiting full headers", detail: "The parser has an incomplete header block and cannot emit 'request' yet — the handler never runs.", loop: "free" },
    { actor: "timer", title: "headersTimeout (60 s) fires", detail: "The server's headersTimeout elapses before the headers complete.", note: "abort", loop: "free" },
    { actor: "app", title: "server responds 408 / destroys socket", detail: "Node aborts the request with 408 Request Timeout and tears down the socket, reclaiming the resource.", note: "abort", loop: "free" },
  ],
};

export const HTTP_SCENARIOS: HttpScenario[] = [keepAlive, close, timeout];

/** Does this scenario perform a TCP/TLS handshake? */
export function usesHandshake(s: HttpScenario): boolean {
  return s.steps.some((st) => st.note === "handshake");
}

/** Does this scenario reuse a pooled socket? */
export function reusesPooledSocket(s: HttpScenario): boolean {
  return s.steps.some((st) => st.note === "reuse");
}

/** Is this scenario aborted by a timeout? */
export function abortsOnTimeout(s: HttpScenario): boolean {
  return s.steps.some((st) => st.note === "abort");
}
