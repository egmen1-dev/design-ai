/**
 * Chapter 6.18 — Pipeline Completion & Delivery Stage engine.
 * Finalizes project lifecycle, stores artifacts, and delivers results — never makes design decisions.
 */
import { DirectorApprovalStatus } from "./chief-design-director-review-stage-types";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { runLearningFeedbackStageFromPipeline } from "./learning-feedback-stage-engine";
import { resolvePatternIdsFromBlueprint } from "./learning-feedback-stage-engine";
import { runRenderAdapterStageFromPipeline } from "./render-adapter-stage-engine";
import { runRenderingStageSyncFromPipeline } from "./rendering-stage-engine";
import { runConsensusValidationStageFromPipeline } from "./consensus-validation-stage-engine";
import { PipelineContextLifecycle } from "./pipeline-context-engine";
import type { RenderBlueprint } from "./types";
import type { PlannedLearningPackage } from "./learning-feedback-stage-types";
import {
  PipelineCompletionStage,
  ProjectCompletionStatus,
  PipelineFinalizationState,
  type PipelineCompletionContext,
  type PipelineCompletionInput,
  type PipelineCompletionReport,
  type PipelineCompletionSection,
  type PipelineCompletionStageFailureCode,
  type PipelineCompletionStageId,
  type PipelineCompletionStageViolation,
  type PipelineCompletionSystemReport,
  type PlannedAnalyticsUpdate,
  type PlannedArtifactStorage,
  type PlannedDeliveryArtifact,
  type PlannedDeliveryPackage,
  type PlannedFinalImage,
  type PlannedFinalProject,
  type PlannedMetricsRegistration,
  type PlannedProjectMetadata,
  type PlannedReproducibilityRecord,
  type ProjectCompletionStatusId,
} from "./pipeline-completion-stage-types";

export {
  PipelineCompletionStage,
  ProjectCompletionStatus,
  PipelineFinalizationState,
  type PipelineCompletionStageId,
  type PlannedFinalImage,
  type PlannedProjectMetadata,
  type PlannedFinalProject,
  type PlannedArtifactStorage,
  type PlannedDeliveryArtifact,
  type PlannedDeliveryPackage,
  type PlannedMetricsRegistration,
  type PlannedAnalyticsUpdate,
  type PlannedReproducibilityRecord,
  type PipelineCompletionInput,
  type PipelineCompletionSection,
  type PipelineCompletionStageViolation,
  type PipelineCompletionReport,
  type PipelineCompletionContext,
  type PipelineCompletionSystemReport,
  type PipelineCompletionStageFailureCode,
} from "./pipeline-completion-stage-types";

export const PIPELINE_COMPLETION_VERSION = "6.18.0";

export const PIPELINE_COMPLETION_GOLDEN_RULE =
  "The final image is only the tip of the iceberg. Pipeline Completion preserves the full intellectual " +
  "history behind every generation — making each project reproducible, analyzable, teachable, and ready " +
  "to become the foundation for even higher-quality projects in the future.";

export const PIPELINE_COMPLETION_PIPELINE: readonly PipelineCompletionStageId[] = [
  PipelineCompletionStage.INPUT_ASSEMBLY,
  PipelineCompletionStage.FINAL_APPROVAL_CHECK,
  PipelineCompletionStage.PROJECT_REGISTRATION,
  PipelineCompletionStage.ARTIFACT_STORAGE,
  PipelineCompletionStage.BLUEPRINT_ARCHIVE,
  PipelineCompletionStage.METRICS_REGISTRATION,
  PipelineCompletionStage.ANALYTICS_UPDATE,
  PipelineCompletionStage.DELIVERY_PACKAGE_BUILD,
  PipelineCompletionStage.REPRODUCIBILITY_RECORD,
  PipelineCompletionStage.USER_DELIVERY,
  PipelineCompletionStage.PIPELINE_FINALIZATION,
  PipelineCompletionStage.PROJECT_STATUS,
  PipelineCompletionStage.EXPLAINABILITY,
  PipelineCompletionStage.VALIDATION,
  PipelineCompletionStage.STAGE_COMPLETE,
] as const;

export const PIPELINE_COMPLETION_POSITION = [
  "learning-feedback",
  "pipeline-completion",
  "user-delivery",
] as const;

const projectRegistry = new Map<string, PlannedFinalProject>();
const artifactRegistry = new Map<string, PlannedArtifactStorage>();

function violation(
  code: PipelineCompletionStageFailureCode,
  message: string,
  stage?: PipelineCompletionStageId,
): PipelineCompletionStageViolation {
  return { code, message, stage };
}

function blueprintChecksum(blueprint: Readonly<RenderBlueprint>): string {
  const key = [
    blueprint.meta.id,
    blueprint.meta.revision,
    blueprint.composition.templateId,
    blueprint.story.storyType,
  ].join(":");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `bp-${hash.toString(16)}`;
}

export function resetPipelineCompletionStores(): void {
  projectRegistry.clear();
  artifactRegistry.clear();
}

export function getRegisteredProject(projectId: string): PlannedFinalProject | undefined {
  return projectRegistry.get(projectId);
}

export function getStoredArtifacts(projectId: string): PlannedArtifactStorage | undefined {
  return artifactRegistry.get(projectId);
}

export function determineProjectStatus(
  learningPackage: PlannedLearningPackage,
  context: PipelineCompletionContext = {},
): ProjectCompletionStatusId {
  if (context.injectArchived) return ProjectCompletionStatus.ARCHIVED;
  if (context.injectLearningOnly) return ProjectCompletionStatus.LEARNING_ONLY;

  const director = learningPackage.director;
  const approved =
    director.approvalStatus === DirectorApprovalStatus.APPROVED ||
    director.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES;

  if (!approved && director.retryRequired) {
    return ProjectCompletionStatus.LEARNING_ONLY;
  }

  if (
    director.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES ||
    director.recommendations.length > 0
  ) {
    return ProjectCompletionStatus.COMPLETED_WITH_NOTES;
  }

  return ProjectCompletionStatus.COMPLETED;
}

export function buildPlannedFinalImage(
  imageRef: string,
  blueprint: Readonly<RenderBlueprint>,
  context: PipelineCompletionContext = {},
): PlannedFinalImage | null {
  if (context.missingImage || !imageRef) return null;

  return {
    ref: imageRef,
    format: context.injectCorruptedExport ? "corrupted" : "png",
    width: 1024,
    height: 1024,
  };
}

export function buildPlannedProjectMetadata(
  learningPackage: PlannedLearningPackage,
  generationTimeMs: number,
): PlannedProjectMetadata {
  return {
    projectId: learningPackage.projectId,
    createdAt: learningPackage.metadata.pipelineVersion ? Date.now() - generationTimeMs : Date.now(),
    completedAt: Date.now(),
    pipelineVersion: PIPELINE_COMPLETION_VERSION,
    knowledgeEngineVersion: learningPackage.metadata.knowledgeEngineVersion,
    patternsUsed: resolvePatternIdsFromBlueprint(learningPackage.blueprint),
    providersUsed: [String(learningPackage.blueprint.meta.generator ?? "flux")],
    finalScores: learningPackage.finalScores,
    marketplace: learningPackage.marketplace,
    generationTimeMs,
    retryCount: learningPackage.retryHistory.attempts,
  };
}

export function buildPlannedFinalProject(
  learningPackage: PlannedLearningPackage,
  image: PlannedFinalImage,
  generationTimeMs: number,
): PlannedFinalProject {
  return {
    projectId: learningPackage.projectId,
    image,
    blueprint: learningPackage.blueprint,
    vision: learningPackage.vision,
    commercial: learningPackage.commercial,
    director: learningPackage.director,
    learning: learningPackage,
    metadata: buildPlannedProjectMetadata(learningPackage, generationTimeMs),
  };
}

export function buildArtifactStorage(
  input: PipelineCompletionInput,
): PlannedArtifactStorage {
  return {
    blueprint: input.learningPackage.blueprint,
    renderPrompt: input.renderPrompt,
    negativePrompt: input.negativePrompt,
    providerParameters: input.providerParameters,
    pipelineSnapshots: input.pipelineSnapshots ?? [`snapshot-${input.learningPackage.projectId}`],
    consensusReportId: input.consensusReportId,
    retryHistory: input.learningPackage.retryHistory,
    finalScores: input.learningPackage.finalScores,
  };
}

export function buildDeliveryPackage(
  finalProject: PlannedFinalProject,
  artifactStorage: PlannedArtifactStorage,
): PlannedDeliveryPackage {
  const artifacts: PlannedDeliveryArtifact[] = [
    { type: "image", ref: finalProject.image.ref, label: "PNG — ready marketplace card" },
    { type: "blueprint", ref: `blueprint://${finalProject.projectId}`, label: "Blueprint — regeneration source" },
    {
      type: "commercial_report",
      ref: `report://commercial/${finalProject.projectId}`,
      label: "Commercial Report — quality analysis",
    },
    {
      type: "version_history",
      ref: `history://${finalProject.projectId}`,
      label: "Version History — subsequent edits",
    },
  ];

  if (artifactStorage.consensusReportId) {
    artifacts.push({
      type: "consensus_report",
      ref: artifactStorage.consensusReportId,
      label: "Consensus Report — pipeline agreement",
    });
  }

  return {
    imagePng: finalProject.image.ref,
    blueprintRef: `blueprint://${finalProject.projectId}`,
    commercialReportRef: `report://commercial/${finalProject.projectId}`,
    versionHistoryRef: `history://${finalProject.projectId}`,
    artifacts,
  };
}

export function registerProjectMetrics(
  learningPackage: PlannedLearningPackage,
  generationTimeMs: number,
): PlannedMetricsRegistration {
  const approved =
    learningPackage.director.approvalStatus === DirectorApprovalStatus.APPROVED ||
    learningPackage.director.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES;

  return {
    visionScore: learningPackage.finalScores.visionScore,
    commercialScore: learningPackage.finalScores.commercialScore,
    professionalScore: learningPackage.finalScores.professionalScore,
    ctrPrediction: learningPackage.finalScores.ctrPrediction,
    retryCount: learningPackage.retryHistory.attempts,
    generationTimeMs,
    patternsUsed: resolvePatternIdsFromBlueprint(learningPackage.blueprint),
    success: approved,
  };
}

export function updatePlatformAnalytics(
  learningPackage: PlannedLearningPackage,
): PlannedAnalyticsUpdate {
  const scores = learningPackage.finalScores;

  return {
    category: learningPackage.blueprint.product.category,
    marketplace: learningPackage.marketplace,
    patternEffectiveness: scores.commercialScore,
    storyEffectiveness: learningPackage.director.professionalLevel,
    compositionEffectiveness: learningPackage.vision.compositionScore,
    photographyEffectiveness: learningPackage.vision.photographyScore,
    sampleCount: learningPackage.retryHistory.attempts + 1,
  };
}

export function buildReproducibilityRecord(
  input: PipelineCompletionInput,
): PlannedReproducibilityRecord {
  const blueprint = input.learningPackage.blueprint;

  return {
    pipelineVersion: PIPELINE_COMPLETION_VERSION,
    knowledgeEngineVersion: input.learningPackage.metadata.knowledgeEngineVersion,
    renderIntentVersion: input.learningPackage.metadata.pipelineVersion,
    providerProfile: String(blueprint.meta.generator ?? input.providerParameters.provider ?? "flux"),
    seed: Number(input.providerParameters.seed ?? blueprint.meta.seed ?? 42),
    blueprintChecksum: blueprintChecksum(blueprint),
  };
}

export function validateUserDelivery(
  image: PlannedFinalImage | null,
  deliveryPackage: PlannedDeliveryPackage,
  context: PipelineCompletionContext = {},
): PipelineCompletionStageViolation[] {
  const violations: PipelineCompletionStageViolation[] = [];

  if (!image || !image.ref) {
    violations.push(
      violation("MISSING_IMAGE", "Final image must exist before user delivery", PipelineCompletionStage.USER_DELIVERY),
    );
  }

  if (context.injectCorruptedExport || image?.format === "corrupted") {
    violations.push(
      violation("DELIVERY_FAILED", "Export must not be corrupted", PipelineCompletionStage.USER_DELIVERY),
    );
  }

  if (!deliveryPackage.imagePng || !deliveryPackage.blueprintRef) {
    violations.push(
      violation("DELIVERY_FAILED", "Delivery package must include image and blueprint", PipelineCompletionStage.USER_DELIVERY),
    );
  }

  return violations;
}

export function validatePipelineCompletionInput(
  input: PipelineCompletionInput,
  context: PipelineCompletionContext = {},
): PipelineCompletionStageViolation[] {
  const violations: PipelineCompletionStageViolation[] = [];

  if (context.missingLearningPackage || !input.learningPackage) {
    violations.push(
      violation(
        "MISSING_LEARNING_PACKAGE",
        "Learning Package required from Learning & Feedback Stage",
        PipelineCompletionStage.INPUT_ASSEMBLY,
      ),
    );
  }

  return violations;
}

export function runPipelineCompletionStage(
  input: PipelineCompletionInput,
  context: PipelineCompletionContext = {},
): PipelineCompletionReport {
  const started = Date.now();
  const stagesCompleted: PipelineCompletionStageId[] = [];

  const inputViolations = validatePipelineCompletionInput(input, context);
  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  const learningPackage = input.learningPackage;
  const blueprintBefore = JSON.stringify(learningPackage.blueprint.meta);

  stagesCompleted.push(
    PipelineCompletionStage.INPUT_ASSEMBLY,
    PipelineCompletionStage.FINAL_APPROVAL_CHECK,
  );

  const image = buildPlannedFinalImage(learningPackage.imageRef, learningPackage.blueprint, context);
  if (!image) {
    return {
      valid: false,
      violations: [
        violation("MISSING_IMAGE", "Final image required for project completion", PipelineCompletionStage.USER_DELIVERY),
      ],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  const finalProject = buildPlannedFinalProject(learningPackage, image, input.generationTimeMs);
  projectRegistry.set(finalProject.projectId, finalProject);
  stagesCompleted.push(PipelineCompletionStage.PROJECT_REGISTRATION);

  const artifactStorage = buildArtifactStorage(input);
  artifactRegistry.set(finalProject.projectId, artifactStorage);
  stagesCompleted.push(
    PipelineCompletionStage.ARTIFACT_STORAGE,
    PipelineCompletionStage.BLUEPRINT_ARCHIVE,
  );

  const metrics = registerProjectMetrics(learningPackage, input.generationTimeMs);
  stagesCompleted.push(PipelineCompletionStage.METRICS_REGISTRATION);

  const analytics = updatePlatformAnalytics(learningPackage);
  stagesCompleted.push(PipelineCompletionStage.ANALYTICS_UPDATE);

  const deliveryPackage = buildDeliveryPackage(finalProject, artifactStorage);
  stagesCompleted.push(PipelineCompletionStage.DELIVERY_PACKAGE_BUILD);

  const reproducibility = buildReproducibilityRecord(input);
  stagesCompleted.push(PipelineCompletionStage.REPRODUCIBILITY_RECORD);

  const deliveryViolations = validateUserDelivery(image, deliveryPackage, context);
  stagesCompleted.push(PipelineCompletionStage.USER_DELIVERY);

  const projectStatus = determineProjectStatus(learningPackage, context);
  const pipelineState = PipelineFinalizationState.COMPLETED;
  stagesCompleted.push(
    PipelineCompletionStage.PIPELINE_FINALIZATION,
    PipelineCompletionStage.PROJECT_STATUS,
  );

  const violations: PipelineCompletionStageViolation[] = [...deliveryViolations];

  if (!artifactStorage.renderPrompt || !artifactStorage.blueprint.meta.id) {
    violations.push(
      violation("ARTIFACTS_NOT_STORED", "All engineering artifacts must be stored", PipelineCompletionStage.ARTIFACT_STORAGE),
    );
  }

  if (!artifactStorage.blueprint) {
    violations.push(
      violation("BLUEPRINT_LOST", "Blueprint must be archived", PipelineCompletionStage.BLUEPRINT_ARCHIVE),
    );
  }

  if (!analytics.sampleCount) {
    violations.push(
      violation("ANALYTICS_NOT_UPDATED", "Platform analytics must be updated", PipelineCompletionStage.ANALYTICS_UPDATE),
    );
  }

  if (!reproducibility.blueprintChecksum) {
    violations.push(
      violation("REPRODUCIBILITY_LOST", "Reproducibility record must be saved", PipelineCompletionStage.REPRODUCIBILITY_RECORD),
    );
  }

  if (!finalProject.learning.projectId) {
    violations.push(
      violation("LEARNING_PACKAGE_NOT_SAVED", "Learning Package must be preserved in final project", PipelineCompletionStage.ARTIFACT_STORAGE),
    );
  }

  if (!finalProject.metadata.projectId) {
    violations.push(
      violation("INCOMPLETE_REGISTRATION", "Project must be fully registered", PipelineCompletionStage.PROJECT_REGISTRATION),
    );
  }

  const blueprintAfter = JSON.stringify(learningPackage.blueprint.meta);
  if (blueprintBefore !== blueprintAfter) {
    violations.push(
      violation("BLUEPRINT_MUTATED", "Completion stage must not mutate blueprint", PipelineCompletionStage.VALIDATION),
    );
  }

  stagesCompleted.push(PipelineCompletionStage.EXPLAINABILITY, PipelineCompletionStage.VALIDATION);

  const section: PipelineCompletionSection = {
    finalProject,
    artifactStorage,
    deliveryPackage,
    metrics,
    analytics,
    reproducibility,
    projectStatus,
    pipelineState,
    blueprint: learningPackage.blueprint,
    stagesCompleted: [...stagesCompleted],
    confidence: projectStatus === ProjectCompletionStatus.COMPLETED ? 0.98 : 0.85,
  };

  stagesCompleted.push(PipelineCompletionStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithPipelineCompletion(
  ctx: import("./pipeline-context-engine").GenerationPipelineContext,
  section: PipelineCompletionSection,
): {
  context: import("./pipeline-context-engine").GenerationPipelineContext;
  violations: PipelineCompletionStageViolation[];
} {
  return {
    context: {
      ...ctx,
      blueprint: section.blueprint,
      lifecycle: PipelineContextLifecycle.ARCHIVED,
      learning: {
        ...ctx.learning,
        feedbackCollected: true,
        designMemoryUpdated: true,
      },
      validation: {
        ...ctx.validation,
        chiefApproved: section.projectStatus !== ProjectCompletionStatus.LEARNING_ONLY,
        professionalScore: section.metrics.professionalScore,
      },
    },
    violations: [],
  };
}

export function runPipelineCompletionStageFromPipeline(
  context: PipelineCompletionContext = {},
): PipelineCompletionReport {
  const learning = runLearningFeedbackStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  if (!learning.valid || !learning.section) {
    return {
      valid: false,
      violations: [
        violation("MISSING_LEARNING_PACKAGE", "Learning & Feedback must complete before Pipeline Completion"),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const adapter = runRenderAdapterStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });
  const rendering = runRenderingStageSyncFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });
  const consensus = runConsensusValidationStageFromPipeline();

  const plannedRequest = adapter.section?.plannedRequest;
  const generationTimeMs = rendering.section?.plannedResult.generationTime ?? 1200;

  return runPipelineCompletionStage(
    {
      learningPackage: learning.section.learningPackage,
      renderPrompt: plannedRequest?.positivePrompt ?? "compiled-provider-prompt",
      negativePrompt: plannedRequest?.negativePrompt ?? "",
      providerParameters: {
        provider: rendering.section?.plannedResult.provider ?? "flux",
        seed: rendering.section?.renderRequest.seed ?? 42,
        width: rendering.section?.renderRequest.width ?? 1024,
        height: rendering.section?.renderRequest.height ?? 1024,
      },
      generationTimeMs,
      consensusReportId: consensus.section ? `consensus-${learning.section.learningPackage.projectId}` : undefined,
      pipelineSnapshots: [`snapshot-${learning.section.learningPackage.projectId}`],
    },
    context,
  );
}

export function validatePipelineCompletionStage(
  context: PipelineCompletionContext = {},
): PipelineCompletionSystemReport {
  const violations: PipelineCompletionStageViolation[] = [];

  const kitchen = runPipelineCompletionStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.finalProject.projectId) {
      violations.push(violation("MISSING_FINAL_PROJECT", "Kitchen pipeline must build final project package"));
    }
    if (!getRegisteredProject(kitchen.section.finalProject.projectId)) {
      violations.push(violation("INCOMPLETE_REGISTRATION", "Project must be registered in completion store"));
    }
    if (!getStoredArtifacts(kitchen.section.finalProject.projectId)) {
      violations.push(violation("ARTIFACTS_NOT_STORED", "Artifacts must be stored for kitchen pipeline"));
    }
  }

  const corrupted = runPipelineCompletionStageFromPipeline({
    ...context,
    injectCorruptedExport: true,
  });
  if (corrupted.valid) {
    violations.push(violation("DELIVERY_FAILED", "Corrupted export must block delivery"));
  }

  const learningOnly = runPipelineCompletionStageFromPipeline({
    ...context,
    injectLearningOnly: true,
  });
  if (learningOnly.section?.projectStatus !== ProjectCompletionStatus.LEARNING_ONLY) {
    violations.push(violation("INCOMPLETE_REGISTRATION", "Learning-only projects must receive learning_only status"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    finalProjectBuilt: !!kitchen.section?.finalProject,
    artifactsStored: !!kitchen.section?.artifactStorage.renderPrompt,
    analyticsUpdated: !!kitchen.section?.analytics.sampleCount,
    deliveryReady: !!kitchen.section?.deliveryPackage.imagePng,
    reproducibilityRecorded: !!kitchen.section?.reproducibility.blueprintChecksum,
    downstreamReady: kitchen.section?.pipelineState === PipelineFinalizationState.COMPLETED,
  };
}

export function assertPipelineCompletionStage(
  context: PipelineCompletionContext = {},
): PipelineCompletionSystemReport {
  const report = validatePipelineCompletionStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Pipeline Completion Stage failed: ${messages}`);
  }
  return report;
}

export function runPipelineCompletionStageSystem(
  context: PipelineCompletionContext = {},
): PipelineCompletionSystemReport {
  return validatePipelineCompletionStage(context);
}

export function isPipelineCompletionStageFailure(
  code: string,
): code is PipelineCompletionStageFailureCode {
  const codes: PipelineCompletionStageFailureCode[] = [
    "MISSING_LEARNING_PACKAGE",
    "MISSING_IMAGE",
    "MISSING_FINAL_PROJECT",
    "ARTIFACTS_NOT_STORED",
    "BLUEPRINT_LOST",
    "ANALYTICS_NOT_UPDATED",
    "DELIVERY_FAILED",
    "REPRODUCIBILITY_LOST",
    "LEARNING_PACKAGE_NOT_SAVED",
    "INCOMPLETE_REGISTRATION",
    "BLUEPRINT_MUTATED",
  ];
  return codes.includes(code as PipelineCompletionStageFailureCode);
}
