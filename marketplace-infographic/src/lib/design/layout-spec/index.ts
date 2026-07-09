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
  stabilizeLayoutSpecWithCommercialIntent,
  deriveCommercialDecisionId,
  isCommercialLayoutIntegrationEnabled,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  COMMERCIAL_INTEGRATION_VERSION,
  KNOWN_LAYOUT_SPEC_KEYS,
  type ApplyCommercialIntentResult,
  type CommercialIntentDiagnostics,
  type CommercialLayoutDebugBundle,
} from "./commercial-layout-integration";
export {
  applyLayoutSpecPatch,
  mergeLayoutSpecPatches,
  layoutSpecToTemplatePreference,
  simplifyCardMeaningForSpec,
} from "./patches";
export {
  resolveLayoutObjectScale,
  layoutObjectScaleFromTemplate,
  COMMERCIAL_PROPAGATION_VERSION,
  type CommercialLayoutPropagationDiagnostics,
  type CommercialScaleSource,
} from "./commercial-layout-propagation";
export {
  compileDesignInstructionsFromLayoutSpec,
  compileSceneConstraintsFromLayoutSpec,
  compileLayoutSpecJson,
} from "./prompt-compiler";
