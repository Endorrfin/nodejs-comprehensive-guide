import type React from "react";
import { EventLoopSim } from "../components/sims/EventLoopSim";
import { AsyncOrderSim } from "../components/sims/AsyncOrderSim";
import { GcSim } from "../components/sims/GcSim";
import { ThreadPoolSim } from "../components/sims/ThreadPoolSim";
import { BackpressureSim } from "../components/sims/BackpressureSim";
import { ModuleResolverSim } from "../components/sims/ModuleResolverSim";
import { EventLoopRing } from "../components/figures/EventLoopRing";
import { AwaitTimeline } from "../components/figures/AwaitTimeline";
import { GcHeap } from "../components/figures/GcHeap";
import { ThreadPoolKernel } from "../components/figures/ThreadPoolKernel";
import { StreamPipeline } from "../components/figures/StreamPipeline";
import { PredictOutputQuiz } from "../components/study/PredictOutputQuiz";
import { asyncOrderingQuiz, concurrencyQuiz, modulesQuiz } from "../data/quizzes";

/** A concrete quiz instance, registered as a sim so chapters embed it declaratively. */
const AsyncOrderingQuiz: React.FC = () => (
  <PredictOutputQuiz
    questions={asyncOrderingQuiz}
    title="Predict the output"
    intro="Five snippets. Read the queues, call the order — then check yourself."
  />
);

const ConcurrencyQuiz: React.FC = () => (
  <PredictOutputQuiz
    questions={concurrencyQuiz}
    title="Predict the output"
    intro="The thread pool and the kernel make some orders guaranteed and others not. Call each one."
  />
);

const ModulesQuiz: React.FC = () => (
  <PredictOutputQuiz
    questions={modulesQuiz}
    title="Predict the output"
    intro="Cache, live bindings and circular loads — where CJS and ESM quietly differ. Call each one."
  />
);

/** Interactive widgets, referenced by key from concepts.ts sections (kind: 'sim'). */
export const SIMS: Record<string, React.FC> = {
  "event-loop": EventLoopSim,
  "async-order": AsyncOrderSim,
  "async-quiz": AsyncOrderingQuiz,
  gc: GcSim,
  "thread-pool": ThreadPoolSim,
  "concurrency-quiz": ConcurrencyQuiz,
  backpressure: BackpressureSim,
  "module-resolver": ModuleResolverSim,
  "modules-quiz": ModulesQuiz,
};

/** Static diagrams, referenced by key from concepts.ts sections (kind: 'figure'). */
export const FIGURES: Record<string, React.FC> = {
  "event-loop-ring": EventLoopRing,
  "await-timeline": AwaitTimeline,
  "gc-heap": GcHeap,
  "thread-pool-kernel": ThreadPoolKernel,
  "stream-pipeline": StreamPipeline,
};
