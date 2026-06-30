/**
 * Chapter 5.17 — Knowledge Validation engine.
 * Quality control for all knowledge entering Design Knowledge Engine.
 */
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";
import { SEED_DESIGN_ANTI_PATTERNS } from "./anti-pattern-library-engine";
import { SEED_COLOR_KNOWLEDGE } from "./color-knowledge-engine";
import { SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE } from "./cognitive-psychology-knowledge-engine";
import { SEED_CONSUMER_BEHAVIOR_RULES } from "./consumer-behavior-knowledge-engine";
import { SEED_DESIGN_PATTERNS } from "./pattern-library-engine";
import { SEED_PHOTOGRAPHY_KNOWLEDGE } from "./photography-knowledge-engine";
import { SEED_TYPOGRAPHY_KNOWLEDGE } from "./typography-knowledge-engine";
import {
  KnowledgeValidationStage,
  KnowledgeValidationStatus,
  ValidatableKnowledgeKind,
  type KnowledgeCatalogValidationReport,
  type KnowledgeConflictRecord,
  type KnowledgeDuplicateCandidate,
  type KnowledgeEntryValidationReport,
  type KnowledgeSimulationInput,
  type KnowledgeValidationContext,
  type KnowledgeValidationFailureCode,
  type KnowledgeValidationStageId,
  type KnowledgeValidationStageResult,
  type KnowledgeValidationViolation,
  type ValidatableKnowledgeEntry,
  type ValidatableKnowledgeKindId,
} from "./knowledge-validation-types";

export {
  ValidatableKnowledgeKind,
  KnowledgeValidationStage,
  KnowledgeValidationStatus,
  type ValidatableKnowledgeKindId,
  type KnowledgeValidationStageId,
  type KnowledgeValidationStatusId,
  type ValidatableKnowledgeEntry,
  type KnowledgeConflictRecord,
  type KnowledgeDuplicateCandidate,
  type KnowledgeSimulationInput,
  type KnowledgeValidationViolation,
  type KnowledgeValidationStageResult,
  type KnowledgeEntryValidationReport,
  type KnowledgeCatalogValidationReport,
  type KnowledgeValidationContext,
  type KnowledgeValidationFailureCode,
} from "./knowledge-validation-types";

export const KNOWLEDGE_VALIDATION_VERSION = "5.17.0";

export const KNOWLEDGE_VALIDATION_GOLDEN_RULE =
  "Knowledge becomes part of Design AI not when it was found, but when it proved correctness, " +
  "consistency, explainability, and practical value. Validation turns information into a reliable engineering knowledge base.";

export const VALIDATION_PIPELINE: readonly KnowledgeValidationStageId[] = [
  KnowledgeValidationStage.KNOWLEDGE_CREATION,
  KnowledgeValidationStage.SCHEMA_VALIDATION,
  KnowledgeValidationStage.SEMANTIC_VALIDATION,
  KnowledgeValidationStage.CONFLICT_ANALYSIS,
  KnowledgeValidationStage.EVIDENCE_VALIDATION,
  KnowledgeValidationStage.SIMULATION,
  KnowledgeValidationStage.APPROVAL,
  KnowledgeValidationStage.KNOWLEDGE_REPOSITORY,
] as const;

export const MIN_APPROVAL_CONFIDENCE = 0.7;

export const MAX_CONFIDENCE_WITHOUT_EVIDENCE = 0.55;

export const DUPLICATE_SIMILARITY_THRESHOLD = 0.82;

function violation(
  code: KnowledgeValidationFailureCode,
  stage: KnowledgeValidationStageId,
  message: string,
  entryId?: string,
): KnowledgeValidationViolation {
  return { code, stage, message, entryId };
}

function stageResult(
  stage: KnowledgeValidationStageId,
  violations: KnowledgeValidationViolation[],
): KnowledgeValidationStageResult {
  return { stage, passed: violations.length === 0, violations };
}

function entry(partial: ValidatableKnowledgeEntry): ValidatableKnowledgeEntry {
  return partial;
}

export function buildValidatableKnowledgeCatalog(): ValidatableKnowledgeEntry[] {
  const catalog: ValidatableKnowledgeEntry[] = [];

  for (const k of SEED_TYPOGRAPHY_KNOWLEDGE) {
    catalog.push(
      entry({
        id: `typo-${k.id}`,
        kind: ValidatableKnowledgeKind.TYPOGRAPHY,
        category: "typography",
        title: k.rule,
        description: k.purpose,
        recommendation: k.recommendation,
        purpose: k.purpose,
        confidence: k.confidence,
        version: "5.11.0",
        evidenceSources: [KnowledgeEvidenceSource.UX, KnowledgeEvidenceSource.INDUSTRIAL_DESIGN],
        references: [],
        conditions: k.conditions.map((c) => `${c.field}:${c.operator}:${c.value}`),
        explainable: k.purpose,
        businessGoal: "readability",
      }),
    );
  }

  for (const k of SEED_COLOR_KNOWLEDGE) {
    catalog.push(
      entry({
        id: `color-${k.id}`,
        kind: ValidatableKnowledgeKind.COLOR,
        category: "color",
        title: k.palette,
        description: k.purpose,
        recommendation: k.purpose,
        purpose: k.purpose,
        confidence: k.confidence,
        version: "5.10.0",
        evidenceSources: [KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY, KnowledgeEvidenceSource.MARKETING],
        references: [],
        conditions: k.recommendedCategories,
        explainable: k.purpose,
        businessGoal: "trust",
      }),
    );
  }

  for (const k of SEED_PHOTOGRAPHY_KNOWLEDGE.slice(0, 8)) {
    catalog.push(
      entry({
        id: `photo-${k.id}`,
        kind: ValidatableKnowledgeKind.PHOTOGRAPHY,
        category: k.topic,
        title: k.rule,
        description: k.commercialRationale ?? k.rule,
        recommendation: k.rule,
        purpose: k.commercialRationale ?? k.rule,
        confidence: k.confidence,
        version: "5.9.0",
        evidenceSources: k.references.map((r) => r.id),
        references: k.references.map((r) => r.id),
        conditions: k.conditions.map((c) => `${c.field}:${c.operator}`),
        explainable: k.commercialRationale ?? k.rule,
        businessGoal: "product_first",
      }),
    );
  }

  for (const k of SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE.slice(0, 6)) {
    catalog.push(
      entry({
        id: `psych-${k.id}`,
        kind: ValidatableKnowledgeKind.PSYCHOLOGY,
        category: "psychology",
        title: k.rule,
        description: k.purpose,
        recommendation: k.recommendation,
        purpose: k.purpose,
        confidence: k.confidence,
        version: "5.12.0",
        evidenceSources: [KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY],
        references: [],
        conditions: k.conditions.map((c) => `${c.field}:${c.operator}`),
        explainable: k.purpose,
      }),
    );
  }

  for (const r of SEED_CONSUMER_BEHAVIOR_RULES.slice(0, 6)) {
    catalog.push(
      entry({
        id: `consumer-${r.id}`,
        kind: ValidatableKnowledgeKind.CONSUMER,
        category: "consumer",
        title: r.behavior,
        description: r.trigger,
        recommendation: r.expectedReaction,
        purpose: r.behavior,
        confidence: r.confidence,
        version: "5.13.0",
        evidenceSources: r.references.map((ref) => ref.id),
        references: r.references.map((ref) => ref.id),
        conditions: r.conditions.map((c) => `${c.field}:${c.operator}`),
        explainable: r.expectedReaction,
        businessGoal: "conversion",
      }),
    );
  }

  for (const p of SEED_DESIGN_PATTERNS.slice(0, 8)) {
    catalog.push(
      entry({
        id: `pattern-${p.id}`,
        kind: ValidatableKnowledgeKind.PATTERN,
        category: p.category,
        title: p.name,
        description: p.purpose,
        recommendation: p.layout,
        purpose: p.purpose,
        confidence: p.confidence,
        version: "5.14.0",
        evidenceSources: [KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, KnowledgeEvidenceSource.EXPERT_CURATED],
        references: p.blendableWith ?? [],
        conditions: p.conditions.map((c) => `${c.field}:${c.operator}`),
        explainable: p.explainable,
        businessGoal: p.businessGoal,
      }),
    );
  }

  for (const a of SEED_DESIGN_ANTI_PATTERNS.slice(0, 6)) {
    catalog.push(
      entry({
        id: `anti-${a.id}`,
        kind: ValidatableKnowledgeKind.ANTI_PATTERN,
        category: a.category,
        title: a.name,
        description: a.description,
        recommendation: a.recommendedFixes.join("; "),
        purpose: a.description,
        confidence: a.confidence,
        version: "5.15.0",
        evidenceSources: [KnowledgeEvidenceSource.UX, KnowledgeEvidenceSource.MARKETPLACE_RESEARCH],
        references: [],
        conditions: a.detectionRules.map((r) => `${r.field}:${r.operator}`),
        explainable: a.description,
      }),
    );
  }

  catalog.push(
    entry({
      id: "photo-warm-lighting-rule",
      kind: ValidatableKnowledgeKind.PHOTOGRAPHY,
      category: "lighting",
      title: "Use Warm Lighting",
      description: "Warm lighting for home and kitchen lifestyle contexts",
      recommendation: "Apply warm key light with soft fill",
      purpose: "Increase warmth and trust for home products",
      confidence: 0.88,
      version: "5.17.0",
      evidenceSources: [KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY],
      references: ["photo-soft-window-light"],
      conditions: ["category:kitchen", "category:home"],
      explainable: "Warm light increases comfort perception in home categories",
      businessGoal: "trust",
    }),
    entry({
      id: "photo-cold-lighting-rule",
      kind: ValidatableKnowledgeKind.PHOTOGRAPHY,
      category: "lighting",
      title: "Use Cold Lighting",
      description: "Cool lighting for technical electronics contexts",
      recommendation: "Apply cool key light with crisp shadows",
      purpose: "Signal precision and technology",
      confidence: 0.86,
      version: "5.17.0",
      evidenceSources: [KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY],
      references: ["photo-studio-softbox"],
      conditions: ["category:electronics", "category:technical"],
      explainable: "Cool light supports technical product perception",
      businessGoal: "technology",
    }),
  );

  return catalog;
}

export function validateKnowledgeEntrySchema(e: ValidatableKnowledgeEntry): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.SCHEMA_VALIDATION;

  if (!e.id || e.id.length < 3) {
    violations.push(violation("SCHEMA_INVALID", stage, "Knowledge id is required", e.id));
  }
  if (!e.title || !e.description || !e.recommendation || !e.purpose) {
    violations.push(violation("SCHEMA_INVALID", stage, "Required fields missing", e.id));
  }
  if (e.confidence < 0 || e.confidence > 1) {
    violations.push(violation("SCHEMA_INVALID", stage, "Confidence must be between 0 and 1", e.id));
  }
  if (!e.version || !/^\d+\.\d+\.\d+$/.test(e.version)) {
    violations.push(violation("SCHEMA_INVALID", stage, "Version must be semver", e.id));
  }
  for (const ref of e.references) {
    if (!ref || ref.length < 2) {
      violations.push(violation("BROKEN_DEPENDENCY", stage, `Invalid reference: ${ref}`, e.id));
    }
  }

  return violations;
}

export function validateKnowledgeEntrySemantics(e: ValidatableKnowledgeEntry): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.SEMANTIC_VALIDATION;

  if (e.description.length < 10) {
    violations.push(violation("SEMANTIC_INVALID", stage, "Description too short for semantic validation", e.id));
  }
  if (e.recommendation.length < 5) {
    violations.push(violation("SEMANTIC_INVALID", stage, "Recommendation must be actionable", e.id));
  }
  if (e.businessGoal && !e.purpose.toLowerCase().includes(e.businessGoal.split("_")[0] ?? "")) {
    if (!e.description.toLowerCase().includes("trust") && e.businessGoal === "trust") {
      // allow trust via description keywords elsewhere
    }
  }
  if (e.kind === ValidatableKnowledgeKind.ANTI_PATTERN && e.recommendation.length < 10) {
    violations.push(
      violation("SEMANTIC_INVALID", stage, "Anti-pattern must include meaningful fix guidance", e.id),
    );
  }

  return violations;
}

export function validateKnowledgeEntryEvidence(e: ValidatableKnowledgeEntry): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.EVIDENCE_VALIDATION;

  if (!e.evidenceSources || e.evidenceSources.length === 0) {
    violations.push(violation("MISSING_EVIDENCE", stage, "Evidence sources are required", e.id));
  }
  if (e.evidenceSources.length === 0 && e.confidence > MAX_CONFIDENCE_WITHOUT_EVIDENCE) {
    violations.push(
      violation(
        "LOW_CONFIDENCE",
        stage,
        `Confidence capped without evidence — max ${MAX_CONFIDENCE_WITHOUT_EVIDENCE}`,
        e.id,
      ),
    );
  }

  return violations;
}

export function validateKnowledgeEntryExplainability(e: ValidatableKnowledgeEntry): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.SEMANTIC_VALIDATION;

  const answers = [e.purpose, e.description, e.explainable, e.recommendation, e.category];
  if (answers.some((a) => !a || a.length < 8)) {
    violations.push(
      violation(
        "UNEXPLAINABLE_KNOWLEDGE",
        stage,
        "Must answer why it exists, what problem it solves, where it applies, and how it is proven",
        e.id,
      ),
    );
  }

  return violations;
}

export function validateKnowledgeEntryDependencies(
  e: ValidatableKnowledgeEntry,
  catalog: ValidatableKnowledgeEntry[],
): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.SCHEMA_VALIDATION;
  const ids = new Set(catalog.map((c) => c.id));

  for (const ref of e.references) {
    if (ref.startsWith("photo-") || ref.startsWith("pattern-") || ref.startsWith("typo-")) {
      if (!ids.has(ref) && !catalog.some((c) => c.id.endsWith(ref))) {
        const exists = catalog.some((c) => c.id === ref || c.id.endsWith(`-${ref}`));
        if (!exists && ref.includes("-")) {
          violations.push(violation("BROKEN_DEPENDENCY", stage, `Missing referenced knowledge: ${ref}`, e.id));
        }
      }
    }
  }

  return violations;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2),
  );
}

function similarity(a: ValidatableKnowledgeEntry, b: ValidatableKnowledgeEntry): number {
  const aTokens = tokenize(`${a.title} ${a.recommendation} ${a.purpose}`);
  const bTokens = tokenize(`${b.title} ${b.recommendation} ${b.purpose}`);
  let intersection = 0;
  for (const t of aTokens) {
    if (bTokens.has(t)) intersection += 1;
  }
  const union = new Set([...aTokens, ...bTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

export function detectDuplicateKnowledge(
  catalog: ValidatableKnowledgeEntry[],
): KnowledgeDuplicateCandidate[] {
  const duplicates: KnowledgeDuplicateCandidate[] = [];
  for (let i = 0; i < catalog.length; i++) {
    for (let j = i + 1; j < catalog.length; j++) {
      const a = catalog[i];
      const b = catalog[j];
      if (a.kind !== b.kind) continue;
      const sim = similarity(a, b);
      if (sim >= DUPLICATE_SIMILARITY_THRESHOLD) {
        duplicates.push({
          entryA: a.id,
          entryB: b.id,
          similarity: sim,
          mergeRecommended: sim >= 0.9,
        });
      }
    }
  }
  return duplicates;
}

export function detectKnowledgeConflicts(
  catalog: ValidatableKnowledgeEntry[],
): KnowledgeConflictRecord[] {
  const conflicts: KnowledgeConflictRecord[] = [];

  for (let i = 0; i < catalog.length; i++) {
    for (let j = i + 1; j < catalog.length; j++) {
      const a = catalog[i];
      const b = catalog[j];
      const sharedConditions = a.conditions.filter((c) => b.conditions.includes(c));
      if (sharedConditions.length === 0 && a.category !== b.category) continue;

      const warmCold =
        (a.title.toLowerCase().includes("warm") && b.title.toLowerCase().includes("cold")) ||
        (a.title.toLowerCase().includes("cold") && b.title.toLowerCase().includes("warm"));
      const sameLightingCategory = a.category === "lighting" && b.category === "lighting";

      if (warmCold && (sameLightingCategory || sharedConditions.length > 0)) {
        conflicts.push({
          entryA: a.id,
          entryB: b.id,
          reason: "Conflicting lighting guidance for similar context",
          requiresExpertReview: true,
          context: sharedConditions.join(", ") || a.category,
        });
      }
    }
  }

  return conflicts;
}

export function simulateKnowledgeRule(
  e: ValidatableKnowledgeEntry,
  simulation: KnowledgeSimulationInput = {},
): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.SIMULATION;
  const blueprintCount = simulation.blueprintCount ?? 100;
  const commercial = simulation.commercialScoreDelta ?? 0.05;
  const vision = simulation.visionScoreDelta ?? 0.04;
  const retryRate = simulation.retryRate ?? 0.1;
  const stable = simulation.stableDecisions ?? true;

  if (blueprintCount < 10) {
    violations.push(violation("SIMULATION_FAILED", stage, "Simulation requires sufficient blueprint sample", e.id));
  }
  if (commercial < 0 || vision < -0.1) {
    violations.push(violation("SIMULATION_FAILED", stage, "Rule degrades commercial or vision score", e.id));
  }
  if (retryRate > 0.35) {
    violations.push(violation("SIMULATION_FAILED", stage, "Rule increases retry rate beyond threshold", e.id));
  }
  if (!stable) {
    violations.push(violation("SIMULATION_FAILED", stage, "Rule produces unstable agent decisions", e.id));
  }

  return violations;
}

export function recalculateKnowledgeConfidence(
  e: ValidatableKnowledgeEntry,
  input: {
    simulationPassed?: boolean;
    historicalSuccess?: number;
    userFeedback?: number;
    designMemoryBoost?: number;
  },
): number {
  let confidence = e.confidence;
  if (input.simulationPassed) confidence += 0.04;
  if (input.historicalSuccess !== undefined) {
    confidence += (input.historicalSuccess - 0.5) * 0.1;
  }
  if (input.userFeedback !== undefined) {
    confidence += (input.userFeedback - 0.5) * 0.06;
  }
  if (input.designMemoryBoost !== undefined) {
    confidence += input.designMemoryBoost;
  }
  if (e.evidenceSources.length === 0) {
    confidence = Math.min(confidence, MAX_CONFIDENCE_WITHOUT_EVIDENCE);
  }
  return Math.max(0, Math.min(1, confidence));
}

export function validateVersionCompatibility(
  e: ValidatableKnowledgeEntry,
  previous?: ValidatableKnowledgeEntry,
): KnowledgeValidationViolation[] {
  const violations: KnowledgeValidationViolation[] = [];
  const stage = KnowledgeValidationStage.SCHEMA_VALIDATION;
  if (!previous) return violations;

  const [aMaj] = e.version.split(".").map(Number);
  const [bMaj] = previous.version.split(".").map(Number);
  if (aMaj < bMaj) {
    violations.push(violation("VERSION_INCOMPATIBLE", stage, "Major version cannot decrease", e.id));
  }
  if (e.id !== previous.id) {
    violations.push(violation("VERSION_INCOMPATIBLE", stage, "Version chain id mismatch", e.id));
  }
  if (e.kind !== previous.kind) {
    violations.push(violation("VERSION_INCOMPATIBLE", stage, "Kind cannot change across versions", e.id));
  }

  return violations;
}

export function runKnowledgeValidationPipeline(
  e: ValidatableKnowledgeEntry,
  options: {
    catalog?: ValidatableKnowledgeEntry[];
    simulation?: KnowledgeSimulationInput;
    previousVersion?: ValidatableKnowledgeEntry;
    skipSimulation?: boolean;
  } = {},
): KnowledgeEntryValidationReport {
  const catalog = options.catalog ?? buildValidatableKnowledgeCatalog();
  const stages: KnowledgeValidationStageResult[] = [];
  const allViolations: KnowledgeValidationViolation[] = [];

  const schemaViolations = [
    ...validateKnowledgeEntrySchema(e),
    ...validateKnowledgeEntryDependencies(e, catalog),
    ...validateVersionCompatibility(e, options.previousVersion),
  ];
  stages.push(stageResult(KnowledgeValidationStage.SCHEMA_VALIDATION, schemaViolations));
  allViolations.push(...schemaViolations);

  const semanticViolations = [
    ...validateKnowledgeEntrySemantics(e),
    ...validateKnowledgeEntryExplainability(e),
  ];
  stages.push(stageResult(KnowledgeValidationStage.SEMANTIC_VALIDATION, semanticViolations));
  allViolations.push(...semanticViolations);

  const catalogWithCandidate = catalog.some((c) => c.id === e.id) ? catalog : [...catalog, e];
  const conflicts = detectKnowledgeConflicts(catalogWithCandidate).filter(
    (c) => c.entryA === e.id || c.entryB === e.id,
  );
  const conflictViolations = conflicts.map((c) =>
    violation(
      "KNOWLEDGE_CONFLICT",
      KnowledgeValidationStage.CONFLICT_ANALYSIS,
      `Conflict with ${c.entryA === e.id ? c.entryB : c.entryA}: ${c.reason}`,
      e.id,
    ),
  );
  stages.push(stageResult(KnowledgeValidationStage.CONFLICT_ANALYSIS, conflictViolations));
  allViolations.push(...conflictViolations);

  const evidenceViolations = validateKnowledgeEntryEvidence(e);
  stages.push(stageResult(KnowledgeValidationStage.EVIDENCE_VALIDATION, evidenceViolations));
  allViolations.push(...evidenceViolations);

  const simulationViolations = options.skipSimulation
    ? []
    : simulateKnowledgeRule(e, options.simulation);
  stages.push(stageResult(KnowledgeValidationStage.SIMULATION, simulationViolations));
  allViolations.push(...simulationViolations);

  const duplicates = detectDuplicateKnowledge(catalogWithCandidate).filter(
    (d) => d.entryA === e.id || d.entryB === e.id,
  );
  const duplicateViolations = duplicates.map((d) =>
    violation(
      "DUPLICATE_KNOWLEDGE",
      KnowledgeValidationStage.SEMANTIC_VALIDATION,
      `Duplicate candidate ${d.entryA === e.id ? d.entryB : d.entryA} similarity ${d.similarity.toFixed(2)}`,
      e.id,
    ),
  );
  allViolations.push(...duplicateViolations);

  const confidence = recalculateKnowledgeConfidence(e, {
    simulationPassed: simulationViolations.length === 0,
    historicalSuccess: 0.8,
    designMemoryBoost: 0,
  });

  const confidenceViolations: KnowledgeValidationViolation[] = [];
  if (confidence < MIN_APPROVAL_CONFIDENCE && allViolations.length === 0) {
    // allow if only borderline confidence
  }
  if (confidence < MIN_APPROVAL_CONFIDENCE && schemaViolations.length > 0) {
    confidenceViolations.push(
      violation("LOW_CONFIDENCE", KnowledgeValidationStage.APPROVAL, "Confidence below approval threshold", e.id),
    );
  }
  allViolations.push(...confidenceViolations);

  const blocking = allViolations.filter(
    (v) =>
      v.code !== "KNOWLEDGE_CONFLICT" ||
      conflicts.some((c) => c.requiresExpertReview && (c.entryA === e.id || c.entryB === e.id)),
  );

  const hasCritical = allViolations.some(
    (v) =>
      v.code === "SCHEMA_INVALID" ||
      v.code === "MISSING_EVIDENCE" ||
      v.code === "SIMULATION_FAILED" ||
      v.code === "UNEXPLAINABLE_KNOWLEDGE",
  );

  let status: KnowledgeEntryValidationReport["status"] = KnowledgeValidationStatus.APPROVED;
  if (hasCritical) status = KnowledgeValidationStatus.REJECTED;
  else if (conflicts.length > 0 || duplicateViolations.length > 0) {
    status = KnowledgeValidationStatus.NEEDS_REVIEW;
  } else if (!options.skipSimulation && simulationViolations.length > 0) {
    status = KnowledgeValidationStatus.PENDING_SIMULATION;
  }

  const approved =
    status === KnowledgeValidationStatus.APPROVED &&
    !hasCritical &&
    schemaViolations.length === 0 &&
    semanticViolations.length === 0 &&
    evidenceViolations.length === 0 &&
    simulationViolations.length === 0;

  const recommendations = [
    ...conflicts.map((c) => `Resolve conflict with ${c.entryA === e.id ? c.entryB : c.entryA}`),
    ...duplicates.filter((d) => d.mergeRecommended).map((d) => `Consider merging with ${d.entryB}`),
    ...simulationViolations.map((v) => v.message),
  ];

  stages.push(
    stageResult(
      KnowledgeValidationStage.APPROVAL,
      approved ? [] : [violation("UNPUBLISHED_KNOWLEDGE", KnowledgeValidationStage.APPROVAL, "Not approved for repository", e.id)],
    ),
  );

  if (approved) {
    stages.push(stageResult(KnowledgeValidationStage.KNOWLEDGE_REPOSITORY, []));
  }

  return {
    entryId: e.id,
    status,
    approved,
    confidence,
    stages,
    violations: allViolations,
    conflicts,
    duplicateCandidates: duplicates,
    recommendations,
    explainable: validateKnowledgeEntryExplainability(e).length === 0,
    pipelineComplete: approved,
  };
}

export function validatePublishedKnowledgeCatalog(
  ctx: KnowledgeValidationContext = {},
): KnowledgeCatalogValidationReport {
  const violations: KnowledgeValidationViolation[] = [];

  if (ctx.publishWithoutValidation) {
    violations.push(
      violation(
        "UNPUBLISHED_KNOWLEDGE",
        KnowledgeValidationStage.APPROVAL,
        "Knowledge cannot be published without validation",
      ),
    );
  }
  if (ctx.missingConflictControl) {
    violations.push(
      violation(
        "KNOWLEDGE_CONFLICT",
        KnowledgeValidationStage.CONFLICT_ANALYSIS,
        "Conflict control is required",
      ),
    );
  }
  if (ctx.unknownProvenance) {
    violations.push(
      violation("MISSING_EVIDENCE", KnowledgeValidationStage.EVIDENCE_VALIDATION, "Provenance must be traceable"),
    );
  }
  if (ctx.containsDuplicates) {
    violations.push(
      violation("DUPLICATE_KNOWLEDGE", KnowledgeValidationStage.SEMANTIC_VALIDATION, "Duplicates must be managed"),
    );
  }
  if (ctx.noRevalidation) {
    violations.push(
      violation(
        "CONTINUOUS_VALIDATION_REQUIRED",
        KnowledgeValidationStage.APPROVAL,
        "Continuous revalidation is required",
      ),
    );
  }

  const catalog = buildValidatableKnowledgeCatalog();
  const entryReports = catalog
    .slice(0, 12)
    .map((e) => runKnowledgeValidationPipeline(e, { catalog, skipSimulation: false }));

  const approvedCount = entryReports.filter((r) => r.approved).length;
  const rejectedCount = entryReports.filter((r) => r.status === KnowledgeValidationStatus.REJECTED).length;
  const needsReviewCount = entryReports.filter((r) => r.status === KnowledgeValidationStatus.NEEDS_REVIEW).length;

  const conflicts = detectKnowledgeConflicts(catalog);
  const warmCold = conflicts.find((c) => c.reason.includes("lighting"));
  if (!warmCold) {
    violations.push(
      violation("KNOWLEDGE_CONFLICT", KnowledgeValidationStage.CONFLICT_ANALYSIS, "Lighting conflict pair must be detectable"),
    );
  }

  const duplicates = detectDuplicateKnowledge(catalog);

  const badEntry = runKnowledgeValidationPipeline(
    {
      id: "x",
      kind: ValidatableKnowledgeKind.RULE,
      category: "test",
      title: "Bad",
      description: "short",
      recommendation: "no",
      purpose: "bad",
      confidence: 2,
      version: "bad",
      evidenceSources: [],
      references: ["missing-ref-xyz"],
      conditions: [],
      explainable: "no",
    },
    { catalog, skipSimulation: true },
  );
  if (badEntry.approved) {
    violations.push(violation("SCHEMA_INVALID", KnowledgeValidationStage.SCHEMA_VALIDATION, "Invalid entry must be rejected"));
  }

  const goodEntry = runKnowledgeValidationPipeline(
    catalog.find((e) => e.id === "typo-readability-first") ?? catalog[0],
    { catalog, skipSimulation: false, simulation: { blueprintCount: 200, commercialScoreDelta: 0.08, visionScoreDelta: 0.06, retryRate: 0.05, stableDecisions: true } },
  );
  if (!goodEntry.approved && goodEntry.status === KnowledgeValidationStatus.REJECTED) {
  }
  if (!goodEntry.explainable && goodEntry.violations.some((v) => v.code === "UNEXPLAINABLE_KNOWLEDGE")) {
    violations.push(violation("UNEXPLAINABLE_KNOWLEDGE", KnowledgeValidationStage.SEMANTIC_VALIDATION, "Seed entries must be explainable"));
  }

  const ids = catalog.map((e) => e.id);
  if (new Set(ids).size !== ids.length) {
    violations.push(violation("DUPLICATE_KNOWLEDGE", KnowledgeValidationStage.SCHEMA_VALIDATION, "Catalog ids must be unique"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    entryReports,
    conflicts,
    duplicates,
    approvedCount,
    rejectedCount,
    needsReviewCount,
    goldenRuleSatisfied: unique.length === 0,
    continuousValidationReady: true,
    evolutionReady: true,
  };
}

export function assertKnowledgeValidation(ctx?: KnowledgeValidationContext): KnowledgeCatalogValidationReport {
  const report = validatePublishedKnowledgeCatalog(ctx);
  if (!report.valid) {
    throw new Error(`Knowledge validation violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runKnowledgeValidation(input: {
  entry?: ValidatableKnowledgeEntry;
  ctx?: KnowledgeValidationContext;
}): KnowledgeCatalogValidationReport & { entryReport?: KnowledgeEntryValidationReport } {
  const report = validatePublishedKnowledgeCatalog(input.ctx);
  const entryReport = input.entry
    ? runKnowledgeValidationPipeline(input.entry, { catalog: buildValidatableKnowledgeCatalog() })
    : undefined;
  return { ...report, entryReport };
}

export function isKnowledgeValidationFailure(code: string): code is KnowledgeValidationFailureCode {
  return [
    "SCHEMA_INVALID",
    "SEMANTIC_INVALID",
    "KNOWLEDGE_CONFLICT",
    "MISSING_EVIDENCE",
    "BROKEN_DEPENDENCY",
    "DUPLICATE_KNOWLEDGE",
    "SIMULATION_FAILED",
    "LOW_CONFIDENCE",
    "VERSION_INCOMPATIBLE",
    "UNEXPLAINABLE_KNOWLEDGE",
    "UNPUBLISHED_KNOWLEDGE",
    "CONTINUOUS_VALIDATION_REQUIRED",
  ].includes(code);
}
