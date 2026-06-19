# Node.js — Comprehensive Guide

A deep, interactive, **senior/staff-level** guide to how Node.js really works — the event
loop, V8 & GC, the async model, concurrency, streams, modules, HTTP internals, performance,
security and production patterns — with **live simulators** and draw-from-memory **mental
models**.

- **Stack:** Vite + React 19 + TypeScript (strict). No backend, no runtime fetches.
- **Routing:** custom hash router (`#/map`, `#/chapter/<id>`, `#/interview`, `#/mental-models`).
- **Content:** a single source of truth in `src/data/` — pages are rendered from data.
- **Hosting:** static site on GitHub Pages, auto-published by GitHub Actions on push to `main`.
- **Author:** Vasyl Krupka · Senior Fullstack Engineer · Ukraine 🇺🇦

## Commands

```bash
npm install      # Node 22+
npm run dev      # local dev server → http://localhost:5173  (full interactivity)
npm run build    # tsc typecheck + Vite production build → dist/
npm run preview  # serve the production build locally
npm run typecheck
```

## Deploy to GitHub Pages

1. Create a public repo (e.g. `node-js-comprehensive-guide`) and push this folder's contents to `main`.
2. In **Settings → Pages**, set **Source = GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` runs `npm ci && npm run build` and publishes `dist/`.
   `vite base:'./'` + hash routing make it work under any project sub-path with no config.

URL: `https://<user>.github.io/<repo>/`.

## Structure

```
src/
  data/        concepts.ts (chapters + sections) · interview.ts · mentalModels.ts  ← edit content here
  lib/         hashRouter · registry (sim/figure keys) · eventLoopEngine · utils
  components/
    layout/    TopBar (search) · Sidebar · Footer
    map/       ConceptMap (landing)
    chapter/   ChapterPage · Section renderers · Md
    sims/      EventLoopSim (hero)            ← interactive widgets
    figures/   EventLoopRing                  ← SVG diagrams
    pages/     InterviewPage · MentalModelsPage
  theme/       tokens.css (brand) · global.css
scripts/       test-eventloop.ts (engine unit test) · smoke-entry.tsx (SSR smoke)
```

## Conventions

- TypeScript strict (`noUnusedLocals/Parameters`); the build fails on type errors.
- Content is edited **only** in `src/data/*`; never hand-edit rendered output.
- Brand: black + Node green (see `src/theme/tokens.css`); orange is a semantic "thread pool / CPU" accent only.

See `CLAUDE.md` for the full architecture, curriculum and session roadmap.
