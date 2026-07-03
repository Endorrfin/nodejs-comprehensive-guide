import React, { useState } from "react";
import { CHAPTERS, GROUPS, chaptersInGroup, type Chapter } from "../../data/concepts";
import { MODELS } from "../../data/mentalModels";
import { go } from "../../lib/hashRouter";
import { SeeAlsoGraph } from "./SeeAlsoGraph"; // CHANGED: S15
import { cx } from "../../lib/utils"; // CHANGED: S15

const hasSim = (c: Chapter): boolean => c.sections.some((s) => s.kind === "sim");

export function ConceptMap(): React.ReactElement {
  const [view, setView] = useState<"grid" | "graph">("grid"); // CHANGED: S15

  return (
    <div className="map-wrap">
      <div className="map-hero">
        <h1>
          Node.js <b>Comprehensive Guide</b>
        </h1>
        <p>
          A deep, interactive, senior/staff tour of how Node really works — the event loop, V8 &amp;
          GC, the async model, concurrency, streams and production internals — with live simulators
          and draw-from-memory mental models.
        </p>
        <div className="map-stats">
          <div className="map-stat">
            <b>{CHAPTERS.length}</b>chapters
          </div>
          <div className="map-stat">
            <b>{GROUPS.length}</b>parts
          </div>
          <div className="map-stat">
            <b>{MODELS.length}</b>mental models
          </div>
        </div>
        {/* CHANGED: S15 — grid | graph toggle */}
        <div className="map-toggle filters" role="group" aria-label="Overview mode">
          <button className={cx("fbtn", view === "grid" && "on")} onClick={() => setView("grid")}>
            Grid
          </button>
          <button className={cx("fbtn", view === "graph" && "on")} onClick={() => setView("graph")}>
            Graph — how chapters connect
          </button>
        </div>
      </div>

      {/* CHANGED: S15 — graph view (seeAlso chords) as an alternative to the grid */}
      {view === "graph" ? (
        <SeeAlsoGraph />
      ) : (
        <div className="map-grid">
          {GROUPS.map((g) => (
            <div className="map-col" key={g.id}>
              <div className="map-col-head">
                <span className="bar" style={{ background: g.accent }} aria-hidden="true" />
                <div>
                  <h2>{g.name}</h2>
                  <div className="blurb">{g.blurb}</div>
                </div>
              </div>
              {chaptersInGroup(g.id).map((c) => (
                <button className="card" key={c.id} onClick={() => go(c.link ?? "/chapter/" + c.id)}>
                  <div className="card-top">
                    <span className="card-num">{String(c.order).padStart(2, "0")}</span>
                    <span className="card-title">{c.title}</span>
                  </div>
                  <div className="card-tag">{c.tagline}</div>
                  <div className="card-foot">
                    <span>{c.readMins} min</span>
                    {hasSim(c) ? <span className="pill hero">▶ live simulator</span> : null}
                    {c.link ? <span className="pill">page</span> : c.stub ? <span className="pill">seeded</span> : <span className="pill hero">full</span>}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
