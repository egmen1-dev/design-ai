/**
 * Chapter 4.1 — Universal Agent Contract types
 */
import type { BlueprintMutation } from "./mutation-types";
import type { BlueprintSnapshot } from "./snapshot-types";
import type { BlueprintSection, RenderBlueprint } from "./types";

/** Chapter 4.1 — agent category (maps to Agent Ecosystem) */
export const AgentCategory = {
  CREATIVE_DIRECTOR: "CREATIVE_DIRECTOR",
  TECHNICAL_DIRECTOR: "TECHNICAL_DIRECTOR",
  CRITIC: "CRITIC",
  ORCHESTRATOR: "ORCHESTRATOR",
  LEARNING: "LEARNING",
} as const;

export type AgentCategoryId = (typeof AgentCategory)[keyof typeof AgentCategory];

export type PipelineConfig = {
  pipelineId: string;
  marketplace: string;
  debug: boolean;
  seed?: number;
};

/** All inputs passed through unified context — extensions via new fields only (Ch 4.6) */
export type AgentContext = {
  blueprint: Readonly<RenderBlueprint>;
  snapshot?: Readonly<BlueprintSnapshot>;
  configuration: import("./agent-discovery-types").PipelineConfiguration;
  diagnostics: import("./agent-context-types").AgentDiagnosticContext;
  runtime: Readonly<import("./agent-context-types").RuntimeContext>;
  /** Ch 4.1 bridge — pipeline identity and debug flags */
  config: PipelineConfig;
};

export type AgentRecommendation = {
  kind: string;
  reason: string;
  /** Normalized confidence 0.0..1.0 */
  confidence: number;
  targetSection?: BlueprintSection;
};

export type AgentDiagnostics = {
  executionTimeMs: number;
  inputHash: string;
  outputHash: string;
  /** Normalized confidence 0.0..1.0 */
  confidence: number;
  version: string;
  consumedSections: BlueprintSection[];
  producedSections: BlueprintSection[];
  decisionTrace: string[];
};

/**
 * Universal agent result — never contains a full blueprint.
 * Mutations are applied by Mutation Engine after validation.
 */
export type UniversalAgentResult = {
  approved: boolean;
  /** Normalized confidence 0.0..1.0 */
  confidence: number;
  mutations: BlueprintMutation[];
  diagnostics: AgentDiagnostics;
  recommendations: AgentRecommendation[];
};

/** Chapter 4.1 — Universal BlueprintAgent interface */
export type UniversalBlueprintAgent = {
  readonly id: string;
  readonly version: string;
  readonly category: AgentCategoryId;
  readonly produces: readonly BlueprintSection[];
  readonly consumes: readonly BlueprintSection[];
  canExecute(context: AgentContext): boolean;
  execute(context: AgentContext): Promise<UniversalAgentResult>;
};

export type UniversalContractViolation = {
  code: string;
  message: string;
  severity: "fatal" | "error" | "warning";
};

export type UniversalContractReport = {
  valid: boolean;
  agentId: string;
  violations: UniversalContractViolation[];
};

export type LegacyAgentAdapterOptions<TInput> = {
  category: AgentCategoryId;
  consumes: readonly BlueprintSection[];
  produces: readonly BlueprintSection[];
  buildInput: (context: AgentContext) => TInput;
};
