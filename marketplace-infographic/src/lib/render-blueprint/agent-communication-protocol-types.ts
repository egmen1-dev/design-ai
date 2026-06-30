/**
 * Chapter 4.21 — Agent Communication Protocol types
 */
import type { AgentContractId, AgentResultBase } from "./agent-contracts";
import type { BlueprintSection } from "./types";

export const CommunicationPrinciple = {
  IMMUTABLE: "immutable",
  STRUCTURED: "structured",
  VERSIONED: "versioned",
  EXPLAINABLE: "explainable",
  INDEPENDENT: "independent",
} as const;

export type CommunicationPrincipleId =
  (typeof CommunicationPrinciple)[keyof typeof CommunicationPrinciple];

export type SectionOwnership = {
  section: BlueprintSection;
  owner: AgentContractId;
  readers: AgentContractId[];
};

export type SectionVersionRecord = {
  section: BlueprintSection;
  owner: AgentContractId;
  version: number;
  publishedAt: number;
  immutable: boolean;
  explanation?: string;
};

export type AgentPublication = {
  agentId: AgentContractId;
  sections: BlueprintSection[];
  version: number;
  publishedAt: number;
  decisionTrace: string[];
  confidence: number;
};

export type DirectCallAttempt = {
  from: AgentContractId;
  to: AgentContractId;
  method?: string;
};

export type CommunicationViolation = {
  code:
    | "DIRECT_AGENT_CALL"
    | "FOREIGN_SECTION_WRITE"
    | "UNAUTHORIZED_READ"
    | "UNSTRUCTURED_TEXT"
    | "PROMPT_SEMANTICS"
    | "MISSING_VERSION"
    | "IMMUTABLE_SECTION_MUTATION"
    | "MISSING_EXPLANATION"
    | "OWNERSHIP_CONFLICT"
    | "ERROR_NOT_ISOLATED"
    | "PRINCIPLE_VIOLATION";
  principle: CommunicationPrincipleId;
  message: string;
  agentId?: AgentContractId;
  section?: BlueprintSection;
};

export type CommunicationProtocolReport = {
  valid: boolean;
  violations: CommunicationViolation[];
  principles: Record<CommunicationPrincipleId, boolean>;
  ownership: SectionOwnership[];
  versionHistory: SectionVersionRecord[];
  model: "agent-section-blueprint-next-agent";
};

export type CommunicationValidationContext = {
  agentId: AgentContractId;
  result?: AgentResultBase;
  mutationSections?: BlueprintSection[];
  directCalls?: DirectCallAttempt[];
  failedSection?: BlueprintSection;
  corruptedSections?: BlueprintSection[];
};

export type CommunicationFailureCode = CommunicationViolation["code"];
