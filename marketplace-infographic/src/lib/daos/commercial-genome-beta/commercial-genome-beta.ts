import type { FeatureFlagDefinition } from "@/lib/daos/feature-flag-registry";
import type {
  CommercialGenomeBetaDecisionResult,
  CommercialGenomeBetaDiagnostics,
  ResolveCommercialRulesInput,
} from "./types";
import {
  COMMERCIAL_GENOME_BETA_FLAG,
  COMMERCIAL_GENOME_BETA_VERSION,
} from "./types";
import { WILDBERRIES_HERO_RULES } from "./wildberries-hero-rules";
import { enrichDecisionWithCategoryIntelligence } from "./category-intelligence";
import { resolveCommercialRulesBeta } from "./resolve-commercial-rules";
import { buildCommercialDecisionBeta } from "./commercial-decision-beta";

export function isCommercialGenomeBetaEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env[COMMERCIAL_GENOME_BETA_FLAG] === "1";
}

export const COMMERCIAL_GENOME_BETA_FLAG_DEFINITION: FeatureFlagDefinition = {
  FlagId: COMMERCIAL_GENOME_BETA_FLAG,
  Name: "DAOS_COMMERCIAL_GENOME_BETA",
  Owner: "Commercial Genome Beta",
  Description:
    "Enables Commercial Genome Beta runtime — Experimental Knowledge Base v1.0 rules for Wildberries Hero cards.",
  DefaultValue: "0",
  CurrentValue: process.env[COMMERCIAL_GENOME_BETA_FLAG] ?? "0",
  Scope: "runtime",
  Category: "runtime",
  LifecycleState: "Shadow",
  IntroducedInWave: 43,
  PlannedRemovalWave: null,
  Consumers: ["generate-infographic-handler", "commercial-genome-beta"],
  Dependencies: [],
  Diagnostics: ["commercialGenomeBeta", "commercialDecisionBeta"],
  Deprecated: false,
  Notes: "plannedRemovalWave: TBD_AFTER_BETA_VALIDATION. Category: Commercial (mapped to runtime in registry).",
};

export function registerCommercialGenomeBetaFlag(
  register: (def: FeatureFlagDefinition) => void,
  env: NodeJS.ProcessEnv = process.env,
): void {
  register({
    ...COMMERCIAL_GENOME_BETA_FLAG_DEFINITION,
    CurrentValue: env[COMMERCIAL_GENOME_BETA_FLAG] ?? "0",
  });
}

export function getCommercialGenomeBeta() {
  return {
    version: COMMERCIAL_GENOME_BETA_VERSION,
    ruleCount: WILDBERRIES_HERO_RULES.length,
    rules: WILDBERRIES_HERO_RULES,
    source: "experimental_knowledge_base_v1",
  };
}

export function createCommercialGenomeBetaDecision(
  input: ResolveCommercialRulesInput,
): CommercialGenomeBetaDecisionResult {
  const resolved = resolveCommercialRulesBeta(input);
  const baseDecision = buildCommercialDecisionBeta({
    selectedRules: resolved.selectedRules,
    antiRules: resolved.antiRules,
    resolveInput: input,
    decisionTrace: resolved.decisionTrace,
  });
  const { decision, intelligence } = enrichDecisionWithCategoryIntelligence({
    decision: baseDecision,
    productTitle: input.productTitle,
    category: input.category,
  });

  const sourceBreakdown: Record<string, number> = {};
  for (const rule of resolved.selectedRules) {
    sourceBreakdown[rule.source] = (sourceBreakdown[rule.source] ?? 0) + 1;
  }

  const diagnostics: CommercialGenomeBetaDiagnostics = {
    genomeVersion: COMMERCIAL_GENOME_BETA_VERSION,
    flagEnabled: true,
    ruleCount: WILDBERRIES_HERO_RULES.length,
    selectedCount: resolved.selectedRules.length,
    antiRuleCount: resolved.antiRules.length,
    ignoredCount: resolved.ignoredRules.length,
    sourceBreakdown,
  };

  return {
    rules: {
      all: WILDBERRIES_HERO_RULES,
      selected: resolved.selectedRules,
      ignored: resolved.ignoredRules,
      anti: resolved.antiRules,
    },
    decision,
    trace: decision.decisionTrace,
    diagnostics,
    categoryIntelligence: {
      enabled: intelligence.enabled,
      key: intelligence.key,
      label: intelligence.label,
      version: intelligence.version,
      appliedOverrides: intelligence.appliedOverrides,
    },
  };
}

export function buildCommercialGenomeBetaPromptSnippet(
  result: CommercialGenomeBetaDecisionResult,
): string {
  const anti = result.decision.antiRules.slice(0, 4).join("; ");
  const env = result.decision.environmentDirection;
  const contrast = result.decision.backgroundContrastDirection;
  const cat = result.categoryIntelligence?.key
    ? ` | Category: ${result.categoryIntelligence.label ?? result.categoryIntelligence.key}`
    : "";
  return [
    "[Commercial Genome Beta]",
    `Main: ${result.decision.mainMessage}`,
    `Product area reachable target: ${Math.round(result.decision.productAreaTarget * 100)}%`,
    `Product area aspirational (future layout): ${Math.round(result.decision.productAreaAspirationalTarget * 100)}%`,
    `Environment: ${env}`,
    `Background contrast: ${contrast}`,
    `Hierarchy: ${result.decision.visualHierarchy.join(" > ")}`,
    `Avoid: ${anti}${cat}`,
  ].join(" | ");
}

export { resolveCommercialRulesBeta } from "./resolve-commercial-rules";
export { buildCommercialDecisionBeta } from "./commercial-decision-beta";
export { WILDBERRIES_HERO_RULES } from "./wildberries-hero-rules";
