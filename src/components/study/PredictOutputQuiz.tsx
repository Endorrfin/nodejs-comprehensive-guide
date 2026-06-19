import React, { useMemo, useState } from "react";
import type { QuizQuestion } from "../../data/quizzes";
import "./quiz.css";

/* Reusable "predict the output" quiz engine. Data-driven and chapter-agnostic:
   pass any QuizQuestion[]. Register a concrete instance as a sim in
   lib/registry.tsx to embed it in a chapter via { kind:'sim' }. */

export interface PredictOutputQuizProps {
  questions: QuizQuestion[];
  title?: string;
  intro?: string;
}

function Order({ lines, tone }: { lines: string[]; tone?: "ok" | "no" | null }): React.ReactElement {
  return (
    <span className="pq-order">
      {lines.map((l, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <span className="pq-arrow">›</span> : null}
          <span className={"pq-tok" + (tone ? " " + tone : "")}>{l}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

export function PredictOutputQuiz({ questions, title, intro }: PredictOutputQuizProps): React.ReactElement {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [scored, setScored] = useState<Record<string, boolean>>({});

  const q = questions[idx];
  const answered = picked !== null;
  const correct = answered && picked === q.correct;
  const total = questions.length;
  const done = Object.keys(scored).length;
  const right = useMemo(() => Object.values(scored).filter(Boolean).length, [scored]);

  const choose = (i: number): void => {
    if (answered) return;
    setPicked(i);
    setScored((s) => (q.id in s ? s : { ...s, [q.id]: i === q.correct }));
  };

  const go = (next: number): void => {
    setIdx(next);
    setPicked(null);
  };

  const reset = (): void => {
    setIdx(0);
    setPicked(null);
    setScored({});
  };

  return (
    <div className="pq" aria-label="Predict the output quiz">
      <div className="pq-head">
        <div className="pq-titles">
          <span className="pq-kicker">{title ?? "Predict the output"}</span>
          {intro ? <span className="pq-intro">{intro}</span> : null}
        </div>
        <div className="pq-meta">
          <span className="pq-count">
            {idx + 1}/{total}
          </span>
          <span className="pq-score" title="Correct so far">
            score {right}/{done}
          </span>
        </div>
      </div>

      <div className="pq-card">
        <div className="pq-qrow">
          <span className="pq-q">Q{idx + 1}</span>
          {q.level ? <span className="pq-lvl">{q.level}</span> : null}
          <span className="pq-ask">What does this print?</span>
        </div>
        {q.prompt ? <p className="pq-prompt">{q.prompt}</p> : null}

        <pre className="pq-code">
          <code>{q.code}</code>
        </pre>

        <div className="pq-choices" role="listbox" aria-label="Answer choices">
          {q.choices.map((choice, i) => {
            const isPicked = picked === i;
            const isAnswer = i === q.correct;
            const tone = !answered ? null : isAnswer ? "ok" : isPicked ? "no" : null;
            return (
              <button
                key={i}
                role="option"
                aria-selected={isPicked}
                className={
                  "pq-choice" +
                  (answered && isAnswer ? " ok" : "") +
                  (answered && isPicked && !isAnswer ? " no" : "") +
                  (answered ? " locked" : "")
                }
                onClick={() => choose(i)}
                disabled={answered}
              >
                <span className="pq-mark" aria-hidden="true">
                  {answered && isAnswer ? "✓" : answered && isPicked ? "✕" : String.fromCharCode(65 + i)}
                </span>
                <Order lines={choice} tone={tone} />
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className={"pq-explain " + (correct ? "ok" : "no")}>
            <div className="pq-verdict">{correct ? "✓ Correct" : "✕ Not quite"}</div>
            <p>{q.explain}</p>
          </div>
        ) : (
          <p className="pq-hint">Pick the exact console output order. The answer reveals on click.</p>
        )}
      </div>

      <div className="pq-controls">
        <button className="btn" onClick={() => go(Math.max(0, idx - 1))} disabled={idx === 0}>
          ◀ Prev
        </button>
        {idx < total - 1 ? (
          <button className="btn primary" onClick={() => go(idx + 1)}>
            Next ▶
          </button>
        ) : (
          <button className="btn" onClick={reset}>
            ⤺ Restart
          </button>
        )}
        {done === total ? (
          <span className="pq-final">
            Final: {right}/{total} {right === total ? "— flawless. You can read the queue." : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}
