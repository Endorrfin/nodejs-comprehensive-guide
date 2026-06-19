import React, { useState } from "react";
import { DEFENSES, ATTACKS, evaluate, score, type Defense, type AttackStatus } from "../../lib/supplyChainEngine";
import "./supplyChainSim.css";

const STATUS: Record<AttackStatus, { lbl: string; cls: string }> = {
  blocked: { lbl: "blocked", cls: "ok" },
  contained: { lbl: "contained", cls: "warn" },
  exposed: { lbl: "exposed", cls: "bad" },
};

export function SupplyChainSim(): React.ReactElement {
  const [active, setActive] = useState<Set<Defense>>(new Set());
  const [sel, setSel] = useState(0);

  const toggle = (d: Defense): void => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  };
  const all = (): void => setActive(new Set(DEFENSES.map((d) => d.id)));
  const none = (): void => setActive(new Set());

  const s = score(active);
  const attack = ATTACKS[sel];
  const attackStatus = evaluate(attack, active);
  const actingStops = attack.stoppedBy.filter((d) => active.has(d));
  const actingContains = attack.containedBy.filter((d) => active.has(d));

  return (
    <div className="sc-sim" aria-label="Supply-chain defense simulator">
      <p className="sc-blurb">
        Toggle real defenses and watch which attack classes are <span className="sc-i ok">blocked</span>, only{" "}
        <span className="sc-i warn">contained</span>, or still <span className="sc-i bad">exposed</span>. No single control covers everything — that's the point.
      </p>

      {/* defense toggles */}
      <div className="sc-defenses" role="group" aria-label="defenses">
        {DEFENSES.map((d) => {
          const on = active.has(d.id);
          return (
            <button key={d.id} className={"sc-def" + (on ? " on" : "")} aria-pressed={on} onClick={() => toggle(d.id)} title={d.detail}>
              <span className="sc-def-check">{on ? "✓" : "+"}</span>
              <span className="sc-def-txt">
                <span className="sc-def-lbl">{d.label}</span>
                <span className="sc-def-how">{d.how}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="sc-actions">
        <button className="sc-mini" onClick={all}>Harden all</button>
        <button className="sc-mini" onClick={none}>Reset</button>
        <span className="sc-score">
          <b className="ok">{s.blocked}</b> blocked · <b className="warn">{s.contained}</b> contained · <b className="bad">{s.exposed}</b> exposed
        </span>
      </div>

      {/* attack rows */}
      <div className="sc-attacks">
        {ATTACKS.map((a, idx) => {
          const st = STATUS[evaluate(a, active)];
          return (
            <button key={a.id} className={"sc-attack" + (idx === sel ? " sel" : "")} aria-selected={idx === sel} onClick={() => setSel(idx)}>
              <span className="sc-attack-main">
                <span className="sc-attack-ttl">{a.title}</span>
                <span className="sc-attack-real">{a.real}</span>
              </span>
              <span className={"sc-status " + st.cls}>{st.lbl}</span>
            </button>
          );
        })}
      </div>

      {/* detail of the selected attack */}
      <div className="sc-detail" aria-live="polite">
        <div className="sc-detail-top">
          <span className="sc-detail-ttl">{attack.title}</span>
          <span className={"sc-status " + STATUS[attackStatus].cls}>{STATUS[attackStatus].lbl}</span>
        </div>
        <p className="sc-detail-blurb">{attack.blurb}</p>
        <p className="sc-detail-note">{attack.note}</p>
        <div className="sc-detail-acting">
          {actingStops.length > 0 ? (
            <span className="sc-tag ok">stopped by: {actingStops.map((d) => DEFENSES.find((x) => x.id === d)!.label).join(", ")}</span>
          ) : null}
          {actingStops.length === 0 && actingContains.length > 0 ? (
            <span className="sc-tag warn">contained by: {actingContains.map((d) => DEFENSES.find((x) => x.id === d)!.label).join(", ")}</span>
          ) : null}
          {attackStatus === "exposed" ? <span className="sc-tag bad">no active defense stops this</span> : null}
        </div>
      </div>
    </div>
  );
}
