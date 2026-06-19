import React from "react";

/** Ch.14 (Performance): a flamegraph reads bottom-up — each box is a function,
    its WIDTH is the share of stack samples (time) spent there. The widest tower
    is the hot path: that's where the CPU goes, and where to optimize. Green =
    ordinary frames, orange = the CPU-heavy hot frame (the thread-pool/CPU
    semantic colour), red = GC overhead. */
export function FlameGraph(): React.ReactElement {
  type F = { x: number; w: number; row: number; label: string; tone: "base" | "hot" | "gc" | "cool" };
  const rowH = 26;
  const top = 24;
  const frames: F[] = [
    { x: 20, w: 640, row: 0, label: "node ▸ main", tone: "base" },
    { x: 20, w: 548, row: 1, label: "server.emit('request')", tone: "base" },
    { x: 574, w: 86, row: 1, label: "GC", tone: "gc" },
    { x: 20, w: 548, row: 2, label: "app.handler(req,res)", tone: "base" },
    { x: 20, w: 360, row: 3, label: "JSON.parse(hugeBody)", tone: "hot" },
    { x: 386, w: 92, row: 3, label: "validate()", tone: "cool" },
    { x: 484, w: 84, row: 3, label: "render()", tone: "cool" },
    { x: 20, w: 360, row: 4, label: "walkObjectGraph()", tone: "hot" },
  ];
  const color: Record<F["tone"], { fill: string; stroke: string; tx: string }> = {
    base: { fill: "rgba(108,194,74,0.16)", stroke: "#3C873A", tx: "#cdebbf" },
    cool: { fill: "rgba(56,189,248,0.14)", stroke: "#2b6f86", tx: "#bfe6f5" },
    hot: { fill: "rgba(255,122,0,0.20)", stroke: "#FF7A00", tx: "#ffd2a6" },
    gc: { fill: "rgba(248,113,113,0.16)", stroke: "#b45454", tx: "#fbb4b4" },
  };
  const yOf = (row: number): number => top + (4 - row) * rowH; // row 0 at the bottom

  return (
    <svg
      viewBox="0 0 680 200"
      width="100%"
      role="img"
      aria-label="A flamegraph: function frames stacked by call depth, each box's width proportional to the CPU time spent in it. The widest tower — JSON.parse of a huge body calling walkObjectGraph — is the hot path consuming most CPU on the event loop, so it is the frame to optimize. Narrow frames (validate, render) and GC overhead are minor by comparison."
    >
      <defs>
        <marker id="fg-arrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#FF7A00" />
        </marker>
      </defs>

      {frames.map((f) => {
        const c = color[f.tone];
        const y = yOf(f.row);
        return (
          <g key={`${f.row}-${f.x}`}>
            <rect x={f.x} y={y} width={f.w} height={rowH - 4} rx="3" fill={c.fill} stroke={c.stroke} strokeWidth="1.2" />
            {f.w > 60 ? (
              <text x={f.x + 8} y={y + 15} fill={c.tx} fontFamily="'JetBrains Mono',monospace" fontSize="10">
                {f.label}
              </text>
            ) : (
              <text x={f.x + f.w / 2} y={y + 15} textAnchor="middle" fill={c.tx} fontFamily="'JetBrains Mono',monospace" fontSize="9">
                {f.label}
              </text>
            )}
          </g>
        );
      })}

      {/* hot-path callout */}
      <path d="M200,18 L200,40" fill="none" stroke="#FF7A00" strokeWidth="1.6" markerEnd="url(#fg-arrow)" />
      <text x="208" y="16" fill="#FF7A00" fontFamily="'Space Grotesk',sans-serif" fontSize="11" fontWeight="600">
        widest tower = hottest self-time → optimize here
      </text>

      {/* axis hint */}
      <text x="20" y="196" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">
        ↑ stack depth · → width = share of CPU samples (read bottom-up)
      </text>
    </svg>
  );
}
