import React from "react";
import type { Section as Sec } from "../../data/concepts";
import { Md } from "./Md";
import { SIMS, FIGURES } from "../../lib/registry";

const CALLOUT_ICON: Record<string, string> = { tip: "✓", warn: "▲", senior: "★" };
const CALLOUT_WORD: Record<string, string> = { tip: "Tip", warn: "Watch out", senior: "Senior note" };

export function SectionView({ section }: { section: Sec }): React.ReactElement {
  switch (section.kind) {
    case "prose":
      return (
        <div className="prose section">
          <Md md={section.md} />
        </div>
      );

    case "callout":
      return (
        <div className={`callout ${section.tone}`}>
          <div className="ttl">
            <span className="ico" aria-hidden="true">
              {CALLOUT_ICON[section.tone]}
            </span>
            {section.title || CALLOUT_WORD[section.tone]}
          </div>
          <div className="prose">
            <Md md={section.md} />
          </div>
        </div>
      );

    case "code":
      return (
        <div className="code">
          <div className="code-head">
            <span className="dot" aria-hidden="true" />
            {section.lang}
          </div>
          <pre>
            <code>{section.code}</code>
          </pre>
          {section.note ? <div className="note">{section.note}</div> : null}
        </div>
      );

    case "table":
      return (
        <figure className="section" style={{ margin: "18px 0" }}>
          <div className="tbl-wrap">
            <table className="data">
              <thead>
                <tr>
                  {section.head.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.caption ? <figcaption className="tbl-cap">{section.caption}</figcaption> : null}
        </figure>
      );

    case "compare":
      return (
        <div className="compare section">
          <div className="head">{section.a}</div>
          <div className="head b">{section.b}</div>
          {section.rows.map((r, i) => (
            <React.Fragment key={i}>
              <div className="cell" style={{ gridColumn: "1 / -1", color: "var(--tx3)", fontSize: 11, paddingBottom: 2 }}>
                {r[0]}
              </div>
              <div className="cell">{r[1]}</div>
              <div className="cell b">{r[2]}</div>
            </React.Fragment>
          ))}
        </div>
      );

    case "figure": {
      const Fig = FIGURES[section.fig];
      return (
        <figure className="section" style={{ margin: "20px 0" }}>
          <div className="figure">{Fig ? <Fig /> : <em>figure: {section.fig}</em>}</div>
          {section.caption ? <figcaption className="fig-cap">{section.caption}</figcaption> : null}
        </figure>
      );
    }

    case "sim": {
      const Sim = SIMS[section.sim];
      return <div className="section">{Sim ? <Sim /> : <em>simulator: {section.sim}</em>}</div>;
    }
  }
}
