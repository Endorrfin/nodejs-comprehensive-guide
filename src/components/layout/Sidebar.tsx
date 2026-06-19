import React from "react";
import { GROUPS, chaptersInGroup } from "../../data/concepts";
import { go } from "../../lib/hashRouter";
import { cx } from "../../lib/utils";

export function Sidebar({ activeId }: { activeId: string | null }): React.ReactElement {
  return (
    <nav className="sidebar" aria-label="Chapters">
      {GROUPS.map((g) => (
        <div className="sb-group" key={g.id}>
          <div className="sb-group-name">
            <span className="sb-dot" style={{ background: g.accent }} aria-hidden="true" />
            {g.name}
          </div>
          {chaptersInGroup(g.id).map((c) => (
            <button
              key={c.id}
              className={cx("sb-link", activeId === c.id && "on")}
              onClick={() => go(c.link ?? "/chapter/" + c.id)}
              aria-current={activeId === c.id ? "page" : undefined}
            >
              <span className="sb-num">{String(c.order).padStart(2, "0")}</span>
              <span>{c.title}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}
