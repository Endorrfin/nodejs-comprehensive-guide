import React from "react";

/** Static, on-brand diagram of how `await` suspends a function and resumes it
    later as a microtask — "await pauses the function, not the thread". */
export function AwaitTimeline(): React.ReactElement {
  const y = 150;
  return (
    <svg
      viewBox="0 0 680 250"
      width="100%"
      role="img"
      aria-label="A single thread timeline: an async function runs its synchronous part, hits await and suspends, the caller and event loop keep running, then the function resumes later as a microtask."
    >
      <defs>
        <marker id="aw-arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#A78BFA" />
        </marker>
      </defs>

      {/* the one thread */}
      <text x="40" y="60" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="11">
        one thread · never blocked
      </text>
      <line x1="40" y1={y} x2="640" y2={y} stroke="#33402f" strokeWidth="1.5" />

      {/* segment A — synchronous part of the async fn (on the call stack) */}
      <rect x="60" y={y - 16} width="170" height="32" rx="7" fill="#13260f" stroke="#6CC24A" strokeWidth="1.5" />
      <text x="145" y={y + 5} textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="12.5" fontWeight="600">
        run() — sync part
      </text>
      <text x="145" y={y - 26} textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        on the call stack
      </text>

      {/* await suspend marker */}
      <line x1="238" y1={y - 30} x2="238" y2={y + 30} stroke="#FF7A00" strokeWidth="2" />
      <circle cx="238" cy={y} r="5" fill="#FF7A00" />
      <text x="238" y={y - 38} textAnchor="middle" fill="#FF7A00" fontFamily="'JetBrains Mono',monospace" fontSize="11" fontWeight="700">
        await
      </text>
      <text x="238" y={y + 46} textAnchor="middle" fill="#FF7A00" fontFamily="'Inter',sans-serif" fontSize="9.5">
        suspend · return control
      </text>

      {/* gap — the caller + loop keep running */}
      <line x1="248" y1={y} x2="446" y2={y} stroke="#3C873A" strokeWidth="1.5" strokeDasharray="3 6" />
      <text x="347" y={y - 12} textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        caller continues · other tasks run
      </text>

      {/* microtask checkpoint */}
      <line x1="454" y1={y - 30} x2="454" y2={y + 30} stroke="#A78BFA" strokeWidth="2" />
      <text x="454" y={y - 38} textAnchor="middle" fill="#A78BFA" fontFamily="'JetBrains Mono',monospace" fontSize="10" fontWeight="700">
        microtask
      </text>

      {/* segment B — the resumed continuation */}
      <rect x="462" y={y - 16} width="158" height="32" rx="7" fill="#1a1430" stroke="#A78BFA" strokeWidth="1.5" />
      <text x="541" y={y + 5} textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="12.5" fontWeight="600">
        run() resumes
      </text>
      <text x="541" y={y - 26} textAnchor="middle" fill="#A78BFA" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        the rest of the body
      </text>

      {/* arc: the continuation was queued as a microtask */}
      <path d="M238,176 C 300,232 392,232 454,180" fill="none" stroke="#A78BFA" strokeWidth="1.6" strokeDasharray="4 4" markerEnd="url(#aw-arr)" />
      <text x="346" y={y + 86} textAnchor="middle" fill="#A78BFA" fontFamily="'Inter',sans-serif" fontSize="10">
        the continuation is queued as a single microtask
      </text>
    </svg>
  );
}
