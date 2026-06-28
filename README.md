# 🟢 Node.js — Comprehensive Guide

A deep, **interactive**, senior/staff-level guide to how Node.js actually works — the
**event loop**, V8 & GC, the async model, concurrency, streams, modules, HTTP internals,
performance and security — with **live simulators**, a senior/staff **interview bank**,
draw-from-memory **mental models** and **flashcards**.

**Live:** https://endorrfin.github.io/nodejs-comprehensive-guide/
**Stack:** Vite + React 19 + TypeScript (strict) · static, no backend · deployed to GitHub Pages.

**Language / Мова:** [English](#-english) · [Українська](#-українська)

---

## 🇬🇧 English

A static, offline-friendly web app: all content is bundled (no backend, no runtime fetches)
and it deploys to GitHub Pages with no server. Built for **senior / staff engineers** — prose
plus diagrams, mental models and **step-through simulators** to understand, internalize and
remember how the runtime works, and to prep interviews. Twenty chapters across four parts share
one renderer; a concept-map landing, an interview bank, a mental-models gallery and flashcards
sit alongside.

### Features

1. **Twenty chapters, four parts.** Foundations & mental model → the runtime core → building
   real systems → mastery. Senior/staff depth, no hand-holding: event loop, V8 & GC, async,
   concurrency, streams & backpressure, modules, errors, HTTP internals, performance, security,
   production patterns and modern Node.

2. **Fifteen live simulators.** Step / play / pause interactives for the six event-loop phases,
   async ordering, V8 generational GC, the thread-pool-vs-kernel split, streams backpressure, the
   CJS/ESM resolver, an architecture "trace-a-call", C10k throughput, error propagation, the HTTP
   request lifecycle, event-loop lag, supply-chain defense, graceful shutdown and the Node version
   timeline.

3. **Truth-first.** Each simulator is driven by a deterministic engine whose output is **captured
   from real Node** and asserted in tests, and every version-sensitive claim is checked against the
   Node.js, libuv and V8 docs — so the diagrams match what your terminal actually prints.

4. **Predict-the-output quizzes.** A reusable quiz engine; every correct answer was captured from
   real Node 22.

5. **Interview bank.** 40+ senior/staff questions with answers, filterable by topic and free-text
   search.

6. **Mental-models gallery.** "Draw it from memory," then reveal the real diagram to check yourself.

7. **Flashcards.** A spaced-recall deck assembled from the mental models + interview questions —
   cards you mark *Again* come back later in the same round.

8. **Global search.** Ranked results across chapters, Q&A and models, with keyboard navigation.

9. **Concept-map landing.** A clickable overview of all four parts and every chapter.

10. **Accessible & responsive.** Keyboard navigation, focus rings, a skip link, `prefers-reduced-motion`
    fallbacks on every animation, and phone/tablet breakpoints.

11. **Shareable deep links, fully offline.** Hash routing (`#/chapter/event-loop`, `#/interview`,
    `#/flashcards`, `#/about`); no backend and no runtime fetches.

### Run locally

Requires Node 22+.

```bash
git clone https://github.com/Endorrfin/nodejs-comprehensive-guide
cd nodejs-comprehensive-guide
npm install
npm run dev        # http://localhost:5173  (full interactivity)
npm run build      # type-check + production build → dist/
npm run lint       # ESLint (flat config)
npm run preview    # serve the production build
npm test           # engine truth-tests + content/link integrity (no browser)
npm run qa         # content/link integrity only
npm run verify     # typecheck + lint + qa + tests + build (full local gate, mirrors CI)
```

> It's a bundled app, so opening `dist/index.html` straight off disk won't work
> (browsers block module scripts over `file://`). Use `npm run dev`, `npm run preview`,
> or host the `dist/` folder.

### How it's built

- **Single source of truth.** All content lives in `src/data/*` (chapters & sections, the
  interview bank, mental models, quizzes); pages are *rendered from data* — never hand-written.
- **Verified.** `scripts/node-truth-*.mjs` capture real Node behaviour, `scripts/test-*.ts` assert
  the engines reproduce it, and `scripts/qa-integrity.ts` runs an 825-check content/link integrity
  pass (every `seeAlso`, every sim/figure key, all in-prose links, sources). `npm test` runs all of it.
- **Static & strict.** Vite + React 19 + TypeScript (strict). Hash routing + Vite `base: './'` make
  the build work under any GitHub Pages sub-path with zero config.

### Deploy to GitHub Pages

Push to `main`; the included GitHub Actions workflow runs typecheck → lint → QA → engine tests → build,
then publishes `dist/`. In **Settings → Pages**, set **Source = GitHub Actions**. Because `base` is `'./'` and
routing is hash-based, the site works under any project sub-path.

URL: `https://<user>.github.io/<repo>/`.

### Project structure

```
src/
  data/        concepts.ts (chapters + sections) · interview.ts · mentalModels.ts · quizzes.ts · runtimes.ts  ← edit content here
  lib/         hashRouter · registry (sim/figure keys) · *Engine.ts (deterministic engines) · search · flashcards
  components/
    layout/    TopBar (search) · Sidebar · Footer
    map/       ConceptMap (landing)
    chapter/   ChapterPage · Section renderers · Md
    sims/      EventLoopSim, GcSim, ThreadPoolSim, BackpressureSim, … (interactive widgets)
    figures/   EventLoopRing, GcHeap, ArchitectureStack, … (SVG diagrams)
    pages/     InterviewPage · MentalModelsPage · FlashcardsPage · AboutPage
  theme/       tokens.css (brand) · global.css
scripts/       test-*.ts (engine suites) · node-truth-*.mjs (real-Node captures) · qa-integrity.ts · smoke-entry.tsx (SSR smoke)
```

### Conventions

- TypeScript strict (`noUnusedLocals/Parameters`) + **ESLint** (flat config). `npm run verify`
  (typecheck + lint + QA + engine tests + build) gates every deploy in CI.
- Content is edited **only** in `src/data/*`; never hand-edit rendered output.
- Brand: black + Node green (`src/theme/tokens.css`); orange is a semantic "thread pool / CPU" accent only.

---

## 🇺🇦 Українська

Статичний вебзастосунок, що працює офлайн: увесь контент вбудований (без бекенду й без запитів
під час роботи), деплоїться на GitHub Pages без сервера. Зроблено для **senior / staff інженерів** —
текст плюс діаграми, ментальні моделі та **покрокові симулятори**, щоб зрозуміти, засвоїти й
запам'ятати, як працює рантайм, і підготуватися до співбесід. Двадцять розділів у чотирьох
частинах ділять спільний рендерер; поруч — стартова концепт-мапа, банк інтерв'ю, галерея
ментальних моделей і флешкарти.

### Можливості (Features)

1. **Двадцять розділів, чотири частини.** Основи й ментальна модель → ядро рантайму → побудова
   реальних систем → майстерність. Senior/staff-глибина без спрощень: event loop, V8 & GC, async,
   конкурентність, потоки й backpressure, модулі, помилки, нутрощі HTTP, продуктивність, безпека,
   продакшн-патерни та сучасний Node.

2. **П'ятнадцять живих симуляторів.** Інтерактиви зі step / play / pause: шість фаз event loop,
   порядок async, генераційний GC у V8, поділ thread-pool-проти-kernel, backpressure у потоках,
   резолвер CJS/ESM, архітектурний «trace-a-call», пропускна здатність C10k, поширення помилок,
   життєвий цикл HTTP-запиту, лаг event loop, захист ланцюга постачання, graceful shutdown і
   таймлайн версій Node.

3. **Truth-first.** Кожен симулятор керується детермінованим рушієм, чий вивід **знято з реального
   Node** і перевірено в тестах, а кожне залежне від версії твердження звірене з документацією
   Node.js, libuv і V8 — щоб діаграми збігалися з тим, що друкує твій термінал.

4. **Квізи «передбач вивід».** Багаторазовий рушій квізів; кожна правильна відповідь знята з
   реального Node 22.

5. **Банк інтерв'ю.** 40+ senior/staff-питань із відповідями, з фільтром за темою та пошуком.

6. **Галерея ментальних моделей.** «Намалюй з пам'яті», потім відкрий справжню діаграму для звірки.

7. **Флешкарти.** Колода з інтервальним повторенням, зібрана з ментальних моделей + питань інтерв'ю —
   картки, позначені *Again*, повертаються пізніше в межах того ж кола.

8. **Глобальний пошук.** Ранжовані результати по розділах, Q&A та моделях, з навігацією з клавіатури.

9. **Стартова концепт-мапа.** Клікабельний огляд усіх чотирьох частин і кожного розділу.

10. **Доступність і адаптивність.** Навігація з клавіатури, focus-кільця, skip-лінк, фолбеки
    `prefers-reduced-motion` на кожній анімації та брейкпойнти для телефона/планшета.

11. **Посилання, якими можна ділитися, повністю офлайн.** Маршрутизація на хешах
    (`#/chapter/event-loop`, `#/interview`, `#/flashcards`, `#/about`); без бекенду й запитів під час роботи.

### Запуск локально

Потрібен Node 22+.

```bash
git clone https://github.com/Endorrfin/nodejs-comprehensive-guide
cd nodejs-comprehensive-guide
npm install
npm run dev        # http://localhost:5173  (повна інтерактивність)
npm run build      # перевірка типів + продакшн-білд → dist/
npm run lint       # ESLint (flat config)
npm run preview    # віддати продакшн-білд
npm test           # truth-тести рушіїв + перевірка цілісності контенту/лінків (без браузера)
npm run qa         # лише перевірка цілісності контенту/лінків
npm run verify     # typecheck + lint + qa + тести + build (повний локальний гейт, дзеркало CI)
```

> Це зібраний застосунок, тож відкрити `dist/index.html` напряму з диска не вийде
> (браузери блокують модульні скрипти через `file://`). Використовуй `npm run dev`,
> `npm run preview` або хостинг теки `dist/`.

### Як це побудовано

- **Єдине джерело правди.** Увесь контент живе в `src/data/*` (розділи й секції, банк інтерв'ю,
  ментальні моделі, квізи); сторінки *рендеряться з даних* — нічого не пишеться вручну.
- **Верифіковано.** `scripts/node-truth-*.mjs` знімають реальну поведінку Node, `scripts/test-*.ts`
  перевіряють, що рушії її відтворюють, а `scripts/qa-integrity.ts` проганяє перевірку цілісності
  на 825 пунктів (кожен `seeAlso`, кожен ключ sim/figure, усі лінки в тексті, джерела). `npm test`
  запускає все це разом.
- **Статика й strict.** Vite + React 19 + TypeScript (strict). Маршрутизація на хешах + Vite
  `base: './'` дають роботу під будь-яким під-шляхом GitHub Pages без налаштувань.

### Деплой на GitHub Pages

Запуш у `main`; доданий воркфлоу GitHub Actions виконає typecheck → lint → QA → тести рушіїв → build,
потім опублікує `dist/`. У **Settings → Pages** постав **Source = GitHub Actions**. Оскільки `base` дорівнює `'./'`,
а маршрутизація — на хешах, сайт працює під будь-яким під-шляхом проєкту.

URL: `https://<user>.github.io/<repo>/`.

### Структура проєкту

```
src/
  data/        concepts.ts (розділи + секції) · interview.ts · mentalModels.ts · quizzes.ts · runtimes.ts  ← контент тут
  lib/         hashRouter · registry (ключі sim/figure) · *Engine.ts (детерміновані рушії) · search · flashcards
  components/
    layout/    TopBar (пошук) · Sidebar · Footer
    map/       ConceptMap (стартова)
    chapter/   ChapterPage · рендерери секцій · Md
    sims/      EventLoopSim, GcSim, ThreadPoolSim, BackpressureSim, … (інтерактивні віджети)
    figures/   EventLoopRing, GcHeap, ArchitectureStack, … (SVG-діаграми)
    pages/     InterviewPage · MentalModelsPage · FlashcardsPage · AboutPage
  theme/       tokens.css (бренд) · global.css
scripts/       test-*.ts (набори тестів рушіїв) · node-truth-*.mjs (зняття з реального Node) · qa-integrity.ts · smoke-entry.tsx (SSR smoke)
```

### Конвенції

- TypeScript strict (`noUnusedLocals/Parameters`) + **ESLint** (flat config). `npm run verify`
  (typecheck + lint + QA + тести рушіїв + build) гейтить кожен деплой у CI.
- Контент редагується **лише** в `src/data/*`; ніколи не правиться згенерований вивід вручну.
- Бренд: чорний + Node-зелений (`src/theme/tokens.css`); помаранчевий — лише семантичний акцент
  «thread pool / CPU».
