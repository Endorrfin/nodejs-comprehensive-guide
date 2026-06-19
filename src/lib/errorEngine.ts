/* ===========================================================================
   Error-propagation engine — the interactive for Ch.12 (Error handling).
   It traces an error from where it is thrown/rejected to where it lands, and
   states whether the PROCESS survives. The whole lesson is that try/catch only
   guards the SYNCHRONOUS call stack: cross a tick (timer, unhandled promise,
   EventEmitter 'error') and the surrounding catch is already gone.

   Four outcomes a thrown/rejected error can reach:
     • caught              — a try/catch or .catch() on the SAME stack handles it
     • swallowed           — an err-first callback's `err` is silently ignored
     • uncaughtException   — nothing on the stack handled it → process crashes (exit 1)
     • unhandledRejection  — a floating promise rejects → process crashes (exit 1, Node ≥15)

   Pure & deterministic. The outcome/survives table is anchored to REAL Node:
   scripts/node-truth-errors.mjs forks a child per snippet and records its exit
   code; scripts/test-errors.ts asserts this table AND live-verifies the routing
   (sync/await caught here; timer-throw → uncaughtException; floating →
   unhandledRejection; EventEmitter 'error' throws) on the running runtime.
   =========================================================================== */

export type ErrOutcome = "caught" | "swallowed" | "uncaughtException" | "unhandledRejection";

/** Visual/semantic state of the error at a given step. */
export type ErrState = "throw" | "travel" | "caught" | "escaped" | "fatal";

export interface ErrStep {
  /** 1-based line of `scenario.code` to highlight while this step is active. */
  line: number;
  /** Short mono headline. */
  title: string;
  /** One sentence: what happens to the error here. */
  detail: string;
  state: ErrState;
}

export interface ErrScenario {
  id: string;
  /** Tab label. */
  title: string;
  /** Short context tag shown by the code. */
  context: string;
  /** The snippet, one statement per line (lines are 1-based for ErrStep.line). */
  code: string;
  outcome: ErrOutcome;
  /** Does the Node process keep running after this? */
  survives: boolean;
  steps: ErrStep[];
  takeaway: string;
  /** The senior fix — present for every non-caught case. */
  fix?: string;
}

const syncCaught: ErrScenario = {
  id: "sync-caught",
  title: "Sync throw",
  context: "synchronous — inside try/catch",
  code: `try {
  throw new Error('boom');     // thrown on THIS call stack
} catch (err) {
  report(err);                 // caught — same stack, still in scope
}`,
  outcome: "caught",
  survives: true,
  takeaway:
    "A synchronous throw unwinds the current call stack, so an enclosing try/catch on that same stack catches it. This is the only case where try/catch just works — because nothing crossed a tick.",
  steps: [
    { line: 2, title: "throw new Error()", detail: "The error is thrown synchronously, on the call stack the try block is running.", state: "throw" },
    { line: 2, title: "stack unwinds", detail: "Execution unwinds frame by frame, looking for the nearest catch on this stack.", state: "travel" },
    { line: 3, title: "catch (err)", detail: "The enclosing catch is still on the stack, so it receives the error.", state: "caught" },
    { line: 4, title: "handled — process lives", detail: "You report/translate the error and execution continues. Nothing crossed an async boundary.", state: "caught" },
  ],
};

const timeoutThrow: ErrScenario = {
  id: "timeout-throw",
  title: "throw in setTimeout",
  context: "async — try/catch can't reach it",
  code: `try {
  setTimeout(() => {
    throw new Error('boom');   // runs LATER, in the timers phase
  }, 0);
} catch (err) {
  // never runs — try already returned on tick 0
}`,
  outcome: "uncaughtException",
  survives: false,
  takeaway:
    "try/catch guards only the synchronous call stack. setTimeout returns immediately, the try block exits, and the callback throws on a LATER tick with an empty stack — so the catch is long gone. The error reaches 'uncaughtException' and crashes the process (exit 1).",
  fix: "Put the try/catch INSIDE the callback, or wrap the work in a promise and await it. For a last-resort backstop, process.on('uncaughtException') should log and exit — not resume.",
  steps: [
    { line: 2, title: "setTimeout(cb, 0)", detail: "The timer is registered and returns immediately; the try block finishes normally.", state: "travel" },
    { line: 6, title: "try block exits", detail: "The synchronous stack is empty. The catch on line 6 is no longer on any stack.", state: "travel" },
    { line: 3, title: "cb throws (timers phase)", detail: "On a later tick the callback runs and throws — with nothing above it on the stack.", state: "throw" },
    { line: 3, title: "→ uncaughtException", detail: "No catch is reachable, so the error becomes a process-level 'uncaughtException'.", state: "escaped" },
    { line: 3, title: "process crashes (exit 1)", detail: "With no safe handler the runtime prints the stack and exits non-zero.", state: "fatal" },
  ],
};

const awaitCaught: ErrScenario = {
  id: "await-caught",
  title: "await reject",
  context: "async/await — inside try/catch",
  code: `async function load() {
  try {
    await Promise.reject(new Error('boom'));
  } catch (err) {
    report(err);               // caught — await re-threads it here
  }
}`,
  outcome: "caught",
  survives: true,
  takeaway:
    "await is the bridge back to try/catch: a rejected awaited promise is re-thrown at the await point, on the async function's logical stack, so the surrounding catch handles it. This is why async/await beats raw callbacks for error handling.",
  steps: [
    { line: 3, title: "await Promise.reject()", detail: "The awaited promise rejects; await turns that rejection back into a throw at this point.", state: "throw" },
    { line: 3, title: "re-thrown at the await", detail: "The rejection resurfaces on the async function's resumed stack — the try is still in scope.", state: "travel" },
    { line: 4, title: "catch (err)", detail: "The enclosing catch receives the error, exactly as if it were synchronous.", state: "caught" },
    { line: 5, title: "handled — process lives", detail: "await re-threaded the async failure onto a stack the catch could see.", state: "caught" },
  ],
};

const floatingReject: ErrScenario = {
  id: "floating-reject",
  title: "Floating promise",
  context: "async — never awaited, never .catch()",
  code: `function handler() {
  saveToDb(record);            // returns a promise — NOT awaited
}                              // no .catch(), no await
// saveToDb rejects → the rejection has nowhere to go`,
  outcome: "unhandledRejection",
  survives: false,
  takeaway:
    "A promise you neither await nor .catch() is a 'floating' promise. When it rejects there is no handler anywhere, so the rejection becomes 'unhandledRejection' — which since Node 15 terminates the process by default (exit 1).",
  fix: "await the call inside a try/catch, attach .catch(), or collect it into Promise.all. Lint with no-floating-promises. Treat process.on('unhandledRejection') as a crash-and-restart backstop, not a strategy.",
  steps: [
    { line: 2, title: "saveToDb(record)", detail: "The async call starts and returns a pending promise — but the result is discarded.", state: "travel" },
    { line: 3, title: "handler returns", detail: "No await and no .catch(): nothing is subscribed to the promise's outcome.", state: "travel" },
    { line: 4, title: "promise rejects", detail: "Later the DB call fails and the promise rejects with no handler attached.", state: "throw" },
    { line: 4, title: "→ unhandledRejection", detail: "The rejection surfaces as a process-level 'unhandledRejection'.", state: "escaped" },
    { line: 4, title: "process crashes (exit 1)", detail: "Since Node 15 the default for an unhandled rejection is to terminate the process.", state: "fatal" },
  ],
};

const errFirstIgnored: ErrScenario = {
  id: "errfirst-ignored",
  title: "Ignored err-first",
  context: "callback — error delivered, not thrown",
  code: `db.query(sql, (err, rows) => {
  // forgot to check err
  render(rows);                // rows is undefined; err silently dropped
});`,
  outcome: "swallowed",
  survives: true,
  takeaway:
    "Node's classic callbacks deliver the error as the first ARGUMENT — they don't throw. Ignore err and there's no exception and no crash: just a silent bug (wrong/empty data, a missing branch). The most dangerous outcome, because nothing tells you.",
  fix: "Handle err on the first line of every callback (if (err) return cb(err)), or — better — promisify the API and await it inside try/catch so errors can't be silently dropped.",
  steps: [
    { line: 1, title: "db.query(sql, cb)", detail: "The async op fails, but an err-first API reports failure by CALLING cb(err, …), not by throwing.", state: "throw" },
    { line: 2, title: "err never inspected", detail: "The callback ignores its first argument, so the failure is never noticed.", state: "travel" },
    { line: 3, title: "render(rows) with no data", detail: "rows is undefined; the program continues on a false assumption. No exception is raised.", state: "escaped" },
    { line: 3, title: "swallowed — silent bug", detail: "The process survives, but behaves incorrectly. There is no stack trace to find later.", state: "escaped" },
  ],
};

const emitterNoListener: ErrScenario = {
  id: "emitter-error",
  title: "EventEmitter 'error'",
  context: "events — no 'error' listener",
  code: `const server = net.createServer();
server.listen(80);             // e.g. EACCES / EADDRINUSE
// no server.on('error', ...) attached
// → the 'error' event is emitted with no listener`,
  outcome: "uncaughtException",
  survives: false,
  takeaway:
    "EventEmitter special-cases 'error': if an 'error' event is emitted and there is NO listener, the emitter THROWS the error synchronously. With no try/catch around the emit, that becomes 'uncaughtException' and crashes the process. Always attach an 'error' listener to sockets, streams and servers.",
  fix: "Attach server.on('error', handler) (and the same on every stream/socket). An unlistened 'error' is the most common surprise crash in Node networking code.",
  steps: [
    { line: 2, title: "server.listen(80)", detail: "Binding fails (permission or port in use); the server emits an 'error' event.", state: "travel" },
    { line: 3, title: "no 'error' listener", detail: "Nothing is subscribed to 'error' on this emitter.", state: "throw" },
    { line: 4, title: "emitter throws", detail: "EventEmitter throws the error synchronously when 'error' has no listener.", state: "escaped" },
    { line: 4, title: "→ uncaughtException → exit 1", detail: "Unguarded, the throw becomes an 'uncaughtException' and terminates the process.", state: "fatal" },
  ],
};

export const ERROR_SCENARIOS: ErrScenario[] = [
  syncCaught,
  timeoutThrow,
  awaitCaught,
  floatingReject,
  errFirstIgnored,
  emitterNoListener,
];

/** Does this error kill the process? */
export function isFatal(s: ErrScenario): boolean {
  return !s.survives;
}

/** Did the error cross an async boundary (i.e. leave the original stack)? */
export function escapesStack(s: ErrScenario): boolean {
  return s.outcome === "uncaughtException" || s.outcome === "unhandledRejection";
}

/** Number of lines in a scenario's code (for bounds checks). */
export function lineCount(s: ErrScenario): number {
  return s.code.split("\n").length;
}
