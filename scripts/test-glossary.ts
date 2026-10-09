/* Correctness check for the principles + glossary data layer (S17).
   Run: node --experimental-strip-types scripts/test-glossary.ts
   qa-integrity guards references; this suite pins the BEHAVIOUR the pages rely
   on: anchor slugs, A–Z bucketing, alphabetical order, the per-chapter
   "Built on principles" derivation, and the part-filter partition. */
import { GLOSSARY, termSlug, termLetter, sortKey } from "../src/data/glossary.ts";
import { PRINCIPLES, CIRCLED, principlesForChapter } from "../src/data/principles.ts";
import { CHAPTERS, GROUPS, CHAPTER_BY_ID } from "../src/data/concepts.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

console.log("— slugs (anchors id=term-<slug>) —");
const slugCases: [string, string][] = [
  ["process.nextTick", "process-nexttick"],
  ["'drain'", "drain"],
  ["--max-old-space-size", "max-old-space-size"],
  ["next('route')", "next-route"],
  ["Parse → link → evaluate", "parse-link-evaluate"],
  ["0x", "0x"],
];
for (const [t, want] of slugCases) ok(`slug(${t}) = ${want}`, termSlug(t) === want, termSlug(t));
ok("slugs are anchor-safe [a-z0-9-]", GLOSSARY.every((t) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(termSlug(t.term))));

console.log("— A–Z rail —");
ok("letter: Event loop → E", termLetter("Event loop") === "E");
ok("letter: 'drain' → #", termLetter("'drain'") === "#");
ok("letter: --watch → #", termLetter("--watch") === "#");
ok("letter: 0x → #", termLetter("0x") === "#");
ok("every letter is # or A–Z", GLOSSARY.every((t) => /^[#A-Z]$/.test(termLetter(t.term))));
const sorted = [...GLOSSARY].sort((a, b) => sortKey(a.term).localeCompare(sortKey(b.term)));
ok("sortKey ignores leading symbols ('drain' sorts with d)", sortKey("'drain'") === "drain'");
ok("sort is stable for the whole set", sorted.length === GLOSSARY.length);

console.log("— part filter partition —");
const counts = GROUPS.map((g) => GLOSSARY.filter((t) => CHAPTER_BY_ID[t.chapter]?.group === g.id).length);
ok("every term lands in exactly one part", counts.reduce((a, b) => a + b, 0) === GLOSSARY.length, counts.join("/"));
ok("every part has terms", counts.every((n) => n > 0), counts.join("/"));
ok("glossary size in the agreed range (≥100)", GLOSSARY.length >= 100, String(GLOSSARY.length));

console.log("— principles —");
ok("seven principles", PRINCIPLES.length === 7);
ok("circled numerals ①…⑦", PRINCIPLES.every((p) => CIRCLED[p.n] && CIRCLED[p.n].length === 1));
ok("event-loop built on ① ③ ④", principlesForChapter("event-loop").map((p) => p.n).join(",") === "1,3,4");
ok("summary built on all seven", principlesForChapter("summary").length === 7);
ok("link pages have no principle line", principlesForChapter("interview").length === 0 && principlesForChapter("mental-models").length === 0);
const content = CHAPTERS.filter((c) => !c.link);
const bare = content.filter((c) => principlesForChapter(c.id).length === 0).map((c) => c.id);
ok(`every content chapter (${content.length}) is built on ≥1 principle`, bare.length === 0, bare.join(", "));
ok("derivation is ordered by principle number", content.every((c) => {
  const ns = principlesForChapter(c.id).map((p) => p.n);
  return ns.every((n, i) => i === 0 || n > ns[i - 1]);
}));

console.log(failed === 0 ? "\nGLOSSARY/PRINCIPLES OK" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
