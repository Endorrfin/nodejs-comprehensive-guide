/* Correctness checks for the Express middleware-pipeline engine.
   Run: node --experimental-strip-types scripts/test-express.ts

   (1) TRUTH replay — rebuilds the exact app from scripts/node-truth-express.mjs
       as engine layers and asserts dispatch() reproduces the traces captured
       from REAL Express 5.2.1 (2026-07-02): order, mount scoping,
       next('route'), sync/async → error middleware, 404 fallthrough.
   (2) engine invariants over the sim's four scenarios.
   (Express itself is not a dependency of this repo, so the live capture lives
   in node-truth-express.mjs with its own scratch install — see its header.)  */
import {
  dispatch,
  executedIds,
  mountMatches,
  EXPRESS_SCENARIOS,
  EXPRESS_TRUTH,
  type Layer,
} from "../src/lib/expressEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};
const eq = (a: unknown[], b: unknown[]): boolean => JSON.stringify(a) === JSON.stringify(b);

/* ---- (1) rebuild the captured app A and replay every captured request ------ */
const truthApp: Layer[] = [
  { id: "logger", kind: "mw", label: "app.use(logger)", sub: "" },
  { id: "auth", kind: "mw", path: "/api", label: "app.use('/api', auth)", sub: "" },
  { id: "r-health", kind: "route", path: "/health", label: "", sub: "", handlers: [{ id: "h:health", label: "health", action: "send" }] },
  { id: "r-users", kind: "route", path: "/api/users", label: "", sub: "", handlers: [{ id: "h:users", label: "users", action: "send" }] },
  {
    id: "r-maybe-1", kind: "route", path: "/maybe", label: "", sub: "",
    handlers: [
      { id: "r1-a", label: "r1-a", action: "next-route" },
      { id: "r1-b", label: "r1-b", action: "send" }, // must be SKIPPED
    ],
  },
  { id: "r-maybe-2", kind: "route", path: "/maybe", label: "", sub: "", handlers: [{ id: "r2", label: "r2", action: "send" }] },
  { id: "r-boom", kind: "route", path: "/boom", label: "", sub: "", handlers: [{ id: "h:boom", label: "boom", action: "throw" }] },
  { id: "r-async-boom", kind: "route", path: "/async-boom", label: "", sub: "", handlers: [{ id: "h:async-boom", label: "async-boom", action: "throw" }] },
  { id: "after-routes", kind: "mw", label: "app.use(after-routes)", sub: "" },
  { id: "3arg-errorish", kind: "mw", label: "3-arg 'error handler' (is REGULAR mw)", sub: "" },
  { id: "errmw", kind: "errmw", label: "app.use((err, req, res, next))", sub: "" },
  { id: "final", kind: "final", label: "", sub: "" },
];
const run = (path: string, msg = "kaboom") => dispatch(truthApp, { method: "GET", path }, { message: msg });

// captured: usersOrder — trace [logger, auth, h:users], 200
const users = run("/api/users");
check("truth: GET /api/users trace = logger→auth→h:users", eq(executedIds(users), ["logger", "auth", "h:users"]), JSON.stringify(executedIds(users)));
check("truth: GET /api/users → 200 via route", users.outcome.status === 200 && users.outcome.via === "route");

// captured: healthScope — trace [logger, h:health] (auth is /api-scoped)
const health = run("/health");
check("truth: GET /health trace = logger→h:health (auth skipped)", eq(executedIds(health), ["logger", "h:health"]), JSON.stringify(executedIds(health)));

// captured: nextRoute — trace [logger, r1-a, r2]; r1-b never ran
const maybe = run("/maybe");
check("truth: GET /maybe trace = logger→r1-a→r2", eq(executedIds(maybe), ["logger", "r1-a", "r2"]), JSON.stringify(executedIds(maybe)));
check("truth: next('route') skipped r1-b", maybe.visits.some((v) => v.handlerId === "r1-b" && v.note === "skip"));

// captured: syncThrow — trace [logger, h:boom, errmw:…], 500; after-routes + 3arg skipped
const boom = run("/boom", "sync-kaboom");
check("truth: GET /boom trace = logger→h:boom→errmw", eq(executedIds(boom), ["logger", "h:boom", "errmw"]), JSON.stringify(executedIds(boom)));
check("truth: GET /boom → 500 via errmw", boom.outcome.status === 500 && boom.outcome.via === "errmw");
check("truth: regular mw after the throw is skipped (skip-err)", boom.visits.filter((v) => v.note === "skip-err").map((v) => v.layerId).includes("after-routes"));
check("truth: 3-arg layer never receives the error", !executedIds(boom).includes("3arg-errorish"));

// captured: asyncThrow5 — IDENTICAL trace to the sync throw (v5 forwards rejections)
const aboom = run("/async-boom", "async-kaboom");
check("truth: async rejection takes the SAME lane as a sync throw (v5)", eq(executedIds(aboom), ["logger", "h:async-boom", "errmw"]), JSON.stringify(executedIds(aboom)));
check("truth: v5 async rejection → 500 via errmw", aboom.outcome.status === 500 && aboom.outcome.via === "errmw");

// captured: notFound — trace [logger, after-routes, 3arg-errorish], 404 "Cannot GET /nope"
const nope = run("/nope");
check("truth: GET /nope trace = logger→after-routes→3arg-errorish", eq(executedIds(nope), ["logger", "after-routes", "3arg-errorish"]), JSON.stringify(executedIds(nope)));
check("truth: GET /nope → 404 via final handler (a miss is NOT an error)", nope.outcome.status === 404 && nope.outcome.via === "final-404");
check("truth: 404 path never touches the error lane", !nope.visits.some((v) => v.layerId === "errmw" && v.note !== "no-match"));

// captured: errStatus — default handler honors err.status (418) when no errmw exists
const noErrmw = truthApp.filter((l) => l.kind !== "errmw");
const teapot = dispatch(noErrmw, { method: "GET", path: "/boom" }, { message: "short and stout", status: 418 });
check("truth: no errmw → default handler uses err.status (418)", teapot.outcome.status === EXPRESS_TRUTH.errStatusHonored && teapot.outcome.via === "default-errmw");
const plain = dispatch(noErrmw, { method: "GET", path: "/boom" }, { message: "default-500" });
check("truth: no errmw + no err.status → 500", plain.outcome.status === 500);

/* ---- mount semantics (Express prefix matching) ----------------------------- */
check("mount: '/api' matches '/api'", mountMatches("/api", "/api"));
check("mount: '/api' matches '/api/users'", mountMatches("/api", "/api/users"));
check("mount: '/api' does NOT match '/apix'", !mountMatches("/api", "/apix"));
check("mount: no path matches everything", mountMatches(undefined, "/anything"));

/* ---- (2) invariants over the sim's four scenarios --------------------------- */
for (const s of EXPRESS_SCENARIOS) {
  const r = dispatch(s.layers, s.req, s.thrown);
  const ran = executedIds(r);
  check(`${s.id}: something ran and an outcome exists`, ran.length > 0 && r.outcome.status > 0);
  check(`${s.id}: layers ran in registration order`, (() => {
    const order = s.layers.map((l) => l.id);
    const seen = r.visits.map((v) => v.layerId);
    const idx = seen.map((id) => order.indexOf(id));
    return idx.every((v, i) => i === 0 || v >= idx[i - 1]);
  })());
  const errVisits = r.visits.filter((v) => v.layerId === "errmw" && v.note === "respond");
  if (s.thrown) {
    check(`${s.id}: error scenario ends in the error lane`, errVisits.length === 1 && r.outcome.via === "errmw");
  } else {
    check(`${s.id}: no error → error lane never runs`, errVisits.length === 0);
  }
}
const happy = dispatch(EXPRESS_SCENARIOS[0].layers, EXPRESS_SCENARIOS[0].req);
check("happy: responds 200 from the route", happy.outcome.status === 200 && happy.outcome.via === "route");
const fall = EXPRESS_SCENARIOS.find((s) => s.id === "fallthrough")!;
const fr = dispatch(fall.layers, fall.req);
check("fallthrough: 404, and the tail mw still ran", fr.outcome.status === 404 && executedIds(fr).includes("tail"));
const errS = EXPRESS_SCENARIOS.find((s) => s.id === "error")!;
const er = dispatch(errS.layers, errS.req, errS.thrown);
check("error: audit mw (after the throw) was skip-err'd", er.visits.some((v) => v.layerId === "audit" && v.note === "skip-err"));

/* ---- captured constants stay said-out-loud in the chapter ------------------- */
check("truth constants: v5 forwards async rejections", EXPRESS_TRUTH.asyncRejectionV5.includes("forwarded"));
check("truth constants: v4 async rejection crashes the process", EXPRESS_TRUTH.asyncRejectionV4 === "process-crash");
check("truth constants: X-Powered-By: Express", EXPRESS_TRUTH.poweredBy === "Express");

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
