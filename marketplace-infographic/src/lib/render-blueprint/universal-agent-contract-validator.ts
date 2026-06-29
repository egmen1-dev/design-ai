/**
 * Chapter 4.1 — Universal Agent Contract validator
 */
import type { UniversalBlueprintAgent, UniversalAgentResult } from "./universal-agent-contract-types";
import { normalizeConfidence } from "./universal-agent-contract";
import type {
  UniversalContractReport,
  UniversalContractViolation,
} from "./universal-agent-contract-types";

export class UniversalContractError extends Error {
  readonly report: UniversalContractReport;

  constructor(report: UniversalContractReport) {
    super(`Universal agent contract violation (${report.agentId}): ${report.violations.map((v) => v.message).join("; ")}`);
    this.name = "UniversalContractError";
    this.report = report;
  }
}

const FORBIDDEN_SIDE_EFFECT_CODES = [
  "PROVIDER_CALL",
  "FILE_WRITE",
  "DB_WRITE",
  "COMPOSITE",
  "RENDER",
  "LIFECYCLE_MUTATION",
] as const;

function violation(
  code: string,
  message: string,
  severity: UniversalContractViolation["severity"] = "fatal",
): UniversalContractViolation {
  return { code, message, severity };
}

export function validateUniversalAgentInterface(
  agent: UniversalBlueprintAgent,
): UniversalContractViolation[] {
  const issues: UniversalContractViolation[] = [];
  if (!agent.id?.trim()) issues.push(violation("MISSING_ID", "Agent must have stable id"));
  if (!agent.version?.trim()) issues.push(violation("MISSING_VERSION", "Agent must have version"));
  if (!agent.category) issues.push(violation("MISSING_CATEGORY", "Agent must declare category"));
  if (!agent.produces?.length && agent.category !== "CRITIC") {
    issues.push(violation("MISSING_PRODUCES", "Agent must declare produced sections", "warning"));
  }
  if (!agent.consumes?.length && agent.category !== "ORCHESTRATOR") {
    issues.push(violation("MISSING_CONSUMES", "Agent must declare consumed sections", "warning"));
  }
  if (typeof agent.canExecute !== "function") {
    issues.push(violation("MISSING_CAN_EXECUTE", "Agent must implement canExecute(context)"));
  }
  if (typeof agent.execute !== "function") {
    issues.push(violation("MISSING_EXECUTE", "Agent must implement execute(context)"));
  }
  return issues;
}

export function validateUniversalAgentResult(
  agent: UniversalBlueprintAgent,
  result: UniversalAgentResult,
): UniversalContractViolation[] {
  const issues: UniversalContractViolation[] = [];

  if (!Number.isFinite(result.confidence) || result.confidence < 0 || result.confidence > 1) {
    issues.push(
      violation(
        "INVALID_CONFIDENCE",
        `Agent ${agent.id} confidence must be 0.0..1.0, got ${result.confidence}`,
      ),
    );
  }

  if (!result.diagnostics) {
    issues.push(violation("MISSING_DIAGNOSTICS", "Agent result must include diagnostics"));
  } else {
    const d = result.diagnostics;
    if (!d.version) issues.push(violation("DIAG_MISSING_VERSION", "Diagnostics must include version"));
    if (!d.inputHash) issues.push(violation("DIAG_MISSING_INPUT_HASH", "Diagnostics must include inputHash"));
    if (!d.outputHash) issues.push(violation("DIAG_MISSING_OUTPUT_HASH", "Diagnostics must include outputHash"));
    if (d.executionTimeMs < 0) {
      issues.push(violation("DIAG_INVALID_TIME", "Diagnostics executionTimeMs must be >= 0"));
    }
    if (normalizeConfidence(d.confidence) !== normalizeConfidence(result.confidence)) {
      issues.push(
        violation(
          "DIAG_CONFIDENCE_MISMATCH",
          "Diagnostics confidence must match result confidence",
          "error",
        ),
      );
    }
  }

  if ((result as { blueprint?: unknown }).blueprint !== undefined) {
    issues.push(
      violation(
        "BLUEPRINT_IN_RESULT",
        "Agent result must not contain blueprint — only mutations",
      ),
    );
  }

  for (const mutation of result.mutations) {
    if (!agent.produces.includes(mutation.section)) {
      issues.push(
        violation(
          "MUTATION_OWNERSHIP",
          `Agent ${agent.id} cannot mutate section ${mutation.section}`,
          "fatal",
        ),
      );
    }
    if (!mutation.reason?.trim()) {
      issues.push(
        violation(
          "MUTATION_NO_REASON",
          `Mutation on ${mutation.section} lacks reason`,
          "error",
        ),
      );
    }
  }

  for (const rec of result.recommendations) {
    if (rec.confidence < 0 || rec.confidence > 1) {
      issues.push(
        violation(
          "REC_INVALID_CONFIDENCE",
          `Recommendation ${rec.kind} confidence must be 0.0..1.0`,
          "error",
        ),
      );
    }
  }

  return issues;
}

export function validateUniversalAgentContract(
  agent: UniversalBlueprintAgent,
  result?: UniversalAgentResult,
): UniversalContractReport {
  const violations = [
    ...validateUniversalAgentInterface(agent),
    ...(result ? validateUniversalAgentResult(agent, result) : []),
  ];
  const blocking = violations.filter((v) => v.severity === "fatal" || v.severity === "error");
  return {
    valid: blocking.length === 0,
    agentId: agent.id,
    violations,
  };
}

export function assertUniversalAgentContract(
  agent: UniversalBlueprintAgent,
  result?: UniversalAgentResult,
): UniversalContractReport {
  const report = validateUniversalAgentContract(agent, result);
  if (!report.valid) throw new UniversalContractError(report);
  return report;
}

export function assertNoForbiddenSideEffects(
  observedEffects: string[],
): UniversalContractViolation[] {
  return observedEffects
    .filter((e) => FORBIDDEN_SIDE_EFFECT_CODES.includes(e as (typeof FORBIDDEN_SIDE_EFFECT_CODES)[number]))
    .map((e) =>
      violation("FORBIDDEN_SIDE_EFFECT", `Agent performed forbidden side effect: ${e}`),
    );
}

export class UniversalAgentContractValidator {
  validateInterface(agent: UniversalBlueprintAgent): UniversalContractReport {
    return validateUniversalAgentContract(agent);
  }

  validateExecution(
    agent: UniversalBlueprintAgent,
    result: UniversalAgentResult,
  ): UniversalContractReport {
    return validateUniversalAgentContract(agent, result);
  }

  assert(agent: UniversalBlueprintAgent, result?: UniversalAgentResult): UniversalContractReport {
    return assertUniversalAgentContract(agent, result);
  }
}
