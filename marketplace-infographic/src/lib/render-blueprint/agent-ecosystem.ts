/**
 * Chapter 4 — Agent Ecosystem
 * Principles, categories, and agent taxonomy for Design AI.
 */
import type { AgentContractId } from "./agent-contracts";
import {
  AgentEcosystemCategory,
  AgentPrinciple,
  type AgentCategoryDefinition,
  type AgentEcosystemCategoryId,
  type AgentPrincipleDefinition,
  type AgentPrincipleId,
} from "./agent-ecosystem-types";

export {
  AgentPrinciple,
  AgentEcosystemCategory,
  type AgentPrincipleId,
  type AgentEcosystemCategoryId,
  type AgentPrincipleDefinition,
  type AgentCategoryDefinition,
  type AgentEcosystemViolation,
  type AgentDecisionRecord,
  type AgentEcosystemValidationReport,
  type AgentEcosystemValidationContext,
  type AgentEcosystemValidatorOptions,
} from "./agent-ecosystem-types";

export const AGENT_ECOSYSTEM_VERSION = "4.0.0";

export const AGENT_ECOSYSTEM_GOLDEN_RULE =
  "An agent is not a prompt generator — it is a professional specialist that makes one design decision, records it in RenderBlueprint, and yields control to the next pipeline stage.";

/** Nine mandatory agent principles (Chapter 4) */
export const AGENT_PRINCIPLES: readonly AgentPrincipleDefinition[] = [
  {
    id: AgentPrinciple.SINGLE_RESPONSIBILITY,
    name: "Single Responsibility",
    summary: "One agent owns one decision domain (story, scene, lighting, etc.).",
  },
  {
    id: AgentPrinciple.STATELESS,
    name: "Stateless",
    summary: "No internal state between generations — all state lives in RenderBlueprint.",
  },
  {
    id: AgentPrinciple.DETERMINISTIC_INTENT,
    name: "Deterministic Intent",
    summary: "Same blueprint and agent version yields the same decision.",
  },
  {
    id: AgentPrinciple.BLUEPRINT_DRIVEN,
    name: "Blueprint Driven",
    summary: "Decisions based exclusively on RenderBlueprint — no external data lookup.",
  },
  {
    id: AgentPrinciple.EXPLAINABLE_DECISION,
    name: "Explainable Decision",
    summary: "Every decision includes why, which sections, constraints, and confidence.",
  },
  {
    id: AgentPrinciple.NO_DIRECT_COMMUNICATION,
    name: "No Direct Communication",
    summary: "Agents interact only through RenderBlueprint and Lifecycle Manager.",
  },
  {
    id: AgentPrinciple.PROVIDER_INDEPENDENCE,
    name: "Provider Independence",
    summary: "Agents never know FLUX, GPT Image, SDXL, or Pollinations.",
  },
  {
    id: AgentPrinciple.QUALITY_FIRST,
    name: "Quality First",
    summary: "Speed optimization must not degrade design decision quality.",
  },
  {
    id: AgentPrinciple.CONTRACT_BASED,
    name: "Contract Based",
    summary: "Lifecycle Manager interacts only through the unified Agent Contract.",
  },
] as const;

export const AGENT_PRINCIPLE_IDS: AgentPrincipleId[] = AGENT_PRINCIPLES.map((p) => p.id);

/** Five agent categories (Chapter 4) */
export const AGENT_CATEGORIES: readonly AgentCategoryDefinition[] = [
  {
    id: AgentEcosystemCategory.CREATIVE_DIRECTOR,
    name: "Creative Directors",
    summary: "Commercial and narrative design decisions.",
    responsibility: "Story, scene mood, creative direction, visual narrative.",
  },
  {
    id: AgentEcosystemCategory.TECHNICAL_DIRECTOR,
    name: "Technical Directors",
    summary: "Photographic and compositional technical decisions.",
    responsibility: "Camera, lighting, materials, composition, product analysis.",
  },
  {
    id: AgentEcosystemCategory.CRITIC,
    name: "Critics",
    summary: "Quality review without blueprint mutation.",
    responsibility: "Evaluate blueprint sections and report issues.",
  },
  {
    id: AgentEcosystemCategory.ORCHESTRATOR,
    name: "Orchestrators",
    summary: "Governance, constraints, and chief review.",
    responsibility: "Constraints, rollback decisions, pipeline governance.",
  },
  {
    id: AgentEcosystemCategory.LEARNING_AGENT,
    name: "Learning Agents",
    summary: "Design memory and regression learning (future).",
    responsibility: "Capture patterns for design memory — no direct mutation.",
  },
] as const;

/** Chapter 4 category assignment per registered agent */
export const AGENT_CATEGORY_MAP: Record<AgentContractId, AgentEcosystemCategoryId | null> = {
  "creative-engine": AgentEcosystemCategory.CREATIVE_DIRECTOR,
  "visual-story-director": AgentEcosystemCategory.CREATIVE_DIRECTOR,
  "scene-director": AgentEcosystemCategory.CREATIVE_DIRECTOR,
  "commercial-photo-director": AgentEcosystemCategory.CREATIVE_DIRECTOR,
  "product-analyzer": AgentEcosystemCategory.TECHNICAL_DIRECTOR,
  "camera-director": AgentEcosystemCategory.TECHNICAL_DIRECTOR,
  "lighting-director": AgentEcosystemCategory.TECHNICAL_DIRECTOR,
  "material-director": AgentEcosystemCategory.TECHNICAL_DIRECTOR,
  "composition-director": AgentEcosystemCategory.TECHNICAL_DIRECTOR,
  critics: AgentEcosystemCategory.CRITIC,
  governance: AgentEcosystemCategory.ORCHESTRATOR,
  "chief-design-director": AgentEcosystemCategory.ORCHESTRATOR,
  "flux-adapter": null,
};

export function getAgentCategory(agentId: AgentContractId): AgentEcosystemCategoryId | null {
  return AGENT_CATEGORY_MAP[agentId] ?? null;
}

export function agentsInCategory(category: AgentEcosystemCategoryId): AgentContractId[] {
  return (Object.entries(AGENT_CATEGORY_MAP) as [AgentContractId, AgentEcosystemCategoryId | null][])
    .filter(([, cat]) => cat === category)
    .map(([id]) => id);
}

export function getPrincipleDefinition(id: AgentPrincipleId): AgentPrincipleDefinition | undefined {
  return AGENT_PRINCIPLES.find((p) => p.id === id);
}

export function getCategoryDefinition(
  id: AgentEcosystemCategoryId,
): AgentCategoryDefinition | undefined {
  return AGENT_CATEGORIES.find((c) => c.id === id);
}

export function isDesignAgent(agentId: AgentContractId): boolean {
  return getAgentCategory(agentId) !== null;
}
