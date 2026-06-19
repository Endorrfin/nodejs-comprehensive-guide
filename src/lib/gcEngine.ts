/* ===========================================================================
   Generational GC engine — a faithful, simplified model of V8's Orinoco
   collector (the "V8, JIT, memory & GC" chapter, hero sim).

   Modeled rules (the ones that matter for teaching):
   - Objects are born in the YOUNG generation (the nursery), split into two
     equal semi-spaces: an active "From" space and an empty "To" space.
   - When From fills, a MINOR GC (Scavenge) runs: mark live objects, copy the
     survivors into To (dead ones are simply abandoned), then FLIP — To becomes
     the new active space. It is parallel but stop-the-world; it is fast because
     it only touches survivors, and most objects die young.
   - An object that survives ~2 scavenges is PROMOTED to the OLD generation.
   - When old space fills, a MAJOR GC (Mark-Sweep-Compact) runs: mark live
     objects (concurrently, in real V8), sweep the dead, and compact to remove
     fragmentation. Majors are rarer and costlier than minors.

   Pure & deterministic: simulate(scenario) returns Frame[] the UI steps through.
   summary() returns the GC tallies, asserted in scripts/test-gc.ts to match the
   shape measured from real Node 22 (minors >> majors — see node-truth-gc.mjs:
   minor 52 : major 1, and 271 : 1 with a 1 MiB semi-space).
   =========================================================================== */

export type Kind = "g" | "p" | "t"; // garbage · permanent survivor · transient (promoted then dies at a major)
export type Tone = "new" | "normal" | "live" | "dead" | "promoted";

export interface Cell {
  id: number;
  label: string;
  kind: Kind;
  age: number;
  tone: Tone;
}

export type Phase =
  | "alloc"
  | "minor-mark"
  | "minor-copy"
  | "minor-flip"
  | "major-mark"
  | "major-sweep"
  | "start"
  | "done";

export interface Stats {
  alloc: number;
  minor: number;
  major: number;
  promoted: number;
  reclaimed: number;
}

export interface Frame {
  step: number;
  phase: Phase;
  gc: "none" | "minor" | "major";
  caption: string;
  from: Cell[];
  to: Cell[];
  old: Cell[];
  youngCap: number;
  oldCap: number;
  stats: Stats;
}

export interface AllocSpec {
  kind: Kind;
}

export interface Scenario {
  id: string;
  title: string;
  blurb: string;
  youngCap: number;
  oldCap: number;
  script: AllocSpec[];
  takeaway: string;
}

const PROMOTE_AGE = 2; // survive two scavenges → promote
const CAP = 400;

const KIND_LABEL: Record<Kind, string> = { g: "garbage", p: "long-lived", t: "medium-lived" };

export function simulate(s: Scenario): Frame[] {
  const frames: Frame[] = [];
  let from: Cell[] = [];
  let to: Cell[] = [];
  let old: Cell[] = [];
  let nextId = 1;
  const stats: Stats = { alloc: 0, minor: 0, major: 0, promoted: 0, reclaimed: 0 };

  const snap = (phase: Phase, gc: Frame["gc"], caption: string): void => {
    const clone = (xs: Cell[]): Cell[] => xs.map((c) => ({ ...c }));
    frames.push({
      step: frames.length,
      phase,
      gc,
      caption,
      from: clone(from),
      to: clone(to),
      old: clone(old),
      youngCap: s.youngCap,
      oldCap: s.oldCap,
      stats: { ...stats },
    });
    if (frames.length > CAP) throw new Error("gc sim exceeded frame cap");
  };

  const clearTones = (xs: Cell[]): void => {
    for (const c of xs) c.tone = "normal";
  };

  // --------------------------------------------------------------- major GC
  const runMajor = (): void => {
    stats.major++;
    // mark: transient promoted objects are now unreachable; permanents stay live
    for (const c of old) c.tone = c.kind === "t" ? "dead" : "live";
    snap(
      "major-mark",
      "major",
      `Old space is full → MAJOR GC (Mark-Sweep-Compact). Concurrent marking finds the live objects; the ${old.filter((c) => c.kind === "t").length} medium-lived ones are now unreachable.`,
    );
    const before = old.length;
    old = old.filter((c) => c.kind !== "t");
    stats.reclaimed += before - old.length;
    clearTones(old);
    snap(
      "major-sweep",
      "major",
      `Sweep the dead and COMPACT the survivors to one end — no fragmentation. Major GCs are rarer but costlier than minors, with brief stop-the-world pauses.`,
    );
  };

  // --------------------------------------------------------------- minor GC
  const runMinor = (): void => {
    stats.minor++;
    // mark
    for (const c of from) c.tone = c.kind === "g" ? "dead" : "live";
    const deadN = from.filter((c) => c.kind === "g").length;
    snap(
      "minor-mark",
      "minor",
      `Young space (From) is full → MINOR GC (Scavenge). Mark live objects: ${from.length - deadN} survive, ${deadN} are garbage. Most objects die young.`,
    );

    // copy survivors into To (aging); promote those old enough; abandon the dead
    to = [];
    let promotedNow = 0;
    for (const c of from) {
      if (c.kind === "g") {
        stats.reclaimed++;
        continue; // dead — not copied; the From space is simply abandoned
      }
      const aged = c.age + 1;
      if (aged >= PROMOTE_AGE) {
        if (old.length >= s.oldCap) runMajor();
        old.push({ ...c, age: aged, tone: "promoted" });
        stats.promoted++;
        promotedNow++;
      } else {
        to.push({ ...c, age: aged, tone: "live" });
      }
    }
    snap(
      "minor-copy",
      "minor",
      `Copy the ${to.length} survivor${to.length === 1 ? "" : "s"} into the To-space${promotedNow ? `; ${promotedNow} that already survived twice are PROMOTED to old space` : ""}. Only live objects are touched — that is why a Scavenge is cheap.`,
    );

    // flip: To becomes the active From space
    clearTones(old);
    from = to.map((c) => ({ ...c, tone: "normal" }));
    to = [];
    snap(
      "minor-flip",
      "none",
      `FLIP: the To-space becomes the active young space; the old From space is now empty and free for new allocations.`,
    );
  };

  // --------------------------------------------------------------- run script
  snap("start", "none", "Empty heap. Objects will be born in the young generation (the nursery).");
  for (const spec of s.script) {
    if (from.length >= s.youngCap) runMinor();
    clearTones(from);
    const cell: Cell = { id: nextId, label: "#" + nextId, kind: spec.kind, age: 0, tone: "new" };
    nextId++;
    from.push(cell);
    stats.alloc++;
    snap(
      "alloc",
      "none",
      `Allocate object ${cell.label} (${KIND_LABEL[spec.kind]}) in the young space — bump-pointer fast, no GC needed.`,
    );
  }
  clearTones(from);
  snap(
    "done",
    "none",
    `Done. ${stats.minor} minor GC${stats.minor === 1 ? "" : "s"} (Scavenge) vs ${stats.major} major GC${stats.major === 1 ? "" : "s"} (Mark-Sweep-Compact): minors dominate — exactly the generational hypothesis.`,
  );
  return frames;
}

/** Final GC tallies for a scenario — asserted in scripts/test-gc.ts. */
export function summary(s: Scenario): Stats {
  const frames = simulate(s);
  return frames[frames.length - 1].stats;
}

const g: AllocSpec = { kind: "g" };
const p: AllocSpec = { kind: "p" };
const t: AllocSpec = { kind: "t" };

/* ---------------------------------------------------------------- scenarios.
   Allocation scripts are designed so the viewer sees the full lifecycle in a
   handful of steps. The minor:major ratio mirrors real Node 22 (minors >>
   majors — see scripts/node-truth-gc.mjs).                                    */
export const SCENARIOS: Scenario[] = [
  {
    id: "scavenge",
    title: "Scavenge the nursery",
    blurb: "Most objects die young. One Scavenge reclaims the garbage, copies the survivor, and flips the semi-spaces.",
    youngCap: 5,
    oldCap: 3,
    takeaway:
      "The young generation is two semi-spaces. A Scavenge copies only the (few) survivors into the To-space and abandons the rest, then flips. Cost is proportional to survivors, not to garbage — so churning short-lived objects is cheap.",
    script: [g, p, g, g, g, g, p],
  },
  {
    id: "promote",
    title: "Promotion → major GC",
    blurb: "Survivors that live through two scavenges graduate to old space. When old fills, a Mark-Sweep-Compact runs.",
    youngCap: 5,
    oldCap: 3,
    takeaway:
      "Survive ~2 scavenges and you are promoted to old space, collected by the slower Mark-Sweep-Compact. Long-lived objects (caches, leaks) live here — a leak is really 'old space never shrinks'. Minors are frequent and cheap; majors are rare and costly.",
    script: [g, p, p, g, g, g, g, t, p, g, g, g, g, p, g, g, g],
  },
];
