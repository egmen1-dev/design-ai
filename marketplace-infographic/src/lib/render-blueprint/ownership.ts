import type { BlueprintSection } from "./types";
import {
  AGENT_WRITE_MATRIX,
  agentMayWriteSectionContract,
  type AgentContractId,
} from "./agent-matrix";

/** @deprecated Chapter 3.2 — use AGENT_WRITE_MATRIX */
export const AGENT_WRITE_PERMISSIONS: Record<string, BlueprintSection[]> = AGENT_WRITE_MATRIX;

export function agentMayWriteSection(agentId: string, section: BlueprintSection): boolean {
  if (!(agentId in AGENT_WRITE_MATRIX)) return false;
  return agentMayWriteSectionContract(agentId as AgentContractId, section);
}

export function assertAgentOwnsSection(agentId: string, section: BlueprintSection): void {
  if (!agentMayWriteSection(agentId, section)) {
    throw new Error(
      `CONSTITUTION_V18_SECTION_VIOLATION: agent ${agentId} cannot write section ${section}`,
    );
  }
}
