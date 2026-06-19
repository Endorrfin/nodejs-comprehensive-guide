import React from "react";

/** Ch.20 (Summary): the whole guide as one causal spine. From a single fact —
    one thread runs your JS — every other lesson follows in order: don't block it,
    offload the waiting, stream big data, observe the pulse, fail safe. V8 + GC
    sit underneath, on that same thread. */
export function WholePicture(): React.ReactElement {
  const nodes = [
    { t: ["One thread", "runs your JS"], sub: "event loop", x: 14 },
    { t: ["Never block", "that thread"], sub: "weaknesses · perf", x: 154 },
    { t: ["Offload the", "waiting"], sub: "pool + kernel", x: 294 },
    { t: ["Stream —", "don't buffer"], sub: "streams", x: 434 },
    { t: ["Fail safe in", "production"], sub: "shutdown · scale", x: 574 },
  ];
  const W = 126;
  const cy = 64;

  return (
    <svg
      viewBox="0 0 714 224"
      width="100%"
      role="img"
      aria-label="The whole guide as one causal chain. One thread runs your JavaScript; therefore never block that thread; therefore offload the waiting to the thread pool and the OS kernel; therefore stream large data instead of buffering it; therefore fail safe in production by draining on shutdown. Underneath, V8 compiles your JavaScript and the garbage collector reclaims memory on that same single thread."
    >
      <text x="16" y="24" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        the whole guide, as one chain →
      </text>

      {nodes.map((n, i) => (
        <g key={i}>
          <rect
            x={n.x}
            y={cy - 22}
            width={W}
            height={50}
            rx="9"
            fill={i === 0 ? "rgba(108,194,74,0.16)" : "rgba(108,194,74,0.06)"}
            stroke={i === 0 ? "#4ADE80" : "#3C873A"}
            strokeWidth={i === 0 ? 2 : 1.3}
          />
          <text x={n.x + W / 2} y={cy - 4} textAnchor="middle" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11" fontWeight="600">
            {n.t[0]}
          </text>
          <text x={n.x + W / 2} y={cy + 10} textAnchor="middle" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11" fontWeight="600">
            {n.t[1]}
          </text>
          <text x={n.x + W / 2} y={cy + 24} textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">
            {n.sub}
          </text>
          {i < nodes.length - 1 ? (
            <g>
              <line x1={n.x + W} y1={cy} x2={n.x + W + 14} y2={cy} stroke="#6CC24A" strokeWidth="1.6" markerEnd="url(#wp-arrow)" />
              <text x={n.x + W + 7} y={cy - 8} textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="8">
                ∴
              </text>
            </g>
          ) : null}
        </g>
      ))}

      <defs>
        <marker id="wp-arrow" markerWidth="7" markerHeight="7" refX="5.5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
      </defs>

      {/* baseline: V8 + GC underneath, same thread */}
      <rect x="14" y="132" width="686" height="34" rx="9" fill="rgba(0,0,0,0.28)" stroke="#243024" strokeWidth="1" />
      <text x="357" y="153" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        underneath it all: V8 compiles your JS · the GC reclaims memory — on that <tspan fill="#4ADE80" fontWeight="600">same one thread</tspan>
      </text>

      {/* the rule */}
      <text x="357" y="196" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="12.5" fontWeight="600">
        One thread runs JS · the waiting is offloaded · never block the thread.
      </text>
    </svg>
  );
}
