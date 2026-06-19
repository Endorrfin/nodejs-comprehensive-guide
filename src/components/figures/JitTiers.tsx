import React from "react";

/** Mental-model figure (V8/GC): the JIT tier pipeline —
    Ignition → Sparkplug → Maglev → TurboFan, with deopt falling back down. */
export function JitTiers(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 680 248"
      width="100%"
      role="img"
      aria-label="V8's compilation tiers, left to right, getting hotter and more optimized: Ignition (bytecode interpreter), Sparkplug (fast baseline compiler), Maglev (mid-tier optimizer, default in Node 22), TurboFan (top optimizing compiler). Hot code tiers up on speculative type assumptions. If a hidden-class or shape assumption breaks, V8 deoptimizes and falls back to a lower tier."
    >
      <text x="24" y="24" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="600">
        V8 tiers hot code up
      </text>
      <text x="656" y="24" textAnchor="end" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">hotter / more optimized →</text>

      {/* tier boxes */}
      {/* Ignition (cool) */}
      <rect x="24" y="44" width="150" height="74" rx="11" fill="#11140f" stroke="#3a4a3a" strokeWidth="1.5" />
      <text x="99" y="74" textAnchor="middle" fill="#cbd5cf" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="700">Ignition</text>
      <text x="99" y="94" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">bytecode</text>
      <text x="99" y="108" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">interpreter</text>

      {/* Sparkplug */}
      <rect x="188" y="44" width="150" height="74" rx="11" fill="#0d150c" stroke="#3C873A" strokeWidth="1.5" />
      <text x="263" y="74" textAnchor="middle" fill="#4ADE80" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="700">Sparkplug</text>
      <text x="263" y="94" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">baseline</text>
      <text x="263" y="108" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">fast compile</text>

      {/* Maglev */}
      <rect x="352" y="44" width="150" height="74" rx="11" fill="#15120a" stroke="#8a6d2c" strokeWidth="1.5" />
      <text x="427" y="74" textAnchor="middle" fill="#fbbf24" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="700">Maglev</text>
      <text x="427" y="94" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">mid-tier</text>
      <text x="427" y="108" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">default in Node 22</text>

      {/* TurboFan (hot) */}
      <rect x="516" y="44" width="150" height="74" rx="11" fill="#170f0a" stroke="#9a4d10" strokeWidth="1.5" />
      <text x="591" y="74" textAnchor="middle" fill="#ff9a4d" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="700">TurboFan</text>
      <text x="591" y="94" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">optimizing</text>
      <text x="591" y="108" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10">speculative</text>

      {/* forward arrows between tiers */}
      <text x="181" y="86" textAnchor="middle" fill="#6B7B6E" fontFamily="'Inter',sans-serif" fontSize="14">→</text>
      <text x="345" y="86" textAnchor="middle" fill="#6B7B6E" fontFamily="'Inter',sans-serif" fontSize="14">→</text>
      <text x="509" y="86" textAnchor="middle" fill="#6B7B6E" fontFamily="'Inter',sans-serif" fontSize="14">→</text>

      {/* deopt arrow: TurboFan back down to Ignition */}
      <path d="M 591 118 C 591 168, 99 168, 99 122" fill="none" stroke="#f87171" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#deoptArrow)" />
      <defs>
        <marker id="deoptArrow" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#f87171" />
        </marker>
      </defs>
      <rect x="232" y="150" width="216" height="22" rx="11" fill="#150d0d" stroke="#7a2c2c" strokeWidth="1" />
      <text x="340" y="165" textAnchor="middle" fill="#fca5a5" fontFamily="'JetBrains Mono',monospace" fontSize="10" fontWeight="600">deopt → fall back a tier</text>

      <text x="340" y="208" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">
        Tiers up on speculative type assumptions about your objects&#8217; shapes.
      </text>
      <text x="340" y="226" textAnchor="middle" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">
        Break a hidden-class assumption (polymorphic shapes) and V8 deoptimizes back down.
      </text>
    </svg>
  );
}
