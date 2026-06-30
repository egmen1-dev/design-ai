/**
 * Chapter 5.4 — Knowledge Layers engine.
 * Multi-layer knowledge system — each layer owns a decision domain.
 */
import type { AgentContractId } from "./agent-contracts";
import { queryKnowledgeForCategory } from "./design-knowledge-philosophy-engine";
import {
  KnowledgeLayer,
  type CrossLayerDecision,
  type CrossLayerReasoningInput,
  type KnowledgeLayerDefinition,
  type KnowledgeLayerId,
  type KnowledgeLayersContext,
  type KnowledgeLayersFailureCode,
  type KnowledgeLayersReport,
  type KnowledgeLayersViolation,
  type LayerConflict,
  type LayerKnowledgeEntry,
  type LayerValidationResult,
  type LayerVersionRecord,
} from "./knowledge-layers-types";

export {
  KnowledgeLayer,
  type KnowledgeLayerId,
  type KnowledgeLayerDefinition,
  type LayerKnowledgeEntry,
  type LayerVersionRecord,
  type CrossLayerReasoningInput,
  type CrossLayerDecision,
  type LayerConflict,
  type LayerValidationResult,
  type KnowledgeLayersContext,
  type KnowledgeLayersViolation,
  type KnowledgeLayersReport,
  type KnowledgeLayersFailureCode,
} from "./knowledge-layers-types";

export const KNOWLEDGE_LAYERS_VERSION = "5.4.0";

export const KNOWLEDGE_LAYERS_GOLDEN_RULE =
  "Design Knowledge is not one large rule base. It is a multi-level intelligent system where each layer " +
  "owns its knowledge domain, yet all layers together form unified professional design thinking. " +
  "Layer separation makes Design AI scalable, explainable, and resilient over years of evolution.";

export const KNOWLEDGE_LAYER_STACK: readonly KnowledgeLayerId[] = [
  KnowledgeLayer.BUSINESS,
  KnowledgeLayer.MARKETPLACE,
  KnowledgeLayer.DESIGN,
  KnowledgeLayer.PHOTOGRAPHY,
  KnowledgeLayer.PSYCHOLOGY,
  KnowledgeLayer.RENDERING,
] as const;

/** Learning layer analyzes post-pipeline — not in forward dependency chain */
export const KNOWLEDGE_LAYER_PRIORITY: readonly KnowledgeLayerId[] = [
  KnowledgeLayer.BUSINESS,
  KnowledgeLayer.MARKETPLACE,
  KnowledgeLayer.DESIGN,
  KnowledgeLayer.PHOTOGRAPHY,
  KnowledgeLayer.PSYCHOLOGY,
  KnowledgeLayer.LEARNING,
  KnowledgeLayer.RENDERING,
] as const;

export const KNOWLEDGE_LAYER_DEFINITIONS: readonly KnowledgeLayerDefinition[] = [
  {
    id: KnowledgeLayer.BUSINESS,
    name: "Business Layer",
    summary: "Commercial goal — what is sold, to whom, positioning, value, emotional effect",
    responsibility: "Starting point for all design decisions",
    version: "1.0.0",
    dynamic: false,
    agents: ["product-analyzer", "creative-engine", "visual-story-director"],
  },
  {
    id: KnowledgeLayer.MARKETPLACE,
    name: "Marketplace Layer",
    summary: "Platform constraints — Amazon, Ozon, WB, Shopify, Etsy requirements",
    responsibility: "Defines what is allowed in each commercial environment",
    version: "11.0.0",
    dynamic: false,
    agents: ["creative-engine", "composition-director", "governance"],
  },
  {
    id: KnowledgeLayer.DESIGN,
    name: "Design Layer",
    summary: "Classical design — composition, hierarchy, balance, rhythm, negative space, contrast",
    responsibility: "Creative Directors primary knowledge domain",
    version: "4.0.0",
    dynamic: false,
    agents: [
      "visual-story-director",
      "scene-director",
      "composition-director",
      "commercial-photo-director",
    ],
  },
  {
    id: KnowledgeLayer.PHOTOGRAPHY,
    name: "Photography Layer",
    summary: "Lighting, lens, depth of field, perspective, materials, shadows, exposure",
    responsibility: "Technical Directors primary knowledge domain",
    version: "3.2.0",
    dynamic: false,
    agents: [
      "lighting-director",
      "camera-director",
      "material-director",
      "commercial-photo-director",
    ],
  },
  {
    id: KnowledgeLayer.PSYCHOLOGY,
    name: "Psychology Layer",
    summary: "Attention, emotion, trust, color perception, cognitive load, decision making",
    responsibility: "Explains why certain design choices work better",
    version: "2.0.0",
    dynamic: false,
    agents: ["visual-story-director", "lighting-director", "composition-director"],
  },
  {
    id: KnowledgeLayer.RENDERING,
    name: "Rendering Layer",
    summary: "Provider capabilities, generation limits, strengths and weaknesses",
    responsibility: "Implementation only — never changes design decisions",
    version: "1.5.0",
    dynamic: false,
    agents: ["flux-adapter"],
  },
  {
    id: KnowledgeLayer.LEARNING,
    name: "Learning Layer",
    summary: "Design Memory — successful patterns, retries, vision reports, commercial metrics",
    responsibility: "Only dynamic layer — refines other layers post-pipeline",
    version: "4.20.0",
    dynamic: true,
    agents: ["design-memory"],
  },
] as const;

export const AGENT_KNOWLEDGE_LAYER_ACCESS: Record<AgentContractId, KnowledgeLayerId[]> = {
  "product-analyzer": [KnowledgeLayer.BUSINESS, KnowledgeLayer.MARKETPLACE],
  "creative-engine": [KnowledgeLayer.BUSINESS, KnowledgeLayer.MARKETPLACE, KnowledgeLayer.DESIGN],
  "visual-story-director": [
    KnowledgeLayer.BUSINESS,
    KnowledgeLayer.DESIGN,
    KnowledgeLayer.PSYCHOLOGY,
  ],
  "scene-director": [KnowledgeLayer.DESIGN, KnowledgeLayer.MARKETPLACE, KnowledgeLayer.PSYCHOLOGY],
  "commercial-photo-director": [
    KnowledgeLayer.DESIGN,
    KnowledgeLayer.PHOTOGRAPHY,
    KnowledgeLayer.MARKETPLACE,
  ],
  "camera-director": [KnowledgeLayer.PHOTOGRAPHY, KnowledgeLayer.DESIGN],
  "lighting-director": [
    KnowledgeLayer.DESIGN,
    KnowledgeLayer.PHOTOGRAPHY,
    KnowledgeLayer.PSYCHOLOGY,
    KnowledgeLayer.MARKETPLACE,
  ],
  "material-director": [KnowledgeLayer.PHOTOGRAPHY, KnowledgeLayer.DESIGN],
  "composition-director": [
    KnowledgeLayer.DESIGN,
    KnowledgeLayer.MARKETPLACE,
    KnowledgeLayer.PSYCHOLOGY,
  ],
  governance: [KnowledgeLayer.MARKETPLACE, KnowledgeLayer.DESIGN],
  critics: [KnowledgeLayer.DESIGN],
  "chief-design-director": [KnowledgeLayer.BUSINESS, KnowledgeLayer.MARKETPLACE],
  "design-memory": [KnowledgeLayer.LEARNING],
  "flux-adapter": [KnowledgeLayer.RENDERING],
  "vision-quality-director": [KnowledgeLayer.DESIGN, KnowledgeLayer.MARKETPLACE, KnowledgeLayer.PHOTOGRAPHY],
};

const EXTENSIBLE_LAYERS = ["accessibility", "localization", "brand_identity"] as const;

function violation(
  code: KnowledgeLayersViolation["code"],
  message: string,
  layer?: KnowledgeLayerId,
): KnowledgeLayersViolation {
  return { code, message, layer };
}

export function getKnowledgeLayerDefinition(layer: KnowledgeLayerId): KnowledgeLayerDefinition | undefined {
  return KNOWLEDGE_LAYER_DEFINITIONS.find((l) => l.id === layer);
}

export function getAgentKnowledgeLayers(agentId: AgentContractId): KnowledgeLayerId[] {
  return AGENT_KNOWLEDGE_LAYER_ACCESS[agentId] ?? [];
}

export function buildSeedLayerKnowledge(): LayerKnowledgeEntry[] {
  const cosmetics = queryKnowledgeForCategory("cosmetics");
  const medical = queryKnowledgeForCategory("medical");
  const premium = queryKnowledgeForCategory("premium");

  return [
    {
      id: "business-premium-cosmetics",
      layer: KnowledgeLayer.BUSINESS,
      topic: "positioning",
      rule: "premium_cosmetics",
      reason: "Premium cosmetics require luxury emotional positioning",
    },
    {
      id: "marketplace-hero-rules",
      layer: KnowledgeLayer.MARKETPLACE,
      topic: "main_image",
      rule: "hero_product_dominance",
      reason: "Marketplace main image requires dominant product hero",
    },
    {
      id: "design-negative-space",
      layer: KnowledgeLayer.DESIGN,
      topic: "composition",
      rule: premium[0]?.preference ?? "large_negative_space",
      reason: premium[0]?.reason ?? "Premium products need breathing room",
    },
    {
      id: "photography-soft-light",
      layer: KnowledgeLayer.PHOTOGRAPHY,
      topic: "lighting",
      rule: cosmetics[0]?.preference ?? "soft_lighting",
      reason: cosmetics[0]?.reason ?? "Soft lighting for luxury texture",
    },
    {
      id: "psychology-white-trust",
      layer: KnowledgeLayer.PSYCHOLOGY,
      topic: "trust",
      rule: medical[0]?.preference ?? "white_background",
      reason: "White increases perceived cleanliness and trust",
    },
    {
      id: "rendering-provider-capabilities",
      layer: KnowledgeLayer.RENDERING,
      topic: "adapter",
      rule: "provider_capability_profile",
      reason: "Rendering layer translates blueprint — does not alter design",
    },
    {
      id: "learning-pattern-weights",
      layer: KnowledgeLayer.LEARNING,
      topic: "design_memory",
      rule: "ema_pattern_weights",
      reason: "Learning layer refines probabilities after pipeline completion",
    },
  ];
}

export function buildCrossLayerReasoning(input: CrossLayerReasoningInput): CrossLayerDecision {
  const layersUsed: KnowledgeLayerId[] = [];
  const reasoning: string[] = [];

  if (input.business) {
    layersUsed.push(KnowledgeLayer.BUSINESS);
    reasoning.push(`Business: ${input.business}`);
  }
  if (input.psychology) {
    layersUsed.push(KnowledgeLayer.PSYCHOLOGY);
    reasoning.push(`Psychology: ${input.psychology}`);
  }
  if (input.photography) {
    layersUsed.push(KnowledgeLayer.PHOTOGRAPHY);
    reasoning.push(`Photography: ${input.photography}`);
  }
  if (input.marketplace) {
    layersUsed.push(KnowledgeLayer.MARKETPLACE);
    reasoning.push(`Marketplace: ${input.marketplace}`);
  }
  if (input.design) {
    layersUsed.push(KnowledgeLayer.DESIGN);
    reasoning.push(`Design: ${input.design}`);
  }

  const decision = [
    input.business && `Premium ${input.business}`,
    input.psychology,
    input.photography,
    input.marketplace && `compliant with ${input.marketplace}`,
  ]
    .filter(Boolean)
    .join(" with ");

  return {
    decision: decision || "unified design decision",
    layersUsed,
    reasoning,
    priorityResolved: layersUsed.length >= 3,
  };
}

export function resolveLayerConflict(
  higherLayer: KnowledgeLayerId,
  lowerLayer: KnowledgeLayerId,
  higherDecision: string,
  lowerDecision: string,
): LayerConflict {
  const higherIdx = KNOWLEDGE_LAYER_PRIORITY.indexOf(higherLayer);
  const lowerIdx = KNOWLEDGE_LAYER_PRIORITY.indexOf(lowerLayer);
  const winner = higherIdx <= lowerIdx ? higherLayer : lowerLayer;

  return {
    higherLayer: winner,
    lowerLayer: winner === higherLayer ? lowerLayer : higherLayer,
    higherDecision,
    lowerDecision,
    resolution: `${winner} layer priority preserved — rendering never overrides business`,
  };
}

export function publishLayerVersion(
  layer: KnowledgeLayerId,
  currentVersion: string,
  now = Date.now(),
): LayerVersionRecord {
  const parts = currentVersion.split(".").map(Number);
  const next = `${parts[0]}.${parts[1]}.${(parts[2] ?? 0) + 1}`;

  return {
    layer,
    version: next,
    publishedAt: now,
    previousVersion: currentVersion,
    immutable: true,
  };
}

export function validateLayerBeforePublish(
  layer: KnowledgeLayerId,
  entries: LayerKnowledgeEntry[],
): LayerValidationResult {
  const layerEntries = entries.filter((e) => e.layer === layer);
  const violations: string[] = [];

  if (layerEntries.length === 0) {
    violations.push(`Layer ${layer} has no knowledge entries`);
  }
  for (const entry of layerEntries) {
    if (!entry.rule?.trim() || !entry.reason?.trim()) {
      violations.push(`Entry ${entry.id} incomplete`);
    }
  }

  const compatibleWith = KNOWLEDGE_LAYER_STACK.filter((l) => l !== layer);

  return {
    layer,
    valid: violations.length === 0,
    violations,
    compatibleWith,
  };
}

export function validateLayerIndependence(
  mutation: { from: KnowledgeLayerId; to: KnowledgeLayerId },
): KnowledgeLayersViolation[] {
  const independentPairs: [KnowledgeLayerId, KnowledgeLayerId][] = [
    [KnowledgeLayer.MARKETPLACE, KnowledgeLayer.PHOTOGRAPHY],
    [KnowledgeLayer.LEARNING, KnowledgeLayer.BUSINESS],
    [KnowledgeLayer.RENDERING, KnowledgeLayer.BUSINESS],
  ];

  for (const [from, to] of independentPairs) {
    if (mutation.from === from && mutation.to === to) {
      return [
        violation(
          "LAYER_MUTATION_LEAK",
          `Change in ${from} layer must not mutate ${to} layer`,
          to,
        ),
      ];
    }
  }
  return [];
}

export function validateKnowledgeIsolation(
  unavailableLayers: KnowledgeLayerId[],
): { operational: boolean; remainingLayers: KnowledgeLayerId[] } {
  const unavailable = new Set(unavailableLayers);
  const remaining = KNOWLEDGE_LAYER_STACK.filter((l) => !unavailable.has(l));
  const operational =
    remaining.includes(KnowledgeLayer.BUSINESS) &&
    remaining.includes(KnowledgeLayer.DESIGN) &&
    remaining.includes(KnowledgeLayer.PHOTOGRAPHY);

  return { operational, remainingLayers: remaining };
}

export function getExtensibleLayerSlots(): readonly string[] {
  return EXTENSIBLE_LAYERS;
}

export function validateKnowledgeLayers(ctx: KnowledgeLayersContext = {}): KnowledgeLayersReport {
  const violations: KnowledgeLayersViolation[] = [];
  const entries = buildSeedLayerKnowledge();

  if (ctx.monolithicStore) {
    violations.push(violation("MONOLITHIC_KNOWLEDGE_STORE", "All knowledge in single store without layer structure"));
  }

  for (const def of KNOWLEDGE_LAYER_DEFINITIONS) {
    const validation = validateLayerBeforePublish(def.id, entries);
    if (!validation.valid && def.id !== KnowledgeLayer.LEARNING) {
      violations.push(
        violation("MISSING_LAYER_BOUNDARY", validation.violations.join("; "), def.id),
      );
    }
  }

  if (ctx.layerMutationLeak) {
    violations.push(...validateLayerIndependence(ctx.layerMutationLeak));
  }

  if (ctx.missingCrossLayer) {
    violations.push(violation("MISSING_CROSS_LAYER_REASONING", "Cannot combine knowledge across layers"));
  }

  const renderingOverrides = resolveLayerConflict(
    KnowledgeLayer.RENDERING,
    KnowledgeLayer.BUSINESS,
    "use 8k flux prompt",
    "premium luxury positioning",
  );
  if (renderingOverrides.higherLayer === KnowledgeLayer.RENDERING) {
    violations.push(violation("RENDERING_OVERRIDES_BUSINESS", "Rendering layer cannot override business decisions"));
  }

  if (ctx.unavailableLayers?.includes(KnowledgeLayer.LEARNING)) {
    const isolation = validateKnowledgeIsolation(ctx.unavailableLayers);
    if (!isolation.operational) {
      violations.push(violation("LEARNING_BLOCKS_PIPELINE", "Learning unavailability must not block core layers"));
    }
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  const crossLayer = buildCrossLayerReasoning({
    business: "Premium Cosmetics",
    psychology: "White increases trust",
    photography: "Soft Diffused Light",
    marketplace: "Main Image Rules",
  });

  return {
    valid: unique.length === 0,
    violations: unique,
    layers: [...KNOWLEDGE_LAYER_DEFINITIONS],
    stack: [...KNOWLEDGE_LAYER_STACK],
    priority: [...KNOWLEDGE_LAYER_PRIORITY],
    goldenRuleSatisfied: unique.length === 0,
    independent: !unique.some((v) => v.code === "LAYER_MUTATION_LEAK"),
    crossLayerCapable: crossLayer.priorityResolved,
  };
}

export function assertKnowledgeLayers(ctx?: KnowledgeLayersContext): KnowledgeLayersReport {
  const report = validateKnowledgeLayers(ctx);
  if (!report.valid) {
    throw new Error(
      `Knowledge layers violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runKnowledgeLayers(input: { ctx?: KnowledgeLayersContext }): KnowledgeLayersReport {
  return validateKnowledgeLayers(input.ctx);
}

export function isKnowledgeLayersFailure(code: string): code is KnowledgeLayersFailureCode {
  return [
    "MONOLITHIC_KNOWLEDGE_STORE",
    "MISSING_LAYER_BOUNDARY",
    "LAYER_MUTATION_LEAK",
    "UNKNOWN_KNOWLEDGE_ORIGIN",
    "MISSING_CROSS_LAYER_REASONING",
    "RENDERING_OVERRIDES_BUSINESS",
    "LEARNING_BLOCKS_PIPELINE",
    "INVALID_LAYER_VERSION",
  ].includes(code);
}
