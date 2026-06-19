import React, { useEffect, useMemo, useRef, useState } from "react";
import { simulate, SCENARIOS, PHASES, type Task, type TaskKind } from "../../lib/eventLoopEngine";
import "./eventLoopSim.css";

const KIND_COLOR: Record<TaskKind, string> = {
  timer: "#38BDF8",
  immediate: "#4ADE80",
  io: "#FF7A00",
  close: "#9CB3A0",
  nextTick: "#A78BFA",
  promise: "#C4B5FD",
  sync: "#9CB3A0",
};

function Chip({ t }: { t: Task }): React.ReactElement {
  const c = KIND_COLOR[t.kind];
  return (
    <span className="el-chip" style={{ borderColor: c, color: c }} title={t.label}>
      {t.log}
    </span>
  );
}

const PLAY_MS = 950;

export function EventLoopSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = SCENARIOS[sIdx];
  const frames = useMemo(() => simulate(scenario), [scenario]);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // reset when scenario changes
  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [sIdx]);

  // autoplay
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

  const zoneLabel =
    f.zone === "main"
      ? "main script (synchronous)"
      : f.zone === "micro"
        ? "microtask checkpoint"
        : f.zone === "done"
          ? "loop exited"
          : "loop phase";

  return (
    <div className="el-sim" aria-label="Event loop simulator">
      {/* scenario tabs */}
      <div className="el-tabs" role="tablist">
        {SCENARIOS.map((s, idx) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={idx === sIdx}
            className={idx === sIdx ? "on" : ""}
            onClick={() => setSIdx(idx)}
          >
            {s.title}
          </button>
        ))}
      </div>
      <p className="el-blurb">{scenario.blurb}</p>

      <div className="el-body">
        {/* left: the program */}
        <div className="el-code">
          <div className="el-code-head">program.js</div>
          <pre>
            <code>{scenario.code}</code>
          </pre>
        </div>

        {/* right: phases + microtasks + console */}
        <div className="el-stage">
          <div className="el-phases">
            <div className="el-col-title">
              event loop phases
              <span className="el-iter">tick {f.iteration}</span>
            </div>
            {PHASES.map((ph) => {
              const active = f.zone === "phase" && f.phaseKey === ph.key;
              const queue = ph.q ? (f.queues[ph.q] as Task[]) : [];
              return (
                <div key={ph.key} className={"el-phase" + (active ? " on" : "") + (ph.key === "idle" ? " muted" : "")}>
                  <span className="el-phase-name">{ph.label}</span>
                  <span className="el-queue">
                    {ph.key === "idle" ? (
                      <span className="el-empty">internal</span>
                    ) : queue.length ? (
                      queue.map((t) => <Chip key={t.id} t={t} />)
                    ) : (
                      <span className="el-empty">—</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="el-side">
            <div className={"el-micro" + (f.zone === "micro" ? " on" : "")}>
              <div className="el-col-title">microtasks (after every callback)</div>
              <div className="el-micro-row">
                <span className="el-micro-lbl" style={{ color: "#A78BFA" }}>
                  nextTick
                </span>
                <span className="el-queue">
                  {f.queues.nextTick.length ? (
                    f.queues.nextTick.map((t) => <Chip key={t.id} t={t} />)
                  ) : (
                    <span className="el-empty">—</span>
                  )}
                </span>
              </div>
              <div className="el-micro-row">
                <span className="el-micro-lbl" style={{ color: "#C4B5FD" }}>
                  promise
                </span>
                <span className="el-queue">
                  {f.queues.promise.length ? (
                    f.queues.promise.map((t) => <Chip key={t.id} t={t} />)
                  ) : (
                    <span className="el-empty">—</span>
                  )}
                </span>
              </div>
            </div>

            <div className="el-console">
              <div className="el-col-title">console output</div>
              <div className="el-out" aria-live="polite">
                {f.output.length === 0 ? <span className="el-empty">(nothing yet)</span> : null}
                {f.output.map((line, k) => (
                  <div key={k} className={"el-line" + (k === f.output.length - 1 && f.acted ? " fresh" : "")}>
                    <span className="el-gt">›</span> {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* caption */}
      <div className="el-caption" aria-live="polite">
        <span className="el-zone">{zoneLabel}</span>
        {f.caption}
      </div>

      {/* controls */}
      <div className="el-controls">
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
        <div className="el-progress">
          <div className="el-progress-bar" style={{ width: `${(i / (frames.length - 1)) * 100}%` }} />
        </div>
        <span className="el-step">
          {i + 1}/{frames.length}
        </span>
      </div>

      {atEnd ? (
        <div className="el-expected">
          Final output: {scenario.expected.map((e, k) => (
            <span key={k} className="el-chip" style={{ borderColor: "#6CC24A", color: "#6CC24A" }}>
              {e}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
