/* Render the 1200×630 social card → public/og.png  (satori → resvg, no browser).
   One-off build tool, NOT part of the app build. Regenerate with:
     cd scripts/ogtools && npm install
     node scripts/ogtools/render.mjs
   Fonts: @fontsource *.woff (satori accepts ttf/otf/woff — not woff2).            */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FS = path.join(here, "node_modules/@fontsource");
const ff = (pkg, file) => fs.readFileSync(path.join(FS, pkg, "files", file));
const fonts = [
  { name: "Inter", data: ff("inter", "inter-latin-400-normal.woff"), weight: 400, style: "normal" },
  { name: "Inter", data: ff("inter", "inter-latin-600-normal.woff"), weight: 600, style: "normal" },
  { name: "SG", data: ff("space-grotesk", "space-grotesk-latin-700-normal.woff"), weight: 700, style: "normal" },
  { name: "JBM", data: ff("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff"), weight: 500, style: "normal" },
];

const C = { bg: "#0A0C0A", tx: "#F4F7F4", tx2: "#9CB3A0", dim: "#6B7B6E", green: "#6CC24A", bright: "#4ADE80", deep: "#3C873A" };

const chip = (t) =>
  `<div style="display:flex;align-items:center;border:1px solid ${C.deep};border-radius:999px;padding:9px 20px;margin-right:14px;font-size:23px;color:${C.bright};">${t}</div>`;

const markup = html(`
<div style="display:flex;flex-direction:column;width:1200px;height:630px;background-color:${C.bg};background-image:radial-gradient(1000px 520px at 80% -18%, rgba(108,194,74,0.18), rgba(10,12,10,0) 62%);padding:60px 72px;font-family:Inter;">

  <div style="display:flex;align-items:center;">
    <div style="display:flex;width:12px;height:12px;border-radius:7px;background:${C.green};margin-right:15px;"></div>
    <div style="display:flex;font-family:JBM;font-size:22px;letter-spacing:5px;color:${C.green};">SENIOR / STAFF · INTERACTIVE DEEP-DIVE</div>
    <div style="display:flex;margin-left:auto;">
      <svg width="60" height="60" viewBox="0 0 32 32">
        <path d="M16 4.2 L26.2 10.1 L26.2 21.9 L16 27.8 L5.8 21.9 L5.8 10.1 Z" fill="${C.green}"></path>
        <path d="M16 9.1 L21.95 12.55 L21.95 19.45 L16 22.9 L10.05 19.45 L10.05 12.55 Z" fill="${C.bg}"></path>
        <circle cx="16" cy="16" r="2.6" fill="${C.bright}"></circle>
      </svg>
    </div>
  </div>

  <div style="display:flex;flex-direction:column;flex:1;justify-content:center;">
    <div style="display:flex;font-family:SG;font-weight:700;font-size:86px;line-height:1.02;color:${C.tx};">Node.js</div>
    <div style="display:flex;font-family:SG;font-weight:700;font-size:86px;line-height:1.06;color:${C.green};">Comprehensive Guide</div>
    <div style="display:flex;font-size:30px;color:${C.tx2};margin-top:26px;max-width:1010px;line-height:1.4;">How the runtime really works — event loop, V8 & GC, async, streams, concurrency, HTTP internals — with live simulators.</div>
    <div style="display:flex;margin-top:32px;">
      ${chip("20 chapters")}${chip("15 simulators")}${chip("interview bank")}${chip("flashcards")}
    </div>
  </div>

  <div style="display:flex;align-items:center;">
    <div style="display:flex;flex-direction:column;width:32px;height:21px;border-radius:3px;overflow:hidden;margin-right:14px;">
      <div style="display:flex;flex:1;background:#0057B7;"></div>
      <div style="display:flex;flex:1;background:#FFD700;"></div>
    </div>
    <div style="display:flex;font-size:24px;color:${C.tx};font-weight:600;flex-shrink:0;">Vasyl Krupka</div>
    <div style="display:flex;font-size:24px;color:${C.dim};margin-left:11px;flex-shrink:0;">· Senior Fullstack Engineer</div>
    <div style="display:flex;margin-left:auto;font-family:JBM;font-size:21px;color:${C.dim};flex-shrink:0;">endorrfin.github.io</div>
  </div>

</div>`);

const svg = await satori(markup, { width: 1200, height: 630, fonts });
const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
const out = path.join(here, "..", "..", "public", "og.png");
fs.writeFileSync(out, png);
console.log("wrote", path.relative(path.join(here, "..", ".."), out), png.length, "bytes");
