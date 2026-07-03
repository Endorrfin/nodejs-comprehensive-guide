/* The figure atlas (S14) — a data-driven index of every diagram in the guide,
   assembled the same way as the flashcard deck: no new content to maintain.
   Owner resolution: a figure belongs to the first chapter whose body embeds it
   (kind:'figure' section, caption carried along); figures that live only in the
   mental-models gallery (microtask-ladder, jit-tiers) inherit their card's
   chapter. Pure data module — no JSX/registry import — so node
   --experimental-strip-types can test it (scripts/test-atlas.ts). */
import { CHAPTERS, CHAPTER_BY_ID } from "../data/concepts.ts";
import { MODELS } from "../data/mentalModels.ts";

export interface AtlasEntry {
  key: string; // FIGURES registry key (resolved to a component by the page)
  title: string; // card title — the mental-model card's title when one reveals this figure
  chapter: string; // owning chapter id (click-through target)
  chapterTitle: string;
  order: number; // owning chapter order (atlas sort)
  group: string; // owning chapter group (part filter)
  caption?: string; // in-body figure caption, when the figure is embedded in a chapter
}

/* Nice titles for keys without a gallery card ("timeout-triad" → "Timeout triad"). */
const ACRONYMS: Record<string, string> = { gc: "GC", jit: "JIT", v8: "V8", http: "HTTP", cjs: "CJS", esm: "ESM" };
function humanize(key: string): string {
  return key
    .split("-")
    .map((w, i) => ACRONYMS[w] ?? (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

const modelTitleByFig = new Map<string, string>();
for (const m of MODELS) if (m.figure && !modelTitleByFig.has(m.figure)) modelTitleByFig.set(m.figure, m.title);

function build(): AtlasEntry[] {
  const seen = new Set<string>();
  const entries: AtlasEntry[] = [];
  const add = (key: string, chapterId: string, caption?: string): void => {
    if (seen.has(key)) return;
    seen.add(key);
    const ch = CHAPTER_BY_ID[chapterId];
    if (!ch) return; // unresolvable owner — surfaced by test-atlas, never silently rendered
    entries.push({
      key,
      title: modelTitleByFig.get(key) ?? humanize(key),
      chapter: ch.id,
      chapterTitle: ch.title,
      order: ch.order,
      group: ch.group,
      caption,
    });
  };

  // 1. in-body figures, in reading order (chapter order, then section order)
  for (const c of [...CHAPTERS].sort((a, b) => a.order - b.order))
    for (const s of c.sections) if (s.kind === "figure") add(s.fig, c.id, s.caption);
  // 2. gallery-only figures inherit their mental-model card's chapter
  for (const m of MODELS) if (m.figure) add(m.figure, m.chapter);

  // stable sort: gallery-only figures slot in right after their chapter's body figures
  return entries.sort((a, b) => a.order - b.order);
}

export const ATLAS: AtlasEntry[] = build();

export function filterAtlas(group: string | null): AtlasEntry[] {
  return group ? ATLAS.filter((e) => e.group === group) : ATLAS;
}
