import type React from "react";
import { EventLoopSim } from "../components/sims/EventLoopSim";
import { EventLoopRing } from "../components/figures/EventLoopRing";

/** Interactive widgets, referenced by key from concepts.ts sections (kind: 'sim'). */
export const SIMS: Record<string, React.FC> = {
  "event-loop": EventLoopSim,
};

/** Static diagrams, referenced by key from concepts.ts sections (kind: 'figure'). */
export const FIGURES: Record<string, React.FC> = {
  "event-loop-ring": EventLoopRing,
};
