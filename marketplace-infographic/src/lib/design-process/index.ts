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
export { runDesignProcessPipeline, runCreativeDirectorStage, applyPosterRules } from "./pipeline";
export type { DesignProcessResult } from "./pipeline";
export { buildCreativeDirectorPrompt } from "./creative-director-prompt";
export {
  buildMockCreativeDirector,
  sanitizeCreativeConcept,
  sanitizeOneThought,
  type CreativeConcept,
  type CreativeDirectorResult,
  type OneThought,
} from "./creative-concept";
export { buildMockFoundation } from "./mock";
export {
  applyVisualHookToDna,
  objectScaleFromHook,
  scenarioBoostFromHook,
} from "./visual-hook";
