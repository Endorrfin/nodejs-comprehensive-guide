/* CHANGED: S17 — cross-page "jump to an anchor" without href="#id" (which would
   fight the hash router, see S12). The click sets a pending element id, the hash
   changes the route, and the target page consumes the id once it has mounted. */
let pending: string | null = null;

/** Remember an element id to scroll to after the next route change. */
export function setPendingScroll(id: string): void {
  pending = id;
}

/** Scroll to the pending id (if any) and clear it. Call from a page's mount effect. */
export function consumePendingScroll(): void {
  if (!pending) return;
  const id = pending;
  pending = null;
  // next frame: the page has painted, so the target exists and has its final offset
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "auto", block: "start" }));
}

/** In-page jump (same contract as ChapterPage's jump links). */
export function jumpTo(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** Navigate to `route` (e.g. "/glossary") and land on element `id` there —
    a plain in-page jump when that route is already showing. */
export function goToAnchor(route: string, id: string): void {
  if (typeof location !== "undefined" && location.hash === "#" + route) {
    jumpTo(id);
    return;
  }
  setPendingScroll(id);
  location.hash = "#" + route;
}
