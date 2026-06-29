/**
 * Chapter 4.1 — Legacy agent bridge and mutation builders
 */
import type {
  AgentResultBase,
  AgentSectionUpdates,
  BlueprintAgent,
} from "./agent-contracts";
import type { BlueprintMutation } from "./mutation-types";
import { hashValue } from "./section-hash";
import type { BlueprintSection } from "./types";
import {
  denormalizeConfidence,
  normalizeConfidence,
} from "./universal-agent-contract";
import type {
  AgentContext,
  AgentDiagnostics,
  AgentRecommendation,
  LegacyAgentAdapterOptions,
  UniversalAgentResult,
  UniversalBlueprintAgent,
} from "./universal-agent-contract-types";

export function updatesToMutations(
  updates: AgentSectionUpdates,
  producer: string,
  expectedRevision: number,
  reason: string,
): BlueprintMutation[] {
  const now = Date.now();
  const mutations: BlueprintMutation[] = [];
  for (const [section, payload] of Object.entries(updates)) {
    if (payload === undefined) continue;
    mutations.push({
      section: section as BlueprintSection,
      producer,
      expectedRevision,
      payload,
      reason,
      timestamp: now,
    });
  }
  return mutations;
}

export function buildAgentDiagnostics(input: {
  version: string;
  confidence: number;
  executionTimeMs: number;
  inputHash: string;
  outputHash: string;
  consumedSections: readonly BlueprintSection[];
  producedSections: readonly BlueprintSection[];
  decisionTrace: string[];
}): AgentDiagnostics {
  return {
    version: input.version,
    confidence: normalizeConfidence(input.confidence),
    executionTimeMs: input.executionTimeMs,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    consumedSections: [...input.consumedSections],
    producedSections: [...input.producedSections],
    decisionTrace: [...input.decisionTrace],
  };
}

export function legacyResultToUniversal(input: {
  agent: UniversalBlueprintAgent;
  legacy: AgentResultBase;
  updates: AgentSectionUpdates;
  context: AgentContext;
  executionTimeMs: number;
}): UniversalAgentResult {
  const reason =
    input.legacy.decisionTrace.join("; ") || `Agent ${input.agent.id} decision`;
  const mutations = updatesToMutations(
    input.updates,
    input.agent.id,
    input.context.blueprint.meta.revision ?? 0,
    reason,
  );
  const inputHash = hashValue(
    input.agent.consumes.map((s) => (input.context.blueprint as Record<string, unknown>)[s]),
  );
  const outputHash = hashValue(mutations.map((m) => m.payload));

  const recommendations: AgentRecommendation[] = [];
  if (input.legacy.retryAdvice?.required) {
    recommendations.push({
      kind: "retry",
      reason: input.legacy.retryAdvice.reason,
      confidence: normalizeConfidence(input.legacy.confidence),
      targetSection: input.agent.produces[0],
    });
  }

  const hasFatal = input.legacy.errors?.some((e) => e.kind === "fatal");
  const approved = !hasFatal && mutations.length >= 0;

  return {
    approved,
    confidence: normalizeConfidence(input.legacy.confidence),
    mutations,
    diagnostics: buildAgentDiagnostics({
      version: input.agent.version,
      confidence: input.legacy.confidence,
      executionTimeMs: input.executionTimeMs,
      inputHash,
      outputHash,
      consumedSections: input.agent.consumes,
      producedSections: input.agent.produces,
      decisionTrace: input.legacy.decisionTrace,
    }),
    recommendations,
  };
}

/**
 * Wrap Chapter 3.2 BlueprintAgent as Chapter 4.1 UniversalBlueprintAgent.
 * Lifecycle can use either contract without changing core engines.
 */
export function wrapLegacyBlueprintAgent<TInput, TResult extends AgentResultBase>(
  agent: BlueprintAgent<TInput, TResult>,
  options: LegacyAgentAdapterOptions<TInput>,
): UniversalBlueprintAgent {
  return {
    id: agent.id,
    version: agent.version,
    category: options.category,
    produces: options.produces,
    consumes: options.consumes,
    canExecute(context) {
      try {
        return agent.canExecute(context.blueprint as import("./types").RenderBlueprint);
      } catch {
        return false;
      }
    },
    async execute(context) {
      const started = Date.now();
      const input = options.buildInput(context);
      const frozen = Object.freeze(structuredClone(context.blueprint)) as import("./types").RenderBlueprint;
      const legacy = await agent.execute(frozen, input);
      const updates = agent.toUpdates(legacy);
      const universal = this as UniversalBlueprintAgent;
      return legacyResultToUniversal({
        agent: universal,
        legacy,
        updates,
        context,
        executionTimeMs: Date.now() - started,
      });
    },
  };
}

/** Convert universal result back to legacy confidence scale for Ch 3.2 engines */
export function universalToLegacyConfidence(result: UniversalAgentResult): number {
  return denormalizeConfidence(result.confidence);
}
