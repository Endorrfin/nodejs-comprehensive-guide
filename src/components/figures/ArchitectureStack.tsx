import React from "react";

/** Static layer-cake of Node's architecture: your JS → core API → C++ bindings
    → { V8 | libuv | bundled C libs } → OS. A call descends the stack (left,
    green) and the result/event ascends (right). The one rule, spelled out at
    the bottom: JavaScript is single-threaded; the waiting is offloaded. */
export function ArchitectureStack(): React.ReactElement {
  const band = (
    y: number,
    title: string,
    sub: string,
    opts: { fill: string; stroke: string; titleColor?: string } = { fill: "#10160f", stroke: "#243024" },
  ): React.ReactElement => (
    <g>
      <rect x="86" y={y} width="508" height="40" rx="9" fill={opts.fill} stroke={opts.stroke} strokeWidth="1.4" />
      <text x="100" y={y + 18} fill={opts.titleColor ?? "#F4F7F4"} fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        {title}
      </text>
      <text x="100" y={y + 33} fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        {sub}
      </text>
    </g>
  );

  const cell = (
    x: number,
    title: string,
    sub: string,
    opts: { fill: string; stroke: string; titleColor: string },
  ): React.ReactElement => (
    <g>
      <rect x={x} y="180" width="164" height="70" rx="9" fill={opts.fill} stroke={opts.stroke} strokeWidth="1.5" />
      <text x={x + 82} y="208" textAnchor="middle" fill={opts.titleColor} fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        {title}
      </text>
      <text x={x + 82} y="226" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="8.6">
        {sub.split(" · ")[0]}
      </text>
      <text x={x + 82} y="239" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8.6">
        {sub.split(" · ").slice(1).join(" · ")}
      </text>
    </g>
  );

  return (
    <svg viewBox="0 0 680 372" width="100%" role="img" aria-label="Node.js layered architecture: your JavaScript on top, then the Node core JS API, then C++ bindings, then the native row of V8, libuv and bundled C libraries, then the operating system. A call descends the stack and the result ascends.">
      <defs>
        <marker id="as-down" markerWidth="9" markerHeight="9" refX="4" refY="7" orient="auto">
          <path d="M0,0 L8,0 L4,7 Z" fill="#6CC24A" />
        </marker>
        <marker id="as-up" markerWidth="9" markerHeight="9" refX="4" refY="0" orient="auto">
          <path d="M0,7 L8,7 L4,0 Z" fill="#4ADE80" />
        </marker>
      </defs>

      {/* descend / ascend arrows */}
      <line x1="46" y1="40" x2="46" y2="286" stroke="#6CC24A" strokeWidth="1.8" markerEnd="url(#as-down)" />
      <text x="46" y="300" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9">call</text>
      <line x1="634" y1="286" x2="634" y2="40" stroke="#4ADE80" strokeWidth="1.8" markerEnd="url(#as-up)" />
      <text x="634" y="300" textAnchor="middle" fill="#4ADE80" fontFamily="'JetBrains Mono',monospace" fontSize="9">result</text>

      {/* the stack, top → bottom */}
      {band(24, "Your JavaScript", "application code — single-threaded", { fill: "#0f1d0c", stroke: "#3C873A", titleColor: "#cdebbf" })}
      {band(76, "Node core API (JS)", "fs · http · net · streams · crypto", { fill: "#10160f", stroke: "#243024" })}
      {band(128, "C++ bindings", "node:: · N-API — JS ↔ native bridge", { fill: "#121511", stroke: "#33402f" })}

      {/* native row */}
      {cell(86, "V8", "executes JS · heap & GC", { fill: "#0b1620", stroke: "#2a4a5a", titleColor: "#7cc7e8" })}
      {cell(258, "libuv", "event loop · async I/O · thread pool", { fill: "#0f1d0c", stroke: "#2a5320", titleColor: "#6CC24A" })}
      {cell(430, "bundled C libs", "OpenSSL · zlib · llhttp · c-ares", { fill: "#1a1206", stroke: "#7a4a1c", titleColor: "#ffb478" })}

      {band(274, "Operating system", "epoll · kqueue · IOCP · threads · filesystem · network", { fill: "#0c0f0c", stroke: "#33402f" })}

      {/* the one rule */}
      <text x="86" y="332" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        V8 knows nothing about files or sockets · libuv owns the loop + I/O · the core JS API wraps the bindings.
      </text>
      <text x="86" y="350" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        The one rule: JavaScript runs on a single thread — the waiting (I/O) is offloaded below it.
      </text>
    </svg>
  );
}
