import React, { useMemo, useState } from "react";
import { INTERVIEW, INTERVIEW_TOPICS } from "../../data/interview";
import { CHAPTER_BY_ID } from "../../data/concepts";
import { go } from "../../lib/hashRouter";
import { cx } from "../../lib/utils";

type Level = "all" | "senior" | "staff";

export function InterviewPage(): React.ReactElement {
  const [topic, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("all");

  const items = useMemo(
    () =>
      INTERVIEW.filter(
        (i) => (!topic || i.topic === topic) && (level === "all" || i.level === level),
      ),
    [topic, level],
  );

  return (
    <div className="page">
      <h1>Senior / Staff interview bank</h1>
      <p className="lead">
        {INTERVIEW.length} questions today (growing to 40 in a later session). Filter by topic and
        level; expand to reveal the answer, or jump to the chapter.
      </p>

      <div className="filters">
        <button className={cx("fbtn", !topic && "on")} onClick={() => setTopic(null)}>
          All topics
        </button>
        {INTERVIEW_TOPICS.map((t) => (
          <button key={t} className={cx("fbtn", topic === t && "on")} onClick={() => setTopic(t)}>
            {t}
          </button>
        ))}
        <span className="filters-sep" />
        {(["all", "senior", "staff"] as Level[]).map((l) => (
          <button key={l} className={cx("fbtn", level === l && "on")} onClick={() => setLevel(l)}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 18 }}>
        {items.map((qa) => (
          <details className="qa" key={qa.id}>
            <summary>
              <span className="qmark">Q</span>
              <span>{qa.q}</span>
              <span className="lvl">{qa.level}</span>
            </summary>
            <div className="ans">
              <p style={{ margin: "0 0 10px" }}>{qa.a}</p>
              <button
                className="btn"
                onClick={() => go("/chapter/" + qa.chapter)}
                style={{ fontSize: 12, padding: "5px 11px" }}
              >
                {CHAPTER_BY_ID[qa.chapter]?.title ?? "Open"} →
              </button>
            </div>
          </details>
        ))}
        {items.length === 0 ? <p className="lead">No questions match that filter.</p> : null}
      </div>
    </div>
  );
}
