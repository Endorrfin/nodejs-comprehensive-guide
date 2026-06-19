/* Ground truth for the HTTP-lifecycle engine. Two things, from a REAL server:
   (1) the default timeout triad + globalAgent pool settings the engine encodes;
   (2) that a keep-alive Agent actually REUSES the socket (same client port for
       two sequential requests), while a non-keep-alive Agent opens a new one.
   Run: node scripts/node-truth-http.mjs                                        */
import http from "node:http";

const server = http.createServer((req, res) => res.end("ok"));
await new Promise((resolve) => server.listen(0, resolve));
const { port } = server.address();

// one request → resolve with the CLIENT-side ephemeral port of its socket
function hit(agent) {
  return new Promise((resolve, reject) => {
    const req = http.get({ port, agent }, (res) => {
      const localPort = res.socket.localPort;
      res.resume();
      res.on("end", () => resolve(localPort));
    });
    req.on("error", reject);
  });
}

const ka = new http.Agent({ keepAlive: true });
const kaA = await hit(ka);
const kaB = await hit(ka); // should reuse the SAME socket → same local port

const nk = new http.Agent({ keepAlive: false });
const nkA = await hit(nk);
const nkB = await hit(nk); // new socket each time → different local ports

ka.destroy();
nk.destroy();
server.close();

const srv = http.createServer();
const truth = {
  node: process.version,
  serverDefaults: {
    keepAliveTimeout: srv.keepAliveTimeout,
    headersTimeout: srv.headersTimeout,
    requestTimeout: srv.requestTimeout,
    timeout: srv.timeout,
  },
  globalAgent: {
    keepAlive: http.globalAgent.keepAlive,
    maxSockets: http.globalAgent.maxSockets, // Infinity
    maxFreeSockets: http.globalAgent.maxFreeSockets,
    scheduling: http.globalAgent.options?.scheduling,
  },
  keepAliveReusesSocket: kaA === kaB,
  keepAlivePorts: [kaA, kaB],
  noKeepAliveOpensNew: nkA !== nkB,
  noKeepAlivePorts: [nkA, nkB],
  parsers: { llhttp: process.versions.llhttp, nghttp2: process.versions.nghttp2, undici: process.versions.undici },
};
srv.close();
console.log(JSON.stringify(truth, null, 2));
