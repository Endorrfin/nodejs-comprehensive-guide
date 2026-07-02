/* Ground-truth capture for Ch.21 (Express) — runs REAL Express 5 (and 4, for
   the async-error contrast) and records the behaviour the engine + sim + quiz
   must reproduce: middleware order, path scoping, next('route')/next('router'),
   error-middleware arity + selection, v5 async rejection auto-forwarding
   (vs the v4 hang), Router mounting/prefix stripping, err.status, the default
   404/500 handlers, X-Powered-By, and the v5 'simple' query parser.

   Setup (node_modules are scratch, gitignored via scripts/_*):
     cd scripts/_s11truth/e5 && npm init -y && npm i express@5
     cd scripts/_s11truth/e4 && npm init -y && npm i express@4
   Run:  node scripts/node-truth-express.mjs                                   */
import { createRequire } from "node:module";
import http from "node:http";

const require5 = createRequire(new URL("./_s11truth/e5/index.js", import.meta.url));
const require4 = createRequire(new URL("./_s11truth/e4/index.js", import.meta.url));
const express5 = require5("express");
const express4 = require4("express");

console.log("express 5:", require5("express/package.json").version);
console.log("express 4:", require4("express/package.json").version);

const out = {};
function listen(app) {
  return new Promise((res) => {
    const srv = app.listen(0, "127.0.0.1", () => res(srv));
  });
}
async function get(srv, path, timeoutMs) {
  const url = `http://127.0.0.1:${srv.address().port}${path}`;
  try {
    const r = await fetch(url, timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {});
    return { status: r.status, body: await r.text(), poweredBy: r.headers.get("x-powered-by") };
  } catch (e) {
    return { hang: e.name === "TimeoutError", err: e.name };
  }
}

/* ---- app A (express 5): order · scoping · next('route') · errors ---------- */
{
  const app = express5();
  let trace = [];
  const tag = (name, fail) => (req, res, next) => { trace.push(name); fail ? next(fail) : next(); };

  app.use(tag("logger"));                       // path-less → every request
  app.use("/api", tag("auth"));                 // scoped → only /api/*
  app.get("/health", (req, res) => { trace.push("h:health"); res.json({ ok: true }); });
  app.get("/api/users", (req, res) => { trace.push("h:users"); res.json({ users: [] }); });
  app.get("/maybe", (req, res, next) => { trace.push("r1-a"); next("route"); },
                    (req, res) => { trace.push("r1-b NEVER"); res.send("no"); });
  app.get("/maybe", (req, res) => { trace.push("r2"); res.send("second route"); });
  app.get("/boom", () => { trace.push("h:boom"); throw new Error("sync-kaboom"); });
  app.get("/async-boom", async () => { trace.push("h:async-boom"); throw new Error("async-kaboom"); });
  app.use(tag("after-routes"));                 // regular mw AFTER routes — skipped on error
  app.use((req, res, next) => { trace.push("3arg-errorish"); next(); }); // 3 args = REGULAR mw
  app.use((err, req, res, next) => {            // 4 args = error middleware (arity!)
    trace.push(`errmw:${err.message}`);
    res.status(500).json({ error: err.message });
  });

  const srv = await listen(app);
  const run = async (path) => { trace = []; const r = await get(srv, path); return { trace: [...trace], status: r.status, poweredBy: r.poweredBy }; };
  out.usersOrder = await run("/api/users");     // logger → auth → handler
  out.healthScope = await run("/health");       // logger only (auth is /api-scoped)
  out.nextRoute = await run("/maybe");          // r1-a → next('route') → r2 (r1-b skipped)
  out.syncThrow = await run("/boom");           // handler → error mw; after-routes/3arg skipped
  out.asyncThrow5 = await run("/async-boom");   // v5: rejection auto-forwarded to error mw
  out.notFound = await (async () => { trace = []; const r = await get(srv, "/nope"); return { trace: [...trace], status: r.status, body: r.body }; })();
  srv.close();
}

/* ---- app B (express 5): Router mounting + prefix stripping + params ------- */
{
  const app = express5();
  let trace = [];
  const router = express5.Router();
  router.use((req, res, next) => { trace.push("r-mw"); next(); });
  router.get("/users/:id", (req, res) => {
    trace.push("r-handler");
    res.json({ id: req.params.id, baseUrl: req.baseUrl, urlInRouter: req.url });
  });
  app.use("/api/v2", router);
  const srv = await listen(app);
  trace = [];
  const r = await get(srv, "/api/v2/users/42");
  out.router = { trace: [...trace], status: r.status, body: JSON.parse(r.body) };
  srv.close();
}

/* ---- app C (express 5): DEFAULT handlers — err.status · 500 · query parser  */
{
  const app = express5();
  app.get("/teapot", () => { const e = new Error("short and stout"); e.status = 418; throw e; });
  app.get("/plain-boom", () => { throw new Error("default-500"); });
  app.get("/q", (req, res) => res.json(req.query));
  const srv = await listen(app);
  out.errStatus = (await get(srv, "/teapot")).status;              // default handler honors err.status
  out.default500 = (await get(srv, "/plain-boom")).status;
  out.query = JSON.parse((await get(srv, "/q?a[b]=1&x=1&x=2")).body); // v5 default parser: 'simple'
  srv.close();
}

/* ---- app IS a listener: hand it straight to node:http --------------------- */
{
  const app = express5();
  app.get("/", (req, res) => res.send("hi from raw http.createServer(app)"));
  console.log("typeof app:", typeof app);                          // 'function'
  const srv = http.createServer(app);                              // no app.listen at all
  await new Promise((res) => srv.listen(0, "127.0.0.1", res));
  out.rawHttp = (await get(srv, "/")).status;
  out.listenReturnsHttpServer = (await (async () => { const a = express5(); const s = a.listen(0); const isSrv = s instanceof http.Server; s.close(); return isSrv; })());
  srv.close();
}

/* ---- express 4 contrast: an unhandled ASYNC throw ------------------------- */
/* v4 never .catch()es the handler's promise, so the rejection escapes Express
   entirely and becomes an unhandledRejection. On modern Node (≥15) that is
   FATAL by default → the whole PROCESS crashes (run in a child to observe).
   If something swallows unhandledRejection instead, the request just HANGS. */
{
  const { execFileSync } = await import("node:child_process");
  const childSrc = `
    const { createRequire } = require('node:module');
    const req4 = createRequire(${JSON.stringify(new URL("./_s11truth/e4/index.js", import.meta.url).pathname)});
    const express = req4('express');
    const app = express();
    app.get('/async-boom', async () => { throw new Error('async-kaboom-v4'); });
    app.use((err, req, res, next) => res.status(500).json({ error: err.message })); // never reached
    const srv = app.listen(0, '127.0.0.1', async () => {
      try { await fetch('http://127.0.0.1:' + srv.address().port + '/async-boom', { signal: AbortSignal.timeout(1500) }); }
      catch { /* timeout — only reached if the process survived */ }
      console.log('SURVIVED'); process.exit(0);
    });`;
  try {
    execFileSync(process.execPath, ["-e", childSrc], { encoding: "utf8", timeout: 8000 });
    out.asyncThrow4 = { crashed: false };
  } catch (e) {
    out.asyncThrow4 = { crashed: true, exitCode: e.status, stderrHasError: String(e.stderr).includes("async-kaboom-v4") };
  }

  // if a process-level handler swallows the rejection, the request HANGS instead
  const swallow = () => {};
  process.on("unhandledRejection", swallow);
  const app = express4();
  app.get("/async-boom", async () => { throw new Error("async-kaboom-v4"); });
  app.use((err, req, res, next) => res.status(500).json({ error: err.message })); // never reached
  const srv = await listen(app);
  out.asyncSwallowed4 = await get(srv, "/async-boom", 1500);       // → hang (TimeoutError)
  srv.close();
  process.removeListener("unhandledRejection", swallow);

  // the manual v4 medicine: try/catch + next(err)
  const app2 = express4();
  app2.get("/async-boom", async (req, res, next) => { try { throw new Error("caught-v4"); } catch (e) { next(e); } });
  app2.use((err, req, res, next) => res.status(500).json({ error: err.message }));
  const srv2 = await listen(app2);
  out.asyncCaught4 = (await get(srv2, "/async-boom", 1500)).status;
  srv2.close();
}

console.log("\n---- captured truth ----");
console.log(JSON.stringify(out, null, 2));
