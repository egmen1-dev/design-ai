export type {
  BackgroundContrastDirection,
  BuildCommercialDecisionInput,
  CommercialDecisionBeta,
  CommercialGenomeBetaDecisionResult,
  CommercialGenomeBetaDiagnostics,
  CommercialRuleBeta,
  EnvironmentDirection,
  HeroDominance,
  ResolveCommercialRulesInput,
  ResolveCommercialRulesResult,
  RuleCategory,
  RuleSource,
  VisualHierarchyOrder,
} from "./types";

export {
  COMMERCIAL_GENOME_BETA_FLAG,
  COMMERCIAL_GENOME_BETA_VERSION,
} from "./types";

export {
  buildCommercialDecisionBeta,
  buildCommercialGenomeBetaPromptSnippet,
  COMMERCIAL_GENOME_BETA_FLAG_DEFINITION,
  createCommercialGenomeBetaDecision,
  getCommercialGenomeBeta,
  isCommercialGenomeBetaEnabled,
  registerCommercialGenomeBetaFlag,
  resolveCommercialRulesBeta,
  WILDBERRIES_HERO_RULES,
} from "./commercial-genome-beta";

export {
  CATEGORY_INTELLIGENCE_FLAG,
  CATEGORY_INTELLIGENCE_FLAG_DEFINITION,
  CATEGORY_INTELLIGENCE_VERSION,
  enrichDecisionWithCategoryIntelligence,
  getCategoryAttentionRules,
  getCategoryProfile,
  isCategoryIntelligenceEnabled,
  registerCategoryIntelligenceFlag,
  resolveCategoryIntelligenceKey,
  WAVE1_CATEGORY_KEYS,
} from "./category-intelligence";
