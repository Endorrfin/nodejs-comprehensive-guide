import React from "react";

/** Ch.16 (Production): the graceful-shutdown timeline. The orchestrator removes
    the pod from its Service (no new traffic), runs an optional preStop sleep,
    then sends SIGTERM and starts a grace-period countdown to SIGKILL. Your
    process must use that window to fail readiness, stop accepting, drain
    in-flight work, close resources, and exit(0) — with a force-exit timer as a
    backstop. Green = clean steps; red = the SIGKILL you must finish before. */
export function ShutdownSequence(): React.ReactElement {
  const k8s = [
    { x: 150, t: "remove from", t2: "Service endpoints" },
    { x: 300, t: "preStop sleep", t2: "(let routes settle)" },
    { x: 450, t: "SIGTERM", t2: "→ your process" },
    { x: 600, t: "SIGKILL", t2: "if still alive", kill: true },
  ];
  const proc = [
    { x: 150, t: "catch SIGTERM", t2: "handler runs" },
    { x: 268, t: "fail /readyz", t2: "503 → LB stops" },
    { x: 386, t: "server.close()", t2: "stop accepting" },
    { x: 504, t: "drain in-flight", t2: "finish + flush" },
    { x: 600, t: "close & exit(0)", t2: "pools, then exit" },
  ];
  return (
    <svg
      viewBox="0 0 680 250"
      width="100%"
      role="img"
      aria-label="Two timelines. The Kubernetes lane: remove the pod from Service endpoints, an optional preStop sleep, send SIGTERM, then SIGKILL after the grace period if the process is still alive. The process lane, which must finish within the grace period: catch SIGTERM, fail the readiness probe so the load balancer stops sending traffic, call server.close to stop accepting new connections, drain in-flight requests until they finish and flush, then close pools and exit zero. A force-exit timer is the backstop if draining hangs."
    >
      {/* lane labels */}
      <text x="16" y="44" fill="#9CB3A0" fontFamily="'Space Grotesk',sans-serif" fontSize="11" fontWeight="600">Kubernetes</text>
      <text x="16" y="150" fill="#9CB3A0" fontFamily="'Space Grotesk',sans-serif" fontSize="11" fontWeight="600">Your process</text>

      {/* lane baselines */}
      <line x1="120" y1="58" x2="660" y2="58" stroke="#33402f" strokeWidth="1" />
      <line x1="120" y1="164" x2="660" y2="164" stroke="#33402f" strokeWidth="1" />

      {/* k8s steps */}
      {k8s.map((s) => (
        <g key={s.t}>
          <rect x={s.x - 56} y="30" width="112" height="40" rx="8" fill={s.kill ? "#150d0d" : "#101810"} stroke={s.kill ? "#b45454" : "#3C873A"} strokeWidth="1.3" />
          <text x={s.x} y="48" textAnchor="middle" fill={s.kill ? "#fca5a5" : "#cdebbf"} fontFamily="'JetBrains Mono',monospace" fontSize="9.5">{s.t}</text>
          <text x={s.x} y="61" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8">{s.t2}</text>
        </g>
      ))}

      {/* process steps */}
      {proc.map((s, i) => (
        <g key={s.t}>
          <rect x={s.x - 54} y="136" width="108" height="40" rx="8" fill="#101810" stroke={i === proc.length - 1 ? "#6CC24A" : "#3C873A"} strokeWidth={i === proc.length - 1 ? 1.7 : 1.2} />
          <text x={s.x} y="154" textAnchor="middle" fill="#cdebbf" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">{s.t}</text>
          <text x={s.x} y="167" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8">{s.t2}</text>
        </g>
      ))}

      {/* SIGTERM → catch link */}
      <path d="M450,72 L450,100 L150,100 L150,134" fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3" />
      <text x="300" y="95" textAnchor="middle" fill="#38BDF8" fontFamily="'JetBrains Mono',monospace" fontSize="9">SIGTERM starts your shutdown</text>

      {/* grace period bracket */}
      <path d="M450,84 L600,84" fill="none" stroke="#9CB3A0" strokeWidth="1" markerEnd="" />
      <text x="525" y="80" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">grace period (default 30s)</text>

      {/* backstop note */}
      <rect x="120" y="198" width="540" height="34" rx="8" fill="#0e140d" stroke="#243024" strokeWidth="1" />
      <text x="134" y="219" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        <tspan fill="#4ADE80" fontFamily="'JetBrains Mono',monospace">setTimeout(()=&gt;process.exit(1), 10_000).unref()</tspan>
        <tspan> — force-exit backstop if a request hangs, so you never wait for SIGKILL.</tspan>
      </text>
    </svg>
  );
}
