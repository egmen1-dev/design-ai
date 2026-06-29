/**
 * Chapter 4 — Agent Ecosystem validator
 * Enforces agent principles before/after agent execution.
 */
import type { AgentContractId, AgentResultBase, BlueprintAgent } from "./agent-contracts";
import { assertAgentConfidence } from "./agent-contracts";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { scanAgentTextForBannedTokens } from "./constitution";
import type { BlueprintSection } from "./types";
import {
  AGENT_PRINCIPLE_IDS,
  AGENT_PRINCIPLES,
  AgentEcosystemCategory,
  AgentPrinciple,
  getAgentCategory,
} from "./agent-ecosystem";
import type {
  AgentDecisionRecord,
  AgentEcosystemCategoryId,
  AgentEcosystemValidationContext,
  AgentEcosystemValidationReport,
  AgentEcosystemValidatorOptions,
  AgentEcosystemViolation,
  AgentPrincipleId,
} from "./agent-ecosystem-types";

export class AgentEcosystemError extends Error {
  readonly report: AgentEcosystemValidationReport;

  constructor(report: AgentEcosystemValidationReport) {
    const summary = report.violations.map((v) => `[${v.principle}] ${v.message}`).join("; ");
    super(`Agent ecosystem violation (${report.agentId}): ${summary}`);
    this.name = "AgentEcosystemError";
    this.report = report;
  }
}

const PROVIDER_TOKENS =
  /\b(flux|sdxl|gpt[\s-]?image|pollinations|dall[\s-]?e|midjourney|stable\s*diffusion|seedream)\b/i;

function violation(
  principle: AgentPrincipleId,
  message: string,
  agentId: AgentContractId,
  severity: AgentEcosystemViolation["severity"] = "fatal",
  evidence?: string,
): AgentEcosystemViolation {
  return { principle, severity, message, agentId, evidence };
}

function checkContractBased(
  agent: BlueprintAgent<unknown, AgentResultBase>,
): AgentEcosystemViolation[] {
  const issues: AgentEcosystemViolation[] = [];
  if (!agent.id || !agent.version || !agent.stage) {
    issues.push(
      violation(
        AgentPrinciple.CONTRACT_BASED,
        "Agent missing id, version, or stage on contract",
        agent.id ?? ("unknown" as AgentContractId),
      ),
    );
  }
  if (typeof agent.canExecute !== "function" || typeof agent.execute !== "function") {
    issues.push(
      violation(
        AgentPrinciple.CONTRACT_BASED,
        "Agent must implement canExecute and execute",
        agent.id,
      ),
    );
  }
  if (typeof agent.toUpdates !== "function") {
    issues.push(
      violation(
        AgentPrinciple.CONTRACT_BASED,
        "Agent must implement toUpdates — direct mutation forbidden",
        agent.id,
      ),
    );
  }
  return issues;
}

function checkSingleResponsibility(
  agentId: AgentContractId,
  sectionsWritten?: BlueprintSection[],
): AgentEcosystemViolation[] {
  const allowed = AGENT_WRITE_MATRIX[agentId as keyof typeof AGENT_WRITE_MATRIX] ?? [];
  if (!sectionsWritten?.length) return [];
  const issues: AgentEcosystemViolation[] = [];
  for (const section of sectionsWritten) {
    if (!allowed.includes(section)) {
      issues.push(
        violation(
          AgentPrinciple.SINGLE_RESPONSIBILITY,
          `Agent ${agentId} attempted to write section ${section} outside its domain`,
          agentId,
          "fatal",
          section,
        ),
      );
    }
  }
  return issues;
}

function checkStateless(
  agentId: AgentContractId,
  retainedState?: boolean,
): AgentEcosystemViolation[] {
  if (!retainedState) return [];
  return [
    violation(
      AgentPrinciple.STATELESS,
      `Agent ${agentId} retained internal state after execution`,
      agentId,
    ),
  ];
}

function checkDeterministicIntent(
  agentId: AgentContractId,
  nonDeterministic?: boolean,
): AgentEcosystemViolation[] {
  if (!nonDeterministic) return [];
  return [
    violation(
      AgentPrinciple.DETERMINISTIC_INTENT,
      `Agent ${agentId} produced different decisions for identical blueprint`,
      agentId,
    ),
  ];
}

function checkBlueprintDriven(
  agentId: AgentContractId,
  externalDataAccess?: string,
): AgentEcosystemViolation[] {
  if (!externalDataAccess) return [];
  return [
    violation(
      AgentPrinciple.BLUEPRINT_DRIVEN,
      `Agent ${agentId} accessed external data: ${externalDataAccess}`,
      agentId,
      "fatal",
      externalDataAccess,
    ),
  ];
}

function checkExplainableDecision(
  agentId: AgentContractId,
  result: AgentResultBase | undefined,
  options: AgentEcosystemValidatorOptions,
): AgentEcosystemViolation[] {
  if (!result) return [];
  const issues: AgentEcosystemViolation[] = [];
  const requireTrace = options.requireDecisionTrace ?? true;

  if (requireTrace && (!result.decisionTrace?.length || !result.decisionTrace.some((t) => t.trim()))) {
    issues.push(
      violation(
        AgentPrinciple.EXPLAINABLE_DECISION,
        `Agent ${agentId} result lacks decisionTrace explanation`,
        agentId,
        "error",
      ),
    );
  }

  const minConfidence = options.minConfidence ?? 0;
  try {
    assertAgentConfidence(result.confidence, agentId);
    if (result.confidence < minConfidence) {
      issues.push(
        violation(
          AgentPrinciple.QUALITY_FIRST,
          `Agent ${agentId} confidence ${result.confidence} below minimum ${minConfidence}`,
          agentId,
          "warning",
        ),
      );
    }
  } catch {
    issues.push(
      violation(
        AgentPrinciple.EXPLAINABLE_DECISION,
        `Agent ${agentId} returned invalid confidence`,
        agentId,
        "fatal",
      ),
    );
  }
  return issues;
}

function checkNoDirectCommunication(
  agentId: AgentContractId,
  crossAgentCall?: { target: AgentContractId },
): AgentEcosystemViolation[] {
  if (!crossAgentCall) return [];
  return [
    violation(
      AgentPrinciple.NO_DIRECT_COMMUNICATION,
      `Agent ${agentId} directly invoked agent ${crossAgentCall.target}`,
      agentId,
      "fatal",
      crossAgentCall.target,
    ),
  ];
}

function checkProviderIndependence(
  agentId: AgentContractId,
  result: AgentResultBase | undefined,
  providerReference?: string,
): AgentEcosystemViolation[] {
  const issues: AgentEcosystemViolation[] = [];
  if (providerReference) {
    issues.push(
      violation(
        AgentPrinciple.PROVIDER_INDEPENDENCE,
        `Agent ${agentId} referenced provider: ${providerReference}`,
        agentId,
        "fatal",
        providerReference,
      ),
    );
  }
  if (result) {
    const texts = [
      ...result.decisionTrace,
      ...result.warnings,
      ...(result.errors?.map((e) => e.message) ?? []),
    ];
    for (const text of texts) {
      const banned = scanAgentTextForBannedTokens(text, agentId);
      for (const b of banned) {
        issues.push(
          violation(
            AgentPrinciple.PROVIDER_INDEPENDENCE,
            b.message,
            agentId,
            "fatal",
            text,
          ),
        );
      }
      const providerMatch = text.match(PROVIDER_TOKENS);
      if (providerMatch) {
        issues.push(
          violation(
            AgentPrinciple.PROVIDER_INDEPENDENCE,
            `Agent ${agentId} emitted provider token "${providerMatch[0]}"`,
            agentId,
            "fatal",
            providerMatch[0],
          ),
        );
      }
    }
  }
  return issues;
}

function checkQualityFirst(
  agentId: AgentContractId,
  result: AgentResultBase | undefined,
): AgentEcosystemViolation[] {
  if (!result?.errors?.length) return [];
  const fatals = result.errors.filter((e) => e.kind === "fatal");
  if (!fatals.length) return [];
  return fatals.map((e) =>
    violation(
      AgentPrinciple.QUALITY_FIRST,
      `Agent ${agentId} reported fatal quality issue: ${e.message}`,
      agentId,
      "error",
      e.code,
    ),
  );
}

function buildReport(
  agentId: AgentContractId,
  category: AgentEcosystemCategoryId | null,
  violations: AgentEcosystemViolation[],
): AgentEcosystemValidationReport {
  const failed = [...new Set(violations.map((v) => v.principle))];
  const passed = AGENT_PRINCIPLE_IDS.filter((id) => !failed.includes(id));
  const blocking = violations.filter((v) => v.severity === "fatal" || v.severity === "error");
  return {
    valid: blocking.length === 0,
    agentId,
    category: category ?? ("creative_director" as AgentEcosystemCategoryId),
    principleCount: AGENT_PRINCIPLES.length,
    violations,
    passed,
    failed,
  };
}

export function validateAgentEcosystem(
  ctx: AgentEcosystemValidationContext,
  options: AgentEcosystemValidatorOptions = {},
): AgentEcosystemValidationReport {
  const { agent, result, sectionsWritten } = ctx;
  const category = getAgentCategory(agent.id);

  if (category === null) {
    return buildReport(agent.id, null, [
      violation(
        AgentPrinciple.CONTRACT_BASED,
        `Agent ${agent.id} is not a design agent (adapter excluded from ecosystem)`,
        agent.id,
        "warning",
      ),
    ]);
  }

  const violations: AgentEcosystemViolation[] = [
    ...checkContractBased(agent),
    ...checkSingleResponsibility(agent.id, sectionsWritten),
    ...checkStateless(agent.id, ctx.retainedState),
    ...checkDeterministicIntent(agent.id, ctx.nonDeterministic),
    ...checkBlueprintDriven(agent.id, ctx.externalDataAccess),
    ...checkExplainableDecision(agent.id, result, options),
    ...checkNoDirectCommunication(agent.id, ctx.crossAgentCall),
    ...checkProviderIndependence(agent.id, result, ctx.providerReference),
    ...checkQualityFirst(agent.id, result),
  ];

  return buildReport(agent.id, category, violations);
}

export function assertAgentEcosystem(
  ctx: AgentEcosystemValidationContext,
  options?: AgentEcosystemValidatorOptions,
): AgentEcosystemValidationReport {
  const report = validateAgentEcosystem(ctx, options);
  if (!report.valid) {
    throw new AgentEcosystemError(report);
  }
  return report;
}

/** Build explainable decision record from agent result */
export function recordAgentDecision(input: {
  agentId: AgentContractId;
  result: AgentResultBase;
  sectionsUsed: BlueprintSection[];
  constraintsConsidered?: string[];
  reason?: string;
}): AgentDecisionRecord {
  const category = getAgentCategory(input.agentId);
  if (!category) {
    throw new AgentEcosystemError({
      valid: false,
      agentId: input.agentId,
      category: AgentEcosystemCategory.CREATIVE_DIRECTOR,
      principleCount: AGENT_PRINCIPLES.length,
      violations: [
        violation(
          AgentPrinciple.CONTRACT_BASED,
          `Cannot record decision for non-design agent ${input.agentId}`,
          input.agentId,
        ),
      ],
      passed: [],
      failed: [AgentPrinciple.CONTRACT_BASED],
    });
  }

  return {
    agentId: input.agentId,
    category,
    confidence: input.result.confidence,
    decisionTrace: input.result.decisionTrace,
    sectionsUsed: input.sectionsUsed,
    constraintsConsidered: input.constraintsConsidered ?? [],
    reason: input.reason ?? input.result.decisionTrace.join("; "),
    executedAt: Date.now(),
  };
}

export class AgentEcosystemValidator {
  private readonly options: AgentEcosystemValidatorOptions;

  constructor(options: AgentEcosystemValidatorOptions = {}) {
    this.options = options;
  }

  validate(ctx: AgentEcosystemValidationContext): AgentEcosystemValidationReport {
    return validateAgentEcosystem(ctx, this.options);
  }

  assert(ctx: AgentEcosystemValidationContext): AgentEcosystemValidationReport {
    return assertAgentEcosystem(ctx, this.options);
  }

  validateResult(
    agent: BlueprintAgent<unknown, AgentResultBase>,
    result: AgentResultBase,
    sectionsWritten: BlueprintSection[],
  ): AgentEcosystemValidationReport {
    return this.validate({ agent, result, sectionsWritten });
  }
}
