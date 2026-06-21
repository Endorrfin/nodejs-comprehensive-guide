import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterDeck, shuffle, SOURCE_LABEL, type Flashcard, type SourceFilter } from "../../lib/flashcards";
import { CHAPTER_BY_ID, GROUPS } from "../../data/concepts";
import { go } from "../../lib/hashRouter";
import { cx } from "../../lib/utils";
import "./flashcards.css";

export function FlashcardsPage(): React.ReactElement {
  const [group, setGroup] = useState<string | null>(null);
  const [source, setSource] = useState<SourceFilter>("all");

  const [queue, setQueue] = useState<Flashcard[]>(() => shuffle(filterDeck(null, "all")));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [got, setGot] = useState(0);
  const [again, setAgain] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null); // CHANGED: focus target for keyboard shortcuts

  const groupsPresent = useMemo(() => {
    const ids = new Set(filterDeck(null, "all").map((c) => c.group));
    return GROUPS.filter((g) => ids.has(g.id));
  }, []);

  const newRound = useCallback((g: string | null, s: SourceFilter) => {
    setQueue(shuffle(filterDeck(g, s)));
    setPos(0);
    setFlipped(false);
    setGot(0);
    setAgain(0);
  }, []);

  // rebuild when filters change
  useEffect(() => {
    newRound(group, source);
    // CHANGED: focus the deck so space / 1 / 2 work immediately, without first
    // clicking a card (preventScroll avoids jumping past the intro on load).
    deckRef.current?.focus({ preventScroll: true });
  }, [group, source, newRound]);

  const card = queue[pos];
  const done = pos >= queue.length;

  const grade = useCallback(
    (known: boolean) => {
      if (!card) return;
      if (known) setGot((n) => n + 1);
      else {
        setAgain((n) => n + 1);
        setQueue((q) => [...q, card]); // re-queue: a round repeats what you miss
      }
      setFlipped(false);
      setPos((p) => p + 1);
    },
    [card],
  );

  const prev = useCallback(() => {
    setPos((p) => Math.max(0, p - 1));
    setFlipped(false);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (done) return;
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setFlipped((f) => !f);
    } else if (flipped && (e.key === "1" || e.key.toLowerCase() === "a")) {
      grade(false);
    } else if (flipped && (e.key === "2" || e.key.toLowerCase() === "g")) {
      grade(true);
    } else if (e.key === "ArrowLeft") {
      prev();
    }
  };

  const chapter = card ? CHAPTER_BY_ID[card.chapter] : undefined;
  const cgroup = card ? GROUPS.find((g) => g.id === card.group) : undefined;

  return (
    <div className="page">
      <h1>Flashcards</h1>
      <p className="lead">
        Active recall over the {filterDeck(null, "all").length} cards drawn from the mental models and the
        interview bank. Reveal, then grade yourself — cards you mark <b>Again</b> come back later in the round.
      </p>

      <div className="fc-filters">
        <div className="filters" role="group" aria-label="Filter by part">
          <button className={cx("fbtn", !group && "on")} onClick={() => setGroup(null)}>
            All parts
          </button>
          {groupsPresent.map((g) => (
            <button key={g.id} className={cx("fbtn", group === g.id && "on")} onClick={() => setGroup(g.id)}>
              {g.name}
            </button>
          ))}
        </div>
        <div className="filters" role="group" aria-label="Filter by card type">
          {(["all", "model", "interview"] as SourceFilter[]).map((s) => (
            <button key={s} className={cx("fbtn", source === s && "on")} onClick={() => setSource(s)}>
              {s === "all" ? "All cards" : SOURCE_LABEL[s as "model" | "interview"]}
            </button>
          ))}
        </div>
      </div>

      {/* deck */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div ref={deckRef} className="fc-deck" tabIndex={0} onKeyDown={onKeyDown} aria-label="Flashcard deck. Press space to flip, 1 for again, 2 for got it.">
        {done ? (
          <div className="fc-done" aria-live="polite">
            <div className="fc-done-ttl">Round complete</div>
            <p>
              You reviewed <b>{got + again}</b> cards — <b style={{ color: "var(--accent-bright)" }}>{got} got it</b>,{" "}
              <b style={{ color: "var(--sem-pool)" }}>{again} need another look</b>.
            </p>
            <div className="fc-done-actions">
              <button className="btn primary" onClick={() => newRound(group, source)}>
                ↻ Shuffle & restart
              </button>
              <button className="btn" onClick={() => go("/mental-models")}>
                Mental models →
              </button>
            </div>
          </div>
        ) : card ? (
          <>
            <div className="fc-card" onClick={() => setFlipped((f) => !f)}>
              <div className="fc-chip-row">
                <span className="fc-chip" style={{ borderColor: cgroup?.accent }}>
                  <span className="sb-dot" style={{ background: cgroup?.accent }} aria-hidden="true" />
                  {chapter?.title ?? card.chapter}
                </span>
                <span className="fc-src">
                  {SOURCE_LABEL[card.source]}
                  {card.level ? ` · ${card.level}` : ""}
                </span>
              </div>

              <div className="fc-front" aria-live="polite">{card.front}</div>

              {flipped ? (
                <div className="fc-back">{card.back}</div>
              ) : (
                <div className="fc-hint">Recall the answer, then reveal.</div>
              )}
            </div>

            {/* controls */}
            <div className="fc-controls">
              <button className="btn" onClick={prev} disabled={pos === 0} aria-label="Previous card">
                ← Prev
              </button>
              <button className="btn primary fc-flip" aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>
                {flipped ? "Hide" : "Show answer"} <span className="fc-key">space</span>
              </button>
              <span className="fc-spacer" />
              <button className="btn fc-again" onClick={() => grade(false)} disabled={!flipped} aria-label="Mark again">
                Again <span className="fc-key">1</span>
              </button>
              <button className="btn fc-got" onClick={() => grade(true)} disabled={!flipped} aria-label="Mark got it">
                Got it <span className="fc-key">2</span>
              </button>
            </div>

            <div className="fc-progress">
              <div className="fc-bar">
                <div className="fc-bar-fill" style={{ width: `${queue.length ? (pos / queue.length) * 100 : 0}%` }} />
              </div>
              <span className="fc-count">
                {pos + 1} / {queue.length} · <b style={{ color: "var(--accent-bright)" }}>{got}</b> got ·{" "}
                <b style={{ color: "var(--sem-pool)" }}>{again}</b> again
              </span>
            </div>
          </>
        ) : (
          <p className="lead">No cards match that filter.</p>
        )}
      </div>
    </div>
  );
}
