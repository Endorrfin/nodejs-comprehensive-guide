# CLAUDE.md — Node.js: Comprehensive Guide (Interactive)

Working guide and source of truth for every session in this repo. **Read this file
fully before starting any session.** Update the *Status / progress log* at the bottom
at the end of each session.

> Author/brand: **Vasyl Krupka · Ukraine**. Sibling project & quality bar:
> `Examples/2026-06-15 Design Principles & Patterns` (the "DPmap" series).

---

## 1. Mission

A **deep, senior/staff-level, interactive Node.js guide** — concepts explained with
prose **plus** visual diagrams, tables, mental models and **interactive simulators**
(event loop, thread pool, GC, backpressure…). Built to *understand, internalize and
remember* Node internals (deep-dive mode), and to prep senior/staff interviews.

- **Audience:** Senior / Staff engineers. No hand-holding; assume strong JS/TS.
- **Language:** English (UI + content).
- **Deploy:** static site on **GitHub Pages**, public, auto-published by GitHub Actions.
- **Source of concepts:** `list of concepts.txt` (authoritative list — cover all, not limited to it).
- **Form/depth reference:** the DPmap interactive maps + the reference PNGs in `Examples/`
  (six event-loop phases, thread-pool-vs-kernel, GC generational, backpressure, and the
  **"live scheme"** animated event-loop simulator — that interactive style is the target).
- **Visual brand + content seed:** `Examples/Node-js core concepts/` — 12 fact-checked A4 posters
  (black-green Node theme, "verified 2026-06-12 against Node 24 docs"), each with a `_en.txt`
  study note (KEY POINTS + SELF-CHECK), an animated `nodejs_core_05_execution_order_en.gif`, and
  an event-loop hero set. **Reuse these** to (a) match brand exactly and (b) seed chapter content;
  rebuild as crisp SVG / interactive in-app. Their curriculum (01 event_loop … 12 http_lifecycle)
  maps almost 1:1 onto ours. Note: posters indicate **Node 24 LTS era** as of 2026-06 — still web-verify.

## 2. Stack & key decisions (with why)

- **Vite + React 19 + TypeScript (strict)** — best fit for stateful interactive
  simulators (step/play/pause), component reuse across ~20 chapters, and the user's stack.
- **No router library** — small custom **hash router** (`#/chapter/<id>`, `#/map`,
  `#/interview`, `#/mental-models`). Hash routing + `vite base:'./'` makes the build work
  under **any** GitHub Pages sub-path with zero config (proven in the `world-map` example).
- **All content is static** (TS/JSON data modules imported at build time) — no runtime
  fetches, works offline, deploys anywhere.
- **Single source of truth for content:** `src/data/concepts.ts` (+ `interview.ts`,
  `mentalModels.ts`). Chapters/pages are *rendered from data*; we don't hand-write page HTML.
  (Same philosophy as DPmap's `dpmap_data.js`.)
- **Tooling/CI Node:** Node 22 LTS. **Pin & re-verify latest stable** versions at scaffold
  time; for the *Modern Node (2026)* chapter, **web-search current LTS/release lines**
  (knowledge cutoff is older than the live site date).

## 3. Repo layout (target)

```
node-js_comprehensive-guide/            # = git repo root; deploy publishes dist/ only
  index.html                            # app shell (title, favicon, theme-color)
  package.json  vite.config.ts  tsconfig.json  .eslintrc
  .github/workflows/deploy.yml          # Actions → Pages (Node 22, npm ci, build, upload dist)
  .gitignore                            # node_modules, dist, AND Examples/ (see gotchas)
  public/  favicon.svg  .nojekyll
  src/
    main.tsx  App.tsx                   # layout + hash router
    theme/    tokens.css  global.css    # brand tokens (dark + orange)
    data/
      concepts.ts                       # SINGLE SOURCE OF TRUTH (groups + chapters + sections)
      interview.ts                      # the 40 senior/staff Q&A (tagged by chapter)
      mentalModels.ts                   # "draw from memory" gallery entries
    components/
      layout/  TopBar  Sidebar  Toc  ProgressBar  Footer(brand)
      map/     ConceptMap  MapNode  Drawer         # landing overview (clickable → chapter)
      chapter/ ChapterPage  Section  Prose  Figure  CodeBlock  DataTable  Callout  Compare
      sims/    EventLoopSim  AsyncOrderSim  ThreadPoolSim  GcSim  BackpressureSim  ...
      study/   Flashcards  PredictOutputQuiz  InterviewBank
    lib/     hashRouter.ts  search.ts  registry.ts(sim registry)  utils.ts
  scripts/   (PDF pipeline — added in the PDF sessions)
  CLAUDE.md  (this file)
```

## 4. Content / data model (the contract)

Every chapter is data. Renderers turn it into a page. Schema (TS):

```ts
type Group   = { id: string; name: string; accent: string; blurb: string };
type Chapter = {
  id: string; group: string; order: number;
  title: string; full?: string; tagline: string; readMins: number;
  mentalModel: string;            // the one line / picture to recall from memory
  sections: Section[];            // ordered content blocks (prose + figures + sims + …)
  keyPoints: string[];            // bullet takeaways ("draw from memory")
  pitfalls: { title: string; body: string }[];   // senior-level traps & misconceptions
  interview: { q: string; a: string; level?: 'senior'|'staff' }[]; // subset of the 40
  seeAlso: string[];              // related chapter ids (cross-links)
  sources: { title: string; url: string }[];     // for verification + on-page citations
  pdf?: string;                   // deep-dive PDF path (added in PDF sessions)
};
type Section =
  | { kind:'prose';   md: string }
  | { kind:'figure';  fig: string; caption?: string }      // SVG/diagram component key
  | { kind:'sim';     sim: string }                        // interactive widget registry key
  | { kind:'table';   head: string[]; rows: string[][]; caption?: string }
  | { kind:'code';    lang: string; code: string; note?: string }
  | { kind:'callout'; tone:'tip'|'warn'|'senior'; title: string; md: string }
  | { kind:'compare'; a: string; b: string; rows: [string,string,string][] };
```

Figures and sims are referenced by **key** and resolved via a registry (`lib/registry.ts`),
so content stays declarative and widgets stay reusable.

## 5. Curriculum (maps `list of concepts.txt` → chapters)

Four groups (each with an accent), ~20 chapters:

**I · Foundations & mental model**
1. What is Node.js — definition, purpose, scale
2. Strengths — where Node shines
3. Weaknesses — where Node is weak & why
4. Competitors — Deno, Bun, Go, Python, Java, .NET, Rust, Elixir (comparison tables)
5. Top-level architecture — V8 · libuv · bindings · core libs; blocks & their interaction *(interactive architecture diagram)*

**II · The runtime core** *(the heart — most simulators live here)*
6. **Event Loop** — six phases (libuv) · ticks · microtasks  — **HERO SIM**
7. **Async model** — callbacks → promises → async/await · micro/macro ordering — **HERO SIM**
8. **V8 · JIT · memory · GC** (generational) — **HERO SIM**
9. **Concurrency** — worker_threads · cluster · child_process — **HERO SIM** (thread pool vs kernel)
10. **Streams & Buffers · backpressure** — **HERO SIM**
11. Module system — CJS vs ESM (resolution, interop, gotchas)

**III · Building real systems**
12. Error handling — sync/async, domains-are-dead, AsyncLocalStorage, fail-fast
13. Networking & HTTP internals — sockets, keep-alive, parser, HTTP/1.1·2
14. Performance & profiling — flamegraphs, `--prof`, clinic, event-loop lag
15. Security & supply chain — CVEs, npm, permissions model, hardening
16. Production patterns — graceful shutdown · scaling · serverless *(graceful-shutdown sim)*

**IV · Mastery**
17. Modern Node (2026) — versions & capabilities *(web-search to verify)*
18. 40 senior/staff interview questions — filterable bank
19. Mental models — the gallery you must be able to draw from memory
20. Summary — the whole picture on one page

## 6. Hero simulators (priority interactives)

1. **Event Loop Phases** — step the 6 phases; watch timers/poll/check/close queues and
   microtask draining (`nextTick` vs Promise) between phases; ties into a "predict the output" puzzle.
2. **Async ordering visualizer** — a fixed program (sync · setTimeout · setImmediate ·
   nextTick · Promise · await); play/step to reveal exact execution order.
3. **Thread pool vs kernel async** — the reference "live scheme": `fs.readFile ×N` queues on
   the 4-slot libuv pool while `http.get ×N` goes to the OS (epoll/kqueue) threadless; play/pause/step.
4. **GC generational** — young-gen scavenge → promotion → old-gen mark-sweep-compact; minor/major GC, stop-the-world pauses.
5. **Backpressure** — fast producer / slow consumer; buffer vs `highWaterMark`, `.write()===false`, `'drain'`, pause/resume.

**Interactivity policy:** the 5 heroes are mandatory; build a cheap reusable sim/quiz
framework so **adding more per-chapter interactives is low-cost**, then add them opportunistically
("maximal where acceptable") — e.g. CJS/ESM resolver, cluster load split, HTTP keep-alive,
event-loop-lag meter. Where an interactive wouldn't add real insight, ship a crisp SVG diagram + table instead.

## 7. Theme / brand — black + Node green (matches the user's poster series & official Node.js)

**Decision (2026-06-19):** **black + Node-green**, NOT the DPmap orange. Rationale: topical fit
(official Node.js identity) + continuity with the user's own 12-poster Node series
(`Examples/Node-js core concepts`, "black & green Node.js theme"). Orange is **demoted to a
semantic accent** (thread-pool / CPU work) — which is also how the reference diagrams color it.

Core tokens (sampled from the posters + official Node palette `#6CC24A / #44883E / #215732`):

```
--bg:#0A0C0A   --surface:#111511   --s2:#161B16   --line:#243024   --line2:#33402F
--tx:#F4F7F4   --tx2:#9CB3A0       --tx3:#6B7B6E
--accent:#6CC24A          /* brand green, primary */
--accent-deep:#3C873A     /* fills / borders */
--accent-bright:#4ADE80   /* headings / glow highlight */
```

**Semantic palette for diagrams & sims** (carry the poster + reference "color language" — keep consistent):
- **green** = runtime / event loop / kernel async / network
- **orange `#FF7A00`** = thread pool / CPU-bound work  (the personal-brand nod)
- **blue/teal `#38BDF8`** = timers
- **violet `#A78BFA`** = microtasks (nextTick / Promise)
- **red `#F87171`** = errors / leaks / warnings (as in posters 10/11)

Per-group accents stay green-family shades (don't dilute the identity); reserve orange/blue/violet/red for *in-diagram* semantics.
Fonts: **Space Grotesk** (headings) · **Inter** (body) · **JetBrains Mono** (code/labels) — matches posters.
Footer: **"Vasyl Krupka · Senior Fullstack Engineer"** (poster series) + Ukraine flag 🇺🇦. Inline SVG favicon (green Node hexagon). Dark is primary; light theme optional later.

## 8. Deliverables

- **Web guide** (this app) — primary.
- **Deep-dive PDF per concept** — **DEFERRED / dropped (decided 2026-06-19, S9).** Rationale: the 20
  per-chapter PDFs would duplicate already-verified web content, **can't carry the simulators** (the guide's
  differentiator), and add per-edit re-render upkeep + repo bloat; the 12 A4 posters (`Examples/Node-js core
  concepts`) + in-app flashcards already cover portable/offline revision. The `pdf?` field stays in the schema
  for a possible future *single* curated artifact (e.g. a printable interview-prep booklet) — NOT a per-chapter
  dump. Pipeline-of-record if ever revived: **satori → resvg PNG → img2pdf**, black+green theme, Ukraine footer
  (mirror DPmap `srp.js`).
- LinkedIn assets — *not now* (optional later).

## 9. Conventions

- TypeScript **strict** + `noUnusedLocals/Parameters`; ESLint clean (build fails otherwise).
- Content edited **only** in `src/data/*`; never hand-edit rendered output.
- Numbers/labels via shared formatters; links/cross-refs by id.
- **Accessibility:** keyboard nav, focus rings, ARIA on sims, `prefers-reduced-motion`
  (sims must have a non-animated/step fallback), contrast-checked palette.
- **Correctness:** every non-trivial technical claim must be verifiable — fill `sources`
  per chapter; **web-search to confirm** version-sensitive facts (Node releases, libuv pool
  default, flag behavior) rather than trusting memory. Each content session ends with a
  verification step (typecheck + build + fact spot-check).
- Per user rule: mark in-code edits with `// CHANGED:`; propose change + why before doing it.

## 10. Deploy (GitHub Pages via Actions)

- `.github/workflows/deploy.yml`: on push to `main` → `actions/checkout` → `setup-node@22`
  → `npm ci` → `npm run build` → `upload-pages-artifact (dist)` → `deploy-pages`.
  Pages **Source = GitHub Actions**.
- `vite base:'./'` + hash routing + `public/.nojekyll`. Confirm final **repo name** with user
  (URL `https://<user>.github.io/<repo>/`; base `'./'` keeps it sub-path-safe).

## 11. Gotchas / constraints (read before building)

- **`Examples/` must be excluded** from the new git repo & deploy: it contains the two
  reference projects, each with its **own nested `.git`** and large assets. Add `Examples/`
  to `.gitignore` (deploy ships only `dist/`, so it never reaches the live site anyway).
- **Build tool:** Vite 8 uses **Rolldown** (not Rollup/esbuild); CLI bins are `vite`, `rolldown`, `tsc`.
  On **Apple-silicon (M1 Max)** an npm optional-dep bug can leave the native binary missing
  (`Cannot find module …-darwin-arm64`); reinstall the platform package if so. **CI on linux-x64 is unaffected.**
- **This Linux sandbox blocks `unlink`** on the mounted FS, so Vite's `emptyOutDir` fails on a
  **rebuild** into an existing dir (EPERM). Workaround in-sandbox: build into a fresh `--outDir`
  (e.g. `scripts/_prev`) or set `build.emptyOutDir:false`. The user's Mac and GitHub Actions CI
  (normal FS) are unaffected — `npm run build` rebuilds cleanly there.
- **No browser in the sandbox** (no Chromium/Playwright) → can't screenshot the running app.
  Validate via `tsc` + `vite build` (must pass) + targeted unit checks; PDFs render via
  **satori** (HTML→PNG) then `img2pdf`. satori quirks (from DPmap, still apply): use unicode
  not HTML entities; explicit `display:flex` on multi-child nodes; colors from data; **avoid
  the literal word `constructor`** in rendered code (satori drops it) — show factory/field injection.
- File deletes may be restricted in some sandboxes — prefer `mv`/overwrite over `rm`.

## 12. Session roadmap (step by step, 5–12 sessions)

> Pattern (from DPmap): **lock a golden standard first**, then batch. Each session ends with
> typecheck + build + (after Pages is live) a push to confirm deploy.

- **S0 · Planning** *(this session)* — agree stack/structure/scope; write this `CLAUDE.md`; task list. ✅
- **S1 · Scaffold + golden chapter** — Vite/React/TS app, theme, hash router, layout, deploy
  workflow, `.gitignore`, favicon/footer; finalize `concepts.ts` schema; concept-map landing
  (clickable → chapter, content may stub); **Event Loop chapter fully built + Event Loop hero sim**
  (this is the quality bar). Verify build + first Pages deploy.
- **S2 · Async core** — Ch.7 Async model + **Async-ordering sim** + reusable **Predict-the-output quiz** engine.
- **S3 · V8/GC + Concurrency** — Ch.8 + **GC sim**; Ch.9 + **Thread-pool-vs-kernel sim**.
- **S4 · Streams + Modules** — Ch.10 + **Backpressure sim** (+ stream-pipeline interactive); Ch.11 CJS vs ESM (+ resolver interactive).
- **S5 · Foundations (Part I)** — Ch.1–5 (what/why, strengths, weaknesses, competitors tables, **architecture diagram**).
- **S6 · Real systems A** — Ch.12 Errors; Ch.13 Networking & HTTP internals (+ HTTP-lifecycle interactive).
- **S7 · Real systems B** — Ch.14 Performance & profiling; Ch.15 Security & supply chain; Ch.16 Production patterns (+ graceful-shutdown sim). *(web-search current tooling/CVEs.)*
- **S8 · Mastery + polish** — Ch.17 Modern Node 2026 *(web-search versions)*; Ch.18 Interview bank (40 Q); Ch.19 Mental-models gallery; Ch.20 Summary; global search, flashcards, mobile/a11y/perf pass.
- **S9–S10 · Deep-dive PDFs** — satori pipeline; one golden PDF, then batch by group; link `pdf` per chapter.
- **S11–S12 · Buffer** — extra "maximal" interactives, final QA, optional LinkedIn pack.

## 13. Status / progress log

- **2026-06-19 · S0 Planning** — Reviewed both example projects + reference PNGs + concept list.
  Decisions locked (Vite+React+TS · chapters+concept-map · hero sims + maximal-where-useful ·
  per-concept deep-dive PDFs). This `CLAUDE.md` written + task list created.
- **2026-06-19 · S0 Theme decision (amended)** — Found `Examples/Node-js core concepts` (12 black-green
  Node posters + study notes, curriculum-aligned). **Brand changed: dark + Node-green** (was orange);
  orange demoted to a semantic "thread-pool/CPU" accent. Palette + semantic colors pinned in §7;
  posters registered as visual brand + content seed in §1. **Next: S1 scaffold + Event Loop golden chapter** (awaiting go).
- **2026-06-19 · S1 Scaffold + Event Loop golden chapter** — DONE. Vite 8 + React 19 + TS (strict)
  app; black+green theme (`theme/tokens.css` + `global.css`); custom hash router; TopBar (with
  search) / Sidebar / Footer; concept-map landing; 20-chapter data model in `src/data` (Event Loop
  fully built, 19 seeded stubs each with mental model + key points); **Event Loop hero simulator**
  (drives a verified engine — 2 scenarios match known console output) + `EventLoopRing` SVG;
  Interview bank + Mental-models pages; GitHub Actions deploy workflow; `README.md`.
  **Verified:** `tsc` clean · `vite build` OK (JS ≈78 kB gzip, relative `./assets`) · engine unit
  test ALL PASS · SSR smoke of all 7 routes OK. **Pending (user):** create the GitHub repo, push,
  set Pages Source = GitHub Actions. **Next: S2 — Async model + async-ordering sim + quiz engine.**
- **2026-06-19 · S2 Async core** — DONE. Ch.7 **Async model** fully built (was a stub): 3-styles
  table + side-by-side code, **await suspend/resume** figure (`AwaitTimeline`), micro/macro priority
  ladder, serial-vs-`Promise.all` compare, 7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  **Async-ordering hero sim** (`asyncEngine.ts` + `AsyncOrderSim`): pure/deterministic engine, code
  panel w/ active-line highlight, three lanes (call stack · microtasks · macrotasks) + numbered
  console; 3 scenarios (micro-vs-macro · await · two-fn interleave). **Reusable Predict-the-output
  quiz engine** (`study/PredictOutputQuiz` + `data/quizzes.ts`, 5 Qs) — registered as a sim so any
  chapter can drop one in. Small infra: `Md` internal `#/…` links navigate in-app; `ChapterPage`
  tags only the FIRST sim as `#simulator` (sim + quiz now coexist); `npm test` runs both engine suites.
  **Correctness:** all sim/quiz outputs **captured from real Node 22** (`scripts/node-truth-async.mjs`)
  and asserted in `scripts/test-async.ts`; engine reproduces them exactly. Found + documented the
  **CJS-vs-ESM `nextTick` ordering flip** (pitfall + callout, verified). **Verified:** `tsc` clean ·
  `vite build` OK (JS ≈88 kB gzip) · both engine suites ALL PASS · SSR smoke 7 routes + async-model
  content assertions OK. (Scratch build dirs `scripts/_*/` gitignored; user can delete them locally.)
  **Next: S3 — V8/GC + GC sim; Concurrency + thread-pool-vs-kernel sim.**
- **2026-06-19 · S3 V8/GC + Concurrency** — DONE (largest batch so far). Two stub chapters built to
  the golden standard, each with a verified hero sim:
  • **Ch.8 V8 · JIT · memory & GC** — compilation pipeline (Ignition→Sparkplug→**Maglev** (default in
  Node 22 / V8 12.4, web-verified)→TurboFan) + tiers table + deopt callout; hidden classes + inline
  caches (+ shape-drift code); generational-heap figure (`GcHeap`); Scavenge vs Mark-Sweep-Compact
  (Orinoco) prose + compare; **GC hero sim**; flags/tuning table; leak ("old space that never
  shrinks") callout; 7 key points, 5 pitfalls, 5 interview Q&A, verified V8/Node sources.
  • **Ch.9 Concurrency** — thread-pool-vs-kernel figure (`ThreadPoolKernel`); libuv pool (default 4,
  `UV_THREADPOOL_SIZE`≤1024; backs async fs/crypto/zlib + `dns.lookup`; sockets→kernel); **`dns.lookup`
  vs `dns.resolve`** senior callout; **thread-pool hero sim** (live pool-size control); worker_threads
  code + worker/cluster/child_process table + worker-vs-child compare; decision-guide callout;
  **concurrency predict-output quiz**; 7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  **Two new verified engines (truth-first):** `threadPoolEngine.ts` reproduces real Node 22 pool waves
  (pbkdf2×6 → pool2 `[2,2,2]`, pool4 `[4,2]`, pool6 `[6]`), captured in `scripts/node-truth-threadpool.mjs`,
  asserted in `scripts/test-concurrency.ts`. `gcEngine.ts` models Scavenge→promote→Mark-Sweep-Compact;
  invariants in `scripts/test-gc.ts` (minors>majors, ≥1 major, promotions, permanent-object
  conservation); real GC ratio via perf_hooks in `scripts/node-truth-gc.mjs` (minor **52 : 1** major;
  **271 : 1** with `--max-semi-space-size=1`). Sims `GcSim`+`ThreadPoolSim` (+css) and both figures
  registered in `lib/registry.tsx`; `concurrencyQuiz` (3 Qs, outputs captured from real Node 22) added
  to `data/quizzes.ts`; +4 entries in the interview bank (`data/interview.ts`). `npm test` now runs **4**
  engine suites. **Verified:** `tsc` clean · `vite build` OK (JS ≈105 kB gzip) · all 4 suites ALL PASS ·
  SSR smoke **8 routes** + v8-gc/concurrency content assertions OK. (Scratch `scripts/_s3dist`,
  `scripts/_ssr_s3` gitignored; sandbox can't `unlink`, delete locally.)
  **Next: S4 — Ch.10 Streams + Backpressure sim (+ stream-pipeline interactive); Ch.11 Modules CJS vs ESM (+ resolver interactive).**
- **2026-06-19 · S4 Streams + Modules** — DONE. Two stub chapters built to the golden standard, each
  with a verified interactive:
  • **Ch.10 Streams & Buffers** — readFile-vs-stream memory contrast; Buffer-vs-stream callout; 4-types
    table; backpressure mechanics (highWaterMark, write()===false, 'drain'); **`StreamPipeline` figure**
    (data forward / backpressure backward); **Backpressure hero sim** (Respect⇄Ignore toggle + hwm
    selector — watch the buffer stay bounded vs balloon); pipe-vs-pipeline compare; modern async-iterator
    + `Readable.from` + `stream/promises` code; OOM + objectMode callouts; 7 key points, 5 pitfalls,
    5 interview Q&A, verified sources.
  • **Ch.11 Modules: CJS vs ESM** — loading-model framing; full CJS-vs-ESM table; CJS sync/depth-first/
    cache + ESM parse→link→evaluate prose; **Module-resolver hero sim** (`module-resolver`: steps the
    SAME diamond graph each way — CJS interleave + cache hit vs ESM 3-phase); live-binding callout +
    code; require()-vs-import compare; interop (require(esm) since 22.12, node: prefix, named-export
    heuristics) + interop table; dual-package-hazard & circular-partial callout; **modules predict-output
    quiz** (3 Qs); 7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  **Two new verified engines (truth-first):** `streamEngine.ts` (fast producer / slow consumer; write()
    flips false at buffered ≥ hwm; respect bounds the buffer at the mark, ignore overflows it) — invariants
    in `scripts/test-streams.ts`, real behaviour + defaults (byte hWM **65536**, objectMode **16**) captured
    in `scripts/node-truth-streams.mjs`. `moduleEngine.ts` (CJS depth-first+cache vs ESM parse/link/evaluate
    over a diamond) — `scripts/test-modules.ts` asserts both evaluate post-order **[base,left,right,app]**,
    base once, CJS interleaves, ESM separates phases; `scripts/node-truth-modules.mjs` records the real
    eval order, ESM live binding (0→1) vs CJS copy (0→0), and the circular read (**CJS undefined+warning**
    vs **ESM hoisted 'function'**). Sims `BackpressureSim`+`ModuleResolverSim` (+css) and `StreamPipeline`
    figure + `modulesQuiz` registered in `lib/registry.tsx`/`data/quizzes.ts`; +5 interview-bank entries.
    `npm test` now runs **6** engine suites. Fixed `.gitignore` to actually ignore all `scripts/_*` scratch
    dirs (was only `_prev`). **Verified:** `tsc` clean · `vite build` OK (JS ≈121 kB gzip, relative
    `./assets`) · all **6** suites ALL PASS · SSR smoke **10 routes** + streams/modules content assertions OK.
    (Scratch `scripts/_s4dist`, `scripts/_ssr_s4` now gitignored; sandbox can't `unlink`, delete locally.)
  **Next: S5 — Foundations (Part I): Ch.1–5 (what/why, strengths, weaknesses, competitors tables, architecture diagram).**
- **2026-06-19 · S5 Foundations (Part I)** — DONE. All five stub chapters (Ch.1–5) built to the golden
  standard; **three new interactives** (architecture chosen as the hero + the two "maximal" extras the
  user requested).
  • **Ch.1 What is Node.js** — `NodePieces` figure (V8+libuv+bindings); runtime-not-framework framing +
    OpenJS/Ryan-Dahl history; **Node IS / IS NOT** compare; http-server + `process.versions` code;
    6 key points, 3 pitfalls, 4 interview Q&A, verified sources.
  • **Ch.2 Strengths** — `ConnectionScaling` **C10k figure** + **Throughput sim** (`throughputEngine` +
    `ThroughputSim`: slider ramps connections; thread-per-request ~1 MiB/thread vs event-loop ~64 KiB/socket;
    blow-up approaches the **16×** ceiling — 10k conns ⇒ 9.8 GiB/10k threads vs 655 MiB/1 thread); where-Node-fits
    table; **concurrency≠parallelism** callout; sweet-spot compare.
  • **Ch.3 Weaknesses** — `BlockingLoop` figure (one 250 ms sync task stalls every in-flight request);
    cardinal-sin (sync APIs / ReDoS) callout; weakness→mitigation table; **GC-leak→latency** senior callout;
    symptom→cause table.
  • **Ch.4 Competitors** — `CompetitorMap` positioning figure (I/O+velocity vs CPU+raw-perf) + **RuntimePicker
    decision widget** (`data/runtimes.ts`, 8 bottleneck cases → best/runner-up/caveat); JS-runtimes table
    (Node/Deno/Bun) + cross-language table; engines&models callout. **Web-verified mid-2026: Node 24 Active LTS
    (22 maintenance, 26 current), Deno 2.8, Bun 1.3 (JavaScriptCore/Zig).**
  • **Ch.5 Top-level architecture** — `ArchitectureStack` figure + **Architecture trace-a-call HERO sim**
    (`architectureEngine` + `ArchitectureSim`: 3 scenarios end at 3 destinations — `fs.readFile`→**pool**,
    `https.get`→**kernel** (no thread held), `JSON.parse`→**V8** and **blocks the loop**); **V8≠Node** callout;
    `process.versions` table; "see it yourself" callout.
  **Two truth-anchored engines:** `architectureEngine` (routing invariants: fs uses pool not kernel, net uses
  kernel not pool, cpu never leaves js+v8 and is the only one that blocks; **asserts the diagram's native deps
  `v8/uv/openssl/zlib/llhttp/ares` are real keys of `process.versions`** on the running Node) and `throughputEngine`
  (C10k structural invariants + the ~16× asymptote). Tested in `scripts/test-architecture.ts` (38 checks) +
  `scripts/test-throughput.ts`; **`npm test` now runs 8 engine suites.** New sims/figures registered in
  `lib/registry.tsx`; **+10 interview-bank entries** (topic "Foundations") in `data/interview.ts`; smoke-entry
  extended to the 5 new routes + content assertions. **Verified:** `tsc` clean · `vite build` OK (JS ≈144 kB gzip,
  relative `./assets`) · **all 8 engine suites ALL PASS** · SSR smoke **15 routes** + Foundations content OK.
  (Scratch `scripts/_s5dist`, `scripts/_ssr_s5` gitignored; sandbox can't `unlink`, delete locally.)
  **Next: S6 — Ch.12 Errors; Ch.13 Networking & HTTP internals (+ HTTP-lifecycle interactive).**
- **2026-06-19 · S6 Real systems A** — DONE. The two `systems` stub chapters built to the golden
  standard, each with a verified interactive (truth-first as always):
  • **Ch.12 Error handling** — operational-vs-programmer taxonomy (`ErrorTaxonomy` figure) + compare;
    the **four error channels** table (sync throw · Promise rejection · err-first callback · EventEmitter
    'error') and why try/catch is a *synchronous-only* tool; **Error-propagation interactive**
    (`error-propagation`: 6 scenarios — sync/await caught vs timer-throw → uncaughtException, floating →
    unhandledRejection, ignored err-first → swallowed, unlistened emitter 'error' → crash; code panel with
    active-line highlight + verdict); async/await-as-one-channel + bad-vs-good code; **fail-fast** callout
    (unhandledRejection terminates by default since Node 15 — handlers log+exit, supervisor restarts);
    **AsyncLocalStorage** for request context (domains deprecated) + code; Error `{cause}` + error classes;
    7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  • **Ch.13 Networking & HTTP internals** — bytes → **llhttp** → req/res → handler → streamed response →
    socket reused/closed; **keep-alive Agent pool** figure (`KeepAlivePool`); **HTTP-lifecycle HERO sim**
    (`http-lifecycle`: 3 scenarios end three ways — keep-alive **reuse** (no handshake) · `Connection: close`
    **handshake** every time · slow client → **headersTimeout 408**; actor pipeline client→socket→llhttp→
    handler, loop stays *free* throughout); Agent-knobs table; **HTTP/1.1 vs HTTP/2** prose+compare (HOL vs
    multiplexing; nghttp2; **HTTP/3/QUIC experimental** in core → terminate at edge); the **timeout triad**
    (`TimeoutTriad` timeline figure + table) and the **keep-alive 502 race** callout; correct-server code;
    7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  **Two new truth-anchored engines:** `errorEngine.ts` (outcome/survives table captured from real Node via
  forked child exit codes in `scripts/node-truth-errors.mjs`; `scripts/test-errors.ts` also **live-verifies
  routing** on Node 22 — sync/await caught here; timer-throw escapes the surrounding try/catch into
  uncaughtException; a floating rejection reaches unhandledRejection; an unlistened EventEmitter 'error'
  throws). `httpEngine.ts` (request-lifecycle scenarios; **defaults read from a real `http.Server`** and
  asserted in `scripts/test-http.ts` — keepAliveTimeout **5000** · headersTimeout **60000** · requestTimeout
  **300000** (on by default since Node 18) · server.timeout **0**; globalAgent `keepAlive:true` (Node ≥19),
  maxFreeSockets **256**, scheduling **'lifo'**, maxSockets **∞**; `node-truth-http.mjs` proves a keep-alive
  Agent **reuses the same socket** — identical client port 43170×2 — while a non-keep-alive Agent opens new
  ones). **Web-verified mid-2026:** HTTP/2 stable (`node:http2`/nghttp2); **QUIC/HTTP3 still experimental**
  (`node:quic`/nghttp3 — Stability 1; no ngtcp2/nghttp3 in default `process.versions`). Sims
  `ErrorPropagationSim`+`HttpLifecycleSim` (+css) and figures `ErrorTaxonomy`/`KeepAlivePool`/`TimeoutTriad`
  registered in `lib/registry.tsx`; **+6 interview-bank entries** (3 Errors, 3 HTTP) in `data/interview.ts`;
  smoke-entry extended to the 2 new routes + content assertions. **`npm test` now runs 10 engine suites.**
  **Verified:** `tsc` clean · `vite build` OK (JS ≈162 kB gzip, relative `./assets`) · **all 10 engine
  suites ALL PASS** · SSR smoke **17 routes** + errors/http content OK. (Scratch `scripts/_s6dist`,
  `scripts/_ssr_s6` gitignored via `scripts/_*`; sandbox can't `unlink`, delete locally.)
  **Next: S7 — Ch.14 Performance & profiling; Ch.15 Security & supply chain; Ch.16 Production patterns (+ graceful-shutdown sim). (web-search current tooling/CVEs.)**
- **2026-06-19 · S7 Real systems B** — DONE. All three remaining `systems` stub chapters built to the
  golden standard, each with a verified interactive (truth-first as always); user chose the "all 3 +
  ~3 interactives" scope.
  • **Ch.14 Performance & profiling** — measure-don't-guess; CPU-bound-vs-I/O-bound split; **event-loop
    lag as the pulse** (`perf_hooks.monitorEventLoopDelay` ns histogram + `eventLoopUtilization`); **Event-loop
    lag HERO sim** (`eloop-lag`: workload tabs + on-loop-CPU slider — once CPU/request exceeds the arrival
    gap a queue forms ON the loop, p99 explodes, ELU→100%); **`FlameGraph` figure** (width = CPU samples,
    widest tower = hot path); tool table (`--cpu-prof`/`--prof`/0x/Clinic/autocannon); optimization menu
    (cache → worker_threads → stream → cut allocations → micro-opt); lag+ELU metric code; CPU-vs-I/O compare;
    profiling-pitfalls callout; 7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  • **Ch.15 Security & supply chain** — "Node trusts any code it runs" → transitive tree IS the attack
    surface (`SupplyChainTrust` figure); 2025–26 wave (Shai-Hulud, debug/chalk, Axios); **Supply-chain
    defense sim** (`supply-chain`: 6 defenses × 5 real attack classes → blocked/contained/exposed; no single
    control suffices); **provenance proves origin-not-intent** senior callout (wave-4 attested malware);
    **Permission Model** (stable since 23.5: `--permission`; gates fs/child_process/worker/addons/wasi;
    `process.permission.has`; **a seat belt, NOT a sandbox**; **`--allow-net` still experimental**) + least-priv
    code + stable-flags table; app-hardening prose (input/ReDoS, eval, headers, secrets, OpenSSL); patch-fast
    callout; 7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  • **Ch.16 Production patterns** — the SIGTERM contract (fail readiness → stop intake → drain → close →
    exit0); `ShutdownSequence` figure (k8s lane + process lane + force-exit backstop); **Graceful-shutdown
    HERO sim** (`graceful-shutdown`: graceful **drains 0 dropped / exit 0** vs abrupt **drops all 3 → 502s**;
    live in-flight/dropped/exit-code meters); the k8s **endpoint-removal race** senior callout (fail readiness
    + preStop sleep); correct handler code (`closeIdleConnections()` + `server.close` + force timer); scaling
    (≈1 loop/core, cluster/replicas, stateless) + supervisor table; observability (liveness≠readiness, RED,
    AsyncLocalStorage req-id, lag gauge); serverless (cold start, init-outside-handler, pool caps); graceful-vs-abrupt
    compare; 7 key points, 5 pitfalls, 5 interview Q&A, verified sources.
  **Three new truth-anchored engines (truth-first):** `eventLoopLagEngine.ts` (single-server FIFO CPU queue:
  CPU < arrival-gap ⇒ lag 0 & flat p99; CPU > gap ⇒ unbounded lag, p99≫p50, ELU 100%) — invariants +
  **live** `monitorEventLoopDelay`/ELU anchor in `scripts/test-performance.ts` (idle max ~12 ms vs blocked
  ~62 ms; ELU idle 0.006 vs busy 1.0, captured in `node-truth-performance.mjs`). `supplyChainEngine.ts`
  (defense×attack matrix: ignore-scripts blocks the worm, cooldown blocks hijacked-popular+attested-malware,
  **provenance does NOT block attested malware**, audit blocks known-CVE, all-on ⇒ 0 exposed) — invariants +
  **live Permission-Model anchor** in `scripts/test-security.ts` (stable `--allow-*` set = {fs-read,fs-write,
  child-process,worker,addons,wasi}; **no `--allow-net`**; granting fs.read grants only fs.read — captured in
  `node-truth-security.mjs`; openssl 3.5.6). `shutdownEngine.ts` (graceful drains 0/exit0 vs abrupt drops
  all/exit≠0; in-flight monotonically drained) — invariants + **live** `server.close()` drains-an-in-flight-
  request-before-its-callback + `closeIdleConnections`/`closeAllConnections` exist, in `scripts/test-production.ts`
  (`node-truth-shutdown.mjs`). Sims `EventLoopLagSim`+`SupplyChainSim`+`GracefulShutdownSim` (+css) and figures
  `FlameGraph`/`SupplyChainTrust`/`ShutdownSequence` registered in `lib/registry.tsx`; **+6 interview-bank entries**
  (2 Performance, 2 Security, 2 Production) in `data/interview.ts`; smoke-entry extended to the 3 new routes +
  content assertions. **`npm test` now runs 13 engine suites.**
  **Web-verified mid-2026:** Permission Model **stable since Node 23.5** (`--permission`); **`--allow-net`
  experimental**; `perf_hooks.monitorEventLoopDelay`/ELU; Clinic.js/0x/`--cpu-prof`; npm supply-chain wave
  (Shai-Hulud/debug-chalk/Axios), provenance/Trusted Publishing, **pnpm `minimumReleaseAge` (default 1 day in
  pnpm 11)**; k8s pod-termination (endpoint removal async, default grace 30 s); Node security releases (Jan &
  Mar 2026, lines 20/22/24/25). **Verified:** `tsc` clean · `vite build` OK (JS ≈179 kB gzip, relative
  `./assets`) · **all 13 engine suites ALL PASS** · SSR smoke **20 routes** + performance/security/production
  content OK. (Scratch `scripts/_s7dist`, `scripts/_ssr_s7` gitignored via `scripts/_*`; sandbox can't `unlink`,
  delete locally.)
  **Next: S8 — Mastery + polish: Ch.17 Modern Node (2026, web-search versions); Ch.18 Interview bank (grow to 40 Q); Ch.19 Mental-models gallery; Ch.20 Summary; global search, flashcards, mobile/a11y/perf pass.**
- **2026-06-19 · S8 Mastery + polish** — DONE (all-in-one, user's choice). The four Mastery chapters
  finished and the app-wide study/search/polish landed. The web guide is now **content-complete — all 20
  chapters built**.
  • **Ch.17 Modern Node (2026)** — built to golden standard + the **Version-timeline HERO sim**
    (`version-timeline`: scrub Node 18→26, each line reveals what landed **stable** (green) vs **experimental**
    (orange) + its LTS status; play/step, reduced-motion aware) driven by a truth-anchored `versionTimelineEngine`
    and the `VersionTimeline` release-lifecycle figure. 13 sections incl. capability cheat-sheet table, then-vs-now
    compare, TypeScript-without-a-build prose (type stripping ≠ type-checking; decorators/NestJS caveat), the
    Oct-2026 schedule-change callout; 7 KP, 5 pitfalls, 5 IV, verified sources. **Web-verified mid-2026:** **24
    Active LTS** (V8 13.6, npm 11), **22 Maintenance**, **26 Current** (V8 14.6, Temporal default, Undici 8),
    **20 EOL 30 Apr 2026**, **18 EOL**; type-stripping default in 24 (stable 24.12), Permission Model stable 23.5,
    require(esm) unflagged 22.12, WebSocket stable 22, **node:sqlite (22.5) + fs.glob still experimental**,
    **HTTP3/node:quic still experimental**; **schedule change Oct 2026 → Node 27: one major/yr, calendar-year
    versions, every release LTS, Alpha channel**.
  • **Ch.20 Summary** — the capstone: **`WholePicture` causal-spine figure** (one thread → never block → offload →
    stream → fail safe; V8+GC underneath, same thread), a "six pictures to hold" recap table, strength-vs-design
    compare, the **3-sentence distillation**, the four-group throughline, and a turn-reading-into-recall callout.
    9 sections, 7 KP, 5 recurring-trap pitfalls, 4 capstone IV.
  • **Ch.19 Mental-models** — gallery expanded **5 → 19 cards** (one+ per major concept, each tied to its real
    figure); `MentalModelsPage` upgraded — **group filter**, **reveals the actual diagram** (not just text),
    group chip, `aria-expanded`, reduced-motion.
  • **Ch.18 Interview** — bank already at **44 Q** (target 40 met, found pre-built) so **no new content**; fixed the
    stale "growing to 40" copy and added **free-text search** over Q+A on `InterviewPage`.
  • **Flashcards** (new study feature) — `/flashcards` route + nav; unified deck (`lib/flashcards.ts`) assembled
    from the 19 mental models + 44 interview Qs (**63 cards**, no new content to maintain); reveal-then-grade where
    **"Again" re-queues** the card so a round repeats what you miss; group/source filters, shuffle/restart,
    keyboard (space=flip · 1=again · 2=got it · ←=prev), progress + counts, reduced-motion.
  • **Global search upgrade** — `lib/search.ts` indexes chapters **incl. section prose/callouts/tables**, the
    interview bank and the mental-models gallery; `TopBar` search now returns **ranked, categorised hits**
    (Chapter / Q&A / Model badges) with arrow-key nav + combobox ARIA.
  • **Mobile/a11y/perf pass** — phone media query (nav wraps to its own row, brand-sub hidden, tighter content
    padding), reduced-motion fallbacks on the new sim + flashcards, ARIA on the timeline track + search combobox +
    reveal buttons.
  **Truth-first as always:** `versionTimelineEngine` + `scripts/test-modern.ts` assert internal consistency
  (monotonic majors + V8, exactly one Active-LTS / one Current, `NOW` matches the data) **and live-probe the
  running Node** — every capability whose line ≤ the running major must actually exist here (fetch, structuredClone,
  node:test, WebSocket, fs.glob, Maglev all PASS on Node 22; **URLPattern/Temporal correctly absent until 24/26**).
  `scripts/node-truth-modern.mjs` captures the real capability surface. Sims/figures `version-timeline` +
  `whole-picture` registered in `lib/registry.tsx`; `npm test` now runs **14** engine suites; smoke-entry extended
  to **22 routes** + modern-node/summary/mental-models/interview/flashcards content assertions.
  **Verified:** `tsc` clean · `vite build` OK (JS ≈**201 kB gzip**, CSS ≈11.6 kB, relative `./assets`) · **all 14
  engine suites ALL PASS** · SSR smoke **22 routes** + S8 content assertions **SMOKE OK**. (Scratch `scripts/_s8dist`,
  `scripts/_ssr_s8` gitignored via `scripts/_*`; sandbox can't `unlink`, delete locally.)
  **Next: S9–S10 — deep-dive PDFs (satori → PNG → img2pdf): one golden PDF, then batch by group; link `pdf` per chapter.**
- **2026-06-19 · S9 Polish & ship (PDF plan dropped)** — Pivoted: reviewed the planned deep-dive PDFs with the
  user and **dropped the 20-PDF deliverable** (duplicate of verified web content, can't carry the sims, upkeep +
  bloat; posters + flashcards already cover portable revision — see §8 for the full rationale + revive-it pipeline).
  Spent the session hardening + shipping the web guide instead. **Added `scripts/qa-integrity.ts`** — a no-browser
  content/link integrity checker (**825 checks**): chapter id/order uniqueness, group validity, **every `seeAlso`
  resolves**, **every section sim/figure key is registered** in `lib/registry.tsx` (0 orphans), **all 85 in-prose
  `#/` links resolve**, sources are well-formed https, interview/mental-model refs + quiz answer indices valid,
  tables non-ragged. Wired into `npm test` (now **15** suites: 14 engine + qa) + a standalone `npm run qa`.
  **Fix:** C10K source `http→https` (verified the host supports TLS) — the one issue QA surfaced. **Audited, no
  change needed:** a11y (global `:focus-visible`, `prefers-reduced-motion` kill-switch, `.skip-link`→`#main`
  landmark, `.sr-only`), mobile (900px sidebar-collapse + 560px nav-wrap), router fallback (any unknown hash →
  map; bad chapter id → friendly not-found). **Added:** Open Graph + Twitter `summary` meta to `index.html` for
  link unfurls (text-only; TODO add a 1200×630 `og:image` to upgrade to a rich card). **Verified:** `tsc` clean ·
  `vite build` OK (JS **200.73 kB gzip**, CSS 11.6 kB, paths rewritten relative `./`) · **all 15 test suites PASS** ·
  SSR smoke **22 routes / 142 content assertions / 0 fail**. Deploy confirmed ship-ready (`base:'./'`, `.nojekyll`,
  favicon→`./`, Actions workflow correct). (Scratch `scripts/_s9dist`, `scripts/_ssr_s9` gitignored via `scripts/_*`;
  sandbox can't `unlink`, delete locally.)
  **Next: USER — create the GitHub repo, set Pages Source = GitHub Actions, push `main` to go live. Optional later:
  one curated interview-prep PDF booklet; a 1200×630 og:image.**
- **2026-06-19 · S9b Header fix · About page · LinkedIn · scripts type-checking** — Post-review polish from user
  feedback. **Fixed the header:** brand title + sub-label were two inline spans collapsing onto one line
  ("Guidesenior/staff…"); wrapped them in a `.brand-text` flex-column so the sub sits under the title. **New About
  page** (`/about` route + nav tab + `components/pages/AboutPage.tsx`) — concise meta page: what it is · what's
  inside (the 4 parts rendered live from `GROUPS`) · how it's built (truth-first / single-source / static) ·
  author + LinkedIn, with two CTAs; counts (`chapters/parts/interview/models`) are live from the data layer.
  **LinkedIn** (https://www.linkedin.com/in/vasyl-krupka/) added to the footer (every page) + the About author line.
  **Scripts now type-check cleanly in the IDE:** added `@types/node@22` + a scoped **`scripts/tsconfig.json`**
  (`types:["node"]`) so `node:*` / `process` / `import.meta` resolve in the Node scripts, while the app build keeps
  node types OUT of `src` (root tsconfig **`"types": []`** — browser code can't lean on process/Buffer, and the
  DOM `setTimeout`→number typing is preserved). Fixed the two errors this surfaced: `qa-integrity.ts` unused
  `CHAPTER_BY_ID` import + a latent unused `req` in `test-production.ts`. smoke-entry extended to **23 routes**
  (+about assertions; note React escapes `'` in SSR output, so assert apostrophe-free strings); `qa` KNOWN_ROUTES
  += `/about`. **Verified:** app+scripts `tsc` clean · `vite build` OK (JS **201.93 kB gz**, CSS 11.6 kB) ·
  **15/15 test suites + QA 825/0** · SSR smoke **23 routes / 148 assertions / 0 fail**. (Scratch `scripts/_s9d2`,
  `scripts/_ssr_s9b|c` gitignored via `scripts/_*`.)
- **2026-06-19 · S9c Mental-models figures + bilingual README** — User flagged the gallery over-promised ("18
  pictures … reveal the real diagram") while **4 of 18 cards had no figure** (`v8-not-node`, `microtask-priority`,
  `jit-tiers`, `cjs-vs-esm`). Gave all 18 a diagram: reused the previously-unused **`node-pieces`** figure for
  V8-is-not-Node, and built **3 new on-brand SVG figures** — `MicrotaskLadder` (sync→nextTick→Promise→one macrotask:
  timers/check), `JitTiers` (Ignition→Sparkplug→Maglev→TurboFan + deopt fall-back), `ModuleLoadCompare` (CJS sync
  depth-first vs ESM parse→link→evaluate; require(esm) since 22.12) — registered in `lib/registry.tsx`
  (`microtask-ladder`/`jit-tiers`/`module-load-compare`) and assigned to the 3 figureless cards. Every gallery card
  now reveals a real diagram and the "18 pictures" claim is true. Also (S9b+) added a **bilingual EN/UA README**
  (World Explorer style) and confirmed the live URL `https://endorrfin.github.io/nodejs-comprehensive-guide/`.
  **Verified:** `tsc` clean · `vite build` OK (JS **204.02 kB gz**) · QA **829/0** (figures 18→21; all 18 models
  have a figure) · SSR smoke **23 routes / 148 assertions / 0 fail**. (Scratch `scripts/_s9d3`, `scripts/_ssr_s9d`
  gitignored.) **Resolved (user):** keep the Map page full-width (status quo — the card grid IS the navigator,
  a sidebar there would duplicate it); renamed the nav tab **Map → Overview** (+ aligned the brand aria-label, the
  not-found "Back to overview" button, and the About CTA). Route `#/map` and the `.map-*` CSS classes are unchanged.
  Re-verified: `tsc` clean · `vite build` OK · SSR smoke 23 routes / 148 / 0 fail.
- **2026-06-21 · S9d og:image (rich social card)** — Built a 1200×630 branded OG image (black + Node-green,
  hexagon logo, title, key-topics subtitle, chips: 20 chapters / 15 simulators / interview bank / flashcards,
  Ukraine flag + author + domain) via a tracked **satori → resvg** generator (`scripts/ogtools/render.mjs` + its
  own gitignored `node_modules`; @fontsource **.woff** — satori rejects woff2; literal `&`, not `&amp;`, per the
  satori entity gotcha). Output committed at `public/og.png` → ships to dist root. Wired `index.html`:
  `og:image` / `og:url` / `og:image:width|height|alt` + upgraded `twitter:card` to **summary_large_image** +
  `twitter:image` (absolute Pages URLs). **Verified:** `tsc` clean · `vite build` OK · built `index.html` carries
  the tags · `og.png` (72 kB) copied to dist. (Scratch `scripts/_s9d6` gitignored.) **Note:** after deploy, refresh
  scraper caches via LinkedIn Post Inspector / X Card Validator so the new card shows.
- **2026-06-21 · S9e Mobile chapter-nav drawer** — User asked for mobile adaptation. Audit: it was NOT
  desktop-only — base responsiveness already exists (layout collapses to 1 col <900px, nav wraps <560px,
  tables/figures/code scroll-x globally, and the sims carry their OWN breakpoints — architecture/async/backpressure
  etc. stack to 1 col <720–820px). The real gap was navigation: the chapter sidebar is hidden <900px with no
  replacement. Added (additive, desktop untouched): a mobile-only **hamburger (☰)** in `TopBar` (shown <900px) that
  opens a **slide-in drawer** reusing the existing `Sidebar` — close on backdrop / Esc / ✕ / navigation; drawer
  state in `App` (`navOpen`), gated so it can NEVER show ≥901px. CSS: `.nav-toggle` / `.drawer-backdrop` /
  `.drawer-panel` + a `.drawer-panel .sidebar` override (neutralizes the desktop sticky/full-height AND the <900px
  `display:none`). Deliberately did NOT do a blind sim-CSS pass (sims already responsive; content already scrolls)
  — fine-tuning deferred to real-device screenshots. **Verified:** `tsc` clean · `vite build` OK · SSR smoke
  23 routes / 148 / 0 fail (drawer is closed in SSR → unaffected). (Scratch `scripts/_s9d7|8`, `scripts/_ssr_s9g|h`
  gitignored.) **Next:** user device-tests + sends mobile screenshots to iterate (cramped sims, drawer feel).
- **2026-06-21 · S9f Sim mobile fine-tune** — From device screenshots: the drawer works great, and `architecture`
  + `http-lifecycle` already adapt (native-tier → 1 col; actor lane wraps + arrows hidden). Two genuinely needed
  work: **thread-pool** — its slot grid is inline-styled `repeat(poolSize,1fr)`, so capped to **2 cols on ≤560px**
  (`!important` to beat the inline grid; mobile only); **backpressure** — pipeline already fit but tight, so on ≤560px
  the Readable/Writable nodes get more room (narrower tank/buffer + smaller node padding), arrows left untouched so the
  write()/flush pills stay intact. Both mobile-only; desktop unchanged. **Verified:** `tsc` clean · `vite build` OK
  (rules present in minified CSS) · SSR smoke 23 / 148 / 0. **Confirmed via 400px screenshots:** thread-pool now 2-col,
  backpressure roomy with the write()/flush pills intact, drawer perfect; wide 4-col tables scroll-x (standard mobile
  pattern, left as-is per user).
- **2026-06-21 · S9g Event-loop token in the real figure + a real .mp4** — Added the orbiting green token to the
  **real `EventLoopRing`** (a CSS-rotated `<circle class="el-ball">` around the ring centre 340,190; shows in the
  Event Loop chapter + mental-models gallery; freezes under prefers-reduced-motion via the global rule). Also produced
  a real **`demo/event-loop.mp4`** (1280×720 · 4s · ~50 KB · h264) **without any screen capture**: a headless frame
  renderer (`scripts/ogtools/render-eventloop.mjs`) draws 96 satori frames (token orbiting + active phase lighting up,
  branded) → ffmpeg encodes. satori gotcha fixed: a large positioned `<svg>` background doesn't share the HTML
  coordinate space (ring drifted right) → drew the dashed ring + centre as CSS-circle divs. `demo/_*` gitignored
  (sandbox can't unlink the preview frame). **Verified:** tsc clean · build OK (`el-ball-orbit` in CSS) · SSR smoke
  23 / 148 / 0.
- *(Update this log at the end of every session/block — per user request.)*
