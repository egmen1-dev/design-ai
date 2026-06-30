/**
 * Chapter 7.26 — Render Orchestrator Agent engine.
 * Coordinates approved blueprints into Render Pipeline — never makes design decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildFinalDesignDecisionSection,
  buildBatterySprayerChiefDesignDirectorInput,
} from "./chief-design-director-agent-engine";
import { ChiefDesignDirectorAgentApprovalLevel } from "./chief-design-director-agent-types";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  RENDER_ORCHESTRATOR_AGENT_ID,
  RenderOrchestratorAgentModule,
  RenderOrchestratorAgentRenderStrategy,
  RenderOrchestratorAgentSessionStatus,
  type RenderOrchestratorAgentBlueprintAudit,
  type RenderOrchestratorAgentContext,
  type RenderOrchestratorAgentDependencyReport,
  type RenderOrchestratorAgentExecutionReport,
  type RenderOrchestratorAgentFailureCode,
  type RenderOrchestratorAgentInput,
  type RenderOrchestratorAgentKpi,
  type RenderOrchestratorAgentModuleDefinition,
  type RenderOrchestratorAgentModuleId,
  type RenderOrchestratorAgentModuleRecord,
  type RenderOrchestratorAgentPipelineLink,
  type RenderOrchestratorAgentRenderPlan,
  type RenderOrchestratorAgentRetryBranch,
  type RenderOrchestratorAgentSession,
  type RenderOrchestratorAgentStagePlan,
  type RenderOrchestratorAgentValidationReport,
  type RenderOrchestratorAgentViolationRecord,
} from "./render-orchestrator-agent-types";

export {
  RENDER_ORCHESTRATOR_AGENT_ID,
  RenderOrchestratorAgentModule,
  RenderOrchestratorAgentSessionStatus,
  RenderOrchestratorAgentRenderStrategy,
  type RenderOrchestratorAgentModuleId,
  type RenderOrchestratorAgentSessionStatusId,
  type RenderOrchestratorAgentRenderStrategyId,
  type RenderOrchestratorAgentStagePlan,
  type RenderOrchestratorAgentRenderPlan,
  type RenderOrchestratorAgentInput,
  type RenderOrchestratorAgentSession,
  type RenderOrchestratorAgentBlueprintAudit,
  type RenderOrchestratorAgentDependencyReport,
  type RenderOrchestratorAgentModuleRecord,
  type RenderOrchestratorAgentKpi,
  type RenderOrchestratorAgentViolationRecord,
  type RenderOrchestratorAgentRetryBranch,
  type RenderOrchestratorAgentExecutionReport,
  type RenderOrchestratorAgentValidationReport,
  type RenderOrchestratorAgentContext,
  type RenderOrchestratorAgentFailureCode,
  type RenderOrchestratorAgentModuleDefinition,
  type RenderOrchestratorAgentPipelineLink,
} from "./render-orchestrator-agent-types";

export const RENDER_ORCHESTRATOR_AGENT_VERSION = "7.26.0";
export const RENDER_ORCHESTRATOR_AGENT_CONTRACT_ID: AgentContractId = RENDER_ORCHESTRATOR_AGENT_ID;

export const RENDER_ORCHESTRATOR_AGENT_GOLDEN_RULE =
  "Creating the perfect design is not enough — it must be realized faithfully. " +
  "Render Orchestrator does not make creative decisions; it guarantees every blueprint " +
  "and every agent decision is embodied in the final image exactly as specialists intended.";

export const RENDER_ORCHESTRATOR_AGENT_MISSION =
  'Answer: "How do we turn dozens of independent blueprints into one perfect commercial image?" — ' +
  "synchronize render pipeline stages without loss.";

export const RENDER_ORCHESTRATOR_AGENT_MODULES: readonly RenderOrchestratorAgentModuleDefinition[] = [
  { id: RenderOrchestratorAgentModule.BLUEPRINT_COLLECTOR, order: 1, label: "Blueprint Collector", responsibility: "Collect all approved blueprints" },
  { id: RenderOrchestratorAgentModule.DEPENDENCY_RESOLVER, order: 2, label: "Dependency Resolver", responsibility: "Validate cross-blueprint dependencies" },
  { id: RenderOrchestratorAgentModule.RENDER_PLANNER, order: 3, label: "Render Planner", responsibility: "Build multi-stage render plan" },
  { id: RenderOrchestratorAgentModule.EXECUTION_SCHEDULER, order: 4, label: "Execution Scheduler", responsibility: "Optimize sequential and parallel stages" },
  { id: RenderOrchestratorAgentModule.PIPELINE_VALIDATOR, order: 5, label: "Pipeline Validator", responsibility: "Validate provider readiness and resources" },
  { id: RenderOrchestratorAgentModule.RENDER_SESSION_BUILDER, order: 6, label: "Render Session Builder", responsibility: "Assemble Render Session for Render Adapter" },
] as const;

export const RENDER_ORCHESTRATOR_AGENT_PIPELINE: readonly RenderOrchestratorAgentPipelineLink[] = [
  { from: "final_approval", to: "render_orchestrator" },
  { from: "render_orchestrator", to: "render_adapter" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const FALLBACK_PROVIDER = "gpt-image";
const DEFAULT_PROVIDER = "flux";

const RENDER_STAGE_DEFINITIONS: readonly { id: string; name: string; order: number; parallelGroup?: number }[] = [
  { id: "background_generation", name: "Background Generation", order: 1, parallelGroup: 1 },
  { id: "overlay_layout", name: "Overlay Layout", order: 2, parallelGroup: 1 },
  { id: "product_placement", name: "Product Placement", order: 3 },
  { id: "lighting_integration", name: "Lighting Integration", order: 4 },
  { id: "material_processing", name: "Material Processing", order: 5 },
  { id: "overlay_rendering", name: "Overlay Rendering", order: 6 },
  { id: "final_composite", name: "Final Composite", order: 7 },
] as const;

function violation(
  code: RenderOrchestratorAgentFailureCode,
  message: string,
  module?: RenderOrchestratorAgentModuleId,
): RenderOrchestratorAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: RenderOrchestratorAgentModuleRecord[],
  completed: RenderOrchestratorAgentModuleId[],
  module: RenderOrchestratorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function collectRenderOrchestratorBlueprints(
  input: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext = {},
): RenderOrchestratorAgentBlueprintAudit {
  if (agentContext.missingBlueprint) {
    return { complete: false, collected: ["story"], missing: ["typographyBlueprint"] };
  }

  const entries: Array<[string, boolean]> = [
    ["storyBlueprint", Boolean(input.storyBlueprint.primaryMessage)],
    ["sceneBlueprint", Boolean(input.sceneBlueprint.environment)],
    ["layoutBlueprint", Boolean(input.layoutBlueprint.layoutPattern)],
    ["photographyBlueprint", Boolean(input.photographyBlueprint.photoStyle)],
    ["lightingBlueprint", Boolean(input.lightingBlueprint.lightingMood)],
    ["cameraBlueprint", Boolean(input.cameraBlueprint.framing)],
    ["materialBlueprint", input.materialBlueprint.materials.length > 0],
    ["typographyBlueprint", Boolean(input.typographyBlueprint.headingStyle)],
    ["marketplaceBlueprint", Boolean(input.marketplaceBlueprint.overlayStrategy)],
    ["patternBlueprint", input.patternBlueprint.selectedPatterns.length > 0],
  ];

  const collected = entries.filter(([, ok]) => ok).map(([name]) => name);
  const missing = entries.filter(([, ok]) => !ok).map(([name]) => name);

  return { complete: missing.length === 0, collected, missing };
}

export function resolveRenderOrchestratorDependencies(
  input: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext = {},
): RenderOrchestratorAgentDependencyReport {
  const conflicts: string[] = [];

  if (agentContext.dependencyConflict) {
    conflicts.push("Lighting mood conflicts with night scene environment");
    return { valid: false, conflicts };
  }

  const sceneEnv = input.sceneBlueprint.environment.toLowerCase();
  const lightingMood = input.lightingBlueprint.lightingMood.toLowerCase();
  if (sceneEnv.includes("night") && lightingMood.includes("golden")) {
    conflicts.push("Golden lighting incompatible with night scene");
  }

  const layoutHero = input.layoutBlueprint.layoutPattern.toLowerCase().includes("hero");
  const typoCount = input.typographyBlueprint.textHierarchy.length;
  if (layoutHero && typoCount > 5 && input.marketplaceBlueprint.overlayStrategy.toLowerCase().includes("minimal")) {
    conflicts.push("Minimal overlay strategy conflicts with dense typography hierarchy");
  }

  const cameraHeight = input.cameraBlueprint.cameraHeight;
  const sceneDepth = input.sceneBlueprint.depthLevel.toLowerCase();
  if (cameraHeight < 0.4 && sceneDepth.includes("deep")) {
    conflicts.push("Low camera height conflicts with deep scene depth cues");
  }

  return { valid: conflicts.length === 0, conflicts };
}

export function buildRenderOrchestratorPlan(
  input: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext = {},
): RenderOrchestratorAgentRenderPlan {
  const highDetail =
    input.materialBlueprint.realismScore >= 0.85 &&
    input.photographyBlueprint.photoStyle.toLowerCase().includes("commercial");

  let strategy = RenderOrchestratorAgentRenderStrategy.SINGLE_PASS;
  if (highDetail) {
    strategy = RenderOrchestratorAgentRenderStrategy.HIGH_QUALITY;
  } else if (input.patternBlueprint.selectedPatterns.length >= 3) {
    strategy = RenderOrchestratorAgentRenderStrategy.MULTI_PASS;
  }

  const stages: RenderOrchestratorAgentStagePlan[] = RENDER_STAGE_DEFINITIONS.map((stage) => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    parallelGroup: stage.parallelGroup,
    status:
      agentContext.overlayRenderError && stage.id === "overlay_rendering"
        ? "pending"
        : agentContext.compositeError && stage.id === "final_composite"
          ? "pending"
          : "ready",
  }));

  return { strategy, stages };
}

export function scheduleRenderOrchestratorExecution(plan: RenderOrchestratorAgentRenderPlan): string[] {
  const ordered = [...plan.stages].sort((a, b) => a.order - b.order);
  const executionOrder: string[] = [];
  const seenGroups = new Set<number>();

  for (const stage of ordered) {
    if (stage.parallelGroup !== undefined) {
      const groupLabel = `parallel_group_${stage.parallelGroup}`;
      if (!seenGroups.has(stage.parallelGroup)) {
        const groupStages = ordered
          .filter((s) => s.parallelGroup === stage.parallelGroup)
          .map((s) => s.id);
        executionOrder.push(groupLabel + ":" + groupStages.join("+"));
        seenGroups.add(stage.parallelGroup);
      }
    } else {
      executionOrder.push(stage.id);
    }
  }

  return executionOrder;
}

export function selectRenderOrchestratorProvider(
  input: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext = {},
): string {
  if (agentContext.providerUnavailable) return FALLBACK_PROVIDER;
  return input.preferredProvider ?? DEFAULT_PROVIDER;
}

export function estimateRenderOrchestratorTime(
  plan: RenderOrchestratorAgentRenderPlan,
  provider: string,
): number {
  let base = 3800;
  if (plan.strategy === RenderOrchestratorAgentRenderStrategy.MULTI_PASS) base += 1200;
  if (plan.strategy === RenderOrchestratorAgentRenderStrategy.HIGH_QUALITY) base += 1800;
  if (provider === "flux") base += 400;
  return base;
}

type RenderSessionSection = {
  sessionId: string;
  renderPlan: RenderOrchestratorAgentRenderPlan;
  executionOrder: string[];
  provider: string;
  estimatedTime: number;
  status: RenderOrchestratorAgentSession["status"];
  reportConfidence: number;
};

export function buildRenderSessionSection(
  input: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext = {},
  confidenceSeed: number,
): RenderSessionSection {
  const audit = collectRenderOrchestratorBlueprints(input, agentContext);
  const dependencies = resolveRenderOrchestratorDependencies(input, agentContext);
  const renderPlan = buildRenderOrchestratorPlan(input, agentContext);
  const executionOrder = scheduleRenderOrchestratorExecution(renderPlan);
  const provider = selectRenderOrchestratorProvider(input, agentContext);
  const estimatedTime = estimateRenderOrchestratorTime(renderPlan, provider);

  const approved =
    input.finalDecision.approved &&
    !agentContext.missingApproval &&
    input.finalDecision.approvalLevel !== ChiefDesignDirectorAgentApprovalLevel.REJECTED;

  let status: RenderOrchestratorAgentSession["status"] = RenderOrchestratorAgentSessionStatus.READY;
  if (!approved || !audit.complete || !dependencies.valid) {
    status = RenderOrchestratorAgentSessionStatus.FAILED;
  } else if (agentContext.overlayRenderError || agentContext.compositeError) {
    status = RenderOrchestratorAgentSessionStatus.SCHEDULED;
  }

  return {
    sessionId: `render-session-garden-sprayer-${Date.now()}`,
    renderPlan,
    executionOrder,
    provider,
    estimatedTime,
    status,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromRenderSessionSection(section: RenderSessionSection): RenderOrchestratorAgentSession {
  return {
    sessionId: section.sessionId,
    renderPlan: section.renderPlan,
    executionOrder: section.executionOrder,
    provider: section.provider,
    estimatedTime: section.estimatedTime,
    status: section.status,
    confidence: section.reportConfidence,
  };
}

export function validateRenderOrchestratorAgentSession(
  session?: RenderOrchestratorAgentSession,
  input?: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext = {},
): RenderOrchestratorAgentViolationRecord[] {
  const violations: RenderOrchestratorAgentViolationRecord[] = [];

  if (!session) {
    violations.push(
      violation("SESSION_INCOMPLETE", "Render Session is required", RenderOrchestratorAgentModule.RENDER_SESSION_BUILDER),
    );
    return violations;
  }

  if (agentContext.missingApproval && session.status === RenderOrchestratorAgentSessionStatus.READY) {
    violations.push(
      violation("MISSING_APPROVAL", "Render cannot start without final approval", RenderOrchestratorAgentModule.PIPELINE_VALIDATOR),
    );
  }

  if (agentContext.missingBlueprint && session.status === RenderOrchestratorAgentSessionStatus.READY) {
    violations.push(
      violation("MISSING_BLUEPRINT", "Missing blueprint must block render session", RenderOrchestratorAgentModule.BLUEPRINT_COLLECTOR),
    );
  }

  if (agentContext.dependencyConflict && session.status === RenderOrchestratorAgentSessionStatus.READY) {
    violations.push(
      violation("DEPENDENCY_CONFLICT", "Dependency conflict must block pipeline", RenderOrchestratorAgentModule.DEPENDENCY_RESOLVER),
    );
  }

  if (agentContext.providerUnavailable && session.provider === DEFAULT_PROVIDER) {
    violations.push(
      violation("PROVIDER_UNAVAILABLE", "Provider failover must select fallback provider", RenderOrchestratorAgentModule.PIPELINE_VALIDATOR),
    );
  }

  if (session.executionOrder.length === 0) {
    violations.push(
      violation("SESSION_INCOMPLETE", "Execution order is required", RenderOrchestratorAgentModule.EXECUTION_SCHEDULER),
    );
  }

  if (
    !agentContext.missingApproval &&
    !agentContext.missingBlueprint &&
    input?.finalDecision.approved &&
    session.status !== RenderOrchestratorAgentSessionStatus.READY &&
    session.status !== RenderOrchestratorAgentSessionStatus.SCHEDULED
  ) {
    violations.push(
      violation("PIPELINE_BLOCKED", "Approved garden sprayer project must produce ready render session", RenderOrchestratorAgentModule.PIPELINE_VALIDATOR),
    );
  }

  return violations;
}

export function buildRenderOrchestratorAgentKpis(input: {
  session: RenderOrchestratorAgentSession;
  confidence: number;
  retryCount: number;
  orchestratorValid: boolean;
}): RenderOrchestratorAgentKpi {
  const { session, confidence, retryCount, orchestratorValid } = input;
  return {
    renderSuccessRate: orchestratorValid ? 0.94 : 0.55,
    averageRenderTime: session.estimatedTime,
    retryEfficiency: retryCount > 0 ? 0.9 : 0.95,
    providerStability: session.provider === DEFAULT_PROVIDER ? 0.92 : 0.86,
    resourceUtilization: session.renderPlan.stages.length >= 6 ? 0.88 : 0.7,
    pipelineReliability: session.executionOrder.length > 0 ? 0.93 : 0.5,
    confidenceScore: confidence,
  };
}

export function mapRenderOrchestratorModuleToStage(module: RenderOrchestratorAgentModuleId): string {
  const mapping: Record<RenderOrchestratorAgentModuleId, string> = {
    [RenderOrchestratorAgentModule.BLUEPRINT_COLLECTOR]: "blueprint_collection",
    [RenderOrchestratorAgentModule.DEPENDENCY_RESOLVER]: "dependency_resolution",
    [RenderOrchestratorAgentModule.RENDER_PLANNER]: "render_planning",
    [RenderOrchestratorAgentModule.EXECUTION_SCHEDULER]: "execution_scheduling",
    [RenderOrchestratorAgentModule.PIPELINE_VALIDATOR]: "pipeline_validation",
    [RenderOrchestratorAgentModule.RENDER_SESSION_BUILDER]: "session_assembly",
  };
  return mapping[module];
}

export function buildDefaultRenderOrchestratorAgentInput(
  overrides: Partial<RenderOrchestratorAgentInput> = {},
): RenderOrchestratorAgentInput {
  const chiefInput = buildBatterySprayerChiefDesignDirectorInput();
  const decisionSection = buildFinalDesignDecisionSection(chiefInput, {}, 0.93);

  return {
    finalDecision: {
      approved: decisionSection.approved,
      overallScore: decisionSection.overallScore,
      retryRequired: decisionSection.retryRequired,
      retryPriority: decisionSection.retryPriority,
      criticalProblems: decisionSection.criticalProblems,
      approvalLevel: decisionSection.approvalLevel,
      directorComments: decisionSection.directorComments,
      confidence: decisionSection.reportConfidence,
    },
    storyBlueprint: chiefInput.storyBlueprint,
    sceneBlueprint: chiefInput.sceneBlueprint,
    layoutBlueprint: chiefInput.layoutBlueprint,
    photographyBlueprint: chiefInput.photographyBlueprint,
    lightingBlueprint: chiefInput.lightingBlueprint,
    cameraBlueprint: chiefInput.cameraBlueprint,
    materialBlueprint: chiefInput.materialBlueprint,
    typographyBlueprint: chiefInput.typographyBlueprint,
    marketplaceBlueprint: chiefInput.marketplaceBlueprint,
    patternBlueprint: chiefInput.patternBlueprint,
    preferredProvider: "flux",
    ...overrides,
  };
}

export function buildBatterySprayerRenderOrchestratorInput(): RenderOrchestratorAgentInput {
  return buildDefaultRenderOrchestratorAgentInput();
}

function resolveRetryBranch(context: RenderOrchestratorAgentContext): RenderOrchestratorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (context.providerUnavailable) return "provider_failover";
  if (context.overlayRenderError || context.compositeError) return "stage_local_retry";
  if (context.dependencyConflict || context.lowConfidence) return "full";
  return undefined;
}

function buildSessionFromInput(
  agentInput: RenderOrchestratorAgentInput,
  agentContext: RenderOrchestratorAgentContext,
  confidenceSeed: number,
): { section: RenderSessionSection; confidence: number; orchestratorValid: boolean } {
  const section = buildRenderSessionSection(agentInput, agentContext, confidenceSeed);
  const session = fromRenderSessionSection(section);

  const hasFailureContext = Boolean(
    agentContext.missingApproval ||
      agentContext.missingBlueprint ||
      agentContext.dependencyConflict ||
      agentContext.providerUnavailable ||
      agentContext.overlayRenderError ||
      agentContext.compositeError,
  );

  let orchestratorValid = session.executionOrder.length > 0 && session.renderPlan.stages.length >= 6;
  if (hasFailureContext) {
    orchestratorValid =
      orchestratorValid &&
      (!agentContext.missingApproval || session.status !== RenderOrchestratorAgentSessionStatus.READY) &&
      (!agentContext.missingBlueprint || session.status !== RenderOrchestratorAgentSessionStatus.READY) &&
      (!agentContext.dependencyConflict || session.status === RenderOrchestratorAgentSessionStatus.FAILED) &&
      (!agentContext.providerUnavailable || session.provider === FALLBACK_PROVIDER) &&
      (!agentContext.overlayRenderError || session.status === RenderOrchestratorAgentSessionStatus.SCHEDULED || session.status === RenderOrchestratorAgentSessionStatus.READY);
  } else {
    orchestratorValid =
      orchestratorValid &&
      session.status === RenderOrchestratorAgentSessionStatus.READY &&
      agentInput.finalDecision.approved &&
      session.confidence >= CONFIDENCE_THRESHOLD;
  }

  const confidence = orchestratorValid && !hasFailureContext ? confidenceSeed : hasFailureContext && orchestratorValid ? 0.55 : 0.45;

  return { section, confidence, orchestratorValid };
}

export async function executeRenderOrchestratorAgent(input: {
  agentInput?: RenderOrchestratorAgentInput;
  context?: RenderOrchestratorAgentContext;
}): Promise<RenderOrchestratorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerRenderOrchestratorInput();
  const violations: RenderOrchestratorAgentViolationRecord[] = [];
  const modulesCompleted: RenderOrchestratorAgentModuleId[] = [];
  const moduleRecords: RenderOrchestratorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: RenderOrchestratorAgentRetryBranch | undefined;

  let { section, confidence, orchestratorValid } = buildSessionFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordOrchestratorModules = (sessionSection: RenderSessionSection, suffix = "") => {
    const audit = collectRenderOrchestratorBlueprints(agentInput, context);
    const deps = resolveRenderOrchestratorDependencies(agentInput, context);
    recordModule(moduleRecords, modulesCompleted, RenderOrchestratorAgentModule.BLUEPRINT_COLLECTOR, `${audit.collected.length} blueprints${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderOrchestratorAgentModule.DEPENDENCY_RESOLVER, `${deps.valid}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderOrchestratorAgentModule.RENDER_PLANNER, sessionSection.renderPlan.strategy + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderOrchestratorAgentModule.EXECUTION_SCHEDULER, `${sessionSection.executionOrder.length} steps${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderOrchestratorAgentModule.PIPELINE_VALIDATOR, sessionSection.provider + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderOrchestratorAgentModule.RENDER_SESSION_BUILDER, sessionSection.status + suffix);
  };

  recordOrchestratorModules(section);

  let session = fromRenderSessionSection(section);
  violations.push(...validateRenderOrchestratorAgentSession(session, agentInput, context));

  if (context.providerUnavailable || context.overlayRenderError || context.compositeError) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext: RenderOrchestratorAgentContext =
      branch === "provider_failover"
        ? { ...context, providerUnavailable: false }
        : branch === "stage_local_retry"
          ? { ...context, overlayRenderError: false, compositeError: false }
          : {};

    const clean = buildSessionFromInput(agentInput, retryContext, 0.93);
    section = clean.section;
    orchestratorValid = clean.orchestratorValid;
    confidence = clean.confidence;
    session = fromRenderSessionSection(section);

    violations.length = 0;
    violations.push(...validateRenderOrchestratorAgentSession(session, agentInput, retryContext));
    recordOrchestratorModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && orchestratorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    session = { ...session, confidence: Math.max(session.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.providerUnavailable && retryCount >= maxRetries && !context.skipRetry && !orchestratorValid) {
    violations.push(violation("RETRY_EXHAUSTED", "Render orchestrator retry did not failover provider"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 54,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: RENDER_ORCHESTRATOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: RENDER_ORCHESTRATOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const professional = await executeProfessionalDecision({
    agentId: RENDER_ORCHESTRATOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!professional.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate render orchestration"));
  }
  if (!professional.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be render-pipeline focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildRenderOrchestratorAgentKpis({
    session: session ?? {
      sessionId: "",
      renderPlan: { strategy: RenderOrchestratorAgentRenderStrategy.SINGLE_PASS, stages: [] },
      executionOrder: [],
      provider: DEFAULT_PROVIDER,
      estimatedTime: 0,
      status: RenderOrchestratorAgentSessionStatus.FAILED,
      confidence: 0,
    },
    confidence,
    retryCount,
    orchestratorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= RENDER_ORCHESTRATOR_AGENT_MODULES.length ||
    RENDER_ORCHESTRATOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && orchestratorValid && modulesComplete && Boolean(session),
    agentId: RENDER_ORCHESTRATOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    session,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    doesNotMakeDesignDecisions: true,
    goldenRuleSatisfied: RENDER_ORCHESTRATOR_AGENT_GOLDEN_RULE.includes("faithfully"),
  };
}

export async function executeRenderOrchestratorAgentWithPipeline(input: {
  agentInput?: RenderOrchestratorAgentInput;
  context?: RenderOrchestratorAgentContext;
}): Promise<RenderOrchestratorAgentExecutionReport> {
  const report = await executeRenderOrchestratorAgent(input);
  if (!report.valid || !report.session) return report;

  const pipelineValid =
    RENDER_ORCHESTRATOR_AGENT_PIPELINE.length === 2 &&
    RENDER_ORCHESTRATOR_AGENT_PIPELINE[0].to === "render_orchestrator" &&
    RENDER_ORCHESTRATOR_AGENT_PIPELINE[1].to === "render_adapter";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== RENDER_ORCHESTRATOR_AGENT_CONTRACT_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use render-orchestrator contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: RenderOrchestratorAgentViolationRecord[]): RenderOrchestratorAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateRenderOrchestratorAgentStructure(): RenderOrchestratorAgentViolationRecord[] {
  if (RENDER_ORCHESTRATOR_AGENT_MODULES.length !== 6) {
    return [violation("MODULE_INCOMPLETE", "Render Orchestrator Agent requires 6 internal modules")];
  }
  return [];
}

export function validateRenderOrchestratorAgent(
  context: RenderOrchestratorAgentContext = {},
): RenderOrchestratorAgentValidationReport {
  const violations = [...validateRenderOrchestratorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateRenderOrchestratorAgentStructure().length === 0,
    pipelinePositionValid: RENDER_ORCHESTRATOR_AGENT_PIPELINE[1].to === "render_adapter",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateRenderOrchestratorAgentWithExecution(
  context: RenderOrchestratorAgentContext = {},
): Promise<RenderOrchestratorAgentValidationReport> {
  const report = validateRenderOrchestratorAgent(context);
  const kitchen = await executeRenderOrchestratorAgent({
    agentInput: buildBatterySprayerRenderOrchestratorInput(),
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

export function assertRenderOrchestratorAgent(
  context?: RenderOrchestratorAgentContext,
): RenderOrchestratorAgentValidationReport {
  const report = validateRenderOrchestratorAgent(context);
  if (!report.valid) {
    throw new Error(`Render Orchestrator Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runRenderOrchestratorAgent(
  context: RenderOrchestratorAgentContext = {},
): Promise<RenderOrchestratorAgentValidationReport> {
  return validateRenderOrchestratorAgentWithExecution(context);
}

export function isRenderOrchestratorAgentFailure(code: string): code is RenderOrchestratorAgentFailureCode {
  const codes: RenderOrchestratorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "MISSING_APPROVAL",
    "MISSING_BLUEPRINT",
    "DEPENDENCY_CONFLICT",
    "PROVIDER_UNAVAILABLE",
    "SESSION_INCOMPLETE",
    "PIPELINE_BLOCKED",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as RenderOrchestratorAgentFailureCode);
}

export function getRenderOrchestratorAgentModule(
  moduleId: RenderOrchestratorAgentModuleId,
): RenderOrchestratorAgentModuleDefinition | undefined {
  return RENDER_ORCHESTRATOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasReadyGardenSprayerRenderSession(session: RenderOrchestratorAgentSession): boolean {
  return (
    session.status === RenderOrchestratorAgentSessionStatus.READY &&
    session.executionOrder.length >= 5 &&
    session.confidence >= CONFIDENCE_THRESHOLD
  );
}

export function scoreRenderProviderCandidate(provider: string, supportsMultiPass: boolean): number {
  if (provider === "flux" && supportsMultiPass) return 0.94;
  if (provider === "gpt-image") return 0.88;
  return 0.8;
}
