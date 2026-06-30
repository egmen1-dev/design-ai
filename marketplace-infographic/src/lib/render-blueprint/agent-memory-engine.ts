/**
 * Chapter 4.7 — Agent Memory Model engine.
 * Platform-owned knowledge — agents receive memory only for Execute(), then release.
 */
import type { AgentContractId } from "./agent-contracts";
import { AgentEcosystemCategory, getAgentCategory } from "./agent-ecosystem";
import { scanContextSecurity } from "./agent-context-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { validateSerializable } from "./serialization";
import {
  MemoryLayer,
  MemoryOwner,
  type AgentMemoryAccess,
  type AgentMemoryBuildInput,
  type AgentMemoryPackage,
  type KnowledgeMemory,
  type LearningMemory,
  type MemoryExplainabilityEntry,
  type MemoryExplainabilityReport,
  type MemoryLayerDefinition,
  type MemoryLayerId,
  type MemoryProjection,
  type MemoryValidationReport,
  type MemoryViolation,
  type ReferenceMemory,
  type RuntimeMemory,
  type SerializedMemoryReplay,
} from "./agent-memory-types";

export {
  MemoryLayer,
  MemoryOwner,
  type MemoryLayerId,
  type MemoryLayerDefinition,
  type KnowledgeMemory,
  type ReferenceMemory,
  type LearningMemory,
  type RuntimeMemory,
  type AgentMemoryAccess,
  type AgentMemoryPackage,
  type AgentMemoryBuildInput,
  type MemoryProjection,
  type MemoryValidationReport,
  type MemoryViolation,
  type MemoryViolationCode,
  type MemoryExplainabilityReport,
  type MemoryExplainabilityEntry,
  type SerializedMemoryReplay,
} from "./agent-memory-types";

export const AGENT_MEMORY_VERSION = "4.7.0";

export const AGENT_MEMORY_GOLDEN_RULE =
  "An intelligent agent has no long-term memory of its own. " +
  "All knowledge belongs to the platform and is delivered through the controlled memory model. " +
  "After Execute() completes, the agent retains no internal knowledge.";

const MEMORY_REPLAY_VERSION = "4.7.0";

const SECRET_FIELD_PATTERN =
  /(api[_-]?key|secret|password|token|credential|bearer|authorization|private[_-]?key)/i;

export const MEMORY_LAYER_DEFINITIONS: readonly MemoryLayerDefinition[] = [
  {
    id: MemoryLayer.RUNTIME,
    owner: MemoryOwner.AGENT,
    mutable: true,
    summary: "Local variables and scratch data — destroyed after Execute()",
  },
  {
    id: MemoryLayer.WORKING,
    owner: MemoryOwner.LIFECYCLE_MANAGER,
    mutable: false,
    summary: "Agent Context — read-only working memory for the decision",
  },
  {
    id: MemoryLayer.KNOWLEDGE,
    owner: MemoryOwner.KNOWLEDGE_ENGINE,
    mutable: false,
    summary: "Universal design knowledge — genome, composition laws, photography guidelines",
  },
  {
    id: MemoryLayer.REFERENCE,
    owner: MemoryOwner.REFERENCE_PROVIDERS,
    mutable: false,
    summary: "External reference catalogs — categories, trends, libraries",
  },
  {
    id: MemoryLayer.LEARNING,
    owner: MemoryOwner.DESIGN_MEMORY,
    mutable: false,
    summary: "Design Memory statistics — optional guidance, not mandatory",
  },
] as const;

/** Default platform knowledge — immutable during pipeline */
export const DEFAULT_KNOWLEDGE_MEMORY: KnowledgeMemory = {
  designGenome: {
    version: "1.0.0",
    compositionLaws: ["rule_of_thirds", "visual_hierarchy", "negative_space"],
    colorTheory: ["complementary_contrast", "marketplace_safe_palette"],
    typographyRules: ["headline_zone_reserved", "no_text_in_hero"],
    photographyGuidelines: ["hero_product_dominance", "soft_shadow_contact"],
  },
  marketplacePatterns: {
    WB: ["high_contrast_thumb", "clean_background"],
    Ozon: ["technical_clarity", "badge_space"],
    Amazon: ["lifestyle_context", "premium_finish"],
  },
};

export const DEFAULT_REFERENCE_MEMORY: ReferenceMemory = {
  productCategories: {
    electronics: { subCategories: ["phones", "audio"], typicalMaterials: ["aluminum", "glass"] },
    cosmetics: { subCategories: ["skincare", "makeup"], typicalMaterials: ["plastic", "glass"] },
  },
  trendSnapshots: [
    { id: "trend-2026-q2", marketplace: "WB", season: "summer", keywords: ["minimal", "pastel"] },
  ],
  materialLibrary: {
    aluminum: { finish: "brushed", reflectance: 0.45 },
    glass: { finish: "gloss", reflectance: 0.7 },
  },
  sceneLibrary: {
    studio: { environment: "studio", lighting: "softbox" },
    lifestyle: { environment: "interior", lighting: "window" },
  },
  lightingCatalog: {
    softbox: { preset: "softbox", temperature: 5600 },
    rim: { preset: "rim", temperature: 4800 },
  },
  compositionTemplates: [
    { id: "hero-center", name: "Hero Center", ruleOfThirds: false },
    { id: "hero-offset", name: "Hero Offset", ruleOfThirds: true },
  ],
};

export const DEFAULT_LEARNING_MEMORY: LearningMemory = {
  successfulCombinations: [
    { scene: "studio", lighting: "softbox", score: 0.92 },
  ],
  failedCombinations: [
    { scene: "outdoor", lighting: "hard_sun", reason: "shadow_conflict" },
  ],
  templateWeights: { "hero-center": 0.8, "hero-offset": 0.65 },
  sceneWeights: { studio: 0.85, lifestyle: 0.7 },
  palettePreferences: { electronics: ["#1a1a2e", "#ffffff"] },
  generationStats: { totalRuns: 1000, approvalRate: 0.87 },
};

/** Explicit memory access declaration per agent — required for explainability */
export const AGENT_MEMORY_ACCESS_MATRIX: Record<AgentContractId, AgentMemoryAccess> = {
  "product-analyzer": {
    agentId: "product-analyzer",
    layers: [MemoryLayer.WORKING, MemoryLayer.REFERENCE],
    referenceTopics: ["productCategories", "materialLibrary"],
  },
  "creative-engine": {
    agentId: "creative-engine",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.REFERENCE],
    knowledgeTopics: ["marketplacePatterns"],
    referenceTopics: ["trendSnapshots"],
  },
  "visual-story-director": {
    agentId: "visual-story-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.LEARNING],
    knowledgeTopics: ["designGenome"],
    learningTopics: ["palettePreferences"],
  },
  "scene-director": {
    agentId: "scene-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.REFERENCE],
    knowledgeTopics: ["photographyGuidelines"],
    referenceTopics: ["sceneLibrary", "trendSnapshots"],
  },
  "commercial-photo-director": {
    agentId: "commercial-photo-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE],
    knowledgeTopics: ["photographyGuidelines"],
  },
  "camera-director": {
    agentId: "camera-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE],
    knowledgeTopics: ["photographyGuidelines"],
  },
  "lighting-director": {
    agentId: "lighting-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.REFERENCE],
    knowledgeTopics: ["photographyGuidelines"],
    referenceTopics: ["lightingCatalog", "sceneLibrary"],
  },
  "material-director": {
    agentId: "material-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.REFERENCE],
    knowledgeTopics: ["designGenome"],
    referenceTopics: ["materialLibrary"],
  },
  "typography-director": {
    agentId: "typography-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.LEARNING],
    knowledgeTopics: ["typographyRules"],
    learningTopics: ["templateWeights"],
    referenceTopics: ["typographyLibrary"],
  },
  "marketplace-director": {
    agentId: "marketplace-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.LEARNING],
    knowledgeTopics: ["marketplaceRules"],
    learningTopics: ["ctrAnalytics", "conversionPatterns"],
    referenceTopics: ["marketplacePatternLibrary"],
  },
  "composition-director": {
    agentId: "composition-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE, MemoryLayer.LEARNING],
    knowledgeTopics: ["compositionLaws"],
    learningTopics: ["templateWeights"],
    referenceTopics: ["compositionTemplates"],
  },
  governance: {
    agentId: "governance",
    layers: [MemoryLayer.WORKING, MemoryLayer.KNOWLEDGE],
    knowledgeTopics: ["typographyRules"],
  },
  critics: {
    agentId: "critics",
    layers: [MemoryLayer.WORKING],
  },
  "chief-design-director": {
    agentId: "chief-design-director",
    layers: [MemoryLayer.WORKING, MemoryLayer.LEARNING],
    learningTopics: ["generationStats"],
  },
  "design-memory": {
    agentId: "design-memory",
    layers: [MemoryLayer.LEARNING],
    learningTopics: ["designPatterns", "categoryWeights", "providerPatterns"],
  },
  "flux-adapter": {
    agentId: "flux-adapter",
    layers: [MemoryLayer.WORKING],
  },
  "vision-quality-director": {
    agentId: "vision-quality-director",
    layers: [MemoryLayer.WORKING],
  },
};

const ACTIVE_MEMORY_PACKAGES = new WeakSet<AgentMemoryPackage>();

function deepFreeze<T extends object>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const key of Object.keys(value)) {
      const child = (value as Record<string, unknown>)[key];
      if (child && typeof child === "object" && !Object.isFrozen(child)) {
        deepFreeze(child);
      }
    }
  }
  return value;
}

function estimateBytes(value: unknown): number {
  try {
    return JSON.stringify(value).length;
  } catch {
    return 0;
  }
}

function collectSecretViolations(value: unknown, path = "memory"): MemoryViolation[] {
  const violations: MemoryViolation[] = [];
  if (value === null || value === undefined) return violations;

  if (typeof value === "object" && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const childPath = `${path}.${key}`;
      if (SECRET_FIELD_PATTERN.test(key)) {
        violations.push({
          code: "SECRET_DETECTED",
          message: `Sensitive field detected at ${childPath}`,
          layer: MemoryLayer.WORKING,
        });
      }
      violations.push(...collectSecretViolations(child, childPath));
    }
  }

  return violations;
}

function projectKnowledge(access: AgentMemoryAccess, knowledge: KnowledgeMemory): KnowledgeMemory {
  const topics = access.knowledgeTopics ?? [];
  if (topics.length === 0) return knowledge;

  const projected: KnowledgeMemory = {
    designGenome: { ...knowledge.designGenome, compositionLaws: [], colorTheory: [], typographyRules: [], photographyGuidelines: [] },
    marketplacePatterns: {},
  };

  if (topics.includes("designGenome") || topics.includes("compositionLaws")) {
    projected.designGenome.compositionLaws = knowledge.designGenome.compositionLaws;
  }
  if (topics.includes("colorTheory")) {
    projected.designGenome.colorTheory = knowledge.designGenome.colorTheory;
  }
  if (topics.includes("typographyRules")) {
    projected.designGenome.typographyRules = knowledge.designGenome.typographyRules;
  }
  if (topics.includes("photographyGuidelines")) {
    projected.designGenome.photographyGuidelines = knowledge.designGenome.photographyGuidelines;
  }
  if (topics.includes("marketplacePatterns")) {
    projected.marketplacePatterns = knowledge.marketplacePatterns;
  }

  return projected;
}

function projectReference(access: AgentMemoryAccess, reference: ReferenceMemory): ReferenceMemory {
  const topics = access.referenceTopics ?? [];
  if (topics.length === 0) return reference;

  const projected: ReferenceMemory = {
    productCategories: {},
    trendSnapshots: [],
    materialLibrary: {},
    sceneLibrary: {},
    lightingCatalog: {},
    compositionTemplates: [],
  };

  if (topics.includes("productCategories")) projected.productCategories = reference.productCategories;
  if (topics.includes("trendSnapshots")) projected.trendSnapshots = reference.trendSnapshots;
  if (topics.includes("materialLibrary")) projected.materialLibrary = reference.materialLibrary;
  if (topics.includes("sceneLibrary")) projected.sceneLibrary = reference.sceneLibrary;
  if (topics.includes("lightingCatalog")) projected.lightingCatalog = reference.lightingCatalog;
  if (topics.includes("compositionTemplates")) projected.compositionTemplates = reference.compositionTemplates;

  return projected;
}

function projectLearning(access: AgentMemoryAccess, learning: LearningMemory): LearningMemory {
  const topics = access.learningTopics ?? [];
  if (topics.length === 0) return learning;

  const projected: LearningMemory = {
    successfulCombinations: [],
    failedCombinations: [],
    templateWeights: {},
    sceneWeights: {},
    palettePreferences: {},
    generationStats: learning.generationStats,
  };

  if (topics.includes("templateWeights")) projected.templateWeights = learning.templateWeights;
  if (topics.includes("sceneWeights")) projected.sceneWeights = learning.sceneWeights;
  if (topics.includes("palettePreferences")) projected.palettePreferences = learning.palettePreferences;
  if (topics.includes("generationStats")) projected.generationStats = learning.generationStats;
  if (topics.includes("successfulCombinations")) {
    projected.successfulCombinations = learning.successfulCombinations;
  }
  if (topics.includes("failedCombinations")) projected.failedCombinations = learning.failedCombinations;

  return projected;
}

export function getAgentMemoryAccess(agentId: AgentContractId): AgentMemoryAccess {
  return AGENT_MEMORY_ACCESS_MATRIX[agentId];
}

export function memoryOwnerForLayer(layer: MemoryLayerId): MemoryOwnerId {
  return MEMORY_LAYER_DEFINITIONS.find((d) => d.id === layer)?.owner ?? MemoryOwner.LIFECYCLE_MANAGER;
}

export function layerIsMutable(layer: MemoryLayerId): boolean {
  return layer === MemoryLayer.RUNTIME;
}

/** Build isolated agent memory package before Execute() */
export function buildAgentMemoryPackage(input: AgentMemoryBuildInput): AgentMemoryPackage {
  const access = getAgentMemoryAccess(input.agentId);
  const knowledge = deepFreeze(
    structuredClone(input.knowledge ?? DEFAULT_KNOWLEDGE_MEMORY),
  );
  const reference = deepFreeze(
    structuredClone(input.reference ?? DEFAULT_REFERENCE_MEMORY),
  );
  const learning = deepFreeze(structuredClone(input.learning ?? DEFAULT_LEARNING_MEMORY));

  const pkg: AgentMemoryPackage = {
    agentId: input.agentId,
    pipelineId: input.working.diagnostics.pipelineId,
    revision: input.working.blueprint.meta.revision ?? 0,
    working: input.working,
    knowledge: access.layers.includes(MemoryLayer.KNOWLEDGE)
      ? deepFreeze(projectKnowledge(access, knowledge as KnowledgeMemory))
      : ({} as KnowledgeMemory),
    reference: access.layers.includes(MemoryLayer.REFERENCE)
      ? deepFreeze(projectReference(access, reference as ReferenceMemory))
      : ({} as ReferenceMemory),
    learning: access.layers.includes(MemoryLayer.LEARNING)
      ? deepFreeze(projectLearning(access, learning as LearningMemory))
      : ({} as LearningMemory),
    runtime: { locals: {}, scratch: [] },
    accessedLayers: [...access.layers],
  };

  ACTIVE_MEMORY_PACKAGES.add(pkg);
  return pkg;
}

export function projectAgentMemory(pkg: AgentMemoryPackage): MemoryProjection {
  const access = getAgentMemoryAccess(pkg.agentId);
  const fullPayload = {
    working: pkg.working,
    knowledge: pkg.knowledge,
    reference: pkg.reference,
    learning: pkg.learning,
  };
  const projectedPayload = {
    working: pkg.working,
    knowledge: pkg.knowledge,
    reference: pkg.reference,
    learning: pkg.learning,
  };

  return {
    agentId: pkg.agentId,
    layers: access.layers,
    knowledgeTopics: access.knowledgeTopics ?? [],
    referenceTopics: access.referenceTopics ?? [],
    projectedBytes: estimateBytes(projectedPayload),
    fullBytes: estimateBytes(fullPayload),
  };
}

export function validateAgentMemoryPackage(pkg: AgentMemoryPackage): MemoryValidationReport {
  const violations: MemoryViolation[] = [];
  const access = getAgentMemoryAccess(pkg.agentId);

  for (const layer of pkg.accessedLayers) {
    if (!access.layers.includes(layer)) {
      violations.push({
        code: "UNAUTHORIZED_LAYER",
        message: `Agent ${pkg.agentId} accessed undeclared layer ${layer}`,
        layer,
      });
    }
  }

  if (!Object.isFrozen(pkg.working)) {
    violations.push({
      code: "WORKING_MUTATION",
      message: "Working memory must be frozen read-only Agent Context",
      layer: MemoryLayer.WORKING,
    });
  }

  if (Object.isFrozen(pkg.knowledge) === false && access.layers.includes(MemoryLayer.KNOWLEDGE)) {
    violations.push({
      code: "UNAUTHORIZED_MUTATION",
      message: "Knowledge memory must be immutable",
      layer: MemoryLayer.KNOWLEDGE,
    });
  }

  const contextViolations = scanContextSecurity(pkg.working);
  for (const v of contextViolations) {
    violations.push({
      code: "SECRET_DETECTED",
      message: v.message,
      layer: MemoryLayer.WORKING,
    });
  }

  violations.push(
    ...collectSecretViolations(pkg.knowledge, "knowledge"),
    ...collectSecretViolations(pkg.reference, "reference"),
    ...collectSecretViolations(pkg.learning, "learning"),
  );

  const serializable = validateSerializable({
    working: pkg.working,
    knowledge: pkg.knowledge,
    reference: pkg.reference,
    learning: pkg.learning,
  });
  if (!serializable.ok) {
    for (const issue of serializable.issues) {
      violations.push({
        code: "NON_SERIALIZABLE",
        message: issue.message,
        layer: MemoryLayer.WORKING,
      });
    }
  }

  return { valid: violations.length === 0, agentId: pkg.agentId, violations };
}

export function assertRuntimeMemoryOnlyMutation(
  layer: MemoryLayerId,
  agentId: AgentContractId,
): void {
  if (!layerIsMutable(layer)) {
    throw new Error(
      `Agent ${agentId} cannot mutate ${layer} memory — only runtime memory is mutable`,
    );
  }
}

export function createRuntimeMemoryScope(pkg: AgentMemoryPackage): RuntimeMemory {
  if (!ACTIVE_MEMORY_PACKAGES.has(pkg)) {
    throw new Error("Memory package is not active — build via buildAgentMemoryPackage()");
  }
  pkg.runtime = { locals: {}, scratch: [] };
  return pkg.runtime;
}

/** Release all memory after Execute() — agent retains nothing */
export function releaseAgentMemory(pkg: AgentMemoryPackage): void {
  pkg.runtime = { locals: {}, scratch: [] };
  ACTIVE_MEMORY_PACKAGES.delete(pkg);
}

export function explainMemoryUsage(agentId: AgentContractId): MemoryExplainabilityReport {
  const access = getAgentMemoryAccess(agentId);
  const entries: MemoryExplainabilityEntry[] = MEMORY_LAYER_DEFINITIONS.map((def) => ({
    layer: def.id,
    label: def.summary,
    used: access.layers.includes(def.id),
    owner: def.owner,
  }));

  return { agentId, entries, declaredLayers: access.layers };
}

export function serializeMemoryReplay(pkg: AgentMemoryPackage): string {
  const payload: SerializedMemoryReplay = {
    version: MEMORY_REPLAY_VERSION,
    agentId: pkg.agentId,
    pipelineId: pkg.pipelineId,
    revision: pkg.revision,
    accessedLayers: pkg.accessedLayers,
    working: structuredClone(pkg.working) as AgentContextPackage,
    knowledge: structuredClone(pkg.knowledge) as KnowledgeMemory,
    reference: structuredClone(pkg.reference) as ReferenceMemory,
    learning: structuredClone(pkg.learning) as LearningMemory,
    capturedAt: Date.now(),
  };

  const validation = validateSerializable(payload);
  if (!validation.ok) {
    throw new Error(
      `Memory replay state is not serializable: ${validation.issues.map((i) => i.message).join("; ")}`,
    );
  }

  return JSON.stringify(payload);
}

export function deserializeMemoryReplay(json: string): SerializedMemoryReplay {
  const parsed = JSON.parse(json) as SerializedMemoryReplay;
  if (!parsed.version || !parsed.agentId) {
    throw new Error("Invalid serialized memory replay");
  }
  return parsed;
}

export function creativeAgentsUseLearningMemory(): AgentContractId[] {
  return (Object.entries(AGENT_MEMORY_ACCESS_MATRIX) as [AgentContractId, AgentMemoryAccess][])
    .filter(([id, access]) => {
      const category = getAgentCategory(id);
      return (
        category === AgentEcosystemCategory.CREATIVE_DIRECTOR &&
        access.layers.includes(MemoryLayer.LEARNING)
      );
    })
    .map(([id]) => id);
}

export function detectSharedMemoryPackage(
  a: AgentMemoryPackage,
  b: AgentMemoryPackage,
): MemoryViolation[] {
  if (a.working === b.working) {
    return [
      {
        code: "SHARED_MEMORY",
        message: "Working memory must not be shared between concurrent agents",
        layer: MemoryLayer.WORKING,
      },
    ];
  }
  return [];
}
