/**
 * Chapter 7.1 — Agent Design Philosophy engine.
 * Engineering manifest for how every Design AI intelligent agent must be designed.
 */
import type { AgentContractId } from "./agent-contracts";
import { AGENT_READ_MATRIX, AGENT_WRITE_MATRIX } from "./agent-matrix";
import {
  validateCommunicationProtocol,
  validateOwnershipUniqueness,
} from "./agent-communication-protocol-engine";
import { validateDesignKnowledgePhilosophy } from "./design-knowledge-philosophy-engine";
import { DesignPipelineStage, HIGH_LEVEL_PIPELINE } from "./design-pipeline-engine";
import { validateExplainabilityArchitecture } from "./explainability-architecture-engine";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { LightingStyle } from "./lighting-director-types";
import { StoryType } from "./visual-story-director-types";
import { EnvironmentType, SceneType } from "./scene-director-types";
import {
  AgentDesignPhilosophyPrincipleId,
  type AgentCooperationLink,
  type AgentDesignPhilosophyContext,
  type AgentDesignPhilosophyFailureCode,
  type AgentDesignPhilosophyPrincipleCheckResult,
  type AgentDesignPhilosophyPrincipleDefinition,
  type AgentDesignPhilosophyPrincipleIdValue,
  type AgentDesignPhilosophyReport,
  type AgentDesignPhilosophyViolation,
  type AgentProfessionalTrait,
  type BlueprintSectionOwnership,
  type HumanStudioRole,
} from "./agent-design-philosophy-types";

export {
  AgentDesignPhilosophyPrincipleId,
  type AgentDesignPhilosophyPrincipleIdValue,
  type AgentDesignPhilosophyPrincipleDefinition,
  type AgentProfessionalTrait,
  type HumanStudioRole,
  type BlueprintSectionOwnership,
  type AgentCooperationLink,
  type AgentDesignPhilosophyViolation,
  type AgentDesignPhilosophyPrincipleCheckResult,
  type AgentDesignPhilosophyReport,
  type AgentDesignPhilosophyContext,
  type AgentDesignPhilosophyFailureCode,
} from "./agent-design-philosophy-types";

export const AGENT_DESIGN_PHILOSOPHY_VERSION = "7.1.0";

export const AGENT_DESIGN_PHILOSOPHY_GOLDEN_RULE =
  "An AI agent is not a prompt. An AI agent is a digital professional with its own profession, " +
  "knowledge, responsibility, constraints, memory, and engineering discipline. " +
  "This philosophy turns Design AI Platform from an image generator into a full digital design studio " +
  "where dozens of professional specialists jointly create world-class commercially effective design.";

export const AGENT_DESIGN_PHILOSOPHY_STATEMENT =
  "Design AI models a real design agency — never one universal specialist. " +
  "Each agent is a digital professional with specialization, responsibility, knowledge, KPIs, " +
  "constraints, memory, and a decision system. Agents never exceed their competence.";

export const LEGACY_SINGLE_PROMPT_MODEL = ["user_request", "llm", "result"] as const;

export const HUMAN_STUDIO_PIPELINE: readonly HumanStudioRole[] = [
  { id: "marketer", label: "Marketer", strengthens: null },
  { id: "brand-strategist", label: "Brand Strategist", strengthens: "marketer" },
  { id: "art-director", label: "Art Director", strengthens: "brand-strategist" },
  { id: "photographer", label: "Photographer", strengthens: "art-director" },
  { id: "designer", label: "Designer", strengthens: "photographer" },
  { id: "retoucher", label: "Retoucher", strengthens: "designer" },
  { id: "creative-director", label: "Creative Director", strengthens: "retoucher" },
] as const;

export const AGENT_PROFESSIONAL_TRAITS: readonly AgentProfessionalTrait[] = [
  { id: "specialization", label: "Specialization", summary: "One competence domain per agent" },
  { id: "responsibility", label: "Responsibility", summary: "Owned blueprint sections and KPIs" },
  { id: "knowledge", label: "Knowledge", summary: "Domain expertise from Knowledge Engine" },
  { id: "constraints", label: "Constraints", summary: "Hard boundaries on decisions and writes" },
  { id: "memory", label: "Memory", summary: "Learning feedback without cross-run state" },
  { id: "decision-system", label: "Decision System", summary: "Structured reasoning — not prompt magic" },
] as const;

export const AGENT_OATH =
  "I make decisions only within my competence. I use only verified knowledge. " +
  "I explain every decision I make. I do not violate the Design Constitution. " +
  "I cooperate with other agents. I always prioritize commercial effectiveness over random creativity. " +
  "I deliver results I can justify.";

export const AGENT_DESIGN_PHILOSOPHY_PRINCIPLES: readonly AgentDesignPhilosophyPrincipleDefinition[] = [
  {
    id: AgentDesignPhilosophyPrincipleId.SPECIALIZATION,
    number: 1,
    title: "Principle Of Specialization",
    principle: "Maximum specialization — Story Director never designs lighting; Lighting Director never chooses Story.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.RESPONSIBILITY,
    number: 2,
    title: "Principle Of Responsibility",
    principle: "Each blueprint section has one owner. No other agent may directly modify that section.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.EXPLAINABILITY,
    number: 3,
    title: "Principle Of Explainability",
    principle: "Every decision must state what, why, which knowledge, which rules, and which constraints applied.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.KNOWLEDGE_DRIVEN_DESIGN,
    number: 4,
    title: "Principle Of Knowledge-Driven Design",
    principle: "LLM is a reasoning tool — Knowledge Engine, patterns, anti-patterns, and constitution are the source of truth.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.DETERMINISM,
    number: 5,
    title: "Principle Of Determinism",
    principle: "Identical inputs yield identical agent decisions — randomness must not affect planning.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.MINIMAL_AUTHORITY,
    number: 6,
    title: "Principle Of Minimal Authority",
    principle: "Agents receive only the context required for their task — never the full platform state.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.VALIDATION,
    number: 7,
    title: "Principle Of Validation",
    principle: "No agent may finish without self-checking blueprint, rules, constraints, and logical consistency.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.COOPERATION,
    number: 8,
    title: "Principle Of Cooperation",
    principle: "Agents do not compete — each subsequent agent strengthens the previous decision chain.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.ISOLATION,
    number: 9,
    title: "Principle Of Isolation",
    principle: "Agents interact only through Pipeline Context, Blueprint, Event Bus, and official contracts.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.CONTINUOUS_IMPROVEMENT,
    number: 10,
    title: "Principle Of Continuous Improvement",
    principle: "Every generation feeds vision, commercial, director, retry, and user feedback into Learning Engine.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.COMMERCIAL_THINKING,
    number: 11,
    title: "Principle Of Commercial Thinking",
    principle: "Every agent optimizes for CTR, trust, and conversion — not aesthetics alone.",
    immutable: true,
  },
  {
    id: AgentDesignPhilosophyPrincipleId.FUTURE_COMPATIBILITY,
    number: 12,
    title: "Principle Of Future Compatibility",
    principle: "Agents must survive LLM, knowledge, tool, provider, and marketplace changes without rewrite.",
    immutable: true,
  },
] as const;

export const BLUEPRINT_SECTION_OWNERSHIP: readonly BlueprintSectionOwnership[] = [
  { section: "story", ownerId: "visual-story-director", ownerLabel: "Story Director" },
  { section: "scene", ownerId: "scene-director", ownerLabel: "Scene Director" },
  { section: "composition", ownerId: "composition-director", ownerLabel: "Composition Director" },
  { section: "photography", ownerId: "commercial-photo-director", ownerLabel: "Photography Director" },
  { section: "lighting", ownerId: "lighting-director", ownerLabel: "Lighting Director" },
  { section: "camera", ownerId: "camera-director", ownerLabel: "Camera Director" },
  { section: "materials", ownerId: "material-director", ownerLabel: "Material Director" },
  { section: "product", ownerId: "product-analyzer", ownerLabel: "Product Analysis Agent" },
  { section: "creative", ownerId: "creative-engine", ownerLabel: "Creative Engine" },
] as const;

export const AGENT_COOPERATION_CHAIN: readonly AgentCooperationLink[] = [
  { agentId: "visual-story-director", label: "Story Director", strengthens: null },
  { agentId: "scene-director", label: "Scene Director", strengthens: "visual-story-director" },
  { agentId: "composition-director", label: "Composition Director", strengthens: "scene-director" },
  { agentId: "commercial-photo-director", label: "Photography Director", strengthens: "composition-director" },
  { agentId: "lighting-director", label: "Lighting Director", strengthens: "commercial-photo-director" },
  { agentId: "chief-design-director", label: "Chief Design Director", strengthens: "lighting-director" },
] as const;

const SPECIALIST_AGENTS: AgentContractId[] = [
  "visual-story-director",
  "scene-director",
  "composition-director",
  "commercial-photo-director",
  "lighting-director",
  "camera-director",
  "material-director",
  "chief-design-director",
];

function violation(
  code: AgentDesignPhilosophyFailureCode,
  message: string,
  principleId?: AgentDesignPhilosophyPrincipleIdValue,
  agentId?: string,
): AgentDesignPhilosophyViolation {
  return { code, message, principleId, agentId };
}

function principleResult(
  principleId: AgentDesignPhilosophyPrincipleIdValue,
  violations: AgentDesignPhilosophyViolation[],
): AgentDesignPhilosophyPrincipleCheckResult {
  return { principleId, passed: violations.length === 0, violations };
}

export function getAgentDesignPhilosophyPrinciple(
  principleId: AgentDesignPhilosophyPrincipleIdValue,
): AgentDesignPhilosophyPrincipleDefinition | undefined {
  return AGENT_DESIGN_PHILOSOPHY_PRINCIPLES.find((p) => p.id === principleId);
}

function philosophyBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.photography.photographyStyle = "premium_hero";
  bp.camera.cameraStyle = "product_hero";
  bp.materials.materialWorld = "premium_kitchen";
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  return bp;
}

export function validateHumanStudioModel(): boolean {
  if (HUMAN_STUDIO_PIPELINE.length !== 7) return false;
  for (let i = 1; i < HUMAN_STUDIO_PIPELINE.length; i++) {
    if (HUMAN_STUDIO_PIPELINE[i].strengthens !== HUMAN_STUDIO_PIPELINE[i - 1].id) return false;
  }
  return true;
}

export function validateAgentPhilosophySpecialization(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.SPECIALIZATION;
  const violations: AgentDesignPhilosophyViolation[] = [];

  if (context.superAgent || context.promptOnlyAgent) {
    violations.push(
      violation("SUPER_AGENT", "Universal prompt agent violates specialization principle", principleId),
    );
  }

  for (const agentId of SPECIALIST_AGENTS) {
    const writes = AGENT_WRITE_MATRIX[agentId] ?? [];
    if (agentId === "commercial-photo-director") continue;
    if (agentId === "chief-design-director" && writes.length === 0) continue;
    if (writes.length > 1) {
      violations.push(
        violation("SUPER_AGENT", `Agent ${agentId} spans multiple domains`, principleId, agentId),
      );
    }
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyResponsibility(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.RESPONSIBILITY;
  const violations: AgentDesignPhilosophyViolation[] = [];

  for (const v of validateOwnershipUniqueness()) {
    violations.push(violation("OWNERSHIP_VIOLATION", v.message, principleId));
  }

  for (const ownership of BLUEPRINT_SECTION_OWNERSHIP) {
    const writers = Object.entries(AGENT_WRITE_MATRIX).filter(([, sections]) =>
      sections.includes(ownership.section as import("./types").BlueprintSection),
    );
    const ownerWrites = writers.some(([id]) => id === ownership.ownerId);
    if (!ownerWrites && ownership.section !== "photography") {
      violations.push(
        violation(
          "OWNERSHIP_VIOLATION",
          `Owner ${ownership.ownerLabel} must write section ${ownership.section}`,
          principleId,
          ownership.ownerId,
        ),
      );
    }
  }

  if (context.mutateForeignBlueprint) {
    violations.push(
      violation("FOREIGN_BLUEPRINT_MUTATION", "Agent modified blueprint outside its ownership", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyExplainability(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.EXPLAINABILITY;
  const violations: AgentDesignPhilosophyViolation[] = [];

  const bp = philosophyBlueprint();
  const report = validateExplainabilityArchitecture(bp);
  if (!report.explainable) {
    violations.push(
      violation("BLACK_BOX_DECISION", "Agent decisions must remain explainable", principleId),
    );
  }

  if (context.blackBoxDecision) {
    violations.push(
      violation("BLACK_BOX_DECISION", "Magical decisions without trace are forbidden", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyKnowledgeDrivenDesign(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.KNOWLEDGE_DRIVEN_DESIGN;
  const violations: AgentDesignPhilosophyViolation[] = [];

  const knowledge = validateDesignKnowledgePhilosophy();
  if (!knowledge.valid) {
    violations.push(
      violation("LLM_ONLY_DECISION", "Knowledge Engine must ground agent decisions", principleId),
    );
  }

  if (context.llmOnlyDecision || context.promptOnlyAgent) {
    violations.push(
      violation("LLM_ONLY_DECISION", "LLM cannot be the source of design truth", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyDeterminism(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.DETERMINISM;
  const violations: AgentDesignPhilosophyViolation[] = [];

  if (context.nonDeterministic) {
    violations.push(
      violation("NON_DETERMINISTIC", "Agent decisions must be reproducible for identical inputs", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyMinimalAuthority(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.MINIMAL_AUTHORITY;
  const violations: AgentDesignPhilosophyViolation[] = [];

  for (const agentId of ["lighting-director", "camera-director", "material-director"] as AgentContractId[]) {
    const reads = AGENT_READ_MATRIX[agentId] ?? [];
    if (reads.length > 6) {
      violations.push(
        violation("EXCESSIVE_CONTEXT", `Agent ${agentId} reads too many blueprint sections`, principleId, agentId),
      );
    }
  }

  if (context.excessiveContext) {
    violations.push(
      violation("EXCESSIVE_CONTEXT", "Agent must receive minimal context for its task", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyValidation(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.VALIDATION;
  const violations: AgentDesignPhilosophyViolation[] = [];

  const validationStages = [
    DesignPipelineStage.CONSENSUS_VALIDATION,
    DesignPipelineStage.VISION_ANALYSIS,
    DesignPipelineStage.COMMERCIAL_VALIDATION,
    DesignPipelineStage.CHIEF_DESIGN_REVIEW,
  ];
  for (const stageId of validationStages) {
    if (!HIGH_LEVEL_PIPELINE.some((s) => s.id === stageId)) {
      violations.push(violation("MISSING_VALIDATION", `Validation stage ${stageId} required`, principleId));
    }
  }

  if (context.skipValidation) {
    violations.push(
      violation("MISSING_VALIDATION", "Agent cannot skip self validation before publishing", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyCooperation(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.COOPERATION;
  const violations: AgentDesignPhilosophyViolation[] = [];

  for (let i = 1; i < AGENT_COOPERATION_CHAIN.length; i++) {
    const link = AGENT_COOPERATION_CHAIN[i];
    const prev = AGENT_COOPERATION_CHAIN[i - 1];
    if (link.strengthens !== prev.agentId) {
      violations.push(
        violation("COOPERATION_BROKEN", "Agent cooperation chain must strengthen previous agent", principleId),
      );
      break;
    }
  }

  const storyOrder = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.VISUAL_STORY_PLANNING)?.order ?? -1;
  const sceneOrder = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.SCENE_PLANNING)?.order ?? -1;
  const compositionOrder =
    HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.COMPOSITION_PLANNING)?.order ?? -1;
  if (storyOrder < 0 || sceneOrder <= storyOrder || compositionOrder <= sceneOrder) {
    violations.push(
      violation("COOPERATION_BROKEN", "Creative agents must execute in strengthening pipeline order", principleId),
    );
  }

  if (context.directAgentCall) {
    violations.push(
      violation("COOPERATION_BROKEN", "Agents must cooperate through blueprint — not direct calls", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyIsolation(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.ISOLATION;
  const violations: AgentDesignPhilosophyViolation[] = [];

  const bp = philosophyBlueprint();
  const protocol = validateCommunicationProtocol(bp);
  if (!protocol.valid) {
    for (const v of protocol.violations) {
      violations.push(violation("DIRECT_AGENT_CALL", v.message, principleId));
    }
  }

  if (context.directAgentCall) {
    violations.push(
      violation("DIRECT_AGENT_CALL", "Direct agent-to-agent calls violate isolation", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyContinuousImprovement(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.CONTINUOUS_IMPROVEMENT;
  const violations: AgentDesignPhilosophyViolation[] = [];

  const learning = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.KNOWLEDGE_LEARNING);
  if (!learning) {
    violations.push(
      violation("LEARNING_SKIPPED", "Learning stage required for continuous agent improvement", principleId),
    );
  }

  if (context.skipLearning) {
    violations.push(
      violation("LEARNING_SKIPPED", "Agents must receive feedback through Learning Engine", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyCommercialThinking(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.COMMERCIAL_THINKING;
  const violations: AgentDesignPhilosophyViolation[] = [];

  const commercial = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.COMMERCIAL_VALIDATION);
  if (!commercial) {
    violations.push(
      violation("BEAUTY_WITHOUT_BUSINESS", "Commercial validation required for commercial thinking", principleId),
    );
  }

  if (context.beautyWithoutBusiness || context.promptOnlyAgent) {
    violations.push(
      violation("BEAUTY_WITHOUT_BUSINESS", "Aesthetics without commercial effectiveness violate agent philosophy", principleId),
    );
  }

  return principleResult(principleId, violations);
}

export function validateAgentPhilosophyFutureCompatibility(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const principleId = AgentDesignPhilosophyPrincipleId.FUTURE_COMPATIBILITY;
  const violations: AgentDesignPhilosophyViolation[] = [];

  if (context.llmLocked) {
    violations.push(
      violation("LLM_LOCK_IN", "Agent architecture must not depend on a specific LLM", principleId),
    );
  }

  return principleResult(principleId, violations);
}

const PRINCIPLE_VALIDATORS: Record<
  AgentDesignPhilosophyPrincipleIdValue,
  (ctx: AgentDesignPhilosophyContext) => AgentDesignPhilosophyPrincipleCheckResult
> = {
  [AgentDesignPhilosophyPrincipleId.SPECIALIZATION]: validateAgentPhilosophySpecialization,
  [AgentDesignPhilosophyPrincipleId.RESPONSIBILITY]: validateAgentPhilosophyResponsibility,
  [AgentDesignPhilosophyPrincipleId.EXPLAINABILITY]: validateAgentPhilosophyExplainability,
  [AgentDesignPhilosophyPrincipleId.KNOWLEDGE_DRIVEN_DESIGN]: validateAgentPhilosophyKnowledgeDrivenDesign,
  [AgentDesignPhilosophyPrincipleId.DETERMINISM]: validateAgentPhilosophyDeterminism,
  [AgentDesignPhilosophyPrincipleId.MINIMAL_AUTHORITY]: validateAgentPhilosophyMinimalAuthority,
  [AgentDesignPhilosophyPrincipleId.VALIDATION]: validateAgentPhilosophyValidation,
  [AgentDesignPhilosophyPrincipleId.COOPERATION]: validateAgentPhilosophyCooperation,
  [AgentDesignPhilosophyPrincipleId.ISOLATION]: validateAgentPhilosophyIsolation,
  [AgentDesignPhilosophyPrincipleId.CONTINUOUS_IMPROVEMENT]: validateAgentPhilosophyContinuousImprovement,
  [AgentDesignPhilosophyPrincipleId.COMMERCIAL_THINKING]: validateAgentPhilosophyCommercialThinking,
  [AgentDesignPhilosophyPrincipleId.FUTURE_COMPATIBILITY]: validateAgentPhilosophyFutureCompatibility,
};

export function validateAgentDesignPhilosophyPrinciple(
  principleId: AgentDesignPhilosophyPrincipleIdValue,
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyPrincipleCheckResult {
  const validator = PRINCIPLE_VALIDATORS[principleId];
  if (!validator) {
    return principleResult(principleId, [
      violation("PHILOSOPHY_INCOMPLETE", `No validator for principle ${principleId}`, principleId),
    ]);
  }
  return validator(context);
}

export function validateAgentDesignPhilosophy(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyReport {
  const principleResults = AGENT_DESIGN_PHILOSOPHY_PRINCIPLES.map((p) =>
    validateAgentDesignPhilosophyPrinciple(p.id, context),
  );
  const violations = principleResults.flatMap((r) => r.violations);
  const principlesPassed = principleResults.filter((r) => r.passed).length;

  return {
    valid: violations.length === 0,
    violations,
    principleResults,
    principlesPassed,
    principlesTotal: AGENT_DESIGN_PHILOSOPHY_PRINCIPLES.length,
    philosophySatisfied: violations.length === 0,
    goldenRuleSatisfied: AGENT_DESIGN_PHILOSOPHY_GOLDEN_RULE.includes("digital professional"),
    architectureStatementValid: AGENT_DESIGN_PHILOSOPHY_STATEMENT.includes("design agency"),
    agentOathValid: AGENT_OATH.includes("verified knowledge"),
    humanStudioModelValid: validateHumanStudioModel(),
    successCriteriaMet: violations.length === 0 && validateHumanStudioModel(),
  };
}

export function assertAgentDesignPhilosophy(
  context?: AgentDesignPhilosophyContext,
): AgentDesignPhilosophyReport {
  const report = validateAgentDesignPhilosophy(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Agent Design Philosophy violated: ${messages}`);
  }
  return report;
}

export function runAgentDesignPhilosophy(
  context: AgentDesignPhilosophyContext = {},
): AgentDesignPhilosophyReport {
  return validateAgentDesignPhilosophy(context);
}

export function isAgentDesignPhilosophyFailure(
  code: string,
): code is AgentDesignPhilosophyFailureCode {
  const codes: AgentDesignPhilosophyFailureCode[] = [
    "SUPER_AGENT",
    "PROMPT_ONLY_AGENT",
    "FOREIGN_BLUEPRINT_MUTATION",
    "BLACK_BOX_DECISION",
    "LLM_ONLY_DECISION",
    "NON_DETERMINISTIC",
    "EXCESSIVE_CONTEXT",
    "MISSING_VALIDATION",
    "DIRECT_AGENT_CALL",
    "LEARNING_SKIPPED",
    "BEAUTY_WITHOUT_BUSINESS",
    "LLM_LOCK_IN",
    "OWNERSHIP_VIOLATION",
    "COOPERATION_BROKEN",
    "PHILOSOPHY_INCOMPLETE",
  ];
  return codes.includes(code as AgentDesignPhilosophyFailureCode);
}
