/**
 * Chapter 7 — Agent Implementation Specification engine.
 * Standardizes internal architecture of every Design AI intelligent agent.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { validateExplainabilityArchitecture } from "./explainability-architecture-engine";
import { validatePipelineIndependentRetry } from "./design-pipeline-engine";
import { validateUniversalAgentContract } from "./universal-agent-contract-validator";
import { universalStoryDirectorAgent } from "./agents/story-director-agent";
import { universalSceneDirectorAgent } from "./agents/scene-director-agent";
import { universalCompositionDirectorAgent } from "./agents/composition-director-agent";
import { universalCommercialPhotoDirectorAgent } from "./agents/commercial-photo-director-agent";
import { universalLightingDirectorAgent } from "./agents/lighting-director-agent";
import { universalCameraDirectorAgent } from "./agents/camera-director-agent";
import { universalMaterialDirectorAgent } from "./agents/material-director-agent";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import {
  AgentDocumentationSection,
  AgentImplementationStatus,
  AgentInternalLayer,
  AgentSharedPrincipleId,
  UniversalAgentModelStage,
  type AgentConformanceReport,
  type AgentDocumentationSectionDefinition,
  type AgentImplementationScopeEntry,
  type AgentImplementationSpecContext,
  type AgentImplementationSpecFailureCode,
  type AgentImplementationSpecReport,
  type AgentImplementationSpecViolation,
  type AgentInternalLayerDefinition,
  type AgentSharedPrincipleCheckResult,
  type AgentSharedPrincipleDefinition,
  type AgentSharedPrincipleIdValue,
  type UniversalAgentModelStageDefinition,
} from "./agent-implementation-spec-types";

export {
  UniversalAgentModelStage,
  AgentInternalLayer,
  AgentSharedPrincipleId,
  AgentDocumentationSection,
  AgentImplementationStatus,
  type UniversalAgentModelStageId,
  type AgentInternalLayerId,
  type AgentSharedPrincipleIdValue,
  type AgentDocumentationSectionId,
  type AgentImplementationStatusId,
  type UniversalAgentModelStageDefinition,
  type AgentInternalLayerDefinition,
  type AgentSharedPrincipleDefinition,
  type AgentDocumentationSectionDefinition,
  type AgentImplementationScopeEntry,
  type AgentImplementationSpecViolation,
  type AgentSharedPrincipleCheckResult,
  type AgentConformanceReport,
  type AgentImplementationSpecReport,
  type AgentImplementationSpecContext,
  type AgentImplementationSpecFailureCode,
} from "./agent-implementation-spec-types";

export const AGENT_IMPLEMENTATION_SPEC_VERSION = "7.0.0";

export const AGENT_IMPLEMENTATION_SPEC_GOLDEN_RULE =
  "Agent Ecosystem describes how agents interact with each other. " +
  "Agent Implementation Specification describes how each agent is built inside. " +
  "This chapter turns the abstract notion of an AI agent into a full engineering component " +
  "that can be implemented, tested, scaled, and evolved independently from the rest of the system.";

export const AGENT_IMPLEMENTATION_ARCHITECTURE_STATEMENT =
  "Design AI never uses one big prompt agent. Each agent is an independent intelligent microservice " +
  "with its own architecture, memory, knowledge, decision system, validation, and learning mechanism. " +
  "Only the Decision Engine content changes — the internal architecture remains identical.";

export const LEGACY_PROMPT_AGENT_MODEL = ["input", "prompt", "llm", "output"] as const;

export const UNIVERSAL_AGENT_MODEL_PIPELINE: readonly UniversalAgentModelStageDefinition[] = [
  {
    id: UniversalAgentModelStage.PIPELINE_CONTEXT,
    order: 1,
    label: "Pipeline Context",
    moduleRef: "agent-context-engine",
    responsibility: "Receive unified pipeline context package",
  },
  {
    id: UniversalAgentModelStage.INPUT_ADAPTER,
    order: 2,
    label: "Input Adapter",
    moduleRef: "universal-agent-bridge",
    responsibility: "Normalize legacy or external inputs into agent context",
  },
  {
    id: UniversalAgentModelStage.KNOWLEDGE_RETRIEVAL,
    order: 3,
    label: "Knowledge Retrieval",
    moduleRef: "knowledge-retrieval-engine",
    responsibility: "Load domain knowledge before any design decision",
  },
  {
    id: UniversalAgentModelStage.DECISION_ENGINE,
    order: 4,
    label: "Decision Engine",
    moduleRef: "agent-decision-engine",
    responsibility: "Observe, reason, evaluate, and decide professional design outcome",
  },
  {
    id: UniversalAgentModelStage.RULE_ENGINE,
    order: 5,
    label: "Rule Engine",
    moduleRef: "constraint-engine",
    responsibility: "Apply design laws, marketplace rules, and constraints",
  },
  {
    id: UniversalAgentModelStage.BLUEPRINT_GENERATOR,
    order: 6,
    label: "Blueprint Generator",
    moduleRef: "mutation-engine",
    responsibility: "Emit section mutations — never a full blueprint rewrite",
  },
  {
    id: UniversalAgentModelStage.SELF_VALIDATION,
    order: 7,
    label: "Self Validation",
    moduleRef: "validation-engine",
    responsibility: "Validate decision quality before publishing to pipeline",
  },
  {
    id: UniversalAgentModelStage.OUTPUT_ADAPTER,
    order: 8,
    label: "Output Adapter",
    moduleRef: "universal-agent-contract",
    responsibility: "Return UniversalAgentResult with diagnostics and trace",
  },
  {
    id: UniversalAgentModelStage.PIPELINE_CONTEXT_OUT,
    order: 9,
    label: "Pipeline Context",
    moduleRef: "pipeline-context-engine",
    responsibility: "Publish mutations back to shared pipeline context",
  },
] as const;

export const AGENT_INTERNAL_ARCHITECTURE: readonly AgentInternalLayerDefinition[] = [
  { id: AgentInternalLayer.INPUT_LAYER, order: 1, label: "Input Layer", responsibility: "Contract-defined inputs from pipeline context" },
  { id: AgentInternalLayer.CONTEXT_ANALYZER, order: 2, label: "Context Analyzer", responsibility: "Interpret blueprint sections relevant to agent domain" },
  { id: AgentInternalLayer.KNOWLEDGE_RETRIEVAL, order: 3, label: "Knowledge Retrieval", responsibility: "Retrieve patterns, rules, and anti-patterns" },
  { id: AgentInternalLayer.DECISION_ENGINE, order: 4, label: "Decision Engine", responsibility: "Domain-specific decision logic — only variable layer" },
  { id: AgentInternalLayer.RULE_VALIDATION, order: 5, label: "Rule Validation", responsibility: "Enforce constraints before blueprint mutation" },
  { id: AgentInternalLayer.BLUEPRINT_BUILDER, order: 6, label: "Blueprint Builder", responsibility: "Build owned section updates only" },
  { id: AgentInternalLayer.SELF_CRITIC, order: 7, label: "Self Critic", responsibility: "Reject low-quality or unexplainable decisions" },
  { id: AgentInternalLayer.OUTPUT_LAYER, order: 8, label: "Output Layer", responsibility: "Structured agent result with confidence and trace" },
] as const;

export const AGENT_SHARED_PRINCIPLES: readonly AgentSharedPrincipleDefinition[] = [
  {
    id: AgentSharedPrincipleId.SINGLE_DOMAIN,
    title: "Single Domain Responsibility",
    rule: "Work only within the agent's declared blueprint section ownership.",
    immutable: true,
  },
  {
    id: AgentSharedPrincipleId.USE_KNOWLEDGE_ENGINE,
    title: "Use Knowledge Engine",
    rule: "Every design decision must consult structured knowledge — never LLM intuition alone.",
    immutable: true,
  },
  {
    id: AgentSharedPrincipleId.NO_FOREIGN_BLUEPRINT_MUTATION,
    title: "No Foreign Blueprint Mutation",
    rule: "Never modify blueprint sections owned by other agents.",
    immutable: true,
  },
  {
    id: AgentSharedPrincipleId.SELF_VALIDATION_REQUIRED,
    title: "Self Validation Required",
    rule: "Pass internal validation before returning output to the pipeline.",
    immutable: true,
  },
  {
    id: AgentSharedPrincipleId.EXPLAINABLE_OUTPUT,
    title: "Explainable Output",
    rule: "Return who decided, why, on what knowledge, and under which constraints.",
    immutable: true,
  },
  {
    id: AgentSharedPrincipleId.RETRY_SUPPORT,
    title: "Retry Support",
    rule: "Support localized retry without requiring full pipeline restart.",
    immutable: true,
  },
  {
    id: AgentSharedPrincipleId.DETERMINISTIC_DECISIONS,
    title: "Deterministic Decisions",
    rule: "Identical context and knowledge version yield identical planning decisions.",
    immutable: true,
  },
] as const;

export const AGENT_DOCUMENTATION_TEMPLATE: readonly AgentDocumentationSectionDefinition[] = [
  { id: AgentDocumentationSection.PURPOSE, number: 1, title: "Purpose", summary: "Why the agent exists in the ecosystem" },
  { id: AgentDocumentationSection.RESPONSIBILITIES, number: 2, title: "Responsibilities", summary: "Exact decision domain and boundaries" },
  { id: AgentDocumentationSection.INPUT, number: 3, title: "Input", summary: "Contract inputs from pipeline context" },
  { id: AgentDocumentationSection.OUTPUT, number: 4, title: "Output", summary: "Mutations, diagnostics, and recommendations" },
  { id: AgentDocumentationSection.INTERNAL_MODULES, number: 5, title: "Internal Modules", summary: "Universal model stage wiring" },
  { id: AgentDocumentationSection.DECISION_ENGINE, number: 6, title: "Decision Engine", summary: "Domain-specific reasoning pipeline" },
  { id: AgentDocumentationSection.KNOWLEDGE_USAGE, number: 7, title: "Knowledge Usage", summary: "Patterns, rules, and retrieval strategy" },
  { id: AgentDocumentationSection.RULE_ENGINE, number: 8, title: "Rule Engine", summary: "Constraints and validation rules applied" },
  { id: AgentDocumentationSection.VALIDATION, number: 9, title: "Validation", summary: "Self-critic and quality gates" },
  { id: AgentDocumentationSection.RETRY_LOGIC, number: 10, title: "Retry Logic", summary: "Localized recovery strategy" },
  { id: AgentDocumentationSection.PERFORMANCE_METRICS, number: 11, title: "Performance Metrics", summary: "Timing, confidence, and knowledge lookups" },
  { id: AgentDocumentationSection.FUTURE_EVOLUTION, number: 12, title: "Future Evolution", summary: "Extension points without architecture change" },
  { id: AgentDocumentationSection.GOLDEN_RULE, number: 13, title: "Golden Rule", summary: "Non-negotiable agent identity statement" },
] as const;

export const AGENT_IMPLEMENTATION_SCOPE: readonly AgentImplementationScopeEntry[] = [
  { id: "product-analysis", label: "Product Analysis Agent", contractId: "product-analyzer", status: AgentImplementationStatus.PIPELINE_STAGE, category: "analysis" },
  { id: "business-understanding", label: "Business Understanding Agent", status: AgentImplementationStatus.PIPELINE_STAGE, category: "analysis" },
  { id: "knowledge-retrieval", label: "Knowledge Retrieval Agent", status: AgentImplementationStatus.PIPELINE_STAGE, category: "analysis" },
  { id: "visual-story-director", label: "Visual Story Director", contractId: "visual-story-director", blueprintSections: ["story"], status: AgentImplementationStatus.IMPLEMENTED, category: "creative" },
  { id: "scene-director", label: "Scene Director", contractId: "scene-director", blueprintSections: ["scene"], status: AgentImplementationStatus.IMPLEMENTED, category: "creative" },
  { id: "composition-director", label: "Composition Director", contractId: "composition-director", blueprintSections: ["composition"], status: AgentImplementationStatus.IMPLEMENTED, category: "creative" },
  { id: "photography-director", label: "Photography Director", contractId: "commercial-photo-director", blueprintSections: ["photography"], status: AgentImplementationStatus.IMPLEMENTED, category: "technical" },
  { id: "lighting-director", label: "Lighting Director", contractId: "lighting-director", blueprintSections: ["lighting"], status: AgentImplementationStatus.IMPLEMENTED, category: "technical" },
  { id: "camera-director", label: "Camera Director", contractId: "camera-director", blueprintSections: ["camera"], status: AgentImplementationStatus.IMPLEMENTED, category: "technical" },
  { id: "material-director", label: "Material Director", contractId: "material-director", blueprintSections: ["materials"], status: AgentImplementationStatus.IMPLEMENTED, category: "technical" },
  { id: "typography-director", label: "Typography Director", status: AgentImplementationStatus.PLANNED, category: "technical" },
  { id: "marketplace-director", label: "Marketplace Director", status: AgentImplementationStatus.PLANNED, category: "creative" },
  { id: "pattern-director", label: "Pattern Director", status: AgentImplementationStatus.PLANNED, category: "learning" },
  { id: "anti-pattern-director", label: "Anti-Pattern Director", status: AgentImplementationStatus.PLANNED, category: "learning" },
  { id: "vision-critic", label: "Vision Critic", contractId: "vision-quality-director", status: AgentImplementationStatus.IMPLEMENTED, category: "critic" },
  { id: "commercial-critic", label: "Commercial Critic", contractId: "critics", status: AgentImplementationStatus.IMPLEMENTED, category: "critic" },
  { id: "marketplace-critic", label: "Marketplace Critic", status: AgentImplementationStatus.PLANNED, category: "critic" },
  { id: "senior-art-director", label: "Senior Art Director", status: AgentImplementationStatus.PLANNED, category: "orchestrator" },
  { id: "chief-design-director", label: "Chief Design Director", contractId: "chief-design-director", status: AgentImplementationStatus.IMPLEMENTED, category: "orchestrator" },
  { id: "learning-agent", label: "Learning Agent", contractId: "design-memory", status: AgentImplementationStatus.IMPLEMENTED, category: "learning" },
  { id: "agent-consensus-engine", label: "Agent Consensus Engine", status: AgentImplementationStatus.IMPLEMENTED, category: "orchestrator" },
] as const;

const IMPLEMENTED_UNIVERSAL_AGENTS = [
  universalStoryDirectorAgent,
  universalSceneDirectorAgent,
  universalCompositionDirectorAgent,
  universalCommercialPhotoDirectorAgent,
  universalLightingDirectorAgent,
  universalCameraDirectorAgent,
  universalMaterialDirectorAgent,
] as const;

const AGENT_GOLDEN_RULES: Partial<Record<AgentContractId, string>> = {
  "visual-story-director": "creates meaning",
  "scene-director": "environment",
  "composition-director": "hierarchy",
  "commercial-photo-director": "photography",
  "lighting-director": "lighting",
  "camera-director": "camera",
  "material-director": "material",
  "chief-design-director": "final decision",
  "vision-quality-director": "vision",
  "design-memory": "learning",
};

function violation(
  code: AgentImplementationSpecFailureCode,
  message: string,
  principleId?: AgentSharedPrincipleIdValue,
  agentId?: string,
): AgentImplementationSpecViolation {
  return { code, message, principleId, agentId };
}

function principleResult(
  principleId: AgentSharedPrincipleIdValue,
  violations: AgentImplementationSpecViolation[],
): AgentSharedPrincipleCheckResult {
  return { principleId, passed: violations.length === 0, violations };
}

export function validateUniversalAgentModel(): AgentImplementationSpecViolation[] {
  const violations: AgentImplementationSpecViolation[] = [];
  if (UNIVERSAL_AGENT_MODEL_PIPELINE.length !== 9) {
    violations.push(violation("INCOMPLETE_UNIVERSAL_MODEL", "Universal Agent Model requires 9 stages"));
  }
  for (let i = 1; i < UNIVERSAL_AGENT_MODEL_PIPELINE.length; i++) {
    if (UNIVERSAL_AGENT_MODEL_PIPELINE[i].order !== UNIVERSAL_AGENT_MODEL_PIPELINE[i - 1].order + 1) {
      violations.push(violation("INCOMPLETE_UNIVERSAL_MODEL", "Universal Agent Model stages must be ordered"));
      break;
    }
  }
  return violations;
}

export function validateAgentInternalArchitecture(): AgentImplementationSpecViolation[] {
  const violations: AgentImplementationSpecViolation[] = [];
  if (AGENT_INTERNAL_ARCHITECTURE.length !== 8) {
    violations.push(violation("INCOMPLETE_INTERNAL_ARCHITECTURE", "Common internal architecture requires 8 layers"));
  }
  return violations;
}

export function validateAgentDocumentationTemplate(): boolean {
  return AGENT_DOCUMENTATION_TEMPLATE.length === 13;
}

export function validateAgentScopeCatalog(): boolean {
  return AGENT_IMPLEMENTATION_SCOPE.length === 21;
}

export function validatePrincipleSingleDomain(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.SINGLE_DOMAIN;
  const violations: AgentImplementationSpecViolation[] = [];

  if (context.superAgent) {
    violations.push(
      violation("SUPER_AGENT_VIOLATION", "Universal super-agent violates single domain specialization", principleId),
    );
  }

  for (const agent of IMPLEMENTED_UNIVERSAL_AGENTS) {
    const writes = AGENT_WRITE_MATRIX[agent.id as AgentContractId] ?? [];
    const photoStack = new Set(["photography", "camera", "lighting", "materials"]);

    if (agent.id === "commercial-photo-director") {
      const outsidePhotoStack = writes.filter((s) => !photoStack.has(s));
      if (outsidePhotoStack.length > 0) {
        violations.push(
          violation(
            "SUPER_AGENT_VIOLATION",
            `Photography director must stay within photo stack sections`,
            principleId,
            agent.id,
          ),
        );
      }
      continue;
    }

    if (writes.length > 1) {
      violations.push(
        violation(
          "SUPER_AGENT_VIOLATION",
          `Agent ${agent.id} writes too many sections — specialization violated`,
          principleId,
          agent.id,
        ),
      );
    }
  }

  return principleResult(principleId, violations);
}

export function validatePrincipleUseKnowledgeEngine(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.USE_KNOWLEDGE_ENGINE;
  const violations: AgentImplementationSpecViolation[] = [];

  const knowledgeStage = UNIVERSAL_AGENT_MODEL_PIPELINE.find(
    (s) => s.id === UniversalAgentModelStage.KNOWLEDGE_RETRIEVAL,
  );
  if (!knowledgeStage) {
    violations.push(violation("MISSING_KNOWLEDGE_USAGE", "Knowledge Retrieval stage missing from universal model", principleId));
  }

  if (context.promptOnlyAgent || context.skipKnowledgeRetrieval) {
    violations.push(
      violation("MISSING_KNOWLEDGE_USAGE", "Agent cannot decide from prompt alone without Knowledge Engine", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validatePrincipleNoForeignBlueprintMutation(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.NO_FOREIGN_BLUEPRINT_MUTATION;
  const violations: AgentImplementationSpecViolation[] = [];

  for (const agent of IMPLEMENTED_UNIVERSAL_AGENTS) {
    const report = validateUniversalAgentContract(agent);
    if (!report.valid) {
      for (const v of report.violations) {
        if (v.code === "MUTATION_OWNERSHIP") {
          violations.push(
            violation("FOREIGN_BLUEPRINT_MUTATION", v.message, principleId, agent.id),
          );
        }
      }
    }
  }

  if (context.mutateForeignSections) {
    violations.push(
      violation("FOREIGN_BLUEPRINT_MUTATION", "Agent modified blueprint section outside its ownership", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validatePrincipleSelfValidationRequired(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.SELF_VALIDATION_REQUIRED;
  const violations: AgentImplementationSpecViolation[] = [];

  const selfValidation = UNIVERSAL_AGENT_MODEL_PIPELINE.find(
    (s) => s.id === UniversalAgentModelStage.SELF_VALIDATION,
  );
  if (!selfValidation) {
    violations.push(
      violation("MISSING_SELF_VALIDATION", "Self Validation stage missing from universal model", principleId),
    );
  }

  if (context.skipSelfValidation) {
    violations.push(
      violation("MISSING_SELF_VALIDATION", "Agent must pass self validation before publishing output", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validatePrincipleExplainableOutput(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.EXPLAINABLE_OUTPUT;
  const violations: AgentImplementationSpecViolation[] = [];

  const bp = frozenTestBlueprint();
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  const explainability = validateExplainabilityArchitecture(bp);
  if (!explainability.explainable) {
    violations.push(
      violation("BLACK_BOX_OUTPUT", "Blueprint decisions must remain explainable through agent outputs", principleId),
    );
  }

  if (context.blackBoxOutput) {
    violations.push(
      violation("BLACK_BOX_OUTPUT", "Agent output must include decision trace and knowledge attribution", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validatePrincipleRetrySupport(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.RETRY_SUPPORT;
  const violations: AgentImplementationSpecViolation[] = [];

  for (const v of validatePipelineIndependentRetry()) {
    violations.push(violation("NO_RETRY_SUPPORT", v.message, principleId));
  }

  if (context.noRetrySupport) {
    violations.push(
      violation("NO_RETRY_SUPPORT", "Agent must support localized retry", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validatePrincipleDeterministicDecisions(
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const principleId = AgentSharedPrincipleId.DETERMINISTIC_DECISIONS;
  const violations: AgentImplementationSpecViolation[] = [];

  if (context.nonDeterministicAgent) {
    violations.push(
      violation("NON_DETERMINISTIC_AGENT", "Planning decisions must be deterministic for identical context", principleId),
    );
  }

  return principleResult(principleId, violations);
}

const PRINCIPLE_VALIDATORS: Record<
  AgentSharedPrincipleIdValue,
  (ctx: AgentImplementationSpecContext) => AgentSharedPrincipleCheckResult
> = {
  [AgentSharedPrincipleId.SINGLE_DOMAIN]: validatePrincipleSingleDomain,
  [AgentSharedPrincipleId.USE_KNOWLEDGE_ENGINE]: validatePrincipleUseKnowledgeEngine,
  [AgentSharedPrincipleId.NO_FOREIGN_BLUEPRINT_MUTATION]: validatePrincipleNoForeignBlueprintMutation,
  [AgentSharedPrincipleId.SELF_VALIDATION_REQUIRED]: validatePrincipleSelfValidationRequired,
  [AgentSharedPrincipleId.EXPLAINABLE_OUTPUT]: validatePrincipleExplainableOutput,
  [AgentSharedPrincipleId.RETRY_SUPPORT]: validatePrincipleRetrySupport,
  [AgentSharedPrincipleId.DETERMINISTIC_DECISIONS]: validatePrincipleDeterministicDecisions,
};

export function validateAgentSharedPrinciple(
  principleId: AgentSharedPrincipleIdValue,
  context: AgentImplementationSpecContext = {},
): AgentSharedPrincipleCheckResult {
  const validator = PRINCIPLE_VALIDATORS[principleId];
  if (!validator) {
    return principleResult(principleId, [
      violation("SPEC_INCOMPLETE", `No validator for principle ${principleId}`, principleId),
    ]);
  }
  return validator(context);
}

export function validateImplementedAgentConformance(agentId: AgentContractId): AgentConformanceReport {
  const violations: AgentImplementationSpecViolation[] = [];
  const scope = AGENT_IMPLEMENTATION_SCOPE.find((e) => e.contractId === agentId);
  const universal = IMPLEMENTED_UNIVERSAL_AGENTS.find((a) => a.id === agentId);
  const hasContract = !!scope || !!universal;
  const hasGoldenRule = !!AGENT_GOLDEN_RULES[agentId];
  const usesDecisionEngine = [
    "visual-story-director",
    "scene-director",
    "composition-director",
    "commercial-photo-director",
    "lighting-director",
    "camera-director",
    "material-director",
  ].includes(agentId);

  if (!hasContract) {
    violations.push(violation("MISSING_CONTRACT", `Agent ${agentId} missing from implementation scope`, undefined, agentId));
  }

  if (universal) {
    const report = validateUniversalAgentContract(universal);
    if (!report.valid) {
      violations.push(
        violation("AGENT_NON_CONFORMANT", `Universal contract validation failed for ${agentId}`, undefined, agentId),
      );
    }
  }

  if (scope?.status === AgentImplementationStatus.IMPLEMENTED && !hasGoldenRule && agentId !== "critics") {
    violations.push(
      violation("AGENT_NON_CONFORMANT", `Implemented agent ${agentId} must document a golden rule`, undefined, agentId),
    );
  }

  return {
    agentId,
    conforms: violations.length === 0,
    hasContract,
    hasGoldenRule,
    usesDecisionEngine,
    violations,
  };
}

export function validateAllImplementedAgents(): AgentConformanceReport[] {
  const implemented = AGENT_IMPLEMENTATION_SCOPE.filter(
    (e) => e.status === AgentImplementationStatus.IMPLEMENTED && e.contractId,
  );
  return implemented.map((e) => validateImplementedAgentConformance(e.contractId as AgentContractId));
}

export function validateAgentImplementationSpec(
  context: AgentImplementationSpecContext = {},
): AgentImplementationSpecReport {
  const structuralViolations = [
    ...validateUniversalAgentModel(),
    ...validateAgentInternalArchitecture(),
  ];

  if (!validateAgentDocumentationTemplate()) {
    structuralViolations.push(
      violation("INCOMPLETE_DOCUMENTATION_TEMPLATE", "Documentation template must define 13 sections"),
    );
  }

  if (!validateAgentScopeCatalog()) {
    structuralViolations.push(
      violation("INCOMPLETE_SCOPE_CATALOG", "Scope catalog must list 21 specialized agents"),
    );
  }

  if (context.promptOnlyAgent) {
    structuralViolations.push(
      violation("PROMPT_ONLY_AGENT", "Prompt-only agent architecture is forbidden in Design AI"),
    );
  }

  const principleResults = AGENT_SHARED_PRINCIPLES.map((p) => validateAgentSharedPrinciple(p.id, context));
  const conformanceReports = validateAllImplementedAgents();
  const conformanceViolations = conformanceReports
    .filter((r) => !r.conforms)
    .flatMap((r) => r.violations);

  const violations = [
    ...structuralViolations,
    ...principleResults.flatMap((r) => r.violations),
    ...conformanceViolations,
  ];

  const principlesPassed = principleResults.filter((r) => r.passed).length;

  return {
    valid: violations.length === 0,
    violations,
    principleResults,
    principlesPassed,
    principlesTotal: AGENT_SHARED_PRINCIPLES.length,
    universalModelComplete: validateUniversalAgentModel().length === 0,
    internalArchitectureComplete: validateAgentInternalArchitecture().length === 0,
    documentationTemplateComplete: validateAgentDocumentationTemplate(),
    scopeCatalogComplete: validateAgentScopeCatalog(),
    implementedAgentsConform: conformanceReports.every((r) => r.conforms),
    conformanceReports,
    goldenRuleSatisfied: AGENT_IMPLEMENTATION_SPEC_GOLDEN_RULE.includes("built inside"),
    architectureStatementValid: AGENT_IMPLEMENTATION_ARCHITECTURE_STATEMENT.includes("microservice"),
    successCriteriaMet:
      violations.length === 0 &&
      validateAgentDocumentationTemplate() &&
      validateAgentScopeCatalog(),
  };
}

export function assertAgentImplementationSpec(
  context?: AgentImplementationSpecContext,
): AgentImplementationSpecReport {
  const report = validateAgentImplementationSpec(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Agent Implementation Specification violated: ${messages}`);
  }
  return report;
}

export function runAgentImplementationSpec(
  context: AgentImplementationSpecContext = {},
): AgentImplementationSpecReport {
  return validateAgentImplementationSpec(context);
}

export function isAgentImplementationSpecFailure(
  code: string,
): code is AgentImplementationSpecFailureCode {
  const codes: AgentImplementationSpecFailureCode[] = [
    "PROMPT_ONLY_AGENT",
    "SUPER_AGENT_VIOLATION",
    "MISSING_KNOWLEDGE_USAGE",
    "FOREIGN_BLUEPRINT_MUTATION",
    "MISSING_SELF_VALIDATION",
    "BLACK_BOX_OUTPUT",
    "NO_RETRY_SUPPORT",
    "NON_DETERMINISTIC_AGENT",
    "MISSING_CONTRACT",
    "INCOMPLETE_UNIVERSAL_MODEL",
    "INCOMPLETE_INTERNAL_ARCHITECTURE",
    "INCOMPLETE_DOCUMENTATION_TEMPLATE",
    "INCOMPLETE_SCOPE_CATALOG",
    "AGENT_NON_CONFORMANT",
    "SPEC_INCOMPLETE",
  ];
  return codes.includes(code as AgentImplementationSpecFailureCode);
}

export function getAgentDocumentationTemplate(): readonly AgentDocumentationSectionDefinition[] {
  return AGENT_DOCUMENTATION_TEMPLATE;
}

export function getAgentImplementationScopeEntry(
  id: string,
): AgentImplementationScopeEntry | undefined {
  return AGENT_IMPLEMENTATION_SCOPE.find((e) => e.id === id);
}
