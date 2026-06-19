import React from "react";

/** Ch.12 (Error handling): the one decision that governs every response —
    is this an expected OPERATIONAL error (handle & continue) or a PROGRAMMER
    bug (fail fast, crash, restart)? Never silently swallow either. */
export function ErrorTaxonomy(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 680 286"
      width="100%"
      role="img"
      aria-label="Two kinds of error. Operational errors (bad input, 404, ECONNREFUSED, timeout) are expected runtime failures you handle and recover from. Programmer errors (undefined is not a function, a broken invariant, a forgotten await) are bugs: fail fast, log, crash, and let a supervisor restart a clean process. Never silently swallow an error."
    >
      <text x="340" y="26" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="600">
        Operational error, or programmer bug?
      </text>

      {/* operational (green) */}
      <rect x="24" y="44" width="306" height="186" rx="12" fill="#0d150c" stroke="#3C873A" strokeWidth="1.5" />
      <text x="44" y="74" fill="#4ADE80" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="700">OPERATIONAL</text>
      <text x="44" y="92" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">an expected runtime failure</text>
      <text x="44" y="124" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">bad input · 404 · request timeout</text>
      <text x="44" y="143" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">ECONNREFUSED · disk full · 429</text>
      <line x1="44" y1="158" x2="310" y2="158" stroke="#243024" strokeWidth="1" />
      <text x="44" y="180" fill="#cdebbf" fontFamily="'Inter',sans-serif" fontSize="11.5">→ handle: validate, retry,</text>
      <text x="44" y="197" fill="#cdebbf" fontFamily="'Inter',sans-serif" fontSize="11.5">&#160;&#160;&#160;return 4xx/5xx, fall back</text>
      <rect x="44" y="206" width="116" height="20" rx="10" fill="rgba(108,194,74,0.16)" stroke="#3C873A" strokeWidth="1" />
      <text x="102" y="220" textAnchor="middle" fill="#4ADE80" fontFamily="'JetBrains Mono',monospace" fontSize="9.5" fontWeight="600">RECOVER &amp; CONTINUE</text>

      {/* programmer bug (red) */}
      <rect x="350" y="44" width="306" height="186" rx="12" fill="#150d0d" stroke="#7a2c2c" strokeWidth="1.5" />
      <text x="370" y="74" fill="#fca5a5" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="700">PROGRAMMER BUG</text>
      <text x="370" y="92" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">a defect you didn&#8217;t anticipate</text>
      <text x="370" y="124" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">undefined is not a function</text>
      <text x="370" y="143" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">broken invariant · forgot await</text>
      <line x1="370" y1="158" x2="636" y2="158" stroke="#33402f" strokeWidth="1" />
      <text x="370" y="180" fill="#fca5a5" fontFamily="'Inter',sans-serif" fontSize="11.5">→ fail fast: log the error,</text>
      <text x="370" y="197" fill="#fca5a5" fontFamily="'Inter',sans-serif" fontSize="11.5">&#160;&#160;&#160;crash, restart clean</text>
      <rect x="370" y="206" width="150" height="20" rx="10" fill="rgba(248,113,113,0.14)" stroke="#7a2c2c" strokeWidth="1" />
      <text x="445" y="220" textAnchor="middle" fill="#fca5a5" fontFamily="'JetBrains Mono',monospace" fontSize="9.5" fontWeight="600">STATE UNKNOWN — CRASH</text>

      {/* shared rule */}
      <rect x="24" y="246" width="632" height="30" rx="9" fill="#0c160a" stroke="#243024" strokeWidth="1" />
      <text x="340" y="265" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">
        <tspan fill="#fbbf24" fontFamily="'JetBrains Mono',monospace">never silently swallow</tspan>
        <tspan> — an error with no trace is the worst outcome of all.</tspan>
      </text>
    </svg>
  );
}
