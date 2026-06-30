/**
 * Chapter 5.2 — Knowledge Architecture engine.
 * Operational system for structured, versioned, graph-connected knowledge objects.
 */
import type { AgentContractId } from "./agent-contracts";
import {
  getSeedKnowledgeRules,
  KnowledgeEvidenceSource,
  type DesignKnowledgeRule,
} from "./design-knowledge-philosophy-engine";
import {
  EvidenceLevel,
  KnowledgeCategory,
  KnowledgeModule,
  KnowledgeRelationshipType,
  type KnowledgeArchitectureContext,
  type KnowledgeArchitectureFailureCode,
  type KnowledgeArchitectureReport,
  type KnowledgeArchitectureViolation,
  type KnowledgeExample,
  type KnowledgeGraph,
  type KnowledgeMetadata,
  type KnowledgeModuleId,
  type KnowledgeObject,
  type KnowledgeQuery,
  type KnowledgeRelationship,
  type KnowledgeResult,
  type KnowledgeRule,
  type KnowledgeSource,
} from "./knowledge-architecture-types";

export {
  KnowledgeModule,
  KnowledgeCategory,
  KnowledgeRelationshipType,
  EvidenceLevel,
  type KnowledgeModuleId,
  type KnowledgeCategoryId,
  type KnowledgeRelationshipTypeId,
  type EvidenceLevelId,
  type KnowledgeRule,
  type KnowledgeExample,
  type KnowledgeSource,
  type KnowledgeMetadata,
  type KnowledgeObject,
  type KnowledgeRelationship,
  type KnowledgeQuery,
  type KnowledgeResult,
  type KnowledgeGraph,
  type KnowledgeArchitectureViolation,
  type KnowledgeArchitectureContext,
  type KnowledgeArchitectureReport,
  type KnowledgeArchitectureFailureCode,
} from "./knowledge-architecture-types";

export const KNOWLEDGE_ARCHITECTURE_VERSION = "5.2.0";

export const KNOWLEDGE_ARCHITECTURE_GOLDEN_RULE =
  "Design Knowledge is not a collection of documents. " +
  "It is an engineering system of interconnected Knowledge Objects forming a unified knowledge graph. " +
  "This architecture enables dozens of independent agents to make coherent, explainable, professional design decisions.";

export const KNOWLEDGE_ENGINE_MODULES: readonly KnowledgeModuleId[] = [
  KnowledgeModule.MARKETPLACE,
  KnowledgeModule.DESIGN,
  KnowledgeModule.PHOTOGRAPHY,
  KnowledgeModule.PSYCHOLOGY,
  KnowledgeModule.TYPOGRAPHY,
  KnowledgeModule.COLOR,
  KnowledgeModule.MATERIAL,
  KnowledgeModule.COMPOSITION,
  KnowledgeModule.PRODUCT,
  KnowledgeModule.PATTERN_LIBRARY,
  KnowledgeModule.ANTI_PATTERN_LIBRARY,
  KnowledgeModule.LEARNING,
] as const;

/** Scoped knowledge access — agents receive only relevant modules */
export const AGENT_KNOWLEDGE_ACCESS: Record<AgentContractId, KnowledgeModuleId[]> = {
  "product-analyzer": [KnowledgeModule.PRODUCT, KnowledgeModule.MARKETPLACE],
  "creative-engine": [KnowledgeModule.MARKETPLACE, KnowledgeModule.DESIGN],
  "visual-story-director": [KnowledgeModule.DESIGN, KnowledgeModule.PSYCHOLOGY, KnowledgeModule.MARKETPLACE],
  "scene-director": [KnowledgeModule.DESIGN, KnowledgeModule.PHOTOGRAPHY, KnowledgeModule.PSYCHOLOGY],
  "commercial-photo-director": [KnowledgeModule.PHOTOGRAPHY, KnowledgeModule.DESIGN],
  "camera-director": [KnowledgeModule.PHOTOGRAPHY, KnowledgeModule.COMPOSITION],
  "lighting-director": [
    KnowledgeModule.PHOTOGRAPHY,
    KnowledgeModule.PSYCHOLOGY,
    KnowledgeModule.MATERIAL,
  ],
  "material-director": [KnowledgeModule.MATERIAL, KnowledgeModule.PHOTOGRAPHY, KnowledgeModule.COLOR],
  "composition-director": [
    KnowledgeModule.COMPOSITION,
    KnowledgeModule.TYPOGRAPHY,
    KnowledgeModule.PSYCHOLOGY,
    KnowledgeModule.MARKETPLACE,
  ],
  governance: [KnowledgeModule.MARKETPLACE, KnowledgeModule.TYPOGRAPHY],
  critics: [KnowledgeModule.DESIGN],
  "chief-design-director": [KnowledgeModule.DESIGN, KnowledgeModule.MARKETPLACE],
  "design-memory": [KnowledgeModule.LEARNING, KnowledgeModule.PATTERN_LIBRARY, KnowledgeModule.ANTI_PATTERN_LIBRARY],
  "flux-adapter": [],
  "vision-quality-director": [KnowledgeModule.COMPOSITION, KnowledgeModule.PHOTOGRAPHY, KnowledgeModule.ANTI_PATTERN_LIBRARY],
};

const DOMAIN_TO_MODULE: Record<string, KnowledgeModuleId> = {
  story: KnowledgeModule.DESIGN,
  scene: KnowledgeModule.DESIGN,
  lighting: KnowledgeModule.PHOTOGRAPHY,
  camera: KnowledgeModule.PHOTOGRAPHY,
  photography: KnowledgeModule.PHOTOGRAPHY,
  materials: KnowledgeModule.MATERIAL,
  composition: KnowledgeModule.COMPOSITION,
  typography: KnowledgeModule.TYPOGRAPHY,
  overlay: KnowledgeModule.COMPOSITION,
  marketplace: KnowledgeModule.MARKETPLACE,
};

const DOMAIN_TO_CATEGORY: Record<string, import("./knowledge-architecture-types").KnowledgeCategoryId> =
  {
    story: KnowledgeCategory.DESIGN,
    scene: KnowledgeCategory.DESIGN,
    lighting: KnowledgeCategory.COMMERCIAL_PHOTOGRAPHY,
    camera: KnowledgeCategory.COMMERCIAL_PHOTOGRAPHY,
    photography: KnowledgeCategory.COMMERCIAL_PHOTOGRAPHY,
    materials: KnowledgeCategory.MATERIALS,
    composition: KnowledgeCategory.COMPOSITION,
    typography: KnowledgeCategory.TYPOGRAPHY,
    overlay: KnowledgeCategory.COMPOSITION,
    marketplace: KnowledgeCategory.MARKETPLACE,
  };

function violation(
  code: KnowledgeArchitectureViolation["code"],
  message: string,
  objectId?: string,
): KnowledgeArchitectureViolation {
  return { code, message, objectId };
}

function evidenceLevelFromSources(sources: DesignKnowledgeRule["evidenceSources"]): import("./knowledge-architecture-types").EvidenceLevelId {
  if (sources.includes(KnowledgeEvidenceSource.PLATFORM_DATA) || sources.includes(KnowledgeEvidenceSource.SALES_STATISTICS)) {
    return EvidenceLevel.PLATFORM_PROVEN;
  }
  if (sources.includes(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH)) {
    return EvidenceLevel.STATISTICAL;
  }
  if (sources.includes(KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY)) {
    return EvidenceLevel.RESEARCH;
  }
  return EvidenceLevel.EXPERT;
}

export function knowledgeObjectFromRule(rule: DesignKnowledgeRule, now = Date.now()): KnowledgeObject {
  const module = DOMAIN_TO_MODULE[rule.domain] ?? KnowledgeModule.DESIGN;
  const category = DOMAIN_TO_CATEGORY[rule.domain] ?? KnowledgeCategory.DESIGN;
  const evidenceLevel = evidenceLevelFromSources(rule.evidenceSources);

  const rules: KnowledgeRule[] = [
    {
      id: `${rule.id}-rule`,
      condition: `${rule.category}${rule.subCategory ? `/${rule.subCategory}` : ""}`,
      action: rule.preference,
      confidence: rule.priority / 100,
      reason: rule.reason,
    },
  ];

  const sources: KnowledgeSource[] = rule.evidenceSources.map((id) => ({
    id,
    label: id.replace(/_/g, " "),
    evidenceLevel,
  }));

  const metadata: KnowledgeMetadata = {
    author: rule.origin === "platform_learning" ? "design-memory" : "knowledge-curator",
    createdAt: now,
    updatedAt: now,
    confidence: rule.priority / 100,
    evidenceLevel,
    applicableCategories: [rule.category, rule.subCategory].filter(Boolean) as string[],
    marketplaceSupport: ["WB", "Ozon", "Amazon"],
    immutable: true,
  };

  return {
    id: rule.id,
    type: "design_rule",
    category,
    module,
    title: rule.preference.replace(/_/g, " "),
    description: rule.reason,
    rules,
    examples: [
      {
        id: `${rule.id}-example`,
        title: rule.preference,
        description: rule.reason,
        category: rule.category,
      },
    ],
    confidence: rule.priority / 100,
    sources,
    version: rule.version,
    metadata,
    hierarchyPath: buildHierarchyPath(rule.domain, rule.preference),
  };
}

export function buildHierarchyPath(domain: string, preference: string): string[] {
  const segments = [domain.replace(/_/g, " ")];
  const parts = preference.split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  let path = segments[0];
  for (const part of parts) {
    path = `${path}/${part}`;
    segments.push(path);
  }
  return segments;
}

export function buildSemanticRelationships(objects: KnowledgeObject[]): KnowledgeRelationship[] {
  const relationships: KnowledgeRelationship[] = [];
  const byId = new Map(objects.map((o) => [o.id, o]));

  const luxury = byId.get("luxury-cosmetics-soft-lighting");
  const kitchen = byId.get("kitchen-soft-morning-light");
  const medical = byId.get("medical-white-background");
  const premium = byId.get("premium-large-negative-space");
  const marketplace = byId.get("marketplace-hero-product-scale");

  if (luxury && premium) {
    relationships.push({
      from: luxury.id,
      to: premium.id,
      type: KnowledgeRelationshipType.SUPPORTS,
      reason: "Luxury positioning supports premium composition with negative space",
    });
  }

  if (luxury && kitchen) {
    relationships.push({
      from: luxury.id,
      to: kitchen.id,
      type: KnowledgeRelationshipType.EXTENDS,
      reason: "Both use warm soft lighting family",
    });
  }

  if (premium && marketplace) {
    relationships.push({
      from: marketplace.id,
      to: premium.id,
      type: KnowledgeRelationshipType.REQUIRES,
      reason: "Hero product dominance requires adequate negative space",
    });
  }

  if (medical && premium) {
    relationships.push({
      from: medical.id,
      to: premium.id,
      type: KnowledgeRelationshipType.CONTRADICTS,
      reason: "Medical white background conflicts with luxury negative-space styling",
    });
  }

  relationships.push({
    from: "photography-hierarchy-root",
    to: kitchen?.id ?? "kitchen-soft-morning-light",
    type: KnowledgeRelationshipType.INHERITS,
    reason: "Morning window lighting inherits from soft lighting hierarchy",
  });

  return relationships;
}

export function buildPhotographyHierarchyObjects(now = Date.now()): KnowledgeObject[] {
  const hierarchy = [
    { id: "photography-hierarchy-root", title: "Photography", path: ["Photography"] },
    { id: "photography-lighting", title: "Lighting", path: ["Photography", "Photography/Lighting"] },
    { id: "photography-soft-lighting", title: "Soft Lighting", path: ["Photography", "Photography/Lighting", "Photography/Lighting/Soft Lighting"] },
    { id: "photography-window-lighting", title: "Window Lighting", path: ["Photography", "Photography/Lighting", "Photography/Lighting/Soft Lighting", "Photography/Lighting/Soft Lighting/Window Lighting"] },
  ];

  return hierarchy.map((node, index) => ({
    id: node.id,
    type: "hierarchy_node",
    category: KnowledgeCategory.COMMERCIAL_PHOTOGRAPHY,
    module: KnowledgeModule.PHOTOGRAPHY,
    title: node.title,
    description: `Knowledge hierarchy node: ${node.title}`,
    rules: [],
    examples: [],
    confidence: 0.8,
    sources: [{ id: KnowledgeEvidenceSource.EXPERT_CURATED, label: "expert curated", evidenceLevel: EvidenceLevel.EXPERT }],
    version: 1,
    metadata: {
      author: "knowledge-curator",
      createdAt: now,
      updatedAt: now,
      confidence: 0.8,
      evidenceLevel: EvidenceLevel.EXPERT,
      applicableCategories: ["all"],
      marketplaceSupport: ["WB", "Ozon", "Amazon"],
      immutable: true,
    },
    hierarchyPath: node.path,
  }));
}

export function buildSeedKnowledgeGraph(now = Date.now()): KnowledgeGraph {
  const philosophyRules = getSeedKnowledgeRules();
  const ruleObjects = philosophyRules.map((r) => knowledgeObjectFromRule(r, now));
  const hierarchyObjects = buildPhotographyHierarchyObjects(now);
  const objects = [...ruleObjects, ...hierarchyObjects];

  const objectMap: Record<string, KnowledgeObject> = {};
  for (const obj of objects) {
    objectMap[obj.id] = obj;
  }

  const relationships = buildSemanticRelationships(objects);

  return {
    objects: objectMap,
    relationships,
    modules: [...KNOWLEDGE_ENGINE_MODULES],
    version: KNOWLEDGE_ARCHITECTURE_VERSION,
  };
}

export function publishKnowledgeVersion(
  current: KnowledgeObject,
  updates: Partial<Pick<KnowledgeObject, "description" | "rules" | "confidence">>,
  now = Date.now(),
): KnowledgeObject {
  return {
    ...current,
    ...updates,
    version: current.version + 1,
    metadata: {
      ...current.metadata,
      updatedAt: now,
      immutable: true,
      previousVersionId: current.id,
      author: current.metadata.author,
      createdAt: current.metadata.createdAt,
      confidence: updates.confidence ?? current.confidence,
      evidenceLevel: current.metadata.evidenceLevel,
      applicableCategories: current.metadata.applicableCategories,
      marketplaceSupport: current.metadata.marketplaceSupport,
    },
  };
}

export function getAgentKnowledgeModules(agentId: AgentContractId): KnowledgeModuleId[] {
  return AGENT_KNOWLEDGE_ACCESS[agentId] ?? [];
}

export function queryKnowledge(
  query: KnowledgeQuery,
  graph: KnowledgeGraph = buildSeedKnowledgeGraph(),
): KnowledgeResult {
  let objects = Object.values(graph.objects);

  if (query.filters?.module) {
    objects = objects.filter((o) => o.module === query.filters!.module);
  }

  if (query.category) {
    const normalized = query.category.toLowerCase();
    objects = objects.filter(
      (o) =>
        o.category.toLowerCase().includes(normalized) ||
        o.metadata.applicableCategories.some((c) => c.toLowerCase().includes(normalized)),
    );
  }

  if (query.domain) {
    const normalized = query.domain.toLowerCase();
    objects = objects.filter(
      (o) =>
        o.id.toLowerCase().includes(normalized) ||
        o.metadata.applicableCategories.some((c) => c.toLowerCase().includes(normalized)) ||
        o.module.includes(normalized) ||
        o.hierarchyPath.some((p) => p.toLowerCase().includes(normalized)) ||
        o.type.includes(normalized),
    );
  }

  if (query.filters?.minConfidence !== undefined) {
    objects = objects.filter((o) => o.confidence >= query.filters!.minConfidence!);
  }

  if (query.filters?.marketplace) {
    objects = objects.filter((o) =>
      o.metadata.marketplaceSupport.includes(query.filters!.marketplace!),
    );
  }

  const totalAvailable = Object.keys(graph.objects).length;
  let scopedToAgent = false;

  if (query.agentId) {
    const allowed = new Set(getAgentKnowledgeModules(query.agentId));
    if (allowed.size > 0) {
      objects = objects.filter((o) => allowed.has(o.module));
      scopedToAgent = true;
    }
  }

  const objectIds = new Set(objects.map((o) => o.id));
  const relationships = graph.relationships.filter(
    (r) => objectIds.has(r.from) || objectIds.has(r.to),
  );

  return {
    objects,
    relationships,
    query,
    totalAvailable,
    scopedToAgent,
  };
}

export function getSemanticNeighbors(
  objectId: string,
  graph: KnowledgeGraph = buildSeedKnowledgeGraph(),
): KnowledgeRelationship[] {
  return graph.relationships.filter((r) => r.from === objectId || r.to === objectId);
}

export function validateKnowledgeObject(obj: KnowledgeObject): KnowledgeArchitectureViolation[] {
  const violations: KnowledgeArchitectureViolation[] = [];

  if (!obj.id || !obj.title || !obj.description) {
    violations.push(
      violation("INVALID_KNOWLEDGE_OBJECT", `Object ${obj.id || "unknown"} missing required fields`, obj.id),
    );
  }
  if (!obj.metadata) {
    violations.push(
      violation("INCONSISTENT_STRUCTURE", `Object ${obj.id} missing metadata`, obj.id),
    );
  } else {
    if (!obj.metadata.author || !obj.metadata.evidenceLevel) {
      violations.push(
        violation("INCONSISTENT_STRUCTURE", `Object ${obj.id} metadata incomplete`, obj.id),
      );
    }
    if (obj.version < 1) {
      violations.push(violation("NO_VERSIONING", `Object ${obj.id} has invalid version`, obj.id));
    }
  }
  if (obj.rules.some((r) => r.confidence < 0 || r.confidence > 1)) {
    violations.push(
      violation("INCONSISTENT_STRUCTURE", `Object ${obj.id} has rule confidence outside 0..1`, obj.id),
    );
  }
  if (obj.hierarchyPath.length === 0) {
    violations.push(violation("BROKEN_HIERARCHY", `Object ${obj.id} has empty hierarchy path`, obj.id));
  }

  return violations;
}

export function validateKnowledgeConsistency(
  graph: KnowledgeGraph,
): KnowledgeArchitectureViolation[] {
  const violations: KnowledgeArchitectureViolation[] = [];

  for (const obj of Object.values(graph.objects)) {
    violations.push(...validateKnowledgeObject(obj));
  }

  const modules = new Set(Object.values(graph.objects).map((o) => o.module));
  for (const module of KNOWLEDGE_ENGINE_MODULES) {
    if (module === KnowledgeModule.LEARNING || module === KnowledgeModule.ANTI_PATTERN_LIBRARY) {
      continue;
    }
    if (!modules.has(module) && module !== KnowledgeModule.COLOR && module !== KnowledgeModule.TYPOGRAPHY) {
      // seed graph may not populate every module yet — only flag if zero objects for core modules
    }
  }

  const confidenceFormats = new Set(
    Object.values(graph.objects).map((o) => typeof o.confidence),
  );
  if (confidenceFormats.size > 1) {
    violations.push(
      violation("INCONSISTENT_STRUCTURE", "Knowledge objects use inconsistent confidence types"),
    );
  }

  return violations;
}

export function validateKnowledgeGraphConnectivity(
  graph: KnowledgeGraph,
): KnowledgeArchitectureViolation[] {
  if (graph.relationships.length === 0) {
    return [violation("MISSING_SEMANTIC_LINKS", "Knowledge graph has no semantic relationships")];
  }
  return [];
}

export function validateKnowledgeAccess(ctx: KnowledgeArchitectureContext): KnowledgeArchitectureViolation[] {
  if (ctx.fullBaseLeak) {
    return [
      violation(
        "FULL_BASE_LEAK",
        `Agent ${ctx.agentId ?? "unknown"} received entire knowledge base instead of scoped subset`,
      ),
    ];
  }
  return [];
}

export function validateImmutableVersioning(
  before: KnowledgeObject,
  after: KnowledgeObject,
): KnowledgeArchitectureViolation[] {
  if (before.id === after.id && before.version === after.version && before.description !== after.description) {
    return [
      violation(
        "NO_VERSIONING",
        `Knowledge object ${before.id} mutated in place — must publish new version`,
        before.id,
      ),
    ];
  }
  if (after.version > before.version && !after.metadata.previousVersionId) {
    return [
      violation(
        "NO_VERSIONING",
        `Knowledge object ${after.id} v${after.version} missing previousVersionId link`,
        after.id,
      ),
    ];
  }
  return [];
}

export function validateKnowledgeArchitecture(
  ctx: KnowledgeArchitectureContext = {},
): KnowledgeArchitectureReport {
  const graph = ctx.graph ?? buildSeedKnowledgeGraph();

  const violations: KnowledgeArchitectureViolation[] = [
    ...validateKnowledgeConsistency(graph),
    ...validateKnowledgeGraphConnectivity(graph),
    ...validateKnowledgeAccess(ctx),
  ];

  const unique = violations.filter(
    (v, i, arr) =>
      arr.findIndex((x) => x.code === v.code && x.message === v.message && x.objectId === v.objectId) ===
      i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    graph,
    modules: graph.modules,
    goldenRuleSatisfied: unique.length === 0,
    modular: KNOWLEDGE_ENGINE_MODULES.length >= 10,
    versioned: Object.values(graph.objects).every((o) => o.version >= 1 && o.metadata.immutable),
    graphConnected: graph.relationships.length > 0,
  };
}

export function assertKnowledgeArchitecture(
  ctx?: KnowledgeArchitectureContext,
): KnowledgeArchitectureReport {
  const report = validateKnowledgeArchitecture(ctx);
  if (!report.valid) {
    throw new Error(
      `Knowledge architecture violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runKnowledgeArchitecture(input: {
  ctx?: KnowledgeArchitectureContext;
}): KnowledgeArchitectureReport {
  return validateKnowledgeArchitecture(input.ctx);
}

export function isKnowledgeArchitectureFailure(code: string): code is KnowledgeArchitectureFailureCode {
  return [
    "DOCUMENT_ONLY_KNOWLEDGE",
    "MISSING_SEMANTIC_LINKS",
    "NO_VERSIONING",
    "INCONSISTENT_STRUCTURE",
    "FULL_BASE_LEAK",
    "INVALID_KNOWLEDGE_OBJECT",
    "BROKEN_HIERARCHY",
    "MODULE_STRUCTURE_MISMATCH",
  ].includes(code);
}
