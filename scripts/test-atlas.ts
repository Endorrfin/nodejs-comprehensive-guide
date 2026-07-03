/* Correctness check for the figure-atlas data layer (S14).
   Run: node --experimental-strip-types scripts/test-atlas.ts
   Asserts the atlas covers the FIGURES registry 1:1 (keys parsed textually from
   registry.tsx, same approach as qa-integrity — the .tsx imports JSX/css so it
   can't be imported here), that every entry resolves to a real chapter with a
   consistent group, that reading order holds, and that known owners are right
   (incl. the two gallery-only figures inheriting their card's chapter). */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ATLAS, filterAtlas } from "../src/lib/atlas.ts";
import { CHAPTERS, GROUPS, CHAPTER_BY_ID } from "../src/data/concepts.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

/* ---- registry FIGURES keys, parsed from the .tsx source ------------------- */
const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, "../src/lib/registry.tsx"), "utf8");
const open = src.indexOf("{", src.indexOf("export const FIGURES"));
const block = src.slice(open, src.indexOf("};", open));
const FIG_KEYS = new Set([...block.matchAll(/^\s*"?([\w-]+)"?:/gm)].map((m) => m[1]));

/* ---- 1. coverage: atlas ⇄ registry are the same set ----------------------- */
console.log("— coverage —");
ok(`registry parse found figures (${FIG_KEYS.size})`, FIG_KEYS.size >= 22);
const atlasKeys = new Set(ATLAS.map((e) => e.key));
ok("no duplicate atlas keys", atlasKeys.size === ATLAS.length);
const missing = [...FIG_KEYS].filter((k) => !atlasKeys.has(k));
ok("every registry figure has an atlas entry", missing.length === 0, missing.join(", "));
const extra = [...atlasKeys].filter((k) => !FIG_KEYS.has(k));
ok("no atlas entry without a registry figure", extra.length === 0, extra.join(", "));

/* ---- 2. every entry resolves to a real, consistent owner ------------------ */
console.log("— owners —");
const groupIds = new Set(GROUPS.map((g) => g.id));
let owners = true;
for (const e of ATLAS) {
  const ch = CHAPTER_BY_ID[e.chapter];
  if (!ch || ch.group !== e.group || ch.order !== e.order || !groupIds.has(e.group) || !e.title) {
    owners = false;
    ok(`entry "${e.key}" consistent`, false, `chapter=${e.chapter}`);
  }
}
ok("all entries resolve to a real chapter with matching group/order/title", owners);

/* ---- 3. reading order + known owners -------------------------------------- */
console.log("— order + spot checks —");
ok(
  "atlas sorted by chapter order",
  ATLAS.every((e, i) => i === 0 || ATLAS[i - 1].order <= e.order),
);
const ownerOf = (k: string): string | undefined => ATLAS.find((e) => e.key === k)?.chapter;
ok("event-loop-ring → event-loop", ownerOf("event-loop-ring") === "event-loop");
ok("middleware-pipeline → express", ownerOf("middleware-pipeline") === "express");
// gallery-only figures (no in-body use) inherit the mental-model card's chapter
ok("microtask-ladder (gallery-only) → event-loop", ownerOf("microtask-ladder") === "event-loop");
ok("jit-tiers (gallery-only) → v8-gc", ownerOf("jit-tiers") === "v8-gc");
const captioned = ATLAS.filter((e) => e.caption).length;
ok(`in-body figures carry captions (${captioned})`, captioned >= 20);

/* ---- 4. filter ------------------------------------------------------------- */
console.log("— filter —");
ok("filterAtlas(null) returns all", filterAtlas(null).length === ATLAS.length);
const perGroup = GROUPS.map((g) => filterAtlas(g.id).length);
ok(
  "group filters partition the atlas",
  perGroup.reduce((a, b) => a + b, 0) === ATLAS.length && perGroup.every((n) => n > 0),
  `[${perGroup.join(", ")}]`,
);

console.log(failed === 0 ? `\nATLAS OK (${ATLAS.length} figures, ${CHAPTERS.length} chapters)` : `\n${failed} FAILURES`);
if (failed > 0) process.exit(1);
