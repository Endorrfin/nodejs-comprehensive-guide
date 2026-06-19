import React, { useEffect, useMemo, useRef, useState } from "react";
import { simulate, SCENARIOS, type Task, type QueueKind, type ActKind } from "../../lib/asyncEngine";
import "./asyncSim.css";

const KIND_COLOR: Record<QueueKind, string> = {
  nextTick: "#A78BFA", // microtask — highest priority
  promise: "#C4B5FD", // microtask — Promise / queueMicrotask / await
  timeout: "#38BDF8", // timers (macro)
  immediate: "#4ADE80", // check / setImmediate (macro)
};

const ZONE_LABEL: Record<string, string> = {
  sync: "synchronous · call stack",
  micro: "microtask checkpoint",
  macro: "macrotask · event loop",
  done: "program finished",
};

const ACT_TONE: Record<ActKind, string> = {
  sync: "var(--tx2)",
  nextTick: "#A78BFA",
  promise: "#C4B5FD",
  timeout: "#38BDF8",
  immediate: "#4ADE80",
  suspend: "#FF7A00",
  resume: "#C4B5FD",
  call: "var(--accent-bright)",
};

const PLAY_MS = 1000;

function Chip({ t }: { t: Task }): React.ReactElement {
  const c = KIND_COLOR[t.kind];
  return (
    <span className="as-chip" style={{ borderColor: c, color: c }} title={t.label}>
      {t.text ?? t.label}
    </span>
  );
}

function QueueRow({ label, color, tasks }: { label: string; color: string; tasks: Task[] }): React.ReactElement {
  return (
    <div className="as-qrow">
      <span className="as-qlbl" style={{ color }}>
        {label}
      </span>
      <span className="as-queue">
        {tasks.length ? tasks.map((t) => <Chip key={t.id} t={t} />) : <span className="as-empty">—</span>}
      </span>
    </div>
  );
}

export function AsyncOrderSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = SCENARIOS[sIdx];
  const frames = useMemo(() => simulate(scenario), [scenario]);
  const codeLines = useMemo(() => scenario.code.split("\n"), [scenario]);

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

  const f = frames[i];
  const atEnd = i >= frames.length - 1;
  const microCount = f.micro.nextTick.length + f.micro.promise.length;
  const macroCount = f.macro.timeout.length + f.macro.immediate.length;

  return (
    <div className="as-sim" aria-label="Async execution-order simulator">
      <div className="as-tabs" role="tablist">
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
      <p className="as-blurb">{scenario.blurb}</p>

      <div className="as-body">
        {/* left: program, with the running line highlighted */}
        <div className="as-code">
          <div className="as-code-head">program.js</div>
          <pre>
            <code>
              {codeLines.map((ln, k) => (
                <div key={k} className={"as-cl" + (f.line === k ? " on" : "")}>
                  <span className="as-ln">{String(k + 1).padStart(2, " ")}</span>
                  <span className="as-lt">{ln === "" ? " " : ln}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* right: the three lanes + console */}
        <div className="as-stage">
          <div className="as-lanes">
            <div className={"as-lane stack" + (f.zone === "sync" ? " on" : "")}>
              <div className="as-col-title">
                call stack <span className="as-tag">now</span>
              </div>
              <div className="as-stackbox">
                {f.stack.length ? (
                  [...f.stack].reverse().map((fr, k) => (
                    <div key={k} className={"as-frame" + (k === 0 ? " top" : "")}>
                      {fr}
                    </div>
                  ))
                ) : (
                  <span className="as-empty">— empty —</span>
                )}
              </div>
            </div>

            <div className={"as-lane micro" + (f.zone === "micro" ? " on" : "")}>
              <div className="as-col-title">
                microtasks <span className="as-tag">this tick · {microCount}</span>
              </div>
              <QueueRow label="nextTick" color={KIND_COLOR.nextTick} tasks={f.micro.nextTick} />
              <QueueRow label="promise" color={KIND_COLOR.promise} tasks={f.micro.promise} />
            </div>

            <div className={"as-lane macro" + (f.zone === "macro" ? " on" : "")}>
              <div className="as-col-title">
                macrotasks <span className="as-tag">later · {macroCount}</span>
              </div>
              <QueueRow label="timers" color={KIND_COLOR.timeout} tasks={f.macro.timeout} />
              <QueueRow label="check" color={KIND_COLOR.immediate} tasks={f.macro.immediate} />
            </div>
          </div>

          <div className="as-console">
            <div className="as-col-title">console output — in the order it actually prints</div>
            <div className="as-out" aria-live="polite">
              {f.output.length === 0 ? <span className="as-empty">(nothing yet)</span> : null}
              {f.output.map((o, k) => (
                <div key={k} className={"as-line" + (k === f.output.length - 1 && f.acted ? " fresh" : "")}>
                  <span className="as-on">{String(o.n).padStart(2, "0")}</span>
                  <span className="as-gt">›</span> {o.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="as-caption" aria-live="polite">
        <span className="as-zone" style={{ color: f.acted ? ACT_TONE[f.acted.kind] : "var(--accent)", borderColor: "var(--accent-deep)" }}>
          {ZONE_LABEL[f.zone]}
        </span>
        {f.caption}
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
        <button className="btn" onClick={() => { setPlaying(false); setI((v) => Math.min(frames.length - 1, v + 1)); }} disabled={atEnd}>
          Step ▶
        </button>
        <div className="as-progress">
          <div className="as-progress-bar" style={{ width: `${(i / (frames.length - 1)) * 100}%` }} />
        </div>
        <span className="as-step">
          {i + 1}/{frames.length}
        </span>
      </div>

      {atEnd ? (
        <div className="as-expected">
          <span className="as-exp-lbl">Final order:</span>
          {scenario.expected.map((e, k) => (
            <span key={k} className="as-chip" style={{ borderColor: "#6CC24A", color: "#6CC24A" }}>
              {e}
            </span>
          ))}
          <span className="as-takeaway">{scenario.takeaway}</span>
        </div>
      ) : null}
    </div>
  );
}
