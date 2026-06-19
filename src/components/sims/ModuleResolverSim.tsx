import React, { useEffect, useMemo, useRef, useState } from "react";
import { simulate, DIAMOND, type ModuleSys, type ModuleFrame, type ModNode } from "../../lib/moduleEngine";
import "./moduleResolverSim.css";

const C = {
  parse: "#38BDF8",
  link: "#A78BFA",
  eval: "#6CC24A",
  evalBright: "#4ADE80",
  hit: "#fbbf24",
  idle: "#33402F",
};
const PLAY_MS = 950;

type NodeState = "idle" | "parsed" | "linked" | "resolving" | "done" | "hit";

function nodeState(f: ModuleFrame, id: string): NodeState {
  if (f.cacheHit === id) return "hit";
  if (f.evaluated.includes(id)) return "done";
  if (f.sys === "esm") {
    if (f.linked.includes(id)) return "linked";
    if (f.parsed.includes(id)) return "parsed";
    return "idle";
  }
  // cjs
  if (f.stack.includes(id)) return "resolving";
  return "idle";
}

const stroke: Record<NodeState, string> = {
  idle: C.idle,
  parsed: C.parse,
  linked: C.link,
  resolving: C.hit,
  done: C.eval,
  hit: C.hit,
};

function GraphNode({ n, f }: { n: ModNode; f: ModuleFrame }): React.ReactElement {
  const st = nodeState(f, n.id);
  const active = f.active === n.id;
  const fill = st === "done" ? "rgba(108,194,74,0.16)" : st === "hit" ? "rgba(251,191,36,0.14)" : "#0f150e";
  return (
    <g>
      {active ? <rect x={n.x - 42} y={n.y - 20} width="84" height="40" rx="10" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="3" /> : null}
      <rect x={n.x - 38} y={n.y - 17} width="76" height="34" rx="8" fill={fill} stroke={stroke[st]} strokeWidth={active ? 2.2 : 1.6} />
      <text x={n.x} y={n.y - 1} textAnchor="middle" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="11" fontWeight="600">
        {n.file}
      </text>
      <text x={n.x} y={n.y + 11} textAnchor="middle" fill={stroke[st]} fontFamily="'JetBrains Mono',monospace" fontSize="7.5">
        {st === "idle" ? "—" : st === "hit" ? "cache hit" : st}
      </text>
    </g>
  );
}

function Chips({ ids, color }: { ids: string[]; color: string }): React.ReactElement {
  if (!ids.length) return <span className="mr-empty">—</span>;
  return (
    <>
      {ids.map((id) => (
        <span key={id} className="mr-chip" style={{ borderColor: color, color }}>
          {id}
        </span>
      ))}
    </>
  );
}

export function ModuleResolverSim(): React.ReactElement {
  const [sys, setSys] = useState<ModuleSys>("cjs");
  const frames = useMemo(() => simulate(DIAMOND, sys), [sys]);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [sys]);

  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      setI((prev) => {
        if (prev >= frames.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAY_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, frames.length]);

  const f = frames[i];
  const atEnd = i >= frames.length - 1;

  const edges = DIAMOND.nodes.flatMap((n) =>
    n.imports.map((dep) => {
      const c = DIAMOND.nodes.find((m) => m.id === dep) as ModNode;
      return { from: n, to: c, key: `${n.id}-${dep}` };
    }),
  );

  return (
    <div className="mr-sim" aria-label="Module resolver simulator">
      <div className="mr-toggle" role="tablist" aria-label="Module system">
        <button role="tab" aria-selected={sys === "cjs"} className={sys === "cjs" ? "on" : ""} onClick={() => setSys("cjs")}>
          CommonJS · require()
        </button>
        <button role="tab" aria-selected={sys === "esm"} className={sys === "esm" ? "on" : ""} onClick={() => setSys("esm")}>
          ES Modules · import
        </button>
      </div>
      <p className="mr-blurb">
        The same diamond graph (<code>app</code> imports <code>left</code> &amp; <code>right</code>; both import <code>base</code>), loaded each way.
        {sys === "cjs"
          ? " CJS resolves synchronously, depth-first — evaluation interleaves with resolution and the 2nd require of base is a cache hit."
          : " ESM parses then links the whole graph BEFORE any body runs, then evaluates post-order."}
      </p>

      <div className="mr-body">
        <div className="mr-graph">
          <svg viewBox="0 0 360 240" width="100%" role="img" aria-label="Module dependency graph">
            {edges.map((e) => (
              <line key={e.key} x1={e.from.x} y1={e.from.y + 17} x2={e.to.x} y2={e.to.y - 17} stroke="#2a352a" strokeWidth="1.4" />
            ))}
            {DIAMOND.nodes.map((n) => (
              <GraphNode key={n.id} n={n} f={f} />
            ))}
          </svg>
        </div>

        <div className="mr-panel">
          {sys === "cjs" ? (
            <>
              <div className="mr-track">
                <div className="mr-track-h">require() stack</div>
                <div className="mr-stack">
                  {f.stack.length ? (
                    [...f.stack].reverse().map((id, k) => (
                      <span key={id} className={"mr-frame" + (k === 0 ? " top" : "")}>
                        {id}
                      </span>
                    ))
                  ) : (
                    <span className="mr-empty">— empty —</span>
                  )}
                </div>
              </div>
              <div className="mr-track">
                <div className="mr-track-h">require.cache</div>
                <div className="mr-row">
                  <Chips ids={f.cached} color={C.evalBright} />
                </div>
              </div>
            </>
          ) : (
            <div className="mr-phases">
              <div className={"mr-phase" + (f.phase === "parse" ? " on" : "")}>
                <div className="mr-track-h" style={{ color: C.parse }}>
                  1 · parse
                </div>
                <div className="mr-row">
                  <Chips ids={f.parsed} color={C.parse} />
                </div>
              </div>
              <div className={"mr-phase" + (f.phase === "link" ? " on" : "")}>
                <div className="mr-track-h" style={{ color: C.link }}>
                  2 · link
                </div>
                <div className="mr-row">
                  <Chips ids={f.linked} color={C.link} />
                </div>
              </div>
              <div className={"mr-phase" + (f.phase === "evaluate" ? " on" : "")}>
                <div className="mr-track-h" style={{ color: C.eval }}>
                  3 · evaluate
                </div>
                <div className="mr-row">
                  <Chips ids={f.evaluated} color={C.evalBright} />
                </div>
              </div>
            </div>
          )}

          <div className="mr-track">
            <div className="mr-track-h">evaluation order</div>
            <div className="mr-order">
              {f.evaluated.length ? (
                f.evaluated.map((id, k) => (
                  <span key={id} className="mr-ord">
                    <i>{k + 1}</i>
                    {id}
                  </span>
                ))
              ) : (
                <span className="mr-empty">nothing has run yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mr-caption" aria-live="polite">
        <span className={"mr-phase-tag " + f.phase}>{f.phase}</span>
        {f.caption}
      </div>

      <div className="mr-ctrls">
        <button className="btn" onClick={() => { setPlaying(false); setI(0); }} disabled={i === 0 && !playing}>
          ⤺ Reset
        </button>
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.max(0, v - 1)); }} disabled={i === 0}>
          ◀ Back
        </button>
        {atEnd ? (
          <button className="btn primary" onClick={() => { setI(0); setPlaying(true); }}>
            ↻ Replay
          </button>
        ) : (
          <button className="btn primary" onClick={() => setPlaying((p) => !p)}>
            {playing ? "⏸ Pause" : "▶ Play"}
          </button>
        )}
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.min(frames.length - 1, v + 1)); }} disabled={atEnd}>
          Step ▶
        </button>
        <div className="mr-progress">
          <div className="mr-progress-bar" style={{ width: `${(i / (frames.length - 1)) * 100}%` }} />
        </div>
        <span className="mr-step">{i + 1}/{frames.length}</span>
      </div>

      {atEnd ? (
        <div className="mr-takeaway">
          <span className="mr-take-lbl">Takeaway</span>
          {sys === "cjs"
            ? "CommonJS interleaves resolution and evaluation in one synchronous, depth-first pass; the cache makes the shared base run once, and a circular require sees a partial exports object."
            : "ESM splits loading into parse → link → evaluate over the whole graph, so imports are hoisted and statically analyzable, top-level await is possible, and circular references resolve through live bindings."}
        </div>
      ) : null}
    </div>
  );
}
