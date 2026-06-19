/* Checks for the Version-timeline model (Ch.17 Modern Node hero).
   Run: node --experimental-strip-types scripts/test-modern.ts

   Two kinds of assertion:
     1. INTERNAL CONSISTENCY of the timeline data (monotonic majors + V8,
        exactly one Active-LTS / one Current, NOW matches the data, etc.).
     2. LIVE ANCHOR against THIS interpreter — every probed capability whose
        line ≤ the running Node major must actually exist here. Capabilities from
        lines newer than the running Node (URLPattern on 24, Temporal on 26) are
        reported, not required. This is what keeps the data honest about the
        runtime it claims to describe. */
import { TIMELINE, NOW, featuresUpTo, lineByMajor, type ProbeKey } from "../src/lib/versionTimelineEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};
const info = (name: string, extra = ""): void => console.log(`INFO  ${name}${extra ? `  ${extra}` : ""}`);

const v8Major = (s: string): number => Number(s.split(".")[0]);
const runningMajor = Number(process.versions.node.split(".")[0]);
const runningV8 = v8Major(process.versions.v8);

/* ----------------------------- 1. consistency ----------------------------- */
const majors = TIMELINE.map((l) => l.major);
check("majors strictly increasing", majors.every((m, i) => i === 0 || m > majors[i - 1]), majors.join(" "));
const v8s = TIMELINE.map((l) => v8Major(l.v8));
check("V8 major non-decreasing across lines", v8s.every((v, i) => i === 0 || v >= v8s[i - 1]), v8s.join(" "));

check("exactly one Active-LTS line", TIMELINE.filter((l) => l.status === "active-lts").length === 1);
check("exactly one Current line", TIMELINE.filter((l) => l.status === "current").length === 1);

check("NOW.current is the Current line", lineByMajor(NOW.current)?.status === "current", `Node ${NOW.current}`);
check("NOW.activeLts is the Active-LTS line", lineByMajor(NOW.activeLts)?.status === "active-lts", `Node ${NOW.activeLts}`);
check("NOW.maintenance is a Maintenance line", lineByMajor(NOW.maintenance)?.status === "maintenance", `Node ${NOW.maintenance}`);
check("current major > active-lts major", NOW.current > NOW.activeLts);

// every feature is well-formed
let wellFormed = true;
for (const l of TIMELINE)
  for (const f of l.features)
    if (!f.label || !f.blurb || (f.stability !== "stable" && f.stability !== "experimental")) wellFormed = false;
check("every feature has label/blurb/valid stability", wellFormed);

check("featuresUpTo(18) === line-18 features", featuresUpTo(18).length === (lineByMajor(18)?.features.length ?? -1));
const total = TIMELINE.reduce((n, l) => n + l.features.length, 0);
check("featuresUpTo(newest) === all features", featuresUpTo(NOW.current).length === total, `${total} features`);

/* ------------------------------- 2. live anchor --------------------------- */
console.log(`\n  running Node ${process.versions.node} (V8 ${process.versions.v8})\n`);

const probes: Record<ProbeKey, () => boolean> = {
  fetch: () => typeof (globalThis as { fetch?: unknown }).fetch === "function",
  structuredClone: () => typeof (globalThis as { structuredClone?: unknown }).structuredClone === "function",
  webstreams: () => typeof (globalThis as { ReadableStream?: unknown }).ReadableStream === "function",
  "node:test": () => { try { return !!process.getBuiltinModule("node:test"); } catch { return false; } },
  websocket: () => typeof (globalThis as { WebSocket?: unknown }).WebSocket === "function",
  "fs.glob": () => { try { return typeof (process.getBuiltinModule("node:fs") as { glob?: unknown }).glob === "function"; } catch { return false; } },
  sqlite: () => { try { return !!process.getBuiltinModule("node:sqlite"); } catch { return false; } },
  maglev: () => runningV8 >= 12,
  urlpattern: () => typeof (globalThis as { URLPattern?: unknown }).URLPattern === "function",
  temporal: () => typeof (globalThis as { Temporal?: unknown }).Temporal !== "undefined",
};

// node:sqlite is flag-gated/experimental on some lines — report, don't fail on it.
const SOFT: ReadonlySet<ProbeKey> = new Set<ProbeKey>(["sqlite"]);

for (const l of TIMELINE) {
  for (const f of l.features) {
    if (!f.probe) continue;
    const present = probes[f.probe]();
    if (l.major <= runningMajor) {
      if (SOFT.has(f.probe)) info(`(soft) ${f.probe} present on this Node`, present ? "yes" : "no — experimental/flagged");
      else check(`Node ${l.major} «${f.label}» actually present here`, present, `probe:${f.probe}`);
    } else {
      info(`Node ${l.major} «${f.label}» not expected on Node ${runningMajor}`, present ? "present anyway" : "absent (as expected)");
    }
  }
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
