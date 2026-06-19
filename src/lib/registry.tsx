import type React from "react";
import { EventLoopSim } from "../components/sims/EventLoopSim";
import { AsyncOrderSim } from "../components/sims/AsyncOrderSim";
import { EventLoopRing } from "../components/figures/EventLoopRing";
import { AwaitTimeline } from "../components/figures/AwaitTimeline";
import { PredictOutputQuiz } from "../components/study/PredictOutputQuiz";
import { asyncOrderingQuiz } from "../data/quizzes";

/** A concrete quiz instance, registered as a sim so chapters embed it declaratively. */
const AsyncOrderingQuiz: React.FC = () => (
  <PredictOutputQuiz
    questions={asyncOrderingQuiz}
    title="Predict the output"
    intro="Five snippets. Read the queues, call the order — then check yourself."
  />
);

/** Interactive widgets, referenced by key from concepts.ts sections (kind: 'sim'). */
export const SIMS: Record<string, React.FC> = {
  "event-loop": EventLoopSim,
  "async-order": AsyncOrderSim,
  "async-quiz": AsyncOrderingQuiz,
};

/** Static diagrams, referenced by key from concepts.ts sections (kind: 'figure'). */
export const FIGURES: Record<string, React.FC> = {
  "event-loop-ring": EventLoopRing,
  "await-timeline": AwaitTimeline,
};
