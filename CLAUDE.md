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
- **Deep-dive PDF per concept** — 5 dense slides each, orange theme, Ukraine footer
  (mirror DPmap's `srp.js` golden standard). Built in the PDF sessions via the
  **satori → PNG → img2pdf** pipeline (no browser in sandbox; see gotchas). Linked as `pdf` per chapter.
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
- *(Update this log at the end of every session/block — per user request.)*
