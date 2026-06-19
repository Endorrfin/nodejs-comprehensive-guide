import React, { useEffect, useRef, useState } from "react";
import { HTTP_SCENARIOS, type HttpActor, type HttpNote } from "../../lib/httpEngine";
import "./httpLifecycleSim.css";

const PLAY_MS = 1200;

const ACTORS: { id: HttpActor; label: string; sub: string }[] = [
  { id: "client", label: "Client", sub: "browser · Agent · LB" },
  { id: "socket", label: "Socket", sub: "TCP · kernel poll" },
  { id: "parser", label: "llhttp", sub: "bytes → request" },
  { id: "app", label: "Handler", sub: "your JS · req/res" },
  { id: "timer", label: "Timeout", sub: "the triad" },
];

const NOTE_COLOR: Record<HttpNote | "none", string> = {
  reuse: "#6CC24A", // green — socket reused
  handshake: "#FF7A00", // orange — TCP/TLS handshake cost
  abort: "#F87171", // red — timeout abort
  none: "#38BDF8", // teal — ordinary network step
};

const OUTCOME: Record<string, { label: string; cls: string }> = {
  "200": { label: "200 OK", cls: "ok" },
  "408": { label: "408 Request Timeout", cls: "bad" },
};

const FATE: Record<string, { lbl: string; cls: string }> = {
  reuse: { lbl: "socket reused — no handshake", cls: "ok" },
  handshake: { lbl: "new socket — full handshake", cls: "warn" },
  abort: { lbl: "aborted by timeout", cls: "bad" },
};

export function HttpLifecycleSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = HTTP_SCENARIOS[sIdx];
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
  const outcome = OUTCOME[scenario.outcome];

  // which actors the request has already passed through (for a faint trail)
  const visited = new Set<HttpActor>(steps.slice(0, i + 1).map((s) => s.actor));
  const fateKey = scenario.outcome === "408" ? "abort" : scenario.reusesSocket ? "reuse" : "handshake";
  const fate = FATE[fateKey];

  return (
    <div className="hl-sim" aria-label="HTTP request lifecycle simulator">
      <div className="hl-tabs" role="tablist">
        {HTTP_SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="hl-blurb">{scenario.blurb}</p>

      <div className="hl-callbar">
        <code className="hl-call">{scenario.call}</code>
        <span className={"hl-outcome " + outcome.cls}>{outcome.label}</span>
        <span className={"hl-loop " + step.loop}>{step.loop === "free" ? "▶ event loop free" : "■ event loop BLOCKED"}</span>
      </div>

      {/* the actor pipeline — one chip lights up per step */}
      <div className="hl-lane">
        {ACTORS.map((a, idx) => {
          const isActive = a.id === step.actor;
          const wasVisited = visited.has(a.id);
          return (
            <React.Fragment key={a.id}>
              <div
                className={"hl-actor" + (isActive ? " on" : "") + (wasVisited && !isActive ? " seen" : "")}
                style={isActive ? { borderColor: color, background: "rgba(255,255,255,0.04)", boxShadow: `0 0 0 1px ${color}` } : undefined}
              >
                <span className="hl-actor-ttl" style={isActive ? { color } : undefined}>
                  {a.label}
                </span>
                <span className="hl-actor-sub">{a.sub}</span>
              </div>
              {idx < ACTORS.length - 1 ? <span className="hl-arrow" aria-hidden="true">›</span> : null}
            </React.Fragment>
          );
        })}
      </div>

      <div className="hl-caption" aria-live="polite">
        <span className="hl-stepttl" style={{ color }}>
          {step.title}
        </span>
        <span className="hl-detail">{step.detail}</span>
      </div>

      <div className="hl-controls">
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
        <div className="hl-progress">
          <div className="hl-progress-bar" style={{ width: `${(i / (steps.length - 1)) * 100}%`, background: color }} />
        </div>
        <span className="hl-step">{i + 1}/{steps.length}</span>
      </div>

      {atEnd ? (
        <div className="hl-takeaway">
          <span className={"hl-fate " + fate.cls}>{fate.lbl}</span>
          {scenario.takeaway}
        </div>
      ) : null}
    </div>
  );
}
