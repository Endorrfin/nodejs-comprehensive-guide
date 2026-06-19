/* ===========================================================================
   Module-loading engine — how CommonJS and ES modules load the SAME dependency
   graph, for the "Modules: CJS vs ESM" resolver sim.

   Graph (a diamond — the shared `base` is the teaching point):
        app ──▶ left  ──▶ base
          └──▶ right ──▶ base

   CJS  — require() is SYNCHRONOUS and DEPTH-FIRST. Resolution and evaluation
          INTERLEAVE: the first time a module is required it is loaded and its
          body runs immediately; the result is cached, so the second require of
          `base` is a cache hit (no re-evaluation). A circular require therefore
          sees a PARTIAL exports object.
   ESM  — three separate phases over the whole graph BEFORE any code runs:
          1) parse/construct  (read every module, discover imports),
          2) instantiate/link (allocate exports, wire LIVE bindings),
          3) evaluate          (run bodies, post-order, once each).
          Separating link from evaluate is what makes imports hoisted, statically
          analyzable, and circular references resolvable via live bindings.

   Both evaluate post-order → [base, left, right, app] with `base` run exactly
   once — matching real Node 22 (scripts/node-truth-modules.mjs). The DIFFERENCE
   the sim shows is WHEN: CJS interleaves; ESM finishes parse+link first.
   =========================================================================== */

export type ModuleSys = "cjs" | "esm";
export type Phase = "resolve" | "parse" | "link" | "evaluate" | "done";
export type ModEvent = "resolve" | "cache-hit" | "parse" | "link" | "evaluate" | "done";

export interface ModNode {
  id: string;
  file: string;
  imports: string[];
  x: number;
  y: number; // layout for the SVG graph (viewBox 360×240)
}

export interface ModuleGraph {
  entry: string;
  nodes: ModNode[];
}

export interface ModuleFrame {
  step: number;
  sys: ModuleSys;
  phase: Phase;
  event: ModEvent;
  active: string | null; // node id being acted on
  stack: string[]; // CJS require() call stack (ESM leaves this empty)
  parsed: string[];
  linked: string[];
  evaluated: string[];
  cached: string[]; // CJS module cache
  cacheHit: string | null; // node id that was a cache hit this frame
  caption: string;
}

export const DIAMOND: ModuleGraph = {
  entry: "app",
  nodes: [
    { id: "app", file: "app.js", imports: ["left", "right"], x: 180, y: 28 },
    { id: "left", file: "left.js", imports: ["base"], x: 86, y: 108 },
    { id: "right", file: "right.js", imports: ["base"], x: 274, y: 108 },
    { id: "base", file: "base.js", imports: [], x: 180, y: 196 },
  ],
};

const byId = (g: ModuleGraph): Record<string, ModNode> =>
  Object.fromEntries(g.nodes.map((n) => [n.id, n]));

/* --------------------------------------------------------------------- CJS */
function simulateCjs(g: ModuleGraph): ModuleFrame[] {
  const nodes = byId(g);
  const frames: ModuleFrame[] = [];
  const stack: string[] = [];
  const cached: string[] = [];
  const evaluated: string[] = [];

  const snap = (event: ModEvent, phase: Phase, active: string | null, cacheHit: string | null, caption: string): void => {
    frames.push({
      step: frames.length,
      sys: "cjs",
      phase,
      event,
      active,
      stack: [...stack],
      parsed: [],
      linked: [],
      evaluated: [...evaluated],
      cached: [...cached],
      cacheHit,
      caption,
    });
  };

  const load = (id: string): void => {
    const n = nodes[id];
    if (cached.includes(id)) {
      snap("cache-hit", "resolve", id, id, `require('./${n.file}') → CACHE HIT. ${id} already in require.cache, so its body is NOT run again — the cached module.exports is returned.`);
      return;
    }
    stack.push(id);
    snap("resolve", "resolve", id, null, `require('./${n.file}') → not cached. Load and run it now — synchronously, depth-first. Stack: ${stack.join(" › ")}.`);
    for (const dep of n.imports) load(dep);
    evaluated.push(id);
    cached.push(id);
    snap("evaluate", "evaluate", id, null, `${id} body finishes; module.exports cached. Return to ${stack.length > 1 ? stack[stack.length - 2] : "the caller"}.`);
    stack.pop();
  };

  load(g.entry);
  snap("done", "done", null, null, `Done. Evaluation order: ${evaluated.join(" → ")}. base ran exactly ONCE — the second require hit the cache. Resolution and evaluation were interleaved.`);
  return frames;
}

/* --------------------------------------------------------------------- ESM */
function simulateEsm(g: ModuleGraph): ModuleFrame[] {
  const nodes = byId(g);
  const frames: ModuleFrame[] = [];
  const parsed: string[] = [];
  const linked: string[] = [];
  const evaluated: string[] = [];

  const snap = (event: ModEvent, phase: Phase, active: string | null, caption: string): void => {
    frames.push({
      step: frames.length,
      sys: "esm",
      phase,
      event,
      active,
      stack: [],
      parsed: [...parsed],
      linked: [...linked],
      evaluated: [...evaluated],
      cached: [...linked], // an ESM module record exists once linked
      cacheHit: null,
      caption,
    });
  };

  // 1) parse / construct — discover the whole graph, no code runs
  const seen = new Set<string>();
  const parse = (id: string): void => {
    if (seen.has(id)) return;
    seen.add(id);
    parsed.push(id);
    const n = nodes[id];
    snap("parse", "parse", id, `Parse ${n.file}: read it, statically find its import/export statements${n.imports.length ? ` (imports ${n.imports.join(", ")})` : ""}. No code runs yet.`);
    for (const dep of n.imports) parse(dep);
  };
  parse(g.entry);

  // 2) instantiate / link — allocate exports and wire LIVE bindings (post-order)
  const linkedSet = new Set<string>();
  const link = (id: string): void => {
    if (linkedSet.has(id)) return;
    linkedSet.add(id);
    for (const dep of nodes[id].imports) link(dep);
    linked.push(id);
    snap("link", "link", id, `Link ${nodes[id].file}: allocate its exports and connect each import to the exporter's live binding. Still no code run.`);
  };
  link(g.entry);

  // 3) evaluate — run bodies post-order, once each
  const evalSet = new Set<string>();
  const evaluate = (id: string): void => {
    if (evalSet.has(id)) return;
    evalSet.add(id);
    for (const dep of nodes[id].imports) evaluate(dep);
    evaluated.push(id);
    snap("evaluate", "evaluate", id, `Evaluate ${nodes[id].file}: run its body. ${id === "base" ? "base runs once even though two modules import it." : "Its imports already hold live values."}`);
  };
  evaluate(g.entry);

  snap("done", "done", null, `Done. Evaluation order: ${evaluated.join(" → ")}. Every module was parsed and linked BEFORE any body ran — that is why ESM imports are hoisted, statically analyzable, and async-capable (top-level await).`);
  return frames;
}

export function simulate(g: ModuleGraph, sys: ModuleSys): ModuleFrame[] {
  return sys === "cjs" ? simulateCjs(g) : simulateEsm(g);
}

/** Evaluation order for a system — asserted against real Node in test-modules.ts. */
export function evalOrder(g: ModuleGraph, sys: ModuleSys): string[] {
  const frames = simulate(g, sys);
  return frames.filter((f) => f.event === "evaluate").map((f) => f.active as string);
}
