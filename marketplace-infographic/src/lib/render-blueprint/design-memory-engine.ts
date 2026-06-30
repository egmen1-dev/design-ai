/**
 * Chapter 4.20 — Design Memory engine.
 * Long-term statistical knowledge — learns from outcomes, never mutates current blueprint.
 */
import type { AgentContractId } from "./agent-contracts";
import type { RenderBlueprint } from "./types";
import { FinalDecision } from "./chief-design-director-types";
import {
  UserFeedback,
  type CommercialMetrics,
  type DesignKnowledgeStore,
  type DesignMemoryContext,
  type KnowledgeDelta,
  type MemoryExplainabilityReport,
  type MemoryFailureCode,
  type MemoryQuery,
  type MemoryQueryResult,
  type MemoryUpdate,
  type MemoryValidationReport,
  type Pattern,
  type PatternDimensions,
  type WeightEntry,
  type WeightMap,
} from "./design-memory-types";

export {
  UserFeedback,
  type UserFeedbackId,
  type CommercialMetrics,
  type PatternDimensions,
  type Pattern,
  type WeightEntry,
  type WeightMap,
  type KnowledgeDelta,
  type MemoryUpdate,
  type DesignMemoryContext,
  type MemoryQuery,
  type MemoryQueryResult,
  type DesignKnowledgeStore,
  type MemoryExplainabilityReport,
  type MemoryValidationReport,
  type MemoryFailureCode,
} from "./design-memory-types";

export const DESIGN_MEMORY_VERSION = "4.20.0";

export const DESIGN_MEMORY_GOLDEN_RULE =
  "Design Memory does not remember images — it remembers which design decisions " +
  "actually lead to successful commercial cards and gradually teaches the Design AI architecture.";

export const DESIGN_MEMORY_ID: AgentContractId = "design-memory";

export const DESIGN_MEMORY_PIPELINE_POSITION = [
  "chief-design-director",
  "approved-result",
  DESIGN_MEMORY_ID,
  "knowledge-update",
  "future-generations",
] as const;

export const MEMORY_EMA_ALPHA = 0.12;
export const MEMORY_AGING_HALF_LIFE_MS = 180 * 24 * 60 * 60 * 1000;
export const MEMORY_MIN_SAMPLES_FOR_RECOMMENDATION = 5;
export const MEMORY_SUCCESS_THRESHOLD = 0.72;
export const MEMORY_FAILURE_THRESHOLD = 0.38;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function scopeKey(category: string, provider: string): string {
  return `${category}::${provider}`;
}

function patternKey(
  category: string,
  provider: string,
  dimensions: PatternDimensions,
): string {
  const parts = [
    category,
    provider,
    dimensions.story ?? "",
    dimensions.scene ?? "",
    dimensions.environment ?? "",
    dimensions.lighting ?? "",
    dimensions.lightingScheme ?? "",
    dimensions.materials ?? "",
    dimensions.camera ?? "",
    dimensions.photography ?? "",
  ];
  return parts.join("|");
}

export function createEmptyDesignKnowledgeStore(): DesignKnowledgeStore {
  return {
    version: DESIGN_MEMORY_VERSION,
    patterns: {},
    weightsByScope: {},
    avoidPatternIds: [],
    totalSamples: 0,
    updatedAt: Date.now(),
  };
}

export function extractBlueprintPattern(blueprint: Readonly<RenderBlueprint>): PatternDimensions {
  const primaryMaterial =
    blueprint.materials.surfaceMaterials?.[0]?.id ??
    blueprint.materials.materialWorld ??
    blueprint.product.materials[0] ??
    "unknown";

  return {
    story: blueprint.story.storyType ?? blueprint.story.emotionalTone,
    scene: blueprint.scene.sceneType,
    environment: blueprint.scene.environment,
    lighting: blueprint.lighting.lightingStyle,
    lightingScheme: blueprint.lighting.lightingScheme,
    materials: primaryMaterial,
    camera: blueprint.camera.cameraStyle,
    photography: blueprint.photography.photographyStyle,
  };
}

export function computeMemoryOutcomeScore(
  ctx: DesignMemoryContext,
  commercialMetrics?: CommercialMetrics,
): number {
  const metrics = commercialMetrics ?? ctx.commercialMetrics;
  let score = 0.2;

  if (ctx.chiefReview.approved) score += 0.28;
  score += (ctx.chiefReview.overallScore / 100) * 0.22;
  score += (ctx.visionReport.overallScore / 100) * 0.15;

  if (ctx.photoReview) {
    score += (ctx.photoReview.score / 100) * 0.1;
    if (ctx.photoReview.looksLikePhoto) score += 0.05;
  }

  if (ctx.userFeedback === UserFeedback.LIKE) score += 0.18;
  if (ctx.userFeedback === UserFeedback.DISLIKE) score -= 0.35;

  if (metrics?.ctr !== undefined) {
    score += Math.min(0.12, metrics.ctr * 0.12);
  }
  if (metrics?.conversion !== undefined) {
    score += Math.min(0.1, metrics.conversion * 0.1);
  }
  if (metrics?.addToCart !== undefined) {
    score += Math.min(0.08, metrics.addToCart * 0.08);
  }
  if (metrics?.userRating !== undefined) {
    score += ((metrics.userRating / 5) - 0.5) * 0.1;
  }
  if (metrics?.timeOnCardMs !== undefined && metrics.timeOnCardMs > 2500) {
    score += 0.04;
  }

  if (ctx.chiefReview.finalDecision === FinalDecision.REJECT) {
    score -= 0.25;
  }

  return clamp01(score);
}

function agingDecay(lastSeenAt: number, now: number): number {
  const ageMs = Math.max(0, now - lastSeenAt);
  return Math.pow(0.5, ageMs / MEMORY_AGING_HALF_LIFE_MS);
}

function emaUpdate(entry: WeightEntry | undefined, outcome: number, alpha: number): WeightEntry {
  const prev = entry ?? { weight: 0.5, samples: 0, avgScore: 0.5, decayFactor: 1 };
  return {
    weight: alpha * outcome + (1 - alpha) * prev.weight,
    samples: prev.samples + 1,
    avgScore: alpha * outcome + (1 - alpha) * prev.avgScore,
    decayFactor: prev.decayFactor,
  };
}

function upsertWeight(
  map: WeightMap,
  key: string,
  outcome: number,
  changes: KnowledgeDelta[],
  section: string,
  reason: string,
): void {
  const before = map[key]?.weight ?? 0.5;
  map[key] = emaUpdate(map[key], outcome, MEMORY_EMA_ALPHA);
  const delta = map[key].weight - before;
  if (Math.abs(delta) >= 0.008) {
    changes.push({
      key,
      section,
      delta: Number(delta.toFixed(3)),
      reason,
    });
  }
}

function buildPatternExplanation(
  dimensions: PatternDimensions,
  successRate: number,
  sampleCount: number,
  avgScore: number,
): string {
  const combo = [
    dimensions.scene,
    dimensions.lighting,
    dimensions.materials,
    dimensions.camera,
  ]
    .filter(Boolean)
    .join(" + ");
  return `${combo || "pattern"} — used ${sampleCount} times, success ${(successRate * 100).toFixed(1)}%, avg score ${avgScore.toFixed(1)}`;
}

function updatePatternRecord(
  store: DesignKnowledgeStore,
  patternId: string,
  dimensions: PatternDimensions,
  category: string,
  provider: string,
  outcome: number,
  now: number,
): Pattern {
  const existing = store.patterns[patternId];
  const sampleCount = (existing?.sampleCount ?? 0) + 1;
  const successCount =
    (existing ? existing.successRate * existing.sampleCount : 0) +
    (outcome >= MEMORY_SUCCESS_THRESHOLD ? 1 : 0);
  const successRate = successCount / sampleCount;
  const avgScore = existing
    ? existing.avgScore * 0.88 + outcome * 100 * 0.12
    : outcome * 100;

  const pattern: Pattern = {
    id: patternId,
    dimensions,
    category,
    provider,
    successRate,
    sampleCount,
    avgScore,
    lastSeenAt: now,
    explanation: buildPatternExplanation(dimensions, successRate, sampleCount, avgScore),
  };

  store.patterns[patternId] = pattern;
  return pattern;
}

function detectRetryLearning(
  ctx: DesignMemoryContext,
  changes: KnowledgeDelta[],
  weights: WeightMap,
): string | undefined {
  const history = ctx.retryHistory;
  if (!history || history.attempts < 1) return undefined;

  const scoreGain = ctx.chiefReview.estimatedScoreAfterRetry - ctx.chiefReview.overallScore;
  if (scoreGain < 8) return undefined;

  const strategy = history.strategiesUsed.at(-1);
  if (!strategy) return undefined;

  const section =
    strategy.includes("lighting") ? "lighting"
      : strategy.includes("camera") ? "camera"
        : strategy.includes("material") ? "materials"
          : strategy.includes("scene") ? "scene"
            : strategy.includes("photography") ? "photography"
              : "meta";

  upsertWeight(
    weights,
    `retry:${strategy}`,
    clamp01(scoreGain / 30),
    changes,
    section,
    `Retry ${strategy} improved score ${ctx.chiefReview.overallScore} → ${ctx.chiefReview.estimatedScoreAfterRetry}`,
  );

  return `Retry learning: ${strategy} improved outcome (+${scoreGain} estimated score)`;
}

function detectFailureCombo(
  dimensions: PatternDimensions,
  outcome: number,
): boolean {
  const darkBg =
    dimensions.scene === "industrial" ||
    dimensions.environment === "outdoor" ||
    dimensions.lighting === "technology_cool";
  const darkProduct = dimensions.materials === "matte_plastic";
  return outcome < MEMORY_FAILURE_THRESHOLD && darkBg && darkProduct;
}

export function buildMemoryUpdate(
  blueprint: Readonly<RenderBlueprint>,
  ctx: DesignMemoryContext,
  store: DesignKnowledgeStore = createEmptyDesignKnowledgeStore(),
): { update: MemoryUpdate; explainability: MemoryExplainabilityReport; store: DesignKnowledgeStore } {
  const now = ctx.completedAt ?? Date.now();
  const category = blueprint.product.category;
  const provider = ctx.generationMetadata?.provider ?? blueprint.meta.generator;
  const scope = scopeKey(category, provider);
  const dimensions = extractBlueprintPattern(blueprint);
  const patternId = patternKey(category, provider, dimensions);
  const outcome = computeMemoryOutcomeScore(ctx);

  const nextStore: DesignKnowledgeStore = {
    ...store,
    patterns: { ...store.patterns },
    weightsByScope: { ...store.weightsByScope },
    avoidPatternIds: [...store.avoidPatternIds],
    totalSamples: store.totalSamples + 1,
    updatedAt: now,
  };

  if (!nextStore.weightsByScope[scope]) {
    nextStore.weightsByScope[scope] = {};
  }
  const weights = { ...nextStore.weightsByScope[scope] };
  const knowledgeChanges: KnowledgeDelta[] = [];

  const pattern = updatePatternRecord(
    nextStore,
    patternId,
    dimensions,
    category,
    provider,
    outcome,
    now,
  );

  if (dimensions.lighting) {
    upsertWeight(weights, `lighting:${dimensions.lighting}`, outcome, knowledgeChanges, "lighting", "Lighting pattern outcome");
  }
  if (dimensions.scene) {
    upsertWeight(weights, `scene:${dimensions.scene}`, outcome, knowledgeChanges, "scene", "Scene pattern outcome");
  }
  if (dimensions.materials) {
    upsertWeight(weights, `materials:${dimensions.materials}`, outcome, knowledgeChanges, "materials", "Material pattern outcome");
  }
  if (dimensions.camera) {
    upsertWeight(weights, `camera:${dimensions.camera}`, outcome, knowledgeChanges, "camera", "Camera pattern outcome");
  }
  if (dimensions.photography) {
    upsertWeight(weights, `photography:${dimensions.photography}`, outcome, knowledgeChanges, "photography", "Photography pattern outcome");
  }

  const comboKey = `combo:${[dimensions.scene, dimensions.lighting, dimensions.materials].filter(Boolean).join("+")}`;
  upsertWeight(weights, comboKey, outcome, knowledgeChanges, "combo", "Cross-section combo outcome");

  const retryLearning = detectRetryLearning(ctx, knowledgeChanges, weights);

  if (detectFailureCombo(dimensions, outcome) && !nextStore.avoidPatternIds.includes(patternId)) {
    nextStore.avoidPatternIds.push(patternId);
  }

  nextStore.weightsByScope[scope] = weights;

  const successfulPatterns: Pattern[] = [];
  const unsuccessfulPatterns: Pattern[] = [];

  if (outcome >= MEMORY_SUCCESS_THRESHOLD) {
    successfulPatterns.push(pattern);
  } else if (outcome < MEMORY_FAILURE_THRESHOLD) {
    unsuccessfulPatterns.push(pattern);
  }

  const recommendedPatterns = Object.values(nextStore.patterns)
    .filter((p) => p.category === category && p.provider === provider)
    .filter((p) => p.sampleCount >= MEMORY_MIN_SAMPLES_FOR_RECOMMENDATION)
    .filter((p) => p.successRate >= MEMORY_SUCCESS_THRESHOLD)
    .map((p) => ({
      ...p,
      weight: (weights[`lighting:${p.dimensions.lighting}`]?.weight ?? 0.5) * agingDecay(p.lastSeenAt, now),
    }))
    .sort((a, b) => b.successRate * b.sampleCount - a.successRate * a.sampleCount)
    .slice(0, 5)
    .map(({ weight: _w, ...p }) => p);

  const avoidPatterns = nextStore.avoidPatternIds
    .map((id) => nextStore.patterns[id])
    .filter((p): p is Pattern => Boolean(p))
    .filter((p) => p.category === category && p.provider === provider);

  const marketplaceLearning =
    ctx.commercialMetrics?.ctr !== undefined
      ? `Marketplace CTR ${(ctx.commercialMetrics.ctr * 100).toFixed(1)}% weighted into outcome`
      : undefined;

  const userFeedbackImpact =
    ctx.userFeedback === UserFeedback.LIKE
      ? "User like reinforced used design decisions"
      : ctx.userFeedback === UserFeedback.DISLIKE
        ? "User dislike penalized pattern weights"
        : undefined;

  const explainability: MemoryExplainabilityReport = {
    agentId: DESIGN_MEMORY_ID,
    outcomeScore: outcome,
    category,
    provider,
    retryLearning,
    marketplaceLearning,
    userFeedbackImpact,
    reasoning: [
      `Outcome score ${(outcome * 100).toFixed(1)} fused from chief (${ctx.chiefReview.overallScore}), vision (${ctx.visionReport.overallScore}), and commercial signals`,
      `Pattern ${patternId} updated — ${pattern.sampleCount} samples, success ${(pattern.successRate * 100).toFixed(1)}%`,
      `Category-scoped knowledge for ${category} ≠ other categories; provider ${provider} isolated`,
      retryLearning ?? "No significant retry learning detected",
      marketplaceLearning ?? "No marketplace metrics available — statistical score only",
      outcome >= MEMORY_SUCCESS_THRESHOLD
        ? "Successful pattern recorded for future recommendations"
        : outcome < MEMORY_FAILURE_THRESHOLD
          ? "Unsuccessful pattern recorded — may enter avoid list"
          : "Neutral outcome — gradual weight adjustment only",
    ],
  };

  const update: MemoryUpdate = {
    successfulPatterns,
    unsuccessfulPatterns,
    updatedWeights: weights,
    avoidPatterns,
    recommendedPatterns,
    knowledgeChanges,
    confidence: Math.max(0.5, Math.min(0.98, 0.75 + pattern.sampleCount * 0.02 - unsuccessfulPatterns.length * 0.05)),
  };

  return { update, explainability, store: nextStore };
}

export function queryDesignMemory(
  store: DesignKnowledgeStore,
  query: MemoryQuery,
): MemoryQueryResult {
  const scope = scopeKey(query.category, query.provider);
  const weights = store.weightsByScope[scope] ?? {};
  const now = Date.now();

  const ranked = (prefix: string): string[] =>
    Object.entries(weights)
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, entry]) => ({
        value: key.slice(prefix.length),
        score: entry.weight * entry.decayFactor * agingDecay(store.updatedAt, now),
        samples: entry.samples,
        avgScore: entry.avgScore,
      }))
      .filter((e) => e.samples >= MEMORY_MIN_SAMPLES_FOR_RECOMMENDATION)
      .sort((a, b) => b.score - a.score)
      .map((e) => e.value);

  const avoidPatterns = store.avoidPatternIds
    .map((id) => store.patterns[id])
    .filter((p): p is Pattern => Boolean(p))
    .filter((p) => p.category === query.category && p.provider === query.provider);

  const explanations: string[] = [];
  const topLighting = ranked("lighting:")[0];
  if (topLighting) {
    const entry = weights[`lighting:${topLighting}`];
    explanations.push(
      `${topLighting} recommended — used successfully ${entry?.samples ?? 0} times, avg score ${((entry?.avgScore ?? 0) * 100).toFixed(1)}`,
    );
  }

  return {
    recommendedLighting: ranked("lighting:").slice(0, 3),
    preferredScene: ranked("scene:").slice(0, 3),
    recommendedMaterials: ranked("materials:").slice(0, 3),
    preferredCamera: ranked("camera:").slice(0, 3),
    avoidPatterns,
    explanations,
  };
}

export function validateMemoryUpdate(
  update: MemoryUpdate,
  ctx: DesignMemoryContext,
): MemoryValidationReport {
  const violations: string[] = [];

  if (!ctx.chiefReview) violations.push("MISSING_CHIEF_REVIEW");

  for (const pattern of update.recommendedPatterns) {
    if (pattern.sampleCount < MEMORY_MIN_SAMPLES_FOR_RECOMMENDATION) {
      violations.push("SINGLE_SAMPLE_OVERFIT");
      break;
    }
    if (!pattern.explanation) {
      violations.push("UNEXPLAINABLE_RECOMMENDATION");
      break;
    }
  }

  for (const pattern of update.successfulPatterns) {
    if (!pattern.explanation) {
      violations.push("UNEXPLAINABLE_RECOMMENDATION");
      break;
    }
  }

  const categories = new Set(
    [...update.successfulPatterns, ...update.unsuccessfulPatterns, ...update.avoidPatterns].map(
      (p) => p.category,
    ),
  );
  if (categories.size > 1) {
    violations.push("CATEGORY_MIXING");
  }

  const staleDominant = update.recommendedPatterns.some(
    (p) => agingDecay(p.lastSeenAt, Date.now()) < 0.2 && p.successRate > 0.8,
  );
  if (staleDominant) {
    violations.push("STALE_PATTERN_DOMINANCE");
  }

  return { valid: violations.length === 0, violations, update };
}

export function isMemoryFailure(code: string): code is MemoryFailureCode {
  return [
    "SINGLE_SAMPLE_OVERFIT",
    "CATEGORY_MIXING",
    "STALE_PATTERN_DOMINANCE",
    "UNEXPLAINABLE_RECOMMENDATION",
    "MISSING_CHIEF_REVIEW",
    "BLUEPRINT_MUTATION_ATTEMPT",
  ].includes(code);
}

export function runDesignMemory(input: {
  blueprint: Readonly<RenderBlueprint>;
  context: DesignMemoryContext;
  store?: DesignKnowledgeStore;
}): {
  update: MemoryUpdate;
  explainability: MemoryExplainabilityReport;
  store: DesignKnowledgeStore;
} {
  if (!input.context.chiefReview) {
    throw new Error("Chief review is required for Design Memory learning");
  }

  return buildMemoryUpdate(input.blueprint, input.context, input.store);
}
