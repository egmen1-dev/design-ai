/**
 * Chapter 5.20 — Golden Rules of Design Knowledge engine.
 * Constitutional principles for the entire Design Knowledge Engine.
 */
import { KnowledgeOrigin } from "./design-knowledge-philosophy-types";
import {
  getSeedKnowledgeRules,
  validateDesignKnowledgePhilosophy,
} from "./design-knowledge-philosophy-engine";
import { SEED_DESIGN_ANTI_PATTERNS } from "./anti-pattern-library-engine";
import { SEED_DESIGN_PATTERNS } from "./pattern-library-engine";
import {
  buildRetrievalCatalog,
  retrieveKnowledgePackage,
} from "./knowledge-retrieval-engine";
import {
  buildValidatableKnowledgeCatalog,
  validateKnowledgeEntryEvidence,
  validatePublishedKnowledgeCatalog,
} from "./knowledge-validation-engine";
import {
  buildKnowledgeVersionCatalog,
  getKnowledgeVersionHistory,
  validateKnowledgeVersioning,
} from "./knowledge-versioning-engine";
import { validateKnowledgeLearning } from "./knowledge-learning-engine";
import {
  DesignKnowledgeGoldenRuleId,
  type DesignKnowledgeConstitutionContext,
  type DesignKnowledgeConstitutionReport,
  type DesignKnowledgeGoldenRuleCheckResult,
  type DesignKnowledgeGoldenRuleDefinition,
  type DesignKnowledgeGoldenRuleFailureCode,
  type DesignKnowledgeGoldenRuleIdValue,
  type DesignKnowledgeGoldenRuleViolation,
} from "./design-knowledge-golden-rules-types";

export {
  DesignKnowledgeGoldenRuleId,
  type DesignKnowledgeGoldenRuleIdValue,
  type DesignKnowledgeGoldenRuleDefinition,
  type DesignKnowledgeGoldenRuleViolation,
  type DesignKnowledgeGoldenRuleCheckResult,
  type DesignKnowledgeConstitutionReport,
  type DesignKnowledgeConstitutionContext,
  type DesignKnowledgeGoldenRuleFailureCode,
} from "./design-knowledge-golden-rules-types";

export const DESIGN_KNOWLEDGE_GOLDEN_RULES_VERSION = "5.20.0";

export const FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE =
  "Image is only the final result. Prompt is only temporary representation. LLM is only executor. " +
  "Render Provider is only visualization tool. The true intelligence of Design AI is the knowledge system " +
  "that knows what to do, why, when it applies, how to verify correctness, and how to become better " +
  "after every generation. Design Knowledge Engine is the foundation of the entire Design AI Platform.";

export const DESIGN_KNOWLEDGE_ARCHITECTURE_STATEMENT =
  "Design AI is not an image generator — it is a system that makes design decisions. " +
  "Design Knowledge Engine is not a document library — it is an engineering knowledge base where every rule " +
  "has origin, explanation, scope, history, evidence, and a mechanism for evolution.";

export const DESIGN_KNOWLEDGE_CONSTITUTION_RULES: readonly DesignKnowledgeGoldenRuleDefinition[] = [
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_BEFORE_GENERATION,
    number: 1,
    title: "Knowledge Before Generation",
    principle: "No agent may make a design decision without relying on Knowledge Engine. LLM intuition must never replace structured knowledge.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_INDEPENDENT,
    number: 2,
    title: "Knowledge Is Independent",
    principle: "Knowledge base is independent of LLM, Prompt, Render Provider, Marketplace, and AI model.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.EVERY_RULE_NEEDS_EVIDENCE,
    number: 3,
    title: "Every Rule Needs Evidence",
    principle: "Every rule must have provenance — expert knowledge, research, analytics, platform statistics, or confirmed learning.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.EVERYTHING_MUST_BE_EXPLAINABLE,
    number: 4,
    title: "Everything Must Be Explainable",
    principle: "Every knowledge object must answer why it exists, where it applies, what problem it solves, and what data confirms it.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_NEVER_DISAPPEARS,
    number: 5,
    title: "Knowledge Never Disappears",
    principle: "Published knowledge is never deleted — it may deprecate, archive, or version, but history is always preserved.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.VALIDATION_BEFORE_USAGE,
    number: 6,
    title: "Validation Before Usage",
    principle: "No new rule is used until the full Validation cycle completes.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.LEARNING_NEVER_STOPS,
    number: 7,
    title: "Learning Never Stops",
    principle: "Knowledge Engine is never complete — every generation, score, pattern, and anti-pattern fuels evolution.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_SHARED,
    number: 8,
    title: "Knowledge Is Shared",
    principle: "All agents use one unified knowledge base — no local, inconsistent, or hidden rules.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_OVER_PROMPT,
    number: 9,
    title: "Knowledge Over Prompt",
    principle: "Prompt is not a knowledge source — it only conveys decisions already made by Knowledge Engine.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.BUSINESS_BEFORE_BEAUTY,
    number: 10,
    title: "Business Before Beauty",
    principle: "Design is judged by commercial effectiveness, not aesthetics alone. Beautiful design that does not sell is not successful.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.CONSISTENCY_BEFORE_CREATIVITY,
    number: 11,
    title: "Consistency Before Creativity",
    principle: "Creativity must not break system integrity. New solutions must be compatible with existing knowledge architecture.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.PATTERN_AND_ANTI_PATTERN_TOGETHER,
    number: 12,
    title: "Pattern And Anti-Pattern Together",
    principle: "The system must know best practices and typical mistakes together.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.HUMAN_KNOWLEDGE_COMES_FIRST,
    number: 13,
    title: "Human Knowledge Comes First",
    principle: "Expert knowledge is the starting point. Self-learning may enhance but must not unreviewed replace professional experience.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_MUST_EVOLVE_SAFELY,
    number: 14,
    title: "Knowledge Must Evolve Safely",
    principle: "Every change must be verified, explainable, compatible, and reversible without degrading quality.",
    immutable: true,
  },
  {
    id: DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_THE_CORE_ASSET,
    number: 15,
    title: "Knowledge Is The Core Asset",
    principle: "The primary intellectual value of Design AI is Design Knowledge Engine — not LLM, Render Provider, or Prompt Compiler.",
    immutable: true,
  },
] as const;

function violation(
  code: DesignKnowledgeGoldenRuleFailureCode,
  ruleId: DesignKnowledgeGoldenRuleIdValue,
  message: string,
  entryId?: string,
): DesignKnowledgeGoldenRuleViolation {
  return { code, ruleId, message, entryId };
}

function result(
  ruleId: DesignKnowledgeGoldenRuleIdValue,
  violations: DesignKnowledgeGoldenRuleViolation[],
): DesignKnowledgeGoldenRuleCheckResult {
  return { ruleId, passed: violations.length === 0, violations };
}

export function getDesignKnowledgeGoldenRule(
  ruleId: DesignKnowledgeGoldenRuleIdValue,
): DesignKnowledgeGoldenRuleDefinition | undefined {
  return DESIGN_KNOWLEDGE_CONSTITUTION_RULES.find((r) => r.id === ruleId);
}

export function validateGoldenRuleKnowledgeBeforeGeneration(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_BEFORE_GENERATION;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.agentDecisionWithoutKnowledge) {
    violations.push(
      violation(
        "LLM_INTUITION_OVERRIDE",
        ruleId,
        "Agent made design decision without Knowledge Engine consultation",
      ),
    );
  }

  const pkg = retrieveKnowledgePackage({
    context: { category: "kitchen", semanticQuery: "premium appliance" },
    limit: 4,
    useCache: false,
  });
  if (pkg.items.length === 0) {
    violations.push(
      violation("LLM_INTUITION_OVERRIDE", ruleId, "Knowledge package empty — agents cannot decide without knowledge"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleKnowledgeIsIndependent(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_INDEPENDENT;
  const philosophy = validateDesignKnowledgePhilosophy();
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (!philosophy.independent) {
    violations.push(
      violation(
        "KNOWLEDGE_NOT_INDEPENDENT",
        ruleId,
        "Knowledge base shows dependency on LLM, prompt, or render provider",
      ),
    );
  }

  const catalog = buildValidatableKnowledgeCatalog();
  const dependent = catalog.filter(
    (e) =>
      /\b(flux|sdxl|gpt|llm|prompt|midjourney)\b/i.test(e.description) ||
      /\b(flux|sdxl|gpt|llm|prompt|midjourney)\b/i.test(e.recommendation),
  );
  for (const e of dependent) {
    violations.push(
      violation(
        "KNOWLEDGE_NOT_INDEPENDENT",
        ruleId,
        `Knowledge entry ${e.id} depends on external model or prompt`,
        e.id,
      ),
    );
  }

  if (context.promptOnlyKnowledge) {
    violations.push(
      violation("KNOWLEDGE_NOT_INDEPENDENT", ruleId, "Prompt-only knowledge violates independence"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleEveryRuleNeedsEvidence(): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.EVERY_RULE_NEEDS_EVIDENCE;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];
  const catalog = buildValidatableKnowledgeCatalog();

  for (const entry of catalog) {
    const evidenceViolations = validateKnowledgeEntryEvidence(entry);
    for (const v of evidenceViolations) {
      violations.push(
        violation("MISSING_EVIDENCE", ruleId, v.message, entry.id),
      );
    }
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleEverythingMustBeExplainable(): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.EVERYTHING_MUST_BE_EXPLAINABLE;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];
  const catalog = buildValidatableKnowledgeCatalog();

  for (const entry of catalog) {
    const explainableFields = [entry.purpose, entry.description, entry.explainable, entry.recommendation];
    if (explainableFields.some((a) => !a || a.length < 8)) {
      violations.push(
        violation(
          "UNEXPLAINABLE_KNOWLEDGE",
          ruleId,
          "Must answer why it exists, what problem it solves, where it applies, and how it is proven",
          entry.id,
        ),
      );
    }
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleKnowledgeNeverDisappears(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_NEVER_DISAPPEARS;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.deletePublishedKnowledge) {
    violations.push(
      violation("KNOWLEDGE_DELETED", ruleId, "Published knowledge cannot be deleted"),
    );
  }

  const history = getKnowledgeVersionHistory("photo-warm-lighting-rule");
  if (history.length < 2) {
    violations.push(
      violation(
        "KNOWLEDGE_DELETED",
        ruleId,
        "Version history must be preserved — lighting rule chain missing",
      ),
    );
  }

  const versions = buildKnowledgeVersionCatalog();
  const archived = versions.filter((v) => v.status === "archived" || v.status === "deprecated");
  if (archived.length === 0) {
    violations.push(
      violation("KNOWLEDGE_DELETED", ruleId, "Archived or deprecated versions must exist for history preservation"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleValidationBeforeUsage(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.VALIDATION_BEFORE_USAGE;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.skipValidation) {
    violations.push(
      violation("UNVALIDATED_KNOWLEDGE", ruleId, "Knowledge used without validation cycle"),
    );
  }

  const report = validatePublishedKnowledgeCatalog();
  if (!report.valid) {
    violations.push(
      violation("UNVALIDATED_KNOWLEDGE", ruleId, "Published catalog failed validation gate"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleLearningNeverStops(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.LEARNING_NEVER_STOPS;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.stopLearning) {
    violations.push(violation("LEARNING_STOPPED", ruleId, "Knowledge Engine marked as complete — learning must never stop"));
  }

  const learning = validateKnowledgeLearning();
  if (!learning.continuousLearningReady) {
    violations.push(
      violation("LEARNING_STOPPED", ruleId, "Continuous learning pipeline not ready"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleKnowledgeIsShared(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_SHARED;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.localHiddenRules) {
    violations.push(
      violation("FRAGMENTED_KNOWLEDGE", ruleId, "Local or hidden agent rules violate unified knowledge base"),
    );
  }

  const retrievalCatalog = buildRetrievalCatalog();
  const validatableCatalog = buildValidatableKnowledgeCatalog();
  if (retrievalCatalog.length < 10 || validatableCatalog.length < 10) {
    violations.push(
      violation("FRAGMENTED_KNOWLEDGE", ruleId, "Unified knowledge catalog too small for shared agent access"),
    );
  }

  const philosophy = validateDesignKnowledgePhilosophy();
  if (!philosophy.unifiedBase) {
    violations.push(
      violation("FRAGMENTED_KNOWLEDGE", ruleId, "Knowledge base is fragmented across agents"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleKnowledgeOverPrompt(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_OVER_PROMPT;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  const philosophy = validateDesignKnowledgePhilosophy(
    context.promptOnlyKnowledge ? { promptOnlyKnowledge: true } : {},
  );
  if (!philosophy.valid && philosophy.violations.some((v) => v.code === "PROMPT_ONLY_KNOWLEDGE")) {
    violations.push(
      violation("PROMPT_AS_KNOWLEDGE", ruleId, "Prompt cannot be the knowledge source"),
    );
  }

  if (context.promptOnlyKnowledge) {
    violations.push(
      violation("PROMPT_AS_KNOWLEDGE", ruleId, "Prompt-only knowledge architecture is invalid"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleBusinessBeforeBeauty(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.BUSINESS_BEFORE_BEAUTY;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.beautyWithoutBusiness) {
    violations.push(
      violation("BEAUTY_WITHOUT_BUSINESS", ruleId, "Aesthetic-only decision without commercial rationale"),
    );
  }

  const catalog = buildValidatableKnowledgeCatalog();
  const withoutBusiness = catalog.filter((e) => !e.businessGoal && e.kind !== "anti_pattern");
  const ratio = withoutBusiness.length / Math.max(catalog.length, 1);
  if (ratio > 0.85) {
    violations.push(
      violation(
        "BEAUTY_WITHOUT_BUSINESS",
        ruleId,
        "Too many rules lack business goal — commercial effectiveness required",
      ),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleConsistencyBeforeCreativity(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.CONSISTENCY_BEFORE_CREATIVITY;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.incompatibleCreativity) {
    violations.push(
      violation("INCONSISTENT_CREATIVITY", ruleId, "Creative solution incompatible with knowledge architecture"),
    );
  }

  const versioning = validateKnowledgeVersioning();
  if (!versioning.rollbackReady) {
    violations.push(
      violation("INCONSISTENT_CREATIVITY", ruleId, "Version rollback not ready — creativity may break consistency"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRulePatternAndAntiPatternTogether(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.PATTERN_AND_ANTI_PATTERN_TOGETHER;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.patternsWithoutAntiPatterns || SEED_DESIGN_PATTERNS.length === 0 || SEED_DESIGN_ANTI_PATTERNS.length === 0) {
    violations.push(
      violation("MISSING_ANTI_PATTERNS", ruleId, "System must maintain both patterns and anti-patterns"),
    );
  }

  if (SEED_DESIGN_PATTERNS.length > 0 && SEED_DESIGN_ANTI_PATTERNS.length === 0) {
    violations.push(
      violation("MISSING_ANTI_PATTERNS", ruleId, "Patterns exist without corresponding anti-pattern library"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleHumanKnowledgeComesFirst(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.HUMAN_KNOWLEDGE_COMES_FIRST;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.replaceExpertWithoutReview) {
    violations.push(
      violation("EXPERT_KNOWLEDGE_REPLACED", ruleId, "Expert knowledge replaced without review"),
    );
  }

  const expertRules = getSeedKnowledgeRules().filter((r) => r.origin === KnowledgeOrigin.EXPERT);
  if (expertRules.length === 0) {
    violations.push(
      violation("EXPERT_KNOWLEDGE_REPLACED", ruleId, "No expert-origin seed rules — human knowledge must come first"),
    );
  }

  const learningOnly = getSeedKnowledgeRules().every((r) => r.origin === KnowledgeOrigin.PLATFORM_LEARNING);
  if (learningOnly) {
    violations.push(
      violation("EXPERT_KNOWLEDGE_REPLACED", ruleId, "All knowledge from platform learning — expert foundation missing"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleKnowledgeMustEvolveSafely(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_MUST_EVOLVE_SAFELY;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (context.unsafeEvolution) {
    violations.push(
      violation("UNSAFE_EVOLUTION", ruleId, "Knowledge evolution without verification or rollback"),
    );
  }

  const versioning = validateKnowledgeVersioning();
  if (!versioning.valid || !versioning.rollbackReady || !versioning.snapshotCapable) {
    violations.push(
      violation("UNSAFE_EVOLUTION", ruleId, "Safe evolution requires versioning, rollback, and snapshots"),
    );
  }

  const validation = validatePublishedKnowledgeCatalog();
  if (!validation.continuousValidationReady) {
    violations.push(
      violation("UNSAFE_EVOLUTION", ruleId, "Continuous validation required for safe evolution"),
    );
  }

  return result(ruleId, violations);
}

export function validateGoldenRuleKnowledgeIsTheCoreAsset(): DesignKnowledgeGoldenRuleCheckResult {
  const ruleId = DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_THE_CORE_ASSET;
  const violations: DesignKnowledgeGoldenRuleViolation[] = [];

  if (!DESIGN_KNOWLEDGE_ARCHITECTURE_STATEMENT.includes("Design Knowledge Engine")) {
    violations.push(
      violation("CORE_ASSET_VIOLATION", ruleId, "Architecture statement must position Knowledge Engine as core asset"),
    );
  }

  if (!FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE.includes("true intelligence")) {
    violations.push(
      violation("CORE_ASSET_VIOLATION", ruleId, "Final golden rule must declare knowledge as platform intelligence"),
    );
  }

  const subsystems = [
    validatePublishedKnowledgeCatalog().valid,
    validateKnowledgeVersioning().valid,
    validateKnowledgeLearning().valid,
    buildRetrievalCatalog().length > 0,
  ];
  if (!subsystems.every(Boolean)) {
    violations.push(
      violation("CORE_ASSET_VIOLATION", ruleId, "Knowledge Engine subsystems must be operational as core asset"),
    );
  }

  return result(ruleId, violations);
}

const RULE_VALIDATORS: Record<
  DesignKnowledgeGoldenRuleIdValue,
  (ctx: DesignKnowledgeConstitutionContext) => DesignKnowledgeGoldenRuleCheckResult
> = {
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_BEFORE_GENERATION]: validateGoldenRuleKnowledgeBeforeGeneration,
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_INDEPENDENT]: validateGoldenRuleKnowledgeIsIndependent,
  [DesignKnowledgeGoldenRuleId.EVERY_RULE_NEEDS_EVIDENCE]: () => validateGoldenRuleEveryRuleNeedsEvidence(),
  [DesignKnowledgeGoldenRuleId.EVERYTHING_MUST_BE_EXPLAINABLE]: () => validateGoldenRuleEverythingMustBeExplainable(),
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_NEVER_DISAPPEARS]: validateGoldenRuleKnowledgeNeverDisappears,
  [DesignKnowledgeGoldenRuleId.VALIDATION_BEFORE_USAGE]: validateGoldenRuleValidationBeforeUsage,
  [DesignKnowledgeGoldenRuleId.LEARNING_NEVER_STOPS]: validateGoldenRuleLearningNeverStops,
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_SHARED]: validateGoldenRuleKnowledgeIsShared,
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_OVER_PROMPT]: validateGoldenRuleKnowledgeOverPrompt,
  [DesignKnowledgeGoldenRuleId.BUSINESS_BEFORE_BEAUTY]: validateGoldenRuleBusinessBeforeBeauty,
  [DesignKnowledgeGoldenRuleId.CONSISTENCY_BEFORE_CREATIVITY]: validateGoldenRuleConsistencyBeforeCreativity,
  [DesignKnowledgeGoldenRuleId.PATTERN_AND_ANTI_PATTERN_TOGETHER]: validateGoldenRulePatternAndAntiPatternTogether,
  [DesignKnowledgeGoldenRuleId.HUMAN_KNOWLEDGE_COMES_FIRST]: validateGoldenRuleHumanKnowledgeComesFirst,
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_MUST_EVOLVE_SAFELY]: validateGoldenRuleKnowledgeMustEvolveSafely,
  [DesignKnowledgeGoldenRuleId.KNOWLEDGE_IS_THE_CORE_ASSET]: () => validateGoldenRuleKnowledgeIsTheCoreAsset(),
};

export function validateDesignKnowledgeGoldenRule(
  ruleId: DesignKnowledgeGoldenRuleIdValue,
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeGoldenRuleCheckResult {
  const validator = RULE_VALIDATORS[ruleId];
  if (!validator) {
    return result(ruleId, [
      violation("CONSTITUTION_INCOMPLETE", ruleId, `No validator for rule ${ruleId}`),
    ]);
  }
  return validator(context);
}

export function validateDesignKnowledgeConstitution(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeConstitutionReport {
  const ruleResults = DESIGN_KNOWLEDGE_CONSTITUTION_RULES.map((r) =>
    validateDesignKnowledgeGoldenRule(r.id, context),
  );
  const violations = ruleResults.flatMap((r) => r.violations);
  const rulesPassed = ruleResults.filter((r) => r.passed).length;

  return {
    valid: violations.length === 0,
    violations,
    ruleResults,
    rulesPassed,
    rulesTotal: DESIGN_KNOWLEDGE_CONSTITUTION_RULES.length,
    constitutionSatisfied: violations.length === 0,
    finalGoldenRuleSatisfied: FINAL_GOLDEN_RULE_OF_DESIGN_KNOWLEDGE.length > 100,
    architectureStatementValid: DESIGN_KNOWLEDGE_ARCHITECTURE_STATEMENT.includes("engineering knowledge base"),
  };
}

export function assertDesignKnowledgeConstitution(
  context?: DesignKnowledgeConstitutionContext,
): DesignKnowledgeConstitutionReport {
  const report = validateDesignKnowledgeConstitution(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => `[${v.ruleId}] ${v.message}`).join("; ");
    throw new Error(`Design Knowledge constitution violated: ${messages}`);
  }
  return report;
}

export function runDesignKnowledgeGoldenRules(
  context: DesignKnowledgeConstitutionContext = {},
): DesignKnowledgeConstitutionReport {
  return validateDesignKnowledgeConstitution(context);
}

export function isDesignKnowledgeGoldenRuleFailure(
  code: string,
): code is DesignKnowledgeGoldenRuleFailureCode {
  const codes: DesignKnowledgeGoldenRuleFailureCode[] = [
    "LLM_INTUITION_OVERRIDE",
    "KNOWLEDGE_NOT_INDEPENDENT",
    "MISSING_EVIDENCE",
    "UNEXPLAINABLE_KNOWLEDGE",
    "KNOWLEDGE_DELETED",
    "UNVALIDATED_KNOWLEDGE",
    "LEARNING_STOPPED",
    "FRAGMENTED_KNOWLEDGE",
    "PROMPT_AS_KNOWLEDGE",
    "BEAUTY_WITHOUT_BUSINESS",
    "INCONSISTENT_CREATIVITY",
    "MISSING_ANTI_PATTERNS",
    "EXPERT_KNOWLEDGE_REPLACED",
    "UNSAFE_EVOLUTION",
    "CORE_ASSET_VIOLATION",
    "CONSTITUTION_INCOMPLETE",
  ];
  return codes.includes(code as DesignKnowledgeGoldenRuleFailureCode);
}
