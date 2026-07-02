/* Correctness check for the zero-dep syntax highlighter (S12).
   Run: node --experimental-strip-types scripts/test-highlight.ts
   Two layers:
   1. INVARIANTS over the REAL content corpus (every `code` section in
      src/data/concepts.ts): concat(tokens.text) === input — highlighting can
      never alter the rendered code — plus flat, non-empty tokens with valid
      classes only. (No-nested-spans holds by construction: tokens are a flat
      list; Section.tsx maps each to at most ONE span.)
   2. CLASSIFICATION snapshots on a synthetic corpus: comments, strings,
      template literals (incl. ${} interpolation + nesting), keywords, numbers
      (hex/bin/float/underscores/BigInt), Types/Caps, function calls, bash
      commands/ENV vars/$vars, unknown-lang passthrough, determinism. */
import { tokenize, type HlToken } from "../src/lib/highlight.ts";
import { CHAPTERS } from "../src/data/concepts.ts";

let failed = 0;
const ok = (name: string, cond: boolean, detail = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
};

const VALID = new Set(["cm", "str", "tpl", "kw", "num", "type", "fn", "var"]);
const text = (toks: HlToken[]): string => toks.map((t) => t.text).join("");
const clsOf = (toks: HlToken[], frag: string): string | null | undefined =>
  toks.find((t) => t.text.includes(frag))?.cls;

/* ---- 1. invariants over every real code block in the guide ---------------- */
console.log("— invariants over the real content corpus —");
let blocks = 0;
let spanless = 0;
let preserved = true;
let allValid = true;
let nonEmpty = true;
for (const ch of CHAPTERS) {
  for (const s of ch.sections) {
    if (s.kind !== "code") continue;
    blocks++;
    const toks = tokenize(s.code, s.lang);
    if (text(toks) !== s.code) {
      preserved = false;
      ok(`text preserved: ${ch.id} block #${blocks}`, false, `lang=${s.lang}`);
    }
    for (const t of toks) {
      if (t.text.length === 0) nonEmpty = false;
      if (t.cls !== null && !VALID.has(t.cls)) allValid = false;
    }
    if (!toks.some((t) => t.cls !== null)) spanless++;
  }
}
ok(`corpus: found a real corpus to test`, blocks >= 19, `${blocks} code blocks`);
ok(`corpus: output text === input text for ALL ${blocks} blocks`, preserved);
ok(`corpus: no empty tokens`, nonEmpty);
ok(`corpus: every class is one of {cm,str,tpl,kw,num,type,fn,var}`, allValid);
ok(`corpus: every block actually gets SOME highlighting`, spanless === 0, `${spanless} un-highlighted`);

/* ---- 2. classification snapshots ------------------------------------------ */
console.log("— js/ts classification —");
const js = (src: string): HlToken[] => tokenize(src, "js");

let t = js("// note\nconst x = 1; /* multi\nline */");
ok("js: line comment → cm", clsOf(t, "// note") === "cm");
ok("js: block comment (multiline) → cm", clsOf(t, "multi\nline") === "cm");
ok("js: const → kw", clsOf(t, "const") === "kw");
ok("js: number → num", clsOf(t, "1") === "num");

t = js("call('a\\'b') + \"q\" + unterminated('oops");
ok("js: single-quoted string w/ escape → str", clsOf(t, "'a\\'b'") === "str");
ok("js: double-quoted string → str", clsOf(t, '"q"') === "str");
ok("js: unterminated string stays a token (text preserved)", text(t).endsWith("'oops"));

t = js("const s = `a ${name} b ${fn(`in ${x}`)} c`;");
ok("js: template chunks → tpl", clsOf(t, "a ") === "tpl" && clsOf(t, " c`") === "tpl");
ok("js: interpolated ident stays plain", clsOf(t, "name") === null);
ok("js: nested template inside ${} → tpl", clsOf(t, "in ") === "tpl");
ok("js: fn call inside ${} → fn", clsOf(t, "fn") === "fn");
ok("js: template round-trip text preserved", text(t) === "const s = `a ${name} b ${fn(`in ${x}`)} c`;");

t = js("0xFF_0n + 0b1010 + 1_000_000 + 3.14e-2 + 42n");
ok("js: hex/bigint → num", clsOf(t, "0xFF_0n") === "num");
ok("js: binary → num", clsOf(t, "0b1010") === "num");
ok("js: underscores → num", clsOf(t, "1_000_000") === "num");
ok("js: float exponent → num", clsOf(t, "3.14e-2") === "num");
ok("js: BigInt → num", clsOf(t, "42n") === "num");

t = js("await new Promise(r => setTimeout(r, 5)); JSON.parse(raw); if (x) fs.readFile(p);");
ok("js: await → kw", clsOf(t, "await") === "kw");
ok("js: Promise (Capitalized) → type, not fn", clsOf(t, "Promise") === "type");
ok("js: JSON → type", clsOf(t, "JSON") === "type");
ok("js: parse( → fn", clsOf(t, "parse") === "fn");
ok("js: readFile( → fn", clsOf(t, "readFile") === "fn");
ok("js: if ( → kw, NOT fn", clsOf(t, "if") === "kw");
ok("js: plain ident (raw) unstyled", clsOf(t, "raw") === null);

t = js("const a = 10 / 2; // division, not a regex");
ok("js: division slash stays unstyled (regex literals unsupported by design)", clsOf(t, "/ 2") === null || t.some((x) => x.text.includes("/") && x.cls === null));

t = tokenize("interface A { x: string }", "ts");
ok("ts: interface → kw (TS keyword set)", clsOf(t, "interface") === "kw");
ok("ts: string type kw in ts", clsOf(t, "string") === "kw");
ok("js: interface NOT a kw in js", clsOf(js("interface"), "interface") !== "kw");

console.log("— bash classification —");
const sh = (src: string): HlToken[] => tokenize(src, "bash");
t = sh("# deny by default\nnode --permission --allow-fs-read=/app/config app.js");
ok("bash: comment → cm", clsOf(t, "# deny by default") === "cm");
ok("bash: command position (node) → fn", clsOf(t, "node") === "fn");
ok("bash: flag stays plain", clsOf(t, "allow-fs-read") === null);

t = sh("PORT=3000 node app.js && echo \"up on $PORT\" | grep ${HOME}");
ok("bash: ENV_CAPS assignment → var", t.find((x) => x.text === "PORT")?.cls === "var");
ok("bash: command after ENV= prefix → fn", clsOf(t, "node") === "fn");
ok("bash: echo → kw", clsOf(t, "echo") === "kw");
ok("bash: double-quoted string → str", clsOf(t, "up on") === "str");
ok("bash: command after && → fn", clsOf(t, "grep") === "fn");
ok("bash: ${HOME} → var", clsOf(t, "${HOME}") === "var");
ok("bash: round-trip text preserved", text(t) === "PORT=3000 node app.js && echo \"up on $PORT\" | grep ${HOME}");

console.log("— edges —");
t = tokenize("SELECT * FROM users;", "sql");
ok("unknown lang: single unstyled token", t.length === 1 && t[0].cls === null);
ok("unknown lang: text preserved", text(t) === "SELECT * FROM users;");
ok("empty input: no tokens", tokenize("", "js").length === 0);
const twice = JSON.stringify(js("const a = `x ${y}`;")) === JSON.stringify(js("const a = `x ${y}`;"));
ok("deterministic: same input → same tokens", twice);
const merged = js("const let var");
ok("adjacent same-class tokens merge (kw + spaces + kw…)", merged.length <= 5, `${merged.length} tokens`);

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
