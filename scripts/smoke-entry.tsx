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
  "#/chapter/what-is-node",
  "#/chapter/strengths",
  "#/chapter/weaknesses",
  "#/chapter/competitors",
  "#/chapter/architecture",
  "#/chapter/event-loop",
  "#/chapter/async-model",
  "#/chapter/v8-gc",
  "#/chapter/concurrency",
  "#/chapter/streams",
  "#/chapter/modules",
  "#/chapter/errors",
  "#/chapter/http",
  "#/chapter/performance",
  "#/chapter/security",
  "#/chapter/production",
  "#/chapter/express",
  "#/chapter/modern-node",
  "#/chapter/summary",
  "#/interview",
  "#/mental-models",
  "#/flashcards",
  "#/atlas", // CHANGED: S14
  "#/about",
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

// ---- S5 Foundations (Ch.1–5): content + new figures/sims ----------------
const wn = render("#/chapter/what-is-node");
for (const must of ["What is Node.js", "Runtime, not framework", "OpenJS", "non-blocking", "process.versions"]) {
  const has = wn.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} what-is-node contains "${must}"`);
}

const str = render("#/chapter/strengths");
for (const must of ["C10k", "Connection-scaling simulator", "concurrent connections", "sweet spot", "one language"]) {
  const has = str.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} strengths contains "${must}"`);
}

const weak = render("#/chapter/weaknesses");
for (const must of ["blocking the loop", "ReDoS", "event-loop lag", "worker_thread", "p99"]) {
  const has = weak.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} weaknesses contains "${must}"`);
}

const comp = render("#/chapter/competitors");
for (const must of ["Deno", "Bun", "JavaScriptCore", "Pick a runtime by your bottleneck", "GIL", "Elixir"]) {
  const has = comp.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} competitors contains "${must}"`);
}

const arch = render("#/chapter/architecture");
for (const must of ["V8 is not Node", "libuv", "Architecture trace-a-call simulator", "llhttp", "process.versions"]) {
  const has = arch.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} architecture contains "${must}"`);
}

// ---- S6 Real systems A (Ch.12 Errors, Ch.13 HTTP): content + sims/figures ----
const err = render("#/chapter/errors");
for (const must of ["Error handling", "operational", "Error propagation simulator", "unhandledRejection", "AsyncLocalStorage", "EventEmitter"]) {
  const has = err.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} errors contains "${must}"`);
}

const httpc = render("#/chapter/http");
for (const must of ["HTTP internals", "llhttp", "HTTP request lifecycle simulator", "keepAliveTimeout", "headersTimeout", "keep-alive"]) {
  const has = httpc.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} http contains "${must}"`);
}

// ---- S7 Real systems B (Ch.14 Performance, Ch.15 Security, Ch.16 Production) ----
const perf = render("#/chapter/performance");
for (const must of ["profiling", "Event-loop lag simulator", "monitorEventLoopDelay", "flamegraph", "worker_threads", "utilization"]) {
  const has = perf.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} performance contains "${must}"`);
}

const sec = render("#/chapter/security");
for (const must of ["transitive", "Supply-chain defense simulator", "Permission Model", "provenance", "--allow-fs-read", "lockfile"]) {
  const has = sec.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} security contains "${must}"`);
}

const prod = render("#/chapter/production");
for (const must of ["Graceful shutdown simulator", "SIGTERM", "server.close", "readiness", "drain", "closeIdleConnections"]) {
  const has = prod.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} production contains "${must}"`);
}

// ---- S11 (Ch.17 Express): pipeline figure + hero sim + quiz -----------------
const ex = render("#/chapter/express");
for (const must of [
  "Express",
  "middleware pipeline simulator",
  "registration order",
  "error middleware",
  "unhandledRejection",
  "Fastify",
  "Predict the output",
]) {
  const has = ex.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} express contains "${must}"`);
}

// ---- S12 visual pass I: syntax highlighting + numbered figure anchors -------
// event-loop has js code w/ comments+strings+calls and a figure → assert both
// features land in SSR HTML (spans with hl-* classes, Fig. caption, #fig-N).
for (const must of ['class="hl-cm"', 'class="hl-str"', 'class="hl-fn"', 'class="hl-num"', 'id="fig-1"', "Fig. 1"]) {
  const has = el.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} event-loop (S12) contains '${must}'`);
}
// bash highlighting (security ch. has the --permission bash block)
const secHl = render("#/chapter/security");
for (const must of ['class="hl-fn"', 'class="hl-cm"']) {
  const has = secHl.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} security (S12) contains '${must}'`);
}
// modules now carries its module-load-compare figure in-body (was fig-less)
for (const must of ['id="fig-1"', "different timing", 'class="hl-kw"']) {
  const has = md.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} modules (S12) contains '${must}'`);
}

// ---- S13 visual pass II: living-figure tokens present in the figure SVGs ----
// (classes only — the motion itself lives in CSS keyframes, not in SSR output)
for (const [name, html, cls] of [
  ["express", ex, "mp-token"],
  ["streams", st, "sp-chunk"],
  ["http", httpc, "ka-dot"],
  ["concurrency", cc, "tpk-task"],
  ["production", prod, "sd-progress"],
] as const) {
  const has = html.includes(cls);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} ${name} (S13) figure carries living token "${cls}"`);
}

// ---- S8 Mastery (now Ch.18 Modern Node, Ch.21 Summary) + study features --------
const mn = render("#/chapter/modern-node");
for (const must of ["Modern Node", "Active LTS", "type stripping", "Permission Model", "require(esm)", "Node 27"]) {
  const has = mn.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} modern-node contains "${must}"`);
}

const sm = render("#/chapter/summary");
for (const must of ["whole picture", "never block the thread", "Six event-loop phases", "Plays to its strength", "draw it from memory"]) {
  const has = sm.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} summary contains "${must}"`);
}

const mm = render("#/mental-models");
for (const must of ["Mental models", "The six event-loop phases", "The four error channels", "release-line lifecycle", "Reveal"]) {
  const has = mm.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} mental-models contains "${must}"`);
}

const iv = render("#/interview");
for (const must of ["interview bank", "Search questions", "All topics", "senior/staff questions"]) {
  const has = iv.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} interview contains "${must}"`);
}

const fc = render("#/flashcards");
for (const must of ["Flashcards", "Active recall", "Show answer", "Got it", "All parts"]) {
  const has = fc.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} flashcards contains "${must}"`);
}

// CHANGED: S15 — map: grid|graph toggle + theme switch render; weaknesses: the
// block-the-loop sim is embedded (slider label + stat present in SSR markup)
const mp = render("#/map");
for (const must of ["Graph — how chapters connect", "themeseg", "System theme"]) {
  const has = mp.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} map contains "${must}"`);
}
const wk = render("#/chapter/weaknesses");
for (const must of ["Block-the-loop simulator", "the one synchronous call", "p99 of everyone else"]) {
  const has = wk.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} weaknesses contains "${must}"`);
}

// CHANGED: S14 — atlas: the wall renders every figure card with title, chip and
// PNG-export button. (Assertions avoid interpolated numbers — SSR inserts
// comment markers around them — and apostrophes, which React escapes.)
const at = render("#/atlas");
for (const must of [
  "Figure atlas",
  "diagrams of the guide on one wall",
  "⤓ PNG",
  "The architecture layer cake", // card title from a mental-model card
  "Timeout triad", // humanized title (figure without a model card)
  "atlas-chip", // owning-chapter chip present
]) {
  const has = at.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} atlas contains "${must}"`);
}

const ab = render("#/about");
// (React escapes apostrophes in SSR output, so assert on apostrophe-free strings)
for (const must of ["About this guide", "What it is", "Truth-first", "Vasyl Krupka", "LinkedIn"]) {
  const has = ab.includes(must);
  ok &&= has;
  console.log(`${has ? "PASS" : "FAIL"} about contains "${must}"`);
}

console.log(ok ? "\nSMOKE OK" : "\nSMOKE FAILED");
process.exit(ok ? 0 : 1);
