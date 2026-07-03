/* CHANGED: S15 — Overview "graph view": the 21 chapters on a ring (grouped by
   part, gaps between parts) with every seeAlso cross-link drawn as a chord.
   Pure SVG computed from the data layer (ids already validated by qa), no
   layout library: deterministic angles → SSR renders it identically. Hover or
   focus a chapter to light up its links; every node is a real <a> to the
   chapter. Styles in global.css (.sg-*). */
import React, { useMemo, useState } from "react";
import { CHAPTERS, GROUPS, type Chapter } from "../../data/concepts";
import { cx } from "../../lib/utils";

const VB_W = 920;
const VB_H = 640;
const CX = VB_W / 2;
const CY = VB_H / 2;
const R = 238; // node ring
const LABEL_R = R + 14;
const GAP_UNITS = 1.6; // breathing room between parts, in "chapter slots"

interface Node {
  c: Chapter;
  x: number;
  y: number;
  lx: number;
  ly: number;
  anchor: "start" | "end" | "middle";
  accent: string;
}

function layout(): Node[] {
  const ordered = [...CHAPTERS].sort((a, b) => a.order - b.order);
  const units = ordered.length + GAP_UNITS * GROUPS.length;
  const accentOf = new Map(GROUPS.map((g) => [g.id, g.accent]));

  let u = 0;
  let prevGroup = "";
  return ordered.map((c) => {
    if (c.group !== prevGroup) {
      u += GAP_UNITS; // open a gap before each part (including the first — symmetric ring)
      prevGroup = c.group;
    }
    const theta = -Math.PI / 2 + ((u + 0.5) / units) * 2 * Math.PI;
    u += 1;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    // near-vertical labels sit above/below the dot; the rest go outward left/right
    const vertical = Math.abs(cos) < 0.25;
    return {
      c,
      x: CX + R * cos,
      y: CY + R * sin,
      lx: CX + LABEL_R * cos,
      ly: CY + LABEL_R * sin + (vertical ? (sin < 0 ? -6 : 12) : 4),
      anchor: vertical ? "middle" : cos < 0 ? "end" : "start",
      accent: accentOf.get(c.group) ?? "var(--accent)",
    };
  });
}

interface Edge {
  a: string;
  b: string;
  accent: string;
  d: string;
}

function edges(nodes: Node[]): Edge[] {
  const byId = new Map(nodes.map((n) => [n.c.id, n]));
  const seen = new Set<string>();
  const out: Edge[] = [];
  for (const n of nodes) {
    for (const sid of n.c.seeAlso) {
      const m = byId.get(sid);
      if (!m) continue;
      const key = n.c.id < sid ? `${n.c.id}|${sid}` : `${sid}|${n.c.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // a chord pulled toward the centre — farther pairs bend deeper
      const mx = (n.x + m.x) / 2;
      const my = (n.y + m.y) / 2;
      const qx = CX + (mx - CX) * 0.42;
      const qy = CY + (my - CY) * 0.42;
      out.push({ a: n.c.id, b: sid, accent: n.accent, d: `M${n.x},${n.y} Q${qx},${qy} ${m.x},${m.y}` });
    }
  }
  return out;
}

export function SeeAlsoGraph(): React.ReactElement {
  const nodes = useMemo(layout, []);
  const links = useMemo(() => edges(nodes), [nodes]);
  const [focus, setFocus] = useState<string | null>(null);

  const connected = useMemo(() => {
    if (!focus) return null;
    const set = new Set([focus]);
    for (const e of links) {
      if (e.a === focus) set.add(e.b);
      if (e.b === focus) set.add(e.a);
    }
    return set;
  }, [focus, links]);

  const degree = (id: string): number => links.filter((e) => e.a === id || e.b === id).length;

  return (
    <div className="sg-wrap">
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        role="img"
        aria-label={`How the ${CHAPTERS.length} chapters reference each other: every line is a seeAlso cross-link. Hover or focus a chapter to highlight its connections; click to open it.`}
      >
        {links.map((e) => (
          <path
            key={`${e.a}|${e.b}`}
            className={cx(
              "sg-edge",
              focus && (e.a === focus || e.b === focus) && "on",
              focus && e.a !== focus && e.b !== focus && "dim",
            )}
            d={e.d}
            fill="none"
            stroke={e.accent}
          />
        ))}
        {nodes.map((n) => (
          <a
            key={n.c.id}
            href={`#/chapter/${n.c.id}`}
            className={cx("sg-node", connected && !connected.has(n.c.id) && "dim")}
            onMouseEnter={() => setFocus(n.c.id)}
            onMouseLeave={() => setFocus(null)}
            onFocus={() => setFocus(n.c.id)}
            onBlur={() => setFocus(null)}
            aria-label={`${n.c.title} — ${degree(n.c.id)} cross-links`}
          >
            <circle cx={n.x} cy={n.y} r={5 + Math.min(4, degree(n.c.id) / 3)} fill={n.accent} />
            <text x={n.lx} y={n.ly} textAnchor={n.anchor} className="sg-label">
              {n.c.title}
            </text>
          </a>
        ))}
      </svg>
      <div className="sg-legend" aria-hidden="true">
        {GROUPS.map((g) => (
          <span key={g.id} className="sg-leg">
            <span className="sb-dot" style={{ background: g.accent }} />
            {g.name}
          </span>
        ))}
        <span className="sg-leg sg-leg-note">node size = number of cross-links</span>
      </div>
    </div>
  );
}
