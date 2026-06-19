import React from "react";
import { CHAPTERS, GROUPS } from "../../data/concepts";
import { INTERVIEW } from "../../data/interview";
import { MODELS } from "../../data/mentalModels";
import { go } from "../../lib/hashRouter";

const LINKEDIN = "https://www.linkedin.com/in/vasyl-krupka/";

/** Meta page: a short frame for first-time visitors (what this is, what's inside,
    how it's built, who made it). Counts are live from the data layer. */
export function AboutPage(): React.ReactElement {
  return (
    <div className="page about">
      <h1>About this guide</h1>
      <p className="lead">
        A deep, interactive, senior/staff-level guide to how Node.js actually works — built to
        understand and remember the runtime, and to prepare for senior/staff interviews.
      </p>

      <div className="map-stats" style={{ justifyContent: "flex-start", margin: "0 0 12px" }}>
        <div className="map-stat">
          <b>{CHAPTERS.length}</b>chapters
        </div>
        <div className="map-stat">
          <b>{GROUPS.length}</b>parts
        </div>
        <div className="map-stat">
          <b>{INTERVIEW.length}</b>interview Q&amp;A
        </div>
        <div className="map-stat">
          <b>{MODELS.length}</b>mental models
        </div>
      </div>

      <section className="block">
        <h2>What it is</h2>
        <p className="prose">
          Most Node material stops at "it's non-blocking." This one goes down to the machinery — the
          libuv event loop and its six phases, the V8 pipeline and generational GC, the async model,
          the thread pool vs. kernel async, streams and backpressure, the module systems, error
          channels, HTTP internals and production patterns — explained with prose, diagrams and{" "}
          <strong style={{ color: "var(--tx)" }}>live simulators</strong> you can step through.
        </p>
      </section>

      <section className="block">
        <h2>What's inside</h2>
        <p className="prose">Four parts, building from the mental model up:</p>
        <div className="keypoints" style={{ marginTop: 10 }}>
          {GROUPS.map((g) => (
            <div className="kp" key={g.id}>
              <span className="sb-dot" style={{ background: g.accent, alignSelf: "center" }} aria-hidden="true" />
              <span>
                <strong style={{ color: "var(--tx)" }}>{g.name}</strong> — {g.blurb}
              </span>
            </div>
          ))}
        </div>
        <p className="prose" style={{ marginTop: 12 }}>
          Plus interactive simulators (event loop, V8 &amp; GC, the thread pool, backpressure, the HTTP
          lifecycle, graceful shutdown and more), a predict-the-output quiz engine, a filterable
          interview bank, a draw-from-memory mental-models gallery, and a spaced-recall flashcard deck.
        </p>
      </section>

      <section className="block">
        <h2>How it's built</h2>
        <p className="prose">
          <strong style={{ color: "var(--tx)" }}>Truth-first.</strong> Every version-sensitive claim is
          verified against the Node.js, libuv and V8 docs, and every simulator is driven by a
          deterministic engine whose output is captured from real Node and asserted in tests — so the
          diagrams match what your terminal prints.
        </p>
        <p className="prose">
          <strong style={{ color: "var(--tx)" }}>Single source of truth.</strong> All content lives in
          one data layer; pages are rendered from it.{" "}
          <strong style={{ color: "var(--tx)" }}>Static &amp; offline.</strong> No backend and no runtime
          fetches — Vite + React 19 + TypeScript (strict), deployed as a static site on GitHub Pages.
        </p>
      </section>

      <section className="block">
        <h2>Who made it</h2>
        <p className="prose">
          Built by <strong style={{ color: "var(--tx)" }}>Vasyl Krupka</strong> — Senior Fullstack
          Engineer, Ukraine&nbsp;🇺🇦.{" "}
          <a href={LINKEDIN} target="_blank" rel="noreferrer noopener">
            Connect on LinkedIn ↗
          </a>
        </p>
      </section>

      <div style={{ marginTop: 22, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn primary" onClick={() => go("/map")}>
          Explore the overview →
        </button>
        <button className="btn" onClick={() => go("/chapter/event-loop")}>
          Start with the event loop
        </button>
      </div>
    </div>
  );
}
