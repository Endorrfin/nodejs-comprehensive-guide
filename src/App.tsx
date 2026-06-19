import React from "react";
import { useRoute } from "./lib/hashRouter";
import { TopBar } from "./components/layout/TopBar";
import { Sidebar } from "./components/layout/Sidebar";
import { Footer } from "./components/layout/Footer";
import { ConceptMap } from "./components/map/ConceptMap";
import { ChapterPage } from "./components/chapter/ChapterPage";
import { InterviewPage } from "./components/pages/InterviewPage";
import { MentalModelsPage } from "./components/pages/MentalModelsPage";
import { FlashcardsPage } from "./components/pages/FlashcardsPage";

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

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <TopBar route={route} />

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
          </main>
        </div>
      )}

      <Footer />
    </div>
  );
}
