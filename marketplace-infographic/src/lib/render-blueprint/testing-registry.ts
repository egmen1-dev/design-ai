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
  { id: "event-system", path: `${BP}/event-system.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.9", description: "Event bus delivery", usesLlm: false },
  { id: "snapshot-recovery", path: `${BP}/snapshot-recovery.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.8", description: "Snapshot and recovery", usesLlm: false },
  { id: "lifecycle-manager", path: `${BP}/lifecycle-manager.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.4", description: "Lifecycle manager orchestration", usesLlm: false },
  { id: "render-pipeline", path: `${BP}/render-pipeline.spec.ts`, category: TestCategory.PIPELINE, chapter: "3.11", description: "Render adapter contract", usesLlm: false },
  { id: "recovery-engine", path: `${BP}/recovery-engine.spec.ts`, category: TestCategory.PIPELINE, chapter: "3.16", description: "Error handling and recovery", usesLlm: false },
  { id: "observability", path: `${BP}/observability.spec.ts`, category: TestCategory.INTEGRATION, chapter: "3.15", description: "Diagnostics and traces", usesLlm: false },
  { id: "testing-architecture", path: `${BP}/testing-architecture.spec.ts`, category: TestCategory.REGRESSION, chapter: "3.17", description: "Testing framework meta", usesLlm: false },
  { id: "vision-tests", path: `${BP}/vision-tests.spec.ts`, category: TestCategory.VISION, chapter: "3.17", description: "Vision defect detection", usesLlm: false },
  { id: "vision-qa", path: `${BP}/vision-qa.spec.ts`, category: TestCategory.VISION, chapter: "3.18", description: "Vision Quality Assurance", usesLlm: false },
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
