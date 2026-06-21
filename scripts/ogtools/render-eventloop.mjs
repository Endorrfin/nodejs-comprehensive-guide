/* Render a short event-loop animation → demo/event-loop.mp4 (satori → resvg frames → ffmpeg).
   No browser/screen-capture: each frame is rendered headless, then encoded.
     node scripts/ogtools/render-eventloop.mjs preview   # one frame → demo/_preview.png
     node scripts/ogtools/render-eventloop.mjs            # full render → demo/event-loop.mp4
   Needs: satori, satori-html, @resvg/resvg-js (in this dir's node_modules) + ffmpeg on PATH. */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import satori from "satori";
import { html } from "satori-html";
import { Resvg } from "@resvg/resvg-js";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..", "..");
const FS = path.join(here, "node_modules/@fontsource");
const ff = (pkg, file) => fs.readFileSync(path.join(FS, pkg, "files", file));
const fonts = [
  { name: "Inter", data: ff("inter", "inter-latin-400-normal.woff"), weight: 400, style: "normal" },
  { name: "Inter", data: ff("inter", "inter-latin-600-normal.woff"), weight: 600, style: "normal" },
  { name: "SG", data: ff("space-grotesk", "space-grotesk-latin-700-normal.woff"), weight: 700, style: "normal" },
  { name: "JBM", data: ff("jetbrains-mono", "jetbrains-mono-latin-500-normal.woff"), weight: 500, style: "normal" },
];

const C = { bg: "#0A0C0A", tx: "#F4F7F4", tx2: "#9CB3A0", dim: "#6B7B6E", line2: "#33402F", accent: "#6CC24A", bright: "#4ADE80", micro: "#A78BFA" };
const W = 1280, H = 720, cx = 640, cy = 388, R = 176, NW = 168, NH = 48;
const PHASES = [["1", "timers"], ["2", "pending callbacks"], ["3", "idle / prepare"], ["4", "poll"], ["5", "check"], ["6", "close callbacks"]];
const at = (deg) => { const a = (deg * Math.PI) / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };

function markup(t) {
  const [bx, by] = at(-90 + t * 360);
  const active = Math.round(t * 6) % 6;
  const nodes = PHASES.map(([n, label], i) => {
    const [nx, ny] = at(-90 + i * 60);
    const on = i === active;
    return `<div style="display:flex;align-items:center;gap:8px;justify-content:center;position:absolute;left:${Math.round(nx - NW / 2)}px;top:${Math.round(ny - NH / 2)}px;width:${NW}px;height:${NH}px;border:${on ? 2 : 1}px solid ${on ? C.accent : C.line2};border-radius:11px;background:${on ? "#13260f" : "#111511"};">
      <div style="display:flex;font-family:JBM;font-size:15px;color:${C.accent};">${n}</div>
      <div style="display:flex;font-family:SG;font-weight:700;font-size:15px;color:${on ? C.tx : C.tx2};">${label}</div>
    </div>`;
  }).join("");

  return html(`<div style="display:flex;position:relative;width:${W}px;height:${H}px;background-color:${C.bg};background-image:radial-gradient(900px 460px at 82% -16%, rgba(108,194,74,0.16), rgba(10,12,10,0) 60%);font-family:Inter;">
    <div style="display:flex;position:absolute;left:${cx - R}px;top:${cy - R}px;width:${2 * R}px;height:${2 * R}px;border:1.5px dashed #2b3a28;border-radius:${R}px;"></div>
    <div style="display:flex;position:absolute;left:${cx - 84}px;top:${cy - 84}px;width:168px;height:168px;border:1px solid #33402f;border-radius:84px;background:#0d120c;"></div>
    <div style="display:flex;align-items:center;gap:13px;position:absolute;left:54px;top:40px;">
      <svg width="38" height="38" viewBox="0 0 32 32"><path d="M16 4.2 L26.2 10.1 L26.2 21.9 L16 27.8 L5.8 21.9 L5.8 10.1 Z" fill="#6CC24A"></path><path d="M16 9.1 L21.95 12.55 L21.95 19.45 L16 22.9 L10.05 19.45 L10.05 12.55 Z" fill="#0A0C0A"></path><circle cx="16" cy="16" r="2.6" fill="#4ADE80"></circle></svg>
      <div style="display:flex;font-family:SG;font-weight:700;font-size:24px;color:${C.tx};">Node.js</div>
      <div style="display:flex;font-family:SG;font-weight:700;font-size:24px;color:${C.accent};">Comprehensive Guide</div>
    </div>
    <div style="display:flex;position:absolute;right:56px;top:49px;font-family:JBM;font-size:13px;letter-spacing:3px;color:${C.accent};">THE EVENT LOOP</div>
    ${nodes}
    <div style="display:flex;flex-direction:column;align-items:center;position:absolute;left:${cx - 95}px;top:${cy - 30}px;width:190px;">
      <div style="display:flex;font-family:SG;font-weight:700;font-size:18px;color:${C.tx};">EVENT LOOP</div>
      <div style="display:flex;font-family:JBM;font-size:11px;color:${C.accent};margin-top:3px;">libuv · 1 thread</div>
      <div style="display:flex;font-family:JBM;font-size:10px;color:${C.micro};margin-top:2px;">↻ microtasks drain</div>
    </div>
    <div style="display:flex;position:absolute;left:${Math.round(bx - 9)}px;top:${Math.round(by - 9)}px;width:18px;height:18px;border-radius:9px;background:#4ADE80;box-shadow:0 0 14px rgba(74,222,128,0.95);"></div>
    <div style="display:flex;flex-direction:column;align-items:center;position:absolute;left:0;right:0;bottom:42px;">
      <div style="display:flex;font-size:18px;color:${C.tx2};">Six phases per tick, one thread — microtasks drain between every callback.</div>
      <div style="display:flex;gap:14px;margin-top:11px;font-family:JBM;font-size:13px;">
        <div style="display:flex;color:${C.accent};">endorrfin.github.io/nodejs-comprehensive-guide</div>
        <div style="display:flex;color:${C.dim};">· 20 chapters · 15 simulators</div>
      </div>
    </div>
  </div>`);
}

async function png(t) {
  const svg = await satori(markup(t), { width: W, height: H, fonts });
  return new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng();
}

const mode = process.argv[2];
if (mode === "preview") {
  fs.writeFileSync(path.join(root, "demo", "_preview.png"), await png(0.34));
  console.log("wrote demo/_preview.png");
} else {
  const N = 96, FPS = 24;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "elf-"));
  process.stdout.write(`rendering ${N} frames`);
  for (let f = 0; f < N; f++) {
    fs.writeFileSync(path.join(dir, `f_${String(f).padStart(4, "0")}.png`), await png(f / N));
    if (f % 12 === 0) process.stdout.write(".");
  }
  process.stdout.write("\nencoding…\n");
  const out = path.join(root, "demo", "event-loop.mp4");
  execSync(`ffmpeg -y -framerate ${FPS} -i ${dir}/f_%04d.png -c:v libx264 -pix_fmt yuv420p -crf 23 -movflags +faststart ${out}`, { stdio: "ignore" });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log("wrote demo/event-loop.mp4", (fs.statSync(out).size / 1024).toFixed(0), "KB");
}
