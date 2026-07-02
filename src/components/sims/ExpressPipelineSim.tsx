import React, { useEffect, useMemo, useRef, useState } from "react";
import { EXPRESS_SCENARIOS, dispatch, type Layer, type Visit, type VisitNote } from "../../lib/expressEngine";
import "./expressPipelineSim.css";

const PLAY_MS = 1400;

const NOTE_COLOR: Record<VisitNote, string> = {
  pass: "#6CC24A", //     ran, next()
  respond: "#4ADE80", //  sent the response
  error: "#F87171", //    threw / rejected
  skip: "#FF7A00", //     next('route') skipped a handler
  "skip-err": "#FF7A00", // bypassed while an error is in flight
  "no-match": "#6B7B6E", // path/method didn't match
  "404": "#38BDF8", //    final handler answered
};

const NOTE_BADGE: Record<VisitNote, string> = {
  pass: "next()",
  respond: "responds",
  error: "throws",
  skip: "skipped",
  "skip-err": "skipped (error mode)",
  "no-match": "not matched",
  "404": "404",
};

const FATE: Record<string, { lbl: string; cls: string }> = {
  happy: { lbl: "200 — the route responded, the rest never ran", cls: "ok" },
  "next-route": { lbl: "200 — the SECOND route answered", cls: "ok" },
  error: { lbl: "500 — from the 4-arg error lane", cls: "bad" },
  fallthrough: { lbl: "404 — fell off the end of the stack", cls: "info" },
};

export function ExpressPipelineSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = EXPRESS_SCENARIOS[sIdx];

  // the engine computes the walk — the sim only replays it
  const result = useMemo(() => dispatch(scenario.layers, scenario.req, scenario.thrown), [scenario]);
  const visits = result.visits;

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
        if (prev >= visits.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, PLAY_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, visits.length]);

  const visit = visits[i];
  const atEnd = i >= visits.length - 1;
  const color = NOTE_COLOR[visit.note];
  const fate = FATE[scenario.id];

  // per-layer status so far: the LAST visit that touched each layer wins
  const layerState = new Map<string, Visit>();
  for (const v of visits.slice(0, i + 1)) layerState.set(v.layerId, v);
  // per-handler status (route sub-stacks)
  const handlerState = new Map<string, Visit>();
  for (const v of visits.slice(0, i + 1)) if (v.handlerId) handlerState.set(v.handlerId, v);

  const chip = (layer: Layer): React.ReactElement => {
    const seen = layerState.get(layer.id);
    const isActive = visit.layerId === layer.id;
    const c = seen ? NOTE_COLOR[seen.note] : undefined;
    return (
      <div
        key={layer.id}
        className={
          "ep-layer" +
          (layer.kind === "errmw" ? " err-lane" : "") +
          (layer.kind === "final" ? " final-lane" : "") +
          (isActive ? " on" : seen ? " seen" : "")
        }
        style={isActive ? { borderColor: color, boxShadow: `0 0 0 1px ${color}` } : undefined}
      >
        <div className="ep-layer-head">
          <code className="ep-layer-ttl" style={isActive ? { color } : undefined}>
            {layer.label}
          </code>
          {seen ? (
            <span className="ep-note" style={{ color: c, borderColor: c }}>
              {NOTE_BADGE[seen.note]}
            </span>
          ) : null}
        </div>
        <span className="ep-layer-sub">{layer.sub}</span>
        {layer.handlers && layer.handlers.length > 1 ? (
          <div className="ep-handlers">
            {layer.handlers.map((h) => {
              const hs = handlerState.get(h.id);
              const hc = hs ? NOTE_COLOR[hs.note] : undefined;
              const hActive = isActive && visit.handlerId === h.id;
              return (
                <span key={h.id} className={"ep-handler" + (hActive ? " on" : hs ? " seen" : "")} style={hc ? { color: hc, borderColor: hc } : undefined}>
                  {h.label}
                </span>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="ep-sim" aria-label="Express middleware pipeline simulator">
      <div className="ep-tabs" role="tablist">
        {EXPRESS_SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="ep-blurb">{scenario.blurb}</p>

      <div className="ep-callbar">
        <code className="ep-call">{scenario.call}</code>
        <span className={"ep-outcome " + (result.outcome.status === 200 ? "ok" : result.outcome.status === 404 ? "info" : "bad")}>
          → {result.outcome.status}
        </span>
        <span className="ep-via">via {result.outcome.via}</span>
      </div>

      <div className="ep-stack">
        <div className="ep-req" aria-hidden="true">
          req ⬇
        </div>
        {scenario.layers.map((l) => chip(l))}
      </div>

      <div className="ep-caption" aria-live="polite">
        <span className="ep-stepttl" style={{ color }}>
          {visit.title}
        </span>
        <span className="ep-detail">{visit.detail}</span>
      </div>

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
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.min(visits.length - 1, v + 1)); }} disabled={atEnd}>
          Step ▶
        </button>
        <div className="ep-progress">
          <div className="ep-progress-bar" style={{ width: `${(i / (visits.length - 1)) * 100}%`, background: color }} />
        </div>
        <span className="ep-step">
          {i + 1}/{visits.length}
        </span>
      </div>

      {atEnd ? (
        <div className="ep-takeaway">
          <span className={"ep-fate " + fate.cls}>{fate.lbl}</span>
          {scenario.takeaway}
        </div>
      ) : null}
    </div>
  );
}
