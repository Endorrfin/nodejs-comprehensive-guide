/* CHANGED: S17 — the glossary: every term the guide leans on, A–Z.
   Data-driven from data/glossary. Each entry carries id="term-<slug>" (ids
   only — no href="#term-…", which would fight the hash router; jumps go
   through lib/pendingScroll). Part filter (like the atlas) + local search;
   the A–Z rail jumps to letter headings. */
import React, { useEffect, useMemo, useState } from "react";
import { GLOSSARY, termSlug, termLetter, sortKey, type Term } from "../../data/glossary";
import { CIRCLED, PRINCIPLES } from "../../data/principles";
import { CHAPTER_BY_ID, GROUPS } from "../../data/concepts";
import { ANALOGIES } from "../../data/analogies";
import { Md } from "../chapter/Md";
import { consumePendingScroll, jumpTo, setPendingScroll } from "../../lib/pendingScroll";
import { cx } from "../../lib/utils";
import "./glossary.css";

const SORTED: Term[] = [...GLOSSARY].sort((a, b) => sortKey(a.term).localeCompare(sortKey(b.term)));
const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const groupOf = (t: Term): string => CHAPTER_BY_ID[t.chapter]?.group ?? "mastery";

function matches(t: Term, q: string): boolean {
  if (!q) return true;
  return [t.term, ...(t.aka ?? []), t.def].join(" ").toLowerCase().includes(q);
}

function Entry({ t, onSee }: { t: Term; onSee: (term: string) => void }): React.ReactElement {
  const ch = CHAPTER_BY_ID[t.chapter];
  const g = GROUPS.find((x) => x.id === ch?.group);
  const p = t.principle ? PRINCIPLES.find((x) => x.n === t.principle) : undefined;
  return (
    <div className="gl-entry" id={"term-" + termSlug(t.term)}>
      <dt>
        <span className="gl-term">{t.term}</span>
        {t.aka?.length ? <span className="gl-aka">aka {t.aka.join(" · ")}</span> : null}
      </dt>
      <dd>
        <div className="gl-def prose">
          <Md md={t.def} />
        </div>
        <div className="gl-meta">
          <a className="gl-ch" href={"#/chapter/" + t.chapter}>
            <span className="sb-dot" style={{ background: g?.accent }} aria-hidden="true" />
            Ch. {ch?.order} · {ch?.title ?? t.chapter}
          </a>
          {ANALOGIES[t.chapter] ? (
            <a href={"#/chapter/" + t.chapter} onClick={() => setPendingScroll("analogy")}>
              ◎ Analogy
            </a>
          ) : null}
          {p ? (
            <a
              href="#/principles"
              title={p.title}
              aria-label={"Principle " + p.n + ": " + p.title}
              onClick={() => setPendingScroll("principle-" + p.n)}
            >
              {CIRCLED[p.n]} Principle
            </a>
          ) : null}
          {t.seeAlso?.length ? (
            <span className="gl-see">
              see also{" "}
              {t.seeAlso.map((s, i) => (
                <React.Fragment key={s}>
                  {i ? ", " : null}
                  <button type="button" className="gl-seebtn" onClick={() => onSee(s)}>
                    {s}
                  </button>
                </React.Fragment>
              ))}
            </span>
          ) : null}
        </div>
      </dd>
    </div>
  );
}

export function GlossaryPage(): React.ReactElement {
  const [group, setGroup] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [jump, setJump] = useState<string | null>(null);
  useEffect(consumePendingScroll, []);

  const needle = q.trim().toLowerCase();
  const items = useMemo(
    () => SORTED.filter((t) => (!group || groupOf(t) === group) && matches(t, needle)),
    [group, needle],
  );
  const byLetter = useMemo(() => {
    const m = new Map<string, Term[]>();
    for (const t of items) {
      const l = termLetter(t.term);
      m.set(l, [...(m.get(l) ?? []), t]);
    }
    return m;
  }, [items]);

  // a see-also target may be filtered out: clear filters, then jump after the re-render
  useEffect(() => {
    if (!jump) return;
    jumpTo(jump);
    setJump(null);
  }, [jump, items]);
  const onSee = (term: string): void => {
    setGroup(null);
    setQ("");
    setJump("term-" + termSlug(term));
  };

  return (
    <div className="page glossary">
      <h1>Glossary</h1>
      <p className="lead">
        Every term the guide leans on, in one or two sentences — each linked to the chapter that
        explains it, its real-life analogy and the principle it falls out of.
      </p>

      <div className="gl-controls">
        <input
          type="search"
          className="gl-search"
          placeholder="Filter terms…"
          aria-label="Filter glossary terms"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="filters" role="group" aria-label="Filter terms by part">
          <button className={cx("fbtn", !group && "on")} onClick={() => setGroup(null)}>
            All ({GLOSSARY.length})
          </button>
          {GROUPS.map((g) => (
            <button key={g.id} className={cx("fbtn", group === g.id && "on")} onClick={() => setGroup(g.id)}>
              {g.name} ({GLOSSARY.filter((t) => groupOf(t) === g.id).length})
            </button>
          ))}
        </div>
      </div>

      <nav className="gl-rail" aria-label="Jump to letter">
        {LETTERS.map((l) =>
          byLetter.has(l) ? (
            <button key={l} type="button" onClick={() => jumpTo("letter-" + (l === "#" ? "sym" : l))}>
              {l}
            </button>
          ) : (
            <span key={l} aria-hidden="true">
              {l}
            </span>
          ),
        )}
      </nav>

      {items.length === 0 ? <p className="prose gl-empty">No terms match.</p> : null}

      {LETTERS.filter((l) => byLetter.has(l)).map((l) => (
        <section key={l} className="gl-letter" id={"letter-" + (l === "#" ? "sym" : l)}>
          <h2>{l === "#" ? "# · symbols & flags" : l}</h2>
          <dl>
            {byLetter.get(l)!.map((t) => (
              <Entry key={t.term} t={t} onSee={onSee} />
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
