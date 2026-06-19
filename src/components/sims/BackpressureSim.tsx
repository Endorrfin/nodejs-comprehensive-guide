import React, { useEffect, useMemo, useRef, useState } from "react";
import { simulate, STREAM_SCENARIOS, type Mode, type StreamFrame } from "../../lib/streamEngine";
import "./backpressureSim.css";

const GREEN = "#6CC24A"; // healthy / within highWaterMark
const RED = "#F87171"; // overflow / unbounded memory
const BLUE = "#38BDF8"; // producer (fast source)
const PLAY_MS = 820;

export function BackpressureSim(): React.ReactElement {
  const scenario = STREAM_SCENARIOS[0];
  const [mode, setMode] = useState<Mode>("respect");
  const [hwm, setHwm] = useState(scenario.defaultHwm);

  const frames = useMemo(() => simulate(scenario, { mode, hwm }), [scenario, mode, hwm]);
  const code = mode === "respect" ? scenario.codeRespect : scenario.codeIgnore;
  const codeLines = useMemo(() => code.split("\n"), [code]);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [mode, hwm]);

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

  const f: StreamFrame = frames[i];
  const atEnd = i >= frames.length - 1;

  const scaleMax = scenario.total; // common scale so respect vs ignore are comparable
  const over = f.buffer >= f.hwm;
  const bufColor = over ? RED : GREEN;
  const bufPct = Math.min(100, (f.buffer / scaleMax) * 100);
  const hwmPct = (f.hwm / scaleMax) * 100;
  const peakPct = Math.min(100, (f.maxBuffer / scaleMax) * 100);
  const writeState = f.lastWriteOk; // true / false / null

  return (
    <div className="bp-sim" aria-label="Backpressure simulator">
      <p className="bp-blurb">{scenario.blurb}</p>

      <div className="bp-controls-top">
        <div className="bp-toggle" role="tablist" aria-label="Backpressure policy">
          <button role="tab" aria-selected={mode === "respect"} className={mode === "respect" ? "on good" : ""} onClick={() => setMode("respect")}>
            ✓ Respect backpressure
          </button>
          <button role="tab" aria-selected={mode === "ignore"} className={mode === "ignore" ? "on bad" : ""} onClick={() => setMode("ignore")}>
            ✕ Ignore it
          </button>
        </div>
        <div className="bp-hwm">
          <span className="bp-hwm-lbl">highWaterMark</span>
          {scenario.hwms.map((n) => (
            <button key={n} className={"bp-hwm-btn" + (n === hwm ? " on" : "")} onClick={() => setHwm(n)} aria-pressed={n === hwm}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="bp-body">
        <div className="bp-code">
          <div className="bp-code-head">{mode === "respect" ? "pump.js — respects write()/drain" : "leak.js — ignores write()"}</div>
          <pre>
            <code>
              {codeLines.map((ln, k) => (
                <div key={k} className="bp-cl">
                  <span className="bp-ln">{String(k + 1).padStart(2, " ")}</span>
                  <span className="bp-lt">{ln === "" ? " " : ln}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        <div className="bp-stage">
          <div className="bp-pipeline">
            {/* producer */}
            <div className={"bp-node producer" + (f.paused ? " paused" : "")}>
              <div className="bp-node-ttl" style={{ color: BLUE }}>
                Readable
              </div>
              <div className="bp-node-sub">fast · {scenario.produceRate}/tick</div>
              <div className="bp-meter">
                wrote <b>{f.produced}</b>/{f.total}
              </div>
              <div className={"bp-state" + (f.paused ? " paused" : "")}>{f.paused ? "⏸ PAUSED" : "▶ writing"}</div>
            </div>

            {/* write() arrow + return pill */}
            <div className="bp-arrow">
              <div className="bp-arrow-line" />
              <div
                className={"bp-write" + (writeState === false ? " false" : writeState === true ? " true" : " idle")}
              >
                {writeState === null ? "write()" : `write() → ${writeState}`}
              </div>
            </div>

            {/* buffer tank */}
            <div className="bp-buffer">
              <div className="bp-tank">
                <div className="bp-hwm-line" style={{ bottom: `${hwmPct}%` }}>
                  <span>hwm {f.hwm}</span>
                </div>
                <div className="bp-overflow" style={{ bottom: `${hwmPct}%`, height: `${100 - hwmPct}%` }} />
                <div className="bp-peak" style={{ bottom: `${peakPct}%` }} title={`peak ${f.maxBuffer}`} />
                <div className="bp-fill" style={{ height: `${bufPct}%`, background: bufColor }} />
              </div>
              <div className="bp-tank-lbl">
                buffer <b style={{ color: bufColor }}>{f.buffer}</b>
                <span className="bp-tank-sub">peak {f.maxBuffer}</span>
              </div>
            </div>

            {/* drain arrow */}
            <div className="bp-arrow">
              <div className="bp-arrow-line" />
              <div className={"bp-drainpill" + (f.event === "drain" ? " fire" : "")}>{f.event === "drain" ? "‘drain’" : "flush"}</div>
            </div>

            {/* consumer */}
            <div className="bp-node consumer">
              <div className="bp-node-ttl" style={{ color: GREEN }}>
                Writable
              </div>
              <div className="bp-node-sub">slow · {scenario.consumeRate}/tick</div>
              <div className="bp-meter">
                flushed <b>{f.consumed}</b>/{f.total}
              </div>
              <div className="bp-state">↧ draining</div>
            </div>
          </div>

          <div className="bp-readouts">
            <span className="bp-readout">
              drain events <b>{f.drains}</b>
            </span>
            <span className="bp-readout">
              peak buffer <b style={{ color: f.maxBuffer > f.hwm ? RED : GREEN }}>{f.maxBuffer}</b> vs hwm {f.hwm}
            </span>
          </div>
        </div>
      </div>

      <div className="bp-caption" aria-live="polite">
        <span className="bp-tick">tick {f.tick}</span>
        {f.caption}
      </div>

      <div className="bp-ctrls">
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
        <div className="bp-progress">
          <div className="bp-progress-bar" style={{ width: `${(i / (frames.length - 1)) * 100}%` }} />
        </div>
        <span className="bp-step">{i + 1}/{frames.length}</span>
      </div>

      {atEnd ? (
        <div className={"bp-takeaway " + mode}>
          <span className="bp-take-lbl">{mode === "respect" ? "Bounded" : "Unbounded"}</span>
          {mode === "respect" ? scenario.takeawayRespect : scenario.takeawayIgnore}
        </div>
      ) : null}
    </div>
  );
}
