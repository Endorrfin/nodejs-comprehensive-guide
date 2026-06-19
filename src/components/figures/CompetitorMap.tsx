import React from "react";
import { RUNTIME_COLOR } from "../../data/runtimes";

/** Positioning map: where each runtime sits on two axes —
    X = I/O concurrency + ecosystem / dev-velocity, Y = CPU parallelism / raw
    performance. The JS runtimes cluster bottom-right (I/O + velocity); the
    systems/JVM languages sit top-left (raw compute); Node owns the I/O sweet
    spot. Positions are a qualitative consensus, not a benchmark. */
const PTS: { n: string; x: number; y: number; dx: number; dy: number; a: "start" | "end" }[] = [
  { n: "Node.js", x: 82, y: 34, dx: 10, dy: 4, a: "start" },
  { n: "Deno", x: 72, y: 38, dx: -10, dy: -3, a: "end" },
  { n: "Bun", x: 79, y: 46, dx: 10, dy: 4, a: "start" },
  { n: "Elixir", x: 67, y: 52, dx: 10, dy: 4, a: "start" },
  { n: "Python", x: 44, y: 20, dx: 10, dy: 4, a: "start" },
  { n: "Go", x: 60, y: 72, dx: 10, dy: 4, a: "start" },
  { n: "Java / .NET", x: 45, y: 69, dx: -10, dy: -3, a: "end" },
  { n: "Rust", x: 37, y: 88, dx: 10, dy: 4, a: "start" },
];

const L = 80;
const R = 628;
const T = 44;
const B = 312;
const px = (x: number): number => L + (x / 100) * (R - L);
const py = (y: number): number => B - (y / 100) * (B - T);

export function CompetitorMap(): React.ReactElement {
  return (
    <svg viewBox="0 0 680 360" width="100%" role="img" aria-label="Runtime positioning map. Horizontal axis: I/O concurrency and ecosystem velocity. Vertical axis: CPU parallelism and raw performance. Node.js, Deno and Bun sit in the high-I/O lower-right; Rust, the JVM and Go sit in the high-compute upper-left; Python sits lower-left; Elixir sits mid-right.">
      <defs>
        <marker id="cm-ax" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6B7B6E" />
        </marker>
      </defs>

      {/* quadrant hints */}
      <text x={px(20)} y={py(92)} textAnchor="middle" fill="#33402f" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="700">raw compute</text>
      <text x={px(88)} y={py(8)} textAnchor="middle" fill="#243024" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="700">I/O + velocity</text>

      {/* axes */}
      <line x1={L} y1={B} x2={R + 6} y2={B} stroke="#6B7B6E" strokeWidth="1.3" markerEnd="url(#cm-ax)" />
      <line x1={L} y1={B} x2={L} y2={T - 6} stroke="#6B7B6E" strokeWidth="1.3" markerEnd="url(#cm-ax)" />
      <text x={R} y={B + 22} textAnchor="end" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        I/O concurrency + ecosystem / dev-velocity →
      </text>
      <text x={L - 8} y={T - 14} transform={`rotate(-90 ${L - 8} ${T - 14})`} fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        CPU parallelism / raw performance →
      </text>

      {/* points */}
      {PTS.map((p) => {
        const c = RUNTIME_COLOR[p.n] ?? "#6CC24A";
        const cx = px(p.x);
        const cy = py(p.y);
        const isNode = p.n === "Node.js";
        return (
          <g key={p.n}>
            <circle cx={cx} cy={cy} r={isNode ? 8 : 6} fill={c} opacity={isNode ? 1 : 0.92} />
            {isNode ? <circle cx={cx} cy={cy} r={13} fill="none" stroke={c} strokeWidth="1.2" opacity="0.5" /> : null}
            <text
              x={cx + p.dx}
              y={cy + p.dy}
              textAnchor={p.a}
              fill={c}
              fontFamily="'Space Grotesk',sans-serif"
              fontSize={isNode ? 13 : 12}
              fontWeight={isNode ? 700 : 600}
            >
              {p.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
