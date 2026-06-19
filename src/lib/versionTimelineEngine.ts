/* ===========================================================================
   Version-timeline model — the "Modern Node (2026)" hero (Ch.17).

   A scrub-able timeline of the Node.js release lines (18 → 26) and the
   capabilities that landed in each. The point isn't trivia — it's the SHAPE of
   how Node became "batteries included": fetch (18) → a stable test runner and
   permissions (20) → require(esm)/WebSocket/native-TS/SQLite (22) → TypeScript
   by default + a stable permission model (24) → Temporal + the next V8 (26).

   TRUTH-ANCHORING: this is web-verified data (mid-2026 — see the chapter's
   `sources`), and every `probe` below names a capability that is checkable on a
   *running* Node. scripts/test-modern.ts asserts that on THIS interpreter every
   probed feature whose line ≤ the running major is actually present — so the
   timeline can't silently drift from the runtime it describes. Lines newer than
   the running Node (e.g. URLPattern in 24, Temporal in 26 when run on 22) are
   intentionally NOT asserted present.
   =========================================================================== */

export type LineStatus = "eol" | "maintenance" | "active-lts" | "current";
export type Stability = "experimental" | "stable";
export type Domain = "web" | "tooling" | "ts" | "modules" | "security" | "data" | "perf" | "runtime";

export interface Feature {
  id: string;
  label: string;
  blurb: string; // one tight line — what it gives you
  stability: Stability; // status AS INTRODUCED in this line (the timeline shows the journey)
  domain: Domain;
  /** A capability key checkable on a running Node — only set for things we can probe. */
  probe?: ProbeKey;
}

export type ProbeKey =
  | "fetch"
  | "structuredClone"
  | "node:test"
  | "webstreams"
  | "websocket"
  | "fs.glob"
  | "sqlite"
  | "maglev"
  | "urlpattern"
  | "temporal";

export interface ReleaseLine {
  major: number; // 18, 20, 22, 24, 26
  year: number; // initial release year
  v8: string; // V8 version this line shipped on
  status: LineStatus; // as of NOW (see NOW below)
  statusNote: string; // human note about the support window
  headline: string; // the one-line story of this line
  features: Feature[]; // what LANDED in this line
}

/** The reference "today" this timeline is verified against. */
export const NOW = {
  date: "2026-06-19",
  current: 26,
  activeLts: 24,
  maintenance: 22,
  // From October 2026 (Node 27): one major per year, version === calendar year,
  // every release becomes LTS, and a new Alpha channel opens for early testing.
  scheduleChangeFrom: 27,
} as const;

export const TIMELINE: ReleaseLine[] = [
  {
    major: 18,
    year: 2022,
    v8: "10.1",
    status: "eol",
    statusNote: "End-of-life since Apr 2025 — no more security patches.",
    headline: "The standard library grows up: fetch and Web APIs come to the server.",
    features: [
      { id: "fetch", label: "Global fetch()", blurb: "HTTP client built in (Undici) — no axios/node-fetch needed.", stability: "experimental", domain: "web", probe: "fetch" },
      { id: "webstreams", label: "Web Streams + structuredClone", blurb: "WHATWG ReadableStream/WritableStream, Blob, structuredClone as globals.", stability: "stable", domain: "web", probe: "structuredClone" },
      { id: "test", label: "node:test (introduced)", blurb: "A built-in test runner — first appearance, behind no framework.", stability: "experimental", domain: "tooling", probe: "node:test" },
      { id: "watch", label: "--watch (introduced)", blurb: "Restart the process on file change, no nodemon.", stability: "experimental", domain: "tooling" },
    ],
  },
  {
    major: 20,
    year: 2023,
    v8: "11.3",
    status: "eol",
    statusNote: "End-of-life Apr 30 2026 — migrate off; CVEs after this date ship only for 22+.",
    headline: "Permissions arrive and the test runner stabilises.",
    features: [
      { id: "permission", label: "Permission Model (experimental)", blurb: "--experimental-permission gates fs, child_process, worker at the process boundary.", stability: "experimental", domain: "security" },
      { id: "test-stable", label: "node:test goes stable", blurb: "The built-in runner is production-ready: describe/it, mocks, coverage.", stability: "stable", domain: "tooling", probe: "node:test" },
      { id: "sea", label: "Single Executable Apps", blurb: "Bundle the runtime + your app into one binary (experimental).", stability: "experimental", domain: "tooling" },
      { id: "import-meta-resolve", label: "import.meta.resolve()", blurb: "Resolve a specifier to a URL synchronously from ESM.", stability: "stable", domain: "modules" },
    ],
  },
  {
    major: 22,
    year: 2024,
    v8: "12.4",
    status: "maintenance",
    statusNote: "Maintenance LTS until Apr 2027 — fine to run, but new work targets 24.",
    headline: "Batteries included: require(esm), --run, a WebSocket client, native TypeScript, SQLite.",
    features: [
      { id: "require-esm", label: "require(esm)", blurb: "CommonJS can require() an ES module synchronously — unflagged since 22.12.", stability: "stable", domain: "modules" },
      { id: "run", label: "node --run <script>", blurb: "Run a package.json script straight from the runtime (introduced; minimal startup).", stability: "experimental", domain: "tooling" },
      { id: "websocket", label: "Global WebSocket client", blurb: "A browser-compatible WebSocket — no ws dependency.", stability: "stable", domain: "web", probe: "websocket" },
      { id: "strip-types", label: "--experimental-strip-types", blurb: "Run .ts files by erasing type annotations — no build step (22.6).", stability: "experimental", domain: "ts" },
      { id: "sqlite", label: "node:sqlite", blurb: "A synchronous SQLite database in core (22.5) — still experimental.", stability: "experimental", domain: "data", probe: "sqlite" },
      { id: "glob", label: "fs.glob / fs.globSync", blurb: "Pattern-match file paths from node:fs, no glob package.", stability: "experimental", domain: "tooling", probe: "fs.glob" },
      { id: "maglev", label: "V8 Maglev JIT (default)", blurb: "A mid-tier optimising compiler — faster short-lived CPU work.", stability: "stable", domain: "perf", probe: "maglev" },
    ],
  },
  {
    major: 24,
    year: 2025,
    v8: "13.6",
    status: "active-lts",
    statusNote: "Active LTS (since Oct 2025) — the line to target for new production today.",
    headline: "TypeScript runs by default and the permission model ships stable.",
    features: [
      { id: "ts-default", label: "Run .ts with no flag", blurb: "Type stripping is on by default; `node app.ts` just works (stable in 24.12).", stability: "stable", domain: "ts" },
      { id: "permission-stable", label: "Permission Model stable", blurb: "--permission is production-ready (since 23.5): a seat belt, not a sandbox.", stability: "stable", domain: "security" },
      { id: "npm11", label: "npm 11 + V8 13.6", blurb: "Rewritten npm and a newer engine; measurable startup/throughput gains.", stability: "stable", domain: "perf" },
      { id: "compile-cache", label: "Module compile cache (stable)", blurb: "On-disk compile cache cuts cold-start for repeated runs.", stability: "stable", domain: "perf" },
      { id: "urlpattern", label: "URLPattern global", blurb: "Standard URL pattern matching for routers, as a global.", stability: "stable", domain: "web", probe: "urlpattern" },
    ],
  },
  {
    major: 26,
    year: 2026,
    v8: "14.6",
    status: "current",
    statusNote: "Current line (since May 5 2026) — enters LTS in Oct 2026.",
    headline: "Temporal lands by default; the next V8 and Undici 8 arrive.",
    features: [
      { id: "temporal", label: "Temporal API (default)", blurb: "The modern date/time API replaces Date's foot-guns — enabled by default.", stability: "stable", domain: "runtime", probe: "temporal" },
      { id: "v8-146", label: "V8 14.6 (Chromium 146)", blurb: "Map.prototype.getOrInsert, Iterator.concat() and more language features.", stability: "stable", domain: "runtime" },
      { id: "undici8", label: "Undici 8", blurb: "A newer HTTP/1.1 client behind global fetch — better networking.", stability: "stable", domain: "web" },
      { id: "sqlite-ext", label: "node:sqlite extensions", blurb: "Bundled SQLite gains extensions (e.g. Percentile) — still experimental overall.", stability: "experimental", domain: "data" },
    ],
  },
];

/* --------------------------------- helpers -------------------------------- */

export const lineByMajor = (major: number): ReleaseLine | undefined =>
  TIMELINE.find((l) => l.major === major);

export interface StatusMeta {
  label: string;
  color: string;
}
export const STATUS_META: Record<LineStatus, StatusMeta> = {
  eol: { label: "End of life", color: "#F87171" }, // red — do not run
  maintenance: { label: "Maintenance LTS", color: "#38BDF8" }, // teal — timers/legacy color
  "active-lts": { label: "Active LTS", color: "#6CC24A" }, // brand green — the safe default
  current: { label: "Current", color: "#4ADE80" }, // bright green — newest
};

export const STABILITY_META: Record<Stability, { label: string; color: string }> = {
  // orange = "not yet stable" — the same semantic the rest of the guide uses for risk/CPU.
  experimental: { label: "Experimental", color: "#FF7A00" },
  stable: { label: "Stable", color: "#6CC24A" },
};

export const DOMAIN_LABEL: Record<Domain, string> = {
  web: "Web APIs",
  tooling: "Tooling",
  ts: "TypeScript",
  modules: "Modules",
  security: "Security",
  data: "Data",
  perf: "Performance",
  runtime: "Runtime",
};

/** All features introduced up to and including `major`, flattened (for "what's standard now"). */
export function featuresUpTo(major: number): Feature[] {
  return TIMELINE.filter((l) => l.major <= major).flatMap((l) => l.features);
}

/** Count of stable vs experimental features that landed in a single line. */
export function stabilitySplit(line: ReleaseLine): { stable: number; experimental: number } {
  return {
    stable: line.features.filter((f) => f.stability === "stable").length,
    experimental: line.features.filter((f) => f.stability === "experimental").length,
  };
}

/** Is this line safe to run in production today? (active-lts or maintenance) */
export const isSupported = (line: ReleaseLine): boolean =>
  line.status === "active-lts" || line.status === "maintenance" || line.status === "current";
