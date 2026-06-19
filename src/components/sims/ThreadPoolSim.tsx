import React, { useEffect, useMemo, useRef, useState } from "react";
import { simulate, SCENARIOS, type Frame, type RunSlot, type DoneRec } from "../../lib/threadPoolEngine";
import "./threadPoolSim.css";

const POOL_COLOR = "#FF7A00"; // libuv thread pool / CPU work
const KERNEL_COLOR = "#6CC24A"; // OS kernel / network
const PLAY_MS = 850;

const pct = (sl: RunSlot): number => Math.max(0, Math.min(100, ((sl.task.cost - sl.remaining) / sl.task.cost) * 100));

function Slot({ slot, idx }: { slot: RunSlot | null; idx: number }): React.ReactElement {
  return (
    <div className={"tp-slot" + (slot ? " busy" : "")}>
      <div className="tp-slot-head">thread {idx + 1}</div>
      {slot ? (
        <>
          <div className="tp-slot-task" style={{ color: POOL_COLOR }}>
            {slot.task.label}
          </div>
          <div className="tp-bar">
            <div className="tp-bar-fill" style={{ width: pct(slot) + "%", background: POOL_COLOR }} />
          </div>
        </>
      ) : (
        <div className="tp-slot-idle">idle</div>
      )}
    </div>
  );
}

function DoneChip({ rec, fresh }: { rec: DoneRec; fresh: boolean }): React.ReactElement {
  const c = rec.task.lane === "pool" ? POOL_COLOR : KERNEL_COLOR;
  return (
    <span className={"tp-chip" + (fresh ? " fresh" : "")} style={{ borderColor: c, color: c }} title={`finished at tick ${rec.finish}`}>
      {rec.task.label}
    </span>
  );
}

export function ThreadPoolSim(): React.ReactElement {
  const [sIdx, setSIdx] = useState(0);
  const scenario = SCENARIOS[sIdx];
  const sizes = scenario.poolSizes ?? [scenario.poolSize];
  const [poolSize, setPoolSize] = useState(scenario.poolSize);

  const frames = useMemo(() => simulate(scenario, poolSize), [scenario, poolSize]);
  const codeLines = useMemo(() => scenario.code.split("\n"), [scenario]);

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  // reset frame position when scenario or pool size changes
  useEffect(() => {
    setI(0);
    setPlaying(false);
  }, [sIdx, poolSize]);

  // when switching scenarios, reset the pool size to that scenario's default
  useEffect(() => {
    setPoolSize(scenario.poolSize);
  }, [sIdx, scenario.poolSize]);

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

  const f: Frame = frames[i];
  const atEnd = i >= frames.length - 1;
  const kernelInFlight = f.kernel.filter((k) => k.remaining > 0);
  const kernelDone = f.done.filter((d) => d.task.lane === "kernel").length;
  const hasKernel = scenario.tasks.some((t) => t.lane === "kernel");
  const hasPool = scenario.tasks.some((t) => t.lane === "pool");

  return (
    <div className="tp-sim" aria-label="Thread pool vs kernel simulator">
      <div className="tp-tabs" role="tablist">
        {SCENARIOS.map((s, idx) => (
          <button key={s.id} role="tab" aria-selected={idx === sIdx} className={idx === sIdx ? "on" : ""} onClick={() => setSIdx(idx)}>
            {s.title}
          </button>
        ))}
      </div>
      <p className="tp-blurb">{scenario.blurb}</p>

      {sizes.length > 1 ? (
        <div className="tp-poolsize">
          <span className="tp-ps-lbl">UV_THREADPOOL_SIZE</span>
          {sizes.map((n) => (
            <button key={n} className={"tp-ps-btn" + (n === poolSize ? " on" : "")} onClick={() => setPoolSize(n)} aria-pressed={n === poolSize}>
              {n}
            </button>
          ))}
        </div>
      ) : null}

      <div className="tp-body">
        <div className="tp-code">
          <div className="tp-code-head">program.js</div>
          <pre>
            <code>
              {codeLines.map((ln, k) => (
                <div key={k} className="tp-cl">
                  <span className="tp-ln">{String(k + 1).padStart(2, " ")}</span>
                  <span className="tp-lt">{ln === "" ? " " : ln}</span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        <div className="tp-stage">
          {hasPool ? (
            <div className="tp-lane pool">
              <div className="tp-lane-head">
                <span className="tp-dot" style={{ background: POOL_COLOR }} />
                libuv thread pool · {f.poolSize} slot{f.poolSize > 1 ? "s" : ""}
                <span className="tp-lane-sub">fs · crypto · zlib · dns.lookup — blocking work</span>
              </div>
              <div className="tp-slots" style={{ gridTemplateColumns: `repeat(${Math.min(f.poolSize, 6)}, 1fr)` }}>
                {f.slots.map((sl, k) => (
                  <Slot key={k} slot={sl} idx={k} />
                ))}
              </div>
              <div className="tp-queue-row">
                <span className="tp-queue-lbl">queue</span>
                <span className="tp-queue">
                  {f.queue.length ? (
                    f.queue.map((t) => (
                      <span key={t.id} className="tp-chip waiting" style={{ borderColor: POOL_COLOR, color: POOL_COLOR }}>
                        {t.label}
                      </span>
                    ))
                  ) : (
                    <span className="tp-empty">— empty —</span>
                  )}
                </span>
              </div>
            </div>
          ) : null}

          {hasKernel ? (
            <div className="tp-lane kernel">
              <div className="tp-lane-head">
                <span className="tp-dot" style={{ background: KERNEL_COLOR }} />
                OS kernel · epoll / kqueue / IOCP
                <span className="tp-lane-sub">sockets — non-blocking, no thread held ({kernelDone}/{f.kernel.length} done)</span>
              </div>
              <div className="tp-kernel">
                {kernelInFlight.length ? (
                  kernelInFlight.map((k) => (
                    <div key={k.task.id} className="tp-inflight">
                      <span style={{ color: KERNEL_COLOR }}>{k.task.label}</span>
                      <div className="tp-bar">
                        <div className="tp-bar-fill" style={{ width: pct(k) + "%", background: KERNEL_COLOR }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="tp-empty">{kernelDone ? "all sockets resolved" : "—"}</span>
                )}
              </div>
            </div>
          ) : null}

          <div className="tp-doneline">
            <div className="tp-col-title">completed — in finish order</div>
            <div className="tp-done" aria-live="polite">
              {f.done.length === 0 ? <span className="tp-empty">(nothing yet)</span> : null}
              {f.done.map((rec) => (
                <DoneChip key={rec.task.id} rec={rec} fresh={f.justFinished.includes(rec.task.id)} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tp-caption" aria-live="polite">
        <span className="tp-tick">t={f.now}</span>
        {f.caption}
      </div>

      <div className="tp-controls">
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
        <div className="tp-progress">
          <div className="tp-progress-bar" style={{ width: `${(i / (frames.length - 1)) * 100}%` }} />
        </div>
        <span className="tp-step">{i + 1}/{frames.length}</span>
      </div>

      {atEnd ? (
        <div className="tp-takeaway">
          <span className="tp-take-lbl">Takeaway</span>
          {scenario.takeaway}
        </div>
      ) : null}
    </div>
  );
}
