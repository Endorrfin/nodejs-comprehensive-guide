/* CHANGED: S14 — the figure atlas: every diagram in the guide on one wall.
   Data-driven from lib/atlas (which derives owners/captions from concepts +
   mentalModels), components resolved via the FIGURES registry like everywhere
   else. Full-width like the Overview map. Each card links to its owning chapter
   and can export itself as a branded PNG poster (lib/exportPng). */
import React, { useMemo, useRef, useState } from "react";
import { ATLAS, filterAtlas, type AtlasEntry } from "../../lib/atlas";
import { GROUPS } from "../../data/concepts";
import { FIGURES } from "../../lib/registry";
import { exportFigurePng } from "../../lib/exportPng";
import { cx } from "../../lib/utils";
import "./atlas.css";

type ExportState = "idle" | "busy" | "err";
const EXPORT_LABEL: Record<ExportState, string> = {
  idle: "⤓ PNG",
  busy: "Rendering…",
  err: "Failed — retry",
};

function AtlasCard({ e }: { e: AtlasEntry }): React.ReactElement {
  const Fig = FIGURES[e.key];
  const group = GROUPS.find((g) => g.id === e.group);
  const figRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ExportState>("idle");

  const onExport = async (): Promise<void> => {
    const svg = figRef.current?.querySelector("svg");
    if (!svg || state === "busy") return;
    setState("busy");
    try {
      await exportFigurePng(svg, { key: e.key, title: e.title, chapterTitle: e.chapterTitle });
      setState("idle");
    } catch {
      setState("err");
    }
  };

  return (
    <article className="atlas-card">
      <a className="atlas-link" href={`#/chapter/${e.chapter}`}>
        <span className="atlas-chip">
          <span className="sb-dot" style={{ background: group?.accent }} aria-hidden="true" />
          Ch. {e.order} · {e.chapterTitle}
        </span>
        <span className="atlas-title">{e.title}</span>
        <span className="atlas-fig" ref={figRef}>
          {Fig ? <Fig /> : null}
        </span>
      </a>
      <div className="atlas-foot">
        <span className="atlas-caption">{e.caption ?? "From the mental-models gallery."}</span>
        <button
          className={cx("btn", state === "err" && "atlas-err")}
          onClick={onExport}
          disabled={state === "busy"}
          aria-label={`Export "${e.title}" as a PNG poster`}
        >
          {EXPORT_LABEL[state]}
        </button>
      </div>
    </article>
  );
}

export function AtlasPage(): React.ReactElement {
  const [group, setGroup] = useState<string | null>(null);
  const items = useMemo(() => filterAtlas(group), [group]);

  return (
    <div className="atlas-wrap">
      <div className="page" style={{ maxWidth: "none" }}>
        <h1>Figure atlas</h1>
        <p className="lead">
          All {ATLAS.length} diagrams of the guide on one wall. Filter by part, click any figure to
          open its chapter, or export it as a branded PNG poster — straight from the app.
        </p>

        <div className="filters" role="group" aria-label="Filter figures by part">
          <button className={cx("fbtn", !group && "on")} onClick={() => setGroup(null)}>
            All ({ATLAS.length})
          </button>
          {GROUPS.map((g) => (
            <button
              key={g.id}
              className={cx("fbtn", group === g.id && "on")}
              onClick={() => setGroup(g.id)}
            >
              {g.name} ({filterAtlas(g.id).length})
            </button>
          ))}
        </div>
      </div>

      <div className="atlas-grid">
        {items.map((e) => (
          <AtlasCard key={e.key} e={e} />
        ))}
      </div>
    </div>
  );
}
