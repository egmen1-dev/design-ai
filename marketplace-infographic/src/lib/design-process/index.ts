export type {
  DesignProcess,
  DesignProcessFoundation,
  Stage1ProductAnalysis,
  Stage2ArtisticConcept,
  Stage3Composition,
  Stage4Typography,
  Stage5ColorSystem,
  Stage6Decorations,
  Stage7SelfReview,
  VisualHook,
  VisualHookType,
} from "./types";
export { buildFoundationStagePrompt, buildDesignStagePrompt } from "./prompts";
export { runDesignProcessPipeline, runFoundationStage } from "./pipeline";
export { buildMockFoundation } from "./mock";
export {
  applyVisualHookToDna,
  objectScaleFromHook,
  scenarioBoostFromHook,
} from "./visual-hook";
