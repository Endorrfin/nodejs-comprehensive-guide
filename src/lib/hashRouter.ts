import { useEffect, useState } from "react";

export type Route =
  | { name: "map" }
  | { name: "chapter"; id: string }
  | { name: "interview" }
  | { name: "mental-models" }
  | { name: "flashcards" }
  | { name: "about" };

export function parseHash(raw: string): Route {
  const h = raw.replace(/^#/, "").replace(/^\/+/, "");
  const [seg, a] = h.split("/");
  if (seg === "chapter" && a) return { name: "chapter", id: decodeURIComponent(a) };
  if (seg === "interview") return { name: "interview" };
  if (seg === "mental-models") return { name: "mental-models" };
  if (seg === "flashcards") return { name: "flashcards" };
  if (seg === "about") return { name: "about" };
  return { name: "map" };
}

/** Subscribe to hash-based routing. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/** Programmatic navigation. `to` is a route path like "/chapter/event-loop". */
export function go(to: string): void {
  const target = to.startsWith("#") ? to : "#" + to;
  if (location.hash === target) window.scrollTo({ top: 0, behavior: "auto" });
  else location.hash = target;
}
