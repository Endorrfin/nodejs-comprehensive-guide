/* Generate static, self-contained HTML previews (design only — no JS interactivity)
   so the result is viewable without a dev server.
   Build: vite build --ssr scripts/preview-entry.tsx --outDir scripts/ssr
   Run:   node scripts/ssr/preview-entry.js                                       */
import { renderToString } from "react-dom/server";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import App from "../src/App";

function render(hash: string): string {
  (globalThis as unknown as { location: { hash: string } }).location = { hash };
  (globalThis as unknown as { window: unknown }).window = globalThis;
  return renderToString(<App />);
}

const root = process.cwd();
const cssDir = join(root, "dist/assets");
const cssFile = readdirSync(cssDir).find((f) => f.endsWith(".css"));
const css = cssFile ? readFileSync(join(cssDir, cssFile), "utf8") : "";

const FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">';

function page(title: string, hash: string): string {
  const body = render(hash);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>${FONTS}<style>${css}</style></head><body><div style="position:sticky;top:0;z-index:99;background:#13260f;color:#cfe6c6;font:12px/1.5 'JetBrains Mono',monospace;padding:7px 14px;border-bottom:1px solid #33402f">STATIC PREVIEW — design only. Run <b>npm run dev</b> for the live simulator (step / play / pause).</div><div id="root">${body}</div></body></html>`;
}

writeFileSync(join(root, "preview-map.html"), page("Preview — Concept map", "#/map"));
writeFileSync(join(root, "preview-eventloop.html"), page("Preview — Event Loop", "#/chapter/event-loop"));
console.log("wrote preview-map.html and preview-eventloop.html");
