/* ===========================================================================
   Graceful-shutdown engine — the HERO interactive for Ch.16 (Production).

   The contract every production service must honour on SIGTERM:
       stop intake → drain in-flight → close resources → exit(0)
   Orchestrators (Kubernetes, ECS) and autoscalers send SIGTERM constantly
   during rolling deploys. Do it right and zero requests are dropped; do it
   wrong (exit immediately, or no handler at all) and every in-flight request
   is guillotined — the client sees ECONNRESET / a 502.

   Two scenarios walk the SAME moment — SIGTERM with N requests in flight — and
   end differently:
     • graceful → server.close() stops new connections and DRAINS the in-flight
       ones, pools close, process exits 0, nothing dropped.
     • abrupt   → the handler calls process.exit() (or there's no handler), so
       the in-flight requests are dropped mid-response.

   Pure & deterministic. The core fact — server.close(cb) fires its callback
   only AFTER an in-flight response finishes (drain, not drop), and Node exposes
   closeIdleConnections()/closeAllConnections() — is captured from a real server
   in scripts/node-truth-shutdown.mjs and re-verified live in
   scripts/test-production.ts.
   =========================================================================== */

export type ShutdownActor = "signal" | "readiness" | "server" | "inflight" | "resources" | "process";

/** Semantic flag for tinting a step + for the tests. */
export type ShutdownNote = "drain" | "drop" | "exit";

export interface ShutdownStep {
  actor: ShutdownActor;
  title: string;
  detail: string;
  note?: ShutdownNote;
  /** In-flight requests still alive after this step. */
  inFlight: number;
  /** Requests dropped so far (client got ECONNRESET / 502). */
  dropped: number;
}

export interface ShutdownScenario {
  id: string;
  title: string;
  blurb: string;
  /** Requests in flight when SIGTERM arrives. */
  startInFlight: number;
  /** Final process exit code. */
  exitCode: number;
  steps: ShutdownStep[];
  takeaway: string;
}

const START = 3;

const graceful: ShutdownScenario = {
  id: "graceful",
  title: "Graceful (correct)",
  blurb: "Catch SIGTERM, fail readiness, stop accepting, drain in-flight, close pools, then exit 0. Nothing is dropped.",
  startInFlight: START,
  exitCode: 0,
  takeaway:
    "The handler stops new intake and lets the in-flight requests finish before closing resources and exiting 0 — so a rolling deploy drops zero requests. A force-exit timer (e.g. 10 s) is the backstop if a request hangs, and failing the readiness probe first makes the load balancer stop routing new traffic while you drain.",
  steps: [
    { actor: "signal", title: "SIGTERM received", detail: "The orchestrator sends SIGTERM to begin a rolling deploy. Your process.on('SIGTERM', …) handler runs instead of the default terminate.", inFlight: START, dropped: 0 },
    { actor: "readiness", title: "fail the readiness probe", detail: "Flip a flag so /readyz returns 503; the load balancer / k8s Service stops sending NEW requests to this pod while it drains.", inFlight: START, dropped: 0 },
    { actor: "server", title: "server.close() — stop accepting", detail: "Stop accepting new connections. Existing requests keep running; server.close's callback will fire only once they've all finished.", note: "drain", inFlight: START, dropped: 0 },
    { actor: "inflight", title: "drain in-flight requests", detail: "The in-flight requests complete normally and their responses flush. (closeIdleConnections() drops idle keep-alive sockets so they don't hold the drain open.)", note: "drain", inFlight: 1, dropped: 0 },
    { actor: "inflight", title: "last response flushed", detail: "The final in-flight response ends; server.close's callback fires. Zero requests were dropped.", note: "drain", inFlight: 0, dropped: 0 },
    { actor: "resources", title: "close DB pool, queues, timers", detail: "Now that no work is running, close the database pool and other connections, and clear timers so nothing keeps the loop alive.", inFlight: 0, dropped: 0 },
    { actor: "process", title: "exit(0) — clean", detail: "The event loop empties and the process exits 0. The orchestrator sees a healthy termination; the deploy proceeds with zero downtime.", note: "exit", inFlight: 0, dropped: 0 },
  ],
};

const abrupt: ShutdownScenario = {
  id: "abrupt",
  title: "Abrupt (wrong)",
  blurb: "Exit immediately on SIGTERM (or have no handler). In-flight requests are cut mid-response — clients get ECONNRESET / 502.",
  startInFlight: START,
  exitCode: 1,
  takeaway:
    "Calling process.exit() in the SIGTERM handler (or having none, so the default terminates the process) kills in-flight requests mid-response: clients get ECONNRESET and the load balancer returns 502s. Every rolling deploy then sheds a burst of errored requests — the exact failure graceful shutdown exists to prevent.",
  steps: [
    { actor: "signal", title: "SIGTERM received", detail: "The orchestrator sends SIGTERM. The handler decides to quit right now (or there is no handler and Node terminates by default).", inFlight: START, dropped: 0 },
    { actor: "process", title: "process.exit() immediately", detail: "The process tears down at once. There is no drain phase — the in-flight requests never get to finish.", note: "drop", inFlight: 0, dropped: START },
    { actor: "inflight", title: "in-flight requests cut", detail: "Open sockets are destroyed mid-response; each in-flight client receives ECONNRESET. Any half-done writes (DB, files) may be left inconsistent.", note: "drop", inFlight: 0, dropped: START },
    { actor: "resources", title: "pools killed, not closed", detail: "The DB pool and other resources are dropped without a clean close — risking leaked server-side connections until they time out.", note: "drop", inFlight: 0, dropped: START },
    { actor: "process", title: "exit — but with damage", detail: "The process is gone, but the load balancer counted a burst of 502s and the deploy looks 'flaky'. Multiply by every pod on every deploy.", note: "exit", inFlight: 0, dropped: START },
  ],
};

export const SHUTDOWN_SCENARIOS: ShutdownScenario[] = [graceful, abrupt];

/** Does this scenario drain in-flight work (finish it before exit)? */
export function drainsInFlight(s: ShutdownScenario): boolean {
  return s.steps.some((st) => st.note === "drain") && finalDropped(s) === 0;
}

/** Does this scenario drop in-flight work? */
export function dropsInFlight(s: ShutdownScenario): boolean {
  return finalDropped(s) > 0;
}

/** Requests dropped by the end of the scenario. */
export function finalDropped(s: ShutdownScenario): number {
  return s.steps[s.steps.length - 1].dropped;
}
