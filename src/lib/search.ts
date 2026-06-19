/* Global search index. The TopBar search used to match only chapter
   titles/taglines/keyPoints; this indexes the deeper content too — section prose,
   callouts, tables, the interview bank and the mental-models gallery — and
   returns ranked, categorised hits. Built once at module load (all content is
   static), so lookups are a cheap substring scan over ~90 short entries. */
import { CHAPTERS, CHAPTER_BY_ID, type Section } from "../data/concepts";
import { INTERVIEW } from "../data/interview";
import { MODELS } from "../data/mentalModels";

export type SearchKind = "chapter" | "qa" | "model";

export interface SearchHit {
  kind: SearchKind;
  title: string;
  sub: string;
  to: string; // route path, e.g. "/chapter/event-loop"
  score: number;
}

const chapterLink = (id: string): string => CHAPTER_BY_ID[id]?.link ?? "/chapter/" + id;

function sectionText(s: Section): string {
  switch (s.kind) {
    case "prose":
      return s.md;
    case "figure":
      return s.caption ?? "";
    case "table":
      return [s.caption ?? "", ...s.head, ...s.rows.flat()].join(" ");
    case "code":
      return s.note ?? "";
    case "callout":
      return s.title + " " + s.md;
    case "compare":
      return s.a + " " + s.b + " " + s.rows.flat().join(" ");
    case "sim":
    default:
      return "";
  }
}

interface Entry {
  kind: SearchKind;
  title: string;
  sub: string;
  to: string;
  titleL: string;
  bodyL: string;
}

const ENTRIES: Entry[] = [
  ...CHAPTERS.map((c): Entry => ({
    kind: "chapter",
    title: c.title,
    sub: c.tagline,
    to: chapterLink(c.id),
    titleL: (c.title + " " + c.tagline).toLowerCase(),
    bodyL: (c.mentalModel + " " + c.keyPoints.join(" ") + " " + c.sections.map(sectionText).join(" ")).toLowerCase(),
  })),
  ...INTERVIEW.map((q): Entry => ({
    kind: "qa",
    title: q.q,
    sub: q.topic + " · " + q.level,
    to: chapterLink(q.chapter),
    titleL: q.q.toLowerCase(),
    bodyL: q.a.toLowerCase(),
  })),
  ...MODELS.map((m): Entry => ({
    kind: "model",
    title: m.title,
    sub: "Mental model · " + (CHAPTER_BY_ID[m.chapter]?.title ?? m.chapter),
    to: chapterLink(m.chapter),
    titleL: (m.title + " " + m.prompt).toLowerCase(),
    bodyL: m.answer.toLowerCase(),
  })),
];

export function search(raw: string, limit = 8): SearchHit[] {
  const t = raw.trim().toLowerCase();
  if (t.length < 2) return [];
  const hits: SearchHit[] = [];
  for (const e of ENTRIES) {
    let score = 0;
    if (e.titleL.includes(t)) score += e.titleL.startsWith(t) ? 5 : 3;
    if (e.bodyL.includes(t)) score += 1;
    // a small nudge so concept chapters surface above the many Q&A entries on ties
    if (score > 0 && e.kind === "chapter") score += 0.5;
    if (score > 0) hits.push({ kind: e.kind, title: e.title, sub: e.sub, to: e.to, score });
  }
  hits.sort((a, b) => b.score - a.score || a.title.length - b.title.length);
  return hits.slice(0, limit);
}

export const KIND_LABEL: Record<SearchKind, string> = {
  chapter: "Chapter",
  qa: "Q&A",
  model: "Model",
};
