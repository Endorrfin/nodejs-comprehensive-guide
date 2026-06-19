/* Capture the REAL modern-Node capability surface of the interpreter that runs
   this file. Documents the ground truth behind Ch.17's timeline; the assertions
   live in scripts/test-modern.ts. Run: node scripts/node-truth-modern.mjs */
const has = (v) => (v ? "yes" : "no");
const builtin = (id) => { try { return !!process.getBuiltinModule(id); } catch { return false; } };

console.log("Node     :", process.versions.node);
console.log("V8       :", process.versions.v8);
console.log("undici   :", process.versions.undici ?? "(n/a)");
console.log("openssl  :", process.versions.openssl);
console.log("");
console.log("fetch (18)            :", has(typeof fetch === "function"));
console.log("structuredClone (18)  :", has(typeof structuredClone === "function"));
console.log("ReadableStream (18)   :", has(typeof ReadableStream === "function"));
console.log("node:test (18→20)     :", has(builtin("node:test")));
console.log("WebSocket (22)        :", has(typeof WebSocket === "function"));
console.log("fs.glob (22)          :", has(typeof process.getBuiltinModule("node:fs").glob === "function"));
console.log("node:sqlite (22.5)    :", has(builtin("node:sqlite")), "(experimental)");
console.log("Maglev era (V8>=12)   :", has(Number(process.versions.v8.split(".")[0]) >= 12));
console.log("URLPattern (24)       :", has(typeof URLPattern === "function"));
console.log("Temporal (26)         :", has(typeof Temporal !== "undefined"));
