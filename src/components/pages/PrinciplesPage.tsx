/* CHANGED: S17 — "Seven principles instead of a hundred facts". Data-driven from
   data/principles (the same source computes the "Built on principles" line on
   every chapter). Cards carry id="principle-N" anchors; chapter pages jump here
   via lib/pendingScroll (never href="#…", which would fight the hash router). */
import React, { useEffect } from "react";
import { PRINCIPLES, CIRCLED } from "../../data/principles";
import { CHAPTER_BY_ID, GROUPS } from "../../data/concepts";
import { Md } from "../chapter/Md";
import { consumePendingScroll } from "../../lib/pendingScroll";
import "./principles.css";

export function PrinciplesPage(): React.ReactElement {
  useEffect(consumePendingScroll, []);

  return (
    <div className="page principles">
      <h1>Seven principles instead of a hundred facts</h1>
      <p className="lead">
        The 21 chapters are consequences of a few rules. Learn the rules and an unfamiliar question
        becomes a chain you can reason through.
      </p>

      <div className="callout senior pr-howto">
        <div className="ttl">How to use: reason from the principle out loud</div>
        <div className="prose">
          <Md md={"Name the principle first, then walk its consequences out loud: \"One thread runs my JS, **therefore** this 200 ms `JSON.parse` stalls every request, **therefore** p99 rises everywhere, **therefore** I stream it or move it to a worker.\" Then check yourself against the questions under each card: cover the chapter, derive the answer, open the chapter only to confirm."} />
        </div>
      </div>

      <div className="pr-list">
        {PRINCIPLES.map((p) => (
          <article className="pr-card" key={p.id} id={"principle-" + p.n} aria-labelledby={"pr-h-" + p.n}>
            <div className="pr-head">
              <span className="pr-num" aria-hidden="true">
                {CIRCLED[p.n]}
              </span>
              <div>
                <div className="pr-kicker">Principle {p.n}</div>
                <h2 id={"pr-h-" + p.n}>{p.title}</h2>
              </div>
            </div>
            <div className="pr-line prose">
              <Md md={p.line} />
            </div>

            <div className="pr-cols">
              <div>
                <div className="pr-lbl">Therefore…</div>
                <ul className="pr-therefore">
                  {p.therefore.map((t, i) => (
                    <li key={i}>
                      <Md md={t} />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="pr-lbl">Derive these answers</div>
                <ul className="pr-questions">
                  {p.questions.map((q, i) => (
                    <li key={i}>
                      <Md md={q} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pr-chapters" aria-label={"Chapters built on principle " + p.n}>
              {p.chapters.map((cid) => {
                const c = CHAPTER_BY_ID[cid];
                const g = GROUPS.find((x) => x.id === c?.group);
                return (
                  <a key={cid} href={"#/chapter/" + cid} className="pr-chip">
                    <span className="sb-dot" style={{ background: g?.accent }} aria-hidden="true" />
                    {c ? c.title : cid}
                  </a>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
