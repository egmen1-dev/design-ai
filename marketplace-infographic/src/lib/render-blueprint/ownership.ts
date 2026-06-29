import type { BlueprintSection } from "./types";

/** Chapter 3 — ответственность агентов */
export const AGENT_WRITE_PERMISSIONS: Record<string, BlueprintSection[]> = {
  "product-analyzer": ["product"],
  "visual-story-director": ["creative", "story"],
  "scene-director": ["scene"],
  "commercial-photo-director": ["photography"],
  "camera-director": ["camera"],
  "lighting-director": ["lighting"],
  "material-director": ["materials"],
  "composition-director": ["composition"],
  governance: ["constraints"],
  "chief-design-director": ["validation"],
  system: ["meta", "background", "render"],
  "flux-adapter": [],
};

export function agentMayWriteSection(agentId: string, section: BlueprintSection): boolean {
  const allowed = AGENT_WRITE_PERMISSIONS[agentId];
  if (!allowed) return false;
  return allowed.includes(section);
}

export function assertAgentOwnsSection(agentId: string, section: BlueprintSection): void {
  if (agentId === "flux-adapter") {
    throw new Error(`CONSTITUTION_V18: flux-adapter is read-only`);
  }
  if (!agentMayWriteSection(agentId, section)) {
    throw new Error(
      `CONSTITUTION_V18_SECTION_VIOLATION: agent ${agentId} cannot write section ${section}`,
    );
  }
}
