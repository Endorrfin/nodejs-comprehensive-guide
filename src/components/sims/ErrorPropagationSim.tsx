import React, { useEffect, useRef, useState } from "react";
import { ERROR_SCENARIOS, type ErrState } from "../../lib/errorEngine";
import "./errorPropagationSim.css";

const PLAY_MS = 1300;

const STATE_COLOR: Record<ErrState, string> = {
  throw: "#fbbf24",
  travel: "#9CB3A0",
  caught: "#6CC24A",
  escaped: "#F87171",
  fatal: "#F87171",
};

const OUTCOME: Record<string, { label: string; cls: string }> = {
  caught: { label: "CAUGHT — process lives", cls: "ok" },
  swallowed: { label: "SWALLOWED — silent bug, process lives", cls: "warn" },
  uncaughtException: { label: "UNCAUGHT EXCEPTION — process exits 1", cls: "bad" },
  unhandledRejection: { label: "UNHANDLED REJECTION — process exits 1", cls: "bad" },
};

export function ErrorPropagationSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = ERROR_SCENARIOS[sIdx];
  const steps = scenario.steps;
  const lines = scenario.code.split("\n");

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
  const color = STATE_COLOR[step.state];
  const outcome = OUTCOME[scenario.outcome];

  return (
    <div className="ep-sim" aria-label="Error propagation simulator">
      <div className="ep-tabs" role="tablist">
        {ERROR_SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="ep-ctx">
        <span className="ep-ctx-dot" style={{ background: color }} aria-hidden="true" />
        {scenario.context}
      </p>

      {/* code panel — the active line is highlighted in the step's colour */}
      <div className="ep-code" aria-label="scenario source">
        {lines.map((ln, n) => {
          const active = step.line === n + 1;
          return (
            <div
              key={n}
              className={"ep-line" + (active ? " on" : "")}
              style={active ? { borderLeftColor: color, background: "rgba(255,255,255,0.05)" } : undefined}
            >
              <span className="ep-ln">{n + 1}</span>
              <code>{ln === "" ? " " : ln}</code>
            </div>
          );
        })}
      </div>

      <div className="ep-caption" aria-live="polite">
        <span className="ep-stepttl" style={{ color }}>
          {step.title}
        </span>
        <span className="ep-detail">{step.detail}</span>
      </div>

      {atEnd ? <div className={"ep-verdict " + outcome.cls}>{outcome.label}</div> : null}

      <div className="ep-controls">
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
        <div className="ep-progress">
          <div className="ep-progress-bar" style={{ width: `${(i / (steps.length - 1)) * 100}%`, background: color }} />
        </div>
        <span className="ep-step">{i + 1}/{steps.length}</span>
      </div>

      {atEnd ? (
        <div className="ep-takeaway">
          <span className="ep-take-lbl" style={{ color }}>
            {scenario.outcome === "caught" ? "Handled" : "Lesson"}
          </span>
          {scenario.takeaway}
          {scenario.fix ? (
            <div className="ep-fix">
              <span className="ep-fix-lbl">Fix</span>
              {scenario.fix}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
