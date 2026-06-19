import React, { useState } from "react";
import { MODELS, type ModelCard } from "../../data/mentalModels";
import { CHAPTER_BY_ID } from "../../data/concepts";
import { go } from "../../lib/hashRouter";

function Card({ m }: { m: ModelCard }): React.ReactElement {
  const [show, setShow] = useState(false);
  return (
    <div className="mm-card">
      <div className="mm-head">{m.title}</div>
      <div className="mm-q">{m.prompt}</div>
      {show ? <div className="mm-a">{m.answer}</div> : <div className="mm-hidden">Answer hidden — draw it first.</div>}
      <div className="mm-actions">
        <button className="btn primary" onClick={() => setShow((s) => !s)} style={{ fontSize: 12 }}>
          {show ? "Hide" : "Reveal"}
        </button>
        <button className="btn" onClick={() => go("/chapter/" + m.chapter)} style={{ fontSize: 12 }}>
          {CHAPTER_BY_ID[m.chapter]?.title ?? "Open"} →
        </button>
      </div>
    </div>
  );
}

export function MentalModelsPage(): React.ReactElement {
  return (
    <div className="page">
      <h1>Mental models</h1>
      <p className="lead">
        The pictures you must be able to draw from memory. Read the prompt, sketch the answer, then
        reveal to check. Repeat until it's automatic.
      </p>
      <div className="mm-grid">
        {MODELS.map((m) => (
          <Card key={m.id} m={m} />
        ))}
      </div>
    </div>
  );
}
