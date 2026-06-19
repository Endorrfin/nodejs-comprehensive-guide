import React, { useMemo, useState } from "react";
import { MODELS, type ModelCard } from "../../data/mentalModels";
import { CHAPTER_BY_ID, GROUPS } from "../../data/concepts";
import { FIGURES } from "../../lib/registry";
import { go } from "../../lib/hashRouter";
import { cx } from "../../lib/utils";
import "./mentalModels.css";

function Card({ m }: { m: ModelCard }): React.ReactElement {
  const [show, setShow] = useState(false);
  const chapter = CHAPTER_BY_ID[m.chapter];
  const group = chapter ? GROUPS.find((g) => g.id === chapter.group) : undefined;
  const Fig = m.figure ? FIGURES[m.figure] : undefined;

  return (
    <div className="mm-card">
      <div className="mm-chip">
        <span className="sb-dot" style={{ background: group?.accent }} aria-hidden="true" />
        {group?.name ?? m.chapter}
      </div>
      <div className="mm-head">{m.title}</div>
      <div className="mm-q">{m.prompt}</div>

      {show ? (
        <>
          {Fig ? (
            <div className="mm-fig">
              <Fig />
            </div>
          ) : null}
          <div className="mm-a">{m.answer}</div>
        </>
      ) : (
        <div className="mm-hidden">Answer hidden — sketch it first.</div>
      )}

      <div className="mm-actions">
        <button
          className="btn primary"
          aria-expanded={show}
          onClick={() => setShow((s) => !s)}
          style={{ fontSize: 12 }}
        >
          {show ? "Hide" : "Reveal"}
        </button>
        <button className="btn" onClick={() => go(chapter?.link ?? "/chapter/" + m.chapter)} style={{ fontSize: 12 }}>
          {chapter?.title ?? "Open"} →
        </button>
      </div>
    </div>
  );
}

export function MentalModelsPage(): React.ReactElement {
  const [group, setGroup] = useState<string | null>(null);

  const groupsPresent = useMemo(() => {
    const ids = new Set(MODELS.map((m) => CHAPTER_BY_ID[m.chapter]?.group).filter(Boolean) as string[]);
    return GROUPS.filter((g) => ids.has(g.id));
  }, []);

  const items = useMemo(
    () => MODELS.filter((m) => !group || CHAPTER_BY_ID[m.chapter]?.group === group),
    [group],
  );

  return (
    <div className="page">
      <h1>Mental models</h1>
      <p className="lead">
        The {MODELS.length} pictures you must be able to draw from memory. Read the prompt, sketch the
        answer, then reveal the real diagram to check. Repeat until it's automatic.
      </p>

      <div className="filters" role="group" aria-label="Filter mental models by group">
        <button className={cx("fbtn", !group && "on")} onClick={() => setGroup(null)}>
          All ({MODELS.length})
        </button>
        {groupsPresent.map((g) => {
          const n = MODELS.filter((m) => CHAPTER_BY_ID[m.chapter]?.group === g.id).length;
          return (
            <button key={g.id} className={cx("fbtn", group === g.id && "on")} onClick={() => setGroup(g.id)}>
              {g.name} ({n})
            </button>
          );
        })}
      </div>

      <div className="mm-grid" style={{ marginTop: 18 }}>
        {items.map((m) => (
          <Card key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}
