/* Correctness checks for the supply-chain / permission engine (Ch.15).
   Run: node --experimental-strip-types scripts/test-security.ts

   (1) engine invariants — no single defense covers every attack class; only
       layering leaves nothing exposed; and provenance does NOT stop attested
       malware (origin ≠ intent);
   (2) LIVE anchor — this Node exposes every core --allow-* scope in the
       engine's list (newer lines add more), --allow-net is absent before
       Node 25, and a
       child granted only fs.read sees fs.read=true / fs.write/child/worker=false;
       CHANGED: S18 — and the network is NOT gated by --permission before Node 25
       (a child can listen on a socket), but IS denied on 25+ without --allow-net. */
import { execFileSync } from "node:child_process";
import {
  ATTACKS,
  DEFENSES,
  evaluate,
  score,
  CORE_ALLOW_FLAGS, // CHANGED: S18 — renamed (only the fs flags are Stability 2)
  NET_PERMISSION_SINCE_MAJOR,
  type Defense,
} from "../src/lib/supplyChainEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};
const set = (...d: Defense[]): Set<Defense> => new Set(d);
const status = (attackId: string, active: Set<Defense>): string =>
  evaluate(ATTACKS.find((a) => a.id === attackId)!, active);

// ---- (1) engine invariants -------------------------------------------------
const none = score(set());
check("no defenses ⇒ every attack exposed", none.exposed === ATTACKS.length && none.blocked === 0, `exposed=${none.exposed}/${ATTACKS.length}`);

const all = score(set(...DEFENSES.map((d) => d.id)));
check("all defenses ⇒ nothing exposed", all.exposed === 0, `exposed=${all.exposed}`);

check("--ignore-scripts blocks the postinstall worm", status("postinstall-worm", set("ignoreScripts")) === "blocked");
check("cooldown blocks a hijacked popular package", status("compromised-popular", set("cooldown")) === "blocked");
check("audit blocks a known-CVE dependency", status("known-cve", set("audit")) === "blocked");

// the key nuance: provenance proves origin, not intent
check("provenance does NOT block attested malware", status("provenance-evading", set("provenance")) !== "blocked", `= ${status("provenance-evading", set("provenance"))}`);
check("provenance does NOT block a hijacked popular package", status("compromised-popular", set("provenance")) !== "blocked");
check("cooldown DOES catch attested malware (still too new)", status("provenance-evading", set("cooldown")) === "blocked");

// permission model contains (limits blast radius) without 'blocking' the worm
check("permission alone ⇒ worm contained, not blocked", status("postinstall-worm", set("permission")) === "contained");
check("no defenses ⇒ worm fully exposed", status("postinstall-worm", set()) === "exposed");

// audit alone leaves zero-day supply-chain malware exposed/contained, not blocked
check("audit alone does NOT block a brand-new worm", status("postinstall-worm", set("audit")) !== "blocked");

// ---- (2) LIVE anchor: the real Permission Model on this Node ----------------
const node = process.execPath;
const help = execFileSync(node, ["--help"], { encoding: "utf8" });
const liveFlags = [...new Set([...help.matchAll(/--allow-[a-z-]+/g)].map((m) => m[0]))].sort();
const expected = [...CORE_ALLOW_FLAGS].sort();
// CHANGED: S16 — version-tolerant. CI moved 22 → 24 (engines ">=24") and newer
// lines ADD scopes (24.x: --allow-inspector, --allow-openssl-store; 25+: --allow-net),
// so assert the engine's core scopes are all present instead of exact equality,
// and only demand --allow-net's absence on the lines the chapter describes (< 25).
const major = Number(process.versions.node.split(".")[0]);
const missing = expected.filter((f) => !liveFlags.includes(f));
const extra = liveFlags.filter((f) => !expected.includes(f));
check("live: engine's core --allow-* scopes all exist", missing.length === 0, `missing=${missing.join(",") || "none"} · extra on ${process.version}=${extra.join(",") || "none"}`);
if (major < 25) check("live: --allow-net absent before Node 25 (network perms)", !liveFlags.includes("--allow-net"));
else console.log(`INFO  --allow-net ${liveFlags.includes("--allow-net") ? "present" : "absent"} on ${process.version} (added in the 25 line)`);

const probe = JSON.parse(
  execFileSync(
    node,
    [
      "--permission",
      "--allow-fs-read=*",
      "-e",
      "process.stdout.write(JSON.stringify({" +
        "r:process.permission.has('fs.read'),w:process.permission.has('fs.write')," +
        "c:process.permission.has('child'),k:process.permission.has('worker')}))",
    ],
    { encoding: "utf8" },
  ),
) as { r: boolean; w: boolean; c: boolean; k: boolean };
// CHANGED: S18 — the chapter's headline caveat: on 24 --permission does NOT gate the network.
const listenProbe = (() => {
  try {
    return execFileSync(
      node,
      ["--permission", "-e", "require('net').createServer().listen(0,'127.0.0.1',function(){process.stdout.write('ok');this.close()})"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    ).trim();
  } catch {
    return "denied";
  }
})();
if (major < NET_PERMISSION_SINCE_MAJOR) check("live: --permission does NOT gate the network before Node 25 (listen works)", listenProbe === "ok", listenProbe);
else check("live: --permission denies the network on 25+ (needs --allow-net)", listenProbe === "denied", listenProbe);

check("live: granting fs.read grants ONLY fs.read", probe.r === true && probe.w === false && probe.c === false && probe.k === false, JSON.stringify(probe));

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
