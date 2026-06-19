import React from "react";

/** Ch.15 (Security): your real attack surface isn't the code you wrote — it's
    the transitive dependency tree you run. You review a handful of direct deps;
    npm install pulls in hundreds to thousands of transitive ones, any of which
    Node will execute with full trust. Red tags mark the real injection points
    from the 2025–26 attack wave. */
export function SupplyChainTrust(): React.ReactElement {
  const injects = [
    { x: 250, y: 36, t: "phished maintainer" },
    { x: 250, y: 150, t: "typosquat name" },
    { x: 458, y: 30, t: "postinstall script" },
    { x: 470, y: 196, t: "stolen CI token" },
  ];
  return (
    <svg
      viewBox="0 0 680 236"
      width="100%"
      role="img"
      aria-label="Your application is a small box of code you wrote and reviewed. It depends on a dozen direct dependencies, which pull in well over a thousand transitive dependencies that Node executes with full trust. Attackers inject malicious code at several points: a phished maintainer account, a typosquatted package name, a postinstall lifecycle script, or a stolen CI publishing token. You audit a handful of packages but run them all."
    >
      {/* your app */}
      <rect x="20" y="92" width="150" height="56" rx="11" fill="#101810" stroke="#6CC24A" strokeWidth="1.6" />
      <text x="95" y="116" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">Your app</text>
      <text x="95" y="133" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">code you reviewed</text>

      <path d="M170,120 L228,120" fill="none" stroke="#3C873A" strokeWidth="2" />

      {/* direct deps */}
      <rect x="230" y="86" width="150" height="68" rx="11" fill="#101810" stroke="#3C873A" strokeWidth="1.4" />
      <text x="305" y="110" textAnchor="middle" fill="#cdebbf" fontFamily="'Space Grotesk',sans-serif" fontSize="12.5" fontWeight="600">~12 direct deps</text>
      <text x="305" y="128" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">you chose these</text>
      <text x="305" y="143" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">package.json</text>

      <path d="M380,120 L438,120" fill="none" stroke="#7a2c2c" strokeWidth="2" />

      {/* transitive cloud */}
      <rect x="440" y="64" width="220" height="112" rx="13" fill="#150d0d" stroke="#7a2c2c" strokeWidth="1.5" />
      <text x="550" y="92" textAnchor="middle" fill="#fca5a5" fontFamily="'Space Grotesk',sans-serif" fontSize="14" fontWeight="700">1,400+ transitive deps</text>
      <text x="550" y="112" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">you never read them — but Node runs them all</text>
      {/* dots suggesting many packages */}
      {Array.from({ length: 24 }).map((_, i) => (
        <circle key={i} cx={460 + (i % 8) * 26} cy={130 + Math.floor(i / 8) * 14} r="3" fill={i % 7 === 0 ? "#f87171" : "#3a4a37"} />
      ))}
      <text x="550" y="170" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">each runs with full trust · any can ship a postinstall script</text>

      {/* injection markers */}
      {injects.map((m) => (
        <g key={m.t}>
          <rect x={m.x} y={m.y} width={m.t.length * 5.6 + 16} height="18" rx="9" fill="rgba(248,113,113,0.14)" stroke="#b45454" strokeWidth="1" />
          <text x={m.x + 8} y={m.y + 13} fill="#fbb4b4" fontFamily="'JetBrains Mono',monospace" fontSize="9">⚠ {m.t}</text>
        </g>
      ))}

      <text x="20" y="214" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="11">
        Node trusts any code it runs. You audit a dozen packages and execute over a thousand — that gap is the supply chain.
      </text>
    </svg>
  );
}
