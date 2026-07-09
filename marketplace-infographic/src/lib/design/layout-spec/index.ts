export type {
  LayoutSpec,
  LayoutSpecPatch,
  HeroPosition,
  BackgroundStyle,
  LightingStyle,
  VisualWeightMap,
  BackgroundPalettePreference,
  ScenePreference,
  CommercialLayoutDiagnostics,
} from "./types";
export { LAYOUT_SPEC_DEFAULTS } from "./types";
export { buildInitialLayoutSpec, layoutSpecFromComposition } from "./builder";
export {
  applyCommercialIntentToLayoutSpec,
  deriveCommercialDecisionId,
  isCommercialLayoutIntegrationEnabled,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  LAYOUT_COMMERCIAL_VERSION,
  type ApplyCommercialIntentResult,
  type CommercialLayoutDebugBundle,
} from "./commercial-layout-integration";
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
