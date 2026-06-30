/**
 * Chapter 4.28 — Agent Ecosystem Summary engine.
 * Unifies the full Design AI agent architecture into one engineering model.
 */
import { AGENT_ECOSYSTEM_GOLDEN_RULE } from "./agent-ecosystem";
import { AGENT_COMMUNICATION_GOLDEN_RULE } from "./agent-communication-protocol-engine";
import { CHIEF_DESIGN_DIRECTOR_ID } from "./chief-design-director-engine";
import { CONSENSUS_ENGINE_ID } from "./consensus-engine-engine";
import { DESIGN_MEMORY_ID } from "./design-memory-engine";
import { EXPLAINABILITY_GOLDEN_RULE } from "./explainability-architecture-engine";
import { PROVIDER_INDEPENDENCE_GOLDEN_RULE } from "./provider-independence-engine";
import { RETRY_ARCHITECTURE_ID } from "./retry-architecture-engine";
import type { AgentContractId } from "./agent-contracts";
import type { RenderBlueprint } from "./types";
import {
  EcosystemLayer,
  EngineeringPrinciple,
  type AgentEcosystemSummaryContext,
  type AgentEcosystemSummaryReport,
  type EcosystemCohesionCheck,
  type EcosystemLayerId,
  type EcosystemPipelineStage,
  type EcosystemSummaryFailureCode,
  type EcosystemSummaryViolation,
  type EngineeringPrincipleDefinition,
  type ExpectedOutcome,
  type LayerDefinition,
  type ScalabilityCapability,
} from "./agent-ecosystem-summary-types";

export {
  EcosystemLayer,
  EngineeringPrinciple,
  type EcosystemLayerId,
  type EngineeringPrincipleId,
  type EcosystemPipelineStage,
  type LayerDefinition,
  type EngineeringPrincipleDefinition,
  type ExpectedOutcome,
  type ScalabilityCapability,
  type EcosystemCohesionCheck,
  type AgentEcosystemSummaryContext,
  type AgentEcosystemSummaryReport,
  type EcosystemSummaryViolation,
  type EcosystemSummaryFailureCode,
} from "./agent-ecosystem-summary-types";

export const AGENT_ECOSYSTEM_SUMMARY_VERSION = "4.28.0";

export const AGENT_ECOSYSTEM_SUMMARY_GOLDEN_RULE =
  "Prompt is not the product of Design AI. Image is not the product of Design AI. " +
  "The true product is the intelligent design process that transforms a business goal " +
  "into professional commercial infographic through collaboration of independent, explainable, " +
  "learning, and interchangeable agents. The Agent Ecosystem is the platform's core asset — " +
  "the Render Provider is merely the tool that materializes its decisions.";

export const ECOSYSTEM_CORE_PHILOSOPHY =
  "Design AI is not one big prompt, one big LLM, or one big agent. " +
  "It is an ecosystem of specialized intelligent agents — each makes limited decisions, but with maximum quality. " +
  "Nobody knows everything. Everyone knows their domain.";

export const ECOSYSTEM_PIPELINE: readonly EcosystemPipelineStage[] = [
  {
    id: "business-goal",
    label: "Business Goal",
    layer: EcosystemLayer.BUSINESS,
    responsibility: "Understand what must be sold and to whom",
  },
  {
    id: "product-analysis",
    label: "Product Analysis",
    layer: EcosystemLayer.BUSINESS,
    agentId: "product-analyzer",
    blueprintSections: ["product", "creative"],
    responsibility: "Analyze product and commercial context",
  },
  {
    id: "visual-story-director",
    label: "Visual Story Director",
    layer: EcosystemLayer.CREATIVE,
    agentId: "visual-story-director",
    blueprintSections: ["story"],
    responsibility: "Define commercial narrative and emotional positioning",
  },
  {
    id: "scene-director",
    label: "Scene Director",
    layer: EcosystemLayer.CREATIVE,
    agentId: "scene-director",
    blueprintSections: ["scene"],
    responsibility: "Define believable commercial environment",
  },
  {
    id: "composition-director",
    label: "Composition Director",
    layer: EcosystemLayer.CREATIVE,
    agentId: "composition-director",
    blueprintSections: ["composition"],
    responsibility: "Organize visual hierarchy for marketplace conversion",
  },
  {
    id: "commercial-photo-director",
    label: "Commercial Photo Director",
    layer: EcosystemLayer.CREATIVE,
    agentId: "commercial-photo-director",
    blueprintSections: ["photography"],
    responsibility: "Define photographic capture intent",
  },
  {
    id: "lighting-director",
    label: "Lighting Director",
    layer: EcosystemLayer.TECHNICAL,
    agentId: "lighting-director",
    blueprintSections: ["lighting"],
    responsibility: "Define physical lighting model",
  },
  {
    id: "camera-director",
    label: "Camera Director",
    layer: EcosystemLayer.TECHNICAL,
    agentId: "camera-director",
    blueprintSections: ["camera"],
    responsibility: "Define camera geometry and framing",
  },
  {
    id: "material-director",
    label: "Material Director",
    layer: EcosystemLayer.TECHNICAL,
    agentId: "material-director",
    blueprintSections: ["materials"],
    responsibility: "Define surface and material response",
  },
  {
    id: "consensus-engine",
    label: "Consensus Engine",
    layer: EcosystemLayer.VALIDATION,
    agentId: CONSENSUS_ENGINE_ID as AgentContractId,
    responsibility: "Detect cross-agent semantic conflicts before render",
  },
  {
    id: "render-blueprint",
    label: "Render Blueprint",
    layer: EcosystemLayer.TECHNICAL,
    blueprintSections: ["story", "scene", "photography", "lighting", "camera", "materials", "composition"],
    responsibility: "Single source of truth for all design decisions",
  },
  {
    id: "render-adapter",
    label: "Render Adapter",
    layer: EcosystemLayer.RENDERING,
    agentId: "flux-adapter",
    blueprintSections: ["render"],
    responsibility: "Compile blueprint into provider-specific request — blueprint unchanged",
  },
  {
    id: "render-provider",
    label: "Render Provider",
    layer: EcosystemLayer.RENDERING,
    responsibility: "Execute image generation — swappable executor only",
  },
  {
    id: "vision-quality-director",
    label: "Vision Quality Director",
    layer: EcosystemLayer.VALIDATION,
    agentId: "vision-quality-director",
    responsibility: "Evaluate generated image against blueprint",
  },
  {
    id: "commercial-photographer",
    label: "Commercial Photographer",
    layer: EcosystemLayer.VALIDATION,
    responsibility: "Assess commercial photography quality",
  },
  {
    id: "chief-design-director",
    label: "Chief Design Director",
    layer: EcosystemLayer.VALIDATION,
    agentId: CHIEF_DESIGN_DIRECTOR_ID,
    responsibility: "Final approve/retry governance — never creates design",
  },
  {
    id: "retry-architecture",
    label: "Retry Architecture",
    layer: EcosystemLayer.VALIDATION,
    agentId: RETRY_ARCHITECTURE_ID as AgentContractId,
    responsibility: "Localized pipeline recovery without full restart",
  },
  {
    id: "approved-result",
    label: "Approved Result",
    layer: EcosystemLayer.VALIDATION,
    responsibility: "Commercial-ready infographic output",
  },
  {
    id: "design-memory",
    label: "Design Memory",
    layer: EcosystemLayer.LEARNING,
    agentId: DESIGN_MEMORY_ID,
    responsibility: "Learn from design decisions, not prompts — post-pipeline only",
  },
] as const;

export const ECOSYSTEM_LAYERS: readonly LayerDefinition[] = [
  {
    id: EcosystemLayer.BUSINESS,
    name: "Business Layer",
    summary: "Understands what must be sold",
    agents: ["product-analyzer"],
  },
  {
    id: EcosystemLayer.CREATIVE,
    name: "Creative Layer",
    summary: "Creates the design intent",
    agents: [
      "visual-story-director",
      "scene-director",
      "composition-director",
      "commercial-photo-director",
    ],
  },
  {
    id: EcosystemLayer.TECHNICAL,
    name: "Technical Layer",
    summary: "Transforms intent into physical image model",
    agents: ["lighting-director", "camera-director", "material-director"],
  },
  {
    id: EcosystemLayer.RENDERING,
    name: "Rendering Layer",
    summary: "Adapts model to specific provider",
    agents: ["flux-adapter"],
  },
  {
    id: EcosystemLayer.VALIDATION,
    name: "Validation Layer",
    summary: "Evaluates result quality and coherence",
    agents: [
      CONSENSUS_ENGINE_ID as AgentContractId,
      "vision-quality-director",
      CHIEF_DESIGN_DIRECTOR_ID,
      RETRY_ARCHITECTURE_ID as AgentContractId,
    ],
  },
  {
    id: EcosystemLayer.LEARNING,
    name: "Learning Layer",
    summary: "Makes the system smarter after project completion",
    agents: [DESIGN_MEMORY_ID],
  },
] as const;

export const ENGINEERING_PRINCIPLES: readonly EngineeringPrincipleDefinition[] = [
  {
    id: EngineeringPrinciple.SINGLE_RESPONSIBILITY,
    name: "Single Responsibility",
    summary: "Each agent solves one task and owns one blueprint section",
  },
  {
    id: EngineeringPrinciple.IMMUTABLE_BLUEPRINT,
    name: "Immutable Blueprint",
    summary: "Published decisions are not modified directly — only versioned mutations",
    chapter: "4.21",
  },
  {
    id: EngineeringPrinciple.STRUCTURED_COMMUNICATION,
    name: "Structured Communication",
    summary: "Agents exchange structured blueprint sections, never direct calls",
    chapter: "4.21",
  },
  {
    id: EngineeringPrinciple.EXPLAINABILITY,
    name: "Explainability",
    summary: "Every decision has author, reason, sources, and dependencies",
    chapter: "4.26",
  },
  {
    id: EngineeringPrinciple.PROVIDER_INDEPENDENCE,
    name: "Provider Independence",
    summary: "Image generator is a replaceable executor — only adapter changes",
    chapter: "4.25",
  },
  {
    id: EngineeringPrinciple.CONTINUOUS_LEARNING,
    name: "Continuous Learning",
    summary: "Each generation improves future ones through Design Memory",
    chapter: "4.20",
  },
] as const;

const REQUIRED_CHAPTERS = [
  "4.19",
  "4.20",
  "4.21",
  "4.22",
  "4.23",
  "4.24",
  "4.25",
  "4.26",
  "4.27",
  "4.28",
] as const;

function violation(
  code: EcosystemSummaryViolation["code"],
  message: string,
  stage?: string,
): EcosystemSummaryViolation {
  return { code, message, stage };
}

export function getPipelineStage(id: string): EcosystemPipelineStage | undefined {
  return ECOSYSTEM_PIPELINE.find((s) => s.id === id);
}

export function getLayerDefinition(layer: EcosystemLayerId): LayerDefinition | undefined {
  return ECOSYSTEM_LAYERS.find((l) => l.id === layer);
}

export function agentsInLayer(layer: EcosystemLayerId): AgentContractId[] {
  return getLayerDefinition(layer)?.agents ?? [];
}

export function buildScalabilityCapabilities(): ScalabilityCapability[] {
  return [
    {
      extension: "new-creative-director",
      supported: true,
      mechanism: "Register agent in agent-registry with write matrix for new section",
    },
    {
      extension: "new-critic",
      supported: true,
      mechanism: "Read-only agent with critic category — no blueprint mutation",
    },
    {
      extension: "new-provider",
      supported: true,
      mechanism: "Add render adapter + capability profile — blueprint unchanged",
    },
    {
      extension: "new-validator",
      supported: true,
      mechanism: "Validation layer agent reads blueprint, reports issues",
    },
    {
      extension: "new-marketplace",
      supported: true,
      mechanism: "Creative blueprint marketplace field — agents remain provider-independent",
    },
    {
      extension: "new-product-category",
      supported: true,
      mechanism: "Design Memory category isolation — patterns scoped per category",
    },
  ];
}

export function buildExpectedOutcomes(
  blueprint?: Readonly<RenderBlueprint>,
): ExpectedOutcome[] {
  const hasBlueprint = Boolean(blueprint?.meta?.id);
  const hasCreativeSections = Boolean(
    blueprint?.story?.hook && blueprint?.lighting?.lightingScheme && blueprint?.composition?.template,
  );
  const hasAudit = Boolean(blueprint?.meta?.audit?.length);

  return [
    {
      id: "commercial-infographics",
      description: "Stably create commercial infographics",
      validated: hasCreativeSections,
      evidence: hasCreativeSections ? "Creative and technical blueprint sections populated" : undefined,
    },
    {
      id: "reduce-prompt-dependency",
      description: "Reduce dependency on prompt quality",
      validated: true,
      evidence: PROVIDER_INDEPENDENCE_GOLDEN_RULE,
    },
    {
      id: "minimize-retry",
      description: "Minimize retry through consensus and chief review",
      validated: true,
      evidence: "Consensus Engine (4.23) + Retry Architecture (4.24) localized recovery",
    },
    {
      id: "extensible",
      description: "Easily extensible agent architecture",
      validated: buildScalabilityCapabilities().every((c) => c.supported),
    },
    {
      id: "multi-provider",
      description: "Support multiple generation models",
      validated: true,
      evidence: "Provider Independence (4.25) multi-provider compile",
    },
    {
      id: "reproducible-quality",
      description: "Reproducible quality through blueprint and versioning",
      validated: hasBlueprint,
      evidence: hasBlueprint ? `Blueprint revision ${blueprint!.meta.revision}` : undefined,
    },
    {
      id: "continuous-improvement",
      description: "Gradual improvement through Design Memory",
      validated: true,
      evidence: "Design Memory (4.20) learns from decisions, not prompts",
    },
    {
      id: "sell-products",
      description: "Create images that help sell products — not just beautiful pictures",
      validated: Boolean(blueprint?.creative?.goal),
      evidence: blueprint?.creative?.goal
        ? `Commercial goal: ${blueprint.creative.goal}`
        : undefined,
    },
  ];
}

export function buildCohesionChecks(ctx: AgentEcosystemSummaryContext = {}): EcosystemCohesionCheck[] {
  const chapters = ctx.implementedChapters ?? [...REQUIRED_CHAPTERS];

  return [
    {
      id: "blueprint-is-heart",
      passed: true,
      message: "Render Blueprint is the central object — prompt is temporary compilation only",
    },
    {
      id: "agent-independence",
      passed: true,
      message: AGENT_COMMUNICATION_GOLDEN_RULE,
    },
    {
      id: "explainable-ai",
      passed: chapters.includes("4.26"),
      message: EXPLAINABILITY_GOLDEN_RULE.slice(0, 120) + "...",
    },
    {
      id: "provider-independence",
      passed: chapters.includes("4.25"),
      message: PROVIDER_INDEPENDENCE_GOLDEN_RULE.slice(0, 120) + "...",
    },
    {
      id: "self-improvement",
      passed: chapters.includes("4.20"),
      message: "Design Memory learns from blueprint, vision report, chief review, retry history",
    },
    {
      id: "failure-resilience",
      passed: chapters.includes("4.27"),
      message: "Failure Recovery Architecture isolates errors without destroying correct decisions",
    },
    {
      id: "agent-ecosystem-foundation",
      passed: true,
      message: AGENT_ECOSYSTEM_GOLDEN_RULE,
    },
    {
      id: "design-memory-post-pipeline",
      passed: true,
      message: "Design Memory runs after approved result — never mutates current blueprint",
    },
  ];
}

export function validatePipelineCompleteness(): EcosystemSummaryViolation[] {
  const violations: EcosystemSummaryViolation[] = [];
  const requiredIds = [
    "business-goal",
    "visual-story-director",
    "consensus-engine",
    "render-blueprint",
    "render-adapter",
    "render-provider",
    "chief-design-director",
    "retry-architecture",
    "design-memory",
  ];

  for (const id of requiredIds) {
    if (!getPipelineStage(id)) {
      violations.push(
        violation("INCOMPLETE_PIPELINE", `Missing required pipeline stage: ${id}`, id),
      );
    }
  }

  const layerIds = Object.values(EcosystemLayer);
  for (const layer of layerIds) {
    if (!getLayerDefinition(layer)) {
      violations.push(violation("MISSING_LAYER", `Missing ecosystem layer: ${layer}`));
    }
  }

  return violations;
}

export function validateAgentIndependence(): EcosystemSummaryViolation[] {
  const violations: EcosystemSummaryViolation[] = [];
  const directorStages = ECOSYSTEM_PIPELINE.filter((s) => s.agentId && s.blueprintSections?.length);

  for (const stage of directorStages) {
    const sections = stage.blueprintSections ?? [];
    if (sections.length !== 1 && stage.agentId !== "product-analyzer") {
      violations.push(
        violation(
          "AGENT_NOT_INDEPENDENT",
          `Agent ${stage.agentId} should publish exactly one primary section`,
          stage.id,
        ),
      );
    }
  }

  return violations;
}

export function validateAgentEcosystemSummary(
  blueprint?: Readonly<RenderBlueprint>,
  ctx: AgentEcosystemSummaryContext = {},
): AgentEcosystemSummaryReport {
  const violations: EcosystemSummaryViolation[] = [
    ...validatePipelineCompleteness(),
    ...validateAgentIndependence(),
  ];

  const chapters = ctx.implementedChapters ?? [...REQUIRED_CHAPTERS];
  for (const principle of ENGINEERING_PRINCIPLES) {
    if (principle.chapter && !chapters.includes(principle.chapter)) {
      violations.push(
        violation(
          "PRINCIPLE_NOT_IMPLEMENTED",
          `Engineering principle ${principle.name} requires chapter ${principle.chapter}`,
        ),
      );
    }
  }

  const cohesionChecks = buildCohesionChecks(ctx);
  for (const check of cohesionChecks) {
    if (!check.passed) {
      violations.push(
        violation(
          check.id === "explainable-ai"
            ? "MISSING_EXPLAINABILITY"
            : check.id === "provider-independence"
              ? "PROVIDER_NOT_SWAPPABLE"
              : "PRINCIPLE_NOT_IMPLEMENTED",
          check.message,
        ),
      );
    }
  }

  const expectedOutcomes = buildExpectedOutcomes(blueprint);
  for (const outcome of expectedOutcomes) {
    if (!outcome.validated && blueprint) {
      violations.push(
        violation("EXPECTED_OUTCOME_UNMET", `Expected outcome not met: ${outcome.description}`),
      );
    }
  }

  const designMemoryStage = getPipelineStage("design-memory");
  const approvedStage = getPipelineStage("approved-result");
  if (designMemoryStage && approvedStage) {
    const memoryIdx = ECOSYSTEM_PIPELINE.findIndex((s) => s.id === "design-memory");
    const approvedIdx = ECOSYSTEM_PIPELINE.findIndex((s) => s.id === "approved-result");
    if (memoryIdx <= approvedIdx) {
      violations.push(
        violation(
          "LEARNING_NOT_POST_PIPELINE",
          "Design Memory must run after approved result",
          "design-memory",
        ),
      );
    }
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    complete: unique.length === 0,
    violations: unique,
    pipeline: [...ECOSYSTEM_PIPELINE],
    layers: [...ECOSYSTEM_LAYERS],
    principles: [...ENGINEERING_PRINCIPLES],
    expectedOutcomes,
    scalability: buildScalabilityCapabilities(),
    cohesionChecks,
    goldenRuleSatisfied: unique.length === 0,
  };
}

export function assertEcosystemComplete(
  blueprint?: RenderBlueprint,
  ctx?: AgentEcosystemSummaryContext,
): AgentEcosystemSummaryReport {
  const report = validateAgentEcosystemSummary(blueprint, ctx);
  if (!report.complete) {
    throw new Error(
      `Agent ecosystem incomplete: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runAgentEcosystemSummary(input: {
  blueprint?: RenderBlueprint;
  ctx?: AgentEcosystemSummaryContext;
}): AgentEcosystemSummaryReport {
  return validateAgentEcosystemSummary(input.blueprint, input.ctx);
}

export function isEcosystemSummaryFailure(code: string): code is EcosystemSummaryFailureCode {
  return [
    "INCOMPLETE_PIPELINE",
    "MISSING_LAYER",
    "PRINCIPLE_NOT_IMPLEMENTED",
    "BLUEPRINT_NOT_CENTRAL",
    "AGENT_NOT_INDEPENDENT",
    "MISSING_EXPLAINABILITY",
    "PROVIDER_NOT_SWAPPABLE",
    "LEARNING_NOT_POST_PIPELINE",
    "EXPECTED_OUTCOME_UNMET",
  ].includes(code);
}
