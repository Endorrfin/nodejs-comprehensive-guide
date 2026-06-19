import React, { useState } from "react";
import { BOTTLENECKS, RUNTIME_COLOR } from "../../data/runtimes";
import "./runtimePicker.css";

const color = (n: string): string => RUNTIME_COLOR[n] ?? "#6CC24A";

export function RuntimePicker(): React.ReactElement {
  const [id, setId] = useState(BOTTLENECKS[0].id);
  const c = BOTTLENECKS.find((b) => b.id === id) ?? BOTTLENECKS[0];
  const bestC = color(c.best.runtime);
  const altC = color(c.alt.runtime);

  return (
    <div className="rp" aria-label="Pick a runtime by your bottleneck">
      <p className="rp-blurb">
        Pick your dominant constraint — the recommendation updates. There's rarely one right answer, so each comes with a runner-up and an honest caveat.
      </p>

      <div className="rp-chips" role="tablist" aria-label="Your bottleneck">
        {BOTTLENECKS.map((b) => (
          <button key={b.id} role="tab" aria-selected={b.id === id} className={"rp-chip" + (b.id === id ? " on" : "")} onClick={() => setId(b.id)}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="rp-result" aria-live="polite">
        <div className="rp-row best">
          <span className="rp-lbl">Best fit</span>
          <span className="rp-rt" style={{ color: bestC, borderColor: bestC }}>
            {c.best.runtime}
          </span>
          <span className="rp-why">{c.best.why}</span>
        </div>
        <div className="rp-row">
          <span className="rp-lbl alt">Also consider</span>
          <span className="rp-rt alt" style={{ color: altC, borderColor: altC }}>
            {c.alt.runtime}
          </span>
          <span className="rp-why">{c.alt.why}</span>
        </div>
        <div className="rp-caveat">
          <span className="rp-but">But</span>
          {c.caveat}
        </div>
      </div>
    </div>
  );
}
