import React from "react";

/** Mental-model figure (modules): the same diamond graph loaded two ways —
    CJS synchronous depth-first execute-on-require vs ESM parse → link → evaluate. */
export function ModuleLoadCompare(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 680 300"
      width="100%"
      role="img"
      aria-label="The same diamond dependency graph, loaded two ways. CommonJS: synchronous and depth-first; require() runs and evaluates a module inline; load and evaluation are interleaved; modules are cached by resolved path; a circular require sees partial exports. ES Modules: asynchronous in three phases — parse, then link (wire up bindings), then evaluate in post-order; bindings are live, not copies; a circular import is hoisted and TDZ-safe. require of an ES module is unflagged since Node 22.12, except for graphs that use top-level await."
    >
      <text x="340" y="24" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="600">
        Same diamond graph — two loaders
      </text>
      <text x="340" y="42" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">app → &#123;a, b&#125; → base &#160;·&#160; base must evaluate once</text>

      {/* CJS panel (green) */}
      <rect x="24" y="54" width="306" height="190" rx="12" fill="#0d150c" stroke="#3C873A" strokeWidth="1.5" />
      <text x="44" y="82" fill="#4ADE80" fontFamily="'Space Grotesk',sans-serif" fontSize="13.5" fontWeight="700">CommonJS — require()</text>
      <text x="44" y="100" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">synchronous · depth-first</text>
      <line x1="44" y1="112" x2="310" y2="112" stroke="#243024" strokeWidth="1" />
      <text x="44" y="134" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ runs &amp; evaluates ON require()</text>
      <text x="44" y="156" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ load + eval interleaved</text>
      <text x="44" y="178" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ cached by resolved path</text>
      <text x="44" y="200" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ exports is a value copy</text>
      <rect x="44" y="214" width="220" height="20" rx="10" fill="rgba(248,113,113,0.12)" stroke="#7a2c2c" strokeWidth="1" />
      <text x="154" y="228" textAnchor="middle" fill="#fca5a5" fontFamily="'JetBrains Mono',monospace" fontSize="9">circular → partial exports</text>

      {/* ESM panel (blue) */}
      <rect x="350" y="54" width="306" height="190" rx="12" fill="#0b1418" stroke="#2b6f8f" strokeWidth="1.5" />
      <text x="370" y="82" fill="#7dd3fc" fontFamily="'Space Grotesk',sans-serif" fontSize="13.5" fontWeight="700">ES Modules — import</text>
      <text x="370" y="100" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">asynchronous · 3 phases</text>
      <line x1="370" y1="112" x2="636" y2="112" stroke="#1e3a44" strokeWidth="1" />
      <text x="370" y="134" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">1 parse → 2 link → 3 evaluate</text>
      <text x="370" y="156" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ post-order evaluation</text>
      <text x="370" y="178" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ live bindings (not copies)</text>
      <text x="370" y="200" fill="#F4F7F4" fontFamily="'Inter',sans-serif" fontSize="11.5">→ base still evaluates once</text>
      <rect x="370" y="214" width="210" height="20" rx="10" fill="rgba(125,211,252,0.10)" stroke="#2b6f8f" strokeWidth="1" />
      <text x="475" y="228" textAnchor="middle" fill="#7dd3fc" fontFamily="'JetBrains Mono',monospace" fontSize="9">circular → hoisted, TDZ-safe</text>

      {/* shared note */}
      <rect x="24" y="260" width="632" height="30" rx="9" fill="#0c160a" stroke="#243024" strokeWidth="1" />
      <text x="340" y="279" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">
        <tspan fill="#fbbf24" fontFamily="'JetBrains Mono',monospace">require(esm)</tspan>
        <tspan> unflagged since Node 22.12 — except graphs using top-level await.</tspan>
      </text>
    </svg>
  );
}
