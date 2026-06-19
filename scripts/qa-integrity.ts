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
import { asyncOrderingQuiz, concurrencyQuiz, modulesQuiz } from "../src/data/quizzes.ts";

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
const KNOWN_ROUTES = new Set(["/map", "/interview", "/mental-models", "/flashcards", "/about"]);

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
    let ok = false;
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
for (const [name, bank] of [["async", asyncOrderingQuiz], ["concurrency", concurrencyQuiz], ["modules", modulesQuiz]] as const) {
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

/* ---- summary --------------------------------------------------------------*/
console.log(`\n${failures === 0 ? "QA OK" : "QA FAILED"} — ${checks} checks, ${failures} failure(s).`);
console.log(`  chapters=${CHAPTERS.length} sims=${SIM_KEYS.size} figures=${FIG_KEYS.size} interview=${INTERVIEW.length} models=${MODELS.length} inProseLinks=${internalLinks.length}`);
process.exit(failures === 0 ? 0 : 1);
