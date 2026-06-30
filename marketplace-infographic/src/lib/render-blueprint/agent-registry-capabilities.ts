/**
 * Chapter 4.3 — Agent capability discovery catalog
 */
import type { AgentContractId } from "./agent-contracts";

export const AGENT_REGISTRY_VERSION = "4.3.0";

export const AGENT_REGISTRY_GOLDEN_RULE =
  "Agent Registry is the sole discovery mechanism for design agents. " +
  "If Pipeline can run an agent not in Registry or call an agent directly, the ecosystem is violated.";

/** Capability tags for plugin architecture discovery */
export const AGENT_CAPABILITY_TAGS: Partial<Record<AgentContractId, readonly string[]>> = {
  "product-analyzer": ["product-analysis", "category-detection"],
  "creative-engine": ["creative-direction", "marketplace-goal"],
  "visual-story-director": ["story-planning", "narrative-hook"],
  "scene-director": ["scene-planning", "environment-selection", "camera-layout"],
  "commercial-photo-director": ["photo-direction", "studio-setup"],
  "camera-director": ["camera-framing", "lens-selection"],
  "lighting-director": ["lighting-design", "shadow-control"],
  "material-director": ["material-finish", "surface-texture"],
  "vision-quality-director": ["blueprint-vision-compare", "generation-validation"],
  "composition-director": ["composition-layout", "hero-placement"],
  critics: ["photo-review", "realism-review", "lighting-review"],
  governance: ["constraint-governance"],
  "chief-design-director": ["chief-review", "rollback-decision"],
  "design-memory": ["pattern-learning", "knowledge-update", "memory-query"],
};

export function capabilityTagsForAgent(agentId: AgentContractId): string[] {
  return [...(AGENT_CAPABILITY_TAGS[agentId] ?? [`agent:${agentId}`])];
}
