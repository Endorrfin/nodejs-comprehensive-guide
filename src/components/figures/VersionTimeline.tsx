import React from "react";

/** Ch.17 (Modern Node): the release-line lifecycles on one time axis, with a
    "today" marker (mid-2026). The picture's point: 18 and 20 have ended, 22 is
    in maintenance, 24 is the Active-LTS line to build on, and 26 is Current and
    reaches furthest. Dates are the published support windows (web-verified). */
export function VersionTimeline(): React.ReactElement {
  const X0 = 72;
  const PXY = 82; // px per year
  const baseYear = 2022;
  const xFor = (y: number): number => X0 + (y - baseYear) * PXY;

  const rows = [
    { major: 26, start: 2026.33, end: 2029.33, color: "#4ADE80", status: "Current", cy: 58 },
    { major: 24, start: 2025.33, end: 2028.33, color: "#6CC24A", status: "Active LTS", cy: 94, highlight: true },
    { major: 22, start: 2024.33, end: 2027.33, color: "#38BDF8", status: "Maintenance LTS", cy: 130 },
    { major: 20, start: 2023.33, end: 2026.33, color: "#F87171", status: "EOL", cy: 166 },
    { major: 18, start: 2022.33, end: 2025.33, color: "#9CB3A0", status: "EOL", cy: 202 },
  ];
  const todayX = xFor(2026.46);
  const years = [2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];

  return (
    <svg
      viewBox="0 0 720 250"
      width="100%"
      role="img"
      aria-label="Node.js release-line lifecycles on a time axis from 2022 to 2029, with a 'today' marker at mid-2026. Node 18 ended in 2025 and Node 20 at the end of April 2026 (both end-of-life). Node 22 is in maintenance LTS until 2027. Node 24 is the Active LTS line to build on, supported into 2028. Node 26 is the Current line, reaching into 2029. The lesson: target Node 24 for new production today."
    >
      <text x="20" y="26" fill="#F4F7F4" fontFamily="'Space Grotesk',sans-serif" fontSize="13" fontWeight="600">
        release lines over time →
      </text>

      {/* today marker */}
      <line x1={todayX} y1="40" x2={todayX} y2="216" stroke="#4ADE80" strokeWidth="1.4" strokeDasharray="4 4" />
      <text x={todayX} y="36" textAnchor="middle" fill="#4ADE80" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
        today · Jun 2026
      </text>

      {rows.map((r) => {
        const x = xFor(r.start);
        const w = xFor(r.end) - x;
        const ended = r.end <= 2026.46;
        return (
          <g key={r.major}>
            <text x="20" y={r.cy + 4} fill={r.highlight ? "#F4F7F4" : "#9CB3A0"} fontFamily="'Space Grotesk',sans-serif" fontSize="12" fontWeight={r.highlight ? 700 : 500}>
              Node {r.major}
            </text>
            <rect
              x={x}
              y={r.cy - 11}
              width={w}
              height={22}
              rx="6"
              fill={ended ? "rgba(255,255,255,0.03)" : `${r.color}1f`}
              stroke={r.color}
              strokeWidth={r.highlight ? 2.2 : 1.3}
              opacity={ended ? 0.7 : 1}
            />
            <text x={x + w / 2} y={r.cy + 4} textAnchor="middle" fill={ended ? "#6B7B6E" : r.color} fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
              {r.status}
            </text>
            {r.highlight ? (
              <text x={xFor(r.end) + 8} y={r.cy + 4} fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">
                ◀ build here
              </text>
            ) : null}
          </g>
        );
      })}

      {/* year axis */}
      <line x1={X0} y1="220" x2={xFor(2029)} y2="220" stroke="#243024" strokeWidth="1" />
      {years.map((y) => (
        <g key={y}>
          <line x1={xFor(y)} y1="217" x2={xFor(y)} y2="223" stroke="#33402f" strokeWidth="1" />
          <text x={xFor(y)} y="238" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="9">
            {y}
          </text>
        </g>
      ))}
    </svg>
  );
}
