import React from "react";

/** The one-line composition of Node, for Ch.1: V8 (runs JS) + libuv (event
    loop, async I/O, thread pool) + C++ bindings (glue). Your JS is
    single-threaded; the waiting is offloaded below. */
export function NodePieces(): React.ReactElement {
  const box = (
    x: number,
    title: string,
    lines: string[],
    opts: { fill: string; stroke: string; title: string },
  ): React.ReactElement => (
    <g>
      <rect x={x} y="64" width="196" height="92" rx="11" fill={opts.fill} stroke={opts.stroke} strokeWidth="1.6" />
      <text x={x + 16} y="92" fill={opts.title} fontFamily="'Space Grotesk',sans-serif" fontSize="15" fontWeight="700">
        {title}
      </text>
      {lines.map((ln, i) => (
        <text key={i} x={x + 16} y={112 + i * 16} fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.6">
          {ln}
        </text>
      ))}
    </g>
  );

  return (
    <svg viewBox="0 0 680 210" width="100%" role="img" aria-label="Node.js equals V8 (runs your JavaScript, heap and GC) plus libuv (event loop, async I/O, a 4-thread pool) plus C++ bindings (the glue). Your JavaScript is single-threaded; the waiting is offloaded.">
      <text x="20" y="34" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="15" fontWeight="600">
        Node.js <tspan fill="#6CC24A">=</tspan>
      </text>

      {box(20, "V8", ["runs your JS", "heap & GC", "(Google's engine)"], { fill: "#0b1620", stroke: "#2a4a5a", title: "#7cc7e8" })}
      <text x="226" y="116" textAnchor="middle" fill="#6CC24A" fontFamily="'Space Grotesk',sans-serif" fontSize="20" fontWeight="700">+</text>
      {box(244, "libuv", ["event loop (6 phases)", "async I/O abstraction", "4-thread pool"], { fill: "#0f1d0c", stroke: "#2a5320", title: "#6CC24A" })}
      <text x="450" y="116" textAnchor="middle" fill="#6CC24A" fontFamily="'Space Grotesk',sans-serif" fontSize="20" fontWeight="700">+</text>
      {box(468, "C++ bindings", ["JS ↔ native glue", "+ a JS core API", "(fs, http, streams)"], { fill: "#1a1206", stroke: "#7a4a1c", title: "#ffb478" })}

      <text x="20" y="186" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        Your JavaScript runs single-threaded on V8; libuv does the waiting. One language, non-blocking by default.
      </text>
    </svg>
  );
}
