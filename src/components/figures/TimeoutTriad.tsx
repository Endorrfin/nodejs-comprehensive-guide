import React from "react";

/** Ch.13 (HTTP): where each server timeout fires across a connection's life.
    headersTimeout caps time to receive COMPLETE headers; requestTimeout caps
    the whole request; keepAliveTimeout closes an idle kept socket. Verified
    defaults (Node 22): 60 s / 300 s / 5 s. */
export function TimeoutTriad(): React.ReactElement {
  // x positions along the life of a connection
  const segs = [
    { x: 28, w: 150, label: "receive headers", color: "#38BDF8", note: "headersTimeout · 60 s" },
    { x: 178, w: 196, label: "receive body (whole request)", color: "#6CC24A", note: "requestTimeout · 300 s" },
    { x: 374, w: 120, label: "handler + response", color: "#A78BFA", note: "your code" },
    { x: 494, w: 158, label: "idle, kept open", color: "#FF7A00", note: "keepAliveTimeout · 5 s" },
  ];
  return (
    <svg
      viewBox="0 0 680 232"
      width="100%"
      role="img"
      aria-label="A connection's life as a timeline. Headers must arrive within headersTimeout (60 seconds), the entire request within requestTimeout (300 seconds, enabled by default since Node 18), and after the response an idle kept-alive socket is closed after keepAliveTimeout (5 seconds). Set keepAliveTimeout above any upstream load balancer idle timeout to avoid 502s."
    >
      <text x="20" y="28" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">one connection, over time →</text>

      {/* baseline */}
      <line x1="28" y1="118" x2="652" y2="118" stroke="#33402f" strokeWidth="1.5" />

      {segs.map((s) => (
        <g key={s.label}>
          <rect x={s.x} y={92} width={s.w} height={26} rx="6" fill="rgba(0,0,0,0.3)" stroke={s.color} strokeWidth="1.4" />
          <text x={s.x + s.w / 2} y={109} textAnchor="middle" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="10.5">{s.label}</text>
          {/* bracket + timeout label below */}
          <line x1={s.x} y1={128} x2={s.x + s.w} y2={128} stroke={s.color} strokeWidth="1.3" />
          <line x1={s.x} y1={124} x2={s.x} y2={132} stroke={s.color} strokeWidth="1.3" />
          <line x1={s.x + s.w} y1={124} x2={s.x + s.w} y2={132} stroke={s.color} strokeWidth="1.3" />
          <text x={s.x + s.w / 2} y={146} textAnchor="middle" fill={s.color} fontFamily="'JetBrains Mono',monospace" fontSize="9.5">{s.note}</text>
        </g>
      ))}

      {/* connect marker */}
      <circle cx="28" cy="118" r="4" fill="#6CC24A" />
      <text x="28" y="82" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">connect</text>
      <text x="652" y="82" textAnchor="end" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">reuse or close →</text>

      {/* 502 warning */}
      <rect x="28" y="176" width="624" height="40" rx="9" fill="#150d0d" stroke="#7a2c2c" strokeWidth="1" />
      <text x="44" y="194" fill="#fca5a5" fontFamily="'Inter',sans-serif" fontSize="10.5" fontWeight="600">The 502 race</text>
      <text x="44" y="209" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        keepAliveTimeout shorter than the load balancer&#8217;s idle timeout → Node closes first → LB reuses a dead socket → ECONNRESET / 502.
      </text>
    </svg>
  );
}
