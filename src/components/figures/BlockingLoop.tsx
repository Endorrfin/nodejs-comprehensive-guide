import React from "react";

/** Ch.3 (Weaknesses): one synchronous CPU task on the single thread freezes
    everything. The thread is busy in a 250 ms blocking call; every other
    in-flight request just waits, each inheriting the full stall as latency. */
export function BlockingLoop(): React.ReactElement {
  const waiting = ["GET /b", "GET /c", "GET /d", "GET /e"];
  return (
    <svg viewBox="0 0 680 260" width="100%" role="img" aria-label="A single synchronous CPU task blocks the one event-loop thread for 250 ms. Requests B through E wait in the queue, each delayed by the full 250 ms — no I/O, no timers, no new connections run until it returns.">
      <defs>
        <marker id="bl-r" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#F87171" />
        </marker>
      </defs>

      {/* the one thread lane */}
      <text x="20" y="34" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">the one event-loop thread</text>
      <rect x="20" y="48" width="640" height="48" rx="9" fill="rgba(0,0,0,0.25)" stroke="#243024" strokeWidth="1.2" />

      {/* short green handler, then a long red blocking task */}
      <rect x="26" y="54" width="86" height="36" rx="6" fill="rgba(108,194,74,0.16)" stroke="#3C873A" strokeWidth="1.3" />
      <text x="69" y="76" textAnchor="middle" fill="#cdebbf" fontFamily="'JetBrains Mono',monospace" fontSize="10">req A</text>

      <rect x="116" y="54" width="490" height="36" rx="6" fill="rgba(248,113,113,0.16)" stroke="#7a2c2c" strokeWidth="1.4" />
      <text x="361" y="71" textAnchor="middle" fill="#fca5a5" fontFamily="'JetBrains Mono',monospace" fontSize="11" fontWeight="600">JSON.parse(huge) / sync crypto — blocks ~250 ms</text>
      <text x="361" y="85" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">CPU on the single thread — nothing else can run</text>

      {/* time axis hint */}
      <text x="116" y="112" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">t=0</text>
      <text x="600" y="112" textAnchor="end" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">t=250 ms</text>

      {/* waiting queue */}
      <text x="20" y="146" fill="#F87171" fontFamily="'Space Grotesk',sans-serif" fontSize="12" fontWeight="600">blocked — waiting for the thread</text>
      {waiting.map((w, i) => {
        const y = 158 + i * 24;
        return (
          <g key={w}>
            <rect x="20" y={y} width="120" height="18" rx="5" fill="rgba(0,0,0,0.25)" stroke="#33402f" strokeWidth="1" />
            <text x="30" y={y + 13} fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="10">{w}</text>
            <line x1="146" y1={y + 9} x2="180" y2={y + 9} stroke="#F87171" strokeWidth="1.3" strokeDasharray="3 3" markerEnd="url(#bl-r)" />
            <text x="190" y={y + 13} fill="#fca5a5" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">+250 ms latency — stalled until the CPU task returns</text>
          </g>
        );
      })}

      <text x="20" y="252" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        No I/O callbacks, no timers, no new connections accepted while the thread is busy. Offload CPU work to a worker_thread or chunk it.
      </text>
    </svg>
  );
}
