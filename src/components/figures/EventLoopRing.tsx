import React from "react";

interface Node {
  n: string;
  label: string;
  x: number;
  y: number;
  hot?: boolean;
}

const NODES: Node[] = [
  { n: "1", label: "timers", x: 340, y: 60 },
  { n: "2", label: "pending callbacks", x: 453, y: 125 },
  { n: "3", label: "idle, prepare", x: 453, y: 255 },
  { n: "4", label: "poll", x: 340, y: 320, hot: true },
  { n: "5", label: "check", x: 227, y: 255 },
  { n: "6", label: "close callbacks", x: 227, y: 125 },
];

const W = 156;
const H = 46;

/** Static, on-brand diagram of one event-loop tick (the dynamic version is the simulator). */
export function EventLoopRing(): React.ReactElement {
  return (
    <svg viewBox="0 0 680 380" width="100%" role="img" aria-label="The six phases of the event loop arranged in a clockwise ring, with poll highlighted and microtasks draining in the center.">
      <defs>
        <marker id="arr" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#3C873A" />
        </marker>
      </defs>

      {/* rotation hint */}
      <circle cx="340" cy="190" r="120" fill="none" stroke="#243024" strokeWidth="1.5" strokeDasharray="3 7" />

      {/* center */}
      <circle cx="340" cy="190" r="74" fill="#0d120c" stroke="#33402f" strokeWidth="1" />
      <text x="340" y="178" textAnchor="middle" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="15" fontWeight="700">
        EVENT LOOP
      </text>
      <text x="340" y="196" textAnchor="middle" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="10">
        libuv · 1 thread
      </text>
      <text x="340" y="214" textAnchor="middle" fill="#A78BFA" fontFamily="'JetBrains Mono',monospace" fontSize="9">
        ↻ microtasks drain
      </text>

      {NODES.map((nd) => (
        <g key={nd.n}>
          <rect
            x={nd.x - W / 2}
            y={nd.y - H / 2}
            width={W}
            height={H}
            rx="9"
            fill={nd.hot ? "#13260f" : "#111511"}
            stroke={nd.hot ? "#6CC24A" : "#33402f"}
            strokeWidth={nd.hot ? "2" : "1"}
          />
          <text
            x={nd.x - W / 2 + 14}
            y={nd.y + 1}
            fill="#6CC24A"
            fontFamily="'JetBrains Mono',monospace"
            fontSize="13"
            fontWeight="700"
          >
            {nd.n}
          </text>
          <text
            x={nd.x - W / 2 + 34}
            y={nd.y - 3}
            fill="#F4F7F4"
            fontFamily="'Space Grotesk',sans-serif"
            fontSize="13.5"
            fontWeight="600"
          >
            {nd.label}
          </text>
          {nd.hot ? (
            <text x={nd.x - W / 2 + 34} y={nd.y + 13} fill="#9CB3A0" fontFamily="'Inter',sans-serif" fontSize="9.5">
              most of your code
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}
