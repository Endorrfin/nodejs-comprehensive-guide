import React, { useEffect, useState } from "react";
import { WORKLOADS, simulateLoop, CPU_MS_MIN, CPU_MS_MAX, type LagVerdict } from "../../lib/eventLoopLagEngine";
import "./eventLoopLagSim.css";

const VERDICT: Record<LagVerdict, { lbl: string; cls: string }> = {
  healthy: { lbl: "healthy — loop keeps up", cls: "ok" },
  strained: { lbl: "strained — lag building", cls: "warn" },
  overloaded: { lbl: "overloaded — loop pinned", cls: "bad" },
};

/** Map a lag value (ms) onto a 0–100% meter, capped at 500ms for readability. */
const lagPct = (ms: number): number => Math.max(1, Math.min(100, (ms / 500) * 100));

function waitColor(waitMs: number): string {
  if (waitMs <= 2) return "var(--sem-runtime)";
  if (waitMs <= 60) return "var(--sem-io)";
  return "var(--sem-error)";
}

export function EventLoopLagSim(): React.ReactElement {
  const [wIdx, setWIdx] = useState(0);
  const workload = WORKLOADS[wIdx];
  const [cpu, setCpu] = useState(workload.defaultCpuMs);

  // reset the CPU knob to the workload's default when switching tabs
  useEffect(() => {
    setCpu(WORKLOADS[wIdx].defaultCpuMs);
  }, [wIdx]);

  const res = simulateLoop(workload, cpu);
  const v = VERDICT[res.verdict];
  const interval = Math.round((1000 / workload.arrivalsPerSec) * 10) / 10;

  const shown = res.reqs.slice(0, 14);
  const maxLat = Math.max(...shown.map((r) => r.latencyMs), 1);

  return (
    <div className="el-sim" aria-label="Event-loop lag simulator">
      <div className="el-tabs" role="tablist">
        {WORKLOADS.map((w, idx) => (
          <button key={w.id} role="tab" aria-selected={idx === wIdx} className={idx === wIdx ? "on" : ""} onClick={() => setWIdx(idx)}>
            {w.title}
          </button>
        ))}
      </div>
      <p className="el-blurb">{workload.blurb}</p>

      <div className="el-sliderbar">
        <span className="el-slider-lbl">synchronous CPU / request</span>
        <input
          className="el-slider"
          type="range"
          min={CPU_MS_MIN}
          max={CPU_MS_MAX}
          step={2}
          value={cpu}
          onChange={(e) => setCpu(Number(e.target.value))}
          aria-label="synchronous CPU time per request in milliseconds"
          aria-valuetext={`${cpu} milliseconds of synchronous CPU per request`}
        />
        <span className="el-nval">{cpu}<span className="el-unit">ms</span></span>
      </div>
      <div className="el-context">
        requests arrive every <b>{interval}ms</b> ({workload.arrivalsPerSec}/s){workload.ioMs > 0 ? <> · each also waits <b>{workload.ioMs}ms</b> on off-loop I/O</> : null}. The loop runs one request's CPU at a time — so when CPU/request exceeds the arrival gap, a queue forms <i>on the loop itself</i>.
      </div>

      <div className="el-stats">
        <div className={"el-stat " + v.cls}>
          <span className="el-stat-k">event-loop lag (max)</span>
          <span className="el-stat-v">{res.lagMaxMs}<span className="el-unit">ms</span></span>
        </div>
        <div className="el-stat">
          <span className="el-stat-k">p99 latency</span>
          <span className="el-stat-v">{res.p99Ms}<span className="el-unit">ms</span></span>
          <span className="el-stat-sub">p50 {res.p50Ms}ms</span>
        </div>
        <div className="el-stat">
          <span className="el-stat-k">loop utilization</span>
          <span className="el-stat-v">{res.eluPct}<span className="el-unit">%</span></span>
        </div>
        <div className="el-stat">
          <span className="el-stat-k">throughput</span>
          <span className="el-stat-v">{res.throughputPerSec}<span className="el-unit">/s</span></span>
        </div>
      </div>

      {/* lag meter with a 16ms 'one frame' marker */}
      <div className="el-meter-wrap">
        <div className="el-meter">
          <div className={"el-meter-fill " + v.cls} style={{ width: lagPct(res.lagMaxMs) + "%" }} />
          <span className="el-meter-mark" style={{ left: lagPct(16) + "%" }} title="16ms — one render frame" />
        </div>
        <div className="el-meter-axis"><span>0</span><span>16ms</span><span>≥500ms</span></div>
      </div>

      {/* per-request latency staircase (first 14 requests) */}
      <div className="el-bars" aria-hidden="true">
        {shown.map((r) => (
          <div key={r.i} className="el-bar-col" title={`req #${r.i}: waited ${r.waitMs}ms on the loop, latency ${r.latencyMs}ms`}>
            <div className="el-bar" style={{ height: Math.max(3, (r.latencyMs / maxLat) * 64), background: waitColor(r.waitMs) }} />
          </div>
        ))}
      </div>
      <div className="el-bars-cap">latency of the first {shown.length} requests · <span style={{ color: "var(--sem-runtime)" }}>no wait</span> → <span style={{ color: "var(--sem-io)" }}>queuing</span> → <span style={{ color: "var(--sem-error)" }}>stalled behind the loop</span></div>

      <div className="el-verdict" aria-live="polite">
        <span className={"el-badge " + v.cls}>{v.lbl}</span>
        {res.verdict === "healthy" ? (
          <>The loop finishes each request before the next arrives, so lag stays near zero and p99 ≈ p50. This is the regime to stay in — offload anything heavier.</>
        ) : res.verdict === "strained" ? (
          <>Per-request CPU is close to the arrival gap, so a queue starts to form on the loop and the tail (p99) pulls away from the median. A traffic spike from here tips into overload.</>
        ) : (
          <>Each request needs more loop time than the gap between arrivals, so work piles up faster than it clears: lag and p99 climb without bound while the loop sits at 100%. Fix: move the CPU off the loop (worker_threads), stream, or cache — then re-measure.</>
        )}
      </div>
    </div>
  );
}
