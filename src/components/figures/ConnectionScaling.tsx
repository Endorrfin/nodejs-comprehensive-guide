import React from "react";

/** The C10k contrast: holding 10,000 concurrent connections two ways.
    Left (orange) thread-per-request — one OS thread each, memory grows with N.
    Right (green) event loop — one thread watches every socket via the kernel,
    memory stays flat. Shared memory-bar scale makes the blow-up legible. */
export function ConnectionScaling(): React.ReactElement {
  const clients = [0, 1, 2, 3];
  const grid = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  return (
    <svg viewBox="0 0 680 300" width="100%" role="img" aria-label="Holding 10,000 concurrent connections: thread-per-request needs 10,000 threads and about 10 GiB, while the event loop watches every socket on one thread via the OS kernel in about 0.65 GiB.">
      <defs>
        <marker id="cs-o" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#FF7A00" />
        </marker>
        <marker id="cs-g" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
      </defs>

      <line x1="340" y1="18" x2="340" y2="282" stroke="#243024" strokeWidth="1" strokeDasharray="3 4" />

      {/* ---------------- LEFT: thread-per-request ---------------- */}
      <text x="20" y="32" fill="#FF7A00" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">thread-per-request</text>
      <text x="20" y="48" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">10,000 connections → 10,000 threads</text>

      {clients.map((k) => {
        const y = 78 + k * 36;
        return (
          <g key={k}>
            <circle cx="32" cy={y} r="6.5" fill="#0c160a" stroke="#9CB3A0" strokeWidth="1.2" />
            <line x1="41" y1={y} x2="74" y2={y} stroke="#FF7A00" strokeWidth="1.6" markerEnd="url(#cs-o)" />
            <rect x="80" y={y - 11} width="92" height="22" rx="5" fill="#1a1206" stroke="#7a4a1c" strokeWidth="1.3" />
            <text x="126" y={y + 4} textAnchor="middle" fill="#ffb478" fontFamily="'JetBrains Mono',monospace" fontSize="10">thread #{k + 1}</text>
          </g>
        );
      })}
      <text x="126" y="232" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="11">⋮</text>
      <text x="80" y="252" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">+ 9,996 more threads</text>

      {/* memory bar (tall) */}
      <rect x="262" y="70" width="34" height="170" rx="5" fill="rgba(0,0,0,0.3)" stroke="#33402f" strokeWidth="1" />
      <rect x="264" y="76" width="30" height="162" rx="4" fill="rgba(255,122,0,0.5)" />
      <text x="279" y="64" textAnchor="middle" fill="#FF7A00" fontFamily="'Space Grotesk',sans-serif" fontSize="12" fontWeight="700">≈10 GiB</text>
      <text x="279" y="254" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">memory</text>

      {/* ---------------- RIGHT: event loop ---------------- */}
      <text x="360" y="32" fill="#6CC24A" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">event loop (Node)</text>
      <text x="360" y="48" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">10,000 connections → 1 thread</text>

      {/* client grid */}
      {grid.map((k) => {
        const col = k % 4;
        const row = Math.floor(k / 4);
        return <circle key={k} cx={372 + col * 17} cy={76 + row * 18} r="5.5" fill="#0c160a" stroke="#9CB3A0" strokeWidth="1.1" />;
      })}
      <text x="372" y="146" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">10,000 sockets</text>

      {/* converge into kernel */}
      <line x1="440" y1="100" x2="476" y2="120" stroke="#6CC24A" strokeWidth="1.6" markerEnd="url(#cs-g)" />
      <rect x="480" y="108" width="150" height="26" rx="7" fill="#0c160a" stroke="#2a5320" strokeWidth="1.4" />
      <text x="555" y="125" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="10">OS kernel · epoll/kqueue</text>

      {/* down to single thread */}
      <line x1="555" y1="134" x2="555" y2="160" stroke="#6CC24A" strokeWidth="1.6" markerEnd="url(#cs-g)" />
      <rect x="486" y="166" width="138" height="28" rx="7" fill="#0f1d0c" stroke="#3C873A" strokeWidth="1.6" />
      <text x="555" y="184" textAnchor="middle" fill="#cdebbf" fontFamily="'JetBrains Mono',monospace" fontSize="10">1 event-loop thread</text>

      {/* memory bar (short) */}
      <rect x="372" y="170" width="34" height="70" rx="5" fill="rgba(0,0,0,0.3)" stroke="#33402f" strokeWidth="1" />
      <rect x="374" y="226" width="30" height="12" rx="4" fill="rgba(108,194,74,0.55)" />
      <text x="389" y="164" textAnchor="middle" fill="#6CC24A" fontFamily="'Space Grotesk',sans-serif" fontSize="12" fontWeight="700">≈0.65 GiB</text>
      <text x="389" y="254" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">memory</text>

      <text x="360" y="278" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">~64 KiB/socket vs ~1 MiB/thread — a thread costs ~16× a socket.</text>
    </svg>
  );
}
