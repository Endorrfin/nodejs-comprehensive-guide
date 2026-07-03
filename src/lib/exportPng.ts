/* CHANGED: S14 — per-figure "⤓ PNG" export (inline SVG → canvas → PNG, no deps).
   Produces a branded 2× poster (og.png look: black + Node-green, header title,
   Ukraine-flag footer) from any registered figure, entirely client-side:
     1. clone the live <svg>; STRIP every [class] element — those are exactly the
        S9g/S13 animated tokens whose base state is CSS `opacity:0`; without the
        page stylesheet they'd render as stray dots, and removing them restores
        the original static figure;
     2. embed the three brand fonts as data-URL @font-face (SVG rendered inside
        an <img> cannot fetch external resources) — latin subsets fetched once
        from Google Fonts and cached for the session; on failure the export
        still ships with system fonts;
     3. draw background + brand chrome + the rasterized SVG on a 2× canvas and
        trigger a download.
   Browser-only by design (never runs during SSR — invoked from a click). */

interface ExportMeta {
  key: string; // registry key → download filename
  title: string; // poster headline
  chapterTitle: string; // eyebrow line, with the guide brand
}

const C = {
  bg: "#0A0C0A",
  line: "#243024",
  tx: "#F4F7F4",
  tx2: "#9CB3A0",
  dim: "#6B7B6E",
  green: "#6CC24A",
  bright: "#4ADE80",
} as const;

const FONT_CSS_URL =
  "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700&family=Inter:wght@400;600&family=JetBrains+Mono:wght@400;500&display=swap";

/* ---- fonts: Google css2 → latin-subset woff2 → data-URL @font-face ---------- */

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x2000; // avoid arg-spread stack limits on ~50 kB fonts
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

let embeddedFontCss: Promise<string> | null = null;

async function fetchEmbeddedFontCss(): Promise<string> {
  const css = await (await fetch(FONT_CSS_URL)).text();
  const faces: string[] = [];
  // css2 groups faces by subset comment: "/* latin */\n@font-face { ... }"
  for (const seg of css.split("/* ")) {
    if (!seg.startsWith("latin */")) continue; // latin only (skips latin-ext etc.)
    const fam = seg.match(/font-family: ?'([^']+)'/)?.[1];
    const weight = seg.match(/font-weight: ?(\d+)/)?.[1];
    const url = seg.match(/url\((https:[^)]+?)\) format\('woff2'\)/)?.[1];
    if (!fam || !weight || !url) continue;
    const bin = await (await fetch(url)).arrayBuffer();
    faces.push(
      `@font-face{font-family:'${fam}';font-style:normal;font-weight:${weight};` +
        `src:url(data:font/woff2;base64,${toBase64(bin)}) format('woff2')}`,
    );
  }
  return faces.join("\n");
}

/* ---- svg → standalone rasterizable clone ------------------------------------ */

function standaloneSvg(svg: SVGSVGElement, fontCss: string): { markup: string; w: number; h: number } {
  const vb = svg.viewBox.baseVal;
  const w = vb && vb.width > 0 ? vb.width : 680;
  const h = vb && vb.height > 0 ? vb.height : 360;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  // animated overlay tokens (el-ball / S13) are class-styled with base opacity:0 —
  // outside the page stylesheet they'd appear as frozen stray dots; drop them.
  for (const el of Array.from(clone.querySelectorAll("[class]"))) el.remove();
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(w));
  clone.setAttribute("height", String(h));
  if (fontCss) {
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = fontCss;
    clone.insertBefore(style, clone.firstChild);
  }
  return { markup: new XMLSerializer().serializeToString(clone), w, h };
}

/* ---- brand chrome ------------------------------------------------------------ */

function drawLogo(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  const s = size / 32; // logo path is authored in a 32×32 box (TopBar / og.png)
  const hex = (pts: [number, number][], fill: string): void => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(x + px * s, y + py * s) : ctx.lineTo(x + px * s, y + py * s)));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
  };
  hex([[16, 4.2], [26.2, 10.1], [26.2, 21.9], [16, 27.8], [5.8, 21.9], [5.8, 10.1]], C.green);
  hex([[16, 9.1], [21.95, 12.55], [21.95, 19.45], [16, 22.9], [10.05, 19.45], [10.05, 12.55]], C.bg);
  ctx.beginPath();
  ctx.arc(x + 16 * s, y + 16 * s, 2.4 * s, 0, Math.PI * 2);
  ctx.fillStyle = C.bright;
  ctx.fill();
}

function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = "#0057B7";
  ctx.fillRect(x, y, w, h / 2);
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(x, y + h / 2, w, h / 2);
}

/* ---- main -------------------------------------------------------------------- */

export async function exportFigurePng(svg: SVGSVGElement, meta: ExportMeta): Promise<void> {
  embeddedFontCss ??= fetchEmbeddedFontCss().catch(() => ""); // cache; fall back to system fonts
  const [fontCss] = await Promise.all([embeddedFontCss, document.fonts.ready]);

  const { markup, w: vw, h: vh } = standaloneSvg(svg, fontCss);

  // logical layout (CSS px); rendered at 2× for crisp LinkedIn/retina posters
  const W = 1280;
  const PAD = 56;
  const HEADER = 128;
  const FOOTER = 84;
  const figW = W - PAD * 2;
  const figH = Math.round((figW * vh) / vw);
  const H = HEADER + figH + FOOTER + PAD;
  const SCALE = 2;

  const img = new Image();
  const svgUrl = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml;charset=utf-8" }));
  try {
    img.src = svgUrl;
    await img.decode();

    const canvas = document.createElement("canvas");
    canvas.width = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context unavailable");
    ctx.scale(SCALE, SCALE);

    // background + the og.png radial green glow, top-right
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.8, -H * 0.18, 0, W * 0.8, -H * 0.18, 900);
    glow.addColorStop(0, "rgba(108,194,74,0.16)");
    glow.addColorStop(1, "rgba(10,12,10,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // header: logo · eyebrow (brand — chapter) · figure title · hairline
    drawLogo(ctx, PAD, 34, 40);
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.green;
    ctx.font = "500 13px 'JetBrains Mono', monospace";
    ctx.fillText(`NODE.JS COMPREHENSIVE GUIDE — ${meta.chapterTitle.toUpperCase()}`, PAD + 56, 52);
    ctx.fillStyle = C.tx;
    ctx.font = "700 30px 'Space Grotesk', sans-serif";
    ctx.fillText(meta.title, PAD + 56, 88);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, HEADER - 16);
    ctx.lineTo(W - PAD, HEADER - 16);
    ctx.stroke();

    ctx.drawImage(img, PAD, HEADER, figW, figH);

    // footer: 🇺🇦 flag · author · domain (mirrors og.png)
    const fy = HEADER + figH + 22;
    ctx.beginPath();
    ctx.moveTo(PAD, fy);
    ctx.lineTo(W - PAD, fy);
    ctx.stroke();
    drawFlag(ctx, PAD, fy + 18, 26, 17);
    ctx.fillStyle = C.tx;
    ctx.font = "600 14px 'Inter', sans-serif";
    ctx.fillText("Vasyl Krupka", PAD + 38, fy + 31);
    const nameW = ctx.measureText("Vasyl Krupka").width;
    ctx.fillStyle = C.dim;
    ctx.font = "400 14px 'Inter', sans-serif";
    ctx.fillText("· Senior Fullstack Engineer", PAD + 38 + nameW + 9, fy + 31);
    ctx.font = "400 12.5px 'JetBrains Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText("endorrfin.github.io/nodejs-comprehensive-guide", W - PAD, fy + 31);
    ctx.textAlign = "left";

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png"),
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nodejs-guide_${meta.key}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
