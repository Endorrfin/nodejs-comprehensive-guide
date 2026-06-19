/* Correctness checks for the architecture "trace a call" engine.
   Run: node --experimental-strip-types scripts/test-architecture.ts

   These assert the chapter's core claim — that the three calls route to three
   different destinations (pool / kernel / V8) and only the CPU call blocks the
   loop — AND that the native deps drawn in the diagram are real (keys of
   process.versions on this Node). */
import {
  ARCH_SCENARIOS,
  NATIVE_DEPS,
  pathLayers,
  usesLane,
  blocksLoop,
  type ArchScenario,
} from "../src/lib/architectureEngine.ts";

let failed = 0;
const check = (name: string, cond: boolean, extra = ""): void => {
  if (!cond) failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  ${extra}` : ""}`);
};

const get = (id: string): ArchScenario => ARCH_SCENARIOS.find((s) => s.id === id)!;
const fs = get("fs");
const net = get("net");
const cpu = get("cpu");

// Every scenario starts and ends in JS (down into the stack, back up to your code).
for (const s of ARCH_SCENARIOS) {
  const layers = pathLayers(s);
  check(`${s.id}: starts at js`, layers[0] === "js");
  check(`${s.id}: ends at js`, layers[layers.length - 1] === "js");
  check(`${s.id}: first step is dir 'down'`, s.steps[0].dir === "down");
  check(`${s.id}: last step is dir 'up'`, s.steps[s.steps.length - 1].dir === "up");
  // declared destination must be a lane the scenario actually uses
  check(`${s.id}: destination lane is used`, usesLane(s, s.destination));
}

// fs.readFile → thread POOL, reaches the OS, never the kernel lane, loop stays free.
check("fs: uses the pool lane", usesLane(fs, "pool"));
check("fs: never uses the kernel lane", !usesLane(fs, "kernel"));
check("fs: reaches the OS", pathLayers(fs).includes("os"));
check("fs: does NOT block the loop", !blocksLoop(fs));
check("fs: destination is pool", fs.destination === "pool");

// https.get → KERNEL, reaches the OS, never the pool, loop stays free.
check("net: uses the kernel lane", usesLane(net, "kernel"));
check("net: never uses the pool lane", !usesLane(net, "pool"));
check("net: reaches the OS", pathLayers(net).includes("os"));
check("net: does NOT block the loop", !blocksLoop(net));
check("net: destination is kernel", net.destination === "kernel");

// JSON.parse → V8 only. Never leaves the engine; never touches bindings/libuv/os.
const cpuLayers = new Set(pathLayers(cpu));
check("cpu: only visits js + v8", [...cpuLayers].every((l) => l === "js" || l === "v8"));
check("cpu: never reaches the OS", !cpuLayers.has("os"));
check("cpu: never reaches libuv", !cpuLayers.has("libuv"));
check("cpu: never reaches bindings", !cpuLayers.has("bindings"));
check("cpu: BLOCKS the loop", blocksLoop(cpu));
check("cpu: destination is v8", cpu.destination === "v8");

// Real-Node anchor: every native dep named in the diagram exists in this runtime.
const versions = process.versions as Record<string, string>;
for (const dep of NATIVE_DEPS) {
  check(`process.versions has '${dep}'`, typeof versions[dep] === "string", `= ${versions[dep] ?? "MISSING"}`);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
