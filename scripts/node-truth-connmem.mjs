/* Ground truth for the per-connection memory numbers (Ch.2 Strengths, the
   throughput sim, the ConnectionScaling figure, the C10k mental model).
   ADDED: S18 — the guide used to say "a few KB" in prose but "~64 KiB/socket"
   in the sim; this measures what a connection really costs on THIS Node.

   Method: the SERVER runs in its own child process (`--expose-gc`), the
   CLIENTS live in this parent, so the client side never pollutes the numbers.
   For each scenario the server reports a GC'd memoryUsage() baseline, the
   parent opens N connections, the server confirms it holds all N, GCs again
   and reports the delta ÷ N:
     (1) tcp-idle    — a net.Server with N connected, silent sockets;
     (2) http-flight — an http.Server holding N keep-alive requests whose
                       responses are not yet sent (a request "in flight").

   NOT part of `npm test`: thousands of sockets hit the fd ulimit on many
   machines (CI included). Run by hand:
     node scripts/node-truth-connmem.mjs            (defaults 5000 / 3000)
     node scripts/node-truth-connmem.mjs 2000 1000  (smaller, if ulimit is low)

   Numbers vary a little by OS / allocator / run — the order of magnitude is
   the lesson: a few KiB idle, ~20 KiB busy, vs ~1 MiB for a thread.        */
import { fork } from "node:child_process";
import net from "node:net";
import http from "node:http";
import { fileURLToPath } from "node:url";

const KiB = 1024;

// ---------------------------------------------------------------- server side
if (process.argv[2] === "--server") {
  const mode = process.argv[3];
  const held = [];
  const measure = () => {
    for (let i = 0; i < 4; i++) globalThis.gc();
    const m = process.memoryUsage();
    return { rss: m.rss, heapUsed: m.heapUsed, external: m.external };
  };
  let server;
  if (mode === "tcp") {
    server = net.createServer((sock) => {
      held.push(sock);
      sock.on("error", () => {});
    });
  } else {
    server = http.createServer((req, res) => {
      held.push(res); // never answered until the parent says "release"
      req.on("error", () => {});
    });
    server.keepAliveTimeout = 0;
    server.headersTimeout = 0;
    server.requestTimeout = 0;
  }
  server.maxConnections = Infinity;
  server.listen(0, "127.0.0.1", () => {
    process.send({ type: "ready", port: server.address().port, base: measure() });
  });
  process.on("message", (msg) => {
    if (msg.type === "count") process.send({ type: "count", n: held.length });
    if (msg.type === "measure") process.send({ type: "measure", mem: measure(), n: held.length });
    if (msg.type === "release") {
      for (const h of held) (h.end ? h.end("ok") : h.destroy());
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 2000).unref();
    }
  });
} else {
  // -------------------------------------------------------------- client side
  const self = fileURLToPath(import.meta.url);
  const nTcp = Number(process.argv[2] ?? 5000);
  const nHttp = Number(process.argv[3] ?? 3000);

  const ask = (child, type) =>
    new Promise((resolve) => {
      const on = (msg) => {
        if (msg.type === type) {
          child.off("message", on);
          resolve(msg);
        }
      };
      child.on("message", on);
      child.send({ type });
    });

  const waitFor = async (child, n) => {
    for (;;) {
      const { n: got } = await ask(child, "count");
      if (got >= n) return;
      await new Promise((r) => setTimeout(r, 50));
    }
  };

  async function scenario(mode, n) {
    const child = fork(self, ["--server", mode], { execArgv: ["--expose-gc"] });
    const ready = await new Promise((r) => child.once("message", r));
    const clients = [];
    if (mode === "tcp") {
      for (let i = 0; i < n; i++) {
        const s = net.connect(ready.port, "127.0.0.1");
        s.on("error", () => {});
        clients.push(s);
      }
    } else {
      const agent = new http.Agent({ keepAlive: true, maxSockets: Infinity });
      for (let i = 0; i < n; i++) {
        const req = http.get({ port: ready.port, host: "127.0.0.1", path: `/r${i}`, agent });
        req.on("error", () => {});
        clients.push(req);
      }
    }
    await waitFor(child, n);
    await new Promise((r) => setTimeout(r, 300)); // let buffers settle
    const { mem } = await ask(child, "measure");
    child.send({ type: "release" });
    await new Promise((r) => child.once("exit", r));
    for (const c of clients) c.destroy();
    const per = (k) => (mem[k] - ready.base[k]) / n / KiB;
    return { mode, n, rss: per("rss"), heap: per("heapUsed"), external: per("external") };
  }

  const rows = [await scenario("tcp", nTcp), await scenario("http", nHttp)];
  console.log(`Node ${process.version} · ${process.platform}-${process.arch}`);
  console.log("scenario      conns   RSS KiB/conn   heap KiB/conn   external KiB/conn");
  for (const r of rows) {
    const label = r.mode === "tcp" ? "tcp-idle   " : "http-flight";
    console.log(
      `${label}  ${String(r.n).padStart(6)}   ${r.rss.toFixed(1).padStart(12)}   ${r.heap.toFixed(1).padStart(13)}   ${r.external.toFixed(1).padStart(17)}`,
    );
  }
  const busy = rows[1].rss;
  console.log(`thread (~1 MiB) ÷ busy connection (${busy.toFixed(1)} KiB) ≈ ${(1024 / busy).toFixed(0)}×`);
}
