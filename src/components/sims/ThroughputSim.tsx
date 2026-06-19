import React, { useState } from "react";
import { compute, memRatio, MODELS, N_STOPS, fmtMem, fmtN, type ModelId } from "../../lib/throughputEngine";
import "./throughputSim.css";

const SCALE_MAX = compute("thread", N_STOPS[N_STOPS.length - 1]).memMiB; // common bar scale

function Card({ model, n }: { model: ModelId; n: number }): React.ReactElement {
  const m = MODELS[model];
  const r = compute(model, n);
  const pct = Math.max(1.5, Math.min(100, (r.memMiB / SCALE_MAX) * 100));
  return (
    <div className="th-card" style={{ borderColor: m.color }}>
      <div className="th-card-head">
        <span className="th-dot" style={{ background: m.color }} />
        <span className="th-name">{m.label}</span>
      </div>
      <div className="th-sub">{m.sub}</div>
      <div className="th-mem" style={{ color: m.color }}>
        {fmtMem(r.memMiB)}
      </div>
      <div className="th-bar">
        <div className="th-bar-fill" style={{ width: pct + "%", background: m.color }} />
      </div>
      <div className="th-stats">
        <span>
          OS threads <b style={{ color: m.color }}>{model === "loop" ? "1" : fmtN(r.threads)}</b>
        </span>
        <span>
          holds <b>{fmtN(r.served)}</b> conns
        </span>
      </div>
    </div>
  );
}

export function ThroughputSim(): React.ReactElement {
  const [idx, setIdx] = useState(2); // start at 1,000
  const n = N_STOPS[idx];
  const ratio = memRatio(n);
  const loopMem = compute("loop", n).memMiB;
  const threadMem = compute("thread", n).memMiB;

  return (
    <div className="th-sim" aria-label="Connection-scaling simulator">
      <p className="th-blurb">
        Drag to add concurrent, mostly-idle connections. Watch the memory each architecture needs to hold them — the C10k problem, to scale.
      </p>

      <div className="th-sliderbar">
        <span className="th-slider-lbl">concurrent connections</span>
        <input
          className="th-slider"
          type="range"
          min={0}
          max={N_STOPS.length - 1}
          step={1}
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          aria-label="number of concurrent connections"
          aria-valuetext={`${n} connections`}
        />
        <span className="th-nval">{n.toLocaleString()}</span>
      </div>

      <div className="th-cards">
        <Card model="thread" n={n} />
        <Card model="loop" n={n} />
      </div>

      <div className="th-verdict" aria-live="polite">
        <span className="th-verdict-ratio">{ratio.toFixed(1)}×</span>
        To hold <b>{n.toLocaleString()}</b> connections, thread-per-request needs <b style={{ color: MODELS.thread.color }}>{fmtMem(threadMem)}</b> across{" "}
        <b style={{ color: MODELS.thread.color }}>{fmtN(n)}</b> OS threads; the event loop holds them all in{" "}
        <b style={{ color: MODELS.loop.color }}>{fmtMem(loopMem)}</b> on <b style={{ color: MODELS.loop.color }}>one</b> thread — about{" "}
        <b>{ratio.toFixed(1)}×</b> less memory.
      </div>

      <div className="th-note">
        Order-of-magnitude model of the C10k problem (~1 MiB per thread vs ~64 KiB per socket) — a thread costs roughly <b>16×</b> a socket, which is the ceiling this ratio approaches. Real numbers vary; the shape does not.
      </div>
    </div>
  );
}
