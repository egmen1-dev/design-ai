export type {
  LayoutSpec,
  LayoutSpecPatch,
  HeroPosition,
  BackgroundStyle,
  LightingStyle,
  VisualWeightMap,
} from "./types";
export { LAYOUT_SPEC_DEFAULTS } from "./types";
export { buildInitialLayoutSpec, layoutSpecFromComposition } from "./builder";
export {
  applyLayoutSpecPatch,
  mergeLayoutSpecPatches,
  layoutSpecToTemplatePreference,
  simplifyCardMeaningForSpec,
} from "./patches";
export {
  compileDesignInstructionsFromLayoutSpec,
  compileSceneConstraintsFromLayoutSpec,
  compileLayoutSpecJson,
} from "./prompt-compiler";
