import React from "react";

/** Static, on-brand mental model of Node's two async paths: blocking work
    (fs/crypto/zlib/dns.lookup) goes to the libuv thread pool (default 4);
    network sockets are handled by the OS kernel with no pool thread held. */
export function ThreadPoolKernel(): React.ReactElement {
  return (
    <svg
      viewBox="0 0 680 330"
      width="100%"
      role="img"
      aria-label="One event-loop thread dispatches blocking work to the 4-thread libuv pool, while network sockets are watched by the OS kernel with no pool thread held."
    >
      <defs>
        <marker id="tpk-o" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#FF7A00" />
        </marker>
        <marker id="tpk-g" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
      </defs>

      {/* event loop thread */}
      <rect x="250" y="22" width="180" height="46" rx="10" fill="#13260f" stroke="#6CC24A" strokeWidth="1.6" />
      <text x="340" y="44" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        event loop
      </text>
      <text x="340" y="59" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        one JS thread
      </text>

      {/* split arrows */}
      <path d="M300,68 C 250,100 180,104 150,128" fill="none" stroke="#FF7A00" strokeWidth="1.8" markerEnd="url(#tpk-o)" />
      <path d="M380,68 C 430,100 500,104 530,128" fill="none" stroke="#6CC24A" strokeWidth="1.8" markerEnd="url(#tpk-g)" />
      <text x="196" y="104" textAnchor="middle" fill="#FF7A00" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        blocking work
      </text>
      <text x="492" y="104" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        network I/O
      </text>

      {/* libuv thread pool (left, orange) */}
      <rect x="28" y="132" width="286" height="150" rx="12" fill="#1a1206" stroke="#7a4a1c" strokeWidth="1.5" />
      <text x="44" y="156" fill="#FF7A00" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        libuv thread pool
      </text>
      <text x="44" y="173" fill="#caa37a" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        default 4 · UV_THREADPOOL_SIZE
      </text>
      {[0, 1, 2, 3].map((k) => (
        <g key={k}>
          <rect x={44 + k * 64} y={186} width="52" height="30" rx="6" fill="#2a1c0c" stroke="#b5611a" strokeWidth="1.2" />
          <text x={70 + k * 64} y={205} textAnchor="middle" fill="#ffb478" fontFamily="'JetBrains Mono',monospace" fontSize="10">
            T{k + 1}
          </text>
        </g>
      ))}
      <text x="44" y="240" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        fs · crypto · zlib · dns.lookup
      </text>
      <text x="44" y="258" fill="#6B7B6E" fontFamily="'Inter',sans-serif" fontSize="10">
        blocking C calls → holds a thread; extras queue
      </text>

      {/* OS kernel (right, green) */}
      <rect x="366" y="132" width="286" height="150" rx="12" fill="#0c160a" stroke="#2a5320" strokeWidth="1.5" />
      <text x="382" y="156" fill="#6CC24A" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        OS kernel
      </text>
      <text x="382" y="173" fill="#8fae86" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        epoll · kqueue · IOCP
      </text>
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <circle key={k} cx={392 + k * 42} cy={201} r="9" fill="#0f2b10" stroke="#4ade80" strokeWidth="1.2" />
      ))}
      <text x="382" y="240" fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="10.5">
        TCP/UDP sockets · HTTP
      </text>
      <text x="382" y="258" fill="#6B7B6E" fontFamily="'Inter',sans-serif" fontSize="10">
        non-blocking → no thread held; scales to thousands
      </text>

      <text x="28" y="308" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        Rule: the pool is for CPU/file/compress work — never use it to "speed up" network calls (the kernel already does).
      </text>
    </svg>
  );
}
