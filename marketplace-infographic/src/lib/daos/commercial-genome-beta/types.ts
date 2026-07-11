export type RuleCategory =
  | "hero"
  | "hierarchy"
  | "typography"
  | "psychology"
  | "environment"
  | "differentiation"
  | "brand"
  | "research"
  | "refinement"
  | "anti_rule";

export type RuleSource =
  | "experimental_knowledge_base_v1"
  | "audit"
  | "manual"
  | "benchmark";

export type CommercialRuleBeta = {
  id: string;
  title: string;
  category: RuleCategory;
  priority: number;
  confidence: number;
  source: RuleSource;
  appliesTo: string[];
  rule: string;
  decisionImpact: string;
};

export type VisualHierarchyOrder =
  | "product"
  | "headline"
  | "characteristics"
  | "logo";

export type HeroDominance = "product_first";

export type EnvironmentDirection =
  | "clean_industrial_technical"
  | "outdoor_fresh_natural"
  | "light_modern_clean"
  | "clean_commercial_studio";

export type BackgroundContrastDirection =
  | "cool_neutral_separation"
  | "green_neutral_separation"
  | "light_background"
  | "medium_contrast_background";

export type CommercialDecisionBeta = {
  mainMessage: string;
  heroDominance: HeroDominance;
  /** Reachable product area for current layout (Sprint 8C production target) */
  productAreaTarget: number;
  /** Aspirational EKB target — not applied to current layout compositor path */
  productAreaAspirationalTarget: number;
  maxCharacteristics: number;
  badgeLimit: number;
  environmentDirection: EnvironmentDirection;
  backgroundContrastDirection: BackgroundContrastDirection;
  typographyDirection: string;
  visualHierarchy: VisualHierarchyOrder[];
  antiRules: string[];
  selectedRules: string[];
  decisionTrace: string[];
};

export type ResolveCommercialRulesInput = {
  marketplace: string;
  category?: string;
  productTitle?: string;
  productColor?: string;
  productType?: string;
  audience?: string;
  mode?: "generation" | "refinement" | string;
};

export type ResolveCommercialRulesResult = {
  selectedRules: CommercialRuleBeta[];
  ignoredRules: CommercialRuleBeta[];
  antiRules: CommercialRuleBeta[];
  decisionTrace: string[];
};

export type BuildCommercialDecisionInput = {
  selectedRules: CommercialRuleBeta[];
  antiRules: CommercialRuleBeta[];
  resolveInput: ResolveCommercialRulesInput;
  decisionTrace: string[];
};

export type CommercialGenomeBetaDiagnostics = {
  genomeVersion: string;
  flagEnabled: boolean;
  ruleCount: number;
  selectedCount: number;
  antiRuleCount: number;
  ignoredCount: number;
  sourceBreakdown: Record<string, number>;
};

export type CategoryIntelligenceDiagnostics = {
  enabled: boolean;
  key: string | null;
  label: string | null;
  version: string;
  appliedOverrides: string[];
};

export type CommercialGenomeBetaDecisionResult = {
  rules: {
    all: CommercialRuleBeta[];
    selected: CommercialRuleBeta[];
    ignored: CommercialRuleBeta[];
    anti: CommercialRuleBeta[];
  };
  decision: CommercialDecisionBeta;
  trace: string[];
  diagnostics: CommercialGenomeBetaDiagnostics;
  categoryIntelligence?: CategoryIntelligenceDiagnostics;
};

export const COMMERCIAL_GENOME_BETA_VERSION = "0.1.0-beta";
export const COMMERCIAL_GENOME_BETA_FLAG = "DAOS_COMMERCIAL_GENOME_BETA";
