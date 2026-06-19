import React from "react";

/** Mental-model figure (event loop): the execution-priority ladder —
    sync → nextTick → Promise microtasks → one macrotask (timers/check). */
export function MicrotaskLadder(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 680 330"
      width="100%"
      role="img"
      aria-label="The execution priority ladder. 1: synchronous code runs to completion before anything async. 2: the process.nextTick queue drains first among microtasks. 3: Promise then/await continuations drain next. Microtasks fully drain after every callback and between phases. Then exactly one macrotask runs, by phase: timers (setTimeout/setInterval 0) and check (setImmediate). In the main module their relative order is non-deterministic; inside an I/O callback setImmediate runs first."
    >
      <text x="340" y="24" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="600">
        What runs next? The priority ladder
      </text>

      {/* 1 — synchronous */}
      <rect x="70" y="40" width="540" height="38" rx="10" fill="#0d150c" stroke="#3C873A" strokeWidth="1.5" />
      <text x="88" y="64" fill="#4ADE80" fontFamily="'JetBrains Mono',monospace" fontSize="13" fontWeight="700">1</text>
      <text x="112" y="59" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="12.5" fontWeight="600">Synchronous code</text>
      <text x="596" y="64" textAnchor="end" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">runs to completion before ANY async</text>

      {/* 2 — nextTick (microtask) */}
      <rect x="70" y="86" width="540" height="38" rx="10" fill="#120f1a" stroke="#5d4f86" strokeWidth="1.5" />
      <text x="88" y="110" fill="#c4b5fd" fontFamily="'JetBrains Mono',monospace" fontSize="13" fontWeight="700">2</text>
      <text x="112" y="105" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="12">process.nextTick</text>
      <text x="596" y="110" textAnchor="end" fill="#c4b5fd" fontFamily="'Inter',sans-serif" fontSize="11">microtask · drains first</text>

      {/* 3 — promises (microtask) */}
      <rect x="70" y="132" width="540" height="38" rx="10" fill="#120f1a" stroke="#5d4f86" strokeWidth="1.5" />
      <text x="88" y="156" fill="#c4b5fd" fontFamily="'JetBrains Mono',monospace" fontSize="13" fontWeight="700">3</text>
      <text x="112" y="151" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="12">Promise .then / await</text>
      <text x="596" y="156" textAnchor="end" fill="#c4b5fd" fontFamily="'Inter',sans-serif" fontSize="11">microtask · after every nextTick</text>

      <text x="340" y="194" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        ↑ microtasks drain completely after every callback &amp; between phases ↑
      </text>
      <text x="340" y="214" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="10" letterSpacing="1">
        THEN ONE MACROTASK, BY PHASE
      </text>

      {/* macrotasks: timers vs check */}
      <rect x="70" y="226" width="255" height="48" rx="10" fill="#0b1418" stroke="#2b6f8f" strokeWidth="1.5" />
      <text x="86" y="248" fill="#7dd3fc" fontFamily="'Space Grotesk',sans-serif" fontSize="12.5" fontWeight="700">timers phase</text>
      <text x="86" y="266" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="11">setTimeout / setInterval(0)</text>

      <rect x="355" y="226" width="255" height="48" rx="10" fill="#0d150c" stroke="#3C873A" strokeWidth="1.5" />
      <text x="371" y="248" fill="#4ADE80" fontFamily="'Space Grotesk',sans-serif" fontSize="12.5" fontWeight="700">check phase</text>
      <text x="371" y="266" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="11">setImmediate</text>

      <text x="340" y="300" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        main module: their order is non-deterministic
      </text>
      <text x="340" y="316" textAnchor="middle" fill="#fbbf24" fontFamily="'Inter',sans-serif" fontSize="10.5">
        inside an I/O callback, setImmediate always runs first
      </text>
    </svg>
  );
}
