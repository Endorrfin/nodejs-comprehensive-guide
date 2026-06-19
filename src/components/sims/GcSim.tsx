import React, { useEffect, useMemo, useRef, useState } from "react";
import { simulate, SCENARIOS, type Cell, type Frame } from "../../lib/gcEngine";
import "./gcSim.css";

const KIND_COLOR: Record<Cell["kind"], string> = {
  g: "#6B7B6E", // garbage — neutral gray
  p: "#6CC24A", // long-lived — green
  t: "#FBBF24", // medium-lived — amber
};
const PLAY_MS = 900;

function CellBox({ cell }: { cell: Cell }): React.ReactElement {
  const base = KIND_COLOR[cell.kind];
  const color = cell.tone === "dead" ? "#F87171" : base;
  return (
    <span
      className={"gc-cell tone-" + cell.tone}
      style={{ borderColor: color, color }}
      title={`${cell.label} · ${cell.kind === "g" ? "garbage" : cell.kind === "p" ? "long-lived" : "medium-lived"} · age ${cell.age}`}
    >
      {cell.label}
      {cell.age > 0 && cell.tone !== "dead" ? <span className="gc-age">{cell.age}</span> : null}
    </span>
  );
}

function Space({ cells, cap, label, sub }: { cells: Cell[]; cap: number; label: string; sub?: string }): React.ReactElement {
  const empties = Math.max(0, cap - cells.length);
  return (
    <div className="gc-space">
      <div className="gc-space-head">
        {label}
        <span className="gc-space-fill">
          {cells.length}/{cap}
        </span>
      </div>
      <div className="gc-cells">
        {cells.map((c) => (
          <CellBox key={c.id} cell={c} />
        ))}
        {Array.from({ length: empties }, (_, k) => (
          <span key={"e" + k} className="gc-slot" />
        ))}
      </div>
      {sub ? <div className="gc-space-sub">{sub}</div> : null}
    </div>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: string }): React.ReactElement {
  return (
    <div className="gc-stat">
      <span className="gc-stat-n" style={accent ? { color: accent } : undefined}>
        {n}
      </span>
      <span className="gc-stat-l">{label}</span>
    </div>
  );
}

export function GcSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = SCENARIOS[sIdx];
  const frames = useMemo(() => simulate(scenario), [scenario]);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [sIdx]);

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

  const f: Frame = frames[i];
  const atEnd = i >= frames.length - 1;

  return (
    <div className="gc-sim" aria-label="Generational garbage-collection simulator">
      <div className="gc-tabs" role="tablist">
        {SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="gc-blurb">{scenario.blurb}</p>

      <div className={"gc-gen young" + (f.gc === "minor" ? " active" : "")}>
        <div className="gc-gen-head">
          <span className="gc-dot" style={{ background: "#6CC24A" }} />
          young generation (nursery)
          {f.gc === "minor" ? <span className="gc-badge minor">MINOR GC · Scavenge</span> : null}
        </div>
        <div className="gc-semis">
          <Space cells={f.from} cap={f.youngCap} label="From (active)" sub="allocations land here" />
          <span className="gc-flip" aria-hidden="true">
            ⇄
          </span>
          <Space cells={f.to} cap={f.youngCap} label="To (reserve)" sub="survivors copied here, then flip" />
        </div>
      </div>

      <div className={"gc-gen old" + (f.gc === "major" ? " active" : "")}>
        <div className="gc-gen-head">
          <span className="gc-dot" style={{ background: "#38BDF8" }} />
          old generation
          {f.gc === "major" ? <span className="gc-badge major">MAJOR GC · Mark-Sweep-Compact</span> : null}
        </div>
        <Space cells={f.old} cap={f.oldCap} label="old space" sub="promoted survivors · mark-sweep-compact" />
      </div>

      <div className="gc-stats">
        <Stat n={f.stats.alloc} label="allocated" />
        <Stat n={f.stats.minor} label="minor GCs" accent="#6CC24A" />
        <Stat n={f.stats.major} label="major GCs" accent="#38BDF8" />
        <Stat n={f.stats.promoted} label="promoted" accent="#FBBF24" />
        <Stat n={f.stats.reclaimed} label="reclaimed" accent="#F87171" />
      </div>

      <div className="gc-legend">
        <span><span className="gc-key" style={{ borderColor: KIND_COLOR.g, color: KIND_COLOR.g }}>#</span> garbage (dies young)</span>
        <span><span className="gc-key" style={{ borderColor: KIND_COLOR.p, color: KIND_COLOR.p }}>#</span> long-lived</span>
        <span><span className="gc-key" style={{ borderColor: KIND_COLOR.t, color: KIND_COLOR.t }}>#</span> medium-lived</span>
        <span><span className="gc-key" style={{ borderColor: "#F87171", color: "#F87171" }}>#</span> marked dead</span>
        <span className="gc-legend-note">small number = scavenges survived (age)</span>
      </div>

      <div className="gc-caption" aria-live="polite">
        <span className="gc-phase">{f.phase}</span>
        {f.caption}
      </div>

      <div className="gc-controls">
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
        <div className="gc-progress">
          <div className="gc-progress-bar" style={{ width: `${(i / (frames.length - 1)) * 100}%` }} />
        </div>
        <span className="gc-step">{i + 1}/{frames.length}</span>
      </div>

      {atEnd ? (
        <div className="gc-takeaway">
          <span className="gc-take-lbl">Takeaway</span>
          {scenario.takeaway}
        </div>
      ) : null}
    </div>
  );
}
