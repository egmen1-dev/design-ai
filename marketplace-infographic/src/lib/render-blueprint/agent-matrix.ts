/**
 * Chapter 3.2 — Read / Write matrix
 */
import type { BlueprintSection } from "./types";
import type { AgentContractId } from "./agent-contracts";
import { BlueprintLifecycle } from "./lifecycle-types";

const ALL_SECTIONS: BlueprintSection[] = [
  "meta",
  "creative",
  "story",
  "product",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "background",
  "render",
  "constraints",
  "validation",
];

export const AGENT_READ_MATRIX: Record<AgentContractId, BlueprintSection[]> = {
  "product-analyzer": ["meta"],
  "creative-engine": ["product"],
  "visual-story-director": ["creative", "product"],
  "scene-director": ["story", "creative", "product"],
  "commercial-photo-director": ["story", "scene", "product"],
  "camera-director": ["story", "scene", "product", "photography"],
  "lighting-director": ["story", "scene", "product", "photography"],
  "material-director": ["story", "scene", "product", "photography"],
  "composition-director": ["story", "scene", "photography"],
  governance: ["composition", "story"],
  critics: ALL_SECTIONS,
  "chief-design-director": ["validation"],
  "design-memory": ALL_SECTIONS,
  "flux-adapter": ALL_SECTIONS,
  "vision-quality-director": ALL_SECTIONS,
};

export const AGENT_WRITE_MATRIX: Record<AgentContractId, BlueprintSection[]> = {
  "product-analyzer": ["product"],
  "creative-engine": ["creative"],
  "visual-story-director": ["story"],
  "scene-director": ["scene"],
  "commercial-photo-director": ["photography", "camera", "lighting", "materials"],
  "camera-director": ["camera"],
  "lighting-director": ["lighting"],
  "material-director": ["materials"],
  "composition-director": ["composition"],
  governance: ["constraints"],
  critics: [],
  "chief-design-director": [],
  "design-memory": [],
  "flux-adapter": [],
  "vision-quality-director": [],
};

export const AGENT_STAGE_MATRIX: Record<AgentContractId, BlueprintLifecycle> = {
  "product-analyzer": BlueprintLifecycle.PRODUCT_ANALYZED,
  "creative-engine": BlueprintLifecycle.CREATIVE_DEFINED,
  "visual-story-director": BlueprintLifecycle.STORY_DEFINED,
  "scene-director": BlueprintLifecycle.SCENE_DEFINED,
  "commercial-photo-director": BlueprintLifecycle.PHOTO_DEFINED,
  "camera-director": BlueprintLifecycle.PHOTO_DEFINED,
  "lighting-director": BlueprintLifecycle.PHOTO_DEFINED,
  "material-director": BlueprintLifecycle.PHOTO_DEFINED,
  "composition-director": BlueprintLifecycle.COMPOSITION_DEFINED,
  governance: BlueprintLifecycle.CONSTRAINTS_DEFINED,
  critics: BlueprintLifecycle.VALIDATED,
  "chief-design-director": BlueprintLifecycle.VALIDATED,
  "design-memory": BlueprintLifecycle.FINISHED,
  "flux-adapter": BlueprintLifecycle.FROZEN,
  "vision-quality-director": BlueprintLifecycle.RENDERING,
};

export function agentMayReadSection(agentId: AgentContractId, section: BlueprintSection): boolean {
  return AGENT_READ_MATRIX[agentId]?.includes(section) ?? false;
}

export function agentMayWriteSectionContract(
  agentId: AgentContractId,
  section: BlueprintSection,
): boolean {
  return AGENT_WRITE_MATRIX[agentId]?.includes(section) ?? false;
}

export function assertAgentReadAccess(agentId: AgentContractId, section: BlueprintSection): void {
  if (!agentMayReadSection(agentId, section)) {
    throw new Error(`Agent ${agentId} cannot read section ${section}`);
  }
}

export function assertAgentWriteAccess(agentId: AgentContractId, section: BlueprintSection): void {
  if (!agentMayWriteSectionContract(agentId, section)) {
    throw new Error(`CONTRACT_VIOLATION: agent ${agentId} cannot write section ${section}`);
  }
}

/** @deprecated Use AGENT_WRITE_MATRIX — kept for patch.ts compat */
export const AGENT_WRITE_PERMISSIONS: Record<string, BlueprintSection[]> = AGENT_WRITE_MATRIX;
