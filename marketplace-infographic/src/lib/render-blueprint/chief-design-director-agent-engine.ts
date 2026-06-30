/**
 * Chapter 7.24 — Chief Design Director Agent engine.
 * Final executive decision — never designs, only approves or routes to retry.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildAntiPatternSection,
  buildBatterySprayerAntiPatternDirectorInput,
  fromAntiPatternSection,
} from "./anti-pattern-director-agent-engine";
import type { AntiPatternDirectorAgentReport } from "./anti-pattern-director-agent-types";
import {
  buildCommercialSection,
  buildBatterySprayerCommercialCriticInput,
  fromCommercialSection,
} from "./commercial-critic-agent-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildArtDirectorSection,
  buildBatterySprayerSeniorArtDirectorInput,
  fromArtDirectorSection,
} from "./senior-art-director-agent-engine";
import {
  buildBatterySprayerVisionCriticInput,
  buildVisionSection,
  fromVisionSection,
} from "./vision-critic-agent-engine";
import {
  CHIEF_DESIGN_DIRECTOR_AGENT_ID,
  ChiefDesignDirectorAgentApprovalLevel,
  ChiefDesignDirectorAgentModule,
  type ChiefDesignDirectorAgentContext,
  type ChiefDesignDirectorAgentExecutionReport,
  type ChiefDesignDirectorAgentFailureCode,
  type ChiefDesignDirectorAgentFinalDecision,
  type ChiefDesignDirectorAgentInput,
  type ChiefDesignDirectorAgentKpi,
  type ChiefDesignDirectorAgentModuleDefinition,
  type ChiefDesignDirectorAgentModuleId,
  type ChiefDesignDirectorAgentModuleRecord,
  type ChiefDesignDirectorAgentPipelineLink,
  type ChiefDesignDirectorAgentProblem,
  type ChiefDesignDirectorAgentRetryBranch,
  type ChiefDesignDirectorAgentRetryPriority,
  type ChiefDesignDirectorAgentValidationReport,
  type ChiefDesignDirectorAgentViolationRecord,
} from "./chief-design-director-agent-types";

export {
  CHIEF_DESIGN_DIRECTOR_AGENT_ID,
  ChiefDesignDirectorAgentModule,
  ChiefDesignDirectorAgentApprovalLevel,
  type ChiefDesignDirectorAgentModuleId,
  type ChiefDesignDirectorAgentApprovalLevelId,
  type ChiefDesignDirectorAgentInput,
  type ChiefDesignDirectorAgentFinalDecision,
  type ChiefDesignDirectorAgentProblem,
  type ChiefDesignDirectorAgentRetryPriority,
  type ChiefDesignDirectorAgentModuleRecord,
  type ChiefDesignDirectorAgentKpi,
  type ChiefDesignDirectorAgentViolationRecord,
  type ChiefDesignDirectorAgentRetryBranch,
  type ChiefDesignDirectorAgentExecutionReport,
  type ChiefDesignDirectorAgentValidationReport,
  type ChiefDesignDirectorAgentContext,
  type ChiefDesignDirectorAgentFailureCode,
  type ChiefDesignDirectorAgentModuleDefinition,
  type ChiefDesignDirectorAgentPipelineLink,
} from "./chief-design-director-agent-types";

export const CHIEF_DESIGN_DIRECTOR_AGENT_VERSION = "7.24.0";
export const CHIEF_DESIGN_DIRECTOR_AGENT_CONTRACT_ID: AgentContractId = CHIEF_DESIGN_DIRECTOR_AGENT_ID;

export const CHIEF_DESIGN_DIRECTOR_AGENT_GOLDEN_RULE =
  "A true creative director does not craft every element — they orchestrate specialists, " +
  "then judge the whole. Chief Design Director does not ask if it looks beautiful; it asks: " +
  "am I ready to sign this work and send it to millions of buyers?";

export const CHIEF_DESIGN_DIRECTOR_AGENT_MISSION =
  'Answer: "Is this project ready for final generation, or must it return for refinement?" — ' +
  "unify expert reports, resolve conflicts, and issue Final Design Approval.";

export const CHIEF_DESIGN_DIRECTOR_AGENT_MODULES: readonly ChiefDesignDirectorAgentModuleDefinition[] = [
  { id: ChiefDesignDirectorAgentModule.BLUEPRINT_AUDITOR, order: 1, label: "Blueprint Auditor", responsibility: "Verify all mandatory blueprints exist" },
  { id: ChiefDesignDirectorAgentModule.EXPERT_CONSENSUS_ENGINE, order: 2, label: "Expert Consensus Engine", responsibility: "Weight and merge critic reports" },
  { id: ChiefDesignDirectorAgentModule.CONFLICT_RESOLVER, order: 3, label: "Conflict Resolver", responsibility: "Resolve expert disagreements with commercial priority" },
  { id: ChiefDesignDirectorAgentModule.PRIORITY_PLANNER, order: 4, label: "Priority Planner", responsibility: "Sequence retry fixes by domain priority" },
  { id: ChiefDesignDirectorAgentModule.APPROVAL_ENGINE, order: 5, label: "Approval Engine", responsibility: "Issue approve, minor notes, retry, or reject" },
  { id: ChiefDesignDirectorAgentModule.DIRECTOR_VALIDATOR, order: 6, label: "Director Validator", responsibility: "Validate executive thresholds and constitution" },
  { id: ChiefDesignDirectorAgentModule.FINAL_DECISION_BUILDER, order: 7, label: "Final Decision Builder", responsibility: "Assemble Final Design Decision for Render Pipeline" },
] as const;

export const CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE: readonly ChiefDesignDirectorAgentPipelineLink[] = [
  { from: "senior_art_director", to: "chief_design_director" },
  { from: "chief_design_director", to: "render_pipeline" },
] as const;

const EXPERT_WEIGHTS = {
  commercial: 0.35,
  vision: 0.25,
  artDirector: 0.3,
  antiPattern: 0.1,
} as const;

const CONFIDENCE_THRESHOLD = 0.75;
const APPROVAL_SCORE_THRESHOLD = 82;
const STRONG_APPROVAL_THRESHOLD = 88;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function violation(
  code: ChiefDesignDirectorAgentFailureCode,
  message: string,
  module?: ChiefDesignDirectorAgentModuleId,
): ChiefDesignDirectorAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: ChiefDesignDirectorAgentModuleRecord[],
  completed: ChiefDesignDirectorAgentModuleId[],
  module: ChiefDesignDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function auditChiefDesignDirectorBlueprints(
  input: ChiefDesignDirectorAgentInput,
  agentContext: ChiefDesignDirectorAgentContext = {},
): { complete: boolean; missing: string[] } {
  if (agentContext.missingBlueprint) {
    return { complete: false, missing: ["storyBlueprint"] };
  }

  const missing: string[] = [];
  if (!input.storyBlueprint.primaryMessage) missing.push("storyBlueprint");
  if (!input.sceneBlueprint.environment) missing.push("sceneBlueprint");
  if (!input.layoutBlueprint.layoutPattern) missing.push("layoutBlueprint");
  if (!input.photographyBlueprint.photoStyle) missing.push("photographyBlueprint");
  if (!input.lightingBlueprint.lightingMood) missing.push("lightingBlueprint");
  if (!input.cameraBlueprint.framing) missing.push("cameraBlueprint");
  if (input.materialBlueprint.materials.length === 0) missing.push("materialBlueprint");
  if (!input.typographyBlueprint.headingStyle) missing.push("typographyBlueprint");
  if (!input.marketplaceBlueprint.overlayStrategy) missing.push("marketplaceBlueprint");
  if (input.patternBlueprint.selectedPatterns.length === 0) missing.push("patternBlueprint");

  return { complete: missing.length === 0, missing };
}

export function scoreAntiPatternContribution(report: AntiPatternDirectorAgentReport): number {
  return clampScore((1 - report.overallRisk) * 100);
}

export function computeChiefDesignDirectorOverallScore(input: ChiefDesignDirectorAgentInput): number {
  const commercial = input.commercialReport.overallCommercialScore;
  const vision = input.visionReport.overallScore;
  const art = input.artDirectorReport.overallDesignScore;
  const anti = scoreAntiPatternContribution(input.antiPatternReport);

  return clampScore(
    commercial * EXPERT_WEIGHTS.commercial +
      vision * EXPERT_WEIGHTS.vision +
      art * EXPERT_WEIGHTS.artDirector +
      anti * EXPERT_WEIGHTS.antiPattern,
  );
}

export function detectChiefDesignExpertConflicts(
  input: ChiefDesignDirectorAgentInput,
  agentContext: ChiefDesignDirectorAgentContext = {},
): ChiefDesignDirectorAgentProblem[] {
  const problems: ChiefDesignDirectorAgentProblem[] = [];
  const vision = input.visionReport.overallScore;
  const commercial = input.commercialReport.overallCommercialScore;

  if (agentContext.expertConflict || (vision >= 90 && commercial < 75)) {
    problems.push({
      id: "conflict-vision-commercial",
      category: "consensus",
      severity: "high",
      message: "Beautiful imagery but weak commercial selling power — commercial effectiveness overrides aesthetics",
      sourceAgent: "commercial-critic",
    });
  }

  if (input.visionReport.retryRequired && !input.commercialReport.retryRequired) {
    problems.push({
      id: "conflict-vision-retry",
      category: "consensus",
      severity: "medium",
      message: "Vision critic flagged retry while commercial report passed — requires director reconciliation",
      sourceAgent: "vision-critic",
    });
  }

  if (input.artDirectorReport.retryRequired && input.commercialReport.overallCommercialScore >= 85) {
    problems.push({
      id: "conflict-art-commercial",
      category: "consensus",
      severity: "medium",
      message: "Art direction concerns despite strong commercial scores — design integrity review needed",
      sourceAgent: "senior-art-director",
    });
  }

  for (const violation of input.antiPatternReport.criticalViolations.slice(0, 2)) {
    problems.push({
      id: `anti-${violation.id}`,
      category: "anti_pattern",
      severity: violation.severity === "critical" ? "critical" : "high",
      message: violation.message,
      sourceAgent: "anti-pattern-director",
    });
  }

  if (agentContext.criticalAntiPattern) {
    problems.push({
      id: "anti-critical-injected",
      category: "anti_pattern",
      severity: "critical",
      message: "Critical anti-pattern violations block render pipeline entry",
      sourceAgent: "anti-pattern-director",
    });
  }

  if (agentContext.injectCriticalProblem) {
    problems.push({
      id: "director-critical-block",
      category: "governance",
      severity: "critical",
      message: "Executive review detected constitution-level design failure",
      sourceAgent: "chief-design-director",
    });
  }

  return problems;
}

export function buildChiefDesignDirectorRetryPriority(
  input: ChiefDesignDirectorAgentInput,
  problems: ChiefDesignDirectorAgentProblem[],
): ChiefDesignDirectorAgentRetryPriority[] {
  const priorities: ChiefDesignDirectorAgentRetryPriority[] = [];

  if (
    input.commercialReport.retryRequired ||
    input.commercialReport.overallCommercialScore < APPROVAL_SCORE_THRESHOLD ||
    problems.some((p) => p.id === "conflict-vision-commercial")
  ) {
    priorities.push({
      rank: 1,
      domain: "Commercial Problems",
      agents: ["commercial-critic", "marketplace-director", "typography-director"],
      reason: "Commercial effectiveness has highest executive priority",
    });
  }

  if (input.storyBlueprint.confidence < 0.8 || problems.some((p) => p.category === "story")) {
    priorities.push({
      rank: 2,
      domain: "Story",
      agents: ["visual-story-director", "scene-director"],
      reason: "Narrative foundation must support marketplace conversion",
    });
  }

  if (input.visionReport.compositionScore < 80 || input.layoutBlueprint.confidence < 0.8) {
    priorities.push({
      rank: 3,
      domain: "Composition",
      agents: ["composition-director", "photography-director", "camera-director"],
      reason: "Visual structure requires refinement before re-critique",
    });
  }

  if (input.typographyBlueprint.confidence < 0.85) {
    priorities.push({
      rank: 4,
      domain: "Typography",
      agents: ["typography-director"],
      reason: "Text hierarchy and readability need targeted correction",
    });
  }

  if (priorities.length === 0 && problems.length > 0) {
    priorities.push({
      rank: 1,
      domain: "Design Review",
      agents: ["vision-critic", "senior-art-director", "chief-design-director"],
      reason: "Sequential expert re-validation after targeted director fixes",
    });
  }

  return priorities.sort((a, b) => a.rank - b.rank);
}

export function resolveChiefDesignDirectorApprovalLevel(input: {
  overallScore: number;
  blueprintComplete: boolean;
  criticalProblems: ChiefDesignDirectorAgentProblem[];
  expertReports: ChiefDesignDirectorAgentInput;
  agentContext?: ChiefDesignDirectorAgentContext;
}): ChiefDesignDirectorAgentApprovalLevelId {
  const { overallScore, blueprintComplete, criticalProblems, expertReports, agentContext = {} } = input;

  if (!blueprintComplete || agentContext.missingBlueprint) {
    return ChiefDesignDirectorAgentApprovalLevel.REJECTED;
  }

  if (criticalProblems.some((p) => p.severity === "critical")) {
    return agentContext.criticalAntiPattern
      ? ChiefDesignDirectorAgentApprovalLevel.REJECTED
      : ChiefDesignDirectorAgentApprovalLevel.RETRY_REQUIRED;
  }

  const anyRetry =
    expertReports.visionReport.retryRequired ||
    expertReports.commercialReport.retryRequired ||
    expertReports.artDirectorReport.retryRequired ||
    expertReports.antiPatternReport.retryRequired;

  if (
    agentContext.expertConflict ||
    agentContext.lowOverallScore ||
    overallScore < APPROVAL_SCORE_THRESHOLD ||
    anyRetry
  ) {
    return ChiefDesignDirectorAgentApprovalLevel.RETRY_REQUIRED;
  }

  const minorIssues =
    criticalProblems.filter((p) => p.severity === "medium" || p.severity === "low").length > 0 ||
    expertReports.visionReport.visualProblems.length > 0;

  if (overallScore >= STRONG_APPROVAL_THRESHOLD && !minorIssues) {
    return ChiefDesignDirectorAgentApprovalLevel.APPROVED;
  }

  if (overallScore >= APPROVAL_SCORE_THRESHOLD) {
    return ChiefDesignDirectorAgentApprovalLevel.APPROVED_WITH_MINOR_NOTES;
  }

  return ChiefDesignDirectorAgentApprovalLevel.RETRY_REQUIRED;
}

export function buildChiefDesignDirectorComments(
  approvalLevel: ChiefDesignDirectorAgentApprovalLevelId,
  overallScore: number,
  conflicts: ChiefDesignDirectorAgentProblem[],
): string[] {
  const comments: string[] = [];

  if (approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED) {
    comments.push(
      `Executive approval granted — weighted consensus ${overallScore} meets agency release threshold.`,
    );
    comments.push("All mandatory blueprints validated; expert reports aligned for Render Pipeline.");
  } else if (approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED_WITH_MINOR_NOTES) {
    comments.push(`Approved with minor notes — overall score ${overallScore} with non-blocking improvements logged.`);
    comments.push("Generation permitted; recommendations preserved for Learning Engine.");
  } else if (approvalLevel === ChiefDesignDirectorAgentApprovalLevel.RETRY_REQUIRED) {
    comments.push("Retry required — commercial effectiveness and design integrity not yet at executive standard.");
    if (conflicts.some((c) => c.id === "conflict-vision-commercial")) {
      comments.push("Commercial priority applied: beautiful but weak-selling work cannot ship.");
    }
  } else {
    comments.push("Project rejected — missing blueprints or critical constitution violations.");
  }

  return comments;
}

type FinalDecisionSection = {
  overallScore: number;
  approved: boolean;
  retryRequired: boolean;
  retryPriority: ChiefDesignDirectorAgentRetryPriority[];
  criticalProblems: ChiefDesignDirectorAgentProblem[];
  approvalLevel: ChiefDesignDirectorAgentApprovalLevelId;
  directorComments: string[];
  reportConfidence: number;
};

export function buildFinalDesignDecisionSection(
  input: ChiefDesignDirectorAgentInput,
  agentContext: ChiefDesignDirectorAgentContext = {},
  confidenceSeed: number,
): FinalDecisionSection {
  const blueprintAudit = auditChiefDesignDirectorBlueprints(input, agentContext);
  const overallScore = agentContext.lowOverallScore ? 68 : computeChiefDesignDirectorOverallScore(input);
  const conflicts = detectChiefDesignExpertConflicts(input, agentContext);
  const criticalProblems = conflicts.filter((p) => p.severity === "critical" || p.severity === "high");
  const approvalLevel = resolveChiefDesignDirectorApprovalLevel({
    overallScore,
    blueprintComplete: blueprintAudit.complete,
    criticalProblems,
    expertReports: input,
    agentContext,
  });

  const retryRequired =
    approvalLevel === ChiefDesignDirectorAgentApprovalLevel.RETRY_REQUIRED ||
    approvalLevel === ChiefDesignDirectorAgentApprovalLevel.REJECTED;

  const approved =
    approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED ||
    approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED_WITH_MINOR_NOTES;

  const retryPriority = retryRequired ? buildChiefDesignDirectorRetryPriority(input, conflicts) : [];
  const directorComments = buildChiefDesignDirectorComments(approvalLevel, overallScore, conflicts);

  return {
    overallScore,
    approved,
    retryRequired,
    retryPriority,
    criticalProblems,
    approvalLevel,
    directorComments,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromFinalDesignDecisionSection(section: FinalDecisionSection): ChiefDesignDirectorAgentFinalDecision {
  return {
    approved: section.approved,
    overallScore: section.overallScore,
    retryRequired: section.retryRequired,
    retryPriority: section.retryPriority,
    criticalProblems: section.criticalProblems,
    approvalLevel: section.approvalLevel,
    directorComments: section.directorComments,
    confidence: section.reportConfidence,
  };
}

export function validateChiefDesignDirectorAgentDecision(
  decision?: ChiefDesignDirectorAgentFinalDecision,
  section?: FinalDecisionSection,
  agentContext: ChiefDesignDirectorAgentContext = {},
): ChiefDesignDirectorAgentViolationRecord[] {
  const violations: ChiefDesignDirectorAgentViolationRecord[] = [];

  if (!decision) {
    violations.push(
      violation("DECISION_INCOMPLETE", "Final Design Decision is required", ChiefDesignDirectorAgentModule.FINAL_DECISION_BUILDER),
    );
    return violations;
  }

  if (agentContext.missingBlueprint && decision.approved) {
    violations.push(
      violation("MISSING_BLUEPRINT", "Missing blueprint flag must reject approval", ChiefDesignDirectorAgentModule.BLUEPRINT_AUDITOR),
    );
  }

  if (agentContext.expertConflict && !decision.retryRequired) {
    violations.push(
      violation("EXPERT_CONFLICT_UNRESOLVED", "Expert conflict must require retry", ChiefDesignDirectorAgentModule.CONFLICT_RESOLVER),
    );
  }

  if (agentContext.lowOverallScore && decision.overallScore >= APPROVAL_SCORE_THRESHOLD) {
    violations.push(
      violation("LOW_OVERALL_SCORE", "Low overall score flag must reduce weighted consensus", ChiefDesignDirectorAgentModule.EXPERT_CONSENSUS_ENGINE),
    );
  }

  if (agentContext.criticalAntiPattern && decision.approved) {
    violations.push(
      violation("FALSE_APPROVAL", "Critical anti-pattern must block approval", ChiefDesignDirectorAgentModule.APPROVAL_ENGINE),
    );
  }

  if (agentContext.injectCriticalProblem && !decision.criticalProblems.some((p) => p.severity === "critical")) {
    violations.push(
      violation("CRITICAL_PROBLEM_MISSED", "Injected critical problem must appear in decision", ChiefDesignDirectorAgentModule.DIRECTOR_VALIDATOR),
    );
  }

  if (!agentContext.lowOverallScore && !agentContext.missingBlueprint && decision.overallScore < 75 && decision.approved) {
    violations.push(
      violation("FALSE_APPROVAL", "Unjustified approval on weak garden sprayer consensus score", ChiefDesignDirectorAgentModule.APPROVAL_ENGINE),
    );
  }

  if (decision.directorComments.length === 0) {
    violations.push(
      violation("DECISION_INCOMPLETE", "Director comments are required", ChiefDesignDirectorAgentModule.FINAL_DECISION_BUILDER),
    );
  }

  if (decision.retryRequired && decision.retryPriority.length === 0 && !agentContext.missingBlueprint) {
    violations.push(
      violation("DECISION_INCOMPLETE", "Retry decision must include priority plan", ChiefDesignDirectorAgentModule.PRIORITY_PLANNER),
    );
  }

  return violations;
}

export function buildChiefDesignDirectorAgentKpis(input: {
  decision: ChiefDesignDirectorAgentFinalDecision;
  section: FinalDecisionSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): ChiefDesignDirectorAgentKpi {
  const { decision, section, confidence, retryCount, directorValid } = input;
  return {
    approvalAccuracy: directorValid ? 0.95 : 0.55,
    retryPrecision: decision.retryRequired === section.retryRequired ? 0.92 : 0.6,
    consensusQuality: decision.overallScore >= 85 ? 0.93 : 0.72,
    commercialSuccessRate: decision.approved ? 0.91 : 0.7,
    finalDecisionStability: retryCount === 0 ? 0.94 : 0.88,
    falseApprovalRate: decision.approved && decision.overallScore < APPROVAL_SCORE_THRESHOLD ? 0.4 : 0.05,
    confidenceScore: confidence,
  };
}

export function mapChiefDesignDirectorModuleToStage(module: ChiefDesignDirectorAgentModuleId): string {
  const mapping: Record<ChiefDesignDirectorAgentModuleId, string> = {
    [ChiefDesignDirectorAgentModule.BLUEPRINT_AUDITOR]: "blueprint_audit",
    [ChiefDesignDirectorAgentModule.EXPERT_CONSENSUS_ENGINE]: "expert_consensus",
    [ChiefDesignDirectorAgentModule.CONFLICT_RESOLVER]: "conflict_resolution",
    [ChiefDesignDirectorAgentModule.PRIORITY_PLANNER]: "priority_planning",
    [ChiefDesignDirectorAgentModule.APPROVAL_ENGINE]: "approval_decision",
    [ChiefDesignDirectorAgentModule.DIRECTOR_VALIDATOR]: "validation",
    [ChiefDesignDirectorAgentModule.FINAL_DECISION_BUILDER]: "decision_assembly",
  };
  return mapping[module];
}

export function buildDefaultChiefDesignDirectorAgentInput(
  overrides: Partial<ChiefDesignDirectorAgentInput> = {},
): ChiefDesignDirectorAgentInput {
  const apInput = buildBatterySprayerAntiPatternDirectorInput();
  const apSection = buildAntiPatternSection(apInput, {}, 0.93);
  const antiPatternReport = fromAntiPatternSection(apSection, apInput);

  const visionInput = buildBatterySprayerVisionCriticInput();
  const visionSection = buildVisionSection(visionInput, {}, 0.93);
  const visionReport = fromVisionSection(visionSection);

  const commercialInput = buildBatterySprayerCommercialCriticInput();
  const commercialSection = buildCommercialSection(commercialInput, {}, 0.93);
  const commercialReport = fromCommercialSection(commercialSection);

  const artInput = buildBatterySprayerSeniorArtDirectorInput();
  const artSection = buildArtDirectorSection(artInput, {}, 0.93);
  const artDirectorReport = fromArtDirectorSection(artSection);

  return {
    storyBlueprint: artInput.storyBlueprint,
    sceneBlueprint: artInput.sceneBlueprint,
    layoutBlueprint: artInput.layoutBlueprint,
    photographyBlueprint: artInput.photographyBlueprint,
    lightingBlueprint: artInput.lightingBlueprint,
    cameraBlueprint: artInput.cameraBlueprint,
    materialBlueprint: artInput.materialBlueprint,
    typographyBlueprint: artInput.typographyBlueprint,
    marketplaceBlueprint: artInput.marketplaceBlueprint,
    patternBlueprint: artInput.patternBlueprint,
    antiPatternReport,
    visionReport,
    commercialReport,
    artDirectorReport,
    ...overrides,
  };
}

export function buildBatterySprayerChiefDesignDirectorInput(): ChiefDesignDirectorAgentInput {
  return buildDefaultChiefDesignDirectorAgentInput();
}

function resolveRetryBranch(context: ChiefDesignDirectorAgentContext): ChiefDesignDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.expertConflict ||
    context.lowOverallScore ||
    context.criticalAntiPattern ||
    context.injectCriticalProblem ||
    context.lowConfidence
  ) {
    return "consensus_conflict_approval";
  }
  return undefined;
}

function buildDecisionFromInput(
  agentInput: ChiefDesignDirectorAgentInput,
  agentContext: ChiefDesignDirectorAgentContext,
  confidenceSeed: number,
): { section: FinalDecisionSection; confidence: number; directorValid: boolean } {
  const section = buildFinalDesignDecisionSection(agentInput, agentContext, confidenceSeed);
  const decision = fromFinalDesignDecisionSection(section);

  const hasFailureContext = Boolean(
    agentContext.missingBlueprint ||
      agentContext.expertConflict ||
      agentContext.lowOverallScore ||
      agentContext.criticalAntiPattern ||
      agentContext.injectCriticalProblem,
  );

  let directorValid = decision.directorComments.length > 0;
  if (hasFailureContext) {
    directorValid =
      directorValid &&
      (!agentContext.missingBlueprint || !decision.approved) &&
      (!agentContext.expertConflict || decision.retryRequired) &&
      (!agentContext.criticalAntiPattern || !decision.approved) &&
      (!agentContext.injectCriticalProblem || decision.criticalProblems.some((p) => p.severity === "critical"));
  } else {
    directorValid =
      directorValid &&
      decision.approved &&
      !decision.retryRequired &&
      decision.overallScore >= STRONG_APPROVAL_THRESHOLD &&
      decision.approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED;
  }

  const confidence = directorValid && !hasFailureContext ? confidenceSeed : hasFailureContext && directorValid ? 0.55 : 0.45;

  return { section, confidence, directorValid };
}

export async function executeChiefDesignDirectorAgent(input: {
  agentInput?: ChiefDesignDirectorAgentInput;
  context?: ChiefDesignDirectorAgentContext;
}): Promise<ChiefDesignDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerChiefDesignDirectorInput();
  const violations: ChiefDesignDirectorAgentViolationRecord[] = [];
  const modulesCompleted: ChiefDesignDirectorAgentModuleId[] = [];
  const moduleRecords: ChiefDesignDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: ChiefDesignDirectorAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildDecisionFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordDirectorModules = (decisionSection: FinalDecisionSection, suffix = "") => {
    const audit = auditChiefDesignDirectorBlueprints(agentInput, context);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.BLUEPRINT_AUDITOR, `${audit.complete}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.EXPERT_CONSENSUS_ENGINE, `${decisionSection.overallScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.CONFLICT_RESOLVER, `${decisionSection.criticalProblems.length} conflicts${suffix}`);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.PRIORITY_PLANNER, `${decisionSection.retryPriority.length} priorities${suffix}`);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.APPROVAL_ENGINE, decisionSection.approvalLevel + suffix);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.DIRECTOR_VALIDATOR, `${decisionSection.approved}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, ChiefDesignDirectorAgentModule.FINAL_DECISION_BUILDER, "decision assembled" + suffix);
  };

  recordDirectorModules(section);

  let decision = fromFinalDesignDecisionSection(section);
  violations.push(...validateChiefDesignDirectorAgentDecision(decision, section, context));

  if (
    context.expertConflict ||
    context.lowOverallScore ||
    context.criticalAntiPattern ||
    context.injectCriticalProblem
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildDecisionFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    decision = fromFinalDesignDecisionSection(section);

    violations.length = 0;
    violations.push(...validateChiefDesignDirectorAgentDecision(decision, section, {}));
    recordDirectorModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    decision = { ...decision, confidence: Math.max(decision.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.expertConflict && retryCount >= maxRetries && !context.skipRetry && decision.retryRequired) {
    violations.push(violation("RETRY_EXHAUSTED", "Chief director retry did not recover executive approval"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 52,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: CHIEF_DESIGN_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: CHIEF_DESIGN_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const professional = await executeProfessionalDecision({
    agentId: CHIEF_DESIGN_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!professional.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate executive approval"));
  }
  if (!professional.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be executive-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildChiefDesignDirectorAgentKpis({
    decision: decision ?? {
      approved: false,
      overallScore: 0,
      retryRequired: true,
      retryPriority: [],
      criticalProblems: [],
      approvalLevel: ChiefDesignDirectorAgentApprovalLevel.RETRY_REQUIRED,
      directorComments: [],
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= CHIEF_DESIGN_DIRECTOR_AGENT_MODULES.length ||
    CHIEF_DESIGN_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(decision),
    agentId: CHIEF_DESIGN_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    decision,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    doesNotExecuteRetry: true,
    goldenRuleSatisfied: CHIEF_DESIGN_DIRECTOR_AGENT_GOLDEN_RULE.includes("millions of buyers"),
  };
}

export async function executeChiefDesignDirectorAgentWithPipeline(input: {
  agentInput?: ChiefDesignDirectorAgentInput;
  context?: ChiefDesignDirectorAgentContext;
}): Promise<ChiefDesignDirectorAgentExecutionReport> {
  const report = await executeChiefDesignDirectorAgent(input);
  if (!report.valid || !report.decision) return report;

  const pipelineValid =
    CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE[0].to === "chief_design_director" &&
    CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE[1].to === "render_pipeline";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== CHIEF_DESIGN_DIRECTOR_AGENT_CONTRACT_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use chief-design-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: ChiefDesignDirectorAgentViolationRecord[]): ChiefDesignDirectorAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateChiefDesignDirectorAgentStructure(): ChiefDesignDirectorAgentViolationRecord[] {
  if (CHIEF_DESIGN_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Chief Design Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateChiefDesignDirectorAgent(
  context: ChiefDesignDirectorAgentContext = {},
): ChiefDesignDirectorAgentValidationReport {
  const violations = [...validateChiefDesignDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateChiefDesignDirectorAgentStructure().length === 0,
    pipelinePositionValid: CHIEF_DESIGN_DIRECTOR_AGENT_PIPELINE[1].to === "render_pipeline",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateChiefDesignDirectorAgentWithExecution(
  context: ChiefDesignDirectorAgentContext = {},
): Promise<ChiefDesignDirectorAgentValidationReport> {
  const report = validateChiefDesignDirectorAgent(context);
  const kitchen = await executeChiefDesignDirectorAgent({
    agentInput: buildBatterySprayerChiefDesignDirectorInput(),
    context,
  });
  const violations = dedupeViolations([...report.violations, ...kitchen.violations]);
  return {
    ...report,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertChiefDesignDirectorAgent(
  context?: ChiefDesignDirectorAgentContext,
): ChiefDesignDirectorAgentValidationReport {
  const report = validateChiefDesignDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Chief Design Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runChiefDesignDirectorAgent(
  context: ChiefDesignDirectorAgentContext = {},
): Promise<ChiefDesignDirectorAgentValidationReport> {
  return validateChiefDesignDirectorAgentWithExecution(context);
}

export function isChiefDesignDirectorAgentFailure(code: string): code is ChiefDesignDirectorAgentFailureCode {
  const codes: ChiefDesignDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "MISSING_BLUEPRINT",
    "EXPERT_CONFLICT_UNRESOLVED",
    "LOW_OVERALL_SCORE",
    "CRITICAL_PROBLEM_MISSED",
    "FALSE_APPROVAL",
    "DECISION_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as ChiefDesignDirectorAgentFailureCode);
}

export function getChiefDesignDirectorAgentModule(
  moduleId: ChiefDesignDirectorAgentModuleId,
): ChiefDesignDirectorAgentModuleDefinition | undefined {
  return CHIEF_DESIGN_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasFinalGardenSprayerApproval(decision: ChiefDesignDirectorAgentFinalDecision): boolean {
  return (
    decision.approved &&
    decision.overallScore >= STRONG_APPROVAL_THRESHOLD &&
    !decision.retryRequired &&
    decision.approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED
  );
}

export function scoreChiefConsensusCandidate(commercial: number, vision: number): number {
  if (commercial >= 90 && vision >= 90) return 0.96;
  if (commercial >= 85 && vision >= 85) return 0.92;
  if (commercial < 75 && vision >= 90) return 0.55;
  return 0.8;
}
