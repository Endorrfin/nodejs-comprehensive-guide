/* Ground truth for the async-ordering engine: run the REAL programs the engine
   models, in real Node, and print their console output. The engine's SCENARIOS
   `expected` arrays must equal these. Run: node scripts/node-truth-async.mjs
   (NOTE: run with CommonJS semantics — these snippets assume the canonical
   "main script" ordering; see the chapter's ESM pitfall.) */
import { spawnSync } from "node:child_process";

const programs = {
  "micro-macro": `
console.log('1: sync start');
setImmediate(() => console.log('6: setImmediate (macro)'));
Promise.resolve().then(() => console.log('4: promise.then (micro)'));
queueMicrotask(() => console.log('5: queueMicrotask (micro)'));
process.nextTick(() => console.log('3: nextTick (micro)'));
console.log('2: sync end');`,
  "await-suspends": `
console.log('1: sync start');
setTimeout(() => console.log('5: setTimeout (macro)'), 0);
async function run() {
  console.log('2: async — sync part');
  await null;
  console.log('4: after await (micro)');
}
run();
console.log('3: sync end');`,
  interleave: `
async function a() { console.log('a1'); await null; console.log('a2'); await null; console.log('a3'); }
async function b() { console.log('b1'); await null; console.log('b2'); }
console.log('start'); a(); b(); console.log('end');`,
};

for (const [id, src] of Object.entries(programs)) {
  // force CommonJS evaluation so process.nextTick keeps its canonical priority
  const r = spawnSync(process.execPath, ["--input-type=commonjs", "-e", src], { encoding: "utf8" });
  const out = r.stdout.trim().split("\n");
  console.log(`${id}: [${out.join(" | ")}]`);
}
