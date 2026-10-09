/* Content/link integrity QA — no browser, no build. Cross-validates the data
   layer (concepts.ts + interview/mentalModels/quizzes) against the component
   registry and against itself, catching the breakage a static deploy hides:
   dangling seeAlso ids, unregistered sim/figure keys, broken in-prose #/ links,
   malformed sources, off-by-one quiz answers, ragged tables.

   Run: node --experimental-strip-types scripts/qa-integrity.ts                 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { CHAPTERS, GROUPS } from "../src/data/concepts.ts";
import { INTERVIEW } from "../src/data/interview.ts";
import { MODELS } from "../src/data/mentalModels.ts";
import { ANALOGIES } from "../src/data/analogies.ts"; // CHANGED: S16
import { PRINCIPLES } from "../src/data/principles.ts"; // CHANGED: S17
import { GLOSSARY, termSlug } from "../src/data/glossary.ts"; // CHANGED: S17
import { asyncOrderingQuiz, concurrencyQuiz, modulesQuiz, expressQuiz } from "../src/data/quizzes.ts";

const HERE = dirname(fileURLToPath(import.meta.url));

let failures = 0;
let checks = 0;
function check(cond: boolean, msg: string): void {
  checks++;
  if (!cond) {
    failures++;
    console.log(`  FAIL  ${msg}`);
  }
}
function section(name: string): void {
  console.log(`\n• ${name}`);
}

/* ---- parse registry keys from the .tsx (it imports JSX+css; read as text) -- */
function keysOf(src: string, mapName: string): Set<string> {
  const start = src.indexOf(`${mapName}: Record<string, React.FC> = {`);
  if (start === -1) throw new Error(`registry: ${mapName} block not found`);
  const open = src.indexOf("{", start);
  // walk braces to find the matching close
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  const block = src.slice(open + 1, end);
  const keys = new Set<string>();
  const re = /(?:"([^"]+)"|([A-Za-z_][\w$-]*))\s*:/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block))) keys.add(m[1] ?? m[2]);
  return keys;
}
const registrySrc = readFileSync(join(HERE, "../src/lib/registry.tsx"), "utf8");
const SIM_KEYS = keysOf(registrySrc, "SIMS");
const FIG_KEYS = keysOf(registrySrc, "FIGURES");

const chapterIds = new Set(CHAPTERS.map((c) => c.id));
const groupIds = new Set(GROUPS.map((g) => g.id));
// CHANGED: S14 — /atlas
// CHANGED: S17 — /principles, /glossary
const KNOWN_ROUTES = new Set(["/map", "/interview", "/mental-models", "/flashcards", "/atlas", "/principles", "/glossary", "/about"]);

/* track which registry keys actually get referenced (orphan detection) */
const usedSims = new Set<string>();
const usedFigs = new Set<string>();

/* ---- 1. chapter identity ---------------------------------------------------*/
section("Chapter identity (unique ids, contiguous orders, valid groups)");
check(chapterIds.size === CHAPTERS.length, "duplicate chapter id(s)");
const orders = CHAPTERS.map((c) => c.order).sort((a, b) => a - b);
check(new Set(orders).size === orders.length, "duplicate chapter order(s)");
check(orders[0] === 1 && orders[orders.length - 1] === orders.length, `orders not 1..${orders.length} (got ${orders[0]}..${orders[orders.length - 1]})`);
for (const c of CHAPTERS) {
  check(groupIds.has(c.group), `chapter "${c.id}" → unknown group "${c.group}"`);
  check(!!c.title && !!c.tagline && !!c.mentalModel, `chapter "${c.id}" missing title/tagline/mentalModel`);
}

/* ---- 2. seeAlso resolves ---------------------------------------------------*/
section("seeAlso cross-links resolve");
for (const c of CHAPTERS) {
  for (const sid of c.seeAlso) {
    check(chapterIds.has(sid), `chapter "${c.id}" seeAlso → missing "${sid}"`);
    check(sid !== c.id, `chapter "${c.id}" seeAlso points at itself`);
  }
}

/* ---- 3. sim/figure keys registered + table/quiz section integrity ----------*/
section("Section sim/figure keys are registered + tables well-formed");
const linkRe = /#(\/[A-Za-z0-9/_-]+)/g;
const internalLinks: { from: string; target: string }[] = [];
function scanMd(from: string, md: string): void {
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(md))) internalLinks.push({ from, target: m[1] });
}
for (const c of CHAPTERS) {
  c.sections.forEach((s, i) => {
    const where = `chapter "${c.id}" section #${i} (${s.kind})`;
    if (s.kind === "sim") {
      check(SIM_KEYS.has(s.sim), `${where} → unregistered sim "${s.sim}"`);
      usedSims.add(s.sim);
    } else if (s.kind === "figure") {
      check(FIG_KEYS.has(s.fig), `${where} → unregistered figure "${s.fig}"`);
      usedFigs.add(s.fig);
    } else if (s.kind === "table") {
      check(s.head.length > 0, `${where} → empty table head`);
      s.rows.forEach((r, ri) =>
        check(r.length === s.head.length, `${where} → row ${ri} has ${r.length} cells, head has ${s.head.length}`),
      );
    } else if (s.kind === "prose") {
      scanMd(where, s.md);
    } else if (s.kind === "callout") {
      check(!!s.title && !!s.md, `${where} → callout missing title/body`);
      scanMd(where, s.md);
    } else if (s.kind === "compare") {
      check(!!s.a && !!s.b, `${where} → compare missing column label`);
    } else if (s.kind === "code") {
      check(!!s.code.trim(), `${where} → empty code block`);
    }
  });
}

/* ---- 4. in-prose #/ links resolve -----------------------------------------*/
section("In-prose #/ links resolve to a real chapter/route");
for (const { from, target } of internalLinks) {
  if (target.startsWith("/chapter/")) {
    const cid = target.slice("/chapter/".length);
    check(chapterIds.has(cid), `${from} → broken link #/chapter/${cid}`);
  } else {
    check(KNOWN_ROUTES.has(target), `${from} → unknown route #${target}`);
  }
}

/* ---- 5. sources are well-formed https --------------------------------------*/
section("Sources have well-formed https URLs + titles");
for (const c of CHAPTERS) {
  if (c.stub) continue; // seeded stubs may omit sources
  for (const s of c.sources) {
    check(!!s.title, `chapter "${c.id}" source missing title`);
    let ok: boolean;
    try { ok = new URL(s.url).protocol === "https:"; } catch { ok = false; }
    check(ok, `chapter "${c.id}" source bad url: ${s.url}`);
  }
}

/* ---- 6. interview + mental-models reference real chapters/figures ----------*/
section("Interview bank + mental-models reference real chapters/figures");
for (const it of INTERVIEW) check(chapterIds.has(it.chapter), `interview "${it.id}" → missing chapter "${it.chapter}"`);
for (const mm of MODELS) {
  check(chapterIds.has(mm.chapter), `mental-model "${mm.id}" → missing chapter "${mm.chapter}"`);
  if (mm.figure) {
    check(FIG_KEYS.has(mm.figure), `mental-model "${mm.id}" → unregistered figure "${mm.figure}"`);
    usedFigs.add(mm.figure);
  }
}

/* ---- 7. quiz answer indices in range --------------------------------------*/
section("Quiz banks: correct index in range, choices non-empty");
for (const [name, bank] of [["async", asyncOrderingQuiz], ["concurrency", concurrencyQuiz], ["modules", modulesQuiz], ["express", expressQuiz]] as const) {
  for (const q of bank) {
    check(q.choices.length >= 2, `${name} quiz "${q.id}" has <2 choices`);
    check(q.correct >= 0 && q.correct < q.choices.length, `${name} quiz "${q.id}" correct index ${q.correct} out of range`);
    check(q.choices.every((c) => c.length > 0), `${name} quiz "${q.id}" has an empty choice`);
  }
}

/* ---- 8. orphan registry entries (warn-only) -------------------------------*/
section("Orphan registry entries (warn-only — registered but never used)");
const orphanSims = [...SIM_KEYS].filter((k) => !usedSims.has(k));
const orphanFigs = [...FIG_KEYS].filter((k) => !usedFigs.has(k));
if (orphanSims.length) console.log(`  warn  unused SIMS: ${orphanSims.join(", ")}`);
if (orphanFigs.length) console.log(`  warn  unused FIGURES: ${orphanFigs.join(", ")}`);

/* ---- 9. atlas coverage (S14) — every figure reachable, so /atlas is complete */
// CHANGED: S14 — the atlas derives its entries from chapter bodies + model cards
// (src/lib/atlas.ts). A figure referenced by neither would silently vanish from
// the wall, so what was an orphan warning becomes a hard failure for FIGURES.
section("Atlas coverage — every registered figure owned by a chapter body or model card");
check(orphanFigs.length === 0, `figure(s) unreachable from the atlas: ${orphanFigs.join(", ")}`);

/* ---- summary --------------------------------------------------------------*/
/* ---- 10. analogies (S16) — every content chapter has one, well-formed ------*/
// Content chapters = everything except link pages (interview, mental-models) and
// the capstone summary. Each analogy needs a scene, >=3 mapping rows of exactly
// two non-empty cells, and a non-empty "where it breaks" line.
section("Analogies — coverage of content chapters + well-formed");
const ANALOGY_EXEMPT = new Set(["summary"]);
for (const id of Object.keys(ANALOGIES)) check(chapterIds.has(id), `analogy keyed "${id}" → no such chapter`);
for (const c of CHAPTERS) {
  if (c.link || ANALOGY_EXEMPT.has(c.id)) continue;
  const a = ANALOGIES[c.id];
  check(!!a, `chapter "${c.id}" has no real-life analogy`);
  if (!a) continue;
  check(a.title.trim().length > 0 && a.scene.trim().length > 0, `analogy "${c.id}": empty title/scene`);
  check(a.map.length >= 3, `analogy "${c.id}": fewer than 3 mapping rows`);
  check(a.map.every((r) => r.length === 2 && r[0].trim() !== "" && r[1].trim() !== ""), `analogy "${c.id}": malformed mapping row`);
  check(a.breaks.trim().length > 0, `analogy "${c.id}": missing "where it breaks"`);
}

/* ---- 11. principles (S17) ------------------------------------------------*/
// Numbered 1..N contiguously, unique ids, every field filled, every chapter ref
// real, each principle built on >=1 chapter, and EVERY content chapter carries
// a "Built on principles" line (link pages excepted).
section("Principles — numbering, refs resolve, every content chapter covered");
const evenTicks = (md: string): boolean => (md.match(/`/g)?.length ?? 0) % 2 === 0;
check(new Set(PRINCIPLES.map((p) => p.id)).size === PRINCIPLES.length, "duplicate principle id(s)");
PRINCIPLES.forEach((p, i) => {
  check(p.n === i + 1, `principle "${p.id}" numbered ${p.n}, expected ${i + 1}`);
  check(!!p.title.trim() && !!p.line.trim(), `principle ${p.n}: empty title/line`);
  check(p.therefore.length >= 2 && p.questions.length >= 2, `principle ${p.n}: needs >=2 therefore + >=2 questions`);
  check(p.chapters.length >= 1, `principle ${p.n}: built on no chapter`);
  check(new Set(p.chapters).size === p.chapters.length, `principle ${p.n}: duplicate chapter ref`);
  for (const cid of p.chapters) {
    check(chapterIds.has(cid), `principle ${p.n} → missing chapter "${cid}"`);
    check(!CHAPTERS.find((c) => c.id === cid)?.link, `principle ${p.n} → "${cid}" is a link page`);
  }
  for (const md of [p.line, ...p.therefore, ...p.questions]) check(evenTicks(md), `principle ${p.n}: unbalanced backticks in "${md.slice(0, 40)}…"`);
});
for (const c of CHAPTERS) {
  if (c.link) continue;
  check(PRINCIPLES.some((p) => p.chapters.includes(c.id)), `chapter "${c.id}" is built on no principle`);
}

/* ---- 12. glossary (S17) ---------------------------------------------------*/
// Terms + aka unique case-insensitively (one namespace), slugs unique (they are
// anchors), chapter/principle/seeAlso refs resolve, defs non-empty + balanced md.
section("Glossary — unique terms/aka/slugs, refs resolve");
const termNames = new Set(GLOSSARY.map((t) => t.term));
const seenNames = new Map<string, string>();
const seenSlugs = new Set<string>();
const principleNs = new Set(PRINCIPLES.map((p) => p.n));
for (const t of GLOSSARY) {
  for (const name of [t.term, ...(t.aka ?? [])]) {
    const k = name.trim().toLowerCase();
    check(!seenNames.has(k), `glossary: "${name}" (in "${t.term}") clashes with "${seenNames.get(k)}"`);
    seenNames.set(k, t.term);
  }
  const slug = termSlug(t.term);
  check(slug.length > 0 && !seenSlugs.has(slug), `glossary: empty or duplicate slug "${slug}" for "${t.term}"`);
  seenSlugs.add(slug);
  check(t.def.trim().length > 0 && evenTicks(t.def), `glossary "${t.term}": empty def or unbalanced backticks`);
  check(chapterIds.has(t.chapter), `glossary "${t.term}" → missing chapter "${t.chapter}"`);
  check(!CHAPTERS.find((c) => c.id === t.chapter)?.link, `glossary "${t.term}" → "${t.chapter}" is a link page`);
  if (t.principle !== undefined) check(principleNs.has(t.principle), `glossary "${t.term}" → missing principle ${t.principle}`);
  for (const s of t.seeAlso ?? []) {
    check(termNames.has(s), `glossary "${t.term}" seeAlso → no term "${s}"`);
    check(s !== t.term, `glossary "${t.term}" seeAlso points at itself`);
  }
}

console.log(`\n${failures === 0 ? "QA OK" : "QA FAILED"} — ${checks} checks, ${failures} failure(s).`);
console.log(`  chapters=${CHAPTERS.length} sims=${SIM_KEYS.size} figures=${FIG_KEYS.size} interview=${INTERVIEW.length} models=${MODELS.length} principles=${PRINCIPLES.length} terms=${GLOSSARY.length} inProseLinks=${internalLinks.length}`);
process.exit(failures === 0 ? 0 : 1);
