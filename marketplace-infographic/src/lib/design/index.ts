export {
  generateComposition,
  generateDesignDNA,
  scoreComposition,
  COMPOSITION_SCENARIOS,
} from "./composition-engine";
export { planScene } from "./scene-planner";
export type { ScenePlan, ScenePlannerInput, ProductSafeZone, SafeZone } from "./scene-planner";
export { buildSceneBackgroundPrompt } from "./prompt-builder";
export { validateQuality, QUALITY_PASS_THRESHOLD } from "./quality-validator";
export { evaluateArtistic, ARTISTIC_PASS_THRESHOLD } from "./artistic-evaluator";
export { evaluateFinalQuality, FINAL_QUALITY_PASS } from "./final-quality-validator";
export type { QualityValidationResult } from "./quality-validator";
export {
  retrieveKnowledgeContext,
  collectGenerationPattern,
  preloadKnowledgeAnalysis,
  resolveKnowledgeCategory,
} from "./knowledge-engine";
export type {
  KnowledgeCategory,
  KnowledgeContext,
} from "./knowledge-engine";
export {
  retrieveMarketIntelligence,
  buildCombinedMarketPromptBlock,
  getMarketIntelligenceLayoutBoost,
  computeNoveltyScore,
  refreshCategoryMarketKnowledge,
} from "./market-intelligence";
export type { MarketIntelligenceContext } from "./market-intelligence";
export {
  retrieveAssetsIntelligence,
  renderIntelligentBadge,
  recordAssetSuccess,
  paletteColorsForSd,
  getAssetsIntelligenceLayoutBoost,
} from "./design-assets-intelligence";
export {
  retrieveGenomeIntelligence,
  saveGenerationGenome,
  buildDesignGenome,
  extractGenomeFromGeneration,
  evolveGenomeWeight,
  genomeToDnaOverride,
} from "./design-genome";
export {
  retrieveTrendIntelligence,
  runMonthlyTrendSync,
  getTrendIntelligenceLayoutBoost,
} from "./trend-intelligence";
export type { AssetsIntelligenceContext, ParametricBadgeModel } from "./design-assets-intelligence";
export type { GenomeIntelligenceContext, DesignGenomeRecord, StoryBlueprint } from "./design-genome";
export type { TrendIntelligenceContext } from "./trend-intelligence";
export {
  buildInitialLayoutSpec,
  layoutSpecFromComposition,
  applyLayoutSpecPatch,
  compileDesignInstructionsFromLayoutSpec,
  type LayoutSpec,
  type LayoutSpecPatch,
} from "./layout-spec";
export {
  computeLuxuryScore,
  validateEyeFlow,
  analyzeVisualNoise,
  runQualityGate,
  LUXURY_PASS_THRESHOLD,
  type LuxuryScoreResult,
  type QualityGateResult,
} from "./quality-v165";
export type {
  CompositionEngineInput,
  CompositionResult,
  CompositionScore,
  CompositionScenario,
  CompositionScenarioId,
  DesignDNA,
  ScenarioBiases,
} from "./types";
