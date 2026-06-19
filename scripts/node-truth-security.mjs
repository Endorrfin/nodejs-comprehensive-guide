/* Ground truth for the security/permission engine (Ch.15).
   Proves, on a REAL Node, what the chapter claims about the Permission Model:
     (1) the set of --allow-* flags this runtime exposes (the STABLE scopes);
     (2) process.permission.has(scope) reflects exactly what was granted —
         granting fs.read does NOT grant fs.write, child or worker;
     (3) network permission ('net') is NOT part of the stable scope set on the
         LTS line (it is experimental) — documented, not asserted as present.
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

const truth = {
  node: process.version,
  openssl: process.versions.openssl,
  allowFlags: uniqFlags,
  hasNetFlag: uniqFlags.includes("--allow-net"),
  grantedOnlyFsRead: JSON.parse(probe),
  netScopeHas: netScope, // 'false' on LTS — net perms are experimental / not granted
};
console.log(JSON.stringify(truth, null, 2));
