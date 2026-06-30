/**
 * Chapter 3.17 — Test registry (spec files → categories)
 */
import { TestCategory, type TestCategoryId, type TestSpecEntry } from "./testing-types";

const BP = "src/lib/render-blueprint";

export const V18_TEST_REGISTRY: TestSpecEntry[] = [
  { id: "serialization", path: `${BP}/serialization.spec.ts`, category: TestCategory.UNIT, chapter: "3.12", description: "Serializer, canonical JSON, checksum", usesLlm: false },
  { id: "constraint-engine", path: `${BP}/constraint-engine.spec.ts`, category: TestCategory.UNIT, chapter: "3.7", description: "Constraint validator", usesLlm: false },
  { id: "mutation-engine", path: `${BP}/mutation-engine.spec.ts`, category: TestCategory.UNIT, chapter: "3.5", description: "Mutation engine", usesLlm: false },
  { id: "validation-engine", path: `${BP}/validation-engine.spec.ts`, category: TestCategory.UNIT, chapter: "3.6", description: "Validation engine", usesLlm: false },
  { id: "performance-model", path: `${BP}/performance-model.spec.ts`, category: TestCategory.PERFORMANCE, chapter: "3.14", description: "Performance budgets and cache", usesLlm: false },
  { id: "render-blueprint", path: `${BP}/render-blueprint.spec.ts`, category: TestCategory.BLUEPRINT, chapter: "3", description: "Blueprint structure and invariants", usesLlm: false },
  { id: "blueprint-versioning", path: `${BP}/blueprint-versioning.spec.ts`, category: TestCategory.BLUEPRINT, chapter: "3.13", description: "Schema version and migration", usesLlm: false },
  { id: "decision-graph", path: `${BP}/decision-graph.spec.ts`, category: TestCategory.BLUEPRINT, chapter: "3.3", description: "Decision graph", usesLlm: false },
  { id: "lifecycle", path: `${BP}/lifecycle.spec.ts`, category: TestCategory.BLUEPRINT, chapter: "3.1", description: "Lifecycle sections and states", usesLlm: false },
  { id: "agent-contracts", path: `${BP}/agent-contracts.spec.ts`, category: TestCategory.AGENT, chapter: "3.2", description: "Agent contracts and ownership", usesLlm: false },
  { id: "agent-registry", path: `${BP}/agent-registry.spec.ts`, category: TestCategory.AGENT, chapter: "3.10", description: "Agent registry DI", usesLlm: false },
  { id: "agent-registry-v43", path: `${BP}/agent-registry-v43.spec.ts`, category: TestCategory.AGENT, chapter: "4.3", description: "Agent Registry catalog", usesLlm: false },
  { id: "agent-discovery", path: `${BP}/agent-discovery.spec.ts`, category: TestCategory.AGENT, chapter: "4.4", description: "Agent Discovery execution plan", usesLlm: false },
  { id: "agent-dependency", path: `${BP}/agent-dependency.spec.ts`, category: TestCategory.AGENT, chapter: "4.5", description: "Agent Dependencies data graph", usesLlm: false },
  { id: "agent-context", path: `${BP}/agent-context.spec.ts`, category: TestCategory.AGENT, chapter: "4.6", description: "Agent Context input package", usesLlm: false },
  { id: "agent-memory", path: `${BP}/agent-memory.spec.ts`, category: TestCategory.AGENT, chapter: "4.7", description: "Agent Memory Model layers", usesLlm: false },
  { id: "agent-decision", path: `${BP}/agent-decision.spec.ts`, category: TestCategory.AGENT, chapter: "4.8", description: "Agent Decision Model pipeline", usesLlm: false },
  { id: "agent-confidence", path: `${BP}/agent-confidence.spec.ts`, category: TestCategory.AGENT, chapter: "4.9", description: "Agent Confidence Model", usesLlm: false },
  { id: "visual-story-director", path: `${BP}/visual-story-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.10", description: "Visual Story Director", usesLlm: false },
  { id: "scene-director", path: `${BP}/scene-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.11", description: "Scene Director", usesLlm: false },
  { id: "composition-director", path: `${BP}/composition-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.12", description: "Composition Director", usesLlm: false },
  { id: "commercial-photo-director", path: `${BP}/commercial-photo-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.13", description: "Commercial Photo Director", usesLlm: false },
  { id: "lighting-director", path: `${BP}/lighting-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.14", description: "Lighting Director", usesLlm: false },
  { id: "camera-director", path: `${BP}/camera-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.15", description: "Camera Director", usesLlm: false },
  { id: "material-director", path: `${BP}/material-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.16", description: "Material Director", usesLlm: false },
  { id: "render-adapter", path: `${BP}/render-adapter.spec.ts`, category: TestCategory.PIPELINE, chapter: "4.17", description: "Render Adapter", usesLlm: false },
  { id: "vision-quality-director", path: `${BP}/vision-quality-director.spec.ts`, category: TestCategory.VISION, chapter: "4.18", description: "Vision Quality Director", usesLlm: false },
  { id: "chief-design-director", path: `${BP}/chief-design-director.spec.ts`, category: TestCategory.AGENT, chapter: "4.19", description: "Chief Design Director", usesLlm: false },
  { id: "design-memory", path: `${BP}/design-memory.spec.ts`, category: TestCategory.AGENT, chapter: "4.20", description: "Design Memory", usesLlm: false },
  { id: "event-system", path: `${BP}/event-system.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.9", description: "Event bus delivery", usesLlm: false },
  { id: "snapshot-recovery", path: `${BP}/snapshot-recovery.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.8", description: "Snapshot and recovery", usesLlm: false },
  { id: "lifecycle-manager", path: `${BP}/lifecycle-manager.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.4", description: "Lifecycle manager orchestration", usesLlm: false },
  { id: "render-pipeline", path: `${BP}/render-pipeline.spec.ts`, category: TestCategory.PIPELINE, chapter: "3.11", description: "Render adapter contract", usesLlm: false },
  { id: "recovery-engine", path: `${BP}/recovery-engine.spec.ts`, category: TestCategory.PIPELINE, chapter: "3.16", description: "Error handling and recovery", usesLlm: false },
  { id: "observability", path: `${BP}/observability.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.15", description: "Diagnostics and traces", usesLlm: false },
  { id: "testing-architecture", path: `${BP}/testing-architecture.spec.ts`, category: TestCategory.REGRESSION, chapter: "3.17", description: "Testing framework meta", usesLlm: false },
  { id: "vision-tests", path: `${BP}/vision-tests.spec.ts`, category: TestCategory.VISION, chapter: "3.17", description: "Vision defect detection", usesLlm: false },
  { id: "vision-qa", path: `${BP}/vision-qa.spec.ts`, category: TestCategory.VISION, chapter: "3.18", description: "Vision Quality Assurance", usesLlm: false },
  { id: "architecture-validator", path: `${BP}/architecture-validator.spec.ts`, category: TestCategory.BLUEPRINT, chapter: "3.19", description: "Architectural Invariants", usesLlm: false },
  { id: "agent-ecosystem", path: `${BP}/agent-ecosystem.spec.ts`, category: TestCategory.AGENT, chapter: "4", description: "Agent Ecosystem principles and categories", usesLlm: false },
  { id: "universal-agent-contract", path: `${BP}/universal-agent-contract.spec.ts`, category: TestCategory.AGENT, chapter: "4.1", description: "Universal Agent Contract", usesLlm: false },
  { id: "agent-lifecycle", path: `${BP}/agent-lifecycle.spec.ts`, category: TestCategory.AGENT, chapter: "4.2", description: "Agent Lifecycle orchestration", usesLlm: false },
];

export function specsForCategory(category: TestCategoryId): TestSpecEntry[] {
  return V18_TEST_REGISTRY.filter((e) => e.category === category);
}

export function specsWithoutLlm(): TestSpecEntry[] {
  return V18_TEST_REGISTRY.filter((e) => !e.usesLlm);
}

export function prRequiredCategories(): TestCategoryId[] {
  return [
    TestCategory.UNIT,
    TestCategory.BLUEPRINT,
    TestCategory.AGENT,
    TestCategory.INTEGRATION,
    TestCategory.PIPELINE,
  ];
}
