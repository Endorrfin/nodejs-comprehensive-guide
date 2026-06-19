import React from "react";

/** Ch.13 (HTTP): a keep-alive Agent keeps a small per-origin pool of open
    sockets and hands them to new requests, so the TCP (and TLS) handshake is a
    one-time cost. Without keep-alive every request re-handshakes. */
export function KeepAlivePool(): React.ReactElement {
  const sockets = [
    { y: 70, label: "socket #1", state: "reused" },
    { y: 104, label: "socket #2", state: "reused" },
    { y: 138, label: "socket #3", state: "idle" },
  ];
  return (
    <svg
      viewBox="0 0 680 250"
      width="100%"
      role="img"
      aria-label="A keep-alive Agent keeps a per-origin pool of open sockets and reuses them for new requests, skipping the TCP and TLS handshake. Without keep-alive, every request opens a new socket and pays the handshake again. Defaults: global Agent keepAlive true since Node 19, maxFreeSockets 256, scheduling lifo."
    >
      <defs>
        <marker id="ka-g" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
      </defs>

      {/* client + agent */}
      <rect x="20" y="44" width="210" height="146" rx="12" fill="#101810" stroke="#3C873A" strokeWidth="1.5" />
      <text x="34" y="66" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">Client · http.Agent</text>
      {sockets.map((s) => {
        const on = s.state === "reused";
        return (
          <g key={s.label}>
            <rect x="34" y={s.y} width="182" height="24" rx="6" fill={on ? "rgba(108,194,74,0.14)" : "rgba(0,0,0,0.28)"} stroke={on ? "#3C873A" : "#33402f"} strokeWidth="1.2" />
            <text x="44" y={s.y + 16} fill={on ? "#cdebbf" : "#6B7B6E"} fontFamily="'JetBrains Mono',monospace" fontSize="10">{s.label}</text>
            <text x="208" y={s.y + 16} textAnchor="end" fill={on ? "#4ADE80" : "#6B7B6E"} fontFamily="'JetBrains Mono',monospace" fontSize="9">{on ? "reused" : "idle · free"}</text>
          </g>
        );
      })}

      {/* reuse arrows to origin */}
      <path d="M230,82 L470,82" fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#ka-g)" />
      <path d="M230,116 L470,116" fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#ka-g)" />
      <text x="350" y="73" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">reuse open socket → no handshake</text>
      <text x="350" y="135" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">requests share the pooled connections</text>

      {/* origin */}
      <rect x="472" y="60" width="188" height="78" rx="12" fill="#101810" stroke="#3C873A" strokeWidth="1.5" />
      <text x="566" y="94" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">Origin</text>
      <text x="566" y="112" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9">host:port</text>

      {/* contrast: no keep-alive */}
      <rect x="20" y="200" width="640" height="34" rx="9" fill="#150d0d" stroke="#7a2c2c" strokeWidth="1" />
      <text x="36" y="221" fill="#fca5a5" fontFamily="'Inter',sans-serif" fontSize="11">
        <tspan fontFamily="'JetBrains Mono',monospace">Connection: close</tspan>
        <tspan fill="#9CB3A0"> — new socket + TCP</tspan>
        <tspan> (and TLS) </tspan>
        <tspan fill="#9CB3A0">handshake on every request. globalAgent keepAlive:true since Node 19.</tspan>
      </text>
    </svg>
  );
}
