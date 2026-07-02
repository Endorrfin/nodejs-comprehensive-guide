/* ===========================================================================
   Express middleware-pipeline engine — the hero interactive for Ch.17 (Express).
   A tiny, pure model of how Express dispatches ONE request through the
   ordered layer stack: app.use / routes / next() / next('route') /
   next(err) → the 4-arg error lane / the built-in 404 final handler.

   It is a real (deterministic) dispatcher, not hand-written steps: the sim's
   scenarios AND the tests both call dispatch(). scripts/test-express.ts
   rebuilds the exact app from scripts/node-truth-express.mjs as engine layers
   and asserts the computed traces match what REAL Express 5.2.1 did
   (captured 2026-07-02; express 4.22.2 for the async-crash contrast).

   Modeled semantics (each verified against the capture):
     • layers run in REGISTRATION order; app.use('/p') mount-matches
       '/p' and '/p/…' (not '/px'); routes match method + exact path
     • next() → next matching layer; res.send() → done, rest never runs
     • throw / reject / next(err) → error mode: every remaining REGULAR
       layer is skipped; the next 4-ARG (errmw) layer gets the error
       (in Express, arity — fn.length — is what selects the error lane)
     • Express 5 forwards a rejected async handler to the error lane
       exactly like a sync throw (v4: unhandledRejection → process crash)
     • next('route') skips the REST of the current route's handlers only
     • nothing matched / stack exhausted without a response → final 404
     • no error middleware present → default handler: err.status ?? 500
   =========================================================================== */

export type LayerKind = "mw" | "route" | "errmw" | "final";

/** What a handler does when it runs (the sim picks one per handler). */
export type LayerAction = "next" | "next-route" | "send" | "throw";

export interface RouteHandler {
  id: string;
  /** short mono label, e.g. "checkCache" */
  label: string;
  action: LayerAction;
}

export interface Layer {
  id: string;
  kind: LayerKind;
  /** chip title, e.g. "app.use('/api', auth)" */
  label: string;
  /** chip subtitle, e.g. "auth · only /api/*" */
  sub: string;
  /** mw: mount prefix (undefined = every request) · route: exact path */
  path?: string;
  method?: "GET" | "POST";
  /** mw / errmw behaviour when reached */
  action?: LayerAction;
  /** route sub-stack, in order (a route can have several handlers) */
  handlers?: RouteHandler[];
}

export interface Req {
  method: "GET" | "POST";
  path: string;
}

export type VisitNote =
  | "pass" //     ran, called next()
  | "respond" //  ran, sent the response — pipeline ends
  | "error" //    ran, threw / rejected / next(err) — error mode begins
  | "skip" //     skipped: remaining route handler after next('route')
  | "skip-err" // skipped: regular layer bypassed while an error is in flight
  | "no-match" // skipped: path/method didn't match this layer
  | "404"; //     final handler answered Cannot GET …

export interface Visit {
  layerId: string;
  /** which route handler inside the layer, when kind === 'route' */
  handlerId?: string;
  note: VisitNote;
  title: string;
  detail: string;
}

export interface Outcome {
  status: number;
  /** who produced the response */
  via: "route" | "mw" | "errmw" | "default-errmw" | "final-404";
}

export interface DispatchResult {
  visits: Visit[];
  outcome: Outcome;
}

/* ---- matching (Express mount semantics, verified in the capture) ---------- */

/** app.use('/api') matches '/api' and '/api/…' but NOT '/apix'. */
export function mountMatches(prefix: string | undefined, path: string): boolean {
  if (!prefix) return true;
  return path === prefix || path.startsWith(prefix + "/");
}

function routeMatches(layer: Layer, req: Req): boolean {
  return (layer.method ?? "GET") === req.method && layer.path === req.path;
}

/* ---- the dispatcher -------------------------------------------------------- */

export interface ErrorSpec {
  message: string;
  /** default error handler uses err.status ?? 500 (verified: 418 honored) */
  status?: number;
}

export function dispatch(layers: Layer[], req: Req, thrown: ErrorSpec = { message: "kaboom" }): DispatchResult {
  const visits: Visit[] = [];
  let err: ErrorSpec | null = null;

  for (const layer of layers) {
    if (layer.kind === "final") continue; // the built-in tail runs after the loop

    /* error in flight → only a 4-arg error layer may run */
    if (err) {
      if (layer.kind === "errmw") {
        visits.push({
          layerId: layer.id,
          note: "respond",
          title: `(err, req, res, next) ← "${err.message}"`,
          detail: "Four parameters — Express selects this layer by arity and hands it the error. It responds; the pipeline ends.",
        });
        return { visits, outcome: { status: err.status ?? 500, via: "errmw" } };
      }
      visits.push({
        layerId: layer.id,
        note: "skip-err",
        title: "skipped — error in flight",
        detail: "While an error is being routed, every regular (3-arg) layer is bypassed. Only error middleware runs now.",
      });
      continue;
    }

    if (layer.kind === "errmw") continue; // no error → the error lane is invisible

    /* ---- plain middleware ---- */
    if (layer.kind === "mw") {
      if (!mountMatches(layer.path, req.path)) {
        visits.push({
          layerId: layer.id,
          note: "no-match",
          title: `not matched (${layer.path}/*)`,
          detail: `Mounted on '${layer.path}', and '${req.path}' is outside it — Express walks past without running it.`,
        });
        continue;
      }
      const action = layer.action ?? "next";
      if (action === "send") {
        visits.push({ layerId: layer.id, note: "respond", title: "middleware responds", detail: "A middleware may end the request itself; nothing after it runs." });
        return { visits, outcome: { status: 200, via: "mw" } };
      }
      if (action === "throw") {
        err = thrown;
        visits.push({ layerId: layer.id, note: "error", title: `throw / next(err: "${thrown.message}")`, detail: "The layer errors. Express flips into error mode and hunts for the next 4-arg layer." });
        continue;
      }
      visits.push({ layerId: layer.id, note: "pass", title: "runs, then next()", detail: "The middleware does its work and calls next(), handing the request to the next matching layer." });
      continue;
    }

    /* ---- route (method + exact path, then its handler sub-stack) ---- */
    if (!routeMatches(layer, req)) {
      visits.push({
        layerId: layer.id,
        note: "no-match",
        title: "route not matched",
        detail: `${layer.method ?? "GET"} '${layer.path}' ≠ ${req.method} '${req.path}' — Express keeps walking the stack.`,
      });
      continue;
    }
    const handlers = layer.handlers ?? [];
    let skippingRoute = false;
    for (const h of handlers) {
      if (skippingRoute) {
        visits.push({ layerId: layer.id, handlerId: h.id, note: "skip", title: `${h.label} — skipped`, detail: "next('route') abandoned the REST of this route's handlers and moved on down the stack." });
        continue;
      }
      if (h.action === "send") {
        visits.push({ layerId: layer.id, handlerId: h.id, note: "respond", title: `${h.label} → res.send/json`, detail: "The handler sends the response. Done — layers registered after this never see the request." });
        return { visits, outcome: { status: 200, via: "route" } };
      }
      if (h.action === "throw") {
        err = thrown;
        visits.push({ layerId: layer.id, handlerId: h.id, note: "error", title: `${h.label} throws (or the async handler rejects)`, detail: "Express 5 catches the rejection and forwards it as next(err) — sync and async take the SAME error lane." });
        skippingRoute = true; // remaining handlers of this route never run
        continue;
      }
      if (h.action === "next-route") {
        visits.push({ layerId: layer.id, handlerId: h.id, note: "pass", title: `${h.label} → next('route')`, detail: "Skips the remaining handlers of THIS route and resumes the stack — the next matching route can answer instead." });
        skippingRoute = true;
        continue;
      }
      visits.push({ layerId: layer.id, handlerId: h.id, note: "pass", title: `${h.label} → next()`, detail: "This route handler passes to the next handler in the same route." });
    }
    /* fell off the route without sending → continue down the stack */
  }

  /* ---- stack exhausted ---- */
  const final = layers.find((l) => l.kind === "final");
  if (err) {
    // no 4-arg layer caught it → Express's default error handler
    if (final) {
      visits.push({ layerId: final.id, note: "error", title: `default error handler → ${err.status ?? 500}`, detail: "No error middleware matched, so Express's built-in handler answers: err.status ?? 500 (stack shown only outside production)." });
    }
    return { visits, outcome: { status: err.status ?? 500, via: "default-errmw" } };
  }
  if (final) {
    visits.push({ layerId: final.id, note: "404", title: `404 · Cannot ${req.method} ${req.path}`, detail: "Nothing matched and nothing responded, so the request fell off the stack into Express's final handler: 404." });
  }
  return { visits, outcome: { status: 404, via: "final-404" } };
}

/* ---- helpers for tests + sim ---------------------------------------------- */

/** Ids of the layers/handlers that actually RAN (what a logger would print). */
export function executedIds(r: DispatchResult): string[] {
  return r.visits.filter((v) => v.note === "pass" || v.note === "respond" || v.note === "error").map((v) => v.handlerId ?? v.layerId);
}

/* ---- captured ground truth (scripts/node-truth-express.mjs, 2026-07-02) --- */
export const EXPRESS_TRUTH = {
  five: "5.2.1",
  four: "4.22.2",
  /** every Express response carries it until you app.disable('x-powered-by') */
  poweredBy: "Express",
  /** v5 default query parser is 'simple': ?a[b]=1 → { "a[b]": "1" } (no nesting) */
  queryParserV5: "simple",
  /** v5: a rejected async handler is forwarded to the error lane (500) */
  asyncRejectionV5: "forwarded-to-error-middleware",
  /** v4 on Node ≥15: the rejection escapes Express → unhandledRejection → CRASH
      (child exited 1 in the capture; the request hangs only if something
      swallows unhandledRejection) */
  asyncRejectionV4: "process-crash",
  /** default error handler honors err.status (a thrown 418 answered 418) */
  errStatusHonored: 418,
  /** the built-in final handler's body */
  notFoundBody: "Cannot GET /nope",
} as const;

/* ===========================================================================
   Sim scenarios — four requests through one small, realistic app.
   Visits are COMPUTED by dispatch(); nothing below hand-writes a trace.
   =========================================================================== */

export interface ExpressScenario {
  id: string;
  title: string;
  /** the request line shown above the pipeline */
  call: string;
  blurb: string;
  req: Req;
  thrown?: ErrorSpec;
  layers: Layer[];
  takeaway: string;
}

const logger: Layer = { id: "logger", kind: "mw", label: "app.use(logger)", sub: "no path · every request" };
const auth: Layer = { id: "auth", kind: "mw", path: "/api", label: "app.use('/api', auth)", sub: "mounted · only /api/*" };
const errmw: Layer = { id: "errmw", kind: "errmw", label: "app.use((err, req, res, next))", sub: "4 args · the error lane" };
const final: Layer = { id: "final", kind: "final", label: "built-in final handler", sub: "nothing matched → 404" };

const usersRoute: Layer = {
  id: "r-users", kind: "route", path: "/api/users", label: "app.get('/api/users')", sub: "route · method + path",
  handlers: [{ id: "h-users", label: "listUsers", action: "send" }],
};

export const EXPRESS_SCENARIOS: ExpressScenario[] = [
  {
    id: "happy",
    title: "Happy path",
    call: "GET /api/users",
    blurb: "The request walks the stack in registration order; each layer runs and passes it on with next() until a route responds.",
    req: { method: "GET", path: "/api/users" },
    layers: [logger, auth, usersRoute, errmw, final],
    takeaway:
      "An Express app is an ORDERED array of (req, res, next) functions. The request enters at the top; path-scoped middleware only runs under its mount ('/api'); the first matching route sends the response and everything after it never runs. Registration order IS the control flow — which is why the error lane sits last.",
  },
  {
    id: "next-route",
    title: "next('route')",
    call: "GET /report",
    blurb: "One path, two routes. The first route's guard bails out with next('route') — skipping its OWN remaining handlers, not the whole stack.",
    req: { method: "GET", path: "/report" },
    layers: [
      logger,
      {
        id: "r-report-1", kind: "route", path: "/report", label: "app.get('/report', guard, renderFresh)", sub: "route #1 · two handlers",
        handlers: [
          { id: "h-guard", label: "guard", action: "next-route" },
          { id: "h-fresh", label: "renderFresh", action: "send" },
        ],
      },
      {
        id: "r-report-2", kind: "route", path: "/report", label: "app.get('/report', serveCached)", sub: "route #2 · same path",
        handlers: [{ id: "h-cached", label: "serveCached", action: "send" }],
      },
      errmw,
      final,
    ],
    takeaway:
      "next('route') is the scalpel: it abandons the rest of the CURRENT route's handler sub-stack and resumes the walk, so the next route on the same path can answer (captured: trace r1-a → r2, r1-b never ran). It only works inside app.METHOD/router.METHOD handlers — in a plain app.use() there is no 'current route' to skip.",
  },
  {
    id: "error",
    title: "throw → error lane",
    call: "GET /api/orders",
    blurb: "The handler is async and rejects. Express 5 catches it and jumps the request into the 4-arg error lane, over every regular layer.",
    req: { method: "GET", path: "/api/orders" },
    thrown: { message: "db down" },
    layers: [
      logger,
      auth,
      {
        id: "r-orders", kind: "route", path: "/api/orders", label: "app.get('/api/orders', async …)", sub: "route · async handler",
        handlers: [{ id: "h-orders", label: "loadOrders", action: "throw" }],
      },
      { id: "audit", kind: "mw", label: "app.use(audit)", sub: "regular mw after routes" },
      errmw,
      final,
    ],
    takeaway:
      "throw, next(err) and (in Express 5) a rejected async handler all take the SAME lane: Express skips every remaining 3-arg layer and hands the error to the next 4-ARG middleware — selection is literally by fn.length. Captured: sync and async traces are identical (… → handler → errmw, 500). On Express 4 the same async throw escaped the framework entirely and crashed the process (unhandledRejection is fatal on Node ≥15).",
  },
  {
    id: "fallthrough",
    title: "404 fallthrough",
    call: "GET /nope",
    blurb: "Nothing matches. That is NOT an error — the request just walks every matching regular layer and falls off the end of the stack.",
    req: { method: "GET", path: "/nope" },
    layers: [
      logger,
      auth,
      usersRoute,
      { id: "tail", kind: "mw", label: "app.use(tail)", sub: "regular mw · still runs" },
      errmw,
      final,
    ],
    takeaway:
      "A miss is not an error: unmatched requests still run every matching regular middleware (captured: logger and the tail mw both ran before the 404), skip the error lane entirely, and land in Express's built-in final handler — 'Cannot GET /nope'. Register your own catch-all app.use((req res) => 404) LAST if you want a custom body; register error middleware after even that.",
  },
];
