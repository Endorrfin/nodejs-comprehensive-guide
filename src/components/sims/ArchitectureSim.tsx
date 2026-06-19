import React, { useEffect, useRef, useState } from "react";
import { ARCH_SCENARIOS, LAYERS, type Lane, type LayerId } from "../../lib/architectureEngine";
import "./architectureSim.css";

const PLAY_MS = 1150;

const LANE: Record<Lane | "none", { c: string; bg: string }> = {
  pool: { c: "#FF7A00", bg: "rgba(255,122,0,0.13)" },
  kernel: { c: "#6CC24A", bg: "rgba(108,194,74,0.13)" },
  v8: { c: "#38BDF8", bg: "rgba(56,189,248,0.13)" },
  none: { c: "#6CC24A", bg: "rgba(108,194,74,0.10)" },
};
const DIR_GLYPH = { down: "↓", run: "⟳", up: "↑" } as const;
const DEST_LABEL: Record<Lane, string> = { pool: "libuv thread pool", kernel: "OS kernel", v8: "V8 engine" };

export function ArchitectureSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = ARCH_SCENARIOS[sIdx];
  const steps = scenario.steps;

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
        if (prev >= steps.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAY_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, steps.length]);

  const step = steps[i];
  const atEnd = i >= steps.length - 1;
  const active = step.layer;
  const lane = LANE[step.lane ?? "none"];
  const dest = LANE[scenario.destination];

  // which layers has the token already passed through (for a faint trail)
  const visited = new Set<LayerId>(steps.slice(0, i + 1).map((s) => s.layer));

  const renderBand = (id: LayerId, label: string, sub: string): React.ReactElement => {
    const isActive = id === active;
    const wasVisited = visited.has(id);
    return (
      <div
        className={"as-band" + (isActive ? " on" : "") + (wasVisited && !isActive ? " seen" : "")}
        style={isActive ? { borderColor: lane.c, background: lane.bg, boxShadow: `0 0 0 1px ${lane.c}` } : undefined}
      >
        <div className="as-band-main">
          <span className="as-band-ttl">{label}</span>
          <span className="as-band-sub">{sub}</span>
        </div>
        {isActive ? (
          <span className="as-dir" style={{ color: lane.c, borderColor: lane.c }}>
            {DIR_GLYPH[step.dir]}
          </span>
        ) : null}
      </div>
    );
  };

  const bands = LAYERS.filter((l) => l.row === "band");
  const natives = LAYERS.filter((l) => l.row === "native");
  const top = bands.slice(0, 3); // js, core, bindings
  const os = bands[3]; // operating system

  return (
    <div className="as-sim" aria-label="Architecture trace-a-call simulator">
      <div className="as-tabs" role="tablist">
        {ARCH_SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="as-blurb">{scenario.blurb}</p>

      <div className="as-callbar">
        <code className="as-call">{scenario.call}</code>
        <span className="as-dest" style={{ color: dest.c, borderColor: dest.c, background: dest.bg }}>
          runs on: {DEST_LABEL[scenario.destination]}
        </span>
        <span className={"as-loop " + step.loop}>{step.loop === "free" ? "▶ event loop free" : "■ event loop BLOCKED"}</span>
      </div>

      <div className="as-stack">
        {top.map((l) => (
          <React.Fragment key={l.id}>{renderBand(l.id, l.label, l.sub)}</React.Fragment>
        ))}

        <div className="as-native">
          {natives.map((l) => {
            const isActive = l.id === active;
            const wasVisited = visited.has(l.id);
            return (
              <div
                key={l.id}
                className={"as-cell" + (isActive ? " on" : "") + (wasVisited && !isActive ? " seen" : "")}
                style={isActive ? { borderColor: lane.c, background: lane.bg, boxShadow: `0 0 0 1px ${lane.c}` } : undefined}
              >
                <span className="as-cell-ttl">{l.label}</span>
                <span className="as-cell-sub">{l.sub}</span>
                {isActive ? (
                  <span className="as-dir cell" style={{ color: lane.c, borderColor: lane.c }}>
                    {DIR_GLYPH[step.dir]}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>

        {renderBand(os.id, os.label, os.sub)}
      </div>

      <div className="as-caption" aria-live="polite">
        <span className="as-stepttl" style={{ color: lane.c }}>
          {step.title}
        </span>
        <span className="as-detail">{step.detail}</span>
      </div>

      <div className="as-controls">
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
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.min(steps.length - 1, v + 1)); }} disabled={atEnd}>
          Step ▶
        </button>
        <div className="as-progress">
          <div className="as-progress-bar" style={{ width: `${(i / (steps.length - 1)) * 100}%`, background: lane.c }} />
        </div>
        <span className="as-step">{i + 1}/{steps.length}</span>
      </div>

      {atEnd ? (
        <div className="as-takeaway">
          <span className="as-take-lbl" style={{ color: dest.c }}>
            {scenario.destination === "v8" ? "Blocks the loop" : "Offloaded"}
          </span>
          {scenario.takeaway}
        </div>
      ) : null}
    </div>
  );
}
