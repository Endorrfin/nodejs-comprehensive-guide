import React, { useMemo, useRef, useState } from "react";
import type { Route } from "../../lib/hashRouter";
import { go } from "../../lib/hashRouter";
import { CHAPTERS, type Chapter } from "../../data/concepts";
import { cx } from "../../lib/utils";

function Logo(): React.ReactElement {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 4.2 L26.2 10.1 L26.2 21.9 L16 27.8 L5.8 21.9 L5.8 10.1 Z" fill="#6CC24A" />
      <path d="M16 9.1 L21.95 12.55 L21.95 19.45 L16 22.9 L10.05 19.45 L10.05 12.55 Z" fill="#0A0C0A" />
      <circle cx="16" cy="16" r="2.4" fill="#4ADE80" />
    </svg>
  );
}

function SearchBox(): React.ReactElement {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo<Chapter[]>(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return CHAPTERS.filter(
      (c) =>
        c.title.toLowerCase().includes(t) ||
        c.tagline.toLowerCase().includes(t) ||
        c.keyPoints.some((k) => k.toLowerCase().includes(t)),
    ).slice(0, 7);
  }, [q]);

  const choose = (c: Chapter): void => {
    setQ("");
    setOpen(false);
    go(c.link ?? "/chapter/" + c.id);
  };

  return (
    <div className="search-wrap" ref={boxRef} style={{ position: "relative" }}>
      <div className="search">
        <span aria-hidden="true" style={{ color: "var(--tx3)" }}>
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search concepts…"
          aria-label="Search concepts"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results[0]) choose(results[0]);
            if (e.key === "Escape") {
              setQ("");
              setOpen(false);
            }
          }}
        />
      </div>
      {open && results.length > 0 ? (
        <ul className="search-results" role="listbox">
          {results.map((c) => (
            <li key={c.id}>
              <button onMouseDown={() => choose(c)}>
                <span className="sr-title">{c.title}</span>
                <span className="sr-tag">{c.tagline}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function TopBar({ route }: { route: Route }): React.ReactElement {
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <button className="brand" onClick={() => go("/map")} aria-label="Home — concept map">
          <Logo />
          <span>
            <span className="brand-title">
              Node.js <b>Comprehensive Guide</b>
            </span>
            <span className="brand-sub">senior / staff · interactive deep-dive</span>
          </span>
        </button>

        <nav className="nav" aria-label="Primary">
          <a href="#/map" className={cx(route.name === "map" && "on")}>
            Map
          </a>
          <a href="#/interview" className={cx(route.name === "interview" && "on")}>
            Interview
          </a>
          <a href="#/mental-models" className={cx(route.name === "mental-models" && "on")}>
            Mental models
          </a>
        </nav>

        <SearchBox />
      </div>
    </header>
  );
}
