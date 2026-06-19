/* SSR smoke test: render every route to an HTML string to catch runtime errors
   (undefined access, bad mapping, registry misses) without a browser.
   Build: vite build --ssr scripts/smoke-entry.tsx --outDir scripts/ssr
   Run:   node scripts/ssr/smoke-entry.js                                       */
import { renderToString } from "react-dom/server";
import App from "../src/App";

function render(hash: string): string {
  (globalThis as unknown as { location: { hash: string } }).location = { hash };
  (globalThis as unknown as { window: unknown }).window = globalThis;
  return renderToString(<App />);
}

const routes = [
  "#/map",
  "#/chapter/event-loop",
  "#/chapter/async-model",
  "#/chapter/v8-gc",
  "#/chapter/concurrency",
  "#/chapter/streams",
  "#/chapter/modules",
  "#/chapter/summary",
  "#/interview",
  "#/mental-models",
];

let ok = true;
for (const r of routes) {
  try {
    const html = render(r);
    const pass = html.length > 200;
    ok &&= pass;
    console.log(`${pass ? "PASS" : "FAIL"} ${r} (${html.length} chars)`);
  } catch (e) {
    ok = false;
    console.log(`FAIL ${r}: ${(e as Error).message}`);
    console.log((e as Error).stack);
  }
}

const el = render("#/chapter/event-loop");
for (const must of ["EVENT LOOP", "console output", "Mental model", "setImmediate", "Key points", "program.js"]) {
  const has = el.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} event-loop contains "${must}"`);
}

// async-model (S2): chapter prose + the async-order sim + the predict-output quiz
const am = render("#/chapter/async-model");
for (const must of [
  "Async model",
  "call stack",
  "microtasks",
  "console output",
  "Predict the output",
  "Promise.all",
  "await suspends the function",
]) {
  const has = am.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} async-model contains "${must}"`);
}

// v8-gc (S3): JIT tiers + the generational-GC figure + the GC sim
const gc = render("#/chapter/v8-gc");
for (const must of [
  "young generation",
  "old generation",
  "Scavenge",
  "Mark-Sweep-Compact",
  "Maglev",
  "hidden class",
  "minor GCs",
]) {
  const has = gc.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} v8-gc contains "${must}"`);
}

// concurrency (S3): the thread-pool-vs-kernel figure + sim + the concurrency quiz
const cc = render("#/chapter/concurrency");
for (const must of [
  "libuv thread pool",
  "UV_THREADPOOL_SIZE",
  "worker_threads",
  "kernel",
  "dns.lookup",
  "Predict the output",
]) {
  const has = cc.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} concurrency contains "${must}"`);
}

// streams (S4): backpressure prose + the pipeline figure + the backpressure sim
const st = render("#/chapter/streams");
for (const must of [
  "highWaterMark",
  "Backpressure simulator",
  "Respect backpressure",
  "pipeline",
  "Readable",
  "Writable",
  "drain",
]) {
  const has = st.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} streams contains "${must}"`);
}

// modules (S4): CJS vs ESM tables + the resolver sim + the modules quiz
const md = render("#/chapter/modules");
for (const must of [
  "CommonJS",
  "ES Modules",
  "Module resolver simulator",
  "require.cache",
  "live",
  "Predict the output",
]) {
  const has = md.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} modules contains "${must}"`);
}

console.log(ok ? "\nSMOKE OK" : "\nSMOKE FAILED");
process.exit(ok ? 0 : 1);
