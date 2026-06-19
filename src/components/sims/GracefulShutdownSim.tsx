import React, { useEffect, useRef, useState } from "react";
import { SHUTDOWN_SCENARIOS, type ShutdownActor, type ShutdownNote } from "../../lib/shutdownEngine";
import "./gracefulShutdownSim.css";

const PLAY_MS = 1300;

const ACTORS: { id: ShutdownActor; label: string; sub: string }[] = [
  { id: "signal", label: "SIGTERM", sub: "orchestrator" },
  { id: "readiness", label: "Readiness", sub: "/readyz" },
  { id: "server", label: "server.close", sub: "stop intake" },
  { id: "inflight", label: "In-flight", sub: "live requests" },
  { id: "resources", label: "Resources", sub: "DB · timers" },
  { id: "process", label: "Process", sub: "exit code" },
];

const NOTE_COLOR: Record<ShutdownNote | "none", string> = {
  drain: "#6CC24A",
  drop: "#F87171",
  exit: "#38BDF8",
  none: "#9CB3A0",
};

export function GracefulShutdownSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = SHUTDOWN_SCENARIOS[sIdx];
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
  const color = NOTE_COLOR[step.note ?? "none"];
  const visited = new Set<ShutdownActor>(steps.slice(0, i + 1).map((s) => s.actor));
  const dropped = step.dropped > 0;

  return (
    <div className="gs-sim" aria-label="Graceful shutdown simulator">
      <div className="gs-tabs" role="tablist">
        {SHUTDOWN_SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="gs-blurb">{scenario.blurb}</p>

      {/* live in-flight / dropped readout */}
      <div className="gs-meters">
        <div className="gs-meter">
          <span className="gs-meter-k">in-flight</span>
          <span className="gs-meter-v" style={{ color: "var(--accent-bright)" }}>{step.inFlight}</span>
        </div>
        <div className={"gs-meter" + (dropped ? " bad" : "")}>
          <span className="gs-meter-k">dropped</span>
          <span className="gs-meter-v" style={{ color: dropped ? "var(--sem-error)" : "var(--tx3)" }}>{step.dropped}</span>
        </div>
        <div className="gs-meter">
          <span className="gs-meter-k">exit code</span>
          <span className="gs-meter-v" style={{ color: atEnd ? (scenario.exitCode === 0 ? "var(--accent-bright)" : "var(--sem-error)") : "var(--tx3)" }}>
            {atEnd ? scenario.exitCode : "—"}
          </span>
        </div>
      </div>

      {/* actor pipeline */}
      <div className="gs-lane">
        {ACTORS.map((a, idx) => {
          const isActive = a.id === step.actor;
          const wasVisited = visited.has(a.id);
          return (
            <React.Fragment key={a.id}>
              <div
                className={"gs-actor" + (isActive ? " on" : "") + (wasVisited && !isActive ? " seen" : "")}
                style={isActive ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : undefined}
              >
                <span className="gs-actor-ttl" style={isActive ? { color } : undefined}>{a.label}</span>
                <span className="gs-actor-sub">{a.sub}</span>
              </div>
              {idx < ACTORS.length - 1 ? <span className="gs-arrow" aria-hidden="true">›</span> : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className="gs-caption" aria-live="polite">
        <span className="gs-stepttl" style={{ color }}>{step.title}</span>
        <span className="gs-detail">{step.detail}</span>
      </div>

      <div className="gs-controls">
        <button className="btn" onClick={() => { setPlaying(false); setI(0); }} disabled={i === 0 && !playing}>⤺ Reset</button>
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.max(0, v - 1)); }} disabled={i === 0}>◀ Back</button>
        {atEnd ? (
          <button className="btn primary" onClick={() => { setI(0); setPlaying(true); }}>↻ Replay</button>
        ) : (
          <button className="btn primary" onClick={() => setPlaying((p) => !p)}>{playing ? "⏸ Pause" : "▶ Play"}</button>
        )}
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.min(steps.length - 1, v + 1)); }} disabled={atEnd}>Step ▶</button>
        <div className="gs-progress">
          <div className="gs-progress-bar" style={{ width: `${(i / (steps.length - 1)) * 100}%`, background: color }} />
        </div>
        <span className="gs-step">{i + 1}/{steps.length}</span>
      </div>

      {atEnd ? (
        <div className="gs-takeaway">
          <span className={"gs-fate " + (scenario.exitCode === 0 ? "ok" : "bad")}>
            {scenario.exitCode === 0 ? "0 requests dropped · clean exit" : `${step.dropped} requests dropped · ${step.dropped > 0 ? "502s" : "errors"}`}
          </span>
          {scenario.takeaway}
        </div>
      ) : null}
    </div>
  );
}
