import React, { useEffect, useState } from "react";
import { useRoute } from "./lib/hashRouter";
import { TopBar } from "./components/layout/TopBar";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { ConceptMap } from "./components/map/ConceptMap";
import { ChapterPage } from "./components/chapter/ChapterPage";
import { InterviewPage } from "./components/pages/InterviewPage";
import { MentalModelsPage } from "./components/pages/MentalModelsPage";
import { FlashcardsPage } from "./components/pages/FlashcardsPage";
import { AboutPage } from "./components/pages/AboutPage";

export default function App(): React.ReactElement {
  const route = useRoute();
  const activeId =
    route.name === "chapter"
      ? route.id
      : route.name === "interview"
        ? "interview"
        : route.name === "mental-models"
          ? "mental-models"
          : null;

  // CHANGED: mobile chapter-nav drawer state (additive; the hamburger only shows <900px)
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    setNavOpen(false); // close the drawer on any navigation
  }, [route]);
  useEffect(() => {
    if (!navOpen) return;
    const onEsc = (e: KeyboardEvent): void => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [navOpen]);

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar route={route} onMenuOpen={() => setNavOpen(true)} />

      {route.name === "map" ? (
        <main id="main" style={{ flex: 1 }}>
          <ConceptMap />
        </main>
      ) : (
        <div className="layout">
          <Sidebar activeId={activeId} />
          <main id="main" className="main">
            {route.name === "chapter" ? <ChapterPage id={route.id} /> : null}
            {route.name === "interview" ? <InterviewPage /> : null}
            {route.name === "mental-models" ? <MentalModelsPage /> : null}
            {route.name === "flashcards" ? <FlashcardsPage /> : null}
            {route.name === "about" ? <AboutPage /> : null}
          </main>
        </div>
      )}

      {/* CHANGED: mobile-only chapter nav drawer (rendered only when open; hidden on desktop via CSS) */}
      {navOpen ? (
        <div className="drawer-backdrop" onClick={() => setNavOpen(false)}>
          <div
            className="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Chapters"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drawer-head">
              <span>Chapters</span>
              <button className="btn" onClick={() => setNavOpen(false)} aria-label="Close menu">
                ✕
              </button>
            </div>
            <Sidebar activeId={activeId} />
          </div>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}
