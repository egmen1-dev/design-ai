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
export type {
  CompositionEngineInput,
  CompositionResult,
  CompositionScore,
  CompositionScenario,
  CompositionScenarioId,
  DesignDNA,
  ScenarioBiases,
} from "./types";
