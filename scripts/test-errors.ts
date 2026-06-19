/* Correctness checks for the error-propagation engine.
   Run: node --experimental-strip-types scripts/test-errors.ts

   Two layers:
   (1) the engine's outcome/survives table matches what real Node does — these
       values were captured by scripts/node-truth-errors.mjs (exit codes):
         sync-caught 0 · timeout-throw 1 · await-caught 0 ·
         floating-reject 1 · errfirst-ignored 0 · emitter-error 1
   (2) LIVE routing on THIS runtime: sync & awaited throws are caught here; a
       throw inside setTimeout escapes the surrounding try/catch and reaches
       'uncaughtException'; a floating rejection reaches 'unhandledRejection';
       an unlistened EventEmitter 'error' throws synchronously.                 */
import { EventEmitter } from "node:events";
import {
  ERROR_SCENARIOS,
  isFatal,
  escapesStack,
  lineCount,
  type ErrScenario,
  type ErrOutcome,
} from "../src/lib/errorEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};

const get = (id: string): ErrScenario => ERROR_SCENARIOS.find((s) => s.id === id)!;

// ---- (1) Captured-from-real-Node outcome table ---------------------------
const EXPECT: Record<string, { outcome: ErrOutcome; survives: boolean }> = {
  "sync-caught": { outcome: "caught", survives: true },
  "timeout-throw": { outcome: "uncaughtException", survives: false },
  "await-caught": { outcome: "caught", survives: true },
  "floating-reject": { outcome: "unhandledRejection", survives: false },
  "errfirst-ignored": { outcome: "swallowed", survives: true },
  "emitter-error": { outcome: "uncaughtException", survives: false },
};

for (const [id, want] of Object.entries(EXPECT)) {
  const s = get(id);
  check(`${id}: outcome = ${want.outcome}`, s.outcome === want.outcome, `got ${s.outcome}`);
  check(`${id}: survives = ${want.survives}`, s.survives === want.survives);
  check(`${id}: isFatal = ${!want.survives}`, isFatal(s) === !want.survives);
}

// ---- structural invariants ------------------------------------------------
for (const s of ERROR_SCENARIOS) {
  check(`${s.id}: has at least one 'throw' step`, s.steps.some((st) => st.state === "throw"));
  const last = s.steps[s.steps.length - 1];
  if (s.outcome === "caught") check(`${s.id}: ends 'caught'`, last.state === "caught");
  if (s.outcome === "swallowed") check(`${s.id}: ends 'escaped' (swallowed)`, last.state === "escaped");
  if (!s.survives) check(`${s.id}: ends 'fatal'`, last.state === "fatal");
  // crash + swallow cases must carry a senior fix; caught cases need none
  check(`${s.id}: fix present iff not caught`, (s.outcome === "caught") === (s.fix === undefined));
  // every highlighted line is within the snippet
  const n = lineCount(s);
  check(`${s.id}: all step lines in [1,${n}]`, s.steps.every((st) => st.line >= 1 && st.line <= n));
  // escapesStack only for the two process-level crashes
  const shouldEscape = s.outcome === "uncaughtException" || s.outcome === "unhandledRejection";
  check(`${s.id}: escapesStack = ${shouldEscape}`, escapesStack(s) === shouldEscape);
}

// spread: 2 caught, 1 swallowed, 3 fatal (2 uncaughtException + 1 unhandledRejection)
const by = (o: ErrOutcome): number => ERROR_SCENARIOS.filter((s) => s.outcome === o).length;
check("two caught scenarios", by("caught") === 2);
check("one swallowed scenario", by("swallowed") === 1);
check("two uncaughtException scenarios", by("uncaughtException") === 2);
check("one unhandledRejection scenario", by("unhandledRejection") === 1);

// ---- (2) LIVE routing on this Node ---------------------------------------
let syncOk = false;
try {
  throw new Error("s");
} catch {
  syncOk = true;
}
check("live: sync throw caught by try/catch", syncOk);

let awaitOk = false;
try {
  await Promise.reject(new Error("a"));
} catch {
  awaitOk = true;
}
check("live: awaited rejection caught by try/catch", awaitOk);

// throw inside setTimeout: the SURROUNDING try/catch must NOT catch it, and the
// error must surface at process-level 'uncaughtException' (intercepted here so
// the test itself survives).
let siblingCaught = false;
const timerErr: Error = await new Promise<Error>((resolve) => {
  process.once("uncaughtException", (e) => resolve(e as Error));
  try {
    setTimeout(() => {
      throw new Error("timer-boom");
    }, 0);
  } catch {
    siblingCaught = true;
  }
});
check("live: surrounding try/catch did NOT catch the timer throw", siblingCaught === false);
check("live: timer throw reached uncaughtException", timerErr.message === "timer-boom");

// a floating (unawaited, uncaught) rejection reaches 'unhandledRejection'
const rejErr: Error = await new Promise<Error>((resolve) => {
  process.once("unhandledRejection", (reason) => resolve(reason as Error));
  void Promise.reject(new Error("floating-boom"));
});
check("live: floating promise reached unhandledRejection", rejErr.message === "floating-boom");

// EventEmitter special-cases 'error': no listener ⇒ synchronous throw
let emitterThrew = false;
try {
  new EventEmitter().emit("error", new Error("e"));
} catch {
  emitterThrew = true;
}
check("live: EventEmitter 'error' with no listener throws", emitterThrew);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
