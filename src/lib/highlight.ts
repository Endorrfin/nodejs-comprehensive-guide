/* CHANGED: S12 — zero-dependency syntax highlighter (~2 kB, no runtime deps).
   Pure function: string in → flat token list out. No browser APIs → SSR-safe
   (used by the `code` case in components/chapter/Section.tsx AND by the SSR
   smoke build). Invariants the test suite (scripts/test-highlight.ts) enforces:
     1. concat(tokens.text) === input  — highlighting NEVER alters the code;
     2. tokens are flat (no nesting) and non-empty.
   Supported langs: js / ts (one scanner, TS adds keywords) and bash. Unknown
   langs pass through as a single unstyled token. Deliberately NOT supported:
   regex literals (the `/`-division ambiguity; the content corpus has none —
   verified 2026-07-02) — a `/` simply stays unstyled. */

export type HlClass = "cm" | "str" | "tpl" | "kw" | "num" | "type" | "fn" | "var";
export type HlToken = { text: string; cls: HlClass | null };

const KW_JS: ReadonlySet<string> = new Set(
  (
    "const let var function return if else for while do switch case default break continue " +
    "new class extends super this typeof instanceof in of try catch finally throw async await " +
    "yield import export from delete void static get set true false null undefined NaN Infinity"
  ).split(" "),
);

const KW_TS: ReadonlySet<string> = new Set([
  ...KW_JS,
  ...(
    "type interface enum implements readonly keyof namespace declare abstract as satisfies " +
    "override public private protected any unknown never string number boolean object symbol bigint"
  ).split(" "),
]);

const KW_SH: ReadonlySet<string> = new Set(
  "if then elif else fi for in do done while until case esac function select return exit export local readonly set unset source echo".split(" "),
);

/* Appends a token, merging into the previous one when the class matches —
   fewer spans in the DOM, and whitespace glues onto its neighbours. */
function push(out: HlToken[], text: string, cls: HlToken["cls"]): void {
  if (!text) return;
  const last = out[out.length - 1];
  if (last && last.cls === cls) last.text += text;
  else out.push({ text, cls });
}

/* ---------------------------------------------------------------- js / ts */

/* One sticky alternation per token: comment | string | number | identifier |
   newline | blank | anything. Backticks never reach it (intercepted below). */
const JS_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))|('(?:\\[\s\S]|[^'\\\n])*'?|"(?:\\[\s\S]|[^"\\\n])*"?)|(0[xX][\da-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*(?:\.[\d_]*)?|\.\d[\d_]*)(?:[eE][+-]?\d+)?n?)|([A-Za-z_$][\w$]*)|(\n)|([ \t\r]+)|(.)/y;

function classifyIdent(src: string, at: number, text: string, kw: ReadonlySet<string>): HlToken["cls"] {
  if (kw.has(text)) return "kw";
  if (/^[A-Z]/.test(text)) return "type"; // Promise, JSON, Router — class-ish
  let j = at + text.length;
  while (j < src.length && (src[j] === " " || src[j] === "\t")) j++;
  return src[j] === "(" ? "fn" : null; // call (or decl name) position
}

function scanJs(src: string, out: HlToken[], kw: ReadonlySet<string>): void {
  let i = 0;
  while (i < src.length) {
    if (src[i] === "`") {
      i = scanTemplate(src, i, out, kw);
      continue;
    }
    JS_RE.lastIndex = i;
    const m = JS_RE.exec(src);
    if (!m) {
      // unreachable (the final `.` + `\n` alternatives cover every char) — safety net
      push(out, src.slice(i), null);
      return;
    }
    const text = m[0];
    let cls: HlToken["cls"] = null;
    if (m[1]) cls = "cm";
    else if (m[2]) cls = "str";
    else if (m[3]) cls = "num";
    else if (m[4]) cls = classifyIdent(src, i, text, kw);
    push(out, text, cls);
    i += text.length;
  }
}

/* Template literal: the literal chunks get `tpl`; each ${…} interpolation is
   re-scanned as code (recursion ⇒ nested templates work). The ${…} end brace
   is found by naive depth count — good enough for curated snippets, and the
   text-preservation invariant holds regardless. Returns the index AFTER the
   literal. */
function scanTemplate(src: string, start: number, out: HlToken[], kw: ReadonlySet<string>): number {
  let i = start + 1; // past the opening backtick
  let chunk = "`";
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      chunk += src.slice(i, i + 2);
      i += 2;
      continue;
    }
    if (c === "`") {
      chunk += "`";
      i += 1;
      break;
    }
    if (c === "$" && src[i + 1] === "{") {
      push(out, chunk, "tpl");
      chunk = "";
      let depth = 1;
      let j = i + 2;
      while (j < src.length && depth > 0) {
        if (src[j] === "{") depth++;
        else if (src[j] === "}") depth--;
        if (depth > 0) j++;
      }
      push(out, "${", "tpl");
      scanJs(src.slice(i + 2, j), out, kw);
      if (j < src.length) push(out, "}", "tpl");
      i = j + 1;
      continue;
    }
    chunk += c;
    i += 1;
  }
  push(out, chunk, "tpl");
  return i;
}

/* ------------------------------------------------------------------- bash */

const SH_RE =
  /(#[^\n]*)|('(?:\\[\s\S]|[^'\\])*'?|"(?:\\[\s\S]|[^"\\])*"?)|(\$\{[^}\n]*\}?|\$[A-Za-z_]\w*|\$[\d@#?*!$])|(\d[\d._]*)|([A-Za-z_][\w.+-]*)|(\n)|([ \t\r]+)|(.)/y;

function scanSh(src: string, out: HlToken[]): void {
  let i = 0;
  let cmdPos = true; // start of line / after ; | & ( — the "command name" slot
  while (i < src.length) {
    SH_RE.lastIndex = i;
    const m = SH_RE.exec(src);
    if (!m) {
      push(out, src.slice(i), null);
      return;
    }
    const text = m[0];
    let cls: HlToken["cls"] = null;
    if (m[1]) cls = "cm";
    else if (m[2]) cls = "str";
    else if (m[3]) cls = "var";
    else if (m[4]) cls = "num";
    else if (m[5]) {
      if (KW_SH.has(text)) cls = "kw";
      else if (/^[A-Z_][A-Z0-9_]*$/.test(text)) cls = "var"; // ENV_VAR convention
      else if (cmdPos) cls = "fn"; // command name: node, npm, curl…
    }
    push(out, text, cls);
    // Command-slot tracking: newlines/separators reopen it, control keywords
    // keep it open (`if node …`), and only a plain word fills it. Strings,
    // numbers, $vars, ENV_CAPS=… prefixes, comments, flags and blanks leave it
    // as-is — so `PORT=3000 node app.js` still marks `node` as the command.
    if (m[6] || /[;|&(]$/.test(text)) cmdPos = true;
    else if (cls === "kw") cmdPos = true;
    else if (m[5] && cls !== "var") cmdPos = false;
    i += text.length;
  }
}

/* ------------------------------------------------------------------ entry */

export function tokenize(code: string, lang: string): HlToken[] {
  const out: HlToken[] = [];
  switch (lang) {
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      scanJs(code, out, KW_JS);
      break;
    case "ts":
    case "tsx":
    case "typescript":
      scanJs(code, out, KW_TS);
      break;
    case "bash":
    case "sh":
    case "shell":
      scanSh(code, out);
      break;
    default:
      push(out, code, null); // unknown lang: never guess, never restyle
  }
  return out;
}
