import React from "react";

/** Ch.17 (Express): the middleware pipeline. A request walks an ORDERED stack
    of (req, res, next) layers — each runs and passes on with next(), responds
    (ending the walk), or errors. throw / next(err) jumps over every regular
    layer into the 4-arg error lane; an unmatched request falls off the end
    into the built-in 404. Registration order IS the control flow. */
export function MiddlewarePipeline(): React.ReactElement {
  const layers = [
    { x: 96, label: "app.use(logger)", sub: "every request" },
    { x: 236, label: "app.use('/api', auth)", sub: "only /api/*" },
    { x: 376, label: "app.get('/api/users')", sub: "method + path" },
  ];
  return (
    <svg
      viewBox="0 0 680 300"
      width="100%"
      role="img"
      aria-label="The Express middleware pipeline. A request enters an ordered stack: logger middleware, auth middleware mounted on /api, then the route handler, which sends the response. Each layer calls next() to pass the request on. A throw or next(err) from any layer jumps over all remaining regular layers into the 4-argument error middleware, which answers 500. A request that matches nothing falls off the end of the stack into the built-in final handler, which answers 404 Cannot GET."
    >
      <defs>
        <marker id="mp-g" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#6CC24A" />
        </marker>
        <marker id="mp-r" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#F87171" />
        </marker>
        <marker id="mp-b" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#38BDF8" />
        </marker>
      </defs>

      {/* request in */}
      <text x="20" y="76" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="11">req</text>
      <path d="M46,72 L92,72" fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#mp-g)" />

      {/* the ordered regular layers */}
      {layers.map((l, i) => (
        <g key={l.label}>
          <rect x={l.x} y="44" width="128" height="56" rx="10" fill="#101810" stroke="#3C873A" strokeWidth="1.5" />
          <text x={l.x + 64} y="68" textAnchor="middle" fill="#F4F7F4" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">{l.label}</text>
          <text x={l.x + 64} y="86" textAnchor="middle" fill="#6B7B6E" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">{l.sub}</text>
          {i < layers.length - 1 ? (
            <>
              <path d={`M${l.x + 128},72 L${layers[i + 1].x - 4},72`} fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#mp-g)" />
              <text x={l.x + 132} y="62" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">next()</text>
            </>
          ) : null}
        </g>
      ))}

      {/* response out */}
      <path d="M504,72 L560,72" fill="none" stroke="#6CC24A" strokeWidth="2" markerEnd="url(#mp-g)" />
      <text x="508" y="62" fill="#6CC24A" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">res.json()</text>
      <rect x="564" y="52" width="96" height="40" rx="10" fill="rgba(108,194,74,0.14)" stroke="#3C873A" strokeWidth="1.5" />
      <text x="612" y="76" textAnchor="middle" fill="#4ADE80" fontFamily="'JetBrains Mono',monospace" fontSize="11">200 res</text>

      {/* order note */}
      <text x="340" y="26" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">registration order = execution order — an ordered array of (req, res, next)</text>

      {/* error lane */}
      <path d="M440,100 C 440,150 330,140 300,166" fill="none" stroke="#F87171" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#mp-r)" />
      <text x="452" y="132" fill="#F87171" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">throw · next(err) · rejected async (v5)</text>
      <rect x="168" y="168" width="228" height="52" rx="10" fill="rgba(248,113,113,0.07)" stroke="#7f1d1d" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="282" y="190" textAnchor="middle" fill="#F87171" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">app.use((err, req, res, next))</text>
      <text x="282" y="207" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">4 args — selected by ARITY · skips all regular layers</text>
      <path d="M396,194 L560,194 L560,100" fill="none" stroke="#F87171" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#mp-r)" />
      <text x="470" y="186" fill="#F87171" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">500 (err.status ?? 500)</text>

      {/* 404 fallthrough */}
      <path d="M160,100 C 130,150 120,220 150,252" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#mp-b)" />
      <text x="30" y="180" fill="#38BDF8" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">nothing matched,</text>
      <text x="30" y="192" fill="#38BDF8" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">nothing responded</text>
      <rect x="156" y="238" width="240" height="40" rx="10" fill="rgba(56,189,248,0.06)" stroke="#155e75" strokeWidth="1.5" strokeDasharray="6 4" />
      <text x="276" y="255" textAnchor="middle" fill="#38BDF8" fontFamily="'JetBrains Mono',monospace" fontSize="9.5">built-in final handler</text>
      <text x="276" y="270" textAnchor="middle" fill="#9CB3A0" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">404 · Cannot GET /nope — a miss is NOT an error</text>
      <path d="M396,258 L600,258 L600,206" fill="none" stroke="#38BDF8" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#mp-b)" />
      <text x="590" y="234" textAnchor="end" fill="#38BDF8" fontFamily="'JetBrains Mono',monospace" fontSize="8.5">404 res</text>
      {/* CHANGED: S13 living figure — a req token walks the ordered chain, dwelling in each layer
          (base opacity 0 in CSS, so prefers-reduced-motion shows the static figure unchanged) */}
      <circle className="mp-token" cx="50" cy="72" r="5" fill="#4ADE80" />
    </svg>
  );
}
