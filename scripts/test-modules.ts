/* Correctness check for the module-loading engine.
   Run: node --experimental-strip-types scripts/test-modules.ts
   Asserts the engine matches real Node 22 (scripts/node-truth-modules.mjs):
   both CJS and ESM evaluate the diamond post-order [base,left,right,app] with
   `base` run exactly once; and that the engine captures the structural
   DIFFERENCE — CJS interleaves resolution with evaluation, while ESM completes
   parse + link for the whole graph before any body evaluates. */
import { DIAMOND, simulate, evalOrder } from "../src/lib/moduleEngine.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const TRUTH = ["base", "left", "right", "app"]; // captured from real Node 22
const eqJoin = (a: string[]) => a.join(",");

// 1) Evaluation order matches Node for BOTH systems
const cjsOrder = evalOrder(DIAMOND, "cjs");
const esmOrder = evalOrder(DIAMOND, "esm");
ok("CJS eval order = [base,left,right,app] (Node truth)", eqJoin(cjsOrder) === eqJoin(TRUTH), `got [${cjsOrder}]`);
ok("ESM eval order = [base,left,right,app] (Node truth)", eqJoin(esmOrder) === eqJoin(TRUTH), `got [${esmOrder}]`);

// 2) `base` (the diamond's shared dep) evaluates exactly once in each
const once = (order: string[], id: string) => order.filter((x) => x === id).length === 1;
ok("CJS evaluates base exactly once (cache hit on the 2nd require)", once(cjsOrder, "base"));
ok("ESM evaluates base exactly once", once(esmOrder, "base"));

// 3) CJS INTERLEAVES: the first evaluate happens before the last resolve
const cjs = simulate(DIAMOND, "cjs");
const firstEvalCjs = cjs.findIndex((f) => f.event === "evaluate");
const lastResolveCjs = cjs.map((f) => f.event).lastIndexOf("resolve");
ok("CJS interleaves resolve + evaluate (1st eval before last resolve)", firstEvalCjs < lastResolveCjs, `eval@${firstEvalCjs} resolve@${lastResolveCjs}`);
ok("CJS has a cache-hit for the shared base", cjs.some((f) => f.event === "cache-hit" && f.cacheHit === "base"));

// 4) ESM SEPARATES phases: no evaluate until all parse + link are done
const esm = simulate(DIAMOND, "esm");
const firstEvalEsm = esm.findIndex((f) => f.event === "evaluate");
const lastParseEsm = esm.map((f) => f.event).lastIndexOf("parse");
const lastLinkEsm = esm.map((f) => f.event).lastIndexOf("link");
ok("ESM parses whole graph before any evaluation", lastParseEsm < firstEvalEsm, `lastParse@${lastParseEsm} firstEval@${firstEvalEsm}`);
ok("ESM links whole graph before any evaluation", lastLinkEsm < firstEvalEsm, `lastLink@${lastLinkEsm} firstEval@${firstEvalEsm}`);
ok("ESM parses base exactly once", esm.filter((f) => f.event === "parse" && f.active === "base").length === 1);

// 5) both fully evaluate every node
ok("CJS evaluates all 4 modules", cjsOrder.length === DIAMOND.nodes.length, `${cjsOrder.length}`);
ok("ESM evaluates all 4 modules", esmOrder.length === DIAMOND.nodes.length, `${esmOrder.length}`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
