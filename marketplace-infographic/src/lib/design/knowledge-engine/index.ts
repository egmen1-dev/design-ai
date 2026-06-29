export { KNOWLEDGE_ENGINE_VERSION, RETRIEVAL_LIMIT, ANALYSIS_INTERVAL } from "./types";
export type {
  KnowledgeCategory,
  KnowledgeContext,
  PatternSnapshot,
  CategoryInsights,
} from "./types";

export {
  resolveKnowledgeCategory,
  buildPatternKey,
  buildPatternSnapshot,
  lightingTypeFromScene,
  backgroundTypeFromScene,
} from "./category";

export {
  computeSuccessSignal,
  emaWeight,
  outcomeToWeight,
} from "./weight-manager";

export {
  trackRecentUsage,
  applyDiversityPenalties,
  getLayoutDiversityBoost,
} from "./diversity-manager";

export { evolvePattern, evolveFromSnapshot, evolveUserFeedback } from "./evolution-engine";

export {
  collectGenerationPattern,
  type PatternCollectorInput,
  type PatternCollectorResult,
} from "./pattern-collector";

export {
  runPatternAnalysis,
  runPatternAnalysisIfDue,
} from "./pattern-analyzer";

export {
  retrieveTopPatterns,
  retrieveKnowledgeContext,
  buildKnowledgePromptBlock,
  getKnowledgeLayoutBoost,
  preloadKnowledgeAnalysis,
} from "./knowledge-retriever";
