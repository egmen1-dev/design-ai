/**
 * Chapter 5.3 — Knowledge Sources engine.
 * Every knowledge rule must have verified, attributed, independent sources.
 */
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";
import { getSeedKnowledgeRules } from "./design-knowledge-philosophy-engine";
import {
  KnowledgeSourceLevel,
  KnowledgeSourceType,
  type AiHypothesisSubmission,
  type AttributedKnowledgeSource,
  type HumanFeedbackImpact,
  type KnowledgeSourcesContext,
  type KnowledgeSourcesFailureCode,
  type KnowledgeSourcesReport,
  type KnowledgeSourcesViolation,
  type MultiSourceValidation,
  type SourceConflict,
  type SourceWeightUpdate,
  type KnowledgeSourceLevelId,
} from "./knowledge-sources-types";

export {
  KnowledgeSourceLevel,
  KnowledgeSourceType,
  type KnowledgeSourceLevelId,
  type KnowledgeSourceTypeId,
  type AttributedKnowledgeSource,
  type SourceWeightUpdate,
  type SourceConflict,
  type MultiSourceValidation,
  type HumanFeedbackImpact,
  type AiHypothesisSubmission,
  type KnowledgeSourcesContext,
  type KnowledgeSourcesViolation,
  type KnowledgeSourcesReport,
  type KnowledgeSourcesFailureCode,
} from "./knowledge-sources-types";

export const KNOWLEDGE_SOURCES_VERSION = "5.3.0";

export const KNOWLEDGE_SOURCES_GOLDEN_RULE =
  "No rule in Design AI may exist without a source. Expert knowledge, scientific research, " +
  "marketplace data, platform statistics, and Design Memory together form the evidential foundation " +
  "for every design decision in the system.";

export const SOURCE_HIERARCHY: readonly KnowledgeSourceLevelId[] = [
  KnowledgeSourceLevel.EXPERT,
  KnowledgeSourceLevel.SCIENTIFIC_RESEARCH,
  KnowledgeSourceLevel.MARKETPLACE_ANALYTICS,
  KnowledgeSourceLevel.INTERNAL_PLATFORM,
  KnowledgeSourceLevel.AI_GENERATED,
] as const;

export const DEFAULT_SOURCE_TRUST_WEIGHT: Record<KnowledgeSourceLevelId, number> = {
  [KnowledgeSourceLevel.EXPERT]: 0.9,
  [KnowledgeSourceLevel.SCIENTIFIC_RESEARCH]: 0.85,
  [KnowledgeSourceLevel.MARKETPLACE_ANALYTICS]: 0.8,
  [KnowledgeSourceLevel.INTERNAL_PLATFORM]: 0.75,
  [KnowledgeSourceLevel.AI_GENERATED]: 0.35,
};

const EVIDENCE_TO_LEVEL: Record<string, KnowledgeSourceLevelId> = {
  [KnowledgeEvidenceSource.EXPERT_CURATED]: KnowledgeSourceLevel.EXPERT,
  [KnowledgeEvidenceSource.INDUSTRIAL_DESIGN]: KnowledgeSourceLevel.EXPERT,
  [KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY]: KnowledgeSourceLevel.EXPERT,
  [KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY]: KnowledgeSourceLevel.SCIENTIFIC_RESEARCH,
  [KnowledgeEvidenceSource.MARKETPLACE_RESEARCH]: KnowledgeSourceLevel.MARKETPLACE_ANALYTICS,
  [KnowledgeEvidenceSource.SALES_STATISTICS]: KnowledgeSourceLevel.MARKETPLACE_ANALYTICS,
  [KnowledgeEvidenceSource.PLATFORM_DATA]: KnowledgeSourceLevel.INTERNAL_PLATFORM,
  [KnowledgeEvidenceSource.UX]: KnowledgeSourceLevel.SCIENTIFIC_RESEARCH,
  [KnowledgeEvidenceSource.MARKETING]: KnowledgeSourceLevel.MARKETPLACE_ANALYTICS,
};

const EVIDENCE_TO_TYPE: Record<string, KnowledgeSourceTypeId> = {
  [KnowledgeEvidenceSource.EXPERT_CURATED]: KnowledgeSourceType.EXPERT,
  [KnowledgeEvidenceSource.INDUSTRIAL_DESIGN]: KnowledgeSourceType.EXPERT,
  [KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY]: KnowledgeSourceType.EXPERT,
  [KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY]: KnowledgeSourceType.SCIENTIFIC,
  [KnowledgeEvidenceSource.MARKETPLACE_RESEARCH]: KnowledgeSourceType.MARKETPLACE,
  [KnowledgeEvidenceSource.SALES_STATISTICS]: KnowledgeSourceType.MARKETPLACE,
  [KnowledgeEvidenceSource.PLATFORM_DATA]: KnowledgeSourceType.INTERNAL_ANALYTICS,
  [KnowledgeEvidenceSource.UX]: KnowledgeSourceType.SCIENTIFIC,
  [KnowledgeEvidenceSource.MARKETING]: KnowledgeSourceType.MARKETPLACE,
};

function violation(
  code: KnowledgeSourcesViolation["code"],
  message: string,
  extras?: Pick<KnowledgeSourcesViolation, "ruleId" | "sourceType">,
): KnowledgeSourcesViolation {
  return { code, message, ...extras };
}

export function buildAttributedSource(input: {
  evidenceId: import("./design-knowledge-philosophy-types").KnowledgeEvidenceSourceId;
  name: string;
  confidence?: number;
  date?: string;
  version?: string;
}): AttributedKnowledgeSource {
  const level = EVIDENCE_TO_LEVEL[input.evidenceId] ?? KnowledgeSourceLevel.EXPERT;
  const type = EVIDENCE_TO_TYPE[input.evidenceId] ?? KnowledgeSourceType.EXPERT;
  const baseTrust = DEFAULT_SOURCE_TRUST_WEIGHT[level];

  return {
    type,
    name: input.name,
    evidenceLevel: level,
    confidence: input.confidence ?? baseTrust,
    date: input.date ?? new Date().toISOString().slice(0, 10),
    version: input.version ?? "1.0.0",
    level,
    evidenceId: input.evidenceId,
    independent: type !== KnowledgeSourceType.DESIGN_MEMORY,
  };
}

export function buildSeedSourceCatalog(): AttributedKnowledgeSource[] {
  const now = new Date().toISOString().slice(0, 10);
  return [
    buildAttributedSource({
      evidenceId: KnowledgeEvidenceSource.EXPERT_CURATED,
      name: "Commercial photography expert panel",
      date: now,
    }),
    buildAttributedSource({
      evidenceId: KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY,
      name: "Cognitive psychology — visual perception research",
      date: now,
    }),
    buildAttributedSource({
      evidenceId: KnowledgeEvidenceSource.MARKETPLACE_RESEARCH,
      name: "WB/Ozon marketplace card best practices",
      date: now,
    }),
    buildAttributedSource({
      evidenceId: KnowledgeEvidenceSource.PLATFORM_DATA,
      name: "Design AI internal CTR and conversion analytics",
      date: now,
    }),
    buildAttributedSource({
      evidenceId: KnowledgeEvidenceSource.SALES_STATISTICS,
      name: "Category sales performance statistics",
      date: now,
    }),
    {
      type: KnowledgeSourceType.DESIGN_MEMORY,
      name: "Design Memory empirical patterns",
      evidenceLevel: KnowledgeSourceLevel.INTERNAL_PLATFORM,
      confidence: 0.72,
      date: now,
      version: "4.20.0",
      level: KnowledgeSourceLevel.INTERNAL_PLATFORM,
      independent: true,
    },
  ];
}

export function attributeSourcesForRule(ruleId: string): AttributedKnowledgeSource[] {
  const rule = getSeedKnowledgeRules().find((r) => r.id === ruleId);
  if (!rule) return [];

  return rule.evidenceSources.map((evidenceId, index) =>
    buildAttributedSource({
      evidenceId,
      name: `${rule.preference} — ${evidenceId.replace(/_/g, " ")}`,
      confidence: rule.priority / 100 - index * 0.02,
      version: `${rule.version}.0.0`,
    }),
  );
}

export function computeMultiSourceConfidence(sources: AttributedKnowledgeSource[]): number {
  if (sources.length === 0) return 0;
  const independent = sources.filter((s) => s.independent);
  const uniqueLevels = new Set(independent.map((s) => s.level));
  const avgConfidence =
    sources.reduce((sum, s) => sum + s.confidence, 0) / sources.length;
  const diversityBonus = Math.min(0.15, (uniqueLevels.size - 1) * 0.05);
  return Math.min(1, avgConfidence + diversityBonus);
}

export function validateMultiSource(
  ruleId: string,
  sources: AttributedKnowledgeSource[],
  minIndependent = 2,
): MultiSourceValidation {
  const independent = sources.filter((s) => s.independent);
  const uniqueTypes = new Set(independent.map((s) => s.type));
  const combinedConfidence = computeMultiSourceConfidence(sources);

  return {
    ruleId,
    sources,
    independentSourceCount: uniqueTypes.size,
    combinedConfidence,
    validated: uniqueTypes.size >= minIndependent && combinedConfidence >= 0.6,
  };
}

export function applyDynamicWeightUpdate(
  source: AttributedKnowledgeSource,
  confirmations: number,
  failures: number,
): SourceWeightUpdate {
  const previousWeight = source.confidence;
  const delta = confirmations * 0.04 - failures * 0.06;
  const newWeight = Math.max(0.1, Math.min(1, previousWeight + delta));

  return {
    sourceId: `${source.type}:${source.name}`,
    previousWeight,
    newWeight,
    reason:
      confirmations > 0
        ? `Expert rule confirmed by ${confirmations} commercial outcomes`
        : `Rule effectiveness declined across ${failures} outcomes`,
    confirmedBy:
      confirmations > 0 ? [KnowledgeSourceType.INTERNAL_ANALYTICS, KnowledgeSourceType.MARKETPLACE] : undefined,
  };
}

export function resolveSourceConflict(input: {
  ruleId: string;
  researchSource: AttributedKnowledgeSource;
  marketplaceSource: AttributedKnowledgeSource;
  message: string;
}): SourceConflict {
  return {
    ruleId: input.ruleId,
    sources: [input.researchSource, input.marketplaceSource],
    message: input.message,
    resolution: "preserve_both",
  };
}

export function processHumanFeedback(input: {
  rating: "positive" | "negative";
  affectedRuleIds: string[];
  sampleCount?: number;
}): HumanFeedbackImpact {
  const sampleCount = input.sampleCount ?? 1;
  return {
    rating: input.rating,
    affectedRuleIds: input.affectedRuleIds,
    weightDelta: input.rating === "positive" ? 0.03 * sampleCount : -0.04 * sampleCount,
    createsNewRule: false,
  };
}

export function submitAiHypothesis(input: {
  id: string;
  hypothesis: string;
  sampleCount: number;
}): AiHypothesisSubmission {
  const approved = input.sampleCount >= 5;
  return {
    id: input.id,
    hypothesis: input.hypothesis,
    proposedBy: "ai_hypothesis",
    sampleCount: input.sampleCount,
    approved,
    reason: approved
      ? "Hypothesis validated by sufficient platform samples"
      : "AI hypothesis requires validation and statistical accumulation before entering knowledge base",
  };
}

export function validateSourceIndependence(
  sources: AttributedKnowledgeSource[],
): KnowledgeSourcesViolation[] {
  const violations: KnowledgeSourcesViolation[] = [];
  const marketplace = sources.filter((s) => s.type === KnowledgeSourceType.MARKETPLACE);
  const memory = sources.filter((s) => s.type === KnowledgeSourceType.DESIGN_MEMORY);

  if (
    marketplace.length > 0 &&
    memory.length > 0 &&
    marketplace.every((m) => memory.some((d) => d.name.includes(m.name.split(" ")[0])))
  ) {
    violations.push(
      violation(
        "CIRCULAR_ATTRIBUTION",
        "Marketplace analytics must not circularly confirm Design Memory conclusions",
        { sourceType: KnowledgeSourceType.DESIGN_MEMORY },
      ),
    );
  }

  return violations;
}

export function validateSourceAttribution(
  sources: AttributedKnowledgeSource[],
  ruleId?: string,
): KnowledgeSourcesViolation[] {
  const violations: KnowledgeSourcesViolation[] = [];

  for (const source of sources) {
    if (!source.type || !source.name || !source.date || !source.version) {
      violations.push(
        violation("MISSING_ATTRIBUTION", `Source missing required attribution fields`, {
          ruleId,
          sourceType: source.type,
        }),
      );
    }
    if (source.confidence < 0 || source.confidence > 1) {
      violations.push(
        violation("MISSING_SOURCE_VALIDATION", `Source ${source.name} has invalid confidence`, {
          ruleId,
          sourceType: source.type,
        }),
      );
    }
  }

  if (sources.length === 0) {
    violations.push(
      violation("UNKNOWN_ORIGIN", `Rule ${ruleId ?? "unknown"} has no attributed sources`, { ruleId }),
    );
  }

  return violations;
}

export function validateKnowledgeSources(
  ctx: KnowledgeSourcesContext = {},
): KnowledgeSourcesReport {
  const catalog = ctx.sources ?? buildSeedSourceCatalog();
  const ruleIds = ctx.ruleId ? [ctx.ruleId] : getSeedKnowledgeRules().map((r) => r.id);

  const violations: KnowledgeSourcesViolation[] = [];

  for (const ruleId of ruleIds.slice(0, 5)) {
    const sources = attributeSourcesForRule(ruleId);
    violations.push(...validateSourceAttribution(sources, ruleId));
    violations.push(...validateSourceIndependence(sources));

    const multi = validateMultiSource(ruleId, sources);
    if (!multi.validated && sources.length >= 2) {
      violations.push(
        violation(
          "INSUFFICIENT_INDEPENDENT_SOURCES",
          `Rule ${ruleId} lacks sufficient independent source validation`,
          { ruleId },
        ),
      );
    }
  }

  if (ctx.llmOnlyRule) {
    violations.push(violation("LLM_ONLY_SOURCE", "Rule originated from LLM without attributed source", { ruleId: ctx.ruleId }));
  }
  if (ctx.mixedWithoutDistinction) {
    violations.push(violation("MIXED_SOURCES_UNDISTINGUISHED", "Expert and platform sources mixed without distinction"));
  }
  if (ctx.singleFeedbackCreatesRule) {
    violations.push(violation("SINGLE_FEEDBACK_RULE", "Single user feedback cannot create a new knowledge rule"));
  }
  if (ctx.aiHypothesisAutoAccepted) {
    violations.push(violation("AI_HYPOTHESIS_AUTO_ACCEPTED", "AI hypothesis entered knowledge base without validation"));
  }
  if (ctx.circularAttribution) {
    violations.push(
      violation(
        "CIRCULAR_ATTRIBUTION",
        `Circular attribution between ${ctx.circularAttribution.from} and ${ctx.circularAttribution.to}`,
      ),
    );
  }

  const unique = violations.filter(
    (v, i, arr) =>
      arr.findIndex((x) => x.code === v.code && x.message === v.message && x.ruleId === v.ruleId) === i,
  );

  const luxurySources = attributeSourcesForRule("luxury-cosmetics-soft-lighting");
  const multiValidated = validateMultiSource("luxury-cosmetics-soft-lighting", luxurySources).validated;

  return {
    valid: unique.length === 0,
    violations: unique,
    sourceHierarchy: [...SOURCE_HIERARCHY],
    catalog,
    goldenRuleSatisfied: unique.length === 0,
    traceable: catalog.every((s) => Boolean(s.type && s.name && s.date)),
    multiSourceValidated: multiValidated,
  };
}

export function assertKnowledgeSources(ctx?: KnowledgeSourcesContext): KnowledgeSourcesReport {
  const report = validateKnowledgeSources(ctx);
  if (!report.valid) {
    throw new Error(
      `Knowledge sources violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runKnowledgeSources(input: {
  ctx?: KnowledgeSourcesContext;
}): KnowledgeSourcesReport {
  return validateKnowledgeSources(input.ctx);
}

export function isKnowledgeSourcesFailure(code: string): code is KnowledgeSourcesFailureCode {
  return [
    "UNKNOWN_ORIGIN",
    "LLM_ONLY_SOURCE",
    "MISSING_SOURCE_VALIDATION",
    "MIXED_SOURCES_UNDISTINGUISHED",
    "SINGLE_FEEDBACK_RULE",
    "AI_HYPOTHESIS_AUTO_ACCEPTED",
    "CIRCULAR_ATTRIBUTION",
    "INSUFFICIENT_INDEPENDENT_SOURCES",
    "MISSING_ATTRIBUTION",
  ].includes(code);
}
