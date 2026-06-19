/* Ground truth for the module-resolver sim (Ch.11 "Modules: CJS vs ESM").
   Builds a tiny diamond dependency graph on a temp dir, twice — once in
   CommonJS, once in ESM — and records the order in which module bodies
   evaluate, plus how a circular dependency is observed.

   The facts the sim must reproduce:
     - CJS require() is SYNCHRONOUS + depth-first; the cache means a shared
       dependency (the diamond's base) evaluates exactly ONCE; a circular
       require sees a PARTIAL (possibly empty) exports object.
     - ESM links the whole graph first, then evaluates depth-first/post-order;
       the shared base still evaluates ONCE; circular imports work via live
       bindings (no partial-object hazard for function/var hoisted bindings).
   Run: node scripts/node-truth-modules.mjs                                    */
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dir = mkdtempSync(join(tmpdir(), "modtruth-"));
const W = (name, src) => writeFileSync(join(dir, name), src);

/* ---- CommonJS diamond: app → {left,right} → base --------------------------- */
W("order.js", "module.exports = [];");
W("base.cjs.js", "const o=require('./order');o.push('base');module.exports={};");
W("left.cjs.js", "require('./base.cjs');const o=require('./order');o.push('left');module.exports={};");
W("right.cjs.js", "require('./base.cjs');const o=require('./order');o.push('right');module.exports={};");
W("app.cjs.js", "require('./left.cjs');require('./right.cjs');const o=require('./order');o.push('app');console.log('CJS eval order:',JSON.stringify(o));");

/* ---- CJS circular: a ⇄ b, b reads a.exports while a is mid-evaluation ----- */
W("a.cjs.js", "exports.done=false;const b=require('./b.cjs');exports.seenByA=b.value;exports.done=true;");
W("b.cjs.js", "const a=require('./a.cjs');module.exports={value:'b',aDoneWhenImported:a.done};");
W("circ.cjs.js", "const a=require('./a.cjs');console.log('CJS circular: b saw a.done =',a.seenByA===undefined?'(a.exports was partial)':a.seenByA);");

await import(pathToFileURL(join(dir, "app.cjs.js")).href);
await import(pathToFileURL(join(dir, "circ.cjs.js")).href);

/* ---- ESM diamond: app → {left,right} → base -------------------------------- */
W("order.mjs", "export const order=[];");
W("base.mjs", "import {order} from './order.mjs';order.push('base');");
W("left.mjs", "import './base.mjs';import {order} from './order.mjs';order.push('left');");
W("right.mjs", "import './base.mjs';import {order} from './order.mjs';order.push('right');");
W("app.mjs", "import './left.mjs';import './right.mjs';import {order} from './order.mjs';order.push('app');console.log('ESM eval order:',JSON.stringify(order));");

await import(pathToFileURL(join(dir, "app.mjs")).href);

/* ---- Live binding (ESM) vs value copy (CJS) -------------------------------- */
W("lib.mjs", "export let count=0;export function inc(){count++;}");
W("liveread.mjs", "import {count,inc} from './lib.mjs';const before=count;inc();console.log('ESM binding: before',before,'after',count,'(LIVE — sees the update)');");
await import(pathToFileURL(join(dir, "liveread.mjs")).href);

W("lib2.cjs.js", "let count=0;function inc(){count++;}module.exports={count,inc};");
W("copyread.cjs.js", "const {count,inc}=require('./lib2.cjs');const before=count;inc();console.log('CJS destructure: before',before,'after',count,'(COPY — stays stale)');");
await import(pathToFileURL(join(dir, "copyread.cjs.js")).href);

/* ---- Circular read at LOAD time: CJS partial (undefined) vs ESM hoisted ---- */
W("ca.cjs.js", "const b=require('./cb.cjs');exports.hi=function(){return 'hi';};console.log('CJS circular: b read a.hi at load time as',JSON.stringify(b.captured),'(PARTIAL exports)');");
W("cb.cjs.js", "const a=require('./ca.cjs');exports.captured=typeof a.hi;");
await import(pathToFileURL(join(dir, "ca.cjs.js")).href);

W("ea.mjs", "import {captured} from './eb.mjs';export function hi(){return 'hi';}console.log('ESM circular: b read a.hi at load time as',JSON.stringify(captured),'(hoisted live binding)');");
W("eb.mjs", "import * as a from './ea.mjs';export const captured=typeof a.hi;");
await import(pathToFileURL(join(dir, "ea.mjs")).href);

rmSync(dir, { recursive: true, force: true });
