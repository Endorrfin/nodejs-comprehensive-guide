import React from "react";

/** Static, on-brand mental model of V8's generational heap: objects are born in
    the young generation (two semi-spaces, collected by the fast Scavenge), and
    survivors are promoted to the old generation (collected by Mark-Sweep-Compact). */
export function GcHeap(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 680 320"
      width="100%"
      role="img"
      aria-label="V8 generational heap: a young generation of two semi-spaces collected by the Scavenger, with survivors promoted to an old generation collected by Mark-Sweep-Compact."
    >
      <defs>
        <marker id="gc-arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#38BDF8" />
        </marker>
        <marker id="gc-flip" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
      </defs>

      <text x="34" y="30" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="11">
        most objects die young — so collect the nursery often and cheaply
      </text>

      {/* young generation */}
      <rect x="34" y="50" width="338" height="200" rx="12" fill="#0e160c" stroke="#3C873A" strokeWidth="1.5" />
      <text x="50" y="74" fill="#6CC24A" fontFamily="'Space Grotesk',sans-serif" fontSize="13.5" fontWeight="600">
        young generation (nursery)
      </text>

      {/* two semi-spaces */}
      <rect x="52" y="92" width="135" height="96" rx="9" fill="#13260f" stroke="#44883E" strokeWidth="1.2" />
      <text x="119" y="110" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        From (active)
      </text>
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <rect key={`${r}-${c}`} x={64 + c * 38} y={120 + r * 20} width="30" height="13" rx="3" fill={r === 0 && c < 2 ? "#1d4d16" : "#20271d"} stroke={r === 0 && c < 2 ? "#6CC24A" : "#33402f"} strokeWidth="1" />
        )),
      )}

      <rect x="220" y="92" width="135" height="96" rx="9" fill="#0c130a" stroke="#33402f" strokeWidth="1.2" strokeDasharray="4 4" />
      <text x="287" y="110" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        To (reserve)
      </text>
      <rect x="232" y="120" width="30" height="13" rx="3" fill="#1d4d16" stroke="#6CC24A" strokeWidth="1" />

      {/* flip arrow between semi-spaces */}
      <path d="M190,150 L217,150" fill="none" stroke="#6CC24A" strokeWidth="1.5" markerEnd="url(#gc-flip)" />
      <text x="203" y="143" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9">
        copy
      </text>

      <text x="52" y="212" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5" fontWeight="600">
        Scavenge · minor GC
      </text>
      <text x="52" y="230" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        copies survivors → flips · fast, frequent
      </text>

      {/* promotion arrow */}
      <path d="M372,150 L432,150" fill="none" stroke="#38BDF8" strokeWidth="2" markerEnd="url(#gc-arr)" />
      <text x="402" y="138" textAnchor="middle" fill="#38BDF8" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        promote
      </text>
      <text x="402" y="170" textAnchor="middle" fill="#6B7B6E" fontFamily="'Inter',sans-serif" fontSize="9">
        survived ~2
      </text>

      {/* old generation */}
      <rect x="446" y="50" width="200" height="200" rx="12" fill="#0a1116" stroke="#2a7fb8" strokeWidth="1.5" />
      <text x="462" y="74" fill="#38BDF8" fontFamily="'Space Grotesk',sans-serif" fontSize="13.5" fontWeight="600">
        old generation
      </text>
      {[0, 1, 2, 3].map((r) =>
        [0, 1].map((c) => (
          <rect key={`o-${r}-${c}`} x={470 + c * 78} y={92 + r * 22} width="68" height="15" rx="3" fill="#0e2433" stroke="#2a5f80" strokeWidth="1" />
        )),
      )}
      <text x="462" y="212" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5" fontWeight="600">
        Mark-Sweep-Compact · major GC
      </text>
      <text x="462" y="230" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        concurrent · rarer · costlier
      </text>

      <text x="34" y="286" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        Scavenge cost ∝ survivors (not garbage) · major GC marks concurrently with short stop-the-world pauses
      </text>
    </svg>
  );
}
