/* Ground truth for the security/permission engine (Ch.15).
   Proves, on a REAL Node, what the chapter claims about the Permission Model:
     (1) the set of --allow-* flags this runtime exposes (the STABLE scopes);
     (2) process.permission.has(scope) reflects exactly what was granted —
         granting fs.read does NOT grant fs.write, child or worker;
     (3) network: on Node 24 --permission does NOT gate it at all (no
         --allow-net; listen/fetch still work); from Node 25 it is denied
         unless --allow-net (experimental) is passed.  CHANGED: S18
   Uses child processes so the parent stays unrestricted.
   Run: node scripts/node-truth-security.mjs                                    */
import { execFileSync } from "node:child_process";

const node = process.execPath;
const run = (args) =>
  execFileSync(node, args, { encoding: "utf8" }).trim();

// (1) which --allow-* flags does this Node advertise?
const help = execFileSync(node, ["--help"], { encoding: "utf8" });
const allowFlags = [...help.matchAll(/--allow-[a-z-]+/g)].map((m) => m[0]);
const uniqFlags = [...new Set(allowFlags)].sort();

// (2) grant ONLY fs.read, then probe each scope from inside the sandboxed child
const probe = run([
  "--permission",
  "--allow-fs-read=*",
  "-e",
  "process.stdout.write(JSON.stringify({" +
    "fsRead:process.permission.has('fs.read')," +
    "fsWrite:process.permission.has('fs.write')," +
    "child:process.permission.has('child')," +
    "worker:process.permission.has('worker')" +
    "}))",
]);

// (3) does a 'net' scope even exist here? (has() returns a boolean, never throws)
const netScope = run([
  "--permission",
  "--allow-fs-read=*",
  "-e",
  "process.stdout.write(String(process.permission.has('net')))",
]);

// (4) CHANGED: S18 — is the network actually gated? try to listen under --permission
let listenUnderPermission;
try {
  listenUnderPermission = run([
    "--permission",
    "-e",
    "require('net').createServer().listen(0,'127.0.0.1',function(){process.stdout.write('ok');this.close()})",
  ]);
} catch {
  listenUnderPermission = "denied";
}

const truth = {
  node: process.version,
  openssl: process.versions.openssl,
  allowFlags: uniqFlags,
  hasNetFlag: uniqFlags.includes("--allow-net"),
  grantedOnlyFsRead: JSON.parse(probe),
  netScopeHas: netScope, // 'false' even on 24, where net is not enforced — has() alone proves nothing
  listenUnderPermission, // CHANGED: S18 — 'ok' on 24 (network ungated), 'denied' on 25+
};
console.log(JSON.stringify(truth, null, 2));
