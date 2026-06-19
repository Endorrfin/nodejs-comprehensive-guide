import React from "react";

export function Footer(): React.ReactElement {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span
          className="flag"
          aria-hidden="true"
          style={{ background: "linear-gradient(to bottom, #0057B7 0 50%, #FFD700 50% 100%)" }}
        />
        <strong style={{ color: "var(--tx)", fontWeight: 600 }}>Vasyl Krupka</strong>
        <span className="sep">·</span>
        <span>Senior Fullstack Engineer · Ukraine</span>
        <span className="sep">·</span>
        <a
          className="flink"
          href="https://www.linkedin.com/in/vasyl-krupka/"
          target="_blank"
          rel="noreferrer noopener"
        >
          LinkedIn ↗
        </a>
        <span className="src">
          Facts verified against Node.js · libuv · V8 docs. Built with Vite + React + TypeScript.
        </span>
      </div>
    </footer>
  );
}
