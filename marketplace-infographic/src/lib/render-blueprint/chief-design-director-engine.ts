/**
 * Chapter 4.19 — Chief Design Director engine.
 * Orchestrates cross-agent analysis and final approve/retry decision — never creates design.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintMutation } from "./mutation-types";
import type { RenderBlueprint } from "./types";
import { LightingScheme, LightingStyle } from "./lighting-director-types";
import { SceneType } from "./scene-director-types";
import { StoryType } from "./visual-story-director-types";
import { RetryRecommendation } from "./vision-quality-director-types";
import {
  ChiefProblemSeverity,
  FinalDecision,
  RetryStrategy,
  type ChiefDesignDirectorContext,
  type ChiefExplainabilityReport,
  type ChiefFailureCode,
  type ChiefProblem,
  type ChiefReview,
  type ChiefValidationReport,
  type RetryStrategyId,
} from "./chief-design-director-types";

export {
  RetryStrategy,
  FinalDecision,
  ChiefProblemSeverity,
  type RetryStrategyId,
  type FinalDecisionId,
  type ChiefProblem,
  type ChiefProblemSeverityId,
  type CommercialPhotographerReviewSummary,
  type RetryHistorySummary,
  type GenerationDiagnosticsSummary,
  type ChiefReview,
  type ChiefDesignDirectorContext,
  type ChiefExplainabilityReport,
  type ChiefValidationReport,
  type ChiefFailureCode,
} from "./chief-design-director-types";

export const CHIEF_DESIGN_DIRECTOR_VERSION = "4.19.0";

export const CHIEF_DESIGN_DIRECTOR_GOLDEN_RULE =
  "Chief Design Director does not create design — it ensures all agent decisions work as one " +
  "professional commercial photography system.";

export const CHIEF_DESIGN_DIRECTOR_ID: AgentContractId = "chief-design-director";

export const CHIEF_DESIGN_DIRECTOR_PIPELINE_POSITION = [
  "vision-quality-director",
  "commercial-photographer",
  CHIEF_DESIGN_DIRECTOR_ID,
] as const;

const APPROVE_THRESHOLD = 78;
const LOCAL_RETRY_GAIN = 12;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function defaultAgentConfidences(blueprint: Readonly<RenderBlueprint>): Record<string, number> {
  return {
    "visual-story-director": blueprint.story.storyType ? 0.9 : 0.6,
    "scene-director": blueprint.scene.sceneType ? 0.88 : 0.6,
    "composition-director": blueprint.composition.templateId ? 0.86 : 0.65,
    "commercial-photo-director": blueprint.photography.photographyStyle ? 0.87 : 0.6,
    "lighting-director": blueprint.lighting.lightingScheme ? 0.85 : 0.55,
    "camera-director": blueprint.camera.cameraStyle ? 0.84 : 0.55,
    "material-director": blueprint.materials.materialWorld ? 0.83 : 0.55,
    "vision-quality-director": 0.8,
  };
}

function detectCrossAgentConflicts(blueprint: Readonly<RenderBlueprint>): ChiefProblem[] {
  const problems: ChiefProblem[] = [];
  const story = blueprint.story.storyType;
  const lightingStyle = blueprint.lighting.lightingStyle;
  const sceneType = blueprint.scene.sceneType;

  if (
    (story === StoryType.PREMIUM_LIFESTYLE ||
      story === StoryType.MINIMAL_LUXURY ||
      blueprint.story.primaryEmotion === "luxury") &&
    lightingStyle === LightingStyle.TECHNOLOGY_COOL
  ) {
    problems.push({
      code: "STORY_LIGHTING_CONFLICT",
      severity: ChiefProblemSeverity.CRITICAL,
      section: "lighting",
      message: "Luxury story conflicts with industrial cold lighting",
      sourceAgent: "chief-design-director",
    });
  }

  if (sceneType === SceneType.LUXURY && lightingStyle === LightingStyle.MARKETPLACE_HIGH_KEY) {
    problems.push({
      code: "SCENE_LIGHTING_CONFLICT",
      severity: ChiefProblemSeverity.MAJOR,
      section: "lighting",
      message: "Luxury interior scene paired with flat marketplace high-key lighting",
      sourceAgent: "chief-design-director",
    });
  }

  if (
    story === StoryType.TECHNOLOGY &&
    blueprint.lighting.lightingScheme === LightingScheme.LUXURY_SIDE_LIGHT
  ) {
    problems.push({
      code: "STORY_SCENE_MISMATCH",
      severity: ChiefProblemSeverity.MAJOR,
      section: "photography",
      message: "Technology story with luxury advertising lighting scheme",
      sourceAgent: "chief-design-director",
    });
  }

  return problems;
}

function problemsFromVision(ctx: ChiefDesignDirectorContext): ChiefProblem[] {
  return ctx.visionReport.problems.map((p) => ({
    code: p.code,
    severity:
      p.critical ? ChiefProblemSeverity.CRITICAL : p.severity === "high"
        ? ChiefProblemSeverity.MAJOR
        : ChiefProblemSeverity.MINOR,
    section: p.section,
    message: p.message,
    sourceAgent: "vision-quality-director",
  }));
}

function problemsFromPhoto(ctx: ChiefDesignDirectorContext): ChiefProblem[] {
  if (!ctx.photoReview) return [];
  return ctx.photoReview.problems.map((message, index) => ({
    code: `PHOTO_ISSUE_${index}`,
    severity:
      ctx.photoReview!.score < 60 ? ChiefProblemSeverity.CRITICAL : ChiefProblemSeverity.MAJOR,
    section: "photography",
    message,
    sourceAgent: "commercial-photographer",
  }));
}

function weakestAgent(
  confidences: Record<string, number>,
): { agentId: string; confidence: number } {
  const entries = Object.entries(confidences);
  entries.sort((a, b) => a[1] - b[1]);
  return { agentId: entries[0]?.[0] ?? "unknown", confidence: entries[0]?.[1] ?? 0.5 };
}

function visionToRetryStrategy(
  visionRetry: string,
  problems: ChiefProblem[],
): RetryStrategyId {
  if (visionRetry === RetryRecommendation.REJECT) {
    return RetryStrategy.FULL_PIPELINE_RETRY;
  }
  if (visionRetry === RetryRecommendation.RETRY_LIGHTING) {
    return RetryStrategy.LIGHTING_RETRY;
  }
  if (visionRetry === RetryRecommendation.RETRY_SCENE) {
    return RetryStrategy.SCENE_RETRY;
  }
  if (visionRetry === RetryRecommendation.RETRY_FULL_RENDER) {
    return RetryStrategy.RENDER_RETRY;
  }

  const lightingProblem = problems.find((p) => p.section === "lighting");
  if (lightingProblem) return RetryStrategy.LIGHTING_RETRY;
  const cameraProblem = problems.find((p) => p.section === "camera");
  if (cameraProblem) return RetryStrategy.CAMERA_RETRY;
  const materialProblem = problems.find((p) => p.section === "materials");
  if (materialProblem) return RetryStrategy.MATERIAL_RETRY;
  const sceneProblem = problems.find((p) => p.section === "scene");
  if (sceneProblem) return RetryStrategy.SCENE_RETRY;

  return RetryStrategy.NONE;
}

function recommendedMutationsFor(
  strategy: RetryStrategyId,
  blueprint: Readonly<RenderBlueprint>,
  problems: ChiefProblem[],
): BlueprintMutation[] {
  const revision = blueprint.meta.revision ?? 0;
  const now = Date.now();
  const lightingConflict = problems.some((p) => p.code === "STORY_LIGHTING_CONFLICT");

  switch (strategy) {
    case RetryStrategy.LIGHTING_RETRY:
      return [
        {
          section: "lighting",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: {
            lightingScheme: lightingConflict
              ? LightingScheme.LUXURY_SIDE_LIGHT
              : blueprint.lighting.lightingScheme,
            lightingStyle: lightingConflict
              ? LightingStyle.LUXURY_WARM
              : blueprint.lighting.lightingStyle,
          },
          reason: "Chief: realign lighting with story and vision report",
          timestamp: now,
        },
      ];
    case RetryStrategy.CAMERA_RETRY:
      return [
        {
          section: "camera",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: {
            heroScale: Math.min(0.65, (blueprint.camera.heroScale ?? 0.5) + 0.05),
          },
          reason: "Chief: improve hero legibility for marketplace thumbnail",
          timestamp: now,
        },
      ];
    case RetryStrategy.MATERIAL_RETRY:
      return [
        {
          section: "materials",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: {
            reflectionProfile: "matte",
            textureComplexity: "minimal",
          },
          reason: "Chief: simplify materials for stable compositing",
          timestamp: now,
        },
      ];
    case RetryStrategy.SCENE_RETRY:
      return [
        {
          section: "scene",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: {
            sceneType: SceneType.MINIMAL,
            environment: "studio",
          },
          reason: "Chief: reset scene to match blueprint intent",
          timestamp: now,
        },
      ];
    case RetryStrategy.PHOTOGRAPHY_RETRY:
      return [
        {
          section: "photography",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: {
            focusStrategy: "entire_product_sharp",
          },
          reason: "Chief: sharpen photography intent for marketplace readability",
          timestamp: now,
        },
      ];
    case RetryStrategy.RENDER_RETRY:
    case RetryStrategy.FULL_PIPELINE_RETRY:
      return [
        {
          section: "meta",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: { retry: (blueprint.meta.retry ?? 0) + 1 },
          reason: "Chief: escalate to render or full pipeline retry",
          timestamp: now,
        },
      ];
    default:
      return [
        {
          section: "validation",
          producer: CHIEF_DESIGN_DIRECTOR_ID,
          expectedRevision: revision,
          payload: { chiefApproved: true, professionalScore: blueprint.validation.professionalScore },
          reason: "Chief: approve pipeline outcome",
          timestamp: now,
        },
      ];
  }
}

function overallScore(
  ctx: ChiefDesignDirectorContext,
  confidences: Record<string, number>,
): number {
  const vision = ctx.visionReport.overallScore;
  const photo = ctx.photoReview?.score ?? vision;
  const confidenceAvg =
    Object.values(confidences).reduce((a, b) => a + b, 0) / Object.values(confidences).length;
  return clampScore(vision * 0.45 + photo * 0.35 + confidenceAvg * 100 * 0.2);
}

export function buildChiefReview(
  blueprint: Readonly<RenderBlueprint>,
  ctx: ChiefDesignDirectorContext,
): { review: ChiefReview; explainability: ChiefExplainabilityReport } {
  const confidences = { ...defaultAgentConfidences(blueprint), ...ctx.agentConfidences };
  const crossConflicts = detectCrossAgentConflicts(blueprint);
  const visionProblems = problemsFromVision(ctx);
  const photoProblems = problemsFromPhoto(ctx);
  const priorityProblems = [...crossConflicts, ...visionProblems, ...photoProblems];

  const weakest = weakestAgent(confidences);
  const score = overallScore(ctx, confidences);
  let retryStrategy = visionToRetryStrategy(ctx.visionReport.retryRecommendation, priorityProblems);

  const criticalCount = priorityProblems.filter(
    (p) => p.severity === ChiefProblemSeverity.CRITICAL,
  ).length;
  const maxRetries = ctx.maxRetryAttempts ?? 2;
  const attempts = ctx.retryHistory?.attempts ?? 0;

  let retryRequired =
    ctx.visionReport.retryRecommendation !== RetryRecommendation.ACCEPT || criticalCount > 0;
  let approved =
    ctx.visionReport.retryRecommendation === RetryRecommendation.ACCEPT &&
    score >= (ctx.minAcceptableScore ?? APPROVE_THRESHOLD) &&
    criticalCount === 0;
  let finalDecision: ChiefReview["finalDecision"] = approved
    ? FinalDecision.APPROVE
    : FinalDecision.RETRY;

  if (ctx.visionReport.retryRecommendation === RetryRecommendation.REJECT) {
    finalDecision = FinalDecision.REJECT;
    retryRequired = true;
    approved = false;
    retryStrategy = RetryStrategy.FULL_PIPELINE_RETRY;
  } else if (ctx.visionReport.retryRecommendation !== RetryRecommendation.ACCEPT) {
    approved = false;
    retryRequired = true;
    finalDecision = FinalDecision.RETRY;
    retryStrategy = visionToRetryStrategy(ctx.visionReport.retryRecommendation, priorityProblems);
  }

  const marginalGain = LOCAL_RETRY_GAIN;
  const estimatedScoreAfterRetry = clampScore(score + (retryRequired ? marginalGain : 0));

  if (
    attempts >= maxRetries &&
    score >= (ctx.minAcceptableScore ?? APPROVE_THRESHOLD) - 8
  ) {
    approved = true;
    retryRequired = false;
    finalDecision = FinalDecision.APPROVE;
    retryStrategy = RetryStrategy.NONE;
  }

  if (
    retryStrategy === RetryStrategy.FULL_PIPELINE_RETRY &&
    weakest.agentId === "lighting-director" &&
    criticalCount === 0 &&
    priorityProblems.some((p) => p.section === "lighting")
  ) {
    retryStrategy = RetryStrategy.LIGHTING_RETRY;
    finalDecision = FinalDecision.RETRY;
    approved = false;
    retryRequired = true;
  }

  if (approved && finalDecision === FinalDecision.APPROVE) {
    retryStrategy = RetryStrategy.NONE;
    retryRequired = false;
  }

  const recommendedMutations = recommendedMutationsFor(retryStrategy, blueprint, priorityProblems);
  const chiefConfidence =
    Math.max(
      0.5,
      Math.min(
        0.98,
        0.88 - criticalCount * 0.08 - priorityProblems.length * 0.02,
      ),
    );

  const agentContributions = Object.entries(confidences).map(([agentId, confidence]) => ({
    agentId,
    confidence,
    assessment:
      agentId === weakest.agentId
        ? "Weakest link — likely source of localized retry"
        : confidence >= 0.85
          ? "Strong contribution"
          : "Acceptable with minor risk",
  }));

  const explainability: ChiefExplainabilityReport = {
    agentId: CHIEF_DESIGN_DIRECTOR_ID,
    agentContributions,
    criticalProblems: priorityProblems
      .filter((p) => p.severity === ChiefProblemSeverity.CRITICAL)
      .map((p) => p.code),
    acceptableProblems: priorityProblems
      .filter((p) => p.severity === ChiefProblemSeverity.MINOR)
      .map((p) => p.code),
    crossAgentConflicts: crossConflicts.map((p) => p.code),
    costDecision:
      attempts >= maxRetries
        ? `Retry budget exhausted (${attempts}/${maxRetries}) — cost-aware approve at score ${score}`
        : undefined,
    reasoning: [
      `Overall score ${score} fused from vision (${ctx.visionReport.overallScore}), photo (${ctx.photoReview?.score ?? "n/a"}), and agent confidences`,
      `Weakest agent: ${weakest.agentId} at ${weakest.confidence.toFixed(2)} confidence`,
      crossConflicts.length
        ? `Cross-agent conflicts: ${crossConflicts.map((p) => p.code).join(", ")}`
        : "No cross-agent conflicts detected",
      retryRequired
        ? `Retry strategy ${retryStrategy} — localized fix preferred over full pipeline`
        : "Generation approved — commercial quality meets marketplace threshold",
      `Estimated score after retry: ${estimatedScoreAfterRetry}`,
      criticalCount
        ? `${criticalCount} critical problems require chief attention`
        : "No critical blockers — acceptable minor issues may remain",
    ],
  };

  const review: ChiefReview = {
    approved,
    overallScore: score,
    estimatedScoreAfterRetry,
    retryRequired,
    retryStrategy,
    priorityProblems,
    recommendedMutations,
    finalDecision,
    confidence: Math.max(0.5, Math.min(0.98, chiefConfidence)),
  };

  return { review, explainability };
}

export function validateChiefReview(
  review: ChiefReview,
  ctx: ChiefDesignDirectorContext,
): ChiefValidationReport {
  const violations: string[] = [];

  if (!ctx.visionReport) violations.push("MISSING_VISION_REPORT");
  if (review.retryRequired && review.retryStrategy === RetryStrategy.NONE) {
    violations.push("RETRY_WITHOUT_REASON");
  }

  const hasLightingIssue = review.priorityProblems.some((p) => p.section === "lighting");
  if (
    review.retryStrategy === RetryStrategy.FULL_PIPELINE_RETRY &&
    hasLightingIssue &&
    !review.priorityProblems.some((p) => p.severity === ChiefProblemSeverity.CRITICAL)
  ) {
    violations.push("FULL_RETRY_UNNECESSARY");
  }

  return { valid: violations.length === 0, violations, review };
}

export function isChiefFailure(code: string): code is ChiefFailureCode {
  return [
    "FULL_RETRY_UNNECESSARY",
    "IGNORED_AGENT_REPORTS",
    "MISSING_EXPLANATION",
    "RETRY_WITHOUT_REASON",
    "MISSING_VISION_REPORT",
    "DIRECT_BLUEPRINT_MUTATION",
  ].includes(code);
}

export function runChiefDesignDirector(input: {
  blueprint: Readonly<RenderBlueprint>;
  context: ChiefDesignDirectorContext;
}): {
  review: ChiefReview;
  explainability: ChiefExplainabilityReport;
} {
  if (!input.context.visionReport) {
    throw new Error("Vision report is required for Chief review");
  }

  return buildChiefReview(input.blueprint, input.context);
}
