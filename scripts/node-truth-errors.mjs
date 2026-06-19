/* Ground truth for the error-propagation engine: run each scenario as its OWN
   child process (so a crash can't take this script down) and record the exit
   code. caught/swallowed cases exit 0; uncaughtException and unhandledRejection
   crash with a non-zero code by default. The engine's `survives` field must
   match (survives === (exitCode === 0)).
   Run: node scripts/node-truth-errors.mjs                                      */
import { spawnSync } from "node:child_process";

// Each snippet is run with `node -e` (CommonJS), exactly the scenario's shape.
const CASES = [
  { id: "sync-caught", code: `try { throw new Error('x'); } catch (e) { process.exit(0); }` },
  { id: "timeout-throw", code: `try { setTimeout(() => { throw new Error('x'); }, 0); } catch (e) {}` },
  { id: "await-caught", code: `(async () => { try { await Promise.reject(new Error('x')); } catch (e) { process.exit(0); } })();` },
  { id: "floating-reject", code: `Promise.reject(new Error('x')); setTimeout(() => process.exit(0), 50);` },
  { id: "errfirst-ignored", code: `require('node:fs').readFile('does-not-exist', (err, data) => { process.exit(0); });` },
  { id: "emitter-error", code: `const { EventEmitter } = require('node:events'); new EventEmitter().emit('error', new Error('x'));` },
];

const out = [];
for (const c of CASES) {
  const r = spawnSync(process.execPath, ["-e", c.code], { encoding: "utf8" });
  out.push({ id: c.id, exitCode: r.status, survives: r.status === 0 });
}

console.log(`node ${process.version}`);
console.table(out);
console.log(JSON.stringify(out));
