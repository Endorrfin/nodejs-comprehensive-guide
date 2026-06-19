import React from "react";
import { CHAPTERS, CHAPTER_BY_ID, GROUPS, type Chapter } from "../../data/concepts";
import { SectionView } from "./Section";
import { go } from "../../lib/hashRouter";

const ORDERED = [...CHAPTERS].sort((a, b) => a.order - b.order);

function hrefFor(id: string): string {
  const c = CHAPTER_BY_ID[id];
  if (!c) return "#/map";
  return c.link ? "#" + c.link : "#/chapter/" + c.id;
}

function jump(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ChapterPage({ id }: { id: string }): React.ReactElement {
  const ch: Chapter | undefined = CHAPTER_BY_ID[id];
  if (!ch) {
    return (
      <div className="chapter">
        <p className="prose">Chapter not found.</p>
        <button className="btn" onClick={() => go("/map")}>
          ← Back to overview
        </button>
      </div>
    );
  }

  const group = GROUPS.find((g) => g.id === ch.group);
  const idx = ORDERED.findIndex((c) => c.id === ch.id);
  const prev = idx > 0 ? ORDERED[idx - 1] : null;
  const next = idx < ORDERED.length - 1 ? ORDERED[idx + 1] : null;
  // CHANGED: tag only the FIRST sim section as #simulator (chapters can now have
  // several interactive widgets, e.g. a sim + a quiz — avoid duplicate ids).
  const firstSimIdx = ch.sections.findIndex((s) => s.kind === "sim");
  const hasSim = firstSimIdx !== -1;

  return (
    <article className="chapter">
      <header className="ch-head">
        <span className="chip">
          <span className="sb-dot" style={{ background: group?.accent }} aria-hidden="true" />
          {group?.name}
        </span>
        <h1 className="ch-title">{ch.full ?? ch.title}</h1>
        <p className="ch-tagline">{ch.tagline}</p>
        <div className="ch-meta">
          <span>Chapter {ch.order}</span>
          <span>·</span>
          <span>{ch.readMins} min read</span>
          {ch.stub ? (
            <>
              <span>·</span>
              <span style={{ color: "var(--accent)" }}>seeded — full deep-dive coming soon</span>
            </>
          ) : null}
        </div>

        <div className="mental">
          <div className="lbl">Mental model</div>
          <p>{ch.mentalModel}</p>
        </div>

        <div className="seealso" style={{ marginTop: 14 }}>
          {hasSim ? (
            <a href="#simulator" onClick={(e) => { e.preventDefault(); jump("simulator"); }}>
              ▶ Simulator
            </a>
          ) : null}
          {ch.keyPoints.length ? (
            <a href="#keypoints" onClick={(e) => { e.preventDefault(); jump("keypoints"); }}>
              ◆ Key points
            </a>
          ) : null}
          {ch.interview.length ? (
            <a href="#interview" onClick={(e) => { e.preventDefault(); jump("interview"); }}>
              ? Interview
            </a>
          ) : null}
        </div>
      </header>

      {/* sections */}
      <div className="ch-sections">
        {ch.sections.map((s, i) => (
          <div key={i} id={i === firstSimIdx ? "simulator" : undefined}>
            <SectionView section={s} />
          </div>
        ))}
      </div>

      {ch.keyPoints.length ? (
        <section className="block" id="keypoints">
          <h2>◆ Key points — draw these from memory</h2>
          <div className="keypoints">
            {ch.keyPoints.map((k, i) => (
              <div className="kp" key={i}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span>{k}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {ch.pitfalls.length ? (
        <section className="block" id="pitfalls">
          <h2>▲ Senior pitfalls</h2>
          {ch.pitfalls.map((p, i) => (
            <div className="pitfall" key={i}>
              <div className="pt">{p.title}</div>
              <p>{p.body}</p>
            </div>
          ))}
        </section>
      ) : null}

      {ch.interview.length ? (
        <section className="block" id="interview">
          <h2>? Interview questions</h2>
          {ch.interview.map((qa, i) => (
            <details className="qa" key={i}>
              <summary>
                <span className="qmark">Q</span>
                <span>{qa.q}</span>
                {qa.level ? <span className="lvl">{qa.level}</span> : null}
              </summary>
              <div className="ans">{qa.a}</div>
            </details>
          ))}
        </section>
      ) : null}

      {ch.seeAlso.length ? (
        <section className="block">
          <h2>↔ See also</h2>
          <div className="seealso">
            {ch.seeAlso.map((sid) => {
              const t = CHAPTER_BY_ID[sid];
              return (
                <a key={sid} href={hrefFor(sid)}>
                  {t ? t.title : sid}
                </a>
              );
            })}
          </div>
        </section>
      ) : null}

      {ch.sources.length ? (
        <section className="block">
          <h2>Sources</h2>
          <ul className="sources">
            {ch.sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav className="prevnext">
        {prev ? (
          <button className="pn" onClick={() => go(prev.link ?? "/chapter/" + prev.id)}>
            <div className="dir">← Previous</div>
            <div className="t">{prev.title}</div>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button className="pn next" onClick={() => go(next.link ?? "/chapter/" + next.id)}>
            <div className="dir">Next →</div>
            <div className="t">{next.title}</div>
          </button>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
