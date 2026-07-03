/* CHANGED: S15 — Ch.3 (Weaknesses) "block the loop": the 250 ms story of the
   blocking-loop figure, made draggable. One rogue synchronous call lands on a
   loop serving 100 innocent 1 ms handlers/s — drag its duration and watch
   EVERYONE ELSE's tail latency inherit it. Thin UI over simulateOneBlock in
   lib/eventLoopLagEngine (same verified engine as the Ch.14 hero sim); reuses
   the el-* styles from eventLoopLagSim.css — no new CSS. */
import React, { useState } from "react";
import {
  simulateOneBlock,
  BLOCK_ARRIVALS_PER_SEC,
  BLOCK_FAST_CPU_MS,
  BLOCK_AT_MS,
  BLOCK_MS_MAX,
  type LagVerdict,
} from "../../lib/eventLoopLagEngine";
import "./eventLoopLagSim.css";

const VERDICT: Record<LagVerdict, { lbl: string; cls: string }> = {
  healthy: { lbl: "harmless — under one frame", cls: "ok" },
  strained: { lbl: "felt — the tail is pulling away", cls: "warn" },
  overloaded: { lbl: "an incident — everyone inherits the stall", cls: "bad" },
};

function waitColor(waitMs: number): string {
  if (waitMs <= 2) return "var(--sem-runtime)";
  if (waitMs <= 60) return "var(--sem-io)";
  return "var(--sem-error)";
}

export function BlockTheLoopSim(): React.ReactElement {
  const [blockMs, setBlockMs] = useState(120);
  const res = simulateOneBlock(blockMs);
  const v = VERDICT[res.verdict];

  // show the requests around the block (arrivals 60–460 ms): calm → stall → drain
  const shown = res.reqs.filter((r) => r.arrivalMs >= 60 && r.arrivalMs < 460);
  const maxLat = Math.max(...shown.map((r) => r.latencyMs), 1);

  return (
    <div className="el-sim" aria-label="Block-the-loop simulator">
      <p className="el-blurb">
        A healthy server: <b>{BLOCK_ARRIVALS_PER_SEC} requests/s</b>, each needing{" "}
        <b>{BLOCK_FAST_CPU_MS} ms</b> on the loop. At t={BLOCK_AT_MS} ms <i>one</i> handler calls a
        synchronous API. Drag how long it holds the only thread:
      </p>

      <div className="el-sliderbar">
        <span className="el-slider-lbl">the one synchronous call</span>
        <input
          className="el-slider"
          type="range"
          min={0}
          max={BLOCK_MS_MAX}
          step={5}
          value={blockMs}
          onChange={(e) => setBlockMs(Number(e.target.value))}
          aria-label="duration of the single synchronous call in milliseconds"
          aria-valuetext={`${blockMs} millisecond synchronous block`}
        />
        <span className="el-nval">
          {blockMs}
          <span className="el-unit">ms</span>
        </span>
      </div>

      <div className="el-stats">
        <div className={"el-stat " + v.cls}>
          <span className="el-stat-k">requests stalled</span>
          <span className="el-stat-v">{res.stalled}</span>
          <span className="el-stat-sub">queued behind the block</span>
        </div>
        <div className="el-stat">
          <span className="el-stat-k">worst added wait</span>
          <span className="el-stat-v">
            {res.worstWaitMs}
            <span className="el-unit">ms</span>
          </span>
        </div>
        <div className="el-stat">
          <span className="el-stat-k">p99 of everyone else</span>
          <span className="el-stat-v">
            {res.p99Ms}
            <span className="el-unit">ms</span>
          </span>
          <span className="el-stat-sub">p50 stays {res.p50Ms}ms</span>
        </div>
      </div>

      <div className="el-bars" aria-hidden="true">
        {shown.map((r) => (
          <div
            key={r.i}
            className="el-bar-col"
            title={`req @${r.arrivalMs}ms: waited ${r.waitMs}ms behind the block`}
          >
            <div
              className="el-bar"
              style={{ height: Math.max(3, (r.latencyMs / maxLat) * 64), background: waitColor(r.waitMs) }}
            />
          </div>
        ))}
      </div>
      <div className="el-bars-cap">
        the innocent requests around the block ·{" "}
        <span style={{ color: "var(--sem-runtime)" }}>unaffected</span> →{" "}
        <span style={{ color: "var(--sem-error)" }}>stalled</span> → draining back to normal
      </div>

      <div className="el-verdict" aria-live="polite">
        <span className={"el-badge " + v.cls}>{v.lbl}</span>
        {res.verdict === "healthy" ? (
          <>
            Under ~16 ms a block hides inside a render frame — nobody notices. This is why "a little
            sync work" feels free… right up until it isn't.
          </>
        ) : res.verdict === "strained" ? (
          <>
            The block is longer than the gap between arrivals, so a queue forms on the loop. The
            median barely moves — but the p99 already shows the stall. This is the classic "our
            p99 is weird" incident in miniature.
          </>
        ) : (
          <>
            Every request that arrives during the block inherits its <i>full remaining duration</i>{" "}
            — {res.stalled} requests stalled and p99 jumped to {res.p99Ms} ms while p50 stayed at{" "}
            {res.p50Ms} ms. One handler, everyone pays. Fix: offload to a{" "}
            <a href="#/chapter/concurrency">worker thread</a>, chunk, stream, or cache.
          </>
        )}
      </div>
    </div>
  );
}
