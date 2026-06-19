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
  "#/chapter/concurrency",
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

console.log(ok ? "\nSMOKE OK" : "\nSMOKE FAILED");
process.exit(ok ? 0 : 1);
