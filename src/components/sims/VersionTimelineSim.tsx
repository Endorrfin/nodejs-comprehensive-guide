import React, { useEffect, useState } from "react";
import {
  TIMELINE,
  NOW,
  STATUS_META,
  STABILITY_META,
  DOMAIN_LABEL,
  featuresUpTo,
  type Feature,
} from "../../lib/versionTimelineEngine";
import "./versionTimelineSim.css";

const START_IDX = Math.max(0, TIMELINE.findIndex((l) => l.major === NOW.activeLts));

function FeatureCard({ f }: { f: Feature }): React.ReactElement {
  const sm = STABILITY_META[f.stability];
  return (
    <div className="vt-feat" style={{ borderColor: f.stability === "experimental" ? "#5a3a18" : "var(--line2)" }}>
      <div className="vt-feat-top">
        <span className="vt-feat-label">{f.label}</span>
        <span className="vt-pill" style={{ color: sm.color, borderColor: sm.color }}>
          {sm.label}
        </span>
      </div>
      <div className="vt-feat-blurb">{f.blurb}</div>
      <div className="vt-feat-domain">{DOMAIN_LABEL[f.domain]}</div>
    </div>
  );
}

export function VersionTimelineSim(): React.ReactElement {
  const [idx, setIdx] = useState(START_IDX);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const line = TIMELINE[idx];
  const last = TIMELINE.length - 1;

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = (): void => setReduced(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (idx >= last) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => Math.min(last, i + 1)), 2200);
    return () => clearTimeout(t);
  }, [playing, idx, last]);

  const sm = STATUS_META[line.status];
  const standing = featuresUpTo(line.major).length;

  return (
    <div className="vt-sim" aria-label="Node.js version timeline">
      <p className="vt-blurb">
        Scrub the release lines. Each step reveals what landed in that major and whether it shipped{" "}
        <span style={{ color: STABILITY_META.stable.color }}>stable</span> or{" "}
        <span style={{ color: STABILITY_META.experimental.color }}>experimental</span> — and where the line stands today.
      </p>

      {/* the track */}
      <div className="vt-track" role="group" aria-label="Release lines">
        <div className="vt-rail" aria-hidden="true" />
        {TIMELINE.map((l, i) => {
          const m = STATUS_META[l.status];
          const active = i === idx;
          return (
            <button
              key={l.major}
              className={"vt-node" + (active ? " on" : "") + (i < idx ? " past" : "")}
              aria-pressed={active}
              aria-label={`Node ${l.major}, ${l.year} — ${m.label}`}
              onClick={() => {
                setPlaying(false);
                setIdx(i);
              }}
            >
              <span className="vt-node-dot" style={{ background: m.color, boxShadow: active ? `0 0 0 4px ${m.color}33` : "none" }} />
              <span className="vt-node-major">{l.major}</span>
              <span className="vt-node-year">{l.year}</span>
            </button>
          );
        })}
      </div>

      {/* controls */}
      <div className="vt-controls">
        <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}>
          ◀ Prev
        </button>
        {!reduced ? (
          <button className="btn primary" onClick={() => { if (idx >= last) setIdx(0); setPlaying((p) => !p); }}>
            {playing ? "❚❚ Pause" : "▶ Play"}
          </button>
        ) : null}
        <button className="btn" onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)); }} disabled={idx === last}>
          Next ▶
        </button>
        <span className="vt-step">{idx + 1} / {TIMELINE.length}</span>
        <button className="btn vt-reset" onClick={() => { setPlaying(false); setIdx(START_IDX); }}>
          Jump to Active LTS
        </button>
      </div>

      {/* the panel */}
      <div className="vt-panel" aria-live="polite">
        <div className="vt-panel-head">
          <span className="vt-major">Node {line.major}</span>
          <span className="vt-status" style={{ color: sm.color, borderColor: sm.color }}>
            {sm.label}
          </span>
          <span className="vt-v8">V8 {line.v8}</span>
          <span className="vt-year">released {line.year}</span>
        </div>
        <div className="vt-statusnote" style={{ color: sm.color }}>{line.statusNote}</div>
        <p className="vt-headline">{line.headline}</p>

        <div className="vt-feats">
          {line.features.map((f) => (
            <FeatureCard key={f.id} f={f} />
          ))}
        </div>

        <div className="vt-standing">
          By <b>Node {line.major}</b>, <b>{standing}</b> of the guide's tracked modern capabilities are in the runtime
          {line.major <= NOW.activeLts ? "" : " (newest line — not all of it has reached LTS yet)"}.
        </div>
      </div>

      {/* what's next */}
      <div className="vt-next">
        <span className="vt-next-lbl">What changes next</span>
        From <b>October 2026</b>, starting with <b>Node {NOW.scheduleChangeFrom}</b>: one major per year, version numbers track the
        calendar year, <b>every release becomes LTS</b>, and a new Alpha channel opens for early testing.
      </div>
    </div>
  );
}
