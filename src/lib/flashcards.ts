/* The flashcard deck (study/) — a unified active-recall deck assembled from the
   mental-models gallery (prompt → answer) and the interview bank (question →
   answer). Group is derived from each card's chapter so the deck filters the
   same way as the rest of the guide. No new content to maintain: the deck IS the
   gallery + the bank, re-shaped for spaced practice. */
import { MODELS } from "../data/mentalModels";
import { INTERVIEW } from "../data/interview";
import { CHAPTER_BY_ID } from "../data/concepts";
import { PRINCIPLES } from "../data/principles"; // CHANGED: S17
import { GLOSSARY } from "../data/glossary"; // CHANGED: S17

export type CardSource = "model" | "interview" | "principle" | "term"; // CHANGED: S17

export interface Flashcard {
  id: string;
  front: string; // prompt / question
  back: string; // the recap to check against
  chapter: string;
  group: string;
  source: CardSource;
  level?: "senior" | "staff";
}

const groupOf = (chapter: string): string => CHAPTER_BY_ID[chapter]?.group ?? "mastery";

// CHANGED: S17 — cards render plain text; drop inline-md markers from data written as md
const plain = (md: string): string => md.replace(/\*\*|`/g, "").replace(/(^|[^\w])\*([^*]+)\*/g, "$1$2");

export const DECK: Flashcard[] = [
  ...MODELS.map((m) => ({
    id: "m-" + m.id,
    front: m.prompt,
    back: m.answer,
    chapter: m.chapter,
    group: groupOf(m.chapter),
    source: "model" as const,
  })),
  ...INTERVIEW.map((q) => ({
    id: "q-" + q.id,
    front: q.q,
    back: q.a,
    chapter: q.chapter,
    group: groupOf(q.chapter),
    source: "interview" as const,
    level: q.level,
  })),
  // CHANGED: S17 — principles (state it, then derive the consequences) + glossary terms
  ...PRINCIPLES.map((p) => ({
    id: "p-" + p.id,
    front: "Principle " + p.n + ": " + p.title + " — so what follows?",
    back: plain(p.line) + "\n\nTherefore:\n" + p.therefore.map((t) => "• " + plain(t)).join("\n"),
    chapter: p.chapters[0],
    group: groupOf(p.chapters[0]),
    source: "principle" as const,
  })),
  ...GLOSSARY.map((t) => ({
    id: "t-" + t.term,
    front: "Define: " + t.term + (t.aka?.length ? " (" + t.aka.join(", ") + ")" : ""),
    back: plain(t.def),
    chapter: t.chapter,
    group: groupOf(t.chapter),
    source: "term" as const,
  })),
];

export type SourceFilter = "all" | CardSource;

// CHANGED: S17 — "all" = models + interview + principles; the ~160 glossary cards
// would swamp a round, so they are only dealt under their own "term" filter.
export function filterDeck(group: string | null, source: SourceFilter): Flashcard[] {
  return DECK.filter(
    (c) => (!group || c.group === group) && (source === "all" ? c.source !== "term" : c.source === source),
  );
}

/** Fisher–Yates shuffle, returns a new array. */
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const SOURCE_LABEL: Record<CardSource, string> = {
  model: "Mental model",
  interview: "Interview Q",
  principle: "Principle", // CHANGED: S17
  term: "Glossary", // CHANGED: S17
};
