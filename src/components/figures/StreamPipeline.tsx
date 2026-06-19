import React from "react";

/** Static, on-brand model of a stream pipeline: data flows forward in chunks
    (Readable → Transform → Writable) while backpressure propagates BACKWARD
    (a full sink makes write() return false, pausing the source). pipeline()
    wires both directions AND tears every stream down on error. */
export function StreamPipeline(): React.ReactElement {
  const boxes = [
    { x: 28, label: "Readable", sub: "source · fs.createReadStream", tag: "push" },
    { x: 268, label: "Transform", sub: "zlib.createGzip()", tag: "read+write" },
    { x: 508, label: "Writable", sub: "sink · res / socket (slow)", tag: "consume" },
  ];
  return (
    <svg
      viewBox="0 0 680 250"
      width="100%"
      role="img"
      aria-label="A stream pipeline: data flows forward as chunks from a Readable through a Transform to a Writable, while backpressure flows backward when the slow Writable's buffer fills, pausing the source. pipeline() also destroys every stream on error."
    >
      <defs>
        <marker id="sp-fwd" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
        <marker id="sp-back" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#F87171" />
        </marker>
      </defs>

      {boxes.map((b) => (
        <g key={b.label}>
          <rect x={b.x} y={56} width="144" height="62" rx="11" fill="#101810" stroke="#3C873A" strokeWidth="1.5" />
          <text x={b.x + 72} y={82} textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="600">
            {b.label}
          </text>
          <text x={b.x + 72} y={100} textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">
            {b.sub}
          </text>
          <text x={b.x + 72} y={113} textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8">
            .{b.tag}()
          </text>
        </g>
      ))}

      {/* forward data flow (green) */}
      <path d="M172,78 L268,78" fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#sp-fwd)" />
      <path d="M412,78 L508,78" fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#sp-fwd)" />
      <text x="220" y="69" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9">
        chunks →
      </text>
      <text x="460" y="69" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9">
        chunks →
      </text>

      {/* backward backpressure (red) */}
      <path d="M508,150 L172,150" fill="none" stroke="#F87171" strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#sp-back)" />
      <text x="340" y="143" textAnchor="middle" fill="#F87171" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        ← backpressure: buffer full → write() === false → pause the source
      </text>

      {/* highWaterMark hint */}
      <text x="340" y="178" textAnchor="middle" fill="#fbbf24" fontFamily="'JetBrains Mono',monospace" fontSize="9">
        each link has its own buffer (highWaterMark · default 64 KiB / 16 objects)
      </text>

      {/* pipeline summary */}
      <rect x="28" y="196" width="624" height="36" rx="9" fill="#0c160a" stroke="#243024" strokeWidth="1" />
      <text x="44" y="218" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">
        <tspan fill="#4ADE80" fontFamily="'JetBrains Mono',monospace">await pipeline(src, gzip, dst)</tspan>
        <tspan> — wires data forward AND backpressure backward, and destroys every stream on error (no leaks). Prefer it over .pipe().</tspan>
      </text>
    </svg>
  );
}
