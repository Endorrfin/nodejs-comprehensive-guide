import React, { useMemo, useRef, useState } from "react";
import type { Route } from "../../lib/hashRouter";
import { go } from "../../lib/hashRouter";
import { search, KIND_LABEL, type SearchHit } from "../../lib/search";
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

const KIND_COLOR: Record<SearchHit["kind"], string> = {
  chapter: "var(--accent)",
  qa: "var(--sem-micro)",
  model: "var(--sem-timer)",
};

function SearchBox(): React.ReactElement {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);

  const results = useMemo<SearchHit[]>(() => search(q, 8), [q]);

  const choose = (h: SearchHit): void => {
    setQ("");
    setOpen(false);
    go(h.to);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      const hit = results[active] ?? results[0];
      if (hit) choose(hit);
    } else if (e.key === "Escape") {
      setQ("");
      setOpen(false);
    }
  };

  return (
    <div className="search-wrap" ref={boxRef} style={{ position: "relative" }}>
      <div className="search">
        <span aria-hidden="true" style={{ color: "var(--tx3)" }}>
          ⌕
        </span>
        <input
          type="search"
          placeholder="Search concepts, Q&A, models…"
          aria-label="Search the guide"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-listbox"
          aria-activedescendant={open && results.length ? `search-opt-${active}` : undefined}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={onKeyDown}
        />
      </div>
      {open && results.length > 0 ? (
        <ul className="search-results" role="listbox" id="search-listbox">
          {results.map((h, i) => (
            <li key={h.kind + h.to + i} role="option" id={`search-opt-${i}`} aria-selected={i === active}>
              <button
                onMouseDown={() => choose(h)}
                onMouseEnter={() => setActive(i)}
                style={{ display: "flex", alignItems: "center", ...(i === active ? { background: "var(--s3)" } : null) }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 8.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: KIND_COLOR[h.kind],
                    border: "1px solid currentColor",
                    borderRadius: 999,
                    padding: "1px 6px",
                    marginRight: 9,
                    flexShrink: 0,
                  }}
                >
                  {KIND_LABEL[h.kind]}
                </span>
                <span style={{ minWidth: 0, display: "flex", flexDirection: "column" }}>
                  <span className="sr-title" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {h.title}
                  </span>
                  <span className="sr-tag">{h.sub}</span>
                </span>
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
          <a href="#/flashcards" className={cx(route.name === "flashcards" && "on")}>
            Flashcards
          </a>
        </nav>

        <SearchBox />
      </div>
    </header>
  );
}
